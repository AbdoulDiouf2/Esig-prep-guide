// public/firebase-messaging-sw.js
console.log('Service Worker: Démarrage');

// Donne le contrôle immédiatement
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installé');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activé');
  event.waitUntil(clients.claim());
});

// Importer Firebase
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuration Firebase - À remplacer par vos propres valeurs
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialiser Firebase
console.log('Service Worker: Initialisation de Firebase');
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Message reçu en arrière-plan', payload);
  
  const notificationTitle = payload.notification?.title || 'Nouveau message';
  const notificationOptions = {
    title: payload.notification?.title || 'Nouveau message',
    body: payload.notification?.body || 'Vous avez reçu un nouveau message',
    icon: '/logo.png',
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

console.log('Service Worker: Configuration terminée');

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification cliquée', event);
  
  // Fermer la notification
  event.notification.close();
  
  // Récupérer les données de la notification
  const notificationData = event.notification.data || {};
  const conversationId = notificationData.conversationId || '';
  
  // Construire l'URL de redirection
  let urlToOpen = '/';
  if (conversationId) {
    urlToOpen = `/admin/chat?conversationId=${conversationId}`;
  }
  const fullUrl = new URL(urlToOpen, self.location.origin).href;
  
  // Essayer d'ouvrir dans un onglet existant ou en créer un nouveau
  event.waitUntil(
    clients.matchAll({type: 'window'}).then((windowClients) => {
      // Vérifier si une fenêtre est déjà ouverte sur cette URL
      for (const client of windowClients) {
        if (client.url.includes('/admin/chat') && 'focus' in client) {
          client.focus();
          // Mettre à jour l'URL si nécessaire
          if (client.url !== fullUrl) {
            return client.navigate(fullUrl);
          }
          return;
        }
      }
      
      // Si aucune fenêtre n'est trouvée, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});