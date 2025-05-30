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
  try {
    await addDoc(collection(db, 'adminActivityLog'), {
      type,
      target,
      targetId: targetId || null,
      user: user || null,
      date: new Date().toISOString(),
      details: details || null,
    });
    console.log('Activité administrative enregistrée avec succès');
  } catch (error) {
    // Logger l'erreur mais ne pas la remonter pour ne pas bloquer l'opération principale
    console.error('Erreur lors de l\'enregistrement de l\'activité administrative:', error);
    // Retourner silencieusement - ne pas bloquer l'opération principale
  }
}
