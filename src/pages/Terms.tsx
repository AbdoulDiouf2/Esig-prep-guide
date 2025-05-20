import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Conditions Générales d'Utilisation</h1>
            
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-600 mb-4">
                Dernière mise à jour : 20 mai 2025
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Bienvenue sur ESIG-prep-guide, une plateforme dédiée à faciliter la transition des étudiants des Classes Préparatoires Scientifiques de Dakar vers l'ESIGELEC à Rouen. Ces conditions d'utilisation régissent votre utilisation de notre plateforme, y compris toutes les fonctionnalités et services associés.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Acceptation des conditions</h2>
              <p className="text-gray-700 mb-4">
                En accédant à notre plateforme ou en l'utilisant, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Modification des conditions</h2>
              <p className="text-gray-700 mb-4">
                Nous nous réservons le droit de modifier ces conditions d'utilisation à tout moment. Toute modification sera effective dès sa publication sur la plateforme. Il est de votre responsabilité de consulter régulièrement ces conditions.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Comptes utilisateurs</h2>
              <p className="text-gray-700 mb-4">
                Pour accéder à certaines fonctionnalités de notre plateforme, vous devrez créer un compte. Vous êtes responsable de maintenir la confidentialité de vos informations de connexion et de toutes les activités qui se produisent sous votre compte.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Utilisation du contenu</h2>
              <p className="text-gray-700 mb-4">
                Le contenu de notre plateforme est fourni à titre informatif uniquement. Nous nous efforçons de fournir des informations précises et à jour, mais nous ne garantissons pas l'exactitude, l'exhaustivité ou la pertinence du contenu.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Propriété intellectuelle</h2>
              <p className="text-gray-700 mb-4">
                Tous les droits de propriété intellectuelle relatifs à notre plateforme et à son contenu appartiennent à ESIG-prep-guide ou à ses concédants de licence. Vous ne pouvez pas utiliser, reproduire, distribuer ou créer des œuvres dérivées de notre contenu sans notre autorisation écrite préalable.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Limitation de responsabilité</h2>
              <p className="text-gray-700 mb-4">
                Dans la mesure permise par la loi, nous ne serons pas responsables des dommages directs, indirects, accessoires, consécutifs ou punitifs résultant de votre utilisation ou de votre incapacité à utiliser notre plateforme.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Contact</h2>
              <p className="text-gray-700 mb-4">
                Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à l'adresse suivante : abdoul.diouf2@groupe-esigelec.org.
              </p>
            </div>
            
            <div className="mt-10 border-t pt-6">
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Retour à la page d'inscription
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
