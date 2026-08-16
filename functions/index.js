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
  members: { method: 'GET', path: () => '/members' },
  discordMembers: { method: 'GET', path: () => '/discord/members' },
  discordVoiceChannels: { method: 'GET', path: () => '/discord/voice-channels' },
  sessions: { method: 'GET', path: () => '/sessions' },
  binomes: { method: 'GET', path: () => '/binomes' },
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
        const discordId = alumniSnap.exists ? alumniSnap.data().discordId : undefined;

        if (!discordId) {
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
        } = req.body || {};
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
