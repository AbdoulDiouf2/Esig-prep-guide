import { getMessaging, getToken, onMessage, deleteToken, Messaging } from 'firebase/messaging';
import { FirebaseApp, getApp } from 'firebase/app';
import { doc, setDoc, getFirestore, getDoc, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Interface pour les données de notification
export interface NotificationData {
  [key: string]: string | number | boolean | undefined;
  // Champs spécifiques pour les notifications
  url?: string;
  conversationId?: string;
  senderId?: string;
  type?: string;
  // Autres champs personnalisés si nécessaire
}

// Interface pour les données utilisateur dans Firestore
// interface UserData extends DocumentData {
//   fcmTokens?: {
//     [token: string]: boolean;
//   };
// }

// Clé publique de l'application FCM (à remplacer par votre clé)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

class PushNotificationService {
  private messaging: Messaging;
  private db: Firestore;
  private app: FirebaseApp;
  private hasRequestedPermission = false;
  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    // Initialisation de l'application Firebase
    this.app = getApp();
    
    // Configuration de la messagerie
    this.messaging = getMessaging(this.app);
    
    // Initialisation de Firestore
    this.db = getFirestore(this.app);
    
    // Configuration de l'écouteur de messages
    this.setupMessageListener();
    
    // Enregistrer le service worker
    this.registerServiceWorker();
  }
  
  // Enregistrer le service worker
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/firebase-cloud-messaging-push-scope'
        });
        console.log('Service Worker enregistré avec succès:', registration);
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
      }
    }
  }

  // Vérifier et demander la permission des notifications
  public async checkAndRequestNotificationPermission(): Promise<boolean> {
    // Vérifier si les notifications sont supportées
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications.');
      return false;
    }

    // Mettre à jour l'état de la permission
    this.notificationPermission = Notification.permission;

    // Si déjà demandé, ne pas redemander
    if (this.hasRequestedPermission) {
      return this.notificationPermission === 'granted';
    }

    // Si déjà accordé, récupérer le token
    if (this.notificationPermission === 'granted') {
      await this.getCurrentToken();
      return true;
    }

    // Si refusé, ne pas redemander
    if (this.notificationPermission === 'denied') {
      console.warn('Les notifications ont été refusées par l\'utilisateur');
      return false;
    }

    // Sinon, demander la permission
    try {
      this.notificationPermission = await Notification.requestPermission();
      this.hasRequestedPermission = true;
      
      if (this.notificationPermission === 'granted') {
        console.log('Permission accordée pour les notifications');
        await this.getCurrentToken();
        return true;
      }
      
      console.warn('Permission refusée pour les notifications');
      return false;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  }

  // Méthode pour vérifier si les notifications sont activées
  public areNotificationsEnabled(): boolean {
    return this.notificationPermission === 'granted';
  }

  // Ancienne méthode pour rétrocompatibilité
  public async requestNotificationPermission(): Promise<string | null> {
    const isGranted = await this.checkAndRequestNotificationPermission();
    return isGranted ? this.getCurrentToken() : null;
  }

  // Obtenir le token FCM actuel
  public async getCurrentToken(): Promise<string | null> {
    try {
      const currentToken = await getToken(this.messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        console.log('Token FCM:', currentToken);
        await this.saveTokenToFirestore(currentToken);
        return currentToken;
      } else {
        console.warn('Aucun jeton d\'inscription disponible.');
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  // Enregistrer le token dans Firestore
  private async saveTokenToFirestore(token: string): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.warn('Aucun utilisateur connecté pour enregistrer le token');
        return;
      }
  
      const userRef = doc(this.db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      // Créer ou mettre à jour le document utilisateur
      if (userDoc.exists()) {
        // Récupérer les tokens existants ou initialiser un nouvel objet
        const userData = userDoc.data();
        const tokens = userData.fcmTokens || {};
        
        // Mettre à jour les tokens
        await setDoc(userRef, {
          fcmTokens: {
            ...tokens,
            [token]: true
          }
        }, { merge: true });
      } else {
        // Créer un nouveau document utilisateur avec le token
        await setDoc(userRef, {
          fcmTokens: {
            [token]: true
          }
        });
      }
      
      console.log('Token enregistré dans Firestore');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
    }
  }

  // Supprimer le token FCM actuel
  public async deleteToken(): Promise<boolean> {
    try {
      const token = await getToken(this.messaging);
      if (token) {
        await deleteToken(this.messaging);
        await this.removeTokenFromFirestore(token);
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du token:', error);
      return false;
    }
  }

  // Supprimer le token de Firestore
  private async removeTokenFromFirestore(token: string): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return;
  
      const userRef = doc(this.db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.fcmTokens && userData.fcmTokens[token]) {
          // Créer une copie de l'objet fcmTokens
          const updatedTokens = { ...userData.fcmTokens };
          // Supprimer le token spécifique
          delete updatedTokens[token];
          // Mettre à jour le document
          await setDoc(userRef, { fcmTokens: updatedTokens }, { merge: true });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du token de Firestore:', error);
    }
  }

  // Configurer l'écouteur de messages
  private setupMessageListener() {
    onMessage(this.messaging, (payload) => {
      console.log('Message reçu au premier plan:', payload);
      
      // Afficher systématiquement la notification, que l'application soit en premier plan ou non
      if (payload.notification) {
        this.showLocalNotification(
          payload.notification.title || 'Nouveau message',
          payload.notification.body || '',
          payload.data || {}
        );
      }
      
      // Émettre un événement personnalisé pour que les composants réagissent
      const event = new CustomEvent('onMessageReceived', { detail: payload });
      window.dispatchEvent(event);
      
      // Afficher également une notification système
      if (Notification.permission === 'granted') {
        const notificationTitle = payload.notification?.title || 'Nouveau message';
        const notificationOptions = {
          body: payload.notification?.body,
          icon: '/logo.png',
          data: payload.data || {}
        };
        new Notification(notificationTitle, notificationOptions);
      }
    });
  }

  // Afficher une notification locale
  private showLocalNotification(title: string, body: string, data: NotificationData = {}) {
    try {
      // Vérifier si les notifications sont supportées
      if (!('Notification' in window)) {
        console.warn('Ce navigateur ne supporte pas les notifications.');
        return;
      }

      // Vérifier si les notifications sont autorisées
      if (Notification.permission === 'granted') {
        // Options de la notification
        const options: NotificationOptions = {
          body: body,
          icon: '/logo.png',
          data: data,
          // Options supplémentaires pour les notifications persistantes
          requireInteraction: false,
          silent: false
        };

        // Créer et afficher la notification
        const notification = new Notification(title, options);

        // Gérer le clic sur la notification
        notification.onclick = (event) => {
          event.preventDefault();
          console.log('Notification cliquée', { title, data });
          
          // Fermer la notification
          notification.close();
          
          // Si une URL est fournie dans les données, rediriger
          if (data.url) {
            window.focus();
            window.open(data.url, '_blank');
          }
        };

        // Fermer automatiquement après 10 secondes
        setTimeout(() => {
          notification.close();
        }, 10000);

        return notification;
      } else if (Notification.permission !== 'denied') {
        // Demander la permission si elle n'a pas encore été demandée
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.showLocalNotification(title, body, data);
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la notification:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
