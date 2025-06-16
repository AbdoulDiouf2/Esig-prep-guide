import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DisclaimerBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { currentUser } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Vérifier si l'utilisateur a déjà fermé le bandeau pour cette session
    const bannerClosed = sessionStorage.getItem('bannerClosed');
    if (bannerClosed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('bannerClosed', 'true');
  };

  if (!isClient || !currentUser || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-xs rounded-lg shadow-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Rappel :</span> Cette application fournit des conseils basés sur des expériences personnelles et ne garantit pas l'obtention d'un visa.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="text-yellow-500 hover:text-yellow-700 focus:outline-none"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
