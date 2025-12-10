import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

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
// Note: La propriété 'cache' n'est pas disponible dans la version actuelle (Firebase 10.13.0)
// Pour le moment, continuer à utiliser initializeFirestore avec cacheSizeBytes et enableIndexedDbPersistence

// Utiliser initializeFirestore pour configurer le cache
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED // Permet un cache de taille illimitée pour de meilleures performances
});

// Activer la persistance des données (mise en cache offline)
// Note: Cette méthode sera dépréciée mais est encore nécessaire pour les versions actuelles
// Quand une version stable de Firebase supportant FirestoreSettings.cache sera disponible,
// ce code pourra être mis à jour selon la nouvelle documentation
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

// Initialiser Firebase Storage pour les téléchargements de fichiers
const storage = getStorage(app);

// Instance secondaire pour l'import en masse (ne déconnecte pas l'utilisateur principal)
let secondaryApp: FirebaseApp | undefined;
let secondaryAuth: Auth | undefined;
try {
  secondaryApp = initializeApp(firebaseConfig, 'Secondary');
  secondaryAuth = getAuth(secondaryApp);
} catch (error) {
  console.warn('Instance secondaire Firebase déjà initialisée ou erreur:', error);
}

// Initialiser Analytics de manière conditionnelle (uniquement côté client)
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { db, auth, app, analytics, storage, secondaryAuth };
