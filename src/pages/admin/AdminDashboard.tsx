import React, { useEffect, useState } from 'react';
import { getAllUserProgressions } from '../../services/adminProgressionService';
import { db } from '../../firebase';
import { DocumentData } from 'firebase/firestore';
import SuperAdminCheck from '../../components/routes/SuperAdminCheck';
import { UserDoc } from './AdminUserManager';

import { Link } from 'react-router-dom';
import { useContent } from '../../contexts/ContentContext';
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
  Plus,
  Cloud,
  Star,
  Video,
  BookOpen,
  Podcast,
  Award,
  BarChart
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
  const { resources, guideSections, faqItems } = useContent();
  const { recentActivity, loading: loadingActivity } = useRecentAdminActivity();

  // Progression utilisateurs
  const [userProgressions, setUserProgressions] = useState<{ userId: string, completedSections: string[] }[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);
  // Tabs
  const [activeTab, setActiveTab] = useState<'general' | 'alumni' | 'cps'>('general');

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
                to="/admin/feedbacks" 
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-white/80 hover:bg-white text-blue-900 border border-blue-200 shadow transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Feedbacks
              </Link>
              <Link 
                to="/admin/future-features" 
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-white/80 hover:bg-white text-blue-900 border border-blue-200 shadow transition-colors"
              >
                <Star className="w-4 h-4 mr-1.5" />
                Fonctionnalités à venir
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

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {activeTab === 'cps' && (
            <>
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
            </>
          )}
          {activeTab === 'general' && (
            <>
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
            </>
          )}
        </div>
        
        {/* KPI Progression (affiché uniquement onglet CPS) */}
        {activeTab === 'cps' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-700" /> Statistiques de progression des étudiants CPS
          </h2>
          {loadingProgress ? (
            <div className="text-center text-gray-500">Chargement des statistiques...</div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-800 mb-1">{users.filter(user => user.status === 'cps').length}</div>
                <div className="text-sm text-gray-600">Étudiants CPS inscrits</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-green-800">
                    {(() => {
                      const cpsUsers = users.filter(user => user.status === 'cps');
                      const total = cpsUsers.length;
                      if (total === 0) return '0%';
                      
                      const cpsUserIds = cpsUsers.map(user => user.uid);
                      const full = userProgressions
                        .filter(p => cpsUserIds.includes(p.userId) && getUserGlobalProgress(p.completedSections) === 100)
                        .length;
                        
                      return `${Math.round((full / total) * 100)}%`;
                    })()}
                  </span>
                  <span className="ml-2 text-lg text-gray-600">
                    {(() => {
                      const cpsUsers = users.filter(user => user.status === 'cps');
                      const total = cpsUsers.length;
                      if (total === 0) return '(0/0)';
                      
                      const cpsUserIds = cpsUsers.map(user => user.uid);
                      const full = userProgressions
                        .filter(p => cpsUserIds.includes(p.userId) && getUserGlobalProgress(p.completedSections) === 100)
                        .length;
                        
                      return `(${full}/${total})`;
                    })()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">ont terminé toutes les sections</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-yellow-800">
                    {(() => {
                      const cpsUsers = users.filter(user => user.status === 'cps');
                      const total = cpsUsers.length;
                      if (total === 0) return '0%';
                      
                      const cpsUserIds = cpsUsers.map(user => user.uid);
                      const cpsProgressions = userProgressions.filter(p => cpsUserIds.includes(p.userId));
                      if (cpsProgressions.length === 0) return '0%';
                      
                      const sum = cpsProgressions.reduce((acc, p) => acc + getUserGlobalProgress(p.completedSections), 0);
                      return `${Math.round(sum / cpsProgressions.length)}%`;
                    })()}
                  </span>
                  <span className="ml-2 text-lg text-gray-600">
                    {(() => {
                      const cpsUsers = users.filter(user => user.status === 'cps');
                      const total = cpsUsers.length;
                      if (total === 0) return '(0/0)';
                      
                      const cpsUserIds = cpsUsers.map(user => user.uid);
                      const cpsProgressions = userProgressions.filter(p => cpsUserIds.includes(p.userId));
                      return `(${cpsProgressions.length}/${total})`;
                    })()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">Progression moyenne</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-purple-800">
                    {(() => {
                      const cpsUsers = users.filter(user => user.status === 'cps');
                      const total = cpsUsers.length;
                      if (total === 0) return '0';
                      
                      const cpsUserIds = cpsUsers.map(user => user.uid);
                      return userProgressions
                        .filter(p => cpsUserIds.includes(p.userId) && getUserGlobalProgress(p.completedSections) >= 50)
                        .length;
                    })()}
                  </span>
                  <span className="ml-2 text-lg text-gray-600">
                    {(() => {
                      const cpsUsers = users.filter(user => user.status === 'cps');
                      const total = cpsUsers.length;
                      if (total === 0) return '(0/0)';
                      
                      const cpsUserIds = cpsUsers.map(user => user.uid);
                      const over50 = userProgressions
                        .filter(p => cpsUserIds.includes(p.userId) && getUserGlobalProgress(p.completedSections) >= 50)
                        .length;
                      return `(${over50}/${total})`;
                    })()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">étudiants CPS à plus de 50%</div>
              </div>
            </div>
            {/* KPI par phase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['pre-arrival', 'during-process', 'post-cps'].map((phase) => {
                const phaseSections = guideSections.filter(s => s.phase === phase);
                const phaseLabel = phase === 'pre-arrival' ? 'Pré-arrivée' : phase === 'during-process' ? 'Pendant le processus' : 'Post-CPS';
                // Filtrer pour n'avoir que les utilisateurs CPS
                const cpsUsers = users.filter(user => user.status === 'cps');
                const cpsUserIds = cpsUsers.map(user => user.uid);
                const cpsProgressions = userProgressions.filter(p => cpsUserIds.includes(p.userId));
                
                // Moyenne progression phase pour les étudiants CPS
                const avg = cpsProgressions.length === 0 || phaseSections.length === 0 ? 0 : Math.round(
                  cpsProgressions.reduce((acc, p) => acc + Math.round((p.completedSections.filter(id => phaseSections.some(s => s.id === id)).length / phaseSections.length) * 100), 0) / cpsProgressions.length
                );
                
                // % étudiants CPS ayant validé toute la phase
                const full = cpsUsers.length === 0 || phaseSections.length === 0 ? 0 : Math.round(
                  cpsProgressions.filter(p => phaseSections.every(s => p.completedSections.includes(s.id))).length / cpsUsers.length * 100
                );
                
                // Compter le nombre d'étudiants ayant terminé la phase
                const completedCount = phaseSections.length === 0 ? 0 : 
                  cpsProgressions.filter(p => phaseSections.every(s => p.completedSections.includes(s.id))).length;
                
                return (
                  <div className={`p-4 rounded-lg ${phase === 'pre-arrival' ? 'bg-blue-50' : phase === 'during-process' ? 'bg-green-50' : 'bg-purple-50'}`} key={phase}>
                    <div className={`text-3xl font-bold ${phase === 'pre-arrival' ? 'text-blue-800' : phase === 'during-process' ? 'text-green-800' : 'text-purple-800'} mb-1`}>
                      {avg}% <span className="text-lg">({cpsProgressions.length}/{cpsUsers.length})</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Progression moyenne {phaseLabel}</div>
                    <div className={`text-lg font-bold ${phase === 'pre-arrival' ? 'text-blue-800' : phase === 'during-process' ? 'text-green-800' : 'text-purple-800'} mb-1`}>
                      {full}% <span className="text-sm">({completedCount}/{cpsUsers.length})</span>
                    </div>
                    <div className="text-sm text-gray-600">ont terminé {phaseLabel}</div>
                  </div>
                );
              })}
            </div>
            {/* Nouvelle section de statistiques détaillées */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques détaillées des étudiants CPS</h3>

              {/* Sections nécessitant de l'attention */}
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Sections nécessitant de l'attention</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['pre-arrival', 'during-process', 'post-cps'].map((phase) => {
                    const phaseLabel = phase === 'pre-arrival' ? 'Pré-arrivée' : 
                                     phase === 'during-process' ? 'Pendant le processus' : 'Post-CPS';
                    const phaseColor = phase === 'pre-arrival' ? 'bg-blue-50 border-blue-200' : 
                                     phase === 'during-process' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200';
                    
                    return (
                      <div key={phase} className={`border rounded-lg p-4 ${phaseColor}`}>
                        <h5 className="font-medium text-gray-900 mb-3">{phaseLabel}</h5>
                        <div className="space-y-3">
                          {[...guideSections]
                            .filter(section => section.phase === phase)
                            .map(section => {
                              const cpsUsers = users.filter(user => user.status === 'cps');
                              const total = cpsUsers.length;
                              const completed = cpsUsers.filter(user => {
                                const userProgression = userProgressions.find(p => p.userId === user.uid);
                                return userProgression?.completedSections?.includes(section.id);
                              }).length;
                              
                              return {
                                ...section,
                                completionRate: total > 0 ? (completed / total) * 100 : 0
                              };
                            })
                            .sort((a, b) => a.completionRate - b.completionRate)
                            .slice(0, 3)
                            .map((section, index) => (
                              <div key={section.id} className={`p-3 bg-white rounded border ${index < 2 ? 'mb-2' : ''}`}>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-900 truncate" title={section.title}>{section.title}</span>
                                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                    {Math.round(section.completionRate)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                  <div 
                                    className="h-1.5 rounded-full"
                                    style={{
                                      width: `${section.completionRate}%`,
                                      backgroundColor: section.completionRate < 30 ? '#EF4444' : 
                                                     section.completionRate < 70 ? '#F59E0B' : '#10B981'
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          {guideSections.filter(s => s.phase === phase).length === 0 && (
                            <div className="text-sm text-gray-500 text-center py-2">Aucune section</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </>
          )}
          {/* Prévoir un graphique ici plus tard */}
        </div>
        )}

        {/* Stats overview (affiché uniquement onglet CPS) */}
        {activeTab === 'cps' && (
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
        )}

        
        
        {/* Quick actions (affiché uniquement onglet CPS) */}
        {activeTab === 'cps' && (
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
                to="/admin/users"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-md bg-blue-100 text-blue-800 mr-3">
                  <Users className="h-5 w-5" />
                </div>
                <span>Gérer les utilisateurs</span>
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
              {formatAdminActivity(activity, users)}
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
        
        {/* Phase overview (affiché uniquement onglet Général) */}
        {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Vue d'ensemble par phase</h2>
          
          <div className="space-y-6">
            {/* Post-CPS */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Post-CPS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{Array.isArray(guideSections) ? guideSections.filter(s => s.phase === 'post-cps').length : 0}</div>
                  <div className="text-sm text-gray-600">Sections</div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{Array.isArray(resources) ? resources.filter(r => r.phase === 'post-cps').length : 0}</div>
                  <div className="text-sm text-gray-600">Ressources</div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{Array.isArray(faqItems) ? faqItems.filter(f => f.phase === 'post-cps').length : 0}</div>
                  <div className="text-sm text-gray-600">Questions FAQ</div>
                </div>
              </div>
            </div>
            
            {/* During process */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Pendant les démarches</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{Array.isArray(guideSections) ? guideSections.filter(s => s.phase === 'during-process').length : 0}</div>
                  <div className="text-sm text-gray-600">Sections</div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{Array.isArray(resources) ? resources.filter(r => r.phase === 'during-process').length : 0}</div>
                  <div className="text-sm text-gray-600">Ressources</div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{Array.isArray(faqItems) ? faqItems.filter(f => f.phase === 'during-process').length : 0}</div>
                  <div className="text-sm text-gray-600">Questions FAQ</div>
                </div>
              </div>
            </div>
            
            {/* Pre-arrival */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Pré-arrivée</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{Array.isArray(guideSections) ? guideSections.filter(s => s.phase === 'pre-arrival').length : 0}</div>
                  <div className="text-sm text-gray-600">Sections</div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{Array.isArray(resources) ? resources.filter(r => r.phase === 'pre-arrival').length : 0}</div>
                  <div className="text-sm text-gray-600">Ressources</div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{Array.isArray(faqItems) ? faqItems.filter(f => f.phase === 'pre-arrival').length : 0}</div>
                  <div className="text-sm text-gray-600">Questions FAQ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        
        {/* Gestion du contenu avancé (affiché uniquement onglet Général) */}
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
      </div>
    </div>
  );
};

export default AdminDashboard;