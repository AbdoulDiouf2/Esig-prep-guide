import { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      // Vérifier si l'utilisateur a déjà vu le message aujourd'hui
      const lastSeen = localStorage.getItem(`disclaimerSeen_${currentUser.uid}`);
      const today = new Date().toDateString();
      
      if (!lastSeen || new Date(lastSeen).toDateString() !== today) {
        setIsOpen(true);
      }
    }
  }, [currentUser]);

  const handleAccept = () => {
    if (currentUser) {
      localStorage.setItem(`disclaimerSeen_${currentUser.uid}`, new Date().toISOString());
      setHasAccepted(true);
      setIsOpen(false);
    }
  };

  if (!isOpen || hasAccepted) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Information importante</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="prose prose-lg text-gray-700 space-y-4">
            <p>
              <strong>Bienvenue sur ESIG-prep-guide !</strong> Avant de commencer, il est important de noter que :
            </p>
            
            <ul className="list-disc pl-5 space-y-2">
              <li>Cette application <strong>ne garantit pas</strong> l'obtention d'un visa</li>
              <li>Les informations fournies sont basées sur des expériences personnelles</li>
              <li>Les procédures peuvent évoluer - restez informé des mises à jour officielles</li>
              <li>Nous vous recommandons de toujours vérifier les informations auprès des sources officielles</li>
            </ul>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    En utilisant cette application, vous reconnaissez avoir pris connaissance de ces informations importantes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleAccept}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              J'ai compris, continuer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
