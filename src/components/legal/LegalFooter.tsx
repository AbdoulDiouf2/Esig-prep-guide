import React from 'react';
import { Link } from 'react-router-dom';

const LegalFooter: React.FC = () => {
  return (
    <div className="bg-gray-100 py-3 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center text-xs text-gray-500 gap-4">
          <Link to="/legal/cgu" className="hover:text-gray-700 hover:underline">
            Conditions Générales d'Utilisation
          </Link>
          <Link to="/legal/privacy-policy" className="hover:text-gray-700 hover:underline">
            Politique de Confidentialité
          </Link>
          <Link to="/legal/legal-notice" className="hover:text-gray-700 hover:underline">
            Mentions Légales
          </Link>
          <Link to="/legal/moderation-charter" className="hover:text-gray-700 hover:underline">
            Charte de Modération
          </Link>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              // Réinitialiser le consentement pour afficher à nouveau la bannière
              localStorage.removeItem('cookieConsent');
              window.location.reload();
            }}
            className="hover:text-gray-700 hover:underline cursor-pointer"
          >
            Paramètres des cookies
          </a>
        </div>
      </div>
    </div>
  );
};

export default LegalFooter;
