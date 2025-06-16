import { db as firestore } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { InputFieldType } from '../contexts/ContentContext';

// Type pour les valeurs de champ typées
export type TypedValue = string | boolean | number | Date | null;

// Interface pour les métadonnées de champ
export interface FieldMetadata {
  type: InputFieldType;
  options?: string[];
}

// Structure des données des sous-sections
export interface SubsectionData {
  checkItems: Record<string, boolean>;  // id de l'item -> état coché
  inputValues: Record<string, string>;  // id de l'item -> valeur saisie (pour compat. existante)
  typedValues?: Record<string, TypedValue>; // id de l'item -> valeur typée
  fieldMetadata?: Record<string, FieldMetadata>; // id de l'item -> métadonnées du champ
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
        inputValues: data.inputValues || {},
        typedValues: data.typedValues || {},
        fieldMetadata: data.fieldMetadata || {}
      };
    } else {
      // Si l'utilisateur n'a pas encore de données, retourner un objet vide
      return {
        checkItems: {},
        inputValues: {},
        typedValues: {},
        fieldMetadata: {}
      };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données de sous-section:', error);
    return {
      checkItems: {},
      inputValues: {},
      typedValues: {},
      fieldMetadata: {}
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
 * Enregistre les données des champs de saisie (format texte standard)
 */
export const saveUserInputValues = async (
  userId: string, 
  inputValues: Record<string, string>
): Promise<void> => {
  try {
    // Récupérer d'abord les données actuelles pour ne pas écraser les autres propriétés
    const currentData = await getUserSubsectionData(userId);
    
    const userDocRef = doc(firestore, COLLECTION_NAME, userId);
    await setDoc(userDocRef, {
      checkItems: currentData.checkItems,
      inputValues,
      typedValues: currentData.typedValues,
      fieldMetadata: currentData.fieldMetadata
    }, { merge: true });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des champs de saisie:', error);
    throw error;
  }
};

/**
 * Enregistre les données des champs de saisie avec leurs types
 */
export const saveUserTypedValues = async (
  userId: string, 
  typedValues: Record<string, TypedValue>
): Promise<void> => {
  try {
    // Récupérer d'abord les données actuelles
    const currentData = await getUserSubsectionData(userId);
    
    const userDocRef = doc(firestore, COLLECTION_NAME, userId);
    await setDoc(userDocRef, {
      checkItems: currentData.checkItems,
      inputValues: currentData.inputValues,
      typedValues,
      fieldMetadata: currentData.fieldMetadata
    }, { merge: true });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des valeurs typées:', error);
    throw error;
  }
};

/**
 * Enregistre les métadonnées des champs (types, options, etc.)
 */
export const saveFieldMetadata = async (
  userId: string, 
  fieldMetadata: Record<string, FieldMetadata>
): Promise<void> => {
  try {
    // Récupérer d'abord les données actuelles
    const currentData = await getUserSubsectionData(userId);
    
    const userDocRef = doc(firestore, COLLECTION_NAME, userId);
    await setDoc(userDocRef, {
      checkItems: currentData.checkItems,
      inputValues: currentData.inputValues,
      typedValues: currentData.typedValues,
      fieldMetadata
    }, { merge: true });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des métadonnées de champ:', error);
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
 * Convertit une valeur typée au format string pour l'affichage ou le stockage legacy
 */
export const convertTypedValueToString = (value: TypedValue, type: InputFieldType): string => {
  if (value === null || value === undefined) return '';
  
  switch (type) {
    case 'boolean':
      return (value === true) ? 'Oui' : 'Non';
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      }
      return String(value);
    case 'datetime':
      if (value instanceof Date) {
        return value.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return String(value);
    case 'number':
      return Number(value).toString();
    default:
      return String(value);
  }
};

/**
 * Convertit une valeur string en valeur typée selon le type spécifié
 */
export const convertStringToTypedValue = (value: string, type: InputFieldType): TypedValue => {
  if (!value) {
    // Valeurs par défaut selon le type
    switch (type) {
      case 'boolean': return false;
      case 'number': return 0;
      case 'date': 
      case 'datetime': return new Date();
      default: return '';
    }
  }
  
  switch (type) {
    case 'boolean':
      return value.toLowerCase() === 'oui' || 
             value.toLowerCase() === 'yes' || 
             value === 'true';
    case 'number':
      return parseFloat(value) || 0;
    case 'date':
    case 'datetime': {
      // Gestion flexible des formats de date
      const dateValue = new Date(value);
      if (!isNaN(dateValue.getTime())) {
        return dateValue;
      }
      // Tenter de parser les formats français courants
      // Ex: "05 Septembre 2025" ou "05/09/2025"
      const dateParts = value.split(/ |\//); 
      if (dateParts.length >= 3) {
        // Format avec mois en texte
        const frMonths = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        const monthIndex = frMonths.findIndex(m => 
          value.toLowerCase().includes(m.toLowerCase()));
          
        if (monthIndex !== -1) {
          // Récupérer l'année et le jour
          const day = parseInt(value.match(/\d{1,2}/)?.at(0) || '1');
          const yearMatch = value.match(/\d{4}/);
          const year = yearMatch ? parseInt(yearMatch.at(0) || '2025') : new Date().getFullYear();
          return new Date(year, monthIndex, day);
        }
        
        // Format numérique
        try {
          let day, month, year;
          // Détecter l'ordre selon le format
          if (parseInt(dateParts[0]) > 12) { // Si > 12, c'est un jour
            day = parseInt(dateParts[0]);
            month = parseInt(dateParts[1]) - 1; // Les mois sont 0-indexés
            year = parseInt(dateParts[2]);
          } else { // Sinon on suppose MM/DD/YYYY
            month = parseInt(dateParts[0]) - 1;
            day = parseInt(dateParts[1]);
            year = parseInt(dateParts[2]);
          }
          return new Date(year, month, day);
        } catch (error) {
          console.error('Erreur lors de la conversion de la date:', error);
          return new Date();
        }
      }
      return new Date();
    }
    default:
      return value;
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
