import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MAINTENANCE_DOC = 'settings/maintenance';

export interface MaintenanceSettings {
  enabled: boolean;
  message?: string;
  updatedAt?: Date;
  updatedBy?: string;
}

/**
 * Récupérer l'état du mode maintenance
 */
export const getMaintenanceStatus = async (): Promise<MaintenanceSettings> => {
  try {
    const docRef = doc(db, MAINTENANCE_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        enabled: data.enabled || false,
        message: data.message,
        updatedAt: data.updatedAt?.toDate(),
        updatedBy: data.updatedBy,
      };
    }

    // Par défaut, maintenance désactivée
    return { enabled: false };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du statut de maintenance:', error);
    // En cas d'erreur, on considère que la maintenance est désactivée
    return { enabled: false };
  }
};

/**
 * Activer/désactiver le mode maintenance (superadmin uniquement)
 */
export const setMaintenanceStatus = async (
  enabled: boolean,
  adminUid: string,
  message?: string
): Promise<void> => {
  try {
    const docRef = doc(db, MAINTENANCE_DOC);
    
    await setDoc(docRef, {
      enabled,
      message: message || '',
      updatedAt: new Date(),
      updatedBy: adminUid,
    });

    console.log(`✅ Mode maintenance ${enabled ? 'activé' : 'désactivé'}`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du mode maintenance:', error);
    throw error;
  }
};
