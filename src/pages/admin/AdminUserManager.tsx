import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Shield, UserMinus, UserPlus, AlertTriangle, Edit, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PasswordModal from '../../components/PasswordModal';
import { logAdminActivity } from './adminActivityLog';

// Typage strict de la réponse REST Firebase Auth
export interface FirebaseAuthUser {
  localId: string;
  email: string;
  displayName?: string;
  emailVerified?: boolean;
  photoUrl?: string;
  [key: string]: unknown;
}
interface FirebaseAuthBatchGetResponse {
  users?: FirebaseAuthUser[];
  nextPageToken?: string;
}
// Fonction utilitaire pour récupérer tous les utilisateurs Firebase Auth via REST API
async function fetchAllFirebaseAuthUsers(apiKey: string): Promise<FirebaseAuthUser[]> {
  let users: FirebaseAuthUser[] = [];
  let nextPageToken = undefined;
  do {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${process.env.REACT_APP_FIREBASE_PROJECT_ID}/accounts:batchGet?key=${apiKey}` + (nextPageToken ? `&nextPageToken=${nextPageToken}` : ''), {
      method: 'GET',
    });
    const data: FirebaseAuthBatchGetResponse = await res.json();
    if (data && data.users) users = users.concat(data.users);
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  return users;
}

// Type pour les timestamps Firestore
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean; // Ajouté pour la gestion du super admin
  isEditor?: boolean;     // Ajouté pour la gestion des éditeurs
  emailVerified: boolean;
  photoURL?: string;
  yearPromo?: number;     // Année de promotion (année de sortie de prépa)
  status?: string;        // Statut de l'utilisateur (actif, suspendu, etc.)
  createdAt?: string | FirestoreTimestamp | number | Date;  // Date de création du profil (plusieurs formats possibles)
  lastLogin?: string | FirestoreTimestamp | number | Date;  // Ajout du champ lastLogin
}

const AdminUserManager: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<{uid: string, action: 'toggleAdmin' | 'toggleEditor'} | null>(null);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUsers, setAuthUsers] = useState<FirebaseAuthUser[]>([]);
  const [loadingAuthUsers, setLoadingAuthUsers] = useState(false);
  const [missingProfiles, setMissingProfiles] = useState<FirebaseAuthUser[]>([]);
  const { currentUser } = useAuth();
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);
  const navigate = useNavigate();
  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY || '';
  
  // Filtres
  const [roleFilter, setRoleFilter] = useState<'tous' | 'admin' | 'editor' | 'standard'>('tous');
  const [statusFilter, setStatusFilter] = useState<'tous' | 'esigelec' | 'cps' | 'alumni' | 'autres'>('tous');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 15;

  // Fonction fetchUsers accessible partout dans le composant
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList: UserDoc[] = [];
      querySnapshot.forEach((docSnap) => {
        userList.push(docSnap.data() as UserDoc);
      });
      setUsers(userList);
    } catch {
      setError('Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Récupère les utilisateurs Auth qui n'ont pas de profil Firestore
  useEffect(() => {
    const fetchAuthUsers = async () => {
      setLoadingAuthUsers(true);
      try {
        if (!apiKey) return;
        const allAuthUsers = await fetchAllFirebaseAuthUsers(apiKey);
        setAuthUsers(allAuthUsers);
      } catch {
        // ignore
      } finally {
        setLoadingAuthUsers(false);
      }
    };
    fetchAuthUsers();
  }, [apiKey]);

  useEffect(() => {
    // Compare les uid
    if (authUsers.length && users.length) {
      const missing = authUsers.filter(au => !users.some(u => u.uid === au.localId));
      setMissingProfiles(missing);
    }
  }, [authUsers, users]);

  // Vérifier si l'utilisateur actuel est un super admin
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const userProfile = users.find(u => u.uid === currentUser.uid);
      setCurrentUserIsSuperAdmin(!!userProfile?.isSuperAdmin);
    }
  }, [currentUser, users]);

  const handleToggleAdmin = async (uid: string) => {
    setModalOpen(true);
    setPendingUser({ uid, action: 'toggleAdmin' });
    setModalError(null);
  };

  const handleToggleEditor = async (uid: string) => {
    setModalOpen(true);
    setPendingUser({ uid, action: 'toggleEditor' });
    setModalError(null);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!pendingUser) return;
    setModalLoading(true);
    setModalError(null);
    if (password !== import.meta.env.VITE_TOGGLE_PASSWORD) {
      setModalError('Mot de passe incorrect.');
      setModalLoading(false);
      return;
    }
    // Vérification super admin
    const targetUser = users.find(u => u.uid === pendingUser.uid);
    // Permettre à un super admin de modifier d'autres super admins
    if (targetUser?.isSuperAdmin && targetUser.uid !== currentUser?.uid && !currentUserIsSuperAdmin) {
      setModalError("Impossible de modifier le rôle d'un admin principal.");
      setModalLoading(false);
      return;
    }
    try {
      if (pendingUser.action === 'toggleAdmin') {
        const newAdminStatus = !targetUser?.isAdmin;
        await updateDoc(doc(db, 'users', pendingUser.uid), { isAdmin: newAdminStatus });
        setUsers((prev) =>
          prev.map((user) =>
            user.uid === pendingUser.uid ? { ...user, isAdmin: newAdminStatus } : user
          )
        );
        
        // Log de l'activité
        await logAdminActivity({
          type: newAdminStatus ? 'Ajout' : 'Suppression',
          target: 'Utilisateur',
          targetId: pendingUser.uid,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: { 
            action: 'Changement de rôle administrateur',
            userId: pendingUser.uid,
            newStatus: newAdminStatus ? 'Administrateur' : 'Utilisateur standard'
          }
        });
        
      } else if (pendingUser.action === 'toggleEditor') {
        const newEditorStatus = !targetUser?.isEditor;
        await updateDoc(doc(db, 'users', pendingUser.uid), { isEditor: newEditorStatus });
        setUsers((prev) =>
          prev.map((user) =>
            user.uid === pendingUser.uid ? { ...user, isEditor: newEditorStatus } : user
          )
        );
        
        // Log de l'activité
        await logAdminActivity({
          type: newEditorStatus ? 'Ajout' : 'Suppression',
          target: 'Utilisateur',
          targetId: pendingUser.uid,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: { 
            action: 'Changement de rôle éditeur',
            userId: pendingUser.uid,
            newStatus: newEditorStatus ? 'Éditeur' : 'Utilisateur standard'
          }
        });
      }
      setModalOpen(false);
      setPendingUser(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setModalError('Erreur lors de la mise à jour du statut utilisateur.');
    } finally {
      setModalLoading(false);
    }
  };

  // Création d'un profil Firestore pour un utilisateur Auth
  const handleCreateFirestoreProfile = async (authUser: FirebaseAuthUser) => {
    try {
      await setDoc(doc(db, 'users', authUser.localId), {
        uid: authUser.localId,
        email: authUser.email,
        displayName: authUser.displayName || '',
        isAdmin: false,
        isEditor: false,
        emailVerified: authUser.emailVerified || false,
        photoURL: authUser.photoUrl || '',
        createdAt: new Date().toLocaleString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        }).replace(',', ' à'), // Format: "16 juin 2025 à 20:21:00 UTC"
      });
      
      // Log de l'activité
      await logAdminActivity({
        type: 'Ajout',
        target: 'Utilisateur',
        targetId: authUser.localId,
        user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
        details: { 
          action: 'Création de profil Firestore',
          userId: authUser.localId,
          email: authUser.email
        }
      });
      
      fetchUsers();
    } catch (e) {
      console.error("Erreur lors de la création du profil Firestore:", e);
      alert("Erreur lors de la création du profil Firestore : " + (e as Error).message);
    }
  };

  // Fonction pour exporter les utilisateurs CPS au format CSV
  const exportCpsUsersToCsv = () => {
    // Filtrer les utilisateurs avec le statut 'cps'
    const cpsUsers = users.filter(user => user.status === 'cps');
    
    if (cpsUsers.length === 0) {
      alert("Aucun utilisateur avec le statut CPS trouvé à exporter.");
      return;
    }

    // En-têtes CSV
    const headers = [
      'ID',
      'Email',
      'Nom d\'affichage',
      'Administrateur',
      'Éditeur',
      'Email vérifié',
      'Date de création'
    ];

    // Données des utilisateurs
    const csvContent = [
      headers.join(','), // En-têtes en première ligne
      ...cpsUsers.map(user => {
        let createdAt = 'Inconnue';
        
        // Vérifier le type de createdAt
        if (user.createdAt) {
          if (typeof user.createdAt === 'object' && user.createdAt !== null) {
            // Si c'est un timestamp Firestore avec toDate()
            if ('toDate' in user.createdAt && typeof user.createdAt.toDate === 'function') {
              createdAt = user.createdAt.toDate().toISOString();
            } 
            // Si c'est un objet avec seconds (timestamp Firestore brut)
            else if ('seconds' in user.createdAt && typeof user.createdAt.seconds === 'number') {
              const timestamp = user.createdAt as FirestoreTimestamp;
              createdAt = new Date(timestamp.seconds * 1000).toISOString();
            }
          } 
          // Si c'est une chaîne ou un nombre
          else if (typeof user.createdAt === 'string' || typeof user.createdAt === 'number') {
            createdAt = new Date(user.createdAt).toISOString();
          }
        }
        
        return [
          `"${user.uid}"`,
          `"${user.email}"`,
          `"${user.displayName || ''}"`,
          `"${user.isAdmin ? 'Oui' : 'Non'}"`,
          `"${user.isEditor ? 'Oui' : 'Non'}"`,
          `"${user.emailVerified ? 'Oui' : 'Non'}"`,
          `"${createdAt}"`
        ].join(',');
      })
    ].join('\n');

    // Créer un objet Blob avec le contenu CSV
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `utilisateurs_cps_${date}.csv`);
    link.style.visibility = 'hidden';
    
    // Ajouter le lien au DOM, cliquer dessus, puis le supprimer
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour synchroniser le statut des utilisateurs existants
  const syncUserStatuses = async () => {
    if (!confirm('Voulez-vous synchroniser le statut de tous les utilisateurs existants basé sur leur année de promotion ?\n\nCela mettra à jour automatiquement :\n- Alumni : si année de promotion < année actuelle\n- CPS : si année de promotion entre année actuelle et année actuelle + 1\n- Future : si année de promotion > année actuelle + 1')) {
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      let updatedCount = 0;
      
      // Parcourir tous les utilisateurs
      for (const user of users) {
        if (!user.yearPromo) continue; // Ignorer les utilisateurs sans année de promotion
        
        let newStatus: 'alumni' | 'cps' | 'future';
        
        if (user.yearPromo < currentYear) {
          newStatus = 'alumni';
        } else if (user.yearPromo >= currentYear && user.yearPromo <= currentYear + 1) {
          newStatus = 'cps';
        } else {
          newStatus = 'future';
        }
        
        // Mettre à jour seulement si le statut a changé
        if (user.status !== newStatus) {
          await updateDoc(doc(db, 'users', user.uid), {
            status: newStatus,
            updatedAt: new Date()
          });
          updatedCount++;
        }
      }
      
      alert(`✅ Synchronisation terminée !\n${updatedCount} utilisateur(s) mis à jour(s)`);
      
      // Rafraîchir la liste des utilisateurs
      fetchUsers();
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      alert('❌ Erreur lors de la synchronisation des statuts');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4 flex items-center">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-100 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour admin
          </button>
          <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {/* Statistiques des utilisateurs */}
        <div className="mb-6 bg-blue-50 px-4 py-3 rounded-lg shadow-sm border border-blue-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-blue-800 text-lg">Statistiques des utilisateurs</h3>
            <span className="bg-blue-600 text-white py-1 px-4 rounded-full font-bold">
              {loading ? '...' : `Total: ${users.length}`}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* ESIGELEC */}
            <div className="flex justify-between items-center p-2 bg-blue-100 rounded border border-blue-200">
              <span className="text-sm font-medium">ESIGELEC</span>
              <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {loading ? '...' : users.filter(user => user.status === 'esigelec').length}
              </span>
            </div>
            
            {/* CPS */}
            <div className="flex justify-between items-center p-2 bg-purple-100 rounded border border-purple-200">
              <span className="text-sm font-medium">CPS</span>
              <span className="bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {loading ? '...' : users.filter(user => user.status === 'cps').length}
              </span>
            </div>
            
            {/* Alumni */}
            <div className="flex justify-between items-center p-2 bg-green-100 rounded border border-green-200">
              <span className="text-sm font-medium">Alumni</span>
              <span className="bg-green-600 text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {loading ? '...' : users.filter(user => user.status === 'alumni').length}
              </span>
            </div>
            
            {/* Autres */}
            <div className="flex justify-between items-center p-2 bg-gray-100 rounded border border-gray-200">
              <span className="text-sm font-medium">Autres</span>
              <span className="bg-gray-600 text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {loading ? '...' : users.filter(user => !user.status || user.status === 'autres').length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Filtres */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">Filtrer par rôle</label>
            <select
              id="role-filter"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value as 'tous' | 'admin' | 'editor' | 'standard');
                setCurrentPage(1); // Réinitialiser la pagination
              }}
            >
              <option value="tous">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="editor">Éditeur</option>
              <option value="standard">Standard</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filtrer par statut</label>
            <select
              id="status-filter"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as 'tous' | 'esigelec' | 'cps' | 'alumni' | 'autres');
                setCurrentPage(1); // Réinitialiser la pagination
              }}
            >
              <option value="tous">Tous les statuts</option>
              <option value="esigelec">ESIGELEC</option>
              <option value="cps">CPS</option>
              <option value="alumni">Alumni</option>
              <option value="autres">Autres</option>
            </select>
          </div>
          <button
            onClick={syncUserStatuses}
            className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 whitespace-nowrap"
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Synchro Statuts
          </button>
          <button
            onClick={exportCpsUsersToCsv}
            className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 whitespace-nowrap"
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter CPS
          </button>
        </div>

        {/* Utilisateurs Auth sans profil Firestore */}
        {loadingAuthUsers ? (
          <div className="mb-6 flex items-center text-yellow-600"><AlertTriangle className="w-5 h-5 mr-2" /> Chargement des utilisateurs Firebase Auth...</div>
        ) : (
          missingProfiles.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="font-bold text-yellow-800 mb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Utilisateurs sans profil Firestore</div>
              <ul className="mb-2 text-sm">
                {missingProfiles.map(u => (
                  <li key={u.localId} className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-gray-700">{u.email}</span>
                    <button onClick={() => handleCreateFirestoreProfile(u)} className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700">Créer le profil Firestore</button>
                  </li>
                ))}
              </ul>
              <div className="text-xs text-yellow-700">Ces utilisateurs existent dans l’authentification Firebase mais n’ont pas encore de document dans la collection <b>users</b>.</div>
            </div>
          )
        )}

        {loading ? (
          <div>Chargement...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <p className="text-sm text-gray-500 mb-2">
              {(() => {
                const filteredUsers = users
                  .filter(user => {
                    // Filtrage par rôle
                    if (roleFilter === 'tous') return true;
                    if (roleFilter === 'admin') return user.isAdmin;
                    if (roleFilter === 'editor') return user.isEditor;
                    if (roleFilter === 'standard') return !user.isAdmin && !user.isEditor;
                    return true;
                  })
                  .filter(user => {
                    // Filtrage par statut
                    if (statusFilter === 'tous') return true;
                    if (statusFilter === 'autres') return !user.status || user.status === 'autres';
                    return user.status === statusFilter;
                  });
                
                return `Affichage de ${filteredUsers.length ? Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length) : 0} à ${Math.min(currentPage * usersPerPage, filteredUsers.length)} sur ${filteredUsers.length} utilisateurs${roleFilter !== 'tous' || statusFilter !== 'tous' ? ' (filtrés)' : ''}`;
              })()}
            </p>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière connexion</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users
                  // Fonction pour convertir la date de création en timestamp pour comparaison
                  .sort((a, b) => {
                    // Fonction utilitaire pour convertir un createdAt en timestamp
                    const getTimestamp = (user: UserDoc): number => {
                      if (!user.createdAt) return 0; // Si pas de date, mettre en dernier
                      
                      // Si c'est un timestamp Firestore
                      if (user.createdAt && 
                          typeof user.createdAt === 'object' && 
                          'toDate' in user.createdAt && 
                          typeof user.createdAt.toDate === 'function') {
                        // Conversion du timestamp Firestore en date
                        const date = user.createdAt.toDate();
                        
                        return date.getTime();
                      }
                      
                      // Si c'est un nombre (timestamp)
                      if (typeof user.createdAt === 'number') {
                        return user.createdAt;
                      }
                      
                      // Si c'est une chaîne, essayer de la convertir en date
                      if (typeof user.createdAt === 'string') {
                        const date = new Date(user.createdAt);
                        if (!isNaN(date.getTime())) {
                          return date.getTime();
                        }
                      }
                      
                      return 0; // Valeur par défaut
                    };
                    
                    // Tri décroissant (du plus récent au plus ancien)
                    return getTimestamp(b) - getTimestamp(a);
                  })
                  .filter(user => {
                    // Filtrage par rôle
                    if (roleFilter === 'tous') return true;
                    if (roleFilter === 'admin') return user.isAdmin;
                    if (roleFilter === 'editor') return user.isEditor;
                    if (roleFilter === 'standard') return !user.isAdmin && !user.isEditor;
                    return true;
                  })
                  .filter(user => {
                    // Filtrage par statut
                    if (statusFilter === 'tous') return true;
                    if (statusFilter === 'autres') return !user.status || user.status === 'autres';
                    return user.status === statusFilter;
                  })
                  .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)
                  .map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-4 py-2 flex items-center cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/admin/users/${user.uid}`)}>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || user.email} className="w-8 h-8 rounded-full mr-2 object-cover bg-gray-200" />
                      ) : (
                        <span className="w-8 h-8 rounded-full mr-2 bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        </span>
                      )}
                      {user.displayName || user.email}
                      {user.isSuperAdmin && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">Admin principal</span>
                      )}
                      {user.uid === currentUser?.uid && (
                        <span className="ml-2 text-xs text-blue-600">(Moi)</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      {user.yearPromo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          Promo {user.yearPromo}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Non défini</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {user.status ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                          user.status === 'esigelec' ? 'bg-blue-100 text-blue-800' : 
                          user.status === 'cps' ? 'bg-purple-100 text-purple-800' : 
                          user.status === 'alumni' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                          {user.status === 'esigelec' ? 'ESIGELEC' : 
                           user.status === 'cps' ? 'CPS' : 
                           user.status === 'alumni' ? 'Alumni' : 
                           user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Autres
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col space-y-1">
                        {user.isAdmin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <Shield className="w-4 h-4 mr-1" /> Admin
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">Standard</span>
                        )}
                        
                        {user.isEditor && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Edit className="w-4 h-4 mr-1" /> Éditeur
                          </span>
                        )}
                        
                        {user.isSuperAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">Admin principal</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-gray-600">
                        {(() => {
                          // Définir une date actuelle pour les profils sans date
                          if (!user.createdAt) {
                            return <span className="text-xs text-gray-400 italic">Non disponible</span>;
                          }
                          
                          try {
                            // Afficher le type et la valeur pour déboguer
                            // (Vous pouvez supprimer cette ligne une fois les problèmes corrigés)
                            console.log(`createdAt pour ${user.email}:`, 
                              typeof user.createdAt, 
                              JSON.stringify(user.createdAt)
                            );
                            
                            // Pour les objets Firestore Timestamp
                            if (user.createdAt && 
                                typeof user.createdAt === 'object' && 
                                'toDate' in user.createdAt && 
                                typeof user.createdAt.toDate === 'function') {
                              // Conversion du timestamp Firestore en date
                              const date = user.createdAt.toDate();
                              
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les objets avec seconds (timestamp Firestore brut)
                            if (user.createdAt && 
                                typeof user.createdAt === 'object' && 
                                'seconds' in user.createdAt && 
                                'nanoseconds' in user.createdAt) {
                              // Conversion du timestamp Firestore en date
                              const timestamp = user.createdAt as FirestoreTimestamp;
                              const seconds = timestamp.seconds;
                              const date = new Date(seconds * 1000);
                              
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les chaînes au format "16 juin 2025 à 20:21:00 UTC"
                            if (typeof user.createdAt === 'string') {
                              if (user.createdAt.includes(' à ')) {
                                const parts = user.createdAt.split(' à ');
                                return (
                                  <>
                                    {parts[0]}
                                    <br />
                                    <span className="text-xs text-gray-500">
                                      {parts[1]?.split(' ')[0] || ''}
                                    </span>
                                  </>
                                );
                              } else {
                                // Essayer de convertir la chaîne en date
                                const date = new Date(user.createdAt);
                                if (!isNaN(date.getTime())) {
                                  return (
                                    <>
                                      {date.toLocaleDateString('fr-FR')}
                                      <br />
                                      <span className="text-xs text-gray-500">
                                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </>
                                  );
                                } else {
                                  // Si la conversion échoue, on affiche la chaîne brute
                                  return <span>{user.createdAt}</span>;
                                }
                              }
                            }
                            
                            // Pour les timestamps numériques
                            if (typeof user.createdAt === 'number') {
                              const date = new Date(user.createdAt);
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les dates
                            if (user.createdAt instanceof Date) {
                              const date = user.createdAt;
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Fallback avec affichage du type pour aider au débogage
                            return <span className="text-xs">
                              {typeof user.createdAt}: {String(user.createdAt)}
                            </span>;
                            
                          } catch (error) {
                            console.error("Erreur de format de date:", error);
                            return <span className="text-xs text-red-500">
                              Format invalide
                            </span>;
                          }
                        })()}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-gray-600">
                        {(() => {
                          // Définir une date actuelle pour les profils sans date
                          if (!user.lastLogin) {
                            return <span className="text-xs text-gray-400 italic">Non disponible</span>;
                          }
                          
                          try {
                            // Afficher le type et la valeur pour déboguer
                            // (Vous pouvez supprimer cette ligne une fois les problèmes corrigés)
                            console.log(`lastLogin pour ${user.email}:`, 
                              typeof user.lastLogin, 
                              JSON.stringify(user.lastLogin)
                            );
                            
                            // Pour les objets Firestore Timestamp
                            if (user.lastLogin && 
                                typeof user.lastLogin === 'object' && 
                                'toDate' in user.lastLogin && 
                                typeof user.lastLogin.toDate === 'function') {
                              // Conversion du timestamp Firestore en date
                              const date = user.lastLogin.toDate();
                              
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les objets avec seconds (timestamp Firestore brut)
                            if (user.lastLogin && 
                                typeof user.lastLogin === 'object' && 
                                'seconds' in user.lastLogin && 
                                'nanoseconds' in user.lastLogin) {
                              // Conversion du timestamp Firestore en date
                              const timestamp = user.lastLogin as FirestoreTimestamp;
                              const seconds = timestamp.seconds;
                              const date = new Date(seconds * 1000);
                              
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les chaînes au format "16 juin 2025 à 20:21:00 UTC"
                            if (typeof user.lastLogin === 'string') {
                              if (user.lastLogin.includes(' à ')) {
                                const parts = user.lastLogin.split(' à ');
                                return (
                                  <>
                                    {parts[0]}
                                    <br />
                                    <span className="text-xs text-gray-500">
                                      {parts[1]?.split(' ')[0] || ''}
                                    </span>
                                  </>
                                );
                              } else {
                                // Essayer de convertir la chaîne en date
                                const date = new Date(user.lastLogin);
                                if (!isNaN(date.getTime())) {
                                  return (
                                    <>
                                      {date.toLocaleDateString('fr-FR')}
                                      <br />
                                      <span className="text-xs text-gray-500">
                                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </>
                                  );
                                } else {
                                  // Si la conversion échoue, on affiche la chaîne brute
                                  return <span>{user.lastLogin}</span>;
                                }
                              }
                            }
                            
                            // Pour les timestamps numériques
                            if (typeof user.lastLogin === 'number') {
                              const date = new Date(user.lastLogin);
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les dates
                            if (user.lastLogin instanceof Date) {
                              const date = user.lastLogin;
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Fallback avec affichage du type pour aider au débogage
                            return <span className="text-xs">
                              {typeof user.lastLogin}: {String(user.lastLogin)}
                            </span>;
                            
                          } catch (error) {
                            console.error("Erreur de format de date:", error);
                            return <span className="text-xs text-red-500">
                              Format invalide
                            </span>;
                          }
                        })()}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {/* Permettre à un super admin de modifier n'importe quel utilisateur sauf lui-même */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        {user.uid !== currentUser?.uid && (
                          ((!user.isSuperAdmin) || (user.isSuperAdmin && currentUserIsSuperAdmin)) && (
                            <button
                              onClick={() => handleToggleAdmin(user.uid)}
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${user.isAdmin ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                            >
                              {user.isAdmin ? (
                                <>
                                  <UserMinus className="w-4 h-4 mr-1" /> Retirer admin
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-4 h-4 mr-1" /> Rendre admin
                                </>
                              )}
                            </button>
                          )
                        )}

                        {user.uid !== currentUser?.uid && (
                          ((!user.isSuperAdmin) || (user.isSuperAdmin && currentUserIsSuperAdmin)) && (
                            <button
                              onClick={() => handleToggleEditor(user.uid)}
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${user.isEditor ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                            >
                              {user.isEditor ? (
                                <>
                                  <X className="w-4 h-4 mr-1" /> Retirer éditeur
                                </>
                              ) : (
                                <>
                                  <Edit className="w-4 h-4 mr-1" /> Rendre éditeur
                                </>
                              )}
                            </button>
                          )
                        )}
                        
                        {user.uid !== currentUser?.uid && user.isSuperAdmin && !currentUserIsSuperAdmin && (
                          <button
                            className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
                            disabled={true}
                            title="Impossible de modifier le rôle d'un admin principal"
                          >
                            Impossible de modifier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 px-2">
              <div>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 mr-2 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  &laquo; Précédent
                </button>
                <button
                  onClick={() => {
                    const filteredUsers = users
                      .filter(user => {
                        if (roleFilter === 'tous') return true;
                        if (roleFilter === 'admin') return user.isAdmin;
                        if (roleFilter === 'editor') return user.isEditor;
                        if (roleFilter === 'standard') return !user.isAdmin && !user.isEditor;
                        return true;
                      })
                      .filter(user => {
                        if (statusFilter === 'tous') return true;
                        if (statusFilter === 'autres') return !user.status || user.status === 'autres';
                        return user.status === statusFilter;
                      });
                    
                    setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / usersPerPage), p + 1));
                  }}
                  disabled={
                    (() => {
                      const filteredUsers = users
                        .filter(user => {
                          if (roleFilter === 'tous') return true;
                          if (roleFilter === 'admin') return user.isAdmin;
                          if (roleFilter === 'editor') return user.isEditor;
                          if (roleFilter === 'standard') return !user.isAdmin && !user.isEditor;
                          return true;
                        })
                        .filter(user => {
                          if (statusFilter === 'tous') return true;
                          if (statusFilter === 'autres') return !user.status || user.status === 'autres';
                          return user.status === statusFilter;
                        });
                      
                      return currentPage >= Math.ceil(filteredUsers.length / usersPerPage);
                    })()
                  }
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  Suivant &raquo;
                </button>
              </div>
              <div className="text-sm text-gray-500">
                {(() => {
                  const filteredUsers = users
                    .filter(user => {
                      if (roleFilter === 'tous') return true;
                      if (roleFilter === 'admin') return user.isAdmin;
                      if (roleFilter === 'editor') return user.isEditor;
                      if (roleFilter === 'standard') return !user.isAdmin && !user.isEditor;
                      return true;
                    })
                    .filter(user => {
                      if (statusFilter === 'tous') return true;
                      if (statusFilter === 'autres') return !user.status || user.status === 'autres';
                      return user.status === statusFilter;
                    });
                  
                  return `Page ${currentPage} sur ${Math.ceil(filteredUsers.length / usersPerPage) || 1}`;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
      <PasswordModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPendingUser(null); setModalError(null); }}
        onSubmit={handlePasswordSubmit}
        loading={modalLoading}
        error={modalError}
      />
    </div>
  );
};

export default AdminUserManager;
