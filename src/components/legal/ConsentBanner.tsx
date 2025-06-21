import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCookieConsent, type ConsentPreferences } from '../../hooks/useCookieConsent';

const ConsentBanner: React.FC = () => {
  const { consent, saveConsent, isLoading } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<Omit<ConsentPreferences, 'acceptedAt'>>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  // Mettre à jour les préférences locales quand le consentement est chargé
  useEffect(() => {
    if (consent) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { acceptedAt, ...prefs } = consent;
      setLocalPreferences(prefs);
    }
  }, [consent]);

  const handlePreferenceChange = (type: 'analytics' | 'marketing') => {
    setLocalPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const acceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
    });
  };

  const acceptEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
    });
  };

  const savePreferences = () => {
    saveConsent(localPreferences);
    setShowDetails(false);
  };

  if (isLoading || consent) {
    return null;
  }

  return (
    <>
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}
      
      {/* Bannière principale de consentement */}
      {!showDetails && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 md:p-6 z-40">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-grow">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Votre vie privée</h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Nous utilisons des cookies pour améliorer votre expérience sur notre site, personnaliser le contenu et analyser notre trafic. 
                  Vous pouvez choisir d'accepter tous les cookies ou personnaliser vos préférences.
                </p>
                <div className="mt-1">
                  <Link to="/legal/privacy-policy" className="text-blue-600 hover:underline text-sm" target="_blank">
                    En savoir plus sur notre politique de confidentialité
                  </Link>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Personnaliser
                </button>
                <button 
                  onClick={acceptEssential}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Refuser
                </button>
                <button 
                  onClick={acceptAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Tout accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Panneau détaillé des préférences */}
      {showDetails && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 md:p-6 z-50 max-h-[80vh] overflow-y-auto">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Paramètres de confidentialité</h2>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Cookies essentiels */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Cookies essentiels</h3>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      checked={true} 
                      disabled
                      className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-not-allowed right-0 z-10 border-gray-300 transition-all duration-300"
                    />
                    <label 
                      className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-not-allowed transition-all duration-300"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés. 
                  Ils sont généralement définis en réponse à des actions que vous effectuez, comme définir vos préférences de confidentialité.
                </p>
              </div>
              
              {/* Cookies d'analyse */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Cookies d'analyse</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={localPreferences.analytics}
                      onChange={() => handlePreferenceChange('analytics')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Ces cookies nous permettent de compter les visites et les sources de trafic afin de mesurer et d'améliorer 
                  les performances de notre site. Ils nous aident à savoir quelles pages sont les plus et moins populaires.
                </p>
              </div>
              
              {/* Cookies marketing */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Cookies marketing</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={localPreferences.marketing}
                      onChange={() => handlePreferenceChange('marketing')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Ces cookies peuvent être définis via notre site par nos partenaires publicitaires. Ils peuvent être utilisés par 
                  ces sociétés pour établir un profil de vos intérêts et vous montrer des publicités pertinentes sur d'autres sites.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={savePreferences}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Enregistrer les préférences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsentBanner;
