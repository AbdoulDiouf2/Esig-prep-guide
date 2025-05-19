import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Shield, UserMinus, UserPlus, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  emailVerified: boolean;
  photoURL?: string;
}

const AdminUserProfile: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [user, setUser] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const userRef = doc(db, 'users', uid!);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser(userSnap.data() as UserDoc);
        } else {
          setError('Utilisateur introuvable.');
        }
      } catch {
        setError('Erreur lors du chargement du profil utilisateur.');
      } finally {
        setLoading(false);
      }
    };
    if (uid) fetchUser();
  }, [uid]);

  const handleToggleAdmin = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { isAdmin: !user.isAdmin });
      setUser({ ...user, isAdmin: !user.isAdmin });
    } catch {
      alert('Erreur lors de la mise à jour du statut administrateur.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (user.uid === currentUser?.uid) {
      alert('Vous ne pouvez pas supprimer votre propre compte administrateur.');
      return;
    }
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      navigate('/admin/users');
    } catch {
      alert('Erreur lors de la suppression de l\'utilisateur.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
      alert('Profil mis à jour !');
    } catch {
      alert('Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!user) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4 flex items-center">
          <button onClick={() => navigate('/admin/users')} className="flex items-center text-blue-100 hover:text-white transition-colors mr-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour utilisateurs
          </button>
          <h1 className="text-2xl font-bold">Profil utilisateur</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-xl flex justify-center items-center min-h-[70vh]">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center w-full">
          {/* Avatar modernisé */}
          <div className="relative mb-6">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || user.email} className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-blue-100 bg-gray-200" />
            ) : (
              <span className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center shadow-lg border-4 border-blue-100">
                <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </span>
            )}
          </div>
          {/* Nom affiché */}
          <input
            type="text"
            name="displayName"
            className="border-2 border-blue-100 rounded-lg px-4 py-2 mb-2 w-full text-center text-lg font-semibold focus:border-blue-400 transition"
            value={user.displayName}
            onChange={handleChange}
            placeholder="Nom affiché"
            disabled={saving}
          />
          {/* URL photo */}
          <input
            type="text"
            name="photoURL"
            className="border-2 border-blue-100 rounded-lg px-4 py-2 mb-4 w-full text-center text-base focus:border-blue-400 transition"
            value={user.photoURL || ''}
            onChange={handleChange}
            placeholder="URL de la photo"
            disabled={saving}
          />
          {/* Email */}
          <div className="mb-1 w-full text-center text-gray-600">
            <span className="font-semibold text-gray-800">Email :</span> {user.email}
          </div>
          {/* Vérification email */}
          <div className="mb-1 w-full text-center text-gray-600">
            <span className="font-semibold text-gray-800">Vérifié :</span> {user.emailVerified ? 'Oui' : 'Non'}
          </div>
          {/* Statut admin */}
          <div className="mb-6 w-full text-center">
            <span className="font-semibold text-gray-800">Statut :</span> {user.isAdmin ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 ml-2">
                <Shield className="w-5 h-5 mr-1" /> Admin
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 ml-2">
                Standard
              </span>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-3 w-full mt-2">
            {user.uid !== currentUser?.uid && (
              <button
                onClick={handleToggleAdmin}
                className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-base font-medium shadow transition-colors duration-200 ${user.isAdmin ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                disabled={saving}
              >
                {user.isAdmin ? (
                  <>
                    <UserMinus className="w-5 h-5 mr-2" /> Retirer admin
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" /> Promouvoir admin
                  </>
                )}
              </button>
            )}
            {user.uid !== currentUser?.uid && (
              <button
                onClick={handleDelete}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-base font-medium shadow bg-red-600 text-white hover:bg-red-700"
                disabled={saving}
              >
                <Trash2 className="w-5 h-5 mr-2" /> Supprimer utilisateur
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-base font-medium shadow bg-blue-600 text-white hover:bg-blue-700"
              disabled={saving}
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserProfile;
