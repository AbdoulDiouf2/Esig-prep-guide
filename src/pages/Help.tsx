import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  BookOpen, 
  AlertTriangle, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Users,
} from 'lucide-react';

const Help: React.FC = () => {
  const { currentUser } = useAuth();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (id: string) => {
    if (openFaq === id) {
      setOpenFaq(null);
    } else {
      setOpenFaq(id);
    }
  };

  // FAQ avec réponses pour l'aide
  const faqItems = [
    {
      id: 'login',
      question: "Je n'arrive pas à me connecter à mon compte",
      answer: (
        <div>
          <p className="mb-2">Plusieurs raisons peuvent expliquer un problème de connexion :</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Vérifiez que votre adresse e-mail est correctement saisie</li>
            <li>Assurez-vous que votre mot de passe est correct (attention aux majuscules/minuscules)</li>
            <li>Si vous avez oublié votre mot de passe, utilisez l'option "Mot de passe oublié" sur la page de connexion</li>
            <li>Vérifiez votre connexion internet</li>
            <li>Si vous utilisez la connexion Google ou GitHub, assurez-vous d'être connecté à ces services</li>
          </ul>
          <p className="mt-2">Si le problème persiste, vous pouvez <a href="#contact" className="text-blue-600 hover:underline">contacter l'équipe de support</a>.</p>
        </div>
      )
    },
    {
      id: 'resources',
      question: "Comment accéder aux ressources documentaires ?",
      answer: (
        <div>
          <p className="mb-2">Pour accéder aux ressources documentaires :</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Connectez-vous à votre compte</li>
            <li>Cliquez sur "Ressources" dans le menu principal</li>
            <li>Utilisez les filtres pour trouver des documents par phase (Post-CPS, During-Process, Pre-Arrival) ou par catégorie</li>
            <li>Cliquez sur un document pour le prévisualiser</li>
            <li>Utilisez le bouton de téléchargement pour sauvegarder le document sur votre appareil</li>
          </ol>
          <p className="mt-2">Si vous ne trouvez pas une ressource spécifique, utilisez la barre de recherche en haut de la page Ressources.</p>
        </div>
      )
    },
    {
      id: 'faq',
      question: "Comment poser une question dans la FAQ ?",
      answer: (
        <div>
          <p className="mb-2">Pour poser une question dans la FAQ :</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Connectez-vous à votre compte</li>
            <li>Accédez à la page FAQ via le menu principal</li>
            <li>Cliquez sur le bouton "Poser une question"</li>
            <li>Rédigez votre question de manière claire et concise</li>
            <li>Sélectionnez la catégorie et la phase appropriées</li>
            <li>Soumettez votre question</li>
          </ol>
          <p className="mt-2">Une fois soumise, votre question sera examinée par l'équipe d'administration qui y répondra dans les meilleurs délais. Vous recevrez une notification de confirmation immédiatement après la soumission.</p>
          <p className="mt-1 text-sm text-gray-600">Note : Votre identifiant (uid) et votre email sont automatiquement enregistrés avec votre question pour faciliter le suivi.</p>
        </div>
      )
    },
    {
      id: 'phases',
      question: "Quelles sont les différentes phases du parcours ?",
      answer: (
        <div>
          <p className="mb-2">Le parcours est divisé en trois phases principales :</p>
          <ul className="space-y-3 mt-2">
            <li className="p-2 bg-blue-50 rounded-md">
              <span className="font-semibold text-blue-800">Phase Post-CPS :</span>
              <p className="text-gray-700 text-sm mt-1">
                Concerne les étapes juste après avoir reçu votre admission au CPS. 
                Inclut les procédures d'inscription à l'ESIG, les documents à fournir, etc.
              </p>
            </li>
            <li className="p-2 bg-indigo-50 rounded-md">
              <span className="font-semibold text-indigo-800">Phase During-Process :</span>
              <p className="text-gray-700 text-sm mt-1">
                Concerne toutes les démarches administratives : demande de visa, recherche de logement, 
                assurances, préparation financière.
              </p>
            </li>
            <li className="p-2 bg-purple-50 rounded-md">
              <span className="font-semibold text-purple-800">Phase Pre-Arrival :</span>
              <p className="text-gray-700 text-sm mt-1">
                Concerne la préparation à votre arrivée en France et à Rouen : 
                orientation sur le campus, transports locaux, premiers jours en France.
              </p>
            </li>
          </ul>
          <p className="mt-3">Chaque phase contient des ressources, des guides et des FAQ spécifiques pour vous accompagner.</p>
        </div>
      )
    },
    {
      id: 'profile',
      question: "Comment modifier mon profil utilisateur ?",
      answer: (
        <div>
          <p className="mb-2">Pour modifier votre profil :</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Cliquez sur votre nom ou avatar dans le coin supérieur droit</li>
            <li>Sélectionnez "Profil" dans le menu déroulant</li>
            <li>Sur la page de profil, vous pouvez :</li>
            <ul className="list-disc ml-8 mt-1 space-y-1">
              <li>Modifier votre nom d'affichage</li>
              <li>Ajouter ou changer votre photo de profil</li>
              <li>Vérifier votre adresse email</li>
              <li>Modifier votre mot de passe</li>
              <li>Gérer vos préférences de confidentialité</li>
            </ul>
          </ol>
          <p className="mt-2">N'oubliez pas d'enregistrer vos modifications en cliquant sur le bouton "Enregistrer les modifications".</p>
        </div>
      )
    },
    {
      id: 'browser',
      question: "Quels navigateurs sont recommandés pour utiliser la plateforme ?",
      answer: (
        <div>
          <p className="mb-2">ESIG-prep-guide est optimisé pour fonctionner sur les navigateurs modernes. Nous recommandons :</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Google Chrome (version 90+)</li>
            <li>Mozilla Firefox (version 88+)</li>
            <li>Microsoft Edge (version 90+)</li>
            <li>Safari (version 14+)</li>
          </ul>
          <p className="mt-2">Pour une expérience optimale, assurez-vous que votre navigateur est à jour. La plateforme est également responsive et s'adapte aux appareils mobiles et tablettes.</p>
          <p className="mt-2 text-sm text-gray-600">Note : Si vous rencontrez des problèmes d'affichage, essayez de vider le cache de votre navigateur ou d'utiliser un autre navigateur.</p>
        </div>
      )
    },
    {
      id: 'cookies',
      question: "Comment sont utilisés les cookies sur la plateforme ?",
      answer: (
        <div>
          <p className="mb-2">ESIG-prep-guide utilise des cookies pour améliorer votre expérience utilisateur :</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><span className="font-medium">Cookies essentiels</span> : Nécessaires au fonctionnement de la plateforme (authentification, sécurité)</li>
            <li><span className="font-medium">Cookies de préférences</span> : Mémorisent vos préférences pour améliorer votre navigation</li>
            <li><span className="font-medium">Cookies d'analyse</span> : Nous aident à comprendre comment vous utilisez la plateforme pour l'améliorer</li>
          </ul>
          <p className="mt-2">Vous pouvez gérer vos préférences concernant les cookies via la bannière de consentement ou dans les paramètres de votre profil.</p>
          <p className="mt-2">Pour plus d'informations, consultez notre <Link to="/legal/privacy-policy" className="text-blue-600 hover:underline">Politique de confidentialité</Link>.</p>
        </div>
      )
    },
    {
      id: 'alumni',
      question: "Comment accéder à l'annuaire alumni et créer mon profil ?",
      answer: (
        <div>
          <p className="mb-2">L'annuaire alumni vous permet de vous connecter avec les anciens étudiants de l'ESIGELEC :</p>
          <div className="space-y-3 mt-3">
            <div className="bg-purple-50 p-3 rounded-md">
              <h4 className="font-semibold text-purple-800 mb-2">Consulter l'annuaire</h4>
              <ol className="list-decimal ml-5 space-y-1 text-sm">
                <li>Accédez au <Link to="/applications" className="text-purple-600 hover:underline">Centre d'applications</Link></li>
                <li>Cliquez sur la catégorie "Alumni" (affichée par défaut)</li>
                <li>Sélectionnez "Annuaire Alumni"</li>
                <li>Utilisez les filtres pour rechercher par secteur, pays, ville ou année de promotion</li>
              </ol>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <h4 className="font-semibold text-blue-800 mb-2">Créer votre profil alumni</h4>
              <ol className="list-decimal ml-5 space-y-1 text-sm">
                <li>Dans le centre d'applications, catégorie "Alumni"</li>
                <li>Cliquez sur "Mon profil Alumni"</li>
                <li>Remplissez vos informations : entreprise, poste, secteurs, expertises</li>
                <li>Ajoutez vos réseaux sociaux (LinkedIn, GitHub, Twitter)</li>
                <li>Soumettez votre profil pour validation</li>
              </ol>
              <p className="mt-2 text-sm text-gray-600">Une fois approuvé par un administrateur, votre profil sera visible dans l'annuaire.</p>
            </div>
          </div>
          <p className="mt-3">Vous pouvez également accéder au forum et aux webinaires depuis la catégorie Alumni pour échanger avec la communauté.</p>
        </div>
      )
    },
    {
      id: 'alumni-validation',
      question: "Combien de temps prend la validation de mon profil alumni ?",
      answer: (
        <div>
          <p className="mb-2">Le processus de validation de votre profil alumni :</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Votre profil est soumis à un administrateur pour validation</li>
            <li>La validation prend généralement entre 24 et 72 heures</li>
            <li>Vous recevrez une notification par email une fois votre profil approuvé</li>
            <li>En cas de rejet, vous recevrez un email avec les raisons et pourrez modifier votre profil</li>
          </ul>
          <p className="mt-2">Vous pouvez vérifier le statut de votre profil dans le centre d'applications :</p>
          <ul className="list-disc ml-5 space-y-1 mt-1">
            <li><span className="text-yellow-600 font-medium">En attente</span> : Votre profil est en cours de validation</li>
            <li><span className="text-green-600 font-medium">Approuvé</span> : Votre profil est visible dans l'annuaire</li>
            <li><span className="text-red-600 font-medium">Rejeté</span> : Votre profil nécessite des modifications</li>
          </ul>
        </div>
      )
    }
  ];

  // Filtrer les FAQ en fonction de la recherche
  const filteredFaqs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase())
    // Nous ne filtrons pas sur les réponses car elles sont sous forme de JSX
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <HelpCircle className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Centre d'aide</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Comment pouvons-nous vous aider aujourd'hui ?
          </p>
          
          {/* Barre de recherche */}
          <div className="max-w-xl mx-auto mt-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher dans l'aide..."
                className="w-full px-4 py-3 rounded-full pl-12 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Message de bienvenue personnalisé si l'utilisateur est connecté */}
          {currentUser && (
            <div className="mt-4 text-blue-100">
              <p>Bonjour {currentUser.displayName || currentUser.email?.split('@')[0] || 'utilisateur'}, comment pouvons-nous vous aider aujourd'hui?</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Section Rapide */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow border-t-4 border-purple-500">
            <Users className="h-12 w-12 text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">🆕 Annuaire Alumni</h3>
            <p className="text-gray-600 mb-4">
              Découvrez et connectez-vous avec les anciens étudiants.
            </p>
            <Link to="/alumni" className="text-purple-600 hover:underline mt-auto">
              Voir l'annuaire
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <MessageSquare className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">FAQ</h3>
            <p className="text-gray-600 mb-4">
              Trouvez rapidement des réponses aux questions fréquemment posées.
            </p>
            <a href="#faq-section" className="text-blue-600 hover:underline mt-auto">
              Voir les questions fréquentes
            </a>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <BookOpen className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tutoriels</h3>
            <p className="text-gray-600 mb-4">
              Consultez nos guides détaillés pour vous aider à utiliser la plateforme.
            </p>
            <Link to="/tutorial" className="text-blue-600 hover:underline mt-auto">
              Accéder aux tutoriels
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            <Mail className="h-12 w-12 text-indigo-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nous contacter</h3>
            <p className="text-gray-600 mb-4">
              Besoin d'une assistance personnalisée ? Contactez notre équipe.
            </p>
            <a href="#contact" className="text-blue-600 hover:underline mt-auto">
              Voir les options de contact
            </a>
          </div>
        </div>
        
        {/* Section FAQ */}
        <div id="faq-section" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <MessageSquare className="h-6 w-6 text-blue-500 mr-2" />
            Questions fréquemment posées
          </h2>
          
          <div className="divide-y divide-gray-200">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item) => (
                <div key={item.id} className="py-4">
                  <button
                    className="flex justify-between items-center w-full text-left focus:outline-none"
                    onClick={() => toggleFaq(item.id)}
                  >
                    <h3 className="text-lg font-medium text-gray-900">{item.question}</h3>
                    {openFaq === item.id ? (
                      <ChevronUp className="h-5 w-5 text-blue-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-blue-500" />
                    )}
                  </button>
                  
                  {openFaq === item.id && (
                    <div className="mt-3 text-gray-700 bg-gray-50 p-4 rounded-md">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-4 text-center">
                <p className="text-gray-500">Aucun résultat pour "{searchQuery}"</p>
                <p className="text-sm text-gray-400 mt-1">Essayez une autre recherche ou consultez les questions ci-dessous</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Section Dépannage */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
            Guide de dépannage courant
          </h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Problèmes de chargement de page</h3>
              <p className="text-gray-700 mb-2">
                Si une page ne se charge pas correctement ou affiche une erreur :
              </p>
              <ol className="list-decimal ml-5 space-y-1 text-gray-700">
                <li>Rafraîchissez la page (F5 ou CTRL+R)</li>
                <li>Vérifiez votre connexion internet</li>
                <li>Essayez de vider le cache de votre navigateur</li>
                <li>Si le problème persiste, déconnectez-vous puis reconnectez-vous</li>
              </ol>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Problèmes de téléchargement de documents</h3>
              <p className="text-gray-700 mb-2">
                Si vous ne parvenez pas à télécharger un document :
              </p>
              <ol className="list-decimal ml-5 space-y-1 text-gray-700">
                <li>Vérifiez que vous disposez de suffisamment d'espace sur votre appareil</li>
                <li>Assurez-vous que votre navigateur n'a pas bloqué le téléchargement</li>
                <li>Essayez d'utiliser un autre navigateur</li>
                <li>Si vous utilisez un appareil mobile, essayez depuis un ordinateur</li>
              </ol>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email de vérification non reçu</h3>
              <p className="text-gray-700 mb-2">
                Si vous n'avez pas reçu l'email de vérification :
              </p>
              <ol className="list-decimal ml-5 space-y-1 text-gray-700">
                <li>Vérifiez votre dossier de spam ou de courrier indésirable</li>
                <li>Assurez-vous que l'adresse email saisie est correcte</li>
                <li>Cliquez sur "Renvoyer l'email de vérification" dans votre profil</li>
                <li>Si le problème persiste après plusieurs tentatives, contactez le support</li>
              </ol>
            </div>
          </div>
        </div>
        
        {/* Section Contact */}
        <div id="contact" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Mail className="h-6 w-6 text-blue-500 mr-2" />
            Nous contacter
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-5 rounded-lg">
              <Mail className="h-8 w-8 text-blue-500 mb-3" />
              <h3 className="text-lg font-medium text-blue-800 mb-2">Par email</h3>
              <p className="text-gray-700 mb-3">
                Pour toute question ou demande d'assistance, vous pouvez nous contacter par email.
                Nous répondons généralement dans un délai de 24 à 48 heures.
              </p>
              <a href="mailto:support@esig-prep-guide.com" className="inline-flex items-center text-blue-600 hover:underline">
                abdoul.diouf2@groupe-esigelec.org
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
            
            <div className="bg-purple-50 p-5 rounded-lg">
              <Phone className="h-8 w-8 text-purple-500 mb-3" />
              <h3 className="text-lg font-medium text-purple-800 mb-2">Par téléphone</h3>
              <p className="text-gray-700 mb-3">
                Pour une assistance immédiate, vous pouvez nous appeler pendant nos heures d'ouverture
                (Lundi au Vendredi, 13h - 14h / 17h - 20h GMT+0).
              </p>
              <a href="tel:+33749051879" className="inline-flex items-center text-purple-600 hover:underline">
                +33 7 49 05 18 79
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
          
          <div className="mt-6 bg-gray-50 p-5 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-2">FAQ Interactive</h3>
            <p className="text-gray-700 mb-3">
              N'oubliez pas que vous pouvez également poser vos questions directement via notre système de FAQ.
              Vous recevrez une réponse personnalisée de notre équipe.
            </p>
            <Link to="/faq" className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Accéder à la FAQ
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
        
        {/* Ressources additionnelles */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <BookOpen className="h-6 w-6 text-green-500 mr-2" />
            Ressources additionnelles
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <a href="https://www.esigelec.fr/" target="_blank" rel="noopener noreferrer" className="group">
              <div className="bg-gray-50 p-5 rounded-lg hover:shadow-md transition-shadow flex flex-col h-full">
                <h3 className="text-lg font-medium text-gray-800 mb-2 group-hover:text-blue-600">Site officiel ESIGELEC</h3>
                <p className="text-gray-700 mb-3 flex-grow">
                  Consultez le site officiel de l'ESIGELEC pour des informations actualisées sur l'école.
                </p>
                <div className="inline-flex items-center text-blue-600">
                  Visiter le site
                  <ExternalLink className="h-4 w-4 ml-1" />
                </div>
              </div>
            </a>
            
            <a href="https://www.campusfrance.org/fr" target="_blank" rel="noopener noreferrer" className="group">
              <div className="bg-gray-50 p-5 rounded-lg hover:shadow-md transition-shadow flex flex-col h-full">
                <h3 className="text-lg font-medium text-gray-800 mb-2 group-hover:text-blue-600">Campus France</h3>
                <p className="text-gray-700 mb-3 flex-grow">
                  Informations sur les études en France et les procédures de visa pour les étudiants internationaux.
                </p>
                <div className="inline-flex items-center text-blue-600">
                  Visiter Campus France
                  <ExternalLink className="h-4 w-4 ml-1" />
                </div>
              </div>
            </a>
            
            <a href="https://france-visas.gouv.fr/" target="_blank" rel="noopener noreferrer" className="group">
              <div className="bg-gray-50 p-5 rounded-lg hover:shadow-md transition-shadow flex flex-col h-full">
                <h3 className="text-lg font-medium text-gray-800 mb-2 group-hover:text-blue-600">France-Visas</h3>
                <p className="text-gray-700 mb-3 flex-grow">
                  Site officiel des visas pour la France avec informations détaillées sur les procédures.
                </p>
                <div className="inline-flex items-center text-blue-600">
                  Visiter France-Visas
                  <ExternalLink className="h-4 w-4 ml-1" />
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour l'icône ChevronRight
const ChevronRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

export default Help;
