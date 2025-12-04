import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, HelpCircle, FileText, Activity, PieChart, Settings, BookOpen, Cloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminTutorial: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4 flex items-center">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-100 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </button>
          <h1 className="text-2xl font-bold">Guide d'administration</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Bienvenue dans l'interface d'administration d'ESIG-prep-guide</h2>
          <p className="text-gray-700 mb-4">
            Ce guide vous aidera à comprendre les différentes fonctionnalités de l'interface d'administration et comment les utiliser efficacement.
            En tant qu'administrateur, vous avez la responsabilité de gérer le contenu du guide, les ressources, les questions FAQ et les utilisateurs.
          </p>
          
          {currentUser && (
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <p className="text-blue-800">
                <span className="font-bold">Connecté en tant que:</span> {currentUser.email} {currentUser.displayName ? `(${currentUser.displayName})` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-800 mb-4">Sommaire</h3>
          <ul className="space-y-2">
            <li>
              <a href="#dashboard" className="text-blue-600 hover:underline">1. Tableau de bord</a>
            </li>
            <li>
              <a href="#alumni" className="text-purple-600 hover:underline font-semibold">🆕 2. Gestion des profils Alumni</a>
            </li>
            <li>
              <a href="#content" className="text-blue-600 hover:underline">3. Gestion du contenu du guide</a>
            </li>
            <li>
              <a href="#faq" className="text-blue-600 hover:underline">4. Gestion des FAQ</a>
            </li>
            <li>
              <a href="#resources" className="text-blue-600 hover:underline">5. Gestion des ressources</a>
            </li>
            <li>
              <a href="#dropbox" className="text-blue-600 hover:underline">6. Gestionnaire Dropbox</a>
            </li>
            <li>
              <a href="#users" className="text-blue-600 hover:underline">7. Gestion des utilisateurs</a>
            </li>
            <li>
              <a href="#activity" className="text-blue-600 hover:underline">8. Journal d'activité</a>
            </li>
            <li>
              <a href="#tips" className="text-blue-600 hover:underline">9. Conseils et bonnes pratiques</a>
            </li>
          </ul>
        </div>

        {/* Alumni Section - NEW */}
        <div id="alumni" className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-purple-500">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-purple-700 mr-2" />
            <h3 className="text-lg font-bold text-purple-800">🆕 2. Gestion des profils Alumni</h3>
          </div>
          
          <div className="border-l-4 border-purple-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              La gestion des profils alumni est une nouvelle fonctionnalité majeure qui vous permet de valider, gérer et analyser les profils des anciens étudiants de l'ESIGELEC.
            </p>
            
            <h4 className="font-semibold text-purple-700 mb-3">Validation des profils</h4>
            <p className="text-gray-700 mb-3">
              Accédez à la page de validation via le tableau de bord (onglet "Alumni") ou directement depuis le menu.
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-1">
              <li><strong>Onglet "À valider"</strong> : Profils en attente de validation</li>
              <li><strong>Onglet "Validés"</strong> : Profils déjà approuvés et visibles dans l'annuaire</li>
              <li><strong>Onglet "Tous"</strong> : Vue complète de tous les profils</li>
            </ul>

            <h4 className="font-semibold text-purple-700 mb-3">Actions disponibles</h4>
            <div className="bg-purple-50 p-4 rounded-md mb-4">
              <p className="text-gray-700 mb-2"><strong>Pour les profils en attente :</strong></p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong className="text-green-600">Approuver</strong> : Valide le profil et le rend visible dans l'annuaire. Un email de confirmation est envoyé à l'utilisateur.</li>
                <li><strong className="text-red-600">Rejeter</strong> : Refuse le profil avec une raison obligatoire. Un email explicatif est envoyé à l'utilisateur.</li>
              </ul>
            </div>

            <div className="bg-red-50 p-4 rounded-md mb-4">
              <p className="text-gray-700 mb-2"><strong className="text-red-700">🔒 Suppression (Superadmin uniquement) :</strong></p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Seuls les super-administrateurs peuvent supprimer définitivement un profil</li>
                <li>Une double confirmation est requise avant suppression</li>
                <li>Les admins simples voient le bouton grisé avec un message d'accès refusé</li>
              </ul>
            </div>

            <h4 className="font-semibold text-purple-700 mb-3">Statistiques Alumni</h4>
            <p className="text-gray-700 mb-3">
              Accédez aux statistiques détaillées via l'onglet "Alumni" du tableau de bord :
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-1">
              <li>KPIs : Total, Approuvés, En attente, Taux d'approbation</li>
              <li>Top 5 Secteurs d'activité avec graphiques</li>
              <li>Top 5 Pays de résidence</li>
              <li>Top 10 Expertises</li>
              <li>Distribution par année de promotion</li>
              <li>Filtres par statut (tous/approuvés/pending/rejetés)</li>
            </ul>

            <h4 className="font-semibold text-purple-700 mb-3">Export des données</h4>
            <p className="text-gray-700 mb-3">
              Deux options d'export sont disponibles dans la page de statistiques :
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-700 space-y-1">
              <li><strong>Export CSV</strong> : Données tabulaires (nom, secteur, expertise, localisation, email)</li>
              <li><strong>Export PDF</strong> : Rapport complet avec résumé et liste des profils</li>
            </ul>

            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-gray-800 flex items-start">
                <HelpCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Astuce :</strong> Les compteurs dans les onglets affichent toujours les totaux globaux, 
                  même lorsque vous filtrez les profils. Cela vous permet de garder une vue d'ensemble tout en travaillant sur un sous-ensemble de profils.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Section */}
        <div id="dashboard" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <PieChart className="w-6 h-6 text-blue-700 mr-2" />
            <h3 className="text-lg font-bold text-blue-800">1. Tableau de bord</h3>
          </div>
          
          <div className="border-l-4 border-blue-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              Le tableau de bord est votre point d'entrée principal dans l'administration. Il vous offre une vue d'ensemble de l'activité et des statistiques clés de la plateforme.
            </p>
            
            <h4 className="font-semibold text-blue-700 mb-2">Statistiques disponibles:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Nombre total d'utilisateurs inscrits</li>
              <li>Utilisateurs actifs (ayant utilisé la plateforme dans les 7 derniers jours)</li>
              <li>Nombre de sections du guide</li>
              <li>Nombre de questions FAQ</li>
              <li>Nombre de ressources disponibles</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Activités récentes:</h4>
            <p className="text-gray-700 mb-4">
              Le tableau de bord affiche également les 10 dernières activités enregistrées sur la plateforme, comme les connexions, les inscriptions, les modifications de contenu, etc.
              Pour voir l'ensemble des activités, cliquez sur "Voir toutes les activités".
            </p>
            
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <p className="text-gray-800 italic text-sm">
                <strong>Astuce:</strong> Consultez le tableau de bord régulièrement pour surveiller l'activité et l'engagement des utilisateurs sur la plateforme.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-semibold text-blue-700 mb-2">Navigation:</h4>
            <p className="text-gray-700">
              Depuis le tableau de bord, vous pouvez accéder à toutes les autres sections de l'administration en cliquant sur les cartes statistiques ou en utilisant le menu latéral.
            </p>
          </div>
        </div>

        {/* Content Management Section */}
        <div id="content" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <BookOpen className="w-6 h-6 text-blue-700 mr-2" />
            <h3 className="text-lg font-bold text-blue-800">3. Gestion du contenu du guide</h3>
          </div>
          
          <div className="border-l-4 border-blue-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              L'éditeur de contenu vous permet de créer, modifier et organiser les sections du guide ESIG-prep. Chaque section appartient à une phase spécifique du processus d'immigration.
            </p>
            
            <h4 className="font-semibold text-blue-700 mb-2">Phases disponibles:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li><strong>Post-CPS:</strong> Pour les démarches après l'obtention du CPS</li>
              <li><strong>Pendant les démarches:</strong> Pour les informations utiles pendant le processus</li>
              <li><strong>Pré-arrivée:</strong> Pour les préparatifs avant l'arrivée en Suisse</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Création d'une section:</h4>
            <ol className="list-decimal list-inside mb-4 text-gray-700">
              <li>Cliquez sur le bouton "Ajouter une section"</li>
              <li>Remplissez le formulaire avec le titre, la phase et le contenu</li>
              <li>Définissez l'ordre d'apparition de la section dans sa phase</li>
              <li>Associez des ressources à la section si nécessaire</li>
              <li>Cliquez sur "Enregistrer" pour créer la section</li>
            </ol>
            
            <h4 className="font-semibold text-blue-700 mb-2">Modification d'une section:</h4>
            <ol className="list-decimal list-inside mb-4 text-gray-700">
              <li>Sélectionnez la section à modifier dans la liste</li>
              <li>Modifiez les informations dans le formulaire</li>
              <li>Cliquez sur "Enregistrer" pour sauvegarder les modifications</li>
            </ol>
            
            <h4 className="font-semibold text-blue-700 mb-2">Suppression d'une section:</h4>
            <p className="text-gray-700 mb-4">
              Pour supprimer une section, cliquez sur le bouton "Supprimer" lorsque vous êtes en mode édition.
              Une confirmation vous sera demandée avant la suppression définitive.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <p className="text-gray-800 italic text-sm">
                <strong>Important:</strong> L'ordre des sections détermine leur position d'affichage dans le guide. Assurez-vous que les sections suivent une progression logique.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-semibold text-blue-700 mb-2">Bonnes pratiques pour le contenu:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li>Utilisez des titres clairs et descriptifs</li>
              <li>Structurez le contenu avec des sous-titres et des listes</li>
              <li>Incluez des informations pratiques et des conseils</li>
              <li>Associez des ressources pertinentes à chaque section</li>
              <li>Mettez régulièrement à jour le contenu pour maintenir sa pertinence</li>
            </ul>
          </div>
        </div>
      
        {/* FAQ Management Section */}
        <div id="faq" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <HelpCircle className="w-6 h-6 text-blue-700 mr-2" />
            <h3 className="text-lg font-bold text-blue-800">4. Gestion des FAQ</h3>
          </div>
          
          <div className="border-l-4 border-blue-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              La section FAQ est essentielle pour aider les utilisateurs à trouver rapidement des réponses à leurs questions.
              En tant qu'administrateur, vous pouvez gérer les questions existantes, ajouter de nouvelles questions et réponses,
              et approuver les questions soumises par les utilisateurs.
            </p>

            <h4 className="font-semibold text-blue-700 mb-2">Processus de gestion des FAQ:</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
              <li>Consultation des questions en attente (non répondues)</li>
              <li>Rédaction de réponses précises et informatives</li>
              <li>Approbation des questions pour publication</li>
              <li>Catégorisation par phase et par thématique</li>
              <li>Mise à jour des réponses existantes si nécessaire</li>
            </ol>

            <p className="text-gray-700 mb-4">
              <strong>Important:</strong> Lorsqu'un utilisateur soumet une question, le système enregistre automatiquement son identifiant (uid) et son email. 
              Ces informations vous permettent d'identifier la source de la question et de contacter l'utilisateur si nécessaire pour des précisions.            
            </p>
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <p className="text-gray-800 italic text-sm">
                <strong>Astuce:</strong> Répondez aux questions des utilisateurs dans un délai raisonnable pour maintenir leur engagement. Les questions sans réponse peuvent décourager la participation.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-semibold text-blue-700 mb-2">Bonnes pratiques pour les FAQ:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li>Répondez de manière claire et concise</li>
              <li>Incluez des liens vers des ressources ou sections pertinentes</li>
              <li>Organisez logiquement par catégories pour faciliter la recherche</li>
              <li>Mettez à jour les réponses lorsque les informations changent</li>
              <li>Considérez les questions fréquentes comme une indication des sections du guide à améliorer</li>
            </ul>
          </div>
        </div>

        {/* Resource Management Section */}
        <div id="resources" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-blue-700 mr-2" />
            <h3 className="text-lg font-bold text-blue-800">5. Gestion des ressources</h3>
          </div>
          
          <div className="border-l-4 border-blue-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              La section Gestion des ressources vous permet d'ajouter, de modifier et de supprimer des ressources utiles pour les utilisateurs. 
              Ces ressources peuvent être des documents PDF, des liens vers des sites externes, ou d'autres types de supports informatifs.
              Une organisation efficace par phase est essentielle pour l'expérience utilisateur.
            </p>
            
            <h4 className="font-semibold text-blue-700 mb-2">Organisation par phase:</h4>
            <div className="space-y-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <h5 className="font-medium text-blue-700 mb-1">Phase Post-CPS</h5>
                <p className="text-gray-700 text-sm">
                  Ressources concernant les étapes à suivre après avoir reçu une réponse positive du CPS (Concours Passerelle Spécial).
                  Exemples: procédures d'inscription, documents à fournir, préparation académique.
                </p>
              </div>
              
              <div className="bg-indigo-50 p-3 rounded-md">
                <h5 className="font-medium text-indigo-700 mb-1">Phase During-Process</h5>
                <p className="text-gray-700 text-sm">
                  Ressources liées aux démarches administratives en cours (visa, logement, assurances).
                  Exemples: guides pour les démarches consulaires, check-lists pour les documents de visa, options de logement.
                </p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-md">
                <h5 className="font-medium text-purple-700 mb-1">Phase Pre-Arrival</h5>
                <p className="text-gray-700 text-sm">
                  Ressources pour préparer l'arrivée en France et à l'ESIG.
                  Exemples: guides d'orientation du campus, informations sur les transports locaux, conseils pour l'installation.
                </p>
              </div>
            </div>
            
            <h4 className="font-semibold text-blue-700 mb-2">Fonctionnalités principales:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Ajouter de nouvelles ressources (fichiers PDF, liens, etc.)</li>
              <li>Catégoriser les ressources par thème et par phase</li>
              <li>Modifier les informations des ressources existantes</li>
              <li>Supprimer les ressources obsolètes</li>
              <li>Prévisualiser les ressources avant publication</li>
              <li>Explorer et sélectionner des fichiers Dropbox pour vos ressources</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Structure des données de ressources:</h4>
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="text-gray-700 text-sm font-mono">
                id: string<br />
                title: string<br />
                description: string<br />
                phase: GuidePhase ('post-cps' | 'during-process' | 'pre-arrival')<br />
                category: string<br />
                fileUrl: string<br />
                fileType: 'pdf' | 'doc' | ... | 'link'<br />
                uploadDate: string<br />
                updatedDate: string
              </p>
            </div>
            
            <h4 className="font-semibold text-blue-700 mb-2">Bonnes pratiques:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Utilisez des noms de fichiers clairs et descriptifs</li>
              <li>Ajoutez toujours une description concise mais informative</li>
              <li>Vérifiez que les liens externes fonctionnent correctement</li>
              <li>Organisez les ressources par catégories logiques et cohérentes</li>
              <li>Mettez régulièrement à jour les ressources pour garantir leur pertinence</li>
              <li>Supprimez les ressources obsolètes pour éviter la confusion</li>
              <li>Liez les ressources aux sections de guide appropriées</li>
            </ul>
          </div>
        </div>

        {/* Dropbox Manager Section */}
        <div id="dropbox" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Cloud className="w-6 h-6 text-blue-700 mr-2" />
            <h3 className="text-lg font-bold text-blue-800">6. Gestionnaire Dropbox</h3>
          </div>
          
          <div className="border-l-4 border-blue-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              Le Gestionnaire Dropbox vous permet d'interagir directement avec votre compte Dropbox pour gérer vos fichiers, 
              tester la connectivité, créer des liens de partage et uploader de nouveaux documents.
              Cette fonctionnalité facilite l'intégration de ressources stockées sur Dropbox dans votre guide.
            </p>

            <h4 className="font-semibold text-blue-700 mb-2">Procédure de configuration:</h4>
            <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700">
              <li>Accédez à la page Gestionnaire Dropbox dans le panneau d'administration</li>
              <li>Connectez votre compte Dropbox en utilisant le bouton "Connecter à Dropbox"</li>
              <li>Autorisez l'application à accéder à votre Dropbox lorsque demandé</li>
              <li>Une fois connecté, l'interface affichera vos fichiers et dossiers</li>
              <li>Le système conserve votre jeton d'accès de manière sécurisée pour les futures connexions</li>
            </ol>
            
            <h4 className="font-semibold text-blue-700 mb-2">Fonctionnalités principales:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Tester la connectivité avec votre compte Dropbox</li>
              <li>Lister tous les fichiers présents dans votre compte Dropbox</li>
              <li>Naviguer dans la structure de dossiers</li>
              <li>Rechercher des fichiers spécifiques par nom ou type</li>
              <li>Uploader de nouveaux fichiers directement depuis l'interface</li>
              <li>Générer des liens de partage publics pour vos fichiers</li>
              <li>Copier les liens facilement pour les intégrer dans les ressources</li>
              <li>Supprimer des fichiers inutilisés depuis l'interface</li>
              <li>Voir les métadonnées des fichiers (taille, date de modification, etc.)</li>
            </ul>
            
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <h4 className="font-semibold text-blue-700 mb-2">Utilisation avec le gestionnaire de ressources:</h4>
              <p className="text-gray-700 mb-3">
                Le Gestionnaire Dropbox est particulièrement utile pour créer et gérer les ressources du guide:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Uploader un fichier dans Dropbox via l'interface</li>
                <li>Générer un lien de partage pour ce fichier</li>
                <li>Copier ce lien lors de la création d'une nouvelle ressource dans le gestionnaire de ressources</li>
                <li>Associer la ressource à la phase appropriée et aux sections du guide</li>
              </ol>
            </div>
            
            <h4 className="font-semibold text-blue-700 mb-2">Étapes pour utiliser le Gestionnaire Dropbox:</h4>
            <ol className="list-decimal list-inside mb-4 text-gray-700">
              <li>Accédez au Gestionnaire Dropbox depuis le tableau de bord</li>
              <li>Vérifiez le statut de connexion à votre compte Dropbox</li>
              <li>Si nécessaire, testez la connectivité en cliquant sur le bouton "Tester la connexion"</li>
              <li>Parcourez la liste des fichiers disponibles ou utilisez la recherche pour trouver un fichier spécifique</li>
              <li>Pour uploader un nouveau fichier, utilisez la section d'upload dédiée</li>
              <li>Pour générer un lien de partage, cliquez sur l'icône de lien à côté du fichier souhaité</li>
              <li>Pour supprimer un fichier, cliquez sur l'icône de corbeille et confirmez votre action</li>
            </ol>
            
            <h4 className="font-semibold text-blue-700 mb-2">Intégration avec la Gestion des ressources:</h4>
            <p className="text-gray-700 mb-4">
              Une fois que vous avez généré un lien de partage pour un fichier Dropbox, vous pouvez l'utiliser dans la Gestion des ressources:
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Copiez le lien généré depuis le Gestionnaire Dropbox</li>
              <li>Dans la Gestion des ressources, créez une nouvelle ressource de type "Lien externe"</li>
              <li>Collez le lien Dropbox dans le champ URL de la ressource</li>
              <li>Complétez les autres informations (titre, description, catégorie, etc.)</li>
              <li>Enregistrez la ressource pour la rendre disponible aux utilisateurs</li>
            </ul>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">Astuce:</h4>
              <p className="text-blue-800">
                Vous pouvez également parcourir et sélectionner directement vos fichiers Dropbox lors de la création d'une ressource
                en utilisant la fonction "Explorer Dropbox" dans le gestionnaire de ressources.
              </p>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Attention:</h4>
              <p className="text-yellow-800">
                La suppression d'un fichier Dropbox est définitive. Assurez-vous qu'aucune ressource n'utilise ce fichier avant de le supprimer.
                Si un fichier est supprimé, les liens pointant vers ce fichier ne fonctionneront plus.
              </p>
            </div>
            
            <h4 className="font-semibold text-blue-700 mb-2">Navigation:</h4>
            <p className="text-gray-700">
              Accédez au Gestionnaire Dropbox en cliquant sur "Gestionnaire Dropbox" dans le tableau de bord administrateur ou en naviguant directement vers <span className="text-blue-600">/admin/dropbox</span>.              
            </p>
          </div>
        </div>
        
        {/* User Management Section */}
        <div id="users" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-blue-700 mr-2" />
            <h3 className="text-lg font-bold text-blue-800">7. Gestion des utilisateurs</h3>
          </div>
          
          <div className="border-l-4 border-blue-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              Le gestionnaire d'utilisateurs vous permet de consulter la liste des utilisateurs inscrits, de modifier leurs informations et de gérer leurs droits d'accès.
            </p>
            
            <h4 className="font-semibold text-blue-700 mb-2">Fonctionnalités principales:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Visualisation de tous les utilisateurs inscrits</li>
              <li>Consultation des profils utilisateurs</li>
              <li>Attribution/retrait des droits d'administration</li>
              <li>Suppression de comptes utilisateurs</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Types d'utilisateurs:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li><strong>Utilisateurs standard:</strong> Accès en lecture seule au guide et aux ressources</li>
              <li><strong>Administrateurs:</strong> Accès complet au panneau d'administration</li>
              <li><strong>Admin principal (SuperAdmin):</strong> Droits étendus, ne peut être modifié que par lui-même</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Gestion des droits d'administration:</h4>
            <p className="text-gray-700 mb-4">
              Pour promouvoir un utilisateur au rang d'administrateur ou lui retirer ce privilège:
            </p>
            <ol className="list-decimal list-inside mb-4 text-gray-700">
              <li>Localisez l'utilisateur dans la liste</li>
              <li>Cliquez sur "Promouvoir admin" ou "Retirer admin"</li>
              <li>Entrez le mot de passe administrateur à l'invite</li>
              <li>Confirmez l'action</li>
            </ol>
            
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <p className="text-gray-800 italic text-sm">
                <strong>Sécurité:</strong> La modification des droits d'administration nécessite un mot de passe spécial pour éviter les changements accidentels. Les comptes "Admin principal" sont protégés contre les modifications par d'autres administrateurs.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-semibold text-blue-700 mb-2">Recommandations importantes:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li>Limitez le nombre d'administrateurs au minimum nécessaire</li>
              <li>Révisez régulièrement la liste des administrateurs</li>
              <li>Retirez les privilèges aux utilisateurs qui n'en ont plus besoin</li>
              <li>Soyez vigilant lors de la suppression de comptes utilisateurs (cette action est irréversible)</li>
              <li>Ne partagez jamais le mot de passe administrateur avec des personnes non autorisées</li>
            </ul>
          </div>
        </div>

        {/* Activity Log Section */}
        <div id="activity" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Activity className="w-6 h-6 text-blue-700 mr-2" />
            <h3 className="text-lg font-bold text-blue-800">8. Journal d'activité</h3>
          </div>
          
          <div className="border-l-4 border-blue-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              Le journal d'activité enregistre toutes les actions importantes effectuées sur la plateforme, tant par les utilisateurs que par les administrateurs. C'est un outil essentiel pour la supervision et la sécurité.
            </p>
            
            <h4 className="font-semibold text-blue-700 mb-2">Actions enregistrées:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Connexions et inscriptions</li>
              <li>Création, modification et suppression de contenu</li>
              <li>Ajout et modification de ressources</li>
              <li>Gestion des FAQ</li>
              <li>Modifications des droits utilisateurs</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Filtrage des activités:</h4>
            <p className="text-gray-700 mb-4">
              Vous pouvez filtrer le journal par:
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Type d'activité</li>
              <li>Utilisateur (email)</li>
              <li>Période (date de début et date de fin)</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Utilisation du journal:</h4>
            <p className="text-gray-700 mb-4">
              Le journal d'activité est utile pour:
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Suivre les modifications apportées au contenu</li>
              <li>Identifier les auteurs de modifications spécifiques</li>
              <li>Détecter les problèmes de sécurité potentiels</li>
              <li>Analyser les tendances d'utilisation</li>
            </ul>
            
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <p className="text-gray-800 italic text-sm">
                <strong>Astuce:</strong> Consultez régulièrement le journal d'activité pour vous tenir informé des changements apportés à la plateforme, surtout si vous partagez les responsabilités d'administration avec d'autres personnes.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-semibold text-blue-700 mb-2">Bonnes pratiques:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li>Vérifiez le journal après des modifications importantes</li>
              <li>Utilisez les filtres pour cibler des informations spécifiques</li>
              <li>Surveillez les activités inhabituelles qui pourraient indiquer un problème</li>
              <li>Analysez périodiquement les tendances d'utilisation pour améliorer la plateforme</li>
            </ul>
          </div>
        </div>

        {/* Tips and Best Practices Section */}
        <div id="tips" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Settings className="w-6 h-6 text-blue-700 mr-2" />
            <h3 className="text-lg font-bold text-blue-800">9. Conseils et bonnes pratiques</h3>
          </div>
          
          <div className="border-l-4 border-blue-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              Voici quelques conseils généraux pour une administration efficace de la plateforme ESIG-prep-guide.
            </p>
            
            <h4 className="font-semibold text-blue-700 mb-2">Gestion du contenu:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Mettez à jour régulièrement le contenu pour refléter les changements dans les procédures</li>
              <li>Utilisez un langage clair et accessible pour tous les niveaux de compréhension</li>
              <li>Structurez le contenu de manière logique et progressive</li>
              <li>Intégrez des exemples concrets et des cas pratiques</li>
              <li>Complétez le texte avec des ressources visuelles quand c'est possible</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Interaction avec les utilisateurs:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Répondez aux questions des utilisateurs dans un délai raisonnable</li>
              <li>Prenez en compte les retours d'expérience pour améliorer le guide</li>
              <li>Soyez attentif aux questions récurrentes qui pourraient indiquer des lacunes dans le contenu</li>
              <li>Encouragez les utilisateurs à contribuer en posant des questions et en partageant leur expérience</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Sécurité et confidentialité:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Ne partagez jamais vos identifiants d'administration</li>
              <li>Déconnectez-vous après chaque session, surtout sur des ordinateurs partagés</li>
              <li>Respectez la confidentialité des données utilisateurs</li>
              <li>Vérifiez régulièrement le journal d'activité pour détecter toute activité suspecte</li>
              <li>Utilisez des mots de passe forts et uniques</li>
            </ul>
            
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <p className="text-gray-800 italic text-sm">
                <strong>Rappel important:</strong> En tant qu'administrateur, vous avez la responsabilité de maintenir la qualité et l'exactitude des informations fournies aux utilisateurs. Veillez à ce que le contenu soit toujours à jour et pertinent.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-semibold text-blue-700 mb-2">Calendrier de maintenance suggéré:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li><strong>Quotidiennement:</strong> Vérifier les nouvelles questions FAQ et y répondre</li>
              <li><strong>Hebdomadairement:</strong> Consulter le journal d'activité et les statistiques</li>
              <li><strong>Mensuellement:</strong> Vérifier et mettre à jour le contenu du guide</li>
              <li><strong>Trimestriellement:</strong> Réviser l'organisation des ressources et les droits des utilisateurs</li>
              <li><strong>Annuellement:</strong> Effectuer une révision complète de tous les contenus</li>
            </ul>
          </div>
        </div>

        {/* Conclusion */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-4">Conclusion</h3>
          <p className="text-gray-700 mb-4">
            Vous disposez maintenant des connaissances nécessaires pour administrer efficacement la plateforme ESIG-prep-guide. 
            N'hésitez pas à revenir consulter ce tutoriel chaque fois que vous en aurez besoin.
          </p>
          <p className="text-gray-700 mb-4">
            Si vous avez des questions ou rencontrez des difficultés, contactez l'administrateur principal du système.
          </p>
          <div className="mt-6 text-center">
            <Link 
              to="/admin" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTutorial;
