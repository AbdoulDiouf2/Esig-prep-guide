import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { STATUS_OPTIONS, getStatusLabel } from '../constants/statusOptions';
import { User, GraduationCap, MapPin } from 'lucide-react';
import { Shield } from 'lucide-react';
import PasswordConfirmModal from '../components/PasswordConfirmModal';

const UserProfile: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'profile' | 'password' | null>(null);
  const [pendingProfile, setPendingProfile] = useState<{displayName: string, photoURL: string} | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string>('');
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
  const [email] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string>('none');
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [providerError, setProviderError] = useState<string | null>(null);
  
  // Charger le statut utilisateur depuis Firestore
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.status) {
              setUserStatus(userData.status);
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement du statut utilisateur:', error);
        } finally {
          setLoadingStatus(false);
        }
      }
    };

    fetchUserStatus();
  }, [currentUser]);

  // Vérifie si l'utilisateur a un mot de passe local (providerData.type === 'password')
  const firebaseUser = auth.currentUser;
  const hasPasswordProvider = firebaseUser?.providerData.some(
    (provider) => provider.providerId === 'password'
  );
  
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center w-full max-w-md">
          <div className="text-red-600 text-center text-lg font-semibold">Vous devez être connecté pour accéder à votre profil.</div>
        </div>
      </div>
    );
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!hasPasswordProvider) {
      setProviderError("Vous avez créé votre compte avec Google. Vous ne pouvez pas modifier votre profil ou mot de passe ici.");
      return;
    }
    setPendingProfile({ displayName, photoURL });
    setPendingAction('profile');
    setModalOpen(true);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!hasPasswordProvider) {
      setProviderError("Vous avez créé votre compte avec Google. Vous ne pouvez pas modifier votre profil ou mot de passe ici.");
      return;
    }
    setPendingPassword(password);
    setPendingAction('password');
    setModalOpen(true);
  };


  const handlePasswordConfirm = async (userPassword: string) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    setModalLoading(true);
    setModalError(null);
    const credential = EmailAuthProvider.credential(firebaseUser.email || '', userPassword);
    try {
      await reauthenticateWithCredential(firebaseUser, credential);
      if (pendingAction === 'profile' && pendingProfile) {
        await updateProfile(firebaseUser, { displayName: pendingProfile.displayName, photoURL: pendingProfile.photoURL });
        setDisplayName(pendingProfile.displayName);
        setPhotoURL(pendingProfile.photoURL);
        
        // Mettre à jour le statut utilisateur dans Firestore
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, { status: userStatus });
        }
        
        setSuccess('Profil mis à jour !');
      } else if (pendingAction === 'password' && pendingPassword) {
        await updatePassword(firebaseUser, pendingPassword);
        setPassword('');
        setSuccess('Mot de passe mis à jour !');
      }
      setModalOpen(false);
      setPendingAction(null);
      setPendingProfile(null);
      setPendingPassword('');
    } catch {
      setModalError('Mot de passe incorrect.');
    } finally {
      setModalLoading(false);
      setSaving(false);
    }
  };


  

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header style admin */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="inline-flex items-center px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-600 text-white font-medium text-sm focus:outline-none">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Retour
          </Link>
          <span className="flex items-center text-xl font-bold"><Shield className="w-6 h-6 mr-2 text-white"/> Mon profil</span>
        </div>
      </div>
      <div className="w-full mx-auto p-4 flex justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 flex flex-col items-center w-full max-w-xl relative animate-fadeInUp mt-8 mb-8">
          {/* Avatar et badge */}
          <div className="relative mb-5">
            {photoURL ? (
              <img src={photoURL} alt={displayName || email} className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-blue-100 bg-gray-200 transition-all duration-300 hover:scale-105" />
            ) : (
              <span className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-5xl text-blue-400 shadow-lg border-4 border-blue-100">
                <svg className="w-16 h-16 text-blue-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14c4.418 0 8 1.79 8 4v2H4v-2c0-2.21 3.582-4 8-4zm0-4a4 4 0 110-8 4 4 0 010 8z" /></svg>
              </span>
            )}
            {currentUser?.emailVerified && (
              <span className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full px-2 py-1 text-xs font-semibold shadow">Vérifié</span>
            )}
            {currentUser?.isAdmin && (
              <span className="absolute top-2 left-2 flex items-center gap-1 bg-blue-700 text-white rounded-full px-2 py-1 text-xs font-semibold shadow"><Shield className="w-4 h-4" /> Admin</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">{displayName || email}</h1>
          <div className="text-gray-500 text-sm mb-4 text-center">{email}</div>
          <form onSubmit={handleProfileSave} className="w-full flex flex-col gap-4 mb-8 animate-fadeInUp">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Nom affiché</label>
                <input
                  type="text"
                  className="border-2 border-blue-100 rounded-lg px-4 py-2 w-full focus:border-blue-400 transition"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Nom affiché"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Photo (URL)</label>
                <input
                  type="text"
                  className="border-2 border-blue-100 rounded-lg px-4 py-2 w-full focus:border-blue-400 transition"
                  value={photoURL}
                  onChange={e => setPhotoURL(e.target.value)}
                  placeholder="URL de la photo"
                  disabled={saving}
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700 font-medium mb-1">Votre statut</label>
                <div className="relative border-2 border-blue-100 rounded-lg">
                  <select
                    className="appearance-none w-full px-4 py-2 bg-transparent focus:outline-none"
                    value={userStatus}
                    onChange={e => setUserStatus(e.target.value)}
                    disabled={saving || loadingStatus}
                  >
                    <option value="none">Sélectionnez votre statut</option>
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                {userStatus !== 'none' && (
                  <div className="mt-2 flex items-center">
                    <span className="mr-2">Statut actuel:</span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      {userStatus === 'cps' && <MapPin className="w-4 h-4 text-blue-500" />}
                      {userStatus === 'esigelec' && <GraduationCap className="w-4 h-4 text-green-500" />}
                      {userStatus === 'alumni' && <User className="w-4 h-4 text-purple-500" />}
                      {userStatus === 'other' && <User className="w-4 h-4 text-gray-500" />}
                      {getStatusLabel(userStatus)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-blue-700 transition disabled:opacity-50 mt-2"
              disabled={saving}
            >
              Sauvegarder le profil
            </button>
          </form>
          <div className="w-full border-t border-blue-100 my-6"></div>
          {hasPasswordProvider ? (
            <>
              <form onSubmit={handlePasswordChange} className="w-full flex flex-col gap-4 animate-fadeInUp">
                <label className="block text-gray-700 font-medium mb-1">Changer le mot de passe</label>
                <input
                  type="password"
                  className="border-2 border-blue-100 rounded-lg px-4 py-2 w-full focus:border-blue-400 transition"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
                  disabled={saving}
                />
                <button
                  type="submit"
                  className="bg-green-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  disabled={saving || password.length < 6}
                >
                  Mettre à jour le mot de passe
                </button>
              </form>
              <button
                type="button"
                className="mt-2 underline text-blue-700 hover:text-blue-900 text-sm"
                onClick={async () => {
                  setError(null);
                  setSuccess(null);
                  try {
                    await sendPasswordResetEmail(auth, email);
                    setSuccess('Un email de réinitialisation a été envoyé à votre adresse.');
                  } catch {
                    setError('Erreur lors de l’envoi de l’email de réinitialisation.');
                  }
                }}
              >
                Réinitialiser mon mot de passe
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col gap-4 animate-fadeInUp">
              <div className="text-orange-600 text-sm mb-2">Vous avez créé votre compte avec Google. Vous ne pouvez pas définir ou changer de mot de passe ici.</div>
              <button
                type="button"
                className="underline text-blue-700 hover:text-blue-900 text-sm"
                onClick={async () => {
                  setError(null);
                  setSuccess(null);
                  try {
                    await sendPasswordResetEmail(auth, email);
                    setSuccess('Un email de réinitialisation a été envoyé à votre adresse.');
                  } catch {
                    setError('Erreur lors de l’envoi de l’email de réinitialisation.');
                  }
                }}
              >
                Réinitialiser mon mot de passe
              </button>
            </div>
          )}
          {(error || success) && (
            <div className={`mt-6 text-center text-sm font-medium ${error ? 'text-red-600' : 'text-green-600'}`}>{error || success}</div>
          )}
          {providerError && (
            <div className="mt-6 text-center text-sm font-medium text-orange-600">{providerError}</div>
          )}
        <PasswordConfirmModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setModalError(null); setPendingAction(null); }}
          onSubmit={handlePasswordConfirm}
          loading={modalLoading}
          error={modalError}
          label={pendingAction === 'profile' 
            ? 'Veuillez entrer VOTRE mot de passe pour confirmer la modification du profil.'
            : 'Veuillez entrer VOTRE mot de passe pour changer votre mot de passe.'}
        />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
