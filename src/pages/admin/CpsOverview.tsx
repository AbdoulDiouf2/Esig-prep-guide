import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllUserProgressions } from '../../services/adminProgressionService';
import { db } from '../../firebase';
import { DocumentData, collection, getDocs } from 'firebase/firestore';
import { useContent } from '../../contexts/ContentContext';
import { UserDoc } from './AdminUserManager';
import { Users, Edit, FileText, MessageSquare, Plus } from 'lucide-react';

interface CpsOverviewProps {
  backPath?: string;
}

const CpsOverview: React.FC<CpsOverviewProps> = ({ backPath = '/admin/progressions' }) => {
  const { resources, guideSections, faqItems } = useContent();
  const [userProgressions, setUserProgressions] = useState<{ userId: string, completedSections: string[] }[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const currentYear = new Date().getFullYear();
  const [selectedPromo, setSelectedPromo] = useState<number>(0);

  const promoYears = useMemo(() => {
    const years = new Set(
      users.map(u => u.yearPromo).filter((y): y is number => typeof y === 'number')
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [users]);

  useEffect(() => {
    if (promoYears.length > 0 && selectedPromo === 0) {
      setSelectedPromo(promoYears[0]);
    }
  }, [promoYears, selectedPromo]);

  const matchesPromo = (user: UserDoc) => user.yearPromo === selectedPromo;

  useEffect(() => {
    const fetchProgressions = async () => {
      setLoadingProgress(true);
      const [progressions, usersSnap] = await Promise.all([
        getAllUserProgressions(),
        getDocs(collection(db, 'users'))
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

  const getUserGlobalProgress = (completedSections: string[]) => {
    if (!guideSections || guideSections.length === 0) return 0;
    const validIds = new Set(guideSections.map(s => s.id));
    const validCompleted = completedSections.filter(id => validIds.has(id));
    return Math.round((validCompleted.length / guideSections.length) * 100);
  };

  return (
    <>
      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Link to={backPath} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
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
      </div>

      {/* KPI Progression */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-700" /> Statistiques de progression des étudiants CPS
          </h2>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Promotion :</label>
            <select
              value={selectedPromo}
              onChange={e => setSelectedPromo(Number(e.target.value))}
              className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {promoYears.length === 0 ? (
                <option value={currentYear}>Promo {currentYear}</option>
              ) : (
                promoYears.map(year => (
                  <option key={year} value={year}>Promo {year}</option>
                ))
              )}
            </select>
            <span className="text-sm text-gray-500">
              {users.filter(u => (u.status === 'cps' || u.status === 'alumni') && u.yearPromo === selectedPromo).length} étudiant{users.filter(u => (u.status === 'cps' || u.status === 'alumni') && u.yearPromo === selectedPromo).length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
          <span className="font-semibold">Filtre actif :</span>
          {`Promotion ${selectedPromo} — ${users.filter(u => (u.status === 'cps' || u.status === 'alumni') && matchesPromo(u)).length} étudiant${users.filter(u => (u.status === 'cps' || u.status === 'alumni') && matchesPromo(u)).length > 1 ? 's' : ''} inscrit${users.filter(u => (u.status === 'cps' || u.status === 'alumni') && matchesPromo(u)).length > 1 ? 's' : ''}`}
        </div>
        {loadingProgress ? (
          <div className="text-center text-gray-500">Chargement des statistiques...</div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-800 mb-1">{users.filter(user => (user.status === 'cps' || user.status === 'alumni') && matchesPromo(user)).length}</div>
              <div className="text-sm text-gray-600">Étudiants inscrits (Promo {selectedPromo})</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-green-800">
                  {(() => {
                    const cpsUsers = users.filter(user => (user.status === 'cps' || user.status === 'alumni') && matchesPromo(user));
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
                    const cpsUsers = users.filter(user => (user.status === 'cps' || user.status === 'alumni') && matchesPromo(user));
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
                    const cpsUsers = users.filter(user => (user.status === 'cps' || user.status === 'alumni') && matchesPromo(user));
                    const total = cpsUsers.length;
                    if (total === 0) return '0%';
                    const cpsUserIds = cpsUsers.map(user => user.uid);
                    const cpsProgressions = userProgressions.filter(p => cpsUserIds.includes(p.userId));
                    const sum = cpsProgressions.reduce((acc, p) => acc + getUserGlobalProgress(p.completedSections), 0);
                    return `${Math.round(sum / total)}%`;
                  })()}
                </span>
                <span className="ml-2 text-lg text-gray-600">
                  {(() => {
                    const cpsUsers = users.filter(user => (user.status === 'cps' || user.status === 'alumni') && matchesPromo(user));
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
                    const cpsUsers = users.filter(user => (user.status === 'cps' || user.status === 'alumni') && matchesPromo(user));
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
                    const cpsUsers = users.filter(user => (user.status === 'cps' || user.status === 'alumni') && matchesPromo(user));
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
              const cpsUsers = users.filter(user => (user.status === 'cps' || user.status === 'alumni') && matchesPromo(user));
              const cpsUserIds = cpsUsers.map(user => user.uid);
              const cpsProgressions = userProgressions.filter(p => cpsUserIds.includes(p.userId));
              const avg = cpsUsers.length === 0 || phaseSections.length === 0 ? 0 : Math.round(
                cpsProgressions.reduce((acc, p) => acc + Math.round((p.completedSections.filter(id => phaseSections.some(s => s.id === id)).length / phaseSections.length) * 100), 0) / cpsUsers.length
              );
              const full = cpsUsers.length === 0 || phaseSections.length === 0 ? 0 : Math.round(
                cpsProgressions.filter(p => phaseSections.every(s => p.completedSections.includes(s.id))).length / cpsUsers.length * 100
              );
              const completedCount = phaseSections.length === 0 ? 0 :
                cpsProgressions.filter(p => phaseSections.every(s => p.completedSections.includes(s.id))).length;
              return (
                <div className={`p-4 rounded-lg ${phase === 'pre-arrival' ? 'bg-blue-50' : phase === 'during-process' ? 'bg-green-50' : 'bg-purple-50'}`} key={phase}>
                  <div className={`text-3xl font-bold ${phase === 'pre-arrival' ? 'text-blue-800' : phase === 'during-process' ? 'text-green-800' : 'text-purple-800'} mb-1`}>
                    {avg}% <span className="text-lg">({cpsUsers.length} étudiants)</span>
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
          {/* Sections nécessitant attention */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques détaillées des étudiants CPS</h3>
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
                            const cpsUsers = users.filter(user => (user.status === 'cps' || user.status === 'alumni') && matchesPromo(user));
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

      {/* FAQ lists + Add content */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Questions répondues */}
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

          {/* Questions en attente */}
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
        <div className="bg-white rounded-lg shadow p-6 w-full col-span-full mt-6">
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

      {/* Phase overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Vue d'ensemble par phase</h2>
        <div className="space-y-6">
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
    </>
  );
};

export default CpsOverview;
