import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createAlumniProfileOnSignup } from '../services/alumniService';

const CompleteUserProfile: React.FC = () => {
  const { currentUser } = useAuth();
  
  const [yearPromo, setYearPromo] = useState<number>(new Date().getFullYear() + 1);
  const [wantsAlumniProfile, setWantsAlumniProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Utilisateur non connecté');
      return;
    }

    if (wantsAlumniProfile === null) {
      setError('Veuillez sélectionner une option pour le profil alumni');
      return;
    }

    if (!yearPromo || yearPromo < 2000 || yearPromo > 2050) {
      setError('Veuillez entrer une année de promotion valide');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mettre à jour le profil utilisateur
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        yearPromo: yearPromo,
        profileComplete: true,
        updatedAt: new Date(),
      });

      // Si l'utilisateur veut un profil alumni, créer le profil
      if (wantsAlumniProfile) {
        await createAlumniProfileOnSignup({
          uid: currentUser.uid,
          name: currentUser.displayName,
          email: currentUser.email,
          yearPromo: yearPromo,
          company: '',
          sectors: [],
          expertise: [],
          bio: '',
        });
      }

      // Forcer le rechargement pour mettre à jour le contexte Auth
      window.location.href = '/#/applications';
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError('Une erreur est survenue lors de la mise à jour de votre profil');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Complétez votre profil
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Pour continuer, nous avons besoin de quelques informations supplémentaires
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Année de promotion */}
          <div>
            <label htmlFor="yearPromo" className="block text-sm font-medium text-gray-700 mb-2">
              Année de promotion (année de sortie de prépa) *
            </label>
            <input
              id="yearPromo"
              type="number"
              required
              min="2000"
              max="2050"
              value={yearPromo}
              onChange={(e) => setYearPromo(parseInt(e.target.value))}
              placeholder="Ex: 2022"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Ex: Si tu as fini la prépa en 2022, ta promo est 2022. Si tu es en 1ère année, indique ton année de sortie estimée.
            </p>
          </div>

          {/* Choix profil alumni */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Souhaitez-vous créer un profil alumni ? *
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Le profil alumni vous permet d'être visible dans l'annuaire et de vous connecter avec d'autres alumni.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setWantsAlumniProfile(false)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  wantsAlumniProfile === false
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">👤</div>
                  <div className="font-medium text-gray-900">Non</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Compte basique
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setWantsAlumniProfile(true)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  wantsAlumniProfile === true
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🚀</div>
                  <div className="font-medium text-gray-900">Oui</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Profil alumni
                  </div>
                </div>
              </button>
            </div>

            {wantsAlumniProfile !== null && (
              <p className="text-sm text-gray-500 text-center mt-3">
                {wantsAlumniProfile 
                  ? '✓ Vous allez créer un profil alumni' 
                  : '✓ Vous créez un compte basique'}
              </p>
            )}
          </div>

          {/* Bouton de soumission */}
          <div>
            <button
              type="submit"
              disabled={loading || wantsAlumniProfile === null}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading || wantsAlumniProfile === null
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Enregistrement...' : 'Continuer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteUserProfile;
