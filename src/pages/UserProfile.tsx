import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import {
  updateProfile, updatePassword, reauthenticateWithCredential,
  EmailAuthProvider, sendPasswordResetEmail, deleteUser
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { STATUS_OPTIONS, getStatusLabel } from '../constants/statusOptions';
import {
  Shield, User, GraduationCap, MapPin, Mail, Calendar,
  ExternalLink, CheckCircle, Lock, AlertTriangle, Users, LayoutDashboard
} from 'lucide-react';
import PasswordConfirmModal from '../components/PasswordConfirmModal';
import DeleteAccountModal from '../components/DeleteAccountModal';
import ProfileCoverHeader from '../components/profile/ProfileCoverHeader';

const UserProfile: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'profile' | 'password' | null>(null);
  const [pendingProfile, setPendingProfile] = useState<{ displayName: string; photoURL: string } | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string>('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
  const [email] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string>('none');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  const isSocialLogin = currentUser?.providerData?.some(
    p => p?.providerId === 'google.com' || p?.providerId === 'github.com'
  ) || false;

  const isGoogleUser = currentUser?.providerData?.some(p => p?.providerId === 'google.com') || false;

  const firebaseUser = auth.currentUser;
  const hasPasswordProvider = firebaseUser?.providerData.some(p => p.providerId === 'password');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.status) setUserStatus(data.status);
          else if (data.isDirector || data.isStaff) setUserStatus('administration');

          if (data.createdAt?.toDate) {
            const d = data.createdAt.toDate() as Date;
            setMemberSince(d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
          }
        }
      } catch (e) {
        console.error('Erreur chargement données utilisateur:', e);
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchUserData();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md w-full border border-zinc-200">
          <p className="text-red-600 font-semibold">Vous devez être connecté pour accéder à votre profil.</p>
        </div>
      </div>
    );
  }

  const getRoleBadge = () => {
    if (currentUser.isSuperAdmin) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
        <Shield className="w-3 h-3" /> Super Admin
      </span>
    );
    if (currentUser.isAdmin) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        <Shield className="w-3 h-3" /> Admin
      </span>
    );
    if (currentUser.isEditor) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
        <Shield className="w-3 h-3" /> Éditeur
      </span>
    );
    if (currentUser.isDirector) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        <Shield className="w-3 h-3" /> Directeur
      </span>
    );
    if (currentUser.isStaff) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
        <Shield className="w-3 h-3" /> Staff
      </span>
    );
    return null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'cps': return <MapPin className="w-3.5 h-3.5 text-blue-500" />;
      case 'esigelec': return <GraduationCap className="w-3.5 h-3.5 text-green-500" />;
      case 'alumni': return <User className="w-3.5 h-3.5 text-purple-500" />;
      case 'administration': return <Shield className="w-3.5 h-3.5 text-slate-600" />;
      default: return <User className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const handleStatusSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { status: userStatus });
      setSuccess('Statut mis à jour !');
    } catch {
      setError('Erreur lors de la mise à jour du statut.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!hasPasswordProvider) return;
    setPendingProfile({ displayName, photoURL });
    setPendingAction('profile');
    setModalOpen(true);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!hasPasswordProvider) return;
    setPendingPassword(password);
    setPendingAction('password');
    setModalOpen(true);
  };

  const handlePasswordConfirm = async (userPassword: string) => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    setModalLoading(true);
    setModalError(null);
    const credential = EmailAuthProvider.credential(fbUser.email || '', userPassword);
    try {
      await reauthenticateWithCredential(fbUser, credential);
      if (pendingAction === 'profile' && pendingProfile) {
        await updateProfile(fbUser, { displayName: pendingProfile.displayName, photoURL: pendingProfile.photoURL });
        setDisplayName(pendingProfile.displayName);
        setPhotoURL(pendingProfile.photoURL);
        setSuccess('Profil mis à jour !');
      } else if (pendingAction === 'password' && pendingPassword) {
        await updatePassword(fbUser, pendingPassword);
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

  const confirmDeleteAccount = async (pwd: string) => {
    setSaving(true);
    setDeleteModalError(null);
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) throw new Error('Aucun utilisateur connecté');
      if (hasPasswordProvider) {
        const credential = EmailAuthProvider.credential(fbUser.email || '', pwd);
        await reauthenticateWithCredential(fbUser, credential);
      }
      await deleteDoc(doc(db, 'users', fbUser.uid));
      await logout();
      await deleteUser(fbUser);
      setDeleteModalOpen(false);
      navigate('/');
    } catch (e) {
      setDeleteModalError(e instanceof Error ? e.message : 'Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  };

  const profileSubtitle = [
    currentUser.email,
    userStatus !== 'none' ? getStatusLabel(userStatus) : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Cover header */}
        <ProfileCoverHeader
          name={displayName || email}
          subtitle={profileSubtitle}
          photoURL={photoURL || undefined}
          initials={(displayName || email).charAt(0).toUpperCase()}
          badge={getRoleBadge()}
          actions={
            <>
              <Link
                to="/my-alumni-profile"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mon profil alumni <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </>
          }
        />

        {/* Feedback global */}
        {(error || success) && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium border ${error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {error || success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* === SIDEBAR === */}
          <div className="space-y-4">

            {/* Infos compte */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Compte</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </li>
                {memberSince && (
                  <li className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    Membre depuis {memberSince}
                  </li>
                )}
                <li className="flex items-center gap-2 text-gray-700">
                  {currentUser.emailVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  Email {currentUser.emailVerified ? 'vérifié' : 'non vérifié'}
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                  {isGoogleUser ? 'Connexion Google' : hasPasswordProvider ? 'Connexion email' : 'Connexion GitHub'}
                </li>
              </ul>
            </div>

            {/* Liens rapides */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Navigation</h2>
              <ul className="space-y-2">
                <li>
                  <Link to="/alumni" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors">
                    <Users className="w-4 h-4" /> Annuaire alumni
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard CPS
                  </Link>
                </li>
                <li>
                  <Link to="/my-alumni-profile" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors">
                    <User className="w-4 h-4" /> Mon profil alumni
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* === MAIN CONTENT === */}
          <div className="lg:col-span-2 space-y-4">

            {/* Section Informations */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Informations personnelles</h2>

              {isSocialLogin && !hasPasswordProvider ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 mb-4">
                  Vous utilisez la connexion avec {isGoogleUser ? 'Google' : 'GitHub'}. Votre nom et photo sont synchronisés automatiquement depuis votre compte.
                </div>
              ) : null}

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom affiché</label>
                    <input
                      type="text"
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Votre nom"
                      disabled={saving || isSocialLogin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo (URL)</label>
                    <input
                      type="text"
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                      value={photoURL}
                      onChange={e => setPhotoURL(e.target.value)}
                      placeholder="https://..."
                      disabled={saving || isSocialLogin}
                    />
                  </div>
                </div>

                {hasPasswordProvider && (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    Sauvegarder
                  </button>
                )}
              </form>

              {/* Statut */}
              <div className="mt-6 pt-5 border-t border-zinc-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mon statut</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <select
                      className="w-full appearance-none border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white pr-8"
                      value={userStatus}
                      onChange={e => setUserStatus(e.target.value)}
                      disabled={saving || loadingStatus}
                    >
                      <option value="none">Sélectionnez votre statut</option>
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStatusSave}
                    className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                    disabled={saving || loadingStatus || userStatus === 'none'}
                  >
                    Mettre à jour
                  </button>
                </div>
                {userStatus !== 'none' && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-zinc-100 text-gray-700">
                    {getStatusIcon(userStatus)}
                    {getStatusLabel(userStatus)}
                  </div>
                )}
              </div>
            </div>

            {/* Section Sécurité */}
            {hasPasswordProvider && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Sécurité</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                    <input
                      type="password"
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      disabled={saving}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={saving || password.length < 6}
                    >
                      Changer le mot de passe
                    </button>
                    <button
                      type="button"
                      className="px-5 py-2 text-sm text-blue-700 underline hover:text-blue-900 transition-colors"
                      onClick={async () => {
                        setError(null);
                        setSuccess(null);
                        try {
                          await sendPasswordResetEmail(auth, email);
                          setSuccess('Email de réinitialisation envoyé.');
                        } catch {
                          setError("Erreur lors de l'envoi de l'email.");
                        }
                      }}
                    >
                      Réinitialiser par email
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!hasPasswordProvider && isSocialLogin && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Sécurité</h2>
                <p className="text-sm text-gray-600">
                  Vous utilisez la connexion {isGoogleUser ? 'Google' : 'GitHub'}. La gestion du mot de passe se fait directement sur votre compte {isGoogleUser ? 'Google' : 'GitHub'}.
                </p>
              </div>
            )}

            {/* Zone danger */}
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-red-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Zone dangereuse
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                La suppression de votre compte est irréversible. Toutes vos données seront définitivement supprimées.
              </p>
              <button
                onClick={() => setDeleteModalOpen(true)}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Supprimer mon compte
              </button>
            </div>

          </div>
        </div>
      </div>

      <PasswordConfirmModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setModalError(null); setPendingAction(null); }}
        onSubmit={handlePasswordConfirm}
        loading={modalLoading}
        error={modalError}
        label={pendingAction === 'profile'
          ? 'Confirmez votre mot de passe pour modifier le profil.'
          : 'Confirmez votre mot de passe pour le changer.'}
      />
      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeleteModalError(null); }}
        onConfirm={confirmDeleteAccount}
        requiresPassword={!!hasPasswordProvider}
        loading={saving}
        error={deleteModalError}
      />
    </div>
  );
};

export default UserProfile;
