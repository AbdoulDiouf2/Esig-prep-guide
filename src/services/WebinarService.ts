import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const WebinarService = {
  /**
   * Met à jour le statut d'un webinaire (isLive, isUpcoming, isCompleted)
   * @param webinarId - ID du webinaire à mettre à jour
   * @param status - Objet contenant les statuts à mettre à jour
   */
  async updateWebinarStatus(
    webinarId: string, 
    status: {
      isLive?: boolean;
      isUpcoming?: boolean;
      isCompleted?: boolean;
    }
  ) {
    try {
      const webinarRef = doc(db, 'webinars', webinarId);
      await updateDoc(webinarRef, {
        ...status,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du webinaire:', error);
      return false;
    }
  }
};

export default WebinarService;
