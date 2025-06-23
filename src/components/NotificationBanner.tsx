import { useState, useEffect } from 'react';
import { pushNotificationService } from '../services/pushNotificationService';
import { Bell, X } from 'lucide-react';

export function NotificationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Vérifier si la bannière doit être affichée
    const checkNotificationStatus = () => {
      // Ne pas afficher si la permission a déjà été accordée ou refusée
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        setShowBanner(false);
        return;
      }

      // Vérifier si l'utilisateur a déjà refusé la bannière
      const bannerDismissed = localStorage.getItem('notificationBannerDismissed');
      setShowBanner(!bannerDismissed);
    };

    checkNotificationStatus();

    // Écouter les changements de permission
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then(permissionStatus => {
          permissionStatus.onchange = checkNotificationStatus;
        });
    }

    return () => {
      // Nettoyage
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'notifications' as PermissionName })
          .then(permissionStatus => {
            permissionStatus.onchange = null;
          });
      }
    };
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const enabled = await pushNotificationService.checkAndRequestNotificationPermission();
      if (enabled) {
        setMessage('Notifications activées avec succès !');
        setTimeout(() => setShowBanner(false), 2000);
      } else {
        setMessage('Impossible d\'activer les notifications. Vérifiez les paramètres de votre navigateur.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'activation des notifications:', error);
      setMessage('Une erreur est survenue lors de l\'activation des notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Stocker dans le localStorage pour ne plus afficher la bannière
    localStorage.setItem('notificationBannerDismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start justify-between">
        <div className="flex-shrink-0 pt-0.5">
          <Bell className="h-5 w-5 text-blue-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Activer les notifications
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Recevez des notifications pour les nouveaux messages et mises à jour importantes.
          </p>
          {message && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              {message}
            </p>
          )}
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className={`px-3 py-1.5 text-sm font-medium rounded-md text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
            >
              {isLoading ? 'Chargement...' : 'Activer'}
            </button>
            <button
              onClick={handleDismiss}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 transition-colors ml-2"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 flex-shrink-0 flex text-gray-400 hover:text-gray-500"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
