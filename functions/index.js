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
exports.deleteUser = onRequest(async (req, res) => {
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
