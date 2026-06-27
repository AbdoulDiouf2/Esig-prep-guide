import { auth } from '../firebase';

const WORKER_URL = import.meta.env.VITE_R2_WORKER_URL as string;

export interface R2Object {
  key: string;
  size: number;
  uploaded: string;
  url: string;
  name: string;
  folder: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilisateur non connecté');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function uploadToR2(
  file: File,
  folder = 'resources'
): Promise<{ url: string; key: string }> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch(`${WORKER_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Erreur upload R2: ${res.status}`);
  }

  return res.json();
}

export async function listR2Files(prefix?: string): Promise<R2Object[]> {
  const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
  const res = await fetch(`${WORKER_URL}/list${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Erreur liste R2: ${res.status}`);
  }

  const data = await res.json();
  return data.objects as R2Object[];
}

export async function deleteR2File(key: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${WORKER_URL}/delete?key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Erreur suppression R2: ${res.status}`);
  }
}

/**
 * Convertit une URL publique R2 en URL de preview via le Worker (/serve).
 * Le Worker sert avec Content-Disposition: inline, permettant l'affichage dans un iframe.
 */
export function getR2PreviewUrl(fileUrl: string): string {
  if (!fileUrl || !fileUrl.includes('.r2.dev/')) return fileUrl;
  const key = fileUrl.split('.r2.dev/')[1];
  if (!key) return fileUrl;
  return `${WORKER_URL}/serve?key=${encodeURIComponent(key)}`;
}

export async function checkR2Health(): Promise<boolean> {
  try {
    const res = await fetch(`${WORKER_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
