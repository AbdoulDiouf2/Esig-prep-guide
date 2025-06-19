import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import adminChatService, { ChatConversation } from '../../services/adminChatService';
import chatService, { ChatMessage as ChatMessageType } from '../../services/chatService';
import ChatMessage from '../../components/chat/ChatMessage';
import { Send, Search, User, MessageSquare, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const scrollbarStyles = `
  /* Style pour la barre de défilement WebKit (Chrome, Safari, etc.) */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  /* Style pour Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 #f1f1f1;
  }
`;

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmer la suppression",
  message = "Êtes-vous sûr de vouloir effectuer cette action ?",
  confirmText = "Confirmer",
  cancelText = "Annuler"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConversationItem = ({ 
  conversation, 
  isActive, 
  onClick,
  onDelete
}: { 
  conversation: ChatConversation, 
  isActive: boolean, 
  onClick: () => void,
  onDelete: (e: React.MouseEvent, userId: string, userName: string) => void
}) => (
  <div 
    className={`relative group flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${isActive ? 'bg-blue-50' : ''}`}
  >
    <div 
      className="flex-1 flex items-center min-w-0"
      onClick={onClick}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
          {conversation.userName.charAt(0).toUpperCase()}
        </div>
        {conversation.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="text-sm font-medium text-gray-900 truncate">{conversation.userName}</h3>
          <span className="text-xs text-gray-500">
            {conversation.lastMessageTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {conversation.userEmail && (
          <p className="text-xs text-gray-500 truncate">{conversation.userEmail}</p>
        )}
        <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
      </div>
    </div>
    <button
      onClick={(e) => onDelete(e, conversation.userId, conversation.userName)}
      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-opacity"
      title="Supprimer la conversation"
    >
      <Trash2 size={18} />
    </button>
  </div>
);

const AdminChatInterface: React.FC = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const [isDeleteConversationModalOpen, setIsDeleteConversationModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{userId: string, userName: string} | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Chargement initial des conversations
  useEffect(() => {
    if (!currentUser) return;
    
    const loadConversations = async () => {
      try {
        const userConversations = await adminChatService.getAllConversations();
        setConversations(userConversations);
        
        // Sélectionner automatiquement le premier utilisateur s'il y en a
        if (userConversations.length > 0 && !selectedUserId) {
          setSelectedUserId(userConversations[0].userId);
          setSelectedUserName(userConversations[0].userName);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
    
    // S'abonner aux mises à jour des conversations en temps réel
    const unsubscribe = adminChatService.subscribeToConversations((updatedConversations) => {
      setConversations(updatedConversations);
    });
    
    return () => unsubscribe();
  }, [currentUser, selectedUserId]);

  // Charger les messages d'une conversation
  const loadMessages = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userMessages = await chatService.getMessages(userId, currentUser.uid);
      setMessages(userMessages);
      
      // Marquer les messages comme lus
      await adminChatService.markAllMessagesAsRead(userId);
      
      // Mettre à jour la liste des conversations pour refléter la lecture
      const updatedConversations = conversations.map(conv => 
        conv.userId === userId 
          ? { ...conv, unreadCount: 0 } 
          : conv
      );
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les messages lorsqu'un utilisateur est sélectionné
  useEffect(() => {
    if (!currentUser || !selectedUserId) return;
    
    loadMessages(selectedUserId);
    
    // S'abonner aux mises à jour des messages en temps réel
    const unsubscribe = chatService.subscribeToMessages(
      selectedUserId,
      currentUser.uid,
      (updatedMessages) => {
        // Ne pas écraser les messages si la liste est vide (peut arriver lors d'une suppression)
        if (updatedMessages.length > 0 || messages.length === 0) {
          setMessages(updatedMessages);
        }
        
        // Marquer les nouveaux messages comme lus
        updatedMessages.forEach(msg => {
          if (msg.senderId === selectedUserId && !msg.read && msg.id) {
            chatService.markAsRead(msg.id);
          }
        });
      }
    );
    
    return () => unsubscribe();
  }, [currentUser, selectedUserId]);

  // Défilement automatique vers le bas lors de nouveaux messages
  useEffect(() => {
    // Ne pas défiler automatiquement à chaque mise à jour des messages
    // car cela fait remonter la page
    if (messagesEndRef.current && messages.length > 0 && messagesContainerRef.current) {
      // Vérifier si nous sommes près du bas avant de défiler
      const container = messagesContainerRef.current;
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Défiler uniquement si nous sommes déjà près du bas ou si c'est un message de l'admin
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage && lastMessage.senderId === currentUser?.uid;
      
      // N'effectuer le défilement que si on est près du bas OU si c'est notre propre message
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
  }, [messages, currentUser?.uid, messagesEndRef, messagesContainerRef]);

  // Gérer l'envoi d'un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !selectedUserId || !messageText.trim()) return;
    
    try {
      setSending(true);
      
      // Créer et envoyer le message
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.uid,
        receiverId: selectedUserId,
        content: messageText.trim(),
        senderRole: 'admin' as const,
        receiverRole: 'user' as const,
        read: false,
        timestamp: serverTimestamp()
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

  // Sélectionner un utilisateur dans la liste
  const handleSelectUser = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    
    // Marquer les messages comme lus lorsqu'on change d'utilisateur
    if (userId) {
      adminChatService.markAllMessagesAsRead(userId);
    }
  };

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

  // Fonction pour supprimer un message
  const handleDeleteMessage = async () => {
    if (!selectedUserId || !messageToDelete) {
      setIsDeleteModalOpen(false);
      return;
    }
    
    // Sauvegarder l'état actuel des messages pour restauration en cas d'erreur
    const previousMessages = [...messages];
    
    try {
      // Mettre à jour l'état immédiatement pour un retour visuel instantané
      setMessages(prev => prev.filter(msg => msg.id !== messageToDelete));
      
      // Fermer la modale
      setIsDeleteModalOpen(false);
      
      // Supprimer le message de Firestore
      await adminChatService.deleteMessage(selectedUserId, messageToDelete);
      
      // Réinitialiser l'ID du message à supprimer
      setMessageToDelete(null);
      
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      
      // Restaurer les messages précédents en cas d'erreur
      setMessages(previousMessages);
      
      alert('Une erreur est survenue lors de la suppression du message');
      setMessageToDelete(null);
    }
  };

  // Fonction pour confirmer la suppression d'une conversation
  const confirmDeleteConversation = (e: React.MouseEvent, userId: string, userName: string) => {
    e.stopPropagation();
    setConversationToDelete({ userId, userName });
    setIsDeleteConversationModalOpen(true);
  };

  // Fonction pour annuler la suppression
  const cancelDeleteConversation = () => {
    setIsDeleteConversationModalOpen(false);
    setConversationToDelete(null);
  };

  // Fonction pour supprimer une conversation
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;
    
    try {
      // Supprimer la conversation
      await adminChatService.deleteUserConversation(conversationToDelete.userId);
      
      // Si la conversation supprimée est celle sélectionnée, on la désélectionne
      if (selectedUserId === conversationToDelete.userId) {
        setSelectedUserId(null);
        setSelectedUserName('');
        setMessages([]);
      }
      
      // Fermer la modale
      setIsDeleteConversationModalOpen(false);
      setConversationToDelete(null);
      
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      alert('Une erreur est survenue lors de la suppression de la conversation');
    }
  };

  // Vérifier si l'utilisateur est connecté
  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-center text-lg">
          Vous devez être connecté en tant qu'administrateur pour accéder à cette page.
        </p>
      </div>
    );
  }

  // Tri des conversations par date du dernier message
  const sortedConversations = [...conversations].sort((a, b) => {
    if (!a.lastMessageTime || !b.lastMessageTime) return 0;
    return b.lastMessageTime.seconds - a.lastMessageTime.seconds;
  });

  return (
    <div className="bg-gray-100 min-h-screen">
      <style>{scrollbarStyles}</style>
      
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-1 text-sm mb-2 text-blue-100">
            <Link to="/admin" className="hover:text-white">Administration</Link>
            <span>&gt;</span>
            <span>Interface de chat</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Gestion des conversations utilisateurs</h1>
          <p className="text-lg text-blue-100">
            Communiquez avec les utilisateurs et répondez à leurs questions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 h-[calc(100vh-180px)]">
        <div className="bg-white rounded-lg shadow-lg flex flex-col h-full">
          <div className="grid grid-cols-12 h-full">
            {/* Liste des utilisateurs (1/3) */}
            <div className="col-span-4 border-r border-gray-200 flex flex-col h-full">
              {/* En-tête avec recherche désactivée */}
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Recherche désactivée"
                    disabled
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
                  />
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
              
              {/* Liste des conversations avec hauteur fixe et défilement */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : sortedConversations.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-500 p-4">
                    <User size={48} className="mb-3 text-gray-300" />
                    <p className="text-center">Aucune conversation disponible</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {sortedConversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.userId}
                        conversation={conversation}
                        isActive={selectedUserId === conversation.userId}
                        onClick={() => handleSelectUser(conversation.userId, conversation.userName)}
                        onDelete={confirmDeleteConversation}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Zone de conversation (2/3) */}
            <div className="col-span-8 flex flex-col h-full">
              {selectedUserId ? (
                <div className="flex flex-col h-full">
                  {/* En-tête de la conversation */}
                  <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-3">
                        {selectedUserName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{selectedUserName}</h2>
                        {conversations.find(c => c.userId === selectedUserId)?.userEmail && (
                          <p className="text-sm text-gray-500">{conversations.find(c => c.userId === selectedUserId)?.userEmail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Conteneur principal avec hauteur fixe et défilement */}
                  <div className="flex flex-col h-[calc(100vh-400px)]">
                    {/* Zone de messages avec défilement */}
                    <div 
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-4"
                    >
                      {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-gray-500">
                          <p>Aucun message. Commencez la conversation !</p>
                        </div>
                      ) : (
                        <>
                          {messages.map((message) => (
                            <div key={message.id} className="group">
                              <ChatMessage
                                message={message}
                                isCurrentUser={message.senderId === currentUser?.uid}
                                onDelete={confirmDeleteMessage}
                                canDelete={true}
                              />
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Formulaire d'envoi de message - fixé en bas */}
                  <div className="border-t border-gray-200 bg-white p-4 mt-auto">
                    <form onSubmit={handleSendMessage} className="flex items-center">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Tapez votre message..."
                        className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={sending || !selectedUserId}
                      />
                      <button
                        type="submit"
                        disabled={!messageText.trim() || sending || !selectedUserId}
                        className="bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <Send size={20} />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center p-6">
                    <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Sélectionnez une conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modale de confirmation de suppression */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteMessage}
        onConfirm={handleDeleteMessage}
        title="Supprimer le message"
        message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      {/* Modale de confirmation de suppression de conversation */}
      <ConfirmationModal
        isOpen={isDeleteConversationModalOpen}
        onClose={cancelDeleteConversation}
        onConfirm={handleDeleteConversation}
        title="Supprimer la conversation"
        message={`Êtes-vous sûr de vouloir supprimer la conversation avec ${conversationToDelete?.userName} ? Tous les messages seront définitivement supprimés.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
};

export default AdminChatInterface;