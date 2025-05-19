import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Shield, UserMinus, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PasswordModal from '../../components/PasswordModal';

interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean; // Ajouté pour la gestion du super admin
  emailVerified: boolean;
  photoURL?: string;
}

const AdminUserManager: React.FC = () => {

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<{uid: string, isAdmin: boolean} | null>(null);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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

  const handleToggleAdmin = async (uid: string, isAdmin: boolean) => {
    setModalOpen(true);
    setPendingUser({ uid, isAdmin });
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
    if (targetUser?.isSuperAdmin && targetUser.uid !== currentUser?.uid) {
      setModalError("Impossible de modifier le rôle d'un admin principal.");
      setModalLoading(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', pendingUser.uid), { isAdmin: !pendingUser.isAdmin });
      setUsers((prev) =>
        prev.map((user) =>
          user.uid === pendingUser.uid ? { ...user, isAdmin: !pendingUser.isAdmin } : user
        )
      );
      setModalOpen(false);
      setPendingUser(null);
    } catch {
      setModalError('Erreur lors de la mise à jour du statut administrateur.');
    } finally {
      setModalLoading(false);
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

        {loading ? (
          <div>Chargement...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Nom</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Admin</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.uid}>
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
                      {user.isAdmin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <Shield className="w-4 h-4 mr-1" /> Admin
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">Standard</span>
                      )}
                      {user.isSuperAdmin && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">Admin principal</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {user.uid !== currentUser?.uid && !user.isSuperAdmin && (
                        <button
                          onClick={() => handleToggleAdmin(user.uid, user.isAdmin)}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${user.isAdmin ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
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
                      )}
                      {user.uid !== currentUser?.uid && user.isSuperAdmin && (
                        <button
                          className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
                          disabled={true}
                          title="Impossible de modifier le rôle d'un admin principal"
                        >
                          Impossible de modifier
                        </button>
                      )}
                      
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
