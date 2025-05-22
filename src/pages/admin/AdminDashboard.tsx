import React, { useEffect, useState } from 'react';
import { getAllUserProgressions } from '../../services/adminProgressionService';
import { db } from '../../firebase';
import { DocumentData } from 'firebase/firestore';

interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  emailVerified: boolean;
  photoURL?: string;
}

import { Link } from 'react-router-dom';
import { useContent } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  MessageSquare,
  FileText,
  Edit,
  ClipboardList,
  HelpCircle,
  Plus,
  Cloud,
  Star
} from 'lucide-react';
import { useRecentAdminActivity } from './useRecentAdminActivity';

import type { LogActivityParams } from './adminActivityLog';

function formatAdminActivity(activity: LogActivityParams) {
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
  const user = activity.user || 'Admin';
  const action = actionMap[activity.type] || activity.type.toLowerCase();
  const target = targetMap[activity.target] || activity.target.toLowerCase();
  return `${user} ${action} ${target}`;
}


const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { resources, guideSections, faqItems } = useContent();
  const { recentActivity, loading: loadingActivity } = useRecentAdminActivity();

  // Progression utilisateurs
  const [userProgressions, setUserProgressions] = useState<{ userId: string, completedSections: string[] }[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    const fetchProgressions = async () => {
      setLoadingProgress(true);
      const [progressions, usersSnap] = await Promise.all([
        getAllUserProgressions(),
        import('firebase/firestore').then(({ collection, getDocs }) => getDocs(collection(db, 'users')))
      ]);
      const usersList: UserDoc[] = [];
      usersSnap.forEach((docSnap: DocumentData) => {
        usersList.push({ ...docSnap.data(), uid: docSnap.id } as UserDoc);
      });
      setUserProgressions(progressions);
      setUsers(usersList);
      setLoadingProgress(false);
    };
    fetchProgressions();
  }, []);

  // Calcul progression globale
  const getUserGlobalProgress = (completedSections: string[]) => {
    if (!guideSections || guideSections.length === 0) return 0;
    return Math.round((completedSections.length / guideSections.length) * 100);
  };

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
                to="/admin/future-features" 
                className="flex items-center justify-center px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded transition-colors w-full sm:w-auto"
                title="Voir les fonctionnalités futures"
              >
                <Star className="h-4 w-4 mr-1" /> Fonctionnalités futures
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
        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link to="/admin/progressions" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Users className="-ml-1 mr-2 h-5 w-5" />
            Progression des utilisateurs
          </Link>
          <Link to="/admin/content" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Edit className="-ml-1 mr-2 h-5 w-5" />
            Éditer le contenu
          </Link>
          <Link to="/admin/resources" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <FileText className="-ml-1 mr-2 h-5 w-5" />
            Gérer les ressources
          </Link>
          <Link to="/admin/dropbox" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Cloud className="-ml-1 mr-2 h-5 w-5" />
            Gestionnaire Dropbox
          </Link>
          <Link to="/admin/users" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Users className="-ml-1 mr-2 h-5 w-5" />
            Gérer les utilisateurs
          </Link>
          <Link to="/admin/activity" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <ClipboardList className="-ml-1 mr-2 h-5 w-5" />
            Journal d'activité détaillé
          </Link>
        </div>
        
        {/* KPI Progression */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-700" /> Statistiques de progression des utilisateurs
          </h2>
          {loadingProgress ? (
            <div className="text-center text-gray-500">Chargement des statistiques...</div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-800 mb-1">{users.length}</div>
                <div className="text-sm text-gray-600">Utilisateurs inscrits</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-800 mb-1">
                  {(() => {
                    const total = users.length;
                    const full = userProgressions.filter(p => getUserGlobalProgress(p.completedSections) === 100).length;
                    return total === 0 ? 0 : Math.round((full / total) * 100);
                  })()}%
                </div>
                <div className="text-sm text-gray-600">ont terminé toutes les sections</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-800 mb-1">
                  {(() => {
                    if (userProgressions.length === 0) return 0;
                    const sum = userProgressions.reduce((acc, p) => acc + getUserGlobalProgress(p.completedSections), 0);
                    return Math.round(sum / userProgressions.length);
                  })()}%
                </div>
                <div className="text-sm text-gray-600">Progression moyenne</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-800 mb-1">
                  {userProgressions.filter(p => getUserGlobalProgress(p.completedSections) >= 50).length}
                </div>
                <div className="text-sm text-gray-600">utilisateurs à plus de 50%</div>
              </div>
            </div>
            {/* KPI par phase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['pre-arrival', 'during-process', 'post-cps'].map((phase) => {
                const phaseSections = guideSections.filter(s => s.phase === phase);
                const phaseLabel = phase === 'pre-arrival' ? 'Pré-arrivée' : phase === 'during-process' ? 'Pendant le processus' : 'Post-CPS';
                const color = phase === 'pre-arrival' ? 'blue' : phase === 'during-process' ? 'green' : 'purple';
                // Moyenne progression phase
                const avg = userProgressions.length === 0 || phaseSections.length === 0 ? 0 : Math.round(
                  userProgressions.reduce((acc, p) => acc + Math.round((p.completedSections.filter(id => phaseSections.some(s => s.id === id)).length / phaseSections.length) * 100), 0) / userProgressions.length
                );
                // % users ayant validé toute la phase
                const full = userProgressions.length === 0 || phaseSections.length === 0 ? 0 : Math.round(
                  userProgressions.filter(p => phaseSections.every(s => p.completedSections.includes(s.id))).length / userProgressions.length * 100
                );
                return (
                  <div className={`p-4 bg-${color}-50 rounded-lg`} key={phase}>
                    <div className={`text-3xl font-bold text-${color}-800 mb-1`}>{avg}%</div>
                    <div className="text-sm text-gray-600 mb-1">Progression moyenne {phaseLabel}</div>
                    <div className={`text-lg font-bold text-${color}-800 mb-1`}>{full}%</div>
                    <div className="text-sm text-gray-600">ont terminé {phaseLabel}</div>
                  </div>
                );
              })}
            </div>
            </>
          )}
          {/* Prévoir un graphique ici plus tard */}
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-800">
                <FileText className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ressources</p>
                <p className="text-2xl font-semibold text-gray-900">{Array.isArray(resources) ? resources.length : 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-800">
                <Edit className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sections de guide</p>
                <p className="text-2xl font-semibold text-gray-900">{Array.isArray(guideSections) ? guideSections.length : 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-800">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Questions FAQ</p>
                <p className="text-2xl font-semibold text-gray-900">{Array.isArray(faqItems) ? faqItems.length : 0}</p>
              </div>
            </div>
          </div>
        </div>

        
        
        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          {/* Liste des FAQ en deux sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Questions répondues */}
            <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                  Questions répondues
                </h2>
                {Array.isArray(faqItems) && faqItems.filter(faq => faq.isAnswered).length > 5 && (
                  <span className="text-xs text-gray-500">Défilez pour voir plus</span>
                )}
              </div>
              <ul className={`divide-y divide-gray-200 flex-grow ${Array.isArray(faqItems) && faqItems.filter(faq => faq.isAnswered).length > 5 ? 'max-h-80 overflow-y-auto pr-2' : ''}`}>
                {Array.isArray(faqItems) && faqItems.filter(faq => faq.isAnswered).length > 0 ? 
                  faqItems.filter(faq => faq.isAnswered).map((faq) => (
                    <li key={faq.id} className="flex items-center justify-between py-2">
                      <div className="flex-grow pr-2">
                        <div className="flex items-center">
                          <span className="text-gray-800 line-clamp-1">{faq.question}</span>
                          {faq.isApproved ? (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Public
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                              Non publié
                            </span>
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500">{faq.phase === 'post-cps' ? 'Post-CPS' : faq.phase === 'during-process' ? 'Démarches' : 'Pré-arrivée'}</span>
                          {faq.userEmail && (
                            <span className="text-xs text-gray-500 ml-2">· {faq.userEmail}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Link
                          to={`/admin/content?edit=${faq.id}`}
                          className="inline-flex items-center px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-medium"
                        >
                          Modifier
                        </Link>
                      </div>
                    </li>
                  )) : (
                    <li className="text-gray-400 p-4">Aucune question répondue pour le moment.</li>
                  )
                }
              </ul>
            </div>
            
            {/* Section 2: Questions en attente */}
            <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></span>
                  Questions en attente
                  {Array.isArray(faqItems) && (
                    <span className="ml-2 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                      {faqItems.filter(faq => !faq.isAnswered).length}
                    </span>
                  )}
                </h2>
                {Array.isArray(faqItems) && faqItems.filter(faq => !faq.isAnswered).length > 5 && (
                  <span className="text-xs text-gray-500">Défilez pour voir plus</span>
                )}
              </div>
              <ul className={`divide-y divide-gray-200 flex-grow ${Array.isArray(faqItems) && faqItems.filter(faq => !faq.isAnswered).length > 5 ? 'max-h-80 overflow-y-auto pr-2' : ''}`}>
                {Array.isArray(faqItems) && faqItems.filter(faq => !faq.isAnswered).length > 0 ? 
                  faqItems.filter(faq => !faq.isAnswered).map((faq) => (
                    <li key={faq.id} className="flex items-center justify-between py-2">
                      <div className="flex-grow pr-2">
                        <span className="text-gray-800 line-clamp-1">{faq.question}</span>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500">{faq.phase === 'post-cps' ? 'Post-CPS' : faq.phase === 'during-process' ? 'Démarches' : 'Pré-arrivée'}</span>
                          {faq.userEmail && (
                            <span className="text-xs text-gray-500 ml-2">· {faq.userEmail}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Link
                          to={`/admin/content?edit=${faq.id}`}
                          className="inline-flex items-center px-3 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 text-xs font-medium"
                        >
                          Répondre
                        </Link>
                      </div>
                    </li>
                  )) : (
                    <li className="text-gray-400 p-4">Aucune question en attente de réponse.</li>
                  )
                }
              </ul>
            </div>
          </div>

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
                to="/admin/users"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-md bg-blue-100 text-blue-800 mr-3">
                  <Users className="h-5 w-5" />
                </div>
                <span>Gérer les utilisateurs</span>
              </Link>
            </div>
          </div>
                    
          <div className="bg-white rounded-lg shadow p-6 w-full col-span-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Ajouter du contenu</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
              <Link
                to="/admin/content?new=section"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-md bg-green-100 text-green-800 mr-3">
                  <Plus className="h-5 w-5" />
                </div>
                <span>Ajouter une section de guide</span>
              </Link>
              
              <Link
                to="/admin/resources?new=resource"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-md bg-green-100 text-green-800 mr-3">
                  <Plus className="h-5 w-5" />
                </div>
                <span>Ajouter une ressource</span>
              </Link>
              
              <Link
                to="/admin/content?new=faq"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-md bg-green-100 text-green-800 mr-3">
                  <Plus className="h-5 w-5" />
                </div>
                <span>Ajouter une question FAQ</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Recent activity */}
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
        
        {/* Phase overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Vue d'ensemble par phase</h2>
          
          <div className="space-y-6">
            {/* Post-CPS */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Post-CPS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Sections</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Array.isArray(guideSections) ? guideSections.filter(s => s.phase === 'post-cps').length : 0}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Ressources</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Array.isArray(resources) ? resources.filter(r => r.phase === 'post-cps').length : 0}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Questions FAQ</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Array.isArray(faqItems) ? faqItems.filter(f => f.phase === 'post-cps').length : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* During process */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Pendant les démarches</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Sections</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Array.isArray(guideSections) ? guideSections.filter(s => s.phase === 'during-process').length : 0}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Ressources</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Array.isArray(resources) ? resources.filter(r => r.phase === 'during-process').length : 0}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Questions FAQ</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Array.isArray(faqItems) ? faqItems.filter(f => f.phase === 'during-process').length : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pre-arrival */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Pré-arrivée</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Sections</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Array.isArray(guideSections) ? guideSections.filter(s => s.phase === 'pre-arrival').length : 0}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Ressources</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Array.isArray(resources) ? resources.filter(r => r.phase === 'pre-arrival').length : 0}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Questions FAQ</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Array.isArray(faqItems) ? faqItems.filter(f => f.phase === 'pre-arrival').length : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;