import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';

export interface LogActivityParams {
  type: string; // 'Ajout', 'Suppression', 'Modification', etc.
  target: string; // 'Ressource', 'Section', 'FAQ', etc.
  targetId?: string;
  user?: string;
  details?: Record<string, unknown>;
}

export async function logAdminActivity({ type, target, targetId, user, details }: LogActivityParams) {
  await addDoc(collection(db, 'adminActivityLog'), {
    type,
    target,
    targetId: targetId || null,
    user: user || null,
    date: new Date().toISOString(),
    details: details || null,
  });
}
