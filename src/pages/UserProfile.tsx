import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
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

  const [providerError, setProviderError] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center w-full max-w-md">
          <div className="text-red-600 text-center text-lg font-semibold">Vous devez être connecté pour accéder à votre profil.</div>
        </div>
      </div>
    );
  }

  // Vérifie si l'utilisateur a un mot de passe local (providerData.type === 'password')
  const firebaseUser = auth.currentUser;
  const hasPasswordProvider = firebaseUser?.providerData.some(
    (provider) => provider.providerId === 'password'
  );

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col items-center w-full max-w-xl relative animate-fadeInUp">
        {/* Avatar et badge */}
        <div className="relative mb-5">
          {photoURL ? (
            <img src={photoURL} alt={displayName || email} className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-blue-100 bg-gray-200 transition-all duration-300 hover:scale-105" />
          ) : (
            <span className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-5xl text-blue-400 shadow-lg border-4 border-blue-100">
              {displayName?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase()}
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
  );
};

export default UserProfile;
