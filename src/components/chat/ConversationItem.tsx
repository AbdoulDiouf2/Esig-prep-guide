import React from 'react';
import { ChatConversation } from '../../services/adminChatService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

// Interface pour objets avec méthode toDate()
interface WithToDate {
  toDate: () => Date;
}

interface ConversationItemProps {
  conversation: ChatConversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  isActive, 
  onClick 
}) => {
  // Formater la date pour afficher "il y a X minutes/heures/jours"
  const formatTime = (timestamp: Timestamp | Date | number | WithToDate | null): string => {
    if (!timestamp) return '';
    
    try {
      let date: Date;
      
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      } else if (typeof timestamp === 'object' && 'toDate' in timestamp && 
                typeof (timestamp as WithToDate).toDate === 'function') {
        date = (timestamp as WithToDate).toDate();
      } else {
        date = new Date(timestamp as Date | number);
      }
      
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '';
    }
  };

  // Déterminer les classes de style en fonction de l'état actif
  const baseClasses = "flex items-center p-3 border-b border-gray-200 cursor-pointer";
  const activeClasses = isActive 
    ? "bg-blue-50 border-l-4 border-l-blue-500" 
    : "hover:bg-gray-50";
    
  return (
    <div 
      className={`${baseClasses} ${activeClasses}`}
      onClick={onClick}
    >
      {/* Avatar de l'utilisateur */}
      <div className="flex-shrink-0 mr-3">
        {conversation.userPhotoURL ? (
          <img 
            src={conversation.userPhotoURL} 
            alt={conversation.userName} 
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
            {conversation.userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Informations sur la conversation */}
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-medium text-gray-900 truncate">{conversation.userName}</h3>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>
        
        <div className="flex items-center">
          <p className="text-sm text-gray-600 truncate flex-grow">
            {conversation.lastMessage}
          </p>
          
          {/* Badge pour les messages non lus */}
          {conversation.unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
