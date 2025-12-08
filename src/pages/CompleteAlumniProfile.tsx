import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAlumniProfile, updateAlumniProfile } from '../services/alumniService';
import { uploadAlumniPhoto } from '../services/storageService';
import { db } from '../firebase';
import AlumniProfileForm, { AlumniProfileFormData } from '../components/alumni/AlumniProfileForm';
import type { AlumniProfile } from '../types/alumni';
import { calculateProfileCompletion, getCompletionMessage, getProfileSuggestions } from '../utils/profileCompletion';

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
        seeking: data.seeking,
        offering: data.offering,
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

  // Calculer le pourcentage de complétion
  const completionPercentage = alumniProfile ? calculateProfileCompletion(alumniProfile) : 0;
  const completionInfo = getCompletionMessage(completionPercentage);
  const suggestions = alumniProfile ? getProfileSuggestions(alumniProfile) : [];

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

        {/* Indicateur de complétion */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Complétion de ton profil
                </h3>
                <p className={`text-sm font-medium ${completionInfo.color}`}>
                  {completionInfo.message}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {completionPercentage}%
              </div>
              <p className="text-xs text-gray-500">complété</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && completionPercentage < 90 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-start space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Pour améliorer ton profil :
                  </h4>
                  <ul className="space-y-1">
                    {suggestions.slice(0, 3).map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                  {suggestions.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Et {suggestions.length - 3} autre{suggestions.length - 3 > 1 ? 's' : ''} suggestion{suggestions.length - 3 > 1 ? 's' : ''}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Message de motivation */}
          {completionPercentage >= 90 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm font-medium">
                  En complétant ton profil, tu seras éligible aux futures fonctionnalités : matching mentorat, opportunités business, et bien plus !
                </p>
              </div>
            </div>
          )}
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
            seeking: alumniProfile.seeking || [],
            offering: alumniProfile.offering || [],
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
