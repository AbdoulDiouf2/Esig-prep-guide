import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getInvitationByToken, acceptInvitation, Invitation } from '../services/invitationService';

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setInvalid(true);
        setLoadingInvitation(false);
        return;
      }
      try {
        const inv = await getInvitationByToken(token);
        if (!inv) {
          setInvalid(true);
        } else {
          setInvitation(inv);
        }
      } catch {
        setInvalid(true);
      } finally {
        setLoadingInvitation(false);
      }
    };
    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!invitation) return;

    if (!displayName.trim()) {
      setError('Veuillez saisir votre nom complet.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, invitation.email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: displayName.trim() });

      // Build role flags
      const roleFlags: Record<string, boolean> = {};
      if (invitation.role === 'admin') roleFlags.isAdmin = true;
      else if (invitation.role === 'editor') roleFlags.isEditor = true;
      else if (invitation.role === 'director') roleFlags.isDirector = true;
      else if (invitation.role === 'staff') roleFlags.isStaff = true;

      // Write Firestore user profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: invitation.email,
        displayName: displayName.trim(),
        status: 'future',
        isAdmin: false,
        isEditor: false,
        isDirector: false,
        isStaff: false,
        emailVerified: false,
        createdAt: serverTimestamp(),
        ...roleFlags,
      });

      // Mark invitation as accepted
      await acceptInvitation(invitation.token);

      navigate('/applications');
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('Un compte existe déjà avec cette adresse e-mail.');
      } else {
        setError(firebaseError.message || "Une erreur est survenue lors de la création du compte.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInvitation) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-blue-900 mb-2">Lien invalide ou expiré</h1>
          <p className="text-zinc-600 text-sm">
            Ce lien d'invitation n'est plus valide. Il a peut-être déjà été utilisé ou a expiré après 7 jours.
            Contactez un administrateur pour recevoir une nouvelle invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">Créer votre compte</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Vous avez été invité(e) à rejoindre <span className="font-semibold text-blue-900">CPS Connect</span> avec
          l'adresse <span className="font-medium">{invitation?.email}</span>.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              placeholder="Prénom Nom"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Au moins 6 caractères"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Répétez le mot de passe"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-900 text-white rounded-lg font-medium text-sm hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Création du compte...' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitation;
