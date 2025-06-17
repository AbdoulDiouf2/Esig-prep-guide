import { initializeApp } from 'firebase/app';
import { initializeFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Configuration Firebase à partir des variables d'environnement
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services
// Utiliser initializeFirestore au lieu de getFirestore pour configurer le cache
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED // Permet un cache de taille illimitée pour de meilleures performances
});

// Activer la persistance des données (mise en cache offline)
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Plusieurs onglets ouverts, la persistance est activée uniquement dans le premier
      console.warn("La mise en cache offline n'est disponible que dans un seul onglet à la fois");
    } else if (err.code === 'unimplemented') {
      // Le navigateur ne supporte pas IndexedDB
      console.warn("Votre navigateur ne supporte pas la mise en cache offline");
    }
  });

const auth = getAuth(app);

// Initialiser Analytics de manière conditionnelle (uniquement côté client)
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { db, auth, app, analytics };
