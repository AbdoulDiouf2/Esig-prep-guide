import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, MapPin, FileText, MessageSquare, User, Download, Search, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserTutorial: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white py-8">
        <div className="container mx-auto px-4 flex items-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-100 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </button>
          <h1 className="text-2xl font-bold">Guide d'utilisation - ESIG-prep-guide</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-700 mb-4">Bienvenue dans votre guide ESIG-prep-guide</h2>
          <p className="text-gray-700 mb-4">
            Cette plateforme a été conçue pour vous accompagner dans toutes les étapes de votre parcours, 
            depuis l'admission à l'ESIG jusqu'à votre arrivée à Rouen. Découvrez comment utiliser 
            efficacement les différentes fonctionnalités à votre disposition.
          </p>
          
          {currentUser && (
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <p className="text-blue-700">
                <span className="font-bold">Connecté en tant que:</span> {currentUser.email} {currentUser.displayName ? `(${currentUser.displayName})` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-700 mb-4">Sommaire</h3>
          <ul className="space-y-2">
            <li>
              <a href="#navigation" className="text-blue-600 hover:underline">1. Navigation par phase</a>
            </li>
            <li>
              <a href="#resources" className="text-blue-600 hover:underline">2. Ressources documentaires</a>
            </li>
            <li>
              <a href="#faq" className="text-blue-600 hover:underline">3. Foire aux questions (FAQ)</a>
            </li>
            <li>
              <a href="#profile" className="text-blue-600 hover:underline">4. Gestion de votre profil</a>
            </li>
            <li>
              <a href="#tips" className="text-blue-600 hover:underline">5. Conseils pratiques</a>
            </li>
          </ul>
        </div>

        {/* Navigation Section */}
        <div id="navigation" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <MapPin className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-blue-700">1. Navigation par phase</h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            Le parcours est organisé en trois phases distinctes pour vous guider pas à pas.
            Chaque phase contient des ressources spécifiques adaptées à votre progression.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-5">
              <h4 className="font-semibold text-blue-800 mb-2">Phase Post-CPS</h4>
              <p className="text-gray-700 mb-3">
                Pour les étudiants venant de recevoir leur admission au CPS. 
                Vous y trouverez des informations sur les premières démarches à effectuer.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Procédures d'inscription</li>
                <li>Documents à fournir</li>
                <li>Préparation académique</li>
              </ul>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-5">
              <h4 className="font-semibold text-indigo-800 mb-2">Phase During-Process</h4>
              <p className="text-gray-700 mb-3">
                Pour les démarches administratives en cours (visa, logement, assurances).
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Guides pour les démarches consulaires</li>
                <li>Check-lists pour les documents de visa</li>
                <li>Options de logement</li>
                <li>Assurances et finances</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-5">
              <h4 className="font-semibold text-purple-800 mb-2">Phase Pre-Arrival</h4>
              <p className="text-gray-700 mb-3">
                Pour préparer votre arrivée en France et à l'ESIG.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Guides d'orientation du campus</li>
                <li>Transports locaux à Rouen</li>
                <li>Conseils d'intégration</li>
                <li>Démarches à l'arrivée</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-gray-800 flex items-center">
              <HelpCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span>
                <strong>Astuce :</strong> Concentrez-vous d'abord sur la phase qui correspond à votre 
                situation actuelle, mais n'hésitez pas à consulter les autres phases pour anticiper 
                les prochaines étapes.
              </span>
            </p>
          </div>
        </div>

        {/* Resources Section */}
        <div id="resources" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-blue-700">2. Ressources documentaires</h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            La bibliothèque de ressources contient tous les documents essentiels pour vos démarches.
            Vous pouvez facilement explorer, prévisualiser et télécharger ces ressources.
          </p>
          
          <div className="space-y-5 mb-6">
            <div className="flex border-l-4 border-blue-500 pl-4">
              <div className="flex-shrink-0 mr-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 mb-1">Rechercher des ressources</h4>
                <p className="text-gray-700">
                  Utilisez la barre de recherche pour trouver rapidement des documents en fonction de mots-clés.
                  Vous pouvez également filtrer par catégorie ou par phase.
                </p>
              </div>
            </div>
            
            <div className="flex border-l-4 border-blue-500 pl-4">
              <div className="flex-shrink-0 mr-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 mb-1">Prévisualiser les documents</h4>
                <p className="text-gray-700">
                  Cliquez sur un document pour le prévisualiser directement dans l'interface sans avoir à le télécharger.
                  Cela vous permet de vérifier rapidement si le document répond à vos besoins.
                </p>
              </div>
            </div>
            
            <div className="flex border-l-4 border-blue-500 pl-4">
              <div className="flex-shrink-0 mr-4">
                <Download className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 mb-1">Télécharger des ressources</h4>
                <p className="text-gray-700">
                  Pour conserver un document ou l'imprimer, utilisez le bouton de téléchargement.
                  Les documents sont disponibles dans divers formats (PDF, Word, Excel, etc.).
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-2">Types de ressources disponibles</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="list-disc list-inside text-gray-700">
                <li>Formulaires administratifs</li>
                <li>Guides pratiques</li>
                <li>Check-lists par étape</li>
                <li>Modèles de documents</li>
              </ul>
              <ul className="list-disc list-inside text-gray-700">
                <li>Cartes et plans</li>
                <li>Calendriers académiques</li>
                <li>Ressources d'apprentissage</li>
                <li>Liens vers des sites officiels</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-blue-700">3. Foire aux questions (FAQ)</h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            La section FAQ répond aux questions les plus fréquentes. Si vous ne trouvez pas la réponse à votre question,
            vous pouvez soumettre votre propre question qui sera traitée par l'équipe.
          </p>
          
          <div className="space-y-6 mb-6">
            <div className="bg-blue-50 p-5 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-3">Comment utiliser la FAQ ?</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Explorez les questions existantes filtrées par catégorie ou phase</li>
                <li>Utilisez la barre de recherche pour trouver rapidement une information spécifique</li>
                <li>Cliquez sur une question pour afficher sa réponse complète</li>
                <li>Si vous ne trouvez pas l'information recherchée, posez votre propre question</li>
              </ol>
            </div>
            
            <div className="bg-green-50 p-5 rounded-lg">
              <h4 className="font-semibold text-green-700 mb-3">Comment poser une question ?</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Cliquez sur le bouton "Poser une question"</li>
                <li>Rédigez votre question de manière claire et précise</li>
                <li>Sélectionnez la catégorie et la phase appropriées</li>
                <li>Soumettez votre question</li>
                <li>Vous recevrez une confirmation que votre question a bien été enregistrée</li>
                <li>Une fois traitée par l'équipe, vous verrez la réponse dans la section "Mes questions"</li>
              </ol>
              <p className="mt-3 text-gray-700 italic">
                Note : Votre identifiant et votre email sont automatiquement enregistrés avec votre question pour permettre le suivi.
              </p>
            </div>
            
            <div className="bg-indigo-50 p-5 rounded-lg">
              <h4 className="font-semibold text-indigo-700 mb-3">Suivi de vos questions</h4>
              <p className="text-gray-700 mb-3">
                Vous pouvez suivre l'état de vos questions dans l'onglet "Mes questions" de la section FAQ.
                Les questions y sont organisées en deux catégories :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Questions répondues</strong> : Questions qui ont reçu une réponse de l'équipe</li>
                <li><strong>Questions en attente</strong> : Questions soumises mais pas encore traitées</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div id="profile" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <User className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-blue-700">4. Gestion de votre profil</h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            Personnalisez votre profil pour une expérience adaptée à vos besoins.
            Vous pouvez modifier vos informations et gérer vos préférences à tout moment.
          </p>
          
          <div className="space-y-5 mb-6">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-blue-700 mb-1">Informations personnelles</h4>
              <p className="text-gray-700">
                Vous pouvez personnaliser votre nom d'utilisateur et ajouter une photo de profil
                pour mieux vous identifier sur la plateforme.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-blue-700 mb-1">Sécurité du compte</h4>
              <p className="text-gray-700">
                Vérifiez votre adresse email pour sécuriser votre compte et activer toutes les fonctionnalités.
                Vous pouvez également modifier votre mot de passe depuis l'écran de profil.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-blue-700 mb-1">Préférences de confidentialité</h4>
              <p className="text-gray-700">
                Gérez vos préférences concernant les cookies et l'utilisation de vos données
                via le panneau de préférences de confidentialité.
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-5 rounded-md">
            <h4 className="font-semibold text-yellow-700 mb-2">Accéder à votre profil</h4>
            <p className="text-gray-700">
              Pour accéder à votre profil, cliquez sur votre nom ou votre avatar dans le coin supérieur droit de la page,
              puis sélectionnez "Profil" dans le menu déroulant.
            </p>
          </div>
        </div>

        {/* Tips Section */}
        <div id="tips" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-blue-700">5. Conseils pratiques</h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            Voici quelques conseils pour tirer le meilleur parti de la plateforme et faciliter votre parcours.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Pour la préparation</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Commencez par explorer la phase qui correspond à votre situation actuelle</li>
                <li>Consultez les check-lists pour vous assurer de n'oublier aucune étape importante</li>
                <li>Téléchargez et conservez les documents officiels dans un dossier dédié</li>
                <li>Préparez vos questions à l'avance en notant vos incertitudes</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Pour les démarches</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Respectez scrupuleusement les délais indiqués pour chaque procédure</li>
                <li>Conservez des copies numériques de tous vos documents importants</li>
                <li>N'hésitez pas à poser des questions spécifiques via la FAQ</li>
                <li>Consultez régulièrement la plateforme pour les mises à jour des informations</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-5 rounded-lg">
            <h4 className="font-semibold text-blue-700 mb-3">Communauté et entraide</h4>
            <p className="text-gray-700 mb-3">
              N'oubliez pas que vous faites partie d'une communauté d'étudiants partageant le même parcours.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Consultez les questions déjà posées par d'autres étudiants</li>
              <li>Partagez votre expérience et vos conseils quand vous avez franchi une étape</li>
              <li>Entrez en contact avec les étudiants des promotions précédentes pour des conseils personnalisés</li>
              <li>N'hésitez pas à suggérer des améliorations ou de nouvelles ressources</li>
            </ul>
          </div>
        </div>

        {/* Conclusion */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-blue-700 mb-4">Prêt à démarrer votre parcours</h3>
          <p className="text-gray-700 mb-4">
            Vous disposez maintenant de toutes les informations nécessaires pour utiliser efficacement la plateforme ESIG-prep-guide.
            N'hésitez pas à revenir consulter ce tutoriel chaque fois que vous en aurez besoin.
          </p>
          <p className="text-gray-700 mb-6">
            Ce guide sera régulièrement mis à jour pour refléter les évolutions de la plateforme et les retours des utilisateurs.
          </p>
          <div className="mt-6 text-center">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTutorial;
