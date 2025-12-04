import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Calendar, User, Mail, Briefcase, MapPin, Trash2 } from 'lucide-react';
import { getPendingAlumniProfiles, getApprovedAlumniProfiles, getRejectedAlumniProfiles, updateAlumniStatus, deleteAlumniProfile } from '../../services/alumniService';
import { useAuth } from '../../contexts/AuthContext';
import type { AlumniProfile } from '../../types/alumni';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminAlumniValidation: React.FC = () => {
  const { currentUser } = useAuth();
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [allProfiles, setAllProfiles] = useState<AlumniProfile[]>([]); // Pour les compteurs
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<AlumniProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  
  // États pour les modals de confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<AlumniProfile | null>(null);

  useEffect(() => {
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      // Toujours charger tous les profils pour les compteurs
      const [pending, approved, rejected] = await Promise.all([
        getPendingAlumniProfiles(),
        getApprovedAlumniProfiles('dateCreated', 1000),
        getRejectedAlumniProfiles()
      ]);
      const all = [...pending, ...approved, ...rejected];
      setAllProfiles(all);
      
      // Filtrer selon l'onglet actif
      if (activeTab === 'pending') {
        setProfiles(pending);
      } else if (activeTab === 'approved') {
        setProfiles(approved);
      } else if (activeTab === 'rejected') {
        setProfiles(rejected);
      } else {
        setProfiles(all);
      }
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
      await loadProfiles();
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
      await loadProfiles();
      setSelectedProfile(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Erreur rejet:', error);
      alert('Erreur lors du rejet du profil');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (profile: AlumniProfile) => {
    // Vérifier si l'utilisateur est superadmin
    if (!currentUser?.isSuperAdmin) {
      setShowAccessDeniedModal(true);
      return;
    }

    // Ouvrir le modal de confirmation
    setProfileToDelete(profile);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!profileToDelete) return;

    setActionLoading(true);
    try {
      await deleteAlumniProfile(profileToDelete.uid);
      
      setSuccessMessage(`Profil de ${profileToDelete.name} supprimé définitivement`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Recharger la liste
      await loadProfiles();
      setSelectedProfile(null);
      setProfileToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      setSuccessMessage('');
      alert('Erreur lors de la suppression du profil');
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
            Gérer les profils alumni de l'annuaire
          </p>
        </div>

        {/* Onglets */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'pending' ? 'bg-yellow-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('pending')}
            >
              À valider ({allProfiles.filter(p => p.status === 'pending').length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${activeTab === 'approved' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('approved')}
            >
              Validés ({allProfiles.filter(p => p.status === 'approved').length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${activeTab === 'rejected' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('rejected')}
            >
              Rejetés ({allProfiles.filter(p => p.status === 'rejected').length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${activeTab === 'all' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('all')}
            >
              Tous ({allProfiles.length})
            </button>
          </div>
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
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {profile.name}
                        </h3>
                        {profile.status === 'approved' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Validé
                          </span>
                        )}
                      </div>
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
                  {selectedProfile.status === 'pending' ? (
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
                  ) : selectedProfile.status === 'rejected' ? (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center mb-4">
                      <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="text-red-800 font-medium">Profil rejeté</p>
                      {selectedProfile.rejectionReason && (
                        <div className="mt-3 p-3 bg-white rounded border border-red-200 text-left">
                          <p className="text-sm font-medium text-gray-900 mb-1">Raison du rejet :</p>
                          <p className="text-sm text-gray-700">{selectedProfile.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Option pour ré-approuver */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-800 mb-3">Ré-approuver ce profil</h4>
                      <p className="text-sm text-green-700 mb-3">
                        Si le profil a été corrigé ou si le rejet était une erreur, vous pouvez l'approuver maintenant.
                      </p>
                      
                      <button
                        onClick={() => handleApprove(selectedProfile)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {actionLoading ? 'Traitement...' : 'Approuver le profil'}
                      </button>
                    </div>
                  </div>
                  ) : (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-medium">Profil déjà validé</p>
                      <p className="text-green-600 text-sm mt-1">Ce profil est visible dans l'annuaire alumni</p>
                    </div>

                    {/* Option pour révoquer l'approbation */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-yellow-800 mb-3">Révoquer l'approbation</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        Si ce profil ne respecte plus les critères, vous pouvez le rejeter. Il ne sera plus visible dans l'annuaire.
                      </p>
                      
                      {/* Raison de rejet */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Raison du rejet (obligatoire)
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                          placeholder="Ex: Informations obsolètes, contenu inapproprié..."
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
                        {actionLoading ? 'Traitement...' : 'Révoquer et rejeter le profil'}
                      </button>
                    </div>
                  </div>
                  )}
                  
                  {/* Bouton de suppression (superadmin uniquement) */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <button
                      onClick={() => handleDelete(selectedProfile)}
                      disabled={actionLoading || !currentUser?.isSuperAdmin}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium ${
                        currentUser?.isSuperAdmin
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      } disabled:opacity-50`}
                      title={!currentUser?.isSuperAdmin ? 'Réservé aux super-administrateurs' : ''}
                    >
                      <Trash2 className="w-5 h-5" />
                      {actionLoading ? 'Suppression...' : 'Supprimer définitivement ce profil'}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      {currentUser?.isSuperAdmin 
                        ? '⚠️ Cette action est irréversible' 
                        : '🔒 Réservé aux super-administrateurs'}
                    </p>
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

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProfileToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer ce profil ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le profil de ${profileToDelete?.name} ?\n\nCette action est irréversible et supprimera toutes les données associées.`}
        confirmButtonText="Supprimer définitivement"
        cancelButtonText="Annuler"
        type="danger"
      />

      {/* Modal d'accès refusé */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-yellow-200 flex items-center">
              <XCircle className="mr-2 h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-medium text-yellow-800">Accès refusé</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Seuls les super-administrateurs peuvent supprimer des profils alumni.
              </p>
              <p className="text-gray-700 mt-2">
                Contactez un super-admin si vous avez besoin de supprimer ce profil.
              </p>
            </div>
            
            <div className="px-6 py-3 bg-gray-50 flex justify-end">
              <button
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                onClick={() => setShowAccessDeniedModal(false)}
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlumniValidation;
