/**
 * Script de correction : re-télécharge les fichiers Dropbox avec dl=1
 * et réécrit les mêmes clés R2 (overwrite).
 *
 * Usage :
 *   npx ts-node scripts/fix-r2-files.ts
 *
 * Prérequis : migration-report.txt à la racine + Worker déployé avec customKey support
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const R2_WORKER_URL = process.env.VITE_R2_WORKER_URL || '';
const ADMIN_EMAIL    = process.env.MIGRATION_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.MIGRATION_ADMIN_PASSWORD || '';
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || '';
const REPORT_PATH = path.join(__dirname, '..', 'migration-report.txt');

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

function toDirectDownloadUrl(dropboxUrl: string): string {
  // Remplacer dl=0 par dl=1, ou ajouter dl=1
  if (dropboxUrl.includes('dl=0')) return dropboxUrl.replace('dl=0', 'dl=1');
  if (dropboxUrl.includes('?')) return dropboxUrl + '&dl=1';
  return dropboxUrl + '?dl=1';
}

function extractKeyFromR2Url(r2Url: string): string {
  // https://pub-xxx.r2.dev/resources/key... → resources/key...
  const match = r2Url.match(/\.r2\.dev\/(.+)$/);
  return match ? match[1] : '';
}

interface Entry { name: string; dropboxUrl: string; r2Url: string; }

function parseMigrationReport(content: string): Entry[] {
  const entries: Entry[] = [];
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith('✅')) {
      const name = line.replace('✅', '').trim();
      const dropboxLine = lines[i + 1]?.trim() || '';
      const r2Line = lines[i + 2]?.trim() || '';
      const dropboxUrl = dropboxLine.replace(/^Dropbox:\s*/, '');
      const r2Url = r2Line.replace(/^R2:\s*/, '');
      if (dropboxUrl && r2Url) entries.push({ name, dropboxUrl, r2Url });
      i += 3;
    } else {
      i++;
    }
  }
  return entries;
}

async function main() {
  if (!R2_WORKER_URL) throw new Error('VITE_R2_WORKER_URL manquant');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('MIGRATION_ADMIN_EMAIL / PASSWORD manquants');

  const reportContent = fs.readFileSync(REPORT_PATH, 'utf-8');
  const entries = parseMigrationReport(reportContent);
  console.log(`→ ${entries.length} fichiers à corriger`);

  const token = await getFirebaseToken();

  let success = 0;
  let failure = 0;

  for (const entry of entries) {
    const directUrl = toDirectDownloadUrl(entry.dropboxUrl);
    const r2Key = extractKeyFromR2Url(entry.r2Url);

    if (!r2Key) {
      console.error(`❌ Clé R2 introuvable pour ${entry.name}`);
      failure++;
      continue;
    }

    try {
      console.log(`\n⬇️  Téléchargement (dl=1): ${entry.name}`);
      const res = await fetch(directUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      const fileName = r2Key.split('/').pop() || 'file';
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('customKey', r2Key);

      console.log(`⬆️  Overwrite R2 key: ${r2Key}`);
      const uploadRes = await fetch(`${R2_WORKER_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error(`Upload échoué: ${await uploadRes.text()}`);

      console.log(`✅ ${entry.name}`);
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${entry.name}: ${msg}`);
      failure++;
    }
  }

  console.log(`\n✅ Correction terminée. ${success} succès, ${failure} échecs.`);
}

main().catch(err => { console.error('Erreur fatale:', err); process.exit(1); });
