/**
 * Script de migration one-shot : Dropbox → Cloudflare R2
 *
 * Usage :
 *   npx ts-node scripts/migrate-dropbox-to-r2.ts
 *
 * Prérequis :
 *   - Variables d'environnement dans .env :
 *       VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_API_KEY, etc.
 *       VITE_R2_WORKER_URL
 *   - Un compte Firebase admin (ou utiliser serviceAccount)
 *   - Le Worker Cloudflare déployé + bucket R2 avec public access
 *
 * Ce script :
 *   1. Lit tous les docs Firestore `resources` dont fileUrl contient "dropbox"
 *   2. Télécharge chaque fichier depuis son URL Dropbox
 *   3. Uploade vers R2 via le Worker (en tant qu'admin — utilise un token Firebase)
 *   4. Met à jour fileUrl dans Firestore avec l'URL R2
 *   5. Log succès/échecs dans migration-report.txt
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Config — à adapter selon votre environnement
// ---------------------------------------------------------------------------

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'esig-prep-guide';
const R2_WORKER_URL = process.env.VITE_R2_WORKER_URL || '';

// Token Firebase admin — obtenu via Firebase REST API (email/password signin)
// Remplacer par un appel réel ou utiliser firebase-admin SDK
const ADMIN_EMAIL = process.env.MIGRATION_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.MIGRATION_ADMIN_PASSWORD || '';
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || '';

const REPORT_PATH = path.join(__dirname, '..', 'migration-report.txt');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getFirebaseToken(): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }),
    }
  );
  if (!res.ok) throw new Error(`Auth Firebase échouée: ${await res.text()}`);
  const data = await res.json() as { idToken: string };
  return data.idToken;
}

async function fetchFirestoreResources(token: string): Promise<Array<{ id: string; fileUrl: string; name: string }>> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/resources`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Firestore list échoué: ${await res.text()}`);
  const data = await res.json() as { documents?: Array<{ name: string; fields: Record<string, { stringValue?: string }> }> };

  return (data.documents || [])
    .filter(doc => {
      const fileUrl = doc.fields?.fileUrl?.stringValue || '';
      return fileUrl.includes('dropbox.com') || fileUrl.includes('dropboxusercontent.com');
    })
    .map(doc => ({
      id: doc.name.split('/').pop() || '',
      fileUrl: doc.fields.fileUrl.stringValue || '',
      name: doc.fields.title?.stringValue || doc.name.split('/').pop() || 'unknown',
    }));
}

async function downloadFile(url: string): Promise<{ blob: Blob; fileName: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement échoué (${res.status}): ${url}`);
  const blob = await res.blob();
  const fileName = url.split('/').pop()?.split('?')[0] || 'fichier';
  return { blob, fileName };
}

async function uploadToR2Worker(blob: Blob, fileName: string, token: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('folder', 'resources');

  const res = await fetch(`${R2_WORKER_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload R2 échoué (${res.status}): ${await res.text()}`);
  const data = await res.json() as { url: string };
  return data.url;
}

async function updateFirestoreUrl(docId: string, newUrl: string, token: string): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/resources/${docId}?updateMask.fieldPaths=fileUrl&updateMask.fieldPaths=updatedDate`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        fileUrl: { stringValue: newUrl },
        updatedDate: { stringValue: new Date().toISOString().split('T')[0] },
      },
    }),
  });
  if (!res.ok) throw new Error(`Update Firestore échoué (${res.status}): ${await res.text()}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!R2_WORKER_URL) throw new Error('VITE_R2_WORKER_URL manquant dans .env');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('MIGRATION_ADMIN_EMAIL / MIGRATION_ADMIN_PASSWORD manquants');
  if (!FIREBASE_API_KEY) throw new Error('VITE_FIREBASE_API_KEY manquant dans .env');

  const report: string[] = [`Migration Dropbox → R2 — ${new Date().toISOString()}\n`];

  console.log('🔐 Authentification Firebase...');
  const token = await getFirebaseToken();

  console.log('📋 Récupération des ressources Dropbox dans Firestore...');
  const resources = await fetchFirestoreResources(token);
  console.log(`→ ${resources.length} ressources à migrer`);
  report.push(`Ressources à migrer: ${resources.length}\n`);

  let success = 0;
  let failure = 0;

  for (const resource of resources) {
    try {
      console.log(`\n⬇️  Téléchargement: ${resource.name}`);
      const { blob, fileName } = await downloadFile(resource.fileUrl);

      console.log(`⬆️  Upload R2: ${fileName}`);
      const r2Url = await uploadToR2Worker(blob, fileName, token);

      console.log(`✏️  Mise à jour Firestore: ${resource.id}`);
      await updateFirestoreUrl(resource.id, r2Url, token);

      report.push(`✅ ${resource.name}\n   Dropbox: ${resource.fileUrl}\n   R2:      ${r2Url}\n`);
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Erreur pour ${resource.name}: ${msg}`);
      report.push(`❌ ${resource.name}\n   URL: ${resource.fileUrl}\n   Erreur: ${msg}\n`);
      failure++;
    }
  }

  report.push(`\nRésultat: ${success} succès, ${failure} échecs`);
  fs.writeFileSync(REPORT_PATH, report.join('\n'));

  console.log(`\n✅ Migration terminée. ${success} succès, ${failure} échecs.`);
  console.log(`📄 Rapport: ${REPORT_PATH}`);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
