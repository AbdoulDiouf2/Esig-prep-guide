import React, { useEffect, useState } from 'react';
import { getAllUserProgressions } from '../../services/adminProgressionService';
import { db } from '../../firebase';
import { DocumentData } from 'firebase/firestore';
import { Link } from 'react-router-dom';

interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  emailVerified: boolean;
  photoURL?: string;
}

import { useContent } from '../../contexts/ContentContext';
import { Users } from 'lucide-react';

const AdminProgressionOverview: React.FC = () => {
  const { guideSections } = useContent();
  const [userProgressions, setUserProgressions] = useState<{ userId: string, completedSections: string[] }[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgressions = async () => {
      setLoading(true);
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
      setLoading(false);
    };
    fetchProgressions();
  }, []);

  const getUserGlobalProgress = (completedSections: string[]) => {
    if (!guideSections || guideSections.length === 0) return 0;
    return Math.round((completedSections.length / guideSections.length) * 100);
  };

  const getPhaseProgress = (completedSections: string[], phase: string) => {
    const phaseSections = guideSections.filter(section => section.phase === phase);
    return Math.round((completedSections.filter(sectionId => phaseSections.some(s => s.id === sectionId)).length / phaseSections.length) * 100);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="inline-flex items-center px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-600 text-white font-medium text-sm focus:outline-none">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Retour au dashboard
          </Link>
          <span className="flex items-center text-xl font-bold"><Users className="w-6 h-6 mr-2 text-white" /> Progression détaillée de tous les utilisateurs</span>
        </div>
      </div>
      <div className="w-full mx-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500">Chargement des progressions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Nom</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Email</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase whitespace-nowrap">Progression globale</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase whitespace-nowrap">Pré-arrivée</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase whitespace-nowrap">Pendant le processus</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase whitespace-nowrap">Post-CPS</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase whitespace-nowrap">Sections validées</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.filter(user => !user.isAdmin).map(user => {
                  const progression = userProgressions.find(p => p.userId === user.uid);
                  const completed = progression ? progression.completedSections.length : 0;
                  const percent = progression ? getUserGlobalProgress(progression.completedSections) : 0;
                  const preArrivalPercent = progression ? getPhaseProgress(progression.completedSections, 'pre-arrival') : 0;
                  const duringProcessPercent = progression ? getPhaseProgress(progression.completedSections, 'during-process') : 0;
                  const postCpsPercent = progression ? getPhaseProgress(progression.completedSections, 'post-cps') : 0;
                  return (
                    <tr key={user.uid}>
                      <td className="px-2 py-2 whitespace-nowrap text-gray-900">{user.displayName || '-'}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-gray-600">{user.email}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 inline-block align-middle">
                          <div className="bg-blue-700 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="ml-2 text-xs font-semibold text-blue-800">{percent}%</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center align-top">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 inline-block align-middle mb-1">
                          <div className="bg-blue-700 h-2.5 rounded-full" style={{ width: `${preArrivalPercent}%` }}></div>
                        </div>
                        <span className="ml-2 text-xs font-semibold text-blue-800">{preArrivalPercent}%</span>
                        <ul className="mt-2 text-xs text-left">
                          {guideSections.filter(s => s.phase === 'pre-arrival').map(section => (
                            <li key={section.id} className="flex items-center gap-1">
                              {progression && progression.completedSections.includes(section.id) ? (
                                <span className="text-green-600 font-bold">✔</span>
                              ) : (
                                <span className="text-red-500 font-bold">✗</span>
                              )}
                              <span>{section.title}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center align-top">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 inline-block align-middle mb-1">
                          <div className="bg-blue-700 h-2.5 rounded-full" style={{ width: `${duringProcessPercent}%` }}></div>
                        </div>
                        <span className="ml-2 text-xs font-semibold text-blue-800">{duringProcessPercent}%</span>
                        <ul className="mt-2 text-xs text-left">
                          {guideSections.filter(s => s.phase === 'during-process').map(section => (
                            <li key={section.id} className="flex items-center gap-1">
                              {progression && progression.completedSections.includes(section.id) ? (
                                <span className="text-green-600 font-bold">✔</span>
                              ) : (
                                <span className="text-red-500 font-bold">✗</span>
                              )}
                              <span>{section.title}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center align-top">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 inline-block align-middle mb-1">
                          <div className="bg-blue-700 h-2.5 rounded-full" style={{ width: `${postCpsPercent}%` }}></div>
                        </div>
                        <span className="ml-2 text-xs font-semibold text-blue-800">{postCpsPercent}%</span>
                        <ul className="mt-2 text-xs text-left">
                          {guideSections.filter(s => s.phase === 'post-cps').map(section => (
                            <li key={section.id} className="flex items-center gap-1">
                              {progression && progression.completedSections.includes(section.id) ? (
                                <span className="text-green-600 font-bold">✔</span>
                              ) : (
                                <span className="text-red-500 font-bold">✗</span>
                              )}
                              <span>{section.title}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">{completed} / {guideSections.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProgressionOverview;
