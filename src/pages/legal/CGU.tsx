import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Shield, UserCheck, AlertTriangle } from 'lucide-react';

const CGU: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 text-center">Conditions Générales d'Utilisation</h1>
          <p className="text-blue-100 text-center max-w-2xl mx-auto">
            Ce document définit les règles d'utilisation de notre plateforme. Nous vous invitons à le lire attentivement.
          </p>
          <div className="flex justify-center mt-6">
            <Link 
              to="/" 
              className="flex items-center text-blue-100 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-md"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 max-w-4xl mx-auto border border-gray-100">
          <div className="prose max-w-none">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">1. Introduction</h2>
            </div>
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après dénommées "CGU") encadrent l'utilisation de la plateforme ESIG-prep-guide (ci-après dénommée "la Plateforme") mise à disposition par [Votre Nom/Organisation], à destination des étudiants et futurs étudiants de l'ESIGELEC.
            </p>
            <p>
              En utilisant la Plateforme, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la Plateforme.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">2. Description du service</h2>
            </div>
            <p>
              La Plateforme ESIG-prep-guide est un outil d'aide et d'accompagnement destiné aux étudiants et futurs étudiants de l'ESIGELEC. Elle fournit des informations, des ressources et des guides pour faciliter les démarches liées aux études à l'ESIGELEC.
            </p>
            <p>
              La Plateforme propose notamment :
            </p>
            <ul>
              <li>Des guides d'information pour les différentes phases du parcours étudiant (post-admission, pendant les démarches, pré-arrivée)</li>
              <li>Une bibliothèque de ressources documentaires</li>
              <li>Une section FAQ permettant aux utilisateurs de poser des questions et de consulter les réponses</li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <UserCheck className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">3. Accès au service</h2>
            </div>
            <p>
              La Plateforme est accessible gratuitement à tout utilisateur disposant d'un accès à Internet. Tous les frais liés à l'accès à la Plateforme (matériel informatique, logiciels, connexion Internet, etc.) sont à la charge de l'utilisateur.
            </p>
            <p>
              Certaines fonctionnalités de la Plateforme nécessitent une inscription préalable. L'utilisateur s'engage à fournir des informations exactes et à jour lors de son inscription.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">4. Propriété intellectuelle</h2>
            </div>
            <p>
              L'ensemble des éléments constituant la Plateforme (textes, graphismes, logiciels, images, sons, plans, etc.) est la propriété exclusive de [Votre Nom/Organisation] ou fait l'objet d'une autorisation d'utilisation. Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de la Plateforme, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
            </p>
            <p>
              Les marques et logos présents sur la Plateforme sont la propriété de leurs détenteurs respectifs. Toute reproduction sans autorisation préalable est interdite.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">5. Responsabilités</h2>
            </div>
            <p>
              Les informations fournies sur la Plateforme le sont à titre informatif. [Votre Nom/Organisation] s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées, mais ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur la Plateforme.
            </p>
            <p>
              [Votre Nom/Organisation] ne saurait être tenu responsable :
            </p>
            <ul>
              <li>Des éventuelles interruptions de la Plateforme pour des raisons de maintenance ou autres</li>
              <li>Des erreurs, inexactitudes ou omissions dans les informations fournies</li>
              <li>Des conséquences de l'utilisation de la Plateforme</li>
              <li>De tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations mises à disposition sur la Plateforme</li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <UserCheck className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">6. Obligations de l'utilisateur</h2>
            </div>
            <p>
              En utilisant la Plateforme, l'utilisateur s'engage à :
            </p>
            <ul>
              <li>Ne pas utiliser la Plateforme à des fins illégales ou interdites par les présentes CGU</li>
              <li>Ne pas tenter de perturber le bon fonctionnement de la Plateforme</li>
              <li>Ne pas diffuser de contenu illégal, préjudiciable, menaçant, injurieux, harcelant, diffamatoire, vulgaire, obscène, contraire aux bonnes mœurs, portant atteinte à la vie privée d'une personne ou contrevenant aux lois en vigueur</li>
              <li>Ne pas collecter ou stocker des données personnelles concernant d'autres utilisateurs</li>
              <li>Ne pas usurper l'identité d'une autre personne ou entité</li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">7. Modification des CGU</h2>
            </div>
            <p>
              [Votre Nom/Organisation] se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par tout moyen approprié. L'utilisation continue de la Plateforme après modification des CGU vaut acceptation des nouvelles conditions.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">8. Droit applicable et juridiction compétente</h2>
            </div>
            <p>
              Les présentes CGU sont soumises au droit français. En cas de litige non résolu à l'amiable, les tribunaux français seront seuls compétents.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <UserCheck className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">9. Contact</h2>
            </div>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez contacter [Votre Nom/Organisation] à l'adresse suivante : [Votre adresse email].
            </p>

            <div className="mt-12 pt-4 border-t border-gray-100">
              <div className="bg-blue-50 rounded-lg p-4 flex items-start"> 
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Document légal important</p>
                  <p className="text-sm text-blue-700 mt-1">Ces conditions générales d'utilisation constituent un contrat juridiquement contraignant entre vous et notre service. En utilisant notre plateforme, vous acceptez ces conditions.</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-6 text-center">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CGU;
