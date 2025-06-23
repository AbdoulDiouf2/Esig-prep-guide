import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Créer un objet de configuration Firebase
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
  };

  // Écrire la configuration dans un fichier pour le service worker
  const configForServiceWorker = `// Configuration générée automatiquement
self.firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};`;

  // Créer le fichier de configuration pour le service worker
  writeFileSync(
    resolve(__dirname, 'public/firebase-messaging-sw-config.js'),
    configForServiceWorker
  );

  return {
    base: '/',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      outDir: 'build',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      },
    },
    server: {
      open: true,
      headers: {
        'Service-Worker-Allowed': '/',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      },
    },
    define: {
      'process.env': {},
      'import.meta.env': JSON.stringify(env)
    }
  };
});
