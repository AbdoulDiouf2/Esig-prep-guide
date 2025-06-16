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

interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean; // Ajouté pour la gestion du super admin
  isEditor?: boolean;     // Ajouté pour la gestion des éditeurs
  emailVerified: boolean;
  photoURL?: string;
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
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
                                  <UserPlus className="w-4 h-4 mr-1" /> Promouvoir admin
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
                                  <Edit className="w-4 h-4 mr-1" /> Promouvoir éditeur
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
