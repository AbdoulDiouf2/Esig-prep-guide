import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Calendar, User, Mail, Briefcase, MapPin } from 'lucide-react';
import { getPendingAlumniProfiles, updateAlumniStatus } from '../../services/alumniService';
import { useAuth } from '../../contexts/AuthContext';
import type { AlumniProfile } from '../../types/alumni';

const AdminAlumniValidation: React.FC = () => {
  const { currentUser } = useAuth();
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<AlumniProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPendingProfiles();
  }, []);

  const loadPendingProfiles = async () => {
    setLoading(true);
    try {
      const data = await getPendingAlumniProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Erreur chargement profils:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (profile: AlumniProfile) => {
    if (!currentUser) return;

    setActionLoading(true);
    try {
      await updateAlumniStatus(
        profile.uid,
        'approved',
        currentUser.uid
      );
      
      setSuccessMessage(`Profil de ${profile.name} approuvé avec succès !`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Recharger la liste
      await loadPendingProfiles();
      setSelectedProfile(null);
    } catch (error) {
      console.error('Erreur approbation:', error);
      alert('Erreur lors de l\'approbation du profil');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (profile: AlumniProfile) => {
    if (!currentUser || !rejectionReason.trim()) {
      alert('Veuillez indiquer une raison de rejet');
      return;
    }

    setActionLoading(true);
    try {
      await updateAlumniStatus(
        profile.uid,
        'rejected',
        currentUser.uid,
        rejectionReason
      );
      
      setSuccessMessage(`Profil de ${profile.name} rejeté`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Recharger la liste
      await loadPendingProfiles();
      setSelectedProfile(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Erreur rejet:', error);
      alert('Erreur lors du rejet du profil');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Validation des profils Alumni
          </h1>
          <p className="mt-2 text-gray-600">
            {profiles.length} profil{profiles.length > 1 ? 's' : ''} en attente de validation
          </p>
        </div>

        {/* Message de succès */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-600 p-4 rounded">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Liste des profils */}
        {profiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">Aucun profil en attente de validation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liste à gauche */}
            <div className="space-y-4">
              {profiles.map(profile => (
                <div
                  key={profile.uid}
                  className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all ${
                    selectedProfile?.uid === profile.uid
                      ? 'ring-2 ring-blue-500'
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="flex items-start gap-4">
                    {profile.photo ? (
                      <img
                        src={profile.photo}
                        alt={profile.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {profile.name}
                      </h3>
                      {profile.headline && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {profile.headline}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Promo {profile.yearPromo}
                        </span>
                        {profile.company && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {profile.company}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      className="text-blue-600 hover:text-blue-800"
                      title="Voir le détail"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Détail à droite */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              {selectedProfile ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Détail du profil
                  </h2>

                  {/* Infos principales */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{selectedProfile.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4" />
                      <span>{selectedProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" />
                      <span>Promo {selectedProfile.yearPromo}</span>
                    </div>
                    {(selectedProfile.city || selectedProfile.country) && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4" />
                        <span>{[selectedProfile.city, selectedProfile.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Headline */}
                  {selectedProfile.headline && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Titre professionnel</h3>
                      <p className="text-gray-900">{selectedProfile.headline}</p>
                    </div>
                  )}

                  {/* Bio */}
                  {selectedProfile.bio && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Bio</h3>
                      <p className="text-gray-900 whitespace-pre-line">{selectedProfile.bio}</p>
                    </div>
                  )}

                  {/* Secteurs */}
                  {selectedProfile.sectors && selectedProfile.sectors.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Secteurs</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.sectors.map((sector, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {sector}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expertise */}
                  {selectedProfile.expertise && selectedProfile.expertise.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.expertise.map((exp, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
                          >
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
                    
                    {/* Bouton Approuver */}
                    <button
                      onClick={() => handleApprove(selectedProfile)}
                      disabled={actionLoading}
                      className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {actionLoading ? 'Traitement...' : 'Approuver le profil'}
                    </button>

                    {/* Raison de rejet */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Raison du rejet (obligatoire)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        placeholder="Ex: Informations incomplètes, contenu inapproprié..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    {/* Bouton Rejeter */}
                    <button
                      onClick={() => handleReject(selectedProfile)}
                      disabled={actionLoading || !rejectionReason.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 font-medium"
                    >
                      <XCircle className="w-5 h-5" />
                      {actionLoading ? 'Traitement...' : 'Rejeter le profil'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Sélectionnez un profil pour voir les détails
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAlumniValidation;
