import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  Timestamp,
  onSnapshot,
  FieldValue,
  deleteDoc
} from 'firebase/firestore';

// Types pour les messages de chat
export interface ChatMessage {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Timestamp | null;
  read: boolean;
  senderRole: 'user' | 'admin';
  attachmentUrl?: string;
}

// Structure de conversation
export interface Conversation {
  id: string;
  userId: string;
  adminId: string;
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  unreadCount: number;
}

/**
 * Service de gestion des messages pour le chat entre utilisateurs et administrateurs
 */
const chatService = {
  /**
   * Envoyer un message
   * @param message Le message à envoyer
   * @returns Promise avec l'ID du message créé
   */
  async sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    try {
      // Définir un type qui inclut attachmentUrl comme optionnel
      type CleanedMessageType = {
        senderId: string;
        receiverId: string;
        content: string;
        senderRole: 'user' | 'admin';
        read: boolean;
        timestamp: FieldValue; // FieldValue de Firestore
        attachmentUrl?: string; // Propriété optionnelle
      };
      
      // Créer l'objet avec le type explicite
      const cleanedMessage: CleanedMessageType = { 
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        senderRole: message.senderRole,
        read: false,
        timestamp: serverTimestamp()
      };
      
      // Ajouter l'URL de la pièce jointe seulement si elle existe
      if (message.attachmentUrl) {
        cleanedMessage.attachmentUrl = message.attachmentUrl;
      }

      const docRef = await addDoc(collection(db, 'messages'), cleanedMessage);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  },

  /**
   * Récupérer tous les messages entre deux utilisateurs
   * @param userId ID de l'utilisateur courant
   * @param adminId ID de l'administrateur
   * @returns Promise avec la liste des messages
   */
  async getMessages(userId: string, adminId: string): Promise<ChatMessage[]> {
    try {
      // Utiliser une requête simplifiée qui ne nécessite pas d'index composites
      const messagesQuery = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(messagesQuery);
      
      const messages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filtrage manuel pour ne garder que les messages entre cet utilisateur et cet admin
        if ((data.senderId === userId && data.receiverId === adminId) || 
            (data.senderId === adminId && data.receiverId === userId)) {
          messages.push({
            id: doc.id,
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            timestamp: data.timestamp,
            read: data.read,
            senderRole: data.senderRole,
            attachmentUrl: data.attachmentUrl
          });
        }
      });

      return messages;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return [];
    }
  },

  /**
   * Observer les nouveaux messages en temps réel
   * @param userId ID de l'utilisateur
   * @param adminId ID de l'administrateur
   * @param callback Fonction à appeler quand de nouveaux messages arrivent
   * @returns Fonction pour se désabonner de l'observateur
   */
  subscribeToMessages(userId: string, adminId: string, callback: (messages: ChatMessage[]) => void) {
    try {
      // Utiliser une requête simplifiée qui ne nécessite pas d'index composites
      // On filtre juste sur l'horodatage et on fait le filtrage côté client
      const messagesQuery = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'asc')
      );

      return onSnapshot(messagesQuery, (querySnapshot) => {
        const messages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Filtrage manuel pour ne garder que les messages entre cet utilisateur et cet admin
          if ((data.senderId === userId && data.receiverId === adminId) || 
              (data.senderId === adminId && data.receiverId === userId)) {
            messages.push({
              id: doc.id,
              senderId: data.senderId,
              receiverId: data.receiverId,
              content: data.content,
              timestamp: data.timestamp,
              read: data.read,
              senderRole: data.senderRole,
              attachmentUrl: data.attachmentUrl
            });
          }
        });
        callback(messages);
      });
    } catch (error) {
      console.error('Erreur lors de l\'abonnement aux messages:', error);
      return () => {};
    }
  },

  /**
   * Marquer un message comme lu
   * @param messageId ID du message
   * @returns Promise<boolean>
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        read: true
      });
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage du message comme lu:', error);
      return false;
    }
  },

  /**
   * Obtenir un administrateur disponible
   * Solution temporaire qui retourne un ID d'administrateur prédéfini
   * pour éviter les erreurs de permission
   */
  async getAvailableAdmin(): Promise<string | null> {
    try {
      // ID d'administrateur défini directement pour éviter les requêtes Firestore
      const defaultAdminId = "LE6iQfUgpvXrEr4JV5wE25qy9jK2";
      
      // Retourner directement l'ID d'administrateur
      return defaultAdminId;
      
    } catch (error) {
      console.error('Erreur lors de la recherche d\'un admin disponible:', error);
      return null;
    }
  },
  
  /**
   * Supprimer un message
   * @param messageId ID du message à supprimer
   * @returns Promise<void>
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      throw error;
    }
  }
};

export default chatService;
