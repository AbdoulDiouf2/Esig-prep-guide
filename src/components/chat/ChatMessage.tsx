import React from 'react';
import { Trash2 } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../services/chatService';
import { Timestamp } from 'firebase/firestore';

interface ChatMessageProps {
  message: ChatMessageType;
  isCurrentUser: boolean;
  onDelete?: (messageId: string) => void;
  canDelete?: boolean;
  showDeleteButton?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
  onDelete,
  canDelete = false,
  showDeleteButton = false
}) => {
  // Formater la date à partir du timestamp Firebase
  const formatDate = (timestamp: Timestamp | Date | number | null) => {
    if (!timestamp) return '';

    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`relative max-w-[80%]`}>
        <div
          className={`rounded-lg p-3 ${
            isCurrentUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
          {message.attachmentUrl && (
            <a 
              href={message.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 text-xs underline ${isCurrentUser ? 'text-blue-100' : 'text-blue-600'}`}
            >
              Pièce jointe
            </a>
          )}
          <div
            className={`text-xs mt-1 ${
              isCurrentUser ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            {formatDate(message.timestamp)}
          </div>
        </div>
        
        {/* Bouton de suppression */}
        {(canDelete || showDeleteButton) && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (message.id) {
                onDelete(message.id);
              }
            }}
            className={`absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100`}
            title="Supprimer le message"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
