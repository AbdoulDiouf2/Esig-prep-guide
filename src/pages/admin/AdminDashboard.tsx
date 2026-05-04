import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import SuperAdminCheck from '../../components/routes/SuperAdminCheck';
import { UserDoc } from './AdminUserManager';
import CpsOverview from './CpsOverview';

import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminChatService from '../../services/adminChatService';
import {
  Users,
  MessageSquare,
  FileText,
  Edit,
  ClipboardList,
  Calendar,
  HelpCircle,
  Cloud,
  Video,
  BookOpen,
  Podcast,
  Award,
  BarChart,
  Wrench,
  Upload,
  Newspaper,
  Shield,
  UserCog
} from 'lucide-react';
import { useRecentAdminActivity } from './useRecentAdminActivity';
import AlumniStats from './AlumniStats';

import type { LogActivityParams } from './adminActivityLog';


function formatAdminActivity(activity: LogActivityParams, usersList: UserDoc[] = []) {
  const actionMap: Record<string, string> = {
    'Ajout': 'a ajouté',
    'Suppression': 'a supprimé',
    'Modification': 'a modifié'
  };
  const targetMap: Record<string, string> = {
    'Section': 'une section',
    'Ressource': 'une ressource',
    'FAQ': 'une question FAQ'
  };
  
  // Trouver l'utilisateur par son ID et utiliser son nom d'affichage ou email
  let userName = 'Admin';
  if (activity.user) {
    const foundUser = usersList.find(u => u.uid === activity.user);
    if (foundUser) {
      userName = foundUser.displayName || foundUser.email || activity.user;
    }
  }
  
  const action = actionMap[activity.type] || activity.type.toLowerCase();
  const target = targetMap[activity.target] || activity.target.toLowerCase();
  return `${userName} ${action} ${target}`;
}


const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { recentActivity, loading: loadingActivity } = useRecentAdminActivity();

  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);
  const [pendingWorkshopsCount, setPendingWorkshopsCount] = useState(0);
  const [newFeedbacksCount, setNewFeedbacksCount] = useState(0);
  // Tabs
  const [activeTab, setActiveTab] = useState<'general' | 'alumni' | 'cps'>('general');

  // Vérifier les messages non lus au chargement et s'abonner aux mises à jour
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Vérifier les messages non lus au chargement
    const checkUnreadMessages = async () => {
      const hasUnread = await adminChatService.hasUnreadMessages(currentUser.uid);
      setHasUnreadMessages(hasUnread);
    };

    checkUnreadMessages();

    // S'abonner aux changements de messages non lus
    const unsubscribe = adminChatService.subscribeToUnreadMessages(
      currentUser.uid,
      (hasUnread) => {
        setHasUnreadMessages(hasUnread);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Propositions d'ateliers en attente
  useEffect(() => {
    getCountFromServer(
      query(collection(db, 'workshopProposals'), where('status', '==', 'pending'))
    ).then((snap) => setPendingWorkshopsCount(snap.data().count)).catch(() => {});
  }, []);

  // Nouveaux feedbacks (comparaison avec le total vu en localStorage)
  useEffect(() => {
    getCountFromServer(collection(db, 'feedback'))
      .then((snap) => {
        const total = snap.data().count;
        const seen = parseInt(localStorage.getItem('admin_feedbacks_seen') ?? '0', 10);
        setNewFeedbacksCount(Math.max(0, total - seen));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2 md:gap-0">
            <div className="order-1 md:order-none">
              <h1 className="text-2xl font-bold">Tableau de bord administrateur</h1>
              <p className="text-blue-100 mt-1">
                Bienvenue, <strong>{currentUser?.displayName || currentUser?.email} ! </strong> Gérez le contenu et les ressources de la plateforme.
              </p>
            </div>
            <div className="order-2 md:order-none flex flex-col gap-2 sm:flex-row sm:space-x-2 sm:gap-0 w-full md:w-auto mt-2 md:mt-0">
              <Link
                to="/admin/feedbacks"
                onClick={() => {
                  getCountFromServer(collection(db, 'feedback'))
                    .then((snap) => localStorage.setItem('admin_feedbacks_seen', String(snap.data().count)))
                    .catch(() => {});
                  setNewFeedbacksCount(0);
                }}
                className="relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-white/80 hover:bg-white text-blue-900 border border-blue-200 shadow transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Feedbacks
                {newFeedbacksCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                    {newFeedbacksCount > 9 ? '9+' : newFeedbacksCount}
                  </span>
                )}
              </Link>
              <Link 
                to="/admin/tutorial" 
                className="flex items-center justify-center px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded transition-colors w-full sm:w-auto"
                title="Consulter le guide d'administration"
              >
                <HelpCircle className="h-4 w-4 mr-1" /> Tutoriel
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Onglets */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'general' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('general')}
            >
              Général
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${activeTab === 'alumni' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('alumni')}
            >
              Alumni
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${activeTab === 'cps' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('cps')}
            >
              Étudiants CPS
            </button>
          </div>
        </div>

        {/* Section Alumni (affiché uniquement onglet Alumni) */}
        {activeTab === 'alumni' && (
          <AlumniStats />
        )}

        {/* CPS tab content */}
        {activeTab === 'cps' && <CpsOverview />}

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {activeTab === 'general' && (
            <>
              <Link to="/admin/dropbox" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Cloud className="-ml-1 mr-2 h-5 w-5" />
                Gestionnaire Dropbox
              </Link>
              <Link to="/admin/activity" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <ClipboardList className="-ml-1 mr-2 h-5 w-5" />
                Journal d'activité détaillé
              </Link>
              <SuperAdminCheck>
                <Link to="/admin/maintenance" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  <Wrench className="-ml-1 mr-2 h-5 w-5" />
                  Mode Maintenance
                </Link>
              </SuperAdminCheck>
              <SuperAdminCheck>
                <Link to="/admin/import-alumni" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <Upload className="-ml-1 mr-2 h-5 w-5" />
                  Import Alumni
                </Link>
              </SuperAdminCheck>
            </>
          )}
        </div>
        

        {/* Fonctionnalités principales (affiché uniquement onglet Général) */}
        {activeTab === 'general' && (
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Fonctionnalités principales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Carte Contenu */}
              <Link
                to="/admin/content"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition duration-200"
              >
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <Edit className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">Gestion du contenu</h3>
                    <p className="text-sm text-gray-600 mt-1">Gérer les sections, ressources et questions FAQ</p>
                  </div>
                </div>
              </Link>

              {/* Carte Utilisateurs */}
              <Link
                to="/admin/users"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition duration-200"
              >
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">Gestion des utilisateurs</h3>
                    <p className="text-sm text-gray-600 mt-1">Gérer les utilisateurs et leurs rôles</p>
                  </div>
                </div>
              </Link>

              {/* Carte Chat Administrateur */}
              <SuperAdminCheck>
                <Link
                  to="/admin/chat-interface"
                  className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition duration-200 relative"
                >
                  {hasUnreadMessages && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                  <div className="flex items-start">
                    <div className="p-2 bg-green-100 rounded-lg mr-4">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-md font-semibold text-gray-900">Chat Utilisateurs</h3>
                      <p className="text-sm text-gray-600 mt-1">Répondre aux messages des utilisateurs</p>
                    </div>
                  </div>
                </Link>
              </SuperAdminCheck>

              {/* Carte FAQ */}
              <Link
                to="/admin/content?faq=moderate"
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition duration-200"
              >
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">Modérer la FAQ</h3>
                    <p className="text-sm text-gray-600 mt-1">Gérer les questions et réponses de la FAQ</p>
                  </div>
                </div>
              </Link>

              {/* Carte Actualités */}
              <Link to="/admin/news" className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition duration-200">
                <div className="flex items-start">
                  <div className="p-2 bg-amber-100 rounded-lg mr-4">
                    <Newspaper className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">Actualités</h3>
                    <p className="text-sm text-gray-600 mt-1">Créer et gérer les articles de la communauté</p>
                  </div>
                </div>
              </Link>

              {/* Carte Webinaires */}
              <Link to="/admin/webinars" className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition duration-200">
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <Video className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">Gestion des webinaires</h3>
                    <p className="text-sm text-gray-600 mt-1">Créer, modifier et supprimer des webinaires</p>
                  </div>
                </div>
              </Link>

              {/* Carte Propositions d'ateliers */}
              <Link to="/admin/workshop-proposals" className="relative block p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition duration-200">
                {pendingWorkshopsCount > 0 && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingWorkshopsCount} en attente
                  </span>
                )}
                <div className="flex items-start">
                  <div className="p-2 bg-amber-100 rounded-lg mr-4">
                    <ClipboardList className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">Propositions d'ateliers</h3>
                    <p className="text-sm text-gray-600 mt-1">Gérer les propositions d'ateliers soumises par les membres</p>
                  </div>
                </div>
              </Link>

              {/* Carte Gestion des rôles */}
              <SuperAdminCheck>
                <Link to="/admin/roles" className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition duration-200">
                  <div className="flex items-start">
                    <div className="p-2 bg-blue-100 rounded-lg mr-4">
                      <Shield className="w-6 h-6 text-blue-900" />
                    </div>
                    <div>
                      <h3 className="text-md font-semibold text-gray-900">Gestion des rôles</h3>
                      <p className="text-sm text-gray-600 mt-1">Configurer les permissions pour chaque rôle</p>
                    </div>
                  </div>
                </Link>
              </SuperAdminCheck>

              {/* Carte Exceptions utilisateurs */}
              <SuperAdminCheck>
                <Link to="/admin/user-overrides" className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition duration-200">
                  <div className="flex items-start">
                    <div className="p-2 bg-blue-100 rounded-lg mr-4">
                      <UserCog className="w-6 h-6 text-blue-900" />
                    </div>
                    <div>
                      <h3 className="text-md font-semibold text-gray-900">Exceptions utilisateurs</h3>
                      <p className="text-sm text-gray-600 mt-1">Ajouter ou bloquer des permissions par utilisateur</p>
                    </div>
                  </div>
                </Link>
              </SuperAdminCheck>

              {/* Carte Cours en ligne - Désactivée */}
              <div className="block p-4 bg-white border border-gray-200 rounded-lg opacity-60 cursor-not-allowed">
                <div className="flex items-start">
                  <div className="p-2 bg-green-100 rounded-lg mr-4">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-md font-semibold text-gray-900">Cours en ligne</h3>
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Bientôt disponible</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Gestion des cours en ligne et e-learning</p>
                  </div>
                </div>
              </div>

              {/* Carte Podcasts - Désactivée */}
              <div className="block p-4 bg-white border border-gray-200 rounded-lg opacity-60 cursor-not-allowed">
                <div className="flex items-start">
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <Podcast className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-md font-semibold text-gray-900">Podcasts</h3>
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Bientôt disponible</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Gestion des podcasts et contenus audio</p>
                  </div>
                </div>
              </div>

              {/* Carte Événements - Désactivée */}
              <div className="block p-4 bg-white border border-gray-200 rounded-lg opacity-60 cursor-not-allowed">
                <div className="flex items-start">
                  <div className="p-2 bg-red-100 rounded-lg mr-4">
                    <Calendar className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-md font-semibold text-gray-900">Événements</h3>
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Bientôt disponible</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Gestion des événements physiques et virtuels</p>
                  </div>
                </div>
              </div>

              {/* Carte Certificats - Désactivée */}
              <div className="block p-4 bg-white border border-gray-200 rounded-lg opacity-60 cursor-not-allowed">
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-md font-semibold text-gray-900">Certificats</h3>
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Bientôt disponible</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Gestion des certificats et badges de compétence</p>
                  </div>
                </div>
              </div>

              {/* Carte Statistiques avancées - Désactivée */}
              <div className="block p-4 bg-white border border-gray-200 rounded-lg opacity-60 cursor-not-allowed">
                <div className="flex items-start">
                  <div className="p-2 bg-indigo-100 rounded-lg mr-4">
                    <BarChart className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-md font-semibold text-gray-900">Statistiques avancées</h3>
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Bientôt disponible</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Analyse approfondie des données utilisateurs</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Outils Super Admin */}
          <SuperAdminCheck>
            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Outils Super Admin</h2>
              <p className="text-sm text-gray-600 mb-4">Outils avancés réservés aux super administrateurs</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link
                  to="/admin/email-broadcast"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 rounded-md bg-purple-100 text-purple-800 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Diffusion d'emails</p>
                    <p className="text-xs text-gray-500">Envoyer des emails en masse aux utilisateurs</p>
                  </div>
                </Link>
              </div>
            </div>
          </SuperAdminCheck>
        </div>
        )}

        {/* Actions rapides (affiché uniquement onglet Général) */}
        {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                to="/admin/content"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-md bg-blue-100 text-blue-800 mr-3">
                  <Edit className="h-5 w-5" />
                </div>
                <span>Gérer le contenu</span>
              </Link>
              
              <Link
                to="/admin/resources"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-md bg-blue-100 text-blue-800 mr-3">
                  <FileText className="h-5 w-5" />
                </div>
                <span>Gérer les ressources</span>
              </Link>
              
              <Link
                to="/admin/content?faq=moderate"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-md bg-blue-100 text-blue-800 mr-3">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span>Modérer la FAQ</span>
              </Link>
              
              <Link
                to="/admin/alumni-validation"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-md bg-purple-100 text-purple-800 mr-3">
                  <Award className="h-5 w-5" />
                </div>
                <span>Valider profils alumni</span>
              </Link>
              
              <Link
                to="/alumni"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-md bg-purple-100 text-purple-800 mr-3">
                  <Users className="h-5 w-5" />
                </div>
                <span>Voir l'annuaire alumni</span>
              </Link>
            </div>
          </div>
                    
        </div>
        )}

        {/* Recent activity (affiché uniquement onglet Général) */}
        {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Activité récente</h2>
          </div>
          <div className={
  `divide-y divide-gray-200 ${recentActivity.length > 5 ? 'max-h-80 overflow-y-auto' : ''}`
}>
  {loadingActivity ? (
    <div className="p-4 text-gray-400">Chargement...</div>
  ) : recentActivity.length === 0 ? (
    <div className="p-4 text-gray-400">Aucune activité récente.</div>
  ) : (
    recentActivity.map(activity => (
      <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center">
          <div className="p-2 rounded-md bg-blue-100 text-blue-800 mr-3">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-800">
              {formatAdminActivity(activity)}
            </div>
            <div className="text-xs text-gray-500">{new Date(activity.date).toLocaleString()}</div>
            {typeof activity.details?.title === 'string' && (
              <div className="text-sm text-gray-600">Titre : {activity.details.title}</div>
            )}
          </div>
        </div>
      </div>
    ))
  )}
</div>
        </div>
        )}
        
        
      </div>
    </div>
  );
};

export default AdminDashboard;