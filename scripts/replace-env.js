// scripts/replace-env.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const env = process.env;
const swPath = path.join(__dirname, '../public/firebase-messaging-sw.js');

// Lire le contenu du fichier
let content = fs.readFileSync(swPath, 'utf8');

// Récupérer toutes les variables d'environnement VITE_*
const envVars = Object.entries(env)
  .filter(([key]) => key.startsWith('VITE_'))
  .reduce((acc, [key, value]) => ({
    ...acc,
    [key]: value
  }), {});

// Créer le contenu du process.env qui sera injecté
const processEnvContent = `const process = { env: ${JSON.stringify(envVars, null, 2)} };`;

// Remplacer la partie du process.env
content = content.replace(
  /const process = \{ env: \{\s*\};/,
  processEnvContent
);

// Écrire le fichier mis à jour
fs.writeFileSync(swPath, content, 'utf8');
console.log('✅ Variables d\'environnement injectées dans le service worker');
