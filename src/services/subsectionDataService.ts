import { db as firestore } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Structure des données des sous-sections
export interface SubsectionData {
  checkItems: Record<string, boolean>;  // id de l'item -> état coché
  inputValues: Record<string, string>;  // id de l'item -> valeur saisie
}

// Collection Firestore pour stocker les données
const COLLECTION_NAME = 'userSubsectionData';

/**
 * Récupère les données des sous-sections pour un utilisateur spécifique
 */
export const getUserSubsectionData = async (userId: string): Promise<SubsectionData> => {
  try {
    const userDocRef = doc(firestore, COLLECTION_NAME, userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as SubsectionData;
      return {
        checkItems: data.checkItems || {},
        inputValues: data.inputValues || {}
      };
    } else {
      // Si l'utilisateur n'a pas encore de données, retourner un objet vide
      return {
        checkItems: {},
        inputValues: {}
      };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données de sous-section:', error);
    return {
      checkItems: {},
      inputValues: {}
    };
  }
};

/**
 * Enregistre les données des cases à cocher
 */
export const saveUserCheckItems = async (
  userId: string, 
  checkItems: Record<string, boolean>
): Promise<void> => {
  try {
    // Récupérer d'abord les données actuelles pour ne pas écraser les inputValues
    const currentData = await getUserSubsectionData(userId);
    
    const userDocRef = doc(firestore, COLLECTION_NAME, userId);
    await setDoc(userDocRef, {
      checkItems,
      inputValues: currentData.inputValues
    }, { merge: true });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des cases à cocher:', error);
    throw error;
  }
};

/**
 * Enregistre les données des champs de saisie
 */
export const saveUserInputValues = async (
  userId: string, 
  inputValues: Record<string, string>
): Promise<void> => {
  try {
    // Récupérer d'abord les données actuelles pour ne pas écraser les checkItems
    const currentData = await getUserSubsectionData(userId);
    
    const userDocRef = doc(firestore, COLLECTION_NAME, userId);
    await setDoc(userDocRef, {
      checkItems: currentData.checkItems,
      inputValues
    }, { merge: true });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des champs de saisie:', error);
    throw error;
  }
};

/**
 * Sauvegarde l'ensemble des données des sous-sections
 */
export const saveAllSubsectionData = async (
  userId: string,
  data: SubsectionData
): Promise<void> => {
  try {
    const userDocRef = doc(firestore, COLLECTION_NAME, userId);
    await setDoc(userDocRef, data, { merge: true });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données de sous-section:', error);
    throw error;
  }
};

/**
 * Nettoie les données obsolètes des sous-sections en ne gardant que les items qui existent encore
 * @param userId - L'identifiant de l'utilisateur
 * @param validItemIds - Liste des IDs d'éléments encore valides
 */
export const cleanupSubsectionData = async (
  userId: string,
  validItemIds: string[]
): Promise<void> => {
  try {
    // Récupérer les données actuelles
    const userData = await getUserSubsectionData(userId);
    
    // Filtrer pour ne garder que les données des items qui existent encore
    const newCheckItems: Record<string, boolean> = {};
    const newInputValues: Record<string, string> = {};
    
    // Ne conserver que les cases à cocher valides
    Object.keys(userData.checkItems).forEach(itemId => {
      if (validItemIds.includes(itemId)) {
        newCheckItems[itemId] = userData.checkItems[itemId];
      }
    });
    
    // Ne conserver que les champs de saisie valides
    Object.keys(userData.inputValues).forEach(itemId => {
      if (validItemIds.includes(itemId)) {
        newInputValues[itemId] = userData.inputValues[itemId];
      }
    });
    
    // Sauvegarder les données nettoyées
    const userDocRef = doc(firestore, COLLECTION_NAME, userId);
    await setDoc(userDocRef, {
      checkItems: newCheckItems,
      inputValues: newInputValues
    });
    
    console.log(`Données de sous-section nettoyées pour l'utilisateur ${userId}`);
  } catch (error) {
    console.error('Erreur lors du nettoyage des données de sous-section:', error);
    throw error;
  }
};
