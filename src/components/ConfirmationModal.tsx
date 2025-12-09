import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirmer',
  cancelButtonText = 'Annuler',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  // Styles selon le type
  const getStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-500',
          iconComponent: AlertTriangle,
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          header: 'border-red-200 text-red-800'
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          iconComponent: AlertTriangle,
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          header: 'border-yellow-200 text-yellow-800'
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          iconComponent: AlertTriangle,
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          header: 'border-blue-200 text-blue-800'
        };
      case 'success':
        return {
          icon: 'text-green-500',
          iconComponent: CheckCircle,
          confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          header: 'border-green-200 text-green-800'
        };
      default:
        return {
          icon: 'text-red-500',
          iconComponent: AlertTriangle,
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          header: 'border-red-200 text-red-800'
        };
    }
  };

  const styles = getStyles();
  const IconComponent = styles.iconComponent;

  // Empêcher le clic en dehors de fermer la modale pour les actions destructives
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && type !== 'danger') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden transition-all transform animate-modal">
        <div className={`px-6 py-4 border-b ${styles.header} flex items-center`}>
          <IconComponent className={`mr-2 h-5 w-5 ${styles.icon}`} />
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-gray-700">{message}</p>
        </div>
        
        {type !== 'success' && (
          <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
            {cancelButtonText && (
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                onClick={onClose}
              >
                {cancelButtonText}
              </button>
            )}
            {confirmButtonText && (
              <button
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.confirmButton}`}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                autoFocus
              >
                {confirmButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmationModal;
