/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const cors = require('cors')({origin: true}); // Ajout de CORS
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const crypto = require('crypto');

// Initialiser dayjs avec les plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Définir le fuseau horaire
const TIMEZONE = 'Europe/Paris';

// Initialiser l'application Firebase Admin
admin.initializeApp();

// Secrets pour l'intégration SkillUp (jamais commités, config via `firebase functions:secrets:set`)
const SKILLUP_API_URL = defineSecret('SKILLUP_API_URL');
const SKILLUP_API_KEY = defineSecret('SKILLUP_API_KEY');
const DISCORD_CLIENT_ID = defineSecret('DISCORD_CLIENT_ID');
const DISCORD_CLIENT_SECRET = defineSecret('DISCORD_CLIENT_SECRET');
const DISCORD_REDIRECT_URI = defineSecret('DISCORD_REDIRECT_URI');
const DISCORD_OAUTH_STATE_SECRET = defineSecret('DISCORD_OAUTH_STATE_SECRET');
const DISCORD_APP_BASE_URL = defineSecret('DISCORD_APP_BASE_URL');

// Exporter la fonction de mise à jour des statuts de webinaires
exports.checkAndUpdateWebinarStatus = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: TIMEZONE,
    region: 'europe-west1'
  },
  async (event) => {
    const now = dayjs().tz(TIMEZONE);
    const db = admin.firestore();

    try {
      // Récupérer les webinaires qui doivent être mis à jour
      const webinarsRef = db.collection('webinars');
      
      // 1. Mettre à jour les webinaires qui doivent commencer
      const startingWebinars = await webinarsRef
        .where('date', '<=', now.toDate()) // Date de début dépassée
        .where('isLive', '!=', true) // Pas encore en direct
        .where('isCompleted', '!=', true) // Pas encore terminé
        .get();

      const startBatch = db.batch();
      startingWebinars.forEach(doc => {
        startBatch.update(doc.ref, {
          isLive: true,
          isUpcoming: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      // 2. Mettre à jour les webinaires qui doivent se terminer
      const endingWebinars = await webinarsRef
        .where('isLive', '==', true) // En cours
        .where('isCompleted', '!=', true) // Pas encore marqué comme terminé
        .get();

      const endBatch = db.batch();
      endingWebinars.forEach(doc => {
        const webinar = doc.data();
        const endTime = dayjs(webinar.date.toDate())
          .add(webinar.duration || 60, 'minute');
        
        if (now.isAfter(endTime)) {
          endBatch.update(doc.ref, {
            isLive: false,
            isCompleted: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });

      // Exécuter les mises à jour
      await Promise.all([
        startBatch.commit(),
        endBatch.commit()
      ]);

      logger.log(`Mise à jour effectuée: ${startingWebinars.size} webinaires démarrés, ${endingWebinars.size} vérifiés pour fin.`);
      return null;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des statuts des webinaires:', error);
      return null;
    }
  }
);

/**
 * Fonction pour supprimer un utilisateur à la fois de l'authentification Firebase et de Firestore
 * Cette fonction ne peut être appelée que par un administrateur authentifié
 */
exports.deleteUser = onRequest({ invoker: 'public' }, async (req, res) => {
  // Gestion CORS
  return cors(req, res, async () => {
    // Vérifier la méthode HTTP
    if (req.method === 'OPTIONS') {
      // Répondre aux requêtes OPTIONS (prévol)
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      logger.error('Method not allowed', {method: req.method});
      res.status(405).send({error: 'Method Not Allowed'});
      return;
    }

    try {
      // Vérifier l'authentification
      const authHeader = req.headers.authorization || '';
      const token = authHeader.split('Bearer ')[1];
      if (!token) {
        logger.error('Unauthorized request', {headers: req.headers});
        res.status(401).send({error: 'Unauthorized'});
        return;
      }

      // Vérifier le token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Vérifier si l'utilisateur est admin
      const userRecord = await admin.firestore().collection('users').doc(decodedToken.uid).get();
      const userData = userRecord.data();
      
      if (!userData || (!userData.isAdmin && !userData.isSuperAdmin)) {
        logger.error('Permission denied', {user: decodedToken.uid, isAdmin: userData?.isAdmin});
        res.status(403).send({error: 'Permission denied'});
        return;
      }

      // Récupérer l'uid à supprimer
      const { uid } = req.body;
      if (!uid) {
        logger.error('Missing uid parameter');
        res.status(400).send({error: 'Missing uid parameter'});
        return;
      }

      // Vérifier si l'utilisateur n'essaie pas de se supprimer lui-même
      if (uid === decodedToken.uid) {
        logger.error('User attempting to delete self', {uid});
        res.status(400).send({error: 'Vous ne pouvez pas supprimer votre propre compte'});
        return;
      }

      // Vérifier si l'utilisateur à supprimer n'est pas un super admin (protection supplémentaire)
      const targetUserRecord = await admin.firestore().collection('users').doc(uid).get();
      const targetUserData = targetUserRecord.data();
      
      if (targetUserData?.isSuperAdmin && !userData.isSuperAdmin) {
        logger.error('Attempt to delete super admin by non-super admin', {
          targetUser: uid,
          requestingUser: decodedToken.uid
        });
        res.status(403).send({error: 'Seul un super admin peut supprimer un autre super admin'});
        return;
      }

      // Supprimer l'utilisateur de Firebase Authentication
      await admin.auth().deleteUser(uid);
      logger.info('User deleted from authentication', {uid});
      
      // Supprimer l'utilisateur de Firestore
      await admin.firestore().collection('users').doc(uid).delete();
      logger.info('User deleted from Firestore', {uid});
      
      res.status(200).send({success: true, message: 'Utilisateur supprimé avec succès'});
    } catch (error) {
      logger.error('Error deleting user', {error: error.message, stack: error.stack});
      res.status(500).send({error: error.message || 'Internal server error'});
    }
  }); // Fin du wrapper CORS
});

/**
 * Proxy vers l'API SkillUp (bot Discord Alumni CPS, données PostgreSQL/Neon).
 * Le frontend n'appelle jamais l'API SkillUp directement : la clé secrète reste côté serveur.
 * Cette fonction transmet le discordId du profil alumni de l'appelant et relaie la réponse telle
 * quelle — y compris pour les actions d'écriture (l'autorisation admin est vérifiée côté API
 * SkillUp elle-même via le rôle Discord associé à ce discordId, pas ici).
 */
const SKILLUP_ACTIONS = {
  access: { method: 'GET', path: (discordId) => `/members/${discordId}/access` },
  vagues: { method: 'GET', path: (discordId) => `/members/${discordId}/vagues` },
  journal: { method: 'GET', path: (discordId) => `/members/${discordId}/journal` },
  binomeJournal: { method: 'GET', path: (discordId) => `/members/${discordId}/binome-journal` },
  bilan: { method: 'GET', path: (discordId) => `/members/${discordId}/bilan` },
  bilanTexteSemaineSelf: { method: 'GET', path: (discordId) => `/members/${discordId}/bilan-texte-semaine` },
  // Résumé informatif (nb sessions, durée, blocages) d'un AUTRE membre — réservé à
  // l'admin, qui consulte /members/{cible}/bilan via require_self_or_admin (autorisé
  // car l'appelant est admin, même si la cible n'est pas lui). Sert à alimenter le
  // panneau "à copier" du bilan hebdo/vague admin, pas à pré-remplir automatiquement.
  bilanInfoAdmin: { method: 'GET', path: (discordId, p) => `/members/${p.membreDiscordId}/bilan` },
  // Résumé informatif agrégé sur TOUTE la vague (toutes semaines) — distinct de
  // bilanInfoAdmin sans semaine, qui retombe sur la semaine courante seulement.
  bilanVagueInfoAdmin: { method: 'GET', path: (discordId, p) => `/members/${p.membreDiscordId}/bilan-vague-info` },
  bilansSemaineListerAdmin: { method: 'GET', path: () => '/bilans-semaine' },
  bilansVagueListerAdmin: { method: 'GET', path: () => '/bilans-vague' },
  bilanSemaineLire: {
    method: 'GET',
    path: (discordId, p) => `/members/${p.membreDiscordId}/bilan-semaine`,
  },
  bilanSemaineSuggerer: {
    method: 'POST',
    path: (discordId, p) => `/members/${p.membreDiscordId}/bilan-semaine/suggerer`,
  },
  bilanVagueSuggerer: {
    method: 'POST',
    path: (discordId, p) => `/members/${p.membreDiscordId}/bilan-vague/suggerer`,
  },
  aiSettingsLire: { method: 'GET', path: () => '/ai-settings' },
  aiModelsLister: { method: 'GET', path: () => '/ai-settings/models' },
  aiSettingsEcrire: {
    method: 'PUT',
    path: () => '/ai-settings',
    body: (params) => ({ enabled: params.enabled === 'true', provider: params.provider, model: params.model }),
  },
  bilanSemaineEcrire: {
    method: 'PUT',
    path: (discordId, p) => `/members/${p.membreDiscordId}/bilan-semaine`,
    body: (params) => ({ valeur: params.valeur, poster: params.poster !== 'false' }),
  },
  bilanVagueLire: {
    method: 'GET',
    path: (discordId, p) => `/members/${p.membreDiscordId}/bilan-vague`,
  },
  bilanVagueEcrire: {
    method: 'PUT',
    path: (discordId, p) => `/members/${p.membreDiscordId}/bilan-vague`,
    body: (params) => ({ valeur: params.valeur }),
  },
  members: { method: 'GET', path: () => '/members' },
  discordMembers: { method: 'GET', path: () => '/discord/members' },
  discordVoiceChannels: { method: 'GET', path: () => '/discord/voice-channels' },
  sessions: { method: 'GET', path: () => '/sessions' },
  binomes: { method: 'GET', path: () => '/binomes' },
  objectifVagueLire: {
    method: 'GET',
    path: (discordId) => `/members/${discordId}/objectif-vague`,
  },
  objectifVagueDefinir: {
    method: 'PATCH',
    path: (discordId) => `/members/${discordId}/objectif-vague`,
    body: (params) => ({ valeur: params.valeur }),
  },
  sessionCorrigerSelf: {
    method: 'PATCH',
    path: (discordId, params) => `/members/${discordId}/sessions/${params.sessionId}`,
    body: (params) => ({ champ: params.champ, valeur: params.valeur }),
  },
  sessionSupprimerSelf: {
    method: 'DELETE',
    path: (discordId, params) => `/members/${discordId}/sessions/${params.sessionId}`,
  },
  membreLierThread: {
    method: 'PATCH',
    path: (_discordId, params) => `/members/${params.membreDiscordId}/thread-objectif`,
    body: (params) => ({
      lien_ou_id: params.lienOuId,
      ...(params.vague ? { vague: Number(params.vague) } : {}),
    }),
  },
  membreObjectifSync: {
    method: 'POST',
    path: (_discordId, params) => `/members/${params.membreDiscordId}/objectif-vague/sync`,
  },
  vagueLierThreadBilanCollectif: {
    method: 'PATCH',
    path: (_discordId, params) => `/vagues/${params.vagueId}/thread-bilan-collectif`,
    body: (params) => ({ lien_ou_id: params.lienOuId }),
  },
  bilanCollectifSemaineLire: { method: 'GET', path: () => '/bilan-collectif-semaine' },
  bilanCollectifSemaineEcrire: {
    method: 'PUT',
    path: () => '/bilan-collectif-semaine',
    body: (params) => ({ valeur: params.valeur, poster: params.poster !== 'false' }),
  },
  membresObjectifSyncAll: {
    method: 'POST',
    path: () => '/objectifs-vague/sync',
  },
  sessionCorriger: {
    method: 'PATCH',
    path: (_discordId, params) => `/sessions/${params.sessionId}`,
    body: (params) => ({ champ: params.champ, valeur: params.valeur }),
  },
  sessionSupprimer: {
    method: 'DELETE',
    path: (_discordId, params) => `/sessions/${params.sessionId}`,
  },
  binomeDefinir: {
    method: 'POST',
    path: () => '/binomes',
    body: (params) => ({
      semaine: Number(params.semaine),
      membre_a_discord_id: params.membreADiscordId,
      membre_b_discord_id: params.membreBDiscordId,
      ...(params.vague ? { vague: Number(params.vague) } : {}),
    }),
  },
  binomeRetirer: {
    method: 'DELETE',
    path: () => '/binomes',
  },
  sessionCreer: {
    method: 'POST',
    path: () => '/sessions',
    body: (params) => ({
      discord_id: params.membreDiscordId,
      date_session: params.dateSession,
      creneau: params.creneau,
      heure_debut: params.heureDebut,
      heure_fin: params.heureFin,
      objectif: params.objectif,
      bilan: params.bilan,
      canal_id: params.canalId || null,
      canal_nom: params.canalNom || null,
      blocages: params.blocages || null,
      ...(params.vague ? { vague: Number(params.vague) } : {}),
    }),
  },
  membreAjouter: {
    method: 'POST',
    path: () => '/members',
    body: (params) => ({
      discord_id: params.membreDiscordId,
      nom: params.nom,
      profil: params.profil,
      certif_ou_projet: params.certifOuProjet || null,
      ...(params.vague ? { vague: Number(params.vague) } : {}),
    }),
  },
  membreEditer: {
    method: 'PATCH',
    path: (_discordId, params) => `/members/${params.membreDiscordId}`,
    body: (params) => ({
      champ: params.champ,
      valeur: params.valeur,
      ...(params.vague ? { vague: Number(params.vague) } : {}),
    }),
  },
  vaguesAdminLister: { method: 'GET', path: () => '/vagues' },
  vagueCreer: {
    method: 'POST',
    path: () => '/vagues',
    body: (params) => ({ nom: params.nom, date_debut: params.dateDebut, date_fin: params.dateFin }),
  },
  vagueActiver: {
    method: 'PATCH',
    path: (_discordId, params) => `/vagues/${params.vagueId}/activer`,
  },
  vagueCloturer: {
    method: 'PATCH',
    path: () => '/vagues/cloturer',
  },
  salonsLister: { method: 'GET', path: () => '/salons' },
  salonAjouter: {
    method: 'POST',
    path: () => '/salons',
    body: (params) => ({
      canal_id: params.canalId,
      canal_nom: params.canalNom,
      ...(params.vague ? { vague: Number(params.vague) } : {}),
    }),
  },
  salonRetirer: {
    method: 'DELETE',
    path: () => '/salons',
  },
};

exports.skillupProxy = onRequest(
  { invoker: 'public', secrets: [SKILLUP_API_URL, SKILLUP_API_KEY] },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }

      if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
      }

      try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.split('Bearer ')[1];
        if (!token) {
          res.status(401).send({ error: 'Unauthorized' });
          return;
        }

        const decodedToken = await admin.auth().verifyIdToken(token);

        const alumniSnap = await admin.firestore().collection('alumni').doc(decodedToken.uid).get();
        const alumniData = alumniSnap.exists ? alumniSnap.data() : {};
        const discordId = alumniData.discordId;
        const discordVerified = alumniData.discordVerified === true;

        // Migration Option B : un discordId non vérifié (ancienne saisie manuelle) ne
        // compte plus comme "lié" — il faut reconnecter via OAuth pour prouver l'identité.
        if (!discordId || !discordVerified) {
          res.status(200).send({ linked: false });
          return;
        }

        const {
          action,
          semaine,
          vague,
          sessionId,
          champ,
          valeur,
          membreDiscordId,
          membreADiscordId,
          membreBDiscordId,
          nom,
          profil,
          certifOuProjet,
          statut,
          dateDebut,
          dateFin,
          vagueId,
          canalId,
          canalNom,
          actif,
          lienOuId,
          dateSession,
          creneau,
          heureDebut,
          heureFin,
          objectif,
          bilan,
          blocages,
          poster,
          enabled,
          provider,
          model,
        } = req.body || {};

        // Avatars Discord vérifiés (onglet Binômes, admin). Ne passe pas par l'API SkillUp —
        // lit directement Firestore avec les privilèges admin SDK (contourne les règles
        // Firestore, qui ne connaissent pas la notion d'admin SkillUp). Vérifie d'abord
        // is_admin auprès de l'API SkillUp elle-même : ne jamais faire confiance au client
        // pour l'autorisation.
        if (action === 'discordAvatars') {
          const accessCheck = await fetch(`${SKILLUP_API_URL.value()}/members/${discordId}/access`, {
            headers: { 'X-API-Key': SKILLUP_API_KEY.value(), 'X-Discord-Id': discordId },
          });
          if (!accessCheck.ok) {
            res.status(accessCheck.status).send({ error: 'Access check failed' });
            return;
          }
          const accessData = await accessCheck.json();
          // Avatars Discord = infos publiques (déjà visibles à quiconque est sur le
          // serveur) — accessible à tout participant SkillUp, pas seulement aux admins
          // (sert aussi à afficher l'avatar du binôme en vue self-service).
          if (!accessData.is_participant && !accessData.is_admin) {
            res.status(403).send({ error: 'Forbidden' });
            return;
          }
          const verifiedSnap = await admin.firestore().collection('alumni').where('discordVerified', '==', true).get();
          const avatars = {};
          verifiedSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.discordId && data.discordAvatarUrl) {
              avatars[data.discordId] = data.discordAvatarUrl;
            }
          });
          res.status(200).send({ avatars });
          return;
        }

        const actionConfig = SKILLUP_ACTIONS[action];
        if (!actionConfig) {
          res.status(400).send({ error: 'Unknown action' });
          return;
        }

        const query = new URLSearchParams();
        if (semaine) query.set('semaine', semaine);
        if (vague) query.set('vague', vague);
        if (membreDiscordId) query.set('membre_discord_id', membreDiscordId);
        if (statut) query.set('statut', statut);
        if (vagueId) query.set('vague_id', vagueId);
        if (canalId) query.set('canal_id', canalId);
        if (actif) query.set('actif', actif);
        if (provider) query.set('provider', provider);
        const queryString = query.toString();

        const actionParams = {
          sessionId,
          champ,
          valeur,
          semaine,
          vague,
          membreDiscordId,
          membreADiscordId,
          membreBDiscordId,
          nom,
          profil,
          certifOuProjet,
          dateDebut,
          dateFin,
          vagueId,
          canalId,
          canalNom,
          lienOuId,
          dateSession,
          creneau,
          heureDebut,
          heureFin,
          objectif,
          bilan,
          blocages,
          poster,
          enabled,
          provider,
          model,
        };
        const url = `${SKILLUP_API_URL.value()}${actionConfig.path(discordId, actionParams)}${queryString ? `?${queryString}` : ''}`;

        const fetchOptions = {
          method: actionConfig.method,
          headers: {
            'X-API-Key': SKILLUP_API_KEY.value(),
            'X-Discord-Id': discordId,
          },
        };
        if (actionConfig.body) {
          fetchOptions.headers['Content-Type'] = 'application/json';
          fetchOptions.body = JSON.stringify(actionConfig.body(actionParams));
        }

        const skillupResponse = await fetch(url, fetchOptions);

        const body = await skillupResponse.text();
        res.status(skillupResponse.status).set('Content-Type', 'application/json').send(body);
      } catch (error) {
        logger.error('Error in skillupProxy', { error: error.message, stack: error.stack });
        res.status(500).send({ error: error.message || 'Internal server error' });
      }
    });
  }
);

// ===== Discord OAuth (liaison vérifiée du compte Discord, cf. docs/Connexion_Discord_OAuth_CPS_Connect.md) =====
// Scope demandé : `identify` uniquement. Ne sert jamais à décider qui est admin/participant
// SkillUp — cette décision reste exclusivement celle de l'API SkillUp (`GET /members/{id}/access`).

const DISCORD_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes pour compléter le flux

function signDiscordState(payload, secret) {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifyDiscordState(state, secret) {
  const [b64, sig] = String(state || '').split('.');
  if (!b64 || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

/**
 * Authentifiée (Bearer Firebase). Renvoie l'URL d'autorisation Discord à laquelle
 * rediriger le navigateur, avec un `state` signé encodant l'uid pour que le callback
 * (redirect HTTP sans token Firebase) sache pour qui écrire le lien.
 */
exports.discordOauthInitiate = onRequest(
  {
    invoker: 'public',
    secrets: [DISCORD_CLIENT_ID, DISCORD_REDIRECT_URI, DISCORD_OAUTH_STATE_SECRET],
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }
      if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
      }
      try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.split('Bearer ')[1];
        if (!token) {
          res.status(401).send({ error: 'Unauthorized' });
          return;
        }
        const decodedToken = await admin.auth().verifyIdToken(token);

        const state = signDiscordState(
          {
            uid: decodedToken.uid,
            nonce: crypto.randomBytes(16).toString('hex'),
            exp: Date.now() + DISCORD_STATE_TTL_MS,
          },
          DISCORD_OAUTH_STATE_SECRET.value()
        );

        const params = new URLSearchParams({
          client_id: DISCORD_CLIENT_ID.value(),
          redirect_uri: DISCORD_REDIRECT_URI.value(),
          response_type: 'code',
          scope: 'identify',
          state,
          prompt: 'consent',
        });

        res.status(200).send({ url: `https://discord.com/api/oauth2/authorize?${params.toString()}` });
      } catch (error) {
        logger.error('Error in discordOauthInitiate', { error: error.message, stack: error.stack });
        res.status(500).send({ error: error.message || 'Internal server error' });
      }
    });
  }
);

/**
 * Callback public appelé par Discord après autorisation (`code` + `state` en query params).
 * Vérifie `state`, échange `code` contre un token, récupère l'identité Discord vérifiée,
 * écrit alumni/{uid} et redirige vers /profile.
 */
exports.discordOauthCallback = onRequest(
  {
    invoker: 'public',
    secrets: [
      DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET,
      DISCORD_REDIRECT_URI,
      DISCORD_OAUTH_STATE_SECRET,
      DISCORD_APP_BASE_URL,
    ],
  },
  async (req, res) => {
    const baseUrl = DISCORD_APP_BASE_URL.value();
    const redirectWithError = (reason) => {
      // App en HashRouter — les routes valides sont en /#/..., pas /...
      res.redirect(`${baseUrl}/#/profile?discord=error&reason=${encodeURIComponent(reason)}`);
    };

    try {
      const { code, state, error: discordError } = req.query;

      if (discordError) {
        redirectWithError(String(discordError));
        return;
      }
      if (!code || !state) {
        redirectWithError('missing_params');
        return;
      }

      const statePayload = verifyDiscordState(String(state), DISCORD_OAUTH_STATE_SECRET.value());
      if (!statePayload) {
        redirectWithError('invalid_state');
        return;
      }

      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID.value(),
          client_secret: DISCORD_CLIENT_SECRET.value(),
          grant_type: 'authorization_code',
          code: String(code),
          redirect_uri: DISCORD_REDIRECT_URI.value(),
        }),
      });

      if (!tokenResponse.ok) {
        logger.error('discordOauthCallback: token exchange failed', { status: tokenResponse.status });
        redirectWithError('token_exchange_failed');
        return;
      }

      const tokenData = await tokenResponse.json();

      const meResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!meResponse.ok) {
        logger.error('discordOauthCallback: /users/@me failed', { status: meResponse.status });
        redirectWithError('discord_user_fetch_failed');
        return;
      }

      const discordUser = await meResponse.json();
      const discordAvatarUrl = discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : undefined;

      await admin.firestore().collection('alumni').doc(statePayload.uid).set(
        {
          discordId: discordUser.id,
          discordUsername: discordUser.global_name || discordUser.username,
          discordAvatarUrl: discordAvatarUrl || admin.firestore.FieldValue.delete(),
          discordLinkedAt: new Date().toISOString(),
          discordVerified: true,
        },
        { merge: true }
      );

      res.redirect(`${baseUrl}/#/profile?discord=success`);
    } catch (error) {
      logger.error('Error in discordOauthCallback', { error: error.message, stack: error.stack });
      redirectWithError('internal_error');
    }
  }
);
