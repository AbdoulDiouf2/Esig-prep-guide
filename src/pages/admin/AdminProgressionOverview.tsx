import React, { useEffect, useState, useCallback } from 'react';
import { getAllUserProgressions } from '../../services/adminProgressionService';
import { db } from '../../firebase';
import { DocumentData } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { getUserSubsectionData } from '../../services/subsectionDataService';
import { useContent } from '../../contexts/ContentContext';
import { Users, Plane, Check, X, Calendar, MapPin, Bus } from 'lucide-react';

interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  emailVerified: boolean;
  photoURL?: string;
  status?: string;
}

// Interface pour les données d'arrivée récupérées des sous-sections
interface ArrivalInfo {
  hasTicket: boolean;             // Achat de billet
  arrivalDate: string;            // Date d'arrivée
  arrivalTime: string;            // Heure d'arrivée
  airport: string;                // Aéroport d'arrivée
  hasOwnTransportation: boolean;  // Moyen de transport personnel
  wantGroupTransport: boolean;    // Souhait de prise en charge commune
}

const AdminProgressionOverview: React.FC = () => {
  const { guideSections } = useContent();
  const [userProgressions, setUserProgressions] = useState<{ userId: string, completedSections: string[] }[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'progressions' | 'visa'>('progressions');
  const [arrivalData, setArrivalData] = useState<Record<string, ArrivalInfo>>({});
  
  // Déterminer le statut visa selon les sections complétées
  // Défini avec useCallback pour éviter les re-rendus inutiles
  const getUserVisaStatus = useCallback((userId: string, progressions: { userId: string, completedSections: string[] }[]) => {
    // Utiliser uniquement les progressions fournies en paramètre, pas l'état userProgressions
    const progression = progressions.find(p => p.userId === userId);
    if (!progression) return null;
    
    // Vérifier si l'utilisateur a complété les sections spécifiques au visa
    const visaObtainedSection = guideSections.find(section => 
      section.title?.toLowerCase().includes('vous avez obtenu votre visa'));
    const visaRefusedSection = guideSections.find(section => 
      section.title?.toLowerCase().includes('en cas de refus de visa'));
    
    if (visaObtainedSection && progression.completedSections.includes(visaObtainedSection.id)) {
      return 'obtained';
    } else if (visaRefusedSection && progression.completedSections.includes(visaRefusedSection.id)) {
      return 'refused';
    }
    
    return null;
  }, [guideSections]); // Uniquement guideSections en dépendance

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

      // Filtrer les progressions pour ne garder que les sections qui existent encore
      const validProgressions = progressions.map(progression => ({
        userId: progression.userId,
        completedSections: progression.completedSections.filter(sectionId => 
          guideSections.some(section => section.id === sectionId)
        )
      }));

      setUserProgressions(validProgressions);
      setUsers(usersList);
      setLoading(false);
      
      // Déclencher la récupération des données d'arrivée pour les utilisateurs ayant obtenu leur visa
      fetchArrivalData(usersList, validProgressions);
    };
    
    // Fonction pour récupérer les données d'arrivée depuis les sous-sections
    const fetchArrivalData = async (usersList: UserDoc[], progressions: { userId: string, completedSections: string[] }[]) => {
      const arrivalInfo: Record<string, ArrivalInfo> = {};
      
      // Récupérer les données d'arrivée uniquement pour les utilisateurs CPS ayant obtenu leur visa
      const usersWithVisa = usersList.filter(user => 
        user.status === 'cps' && 
        getUserVisaStatus(user.uid, progressions) === 'obtained'
      );
      
      for (const user of usersWithVisa) {
        try {
          // Récupérer les données de sous-sections pour l'utilisateur
          const subsectionData = await getUserSubsectionData(user.uid);
          
          // Extraire les informations d'arrivée des données de sous-sections
          if (subsectionData && subsectionData.inputValues) {
            // Log pour debug
            console.log('Données de sous-section pour', user.displayName || user.uid);
            console.log('Valeurs disponibles:', subsectionData.inputValues);
            
            const values = subsectionData.inputValues;
            const keys = Object.keys(values);
            
            // Stratégie: chercher les clés par leurs valeurs ou patterns plutôt que par ID
            
            // Initialiser l'objet avec des valeurs par défaut
            const info: ArrivalInfo = {
              hasTicket: false,
              arrivalDate: '',
              arrivalTime: '',
              airport: '',
              hasOwnTransportation: false,
              wantGroupTransport: false
            };
            
            // Identifier la clé pour le billet d'avion
            const ticketKey = keys.find(k => values[k] === 'Oui' && k.includes('ticket') || 
                                       values[k] === 'yes' && k.includes('ticket') ||
                                       values[k] === 'Oui');
            if (ticketKey) info.hasTicket = true;
            
            // Identifier la clé pour la date d'arrivée
            const dateKey = keys.find(k => {
              const val = values[k];
              return typeof val === 'string' && 
                    (val.includes('2025') || val.includes('Septembre') || 
                     val.includes('/') || val.match(/\d{2}:\d{2}/));
            });
            
            if (dateKey) {
              const fullDate = values[dateKey];
              // Séparer date et heure si possible
              if (typeof fullDate === 'string') {
                const parts = fullDate.split(' à '); // Format "05 Septembre 2025 à 12:00"
                if (parts.length > 1) {
                  info.arrivalDate = parts[0];
                  info.arrivalTime = parts[1];
                } else {
                  info.arrivalDate = fullDate;
                }
              }
            }
            
            // Identifier la clé pour l'aéroport
            const airportKey = keys.find(k => {
              const val = values[k];
              return typeof val === 'string' && 
                    (val === 'CDG' || val === 'ORY' || val.includes('Charles') || 
                     val.includes('Orly') || val.includes('airport'));
            });
            
            if (airportKey) info.airport = values[airportKey];
            
            // Identifier la clé pour le transport personnel
            const ownTransportKey = keys.find(k => {
              return (values[k] === 'Oui' || values[k] === 'yes') && 
                     (k.includes('own') || k.includes('personnel'));
            });
            
            if (ownTransportKey) info.hasOwnTransportation = true;
            
            // Identifier la clé pour la prise en charge commune
            const groupTransportKey = keys.find(k => {
              return (values[k] === 'Oui' || values[k] === 'yes') && 
                     (k.includes('group') || k.includes('commun'));
            });
            
            if (groupTransportKey) info.wantGroupTransport = true;
            
            // Assigner les données trouvées
            arrivalInfo[user.uid] = info;
            
            // Log des données extraites
            console.log('Données d\'arrivée extraites:', arrivalInfo[user.uid]);
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des données d'arrivée pour ${user.uid}:`, error);
        }
      }
      
      setArrivalData(arrivalInfo);
    };
    
    fetchProgressions();
  }, [guideSections]); // Retiré getUserVisaStatus des dépendances pour éviter la boucle de rendu

  const getUserGlobalProgress = (completedSections: string[]) => {
    if (!guideSections || guideSections.length === 0) return 0;
    // Filtrer pour ne garder que les sections qui existent encore
    const validCompletedSections = completedSections.filter(sectionId => 
      guideSections.some(section => section.id === sectionId)
    );
    return Math.round((validCompletedSections.length / guideSections.length) * 100);
  };

  const getPhaseProgress = (completedSections: string[], phase: string) => {
    const phaseSections = guideSections.filter(section => section.phase === phase);
    if (phaseSections.length === 0) return 0;
    // Filtrer pour ne garder que les sections existantes
    const validCompletedSections = completedSections.filter(sectionId => 
      phaseSections.some(s => s.id === sectionId)
    );
    return Math.round((validCompletedSections.length / phaseSections.length) * 100);
  };
  
  // Filtrer les utilisateurs CPS 
  const cpsUsers = users.filter(user => user.status === 'cps');
  
  // Note: La fonction getUserVisaStatus a été déplacée plus haut dans le composant avec useCallback
  
  // Pour l'onglet "progressions", afficher tous les étudiants CPS
  const usersInProgress = cpsUsers;
  
  // Pour l'onglet "visa & arrivée", filtrer uniquement ceux avec un statut visa
  const usersWithVisaStatus = cpsUsers.filter(user => {
    const status = getUserVisaStatus(user.uid, userProgressions);
    return status === 'obtained' || status === 'refused';
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="inline-flex items-center px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-600 text-white font-medium text-sm focus:outline-none">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Retour au dashboard
          </Link>
          <span className="flex items-center text-xl font-bold"><Users className="w-6 h-6 mr-2 text-white" /> Gestion des étudiants CPS</span>
        </div>
      </div>
      
      {/* Système d'onglets */}
      <div className="flex border-b border-gray-200 mb-4 bg-white shadow-sm">
        <button
          onClick={() => setActiveTab('progressions')}
          className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'progressions' 
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Users className="inline-block w-5 h-5 mr-2 -mt-1" />
          Progressions actuelles
        </button>
        <button
          onClick={() => setActiveTab('visa')}
          className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'visa' 
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Plane className="inline-block w-5 h-5 mr-2 -mt-1" />
          Statut visa & Arrivée
        </button>
      </div>
      
      <div className="w-full mx-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500">Chargement des progressions...</div>
        ) : activeTab === 'progressions' ? (
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
                {usersInProgress.filter(user => !user.isAdmin && user.status === 'cps').map(user => {
                  const progression = userProgressions.find(p => p.userId === user.uid);
                  // Assurons-nous que nous ne comptons que les sections qui existent encore
                  const validCompletedSections = progression ? progression.completedSections.filter(sectionId => 
                    guideSections.some(section => section.id === sectionId)
                  ) : [];
                  const completed = validCompletedSections.length;
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
                              {progression && validCompletedSections.includes(section.id) ? (
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
                              {progression && validCompletedSections.includes(section.id) ? (
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
                              {progression && validCompletedSections.includes(section.id) ? (
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
        ) : (
          // Onglet Statut visa & Arrivée
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <Plane className="w-5 h-5 mr-2" /> Statut visa & Informations d'arrivée
              </h3>
            </div>
            
            {usersWithVisaStatus.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Aucun étudiant n'a encore obtenu ou s'est vu refuser son visa.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut visa</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'arrivée</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aéroport</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Transport groupé</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersWithVisaStatus.map(user => (
                      <tr key={user.uid}>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.photoURL ? (
                              <img className="h-8 w-8 rounded-full mr-2" src={user.photoURL} alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                <Users className="h-4 w-4 text-blue-500" />
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900">{user.displayName || 'Sans nom'}</div>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          {getUserVisaStatus(user.uid, userProgressions) === 'obtained' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <Check className="h-4 w-4 mr-1" /> Obtenu
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              <X className="h-4 w-4 mr-1" /> Refusé
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {arrivalData[user.uid]?.hasTicket ? (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mb-1">Billet acheté</span>
                              {arrivalData[user.uid]?.arrivalDate ? (
                                <div className="flex items-center mt-1">
                                  <Calendar className="h-4 w-4 mr-1 text-blue-500" /> 
                                  {arrivalData[user.uid].arrivalDate}
                                  {arrivalData[user.uid].arrivalTime && (
                                    <span className="ml-2 text-gray-700">à {arrivalData[user.uid].arrivalTime}</span>
                                  )}
                                </div>
                              ) : 'Date non renseignée'}
                            </div>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pas encore de billet</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {arrivalData[user.uid]?.airport ? (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-blue-500" /> 
                              {arrivalData[user.uid].airport}
                            </div>
                          ) : (
                            'Non renseigné'
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          {getUserVisaStatus(user.uid, userProgressions) === 'obtained' && (
                            <div className="flex flex-col space-y-2">
                              <div>
                                {arrivalData[user.uid]?.hasOwnTransportation ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Transport personnel</span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Sans transport</span>
                                )}
                              </div>
                              
                              <div>
                                {arrivalData[user.uid]?.wantGroupTransport ? (
                                  <div className="flex items-center justify-center">
                                    <Bus className="h-4 w-4 mr-1 text-green-600" /> 
                                    <span className="text-xs font-medium text-green-600">Prise en charge commune</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">Pas de prise en charge</span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProgressionOverview;
