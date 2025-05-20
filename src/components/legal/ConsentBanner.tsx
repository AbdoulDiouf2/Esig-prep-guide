import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

// Type pour les préférences de consentement
export type ConsentPreferences = {
  essential: boolean; // Toujours true, cookies essentiels
  analytics: boolean;
  marketing: boolean;
  acceptedAt: Date | null;
};

const ConsentBanner: React.FC = () => {
  // État local pour stocker les préférences de consentement
  const [consentPreferences, setConsentPreferences] = useState<ConsentPreferences>({
    essential: true, // Toujours true car essentiel
    analytics: false,
    marketing: false,
    acceptedAt: null,
  });
  
  // État pour contrôler l'affichage de la bannière principale et du panneau détaillé
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Initialisation - vérifier si le consentement existe déjà
  useEffect(() => {
    const savedConsent = localStorage.getItem('cookieConsent');
    if (savedConsent) {
      try {
        const parsedConsent = JSON.parse(savedConsent);
        setConsentPreferences({
          ...parsedConsent,
          acceptedAt: parsedConsent.acceptedAt ? new Date(parsedConsent.acceptedAt) : null
        });
        // Bannière déjà acceptée, ne pas l'afficher
        setShowBanner(false);
      } catch (error) {
        console.error('Erreur lors de la lecture du consentement:', error);
        setShowBanner(true);
      }
    } else {
      // Pas de consentement enregistré, afficher la bannière
      setShowBanner(true);
    }
  }, []);
  
  // Gérer le changement de préférence pour un type de cookie spécifique
  const handlePreferenceChange = (type: 'analytics' | 'marketing') => {
    setConsentPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  // Accepter tous les cookies
  const acceptAll = () => {
    const newPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      acceptedAt: new Date(),
    };
    setConsentPreferences(newPreferences);
    saveConsent(newPreferences);
    setShowBanner(false);
    setShowDetails(false);
  };
  
  // Accepter uniquement les cookies essentiels
  const acceptEssential = () => {
    const newPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      acceptedAt: new Date(),
    };
    setConsentPreferences(newPreferences);
    saveConsent(newPreferences);
    setShowBanner(false);
    setShowDetails(false);
  };
  
  // Sauvegarder les préférences personnalisées
  const savePreferences = () => {
    const updatedPreferences = {
      ...consentPreferences,
      acceptedAt: new Date(),
    };
    setConsentPreferences(updatedPreferences);
    saveConsent(updatedPreferences);
    setShowBanner(false);
    setShowDetails(false);
  };
  
  // Stocker le consentement dans localStorage
  const saveConsent = (preferences: ConsentPreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    
    // Ici, vous pourriez implémenter un appel à votre système d'analytics
    // pour respecter les préférences de l'utilisateur
    if (preferences.analytics) {
      // Activer Google Analytics, Matomo, etc.
      console.log('Analytics activé');
    }
    
    if (preferences.marketing) {
      // Activer les cookies marketing
      console.log('Marketing activé');
    }
  };
  
  // Si la bannière ne doit pas être affichée, ne rien rendre
  if (!showBanner && !showDetails) {
    return null;
  }
  
  return (
    <>
      {/* Overlay semi-transparent quand les détails sont affichés */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}
      
      {/* Bannière principale de consentement */}
      {showBanner && !showDetails && (
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
                  Ils sont généralement définis en réponse à des actions que vous effectuez, comme définir vos préférences de confidentialité, 
                  vous connecter ou remplir des formulaires.
                </p>
              </div>
              
              {/* Cookies d'analyse */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Cookies d'analyse</h3>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      checked={consentPreferences.analytics} 
                      onChange={() => handlePreferenceChange('analytics')}
                      className={`absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer right-0 z-10 transition-all duration-300 ${consentPreferences.analytics ? 'border-white' : 'border-gray-300'}`}
                    />
                    <label 
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-all duration-300 ${
                        consentPreferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Ces cookies nous permettent de compter les visites et les sources de trafic afin de mesurer et d'améliorer 
                  les performances de notre site. Ils nous aident à savoir quelles pages sont les plus et les moins populaires, 
                  et à voir comment les visiteurs se déplacent sur le site.
                </p>
              </div>
              
              {/* Cookies marketing */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Cookies marketing</h3>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      checked={consentPreferences.marketing} 
                      onChange={() => handlePreferenceChange('marketing')}
                      className={`absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer right-0 z-10 transition-all duration-300 ${consentPreferences.marketing ? 'border-white' : 'border-gray-300'}`}
                    />
                    <label 
                      className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-all duration-300 ${
                        consentPreferences.marketing ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Ces cookies peuvent être définis via notre site par nos partenaires publicitaires. 
                  Ils peuvent être utilisés pour établir un profil de vos intérêts et vous proposer des 
                  publicités pertinentes sur d'autres sites.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
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
                Enregistrer mes préférences
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Styles CSS incorporés dans les classes Tailwind */}
      {/* Les styles pour les toggles sont appliqués directement via les classes conditionnelles */}
    </>
  );
};

export default ConsentBanner;
