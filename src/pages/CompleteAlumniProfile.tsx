import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getAlumniProfile, updateAlumniProfile } from '../services/alumniService';
import { uploadAlumniPhoto } from '../services/storageService';
import { db } from '../firebase';
import AlumniProfileForm, { AlumniProfileFormData } from '../components/alumni/AlumniProfileForm';
import type { AlumniProfile } from '../types/alumni';

const CompleteAlumniProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alumniProfile, setAlumniProfile] = useState<AlumniProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Charger le profil alumni existant
  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser) {
        try {
          const profile = await getAlumniProfile(currentUser.uid);
          setAlumniProfile(profile);
        } catch (error) {
          console.error('Erreur chargement profil:', error);
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();
  }, [currentUser]);

  const handlePhotoUpload = async (file: File): Promise<string> => {
    if (!currentUser) throw new Error('Non connecté');
    return await uploadAlumniPhoto(currentUser.uid, file);
  };

  const handleSubmit = async (data: AlumniProfileFormData) => {
    if (!currentUser || !alumniProfile) {
      setError('Profil alumni introuvable');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mettre à jour le profil alumni avec les nouvelles données
      await updateAlumniProfile(currentUser.uid, {
        headline: data.headline,
        bio: data.bio,
        photo: data.photo,
        sectors: data.sectors,
        expertise: data.expertise,
        company: data.company,
        position: data.position,
        companyDescription: data.companyDescription,
        website: data.website,
        portfolio: data.portfolio,
        services: data.services,
        linkedin: data.linkedin,
        github: data.github,
        twitter: data.twitter,
        city: data.city,
        country: data.country,
      });
      
      // Remettre le statut à pending pour validation
      await updateAlumniProfile(currentUser.uid, {});
      const alumniRef = doc(db, 'alumni', currentUser.uid);
      await updateDoc(alumniRef, { status: 'pending' });

      setSuccess(true);
      
      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/applications');
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError('Une erreur est survenue lors de la mise à jour de votre profil');
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (!alumniProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded max-w-md">
          <p className="text-red-700">
            Aucun profil alumni trouvé. Veuillez d'abord créer un profil depuis l'inscription.
          </p>
          <button
            onClick={() => navigate('/applications')}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Retour au tableau de bord →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Complète ton profil alumni
          </h1>
          <p className="mt-2 text-gray-600">
            Remplis les informations ci-dessous pour enrichir ton profil. Ton profil sera soumis pour validation avant d'être publié dans l'annuaire.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-sm text-blue-700">
              <strong>Informations pré-remplies :</strong> Nom : {alumniProfile.name}, Email : {alumniProfile.email}, Année de promo : {alumniProfile.yearPromo}
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-600 p-4 rounded">
            <p className="text-sm text-green-700">
              ✅ Profil mis à jour avec succès ! Ton profil est maintenant en attente de validation. Redirection...
            </p>
          </div>
        )}

        {/* Formulaire */}
        <AlumniProfileForm
          initialData={{
            headline: alumniProfile.headline || '',
            bio: alumniProfile.bio || '',
            photo: alumniProfile.photo,
            sectors: alumniProfile.sectors || [],
            expertise: alumniProfile.expertise || [],
            company: alumniProfile.company,
            position: alumniProfile.position,
            companyDescription: alumniProfile.companyDescription,
            website: alumniProfile.website,
            portfolio: alumniProfile.portfolio || [],
            services: alumniProfile.services || [],
            linkedin: alumniProfile.linkedin,
            github: alumniProfile.github,
            twitter: alumniProfile.twitter,
            city: alumniProfile.city,
            country: alumniProfile.country,
          }}
          onSubmit={handleSubmit}
          onPhotoUpload={handlePhotoUpload}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CompleteAlumniProfile;
