import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, HelpCircle, FileText, Activity, PieChart, Settings, BookOpen } from 'lucide-react';
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
              <a href="#content" className="text-blue-600 hover:underline">2. Gestion du contenu du guide</a>
            </li>
            <li>
              <a href="#faq" className="text-blue-600 hover:underline">3. Gestion des FAQ</a>
            </li>
            <li>
              <a href="#resources" className="text-blue-600 hover:underline">4. Gestion des ressources</a>
            </li>
            <li>
              <a href="#users" className="text-blue-600 hover:underline">5. Gestion des utilisateurs</a>
            </li>
            <li>
              <a href="#activity" className="text-blue-600 hover:underline">6. Journal d'activité</a>
            </li>
            <li>
              <a href="#tips" className="text-blue-600 hover:underline">7. Conseils et bonnes pratiques</a>
            </li>
          </ul>
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
            <h3 className="text-lg font-bold text-blue-800">2. Gestion du contenu du guide</h3>
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
            <h3 className="text-lg font-bold text-blue-800">3. Gestion des FAQ</h3>
          </div>
          
          <div className="border-l-4 border-blue-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              La gestion des FAQ vous permet de répondre aux questions fréquemment posées par les utilisateurs. Les questions peuvent être soumises par les utilisateurs ou créées directement par les administrateurs.
            </p>
            
            <h4 className="font-semibold text-blue-700 mb-2">Fonctionnalités principales:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Création et édition de questions/réponses</li>
              <li>Approbation des questions soumises par les utilisateurs</li>
              <li>Catégorisation des questions par thème</li>
              <li>Organisation des FAQ par phase du processus d'immigration</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Traitement des questions utilisateurs:</h4>
            <ol className="list-decimal list-inside mb-4 text-gray-700">
              <li>Les questions soumises apparaissent dans la liste avec un statut "En attente de réponse"</li>
              <li>Pour répondre, sélectionnez la question dans la liste</li>
              <li>Rédigez votre réponse dans le champ prévu</li>
              <li>Assignez une catégorie appropriée</li>
              <li>Cochez "Approuvé" si la question doit être visible publiquement</li>
              <li>Cliquez sur "Enregistrer" pour publier votre réponse</li>
            </ol>
            
            <h4 className="font-semibold text-blue-700 mb-2">Création manuelle de FAQ:</h4>
            <p className="text-gray-700 mb-4">
              Vous pouvez également créer des questions manuellement en cliquant sur "Ajouter une FAQ" et en remplissant tous les champs du formulaire.
              Cela est utile pour anticiper les questions courantes que les utilisateurs pourraient avoir.
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
            <h3 className="text-lg font-bold text-blue-800">4. Gestion des ressources</h3>
          </div>
          
          <div className="border-l-4 border-blue-200 pl-4 mb-6">
            <p className="text-gray-700 mb-4">
              Le gestionnaire de ressources vous permet d'ajouter des documents, liens et autres contenus utiles que les utilisateurs pourront consulter. Ces ressources peuvent être associées à des sections spécifiques du guide.
            </p>
            
            <h4 className="font-semibold text-blue-700 mb-2">Types de ressources supportés:</h4>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              <li>Documents (PDF, Word, Excel, PowerPoint)</li>
              <li>Images</li>
              <li>Liens vers des sites web externes</li>
              <li>Fichiers audio et vidéo</li>
              <li>Archives ZIP</li>
            </ul>
            
            <h4 className="font-semibold text-blue-700 mb-2">Ajout d'une ressource:</h4>
            <ol className="list-decimal list-inside mb-4 text-gray-700">
              <li>Cliquez sur "Ajouter une ressource"</li>
              <li>Remplissez les champs du formulaire (titre, description, catégorie, phase)</li>
              <li>Sélectionnez le type de ressource</li>
              <li>Téléchargez le fichier via Dropbox ou indiquez l'URL pour un lien</li>
              <li>Cliquez sur "Enregistrer" pour ajouter la ressource</li>
            </ol>
            
            <h4 className="font-semibold text-blue-700 mb-2">Organisation des ressources:</h4>
            <p className="text-gray-700 mb-4">
              Les ressources sont organisées par phase du processus d'immigration (Post-CPS, Pendant les démarches, Pré-arrivée) et par catégorie. 
              Cela facilite leur découverte par les utilisateurs.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <p className="text-gray-800 italic text-sm">
                <strong>Important:</strong> Assurez-vous que tous les fichiers téléchargés sont exempts de virus et respectent les droits d'auteur. Privilégiez les documents officiels ou les ressources libres de droits.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h4 className="font-semibold text-blue-700 mb-2">Conseils pour la gestion des ressources:</h4>
            <ul className="list-disc list-inside text-gray-700">
              <li>Utilisez des titres descriptifs pour faciliter la recherche</li>
              <li>Incluez la date de publication/mise à jour dans la description</li>
              <li>Vérifiez régulièrement que les liens externes fonctionnent toujours</li>
              <li>Mettez à jour ou supprimez les ressources obsolètes</li>
              <li>Utilisez des catégories cohérentes pour faciliter la navigation</li>
            </ul>
          </div>
        </div>

        {/* User Management Section */}
        <div id="users" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-blue-700 mr-2" />
            <h3 className="text-lg font-bold text-blue-800">5. Gestion des utilisateurs</h3>
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
            <h3 className="text-lg font-bold text-blue-800">6. Journal d'activité</h3>
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
            <h3 className="text-lg font-bold text-blue-800">7. Conseils et bonnes pratiques</h3>
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
