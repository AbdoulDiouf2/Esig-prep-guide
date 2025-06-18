import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';

export const ChatNotificationService = {
  /**
   * Vérifie si l'utilisateur a des messages non lus
   * @param userId ID de l'utilisateur
   * @returns Promise<boolean> true si des messages non lus existent
   */
  async checkUnreadMessages(userId: string): Promise<boolean> {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('receiverId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erreur lors de la vérification des messages non lus:', error);
      return false;
    }
  },

  /**
   * S'abonne aux changements de messages non lus
   * @param userId ID de l'utilisateur
   * @param callback Fonction appelée à chaque changement
   * @returns Fonction de désabonnement
   */
  subscribeToUnreadMessages(userId: string, callback: (hasUnread: boolean) => void): Unsubscribe {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('receiverId', '==', userId),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      callback(!snapshot.empty);
    });
  },

  /**
   * Marque tous les messages comme lus pour une conversation
   * @param userId ID de l'utilisateur
   * @param adminId ID de l'administrateur
   */
  async markMessagesAsRead(userId: string, adminId: string): Promise<void> {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('receiverId', '==', userId),
        where('senderId', '==', adminId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      if (!querySnapshot.empty) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  }
};

export default ChatNotificationService;
