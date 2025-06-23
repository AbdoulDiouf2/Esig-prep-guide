import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  addDoc,
  updateDoc,
  FieldValue,
  deleteDoc,
  writeBatch,
  or,
  and,
  Unsubscribe
} from 'firebase/firestore';
// import { ChatMessage } from './chatService';

export interface ChatConversation {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: number;
  userPhotoURL?: string;
}

/**
 * Service de gestion des messages pour les administrateurs
 */
const adminChatService = {
  /**
   * Récupère toutes les conversations des utilisateurs
   * @returns Promise avec la liste des conversations
   */
  async getAllConversations(): Promise<ChatConversation[]> {
    try {
      // Requête pour récupérer tous les messages distincts par userId
      const messagesRef = collection(db, 'messages');
      const messagesQuery = query(
        messagesRef,
        orderBy('timestamp', 'desc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const conversations = new Map<string, ChatConversation>();
      
      // Regrouper les messages par utilisateur pour créer des conversations
      for (const messageDoc of messagesSnapshot.docs) {
        const messageData = messageDoc.data();
        const userId = messageData.senderRole === 'user' ? messageData.senderId : messageData.receiverId;
        
        // Si cet utilisateur n'est pas encore dans nos conversations, l'ajouter
        if (!conversations.has(userId) && userId) {
          // Récupérer les informations de l'utilisateur
          const userDoc = await getDoc(doc(db, 'users', userId));
          const userData = userDoc.data();
          
          if (userData) {
            conversations.set(userId, {
              userId,
              userName: userData.displayName || 'Utilisateur',
              userEmail: userData.email || '',
              lastMessage: messageData.content,
              lastMessageTime: messageData.timestamp,
              unreadCount: messageData.senderRole === 'user' && !messageData.read ? 1 : 0,
              userPhotoURL: userData.photoURL
            });
          }
        } else if (conversations.has(userId)) {
          // Mettre à jour le compteur de messages non lus
          if (messageData.senderRole === 'user' && !messageData.read) {
            const conversation = conversations.get(userId);
            if (conversation) {
              conversation.unreadCount += 1;
            }
          }
        }
      }
      
      return Array.from(conversations.values());
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      return [];
    }
  },
  
  /**
   * Écouter les mises à jour des conversations
   * @param callback Fonction à appeler lorsque les données sont mises à jour
   */
  subscribeToConversations(callback: (conversations: ChatConversation[]) => void) {
    try {
      const messagesRef = collection(db, 'messages');
      const messagesQuery = query(
        messagesRef,
        orderBy('timestamp', 'desc')
      );
      
      return onSnapshot(messagesQuery, async (snapshot) => {
        // Regrouper les messages par utilisateur
        const conversations = new Map<string, ChatConversation>();
        
        // Traiter tous les messages actuels
        for (const messageDoc of snapshot.docs) {
          const messageData = messageDoc.data();
          const userId = messageData.senderRole === 'user' ? messageData.senderId : messageData.receiverId;
          
          if (!userId) continue;
          
          // Vérifier si c'est le dernier message pour cet utilisateur
          const existingConversation = conversations.get(userId);
          if (!existingConversation || 
              (messageData.timestamp?.seconds > (existingConversation.lastMessageTime?.seconds || 0))) {
            
            // Récupérer les informations de l'utilisateur si nécessaire
            if (!existingConversation) {
              try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                const userData = userDoc.data();
                
                if (userData) {
                  conversations.set(userId, {
                    userId,
                    userName: userData.displayName || 'Utilisateur',
                    userEmail: userData.email || '',
                    lastMessage: messageData.content,
                    lastMessageTime: messageData.timestamp,
                    unreadCount: messageData.senderRole === 'user' && !messageData.read ? 1 : 0,
                    userPhotoURL: userData.photoURL
                  });
                }
              } catch (error) {
                console.error('Erreur lors de la récupération des données utilisateur:', error);
              }
            } else {
              // Mettre à jour la conversation existante
              existingConversation.lastMessage = messageData.content;
              existingConversation.lastMessageTime = messageData.timestamp;
              if (messageData.senderRole === 'user' && !messageData.read) {
                existingConversation.unreadCount = (existingConversation.unreadCount || 0) + 1;
              }
            }
          } else if (messageData.senderRole === 'user' && !messageData.read) {
            // Incrémenter le compteur de messages non lus
            existingConversation.unreadCount = (existingConversation.unreadCount || 0) + 1;
          }
        }
        
        // Appeler le callback avec les conversations mises à jour
        callback(Array.from(conversations.values()));
      });
    } catch (error) {
      console.error('Erreur lors de l\'abonnement aux conversations:', error);
      return () => {}; // Retourner une fonction de nettoyage vide
    }
  },
  
  /**
   * Envoyer un message en tant qu'administrateur
   * @param adminId ID de l'administrateur
   * @param userId ID de l'utilisateur destinataire
   * @param content Contenu du message
   * @param attachmentUrl URL de la pièce jointe (optionnel)
   * @returns Promise avec l'ID du message créé
   */
  async sendAdminMessage(adminId: string, userId: string, content: string, attachmentUrl?: string): Promise<string> {
    try {
      // Définir le type avec attachmentUrl optionnel
      type AdminMessageType = {
        senderId: string;
        receiverId: string;
        content: string;
        timestamp: FieldValue;
        read: boolean;
        senderRole: 'admin';
        attachmentUrl?: string;
      };

      // Créer l'objet de base
      const messageData: AdminMessageType = {
        senderId: adminId,
        receiverId: userId,
        content,
        timestamp: serverTimestamp(),
        read: false,
        senderRole: 'admin'
      };
      
      // N'ajouter attachmentUrl que s'il existe
      if (attachmentUrl) {
        messageData.attachmentUrl = attachmentUrl;
      }
      
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  },
  
  /**
   * Marquer tous les messages d'un utilisateur comme lus
   * @param userId ID de l'utilisateur
   * @returns Promise<boolean>
   */
  async markAllMessagesAsRead(userId: string): Promise<boolean> {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', userId),
        where('senderRole', '==', 'user'),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      
      const updatePromises = querySnapshot.docs.map(async (doc) => {
        return updateDoc(doc.ref, { read: true });
      });
      
      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
      return false;
    }
  },
  
  /**
   * Supprimer un message
   * @param userId ID de l'utilisateur (non utilisé dans cette version simplifiée)
   * @param messageId ID du message à supprimer
   * @returns Promise<void>
   */
  async deleteMessage(userId: string, messageId: string): Promise<void> {
    try {
      // Supprimer simplement le message
      const messageRef = doc(db, 'messages', messageId);
      await deleteDoc(messageRef);
      
      // La mise à jour de la conversation sera gérée par les règles de sécurité
      // et les écouteurs en temps réel
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      throw error;
    }
  },
  
  /**
   * Supprime tous les messages d'une conversation utilisateur
   * @param userId ID de l'utilisateur dont on veut supprimer la conversation
   */
  async deleteUserConversation(userId: string): Promise<void> {
    try {
      // Récupérer tous les messages de la conversation
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        or(
          and(
            where('senderId', '==', userId),
            where('receiverId', '==', 'admin')
          ),
          and(
            where('receiverId', '==', userId),
            where('senderId', '==', 'admin')
          )
        )
      );
      
      const querySnapshot = await getDocs(q);
      
      // Supprimer chaque message
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      throw error;
    }
  },
  
  /**
   * Vérifie si l'admin a des messages non lus
   * @param adminId ID de l'administrateur
   * @returns Promise<boolean> true si des messages non lus existent
   */
  async hasUnreadMessages(adminId: string): Promise<boolean> {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('receiverId', '==', adminId),
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
   * S'abonne aux changements de messages non lus pour l'admin
   * @param adminId ID de l'administrateur
   * @param callback Fonction appelée à chaque changement
   * @returns Fonction de désabonnement
   */
  subscribeToUnreadMessages(
    adminId: string, 
    callback: (hasUnread: boolean) => void
  ): Unsubscribe {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('receiverId', '==', adminId),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      callback(!snapshot.empty);
    });
  }
};

export default adminChatService;
