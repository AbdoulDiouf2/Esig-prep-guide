/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialiser l'application Firebase Admin
admin.initializeApp();

/**
 * Fonction pour supprimer un utilisateur à la fois de l'authentification Firebase et de Firestore
 * Cette fonction ne peut être appelée que par un administrateur authentifié
 */
exports.deleteUser = functions.https.onRequest(async (req, res) => {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    console.error('Method not allowed', {method: req.method});
    res.status(405).send({error: 'Method Not Allowed'});
    return;
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      console.error('Unauthorized request', {headers: req.headers});
      res.status(401).send({error: 'Unauthorized'});
      return;
    }

    // Vérifier le token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Vérifier si l'utilisateur est admin
    const userRecord = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const userData = userRecord.data();
    
    if (!userData || (!userData.isAdmin && !userData.isSuperAdmin)) {
      console.error('Permission denied', {user: decodedToken.uid, isAdmin: userData?.isAdmin});
      res.status(403).send({error: 'Permission denied'});
      return;
    }

    // Récupérer l'uid à supprimer
    const { uid } = req.body;
    if (!uid) {
      console.error('Missing uid parameter');
      res.status(400).send({error: 'Missing uid parameter'});
      return;
    }

    // Vérifier si l'utilisateur n'essaie pas de se supprimer lui-même
    if (uid === decodedToken.uid) {
      console.error('User attempting to delete self', {uid});
      res.status(400).send({error: 'Vous ne pouvez pas supprimer votre propre compte'});
      return;
    }

    // Vérifier si l'utilisateur à supprimer n'est pas un super admin (protection supplémentaire)
    const targetUserRecord = await admin.firestore().collection('users').doc(uid).get();
    const targetUserData = targetUserRecord.data();
    
    if (targetUserData?.isSuperAdmin && !userData.isSuperAdmin) {
      console.error('Attempt to delete super admin by non-super admin', {
        targetUser: uid,
        requestingUser: decodedToken.uid
      });
      res.status(403).send({error: 'Seul un super admin peut supprimer un autre super admin'});
      return;
    }

    // Supprimer l'utilisateur de Firebase Authentication
    await admin.auth().deleteUser(uid);
    console.info('User deleted from authentication', {uid});
    
    res.status(200).send({success: true, message: 'Utilisateur supprimé avec succès'});
  } catch (error) {
    console.error('Error deleting user', {error: error.message, stack: error.stack});
    res.status(500).send({error: error.message || 'Internal server error'});
  }
});
