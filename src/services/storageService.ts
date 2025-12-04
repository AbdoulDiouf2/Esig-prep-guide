import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Upload une photo de profil alumni vers Firebase Storage
 * @param uid - ID de l'utilisateur
 * @param file - Fichier image à uploader
 * @returns URL de la photo uploadée
 */
export const uploadAlumniPhoto = async (uid: string, file: File): Promise<string> => {
  try {
    // Créer une référence unique pour la photo
    const timestamp = Date.now();
    const fileName = `${uid}_${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `alumni/photos/${fileName}`);

    // Upload le fichier
    await uploadBytes(storageRef, file);

    // Récupérer l'URL de téléchargement
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    throw new Error('Impossible d\'uploader la photo');
  }
};
