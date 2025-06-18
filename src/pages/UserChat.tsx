import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import chatService, { ChatMessage as ChatMessageType } from '../services/chatService';
import ChatMessage from '../components/chat/ChatMessage';
import { Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';

// Composant de modale de confirmation
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 size={16} />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserChat: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminIsOnline, setAdminIsOnline] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Effet pour charger l'administrateur disponible et les messages
  useEffect(() => {
    const loadAdminAndMessages = async () => {
      if (!currentUser) return;
      
      try {
        // Trouver un administrateur disponible
        const availableAdmin = await chatService.getAvailableAdmin();
        
        if (availableAdmin) {
          setAdminId(availableAdmin);
          setAdminIsOnline(true); // Par défaut, on considère l'admin comme disponible
          
          // Charger les messages existants
          const existingMessages = await chatService.getMessages(
            currentUser.uid,
            availableAdmin
          );
          
          setMessages(existingMessages);
        } else {
          console.error('Aucun administrateur disponible');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminAndMessages();
  }, [currentUser]);

  // S'abonner aux messages en temps réel
  useEffect(() => {
    if (!currentUser || !adminId) return;
    
    const unsubscribe = chatService.subscribeToMessages(
      currentUser.uid, 
      adminId,
      (newMessages) => {
        setMessages(newMessages);
        
        // Marquer les messages de l'admin comme lus
        newMessages.forEach(msg => {
          if (msg.senderId === adminId && !msg.read && msg.id) {
            chatService.markAsRead(msg.id);
          }
        });
      }
    );
    
    // Nettoyage de l'abonnement
    return () => unsubscribe();
  }, [currentUser, adminId]);

  // Faire défiler vers le dernier message quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      // Vérifier si nous sommes près du bas avant de défiler
      const container = messagesContainerRef.current;
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Défiler uniquement si nous sommes déjà près du bas ou si c'est notre propre message
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage && lastMessage.senderId === currentUser?.uid;
      
      if (isNearBottom || isOwnMessage) {
        // Utiliser setTimeout pour s'assurer que le DOM a été mis à jour avant de défiler
        const timeoutId = setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
        
        // Nettoyer le timeout si le composant est démonté
        return () => clearTimeout(timeoutId);
      }
    }
  }, [messages, currentUser?.uid]);

  // Fonction pour ouvrir la modale de suppression
  const confirmDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setIsDeleteModalOpen(true);
  };

  // Fonction pour annuler la suppression
  const cancelDeleteMessage = () => {
    setIsDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  // Fonction pour confirmer la suppression
  const handleDeleteMessage = async () => {
    if (!messageToDelete) {
      setIsDeleteModalOpen(false);
      return;
    }
    
    try {
      await chatService.deleteMessage(messageToDelete);
      setMessages(prev => prev.filter(msg => msg.id !== messageToDelete));
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      alert('Une erreur est survenue lors de la suppression du message');
    } finally {
      setIsDeleteModalOpen(false);
      setMessageToDelete(null);
    }
  };

  // Mettre à jour la fonction de suppression existante pour utiliser la modale
  const handleDeleteClick = (messageId: string) => {
    confirmDeleteMessage(messageId);
  };

  // Gérer l'envoi d'un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !adminId || !messageText.trim()) return;
    
    try {
      setSending(true);
      
      // Créer et envoyer le message
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.uid,
        receiverId: adminId,
        content: messageText.trim(),
        senderRole: 'user' as const,
        read: false,
        timestamp: new Date()
      });
      
      // Réinitialiser le formulaire
      setMessageText('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      alert('Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-1 text-sm mb-2 text-blue-100">
            <Link to="/dashboard" className="hover:text-white">Tableau de bord</Link>
            <span>&gt;</span>
            <span>Chat administrateur</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Discussion avec l'administrateur</h1>
          <p className="text-lg text-blue-100">
            Posez vos questions et recevez de l'aide directement d'un membre de notre équipe
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden h-[calc(100vh-200px)]">
          {/* En-tête */}
          <div className="bg-blue-700 text-white p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                <span className="font-bold text-white">A</span>
              </div>
              <div>
                <h2 className="font-semibold">Support Administrateur</h2>
                <p className="text-sm text-blue-200">
                  {adminIsOnline ? 'En ligne' : 'Hors ligne'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Zone de messages */}
          <div 
            className="p-4 overflow-y-auto h-[calc(100%-150px)]"
            ref={messagesContainerRef}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#9CA3AF #E5E7EB',
            }}
          >
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-500 p-4">
                <div className="bg-gray-100 rounded-full p-4 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-center">
                  Aucun message. Commencez la conversation avec l'administrateur !
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="group">
                    <ChatMessage
                      message={message}
                      isCurrentUser={message.senderId === currentUser?.uid}
                      onDelete={message.senderId === currentUser?.uid ? handleDeleteClick : undefined}
                      canDelete={message.senderId === currentUser?.uid}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulaire d'envoi de message */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-center">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tapez votre message..."
                className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sending || !adminIsOnline}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending || !adminIsOnline}
                className="bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteMessage}
        onConfirm={handleDeleteMessage}
        title="Supprimer le message"
        message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
};

export default UserChat;