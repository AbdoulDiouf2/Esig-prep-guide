import React from 'react';
import { Wrench, Clock, Mail } from 'lucide-react';

const Maintenance: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center min-h-screen">
        <div className="w-full">
        {/* Icône animée */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-8">
              <Wrench className="w-16 h-16 text-white animate-bounce" />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Maintenance en cours
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Nous améliorons votre expérience ! 🚀
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8 text-left">
            <div className="flex items-start">
              <Clock className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Que se passe-t-il ?
                </h3>
                <p className="text-gray-700">
                  Notre équipe effectue actuellement des opérations de maintenance pour améliorer 
                  les performances et ajouter de nouvelles fonctionnalités à la plateforme CPS Connect.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg mb-8 text-left">
            <div className="flex items-start">
              <Mail className="w-6 h-6 text-purple-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Besoin d'aide ?
                </h3>
                <p className="text-gray-700 mb-2">
                  Si vous avez des questions urgentes, n'hésitez pas à nous contacter :
                </p>
                <a 
                  href="mailto:abdoul.diouf2@groupe-esigelec.org" 
                  className="text-purple-600 hover:text-purple-700 font-medium underline"
                >
                  abdoul.diouf2@groupe-esigelec.org
                </a>
              </div>
            </div>
          </div>

          {/* Animation de chargement */}
          <div className="flex justify-center items-center space-x-2 mb-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          <p className="text-gray-500 text-sm">
            Merci pour votre patience ! Nous serons de retour très bientôt.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            © {new Date().getFullYear()} CPS Connect - Tous droits réservés
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
