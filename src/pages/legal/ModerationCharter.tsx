import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ShieldCheck, AlertTriangle, Users, FileText, Eye, Flag, HelpCircle, Clock } from 'lucide-react';

const ModerationCharter: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 p-3 rounded-full">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 text-center">Charte de Modération</h1>
          <p className="text-blue-100 text-center max-w-2xl mx-auto">
            Règles de bonne conduite pour les interactions sur notre plateforme ESIG-prep-guide.
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
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">1. Introduction</h2>
            </div>
            <p>
              La présente Charte de Modération définit les règles de bonne conduite applicables aux interactions sur la plateforme ESIG-prep-guide (ci-après "la Plateforme"), notamment en ce qui concerne les questions posées dans la section FAQ et tout autre contenu généré par les utilisateurs.
            </p>
            <p>
              Cette charte vise à garantir un environnement respectueux et constructif pour tous les utilisateurs de la Plateforme.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">2. Principes généraux</h2>
            </div>
            <p>
              Tous les contenus publiés sur la Plateforme doivent respecter les principes suivants :
            </p>
            <ul>
              <li>Respect mutuel entre les utilisateurs</li>
              <li>Pertinence par rapport aux thématiques de la Plateforme</li>
              <li>Exactitude et véracité des informations partagées</li>
              <li>Respect des lois et règlements en vigueur</li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">3. Contenus prohibés</h2>
            </div>
            <p>
              Sont formellement interdits les contenus :
            </p>
            <ul>
              <li>À caractère injurieux, diffamatoire, raciste, xénophobe, homophobe, sexiste ou discriminatoire</li>
              <li>Incitant à la haine, à la violence ou au harcèlement envers une personne ou un groupe</li>
              <li>À caractère pornographique, obscène ou choquant</li>
              <li>Violant les droits de propriété intellectuelle d'autrui</li>
              <li>Comportant des informations personnelles d'un tiers sans son consentement</li>
              <li>Faisant la promotion d'activités illégales</li>
              <li>Comportant des liens vers des sites malveillants ou frauduleux</li>
              <li>Consistant en du spam ou des messages répétitifs</li>
              <li>Hors sujet ou sans rapport avec les thématiques de la Plateforme</li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Eye className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">4. Procédure de modération</h2>
            </div>
            <p>
              La modération des contenus sur la Plateforme s'effectue de la manière suivante :
            </p>
            <ul>
              <li><strong>Modération a priori</strong> : les questions posées dans la section FAQ sont examinées par l'équipe de modération avant leur publication</li>
              <li><strong>Signalement</strong> : les utilisateurs peuvent signaler tout contenu qu'ils jugent inapproprié</li>
              <li><strong>Suppression</strong> : les contenus ne respectant pas la présente charte peuvent être supprimés sans préavis</li>
              <li><strong>Sanctions</strong> : en cas de violations répétées, des mesures peuvent être prises à l'encontre des utilisateurs concernés (avertissement, suspension temporaire, suppression du compte)</li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">5. Bonnes pratiques recommandées</h2>
            </div>
            <p>
              Pour contribuer positivement à la Plateforme, nous encourageons les utilisateurs à :
            </p>
            <ul>
              <li>Formuler des questions claires et précises</li>
              <li>Utiliser un langage correct et respectueux</li>
              <li>Vérifier que leur question n'a pas déjà été posée</li>
              <li>Catégoriser correctement leur question (phase, catégorie)</li>
              <li>Fournir les informations nécessaires à la compréhension de leur question</li>
              <li>Partager leur expérience de manière constructive</li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">6. Rôle des modérateurs</h2>
            </div>
            <p>
              Les modérateurs de la Plateforme ont pour mission de :
            </p>
            <ul>
              <li>Veiller au respect de la présente charte</li>
              <li>Examiner les contenus signalés par les utilisateurs</li>
              <li>Prendre les mesures appropriées en cas de non-respect des règles</li>
              <li>Répondre aux questions des utilisateurs concernant la modération</li>
              <li>Faire évoluer la présente charte si nécessaire</li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Flag className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">7. Contestation d'une décision de modération</h2>
            </div>
            <p>
              Si vous contestez une décision de modération, vous pouvez contacter l'équipe de modération à l'adresse suivante : [Votre adresse email].
            </p>
            <p>
              Votre demande sera examinée dans les meilleurs délais.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">8. Modification de la charte</h2>
            </div>
            <p>
              La présente charte peut être modifiée à tout moment. Les utilisateurs seront informés des modifications par tout moyen approprié.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">9. Contact</h2>
            </div>
            <p>
              Pour toute question concernant cette charte de modération, vous pouvez contacter l'équipe de modération à l'adresse suivante : [Votre adresse email].
            </p>

            <div className="mt-12 pt-4 border-t border-gray-100">
              <div className="bg-blue-50 rounded-lg p-4 flex items-start"> 
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Règles de la communauté</p>
                  <p className="text-sm text-blue-700 mt-1">Cette charte de modération vise à maintenir un environnement d'échanges respectueux et constructif. En utilisant notre plateforme, vous vous engagez à respecter ces règles pour le bénéfice de tous les utilisateurs.</p>
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

export default ModerationCharter;
