import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import chatService, { ChatMessage as ChatMessageType } from '../services/chatService';
import ChatMessage from '../components/chat/ChatMessage';
import { Paperclip, Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const AdminChat: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminIsOnline, setAdminIsOnline] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gérer l'envoi d'un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !adminId || (!messageText.trim() && !file)) return;
    
    try {
      setSending(true);
      
      let attachmentUrl = undefined;
      
      // Téléchargement du fichier si présent
      if (file) {
        const storageRef = ref(storage, `chat_attachments/${currentUser.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        attachmentUrl = await getDownloadURL(snapshot.ref);
      }
      
      // Créer et envoyer le message
      await chatService.sendMessage({
        senderId: currentUser.uid,
        receiverId: adminId,
        content: messageText.trim() || (file ? 'Pièce jointe' : ''),
        senderRole: 'user',
        read: false,
        attachmentUrl
      });
      
      // Réinitialiser le formulaire
      setMessageText('');
      setFile(null);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      alert('Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  // Ouvrir la boîte de dialogue pour sélectionner un fichier
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  // Gérer le changement de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Supprimer la pièce jointe sélectionnée
  const handleRemoveAttachment = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-center">
          Vous devez être connecté pour accéder au chat. <Link to="/login" className="text-blue-600">Se connecter</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center">
            <Link to="/dashboard" className="mr-4">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div className="flex-grow">
              <h1 className="text-lg font-semibold">Discussion avec l'administrateur</h1>
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${adminIsOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-sm text-gray-600">
                  {adminIsOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de messages */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md">
          {/* Messages */}
          <div className="h-[60vh] overflow-y-auto p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-500">
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
              messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  isCurrentUser={message.senderId === currentUser.uid}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulaire d'envoi de message */}
          <div className="border-t border-gray-200 p-4">
            {file && (
              <div className="mb-3 bg-blue-50 rounded-md p-2 flex items-center justify-between">
                <div className="text-sm text-blue-700 truncate flex-1">
                  <Paperclip size={16} className="inline mr-2" />
                  {file.name}
                </div>
                <button 
                  onClick={handleRemoveAttachment}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center">
              <button 
                type="button"
                onClick={handleAttachmentClick}
                className="mr-3 text-gray-500 hover:text-gray-700"
              >
                <Paperclip size={20} />
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tapez votre message ici..."
                className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sending}
              />
              <button
                type="submit"
                className={`ml-3 bg-blue-600 text-white rounded-full p-2 ${
                  ((!messageText.trim() && !file) || sending) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
                disabled={(!messageText.trim() && !file) || sending}
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Instructions et informations */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">À propos de cette discussion</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Vos messages sont traités par un administrateur de l'ESIG.</li>
            <li>Les temps de réponse peuvent varier en fonction de la disponibilité des administrateurs.</li>
            <li>Vous pouvez envoyer des pièces jointes (documents, images) pour préciser votre demande.</li>
            <li>Les conversations sont confidentielles et ne sont visibles que par vous et les administrateurs.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
