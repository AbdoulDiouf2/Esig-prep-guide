import React, { useState, useEffect } from 'react';
import { Wrench, Power, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getMaintenanceStatus, setMaintenanceStatus } from '../../services/maintenanceService';
import ConfirmationModal from '../../components/ConfirmationModal';

const MaintenanceToggle: React.FC = () => {
  const { currentUser } = useAuth();
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingState, setPendingState] = useState(false);
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadMaintenanceStatus();
  }, []);

  const loadMaintenanceStatus = async () => {
    try {
      const status = await getMaintenanceStatus();
      setMaintenanceEnabled(status.enabled);
      setMessage(status.message || '');
    } catch (error) {
      console.error('Erreur chargement statut maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClick = (newState: boolean) => {
    setPendingState(newState);
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (!currentUser) return;

    setUpdating(true);
    setShowConfirmModal(false);

    try {
      await setMaintenanceStatus(pendingState, currentUser.uid, message);
      setMaintenanceEnabled(pendingState);
      setSuccessMessage(
        pendingState
          ? '✅ Mode maintenance activé avec succès'
          : '✅ Mode maintenance désactivé avec succès'
      );

      // Masquer le message après 3 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Erreur mise à jour maintenance:', error);
      alert('❌ Erreur lors de la mise à jour du mode maintenance');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Wrench className="w-8 h-8 text-orange-600 mr-3" />
            Mode Maintenance
          </h1>
          <p className="mt-2 text-gray-600">
            Gérer l'accessibilité du site pour les utilisateurs
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">

      {/* Contenu */}
      <div className="p-6">
        {/* Message de succès */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Statut actuel */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Power className={`w-5 h-5 mr-2 ${maintenanceEnabled ? 'text-red-500' : 'text-green-500'}`} />
              <span className="font-semibold text-gray-900">Statut actuel :</span>
            </div>
            <span
              className={`px-4 py-2 rounded-full font-medium ${
                maintenanceEnabled
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {maintenanceEnabled ? '🔴 Maintenance activée' : '🟢 Site en ligne'}
            </span>
          </div>

          {maintenanceEnabled && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Le site est actuellement en mode maintenance
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Tous les utilisateurs (sauf vous) voient la page de maintenance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message personnalisé */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message personnalisé (optionnel)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: Maintenance prévue jusqu'à 18h..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={updating}
          />
          <p className="text-xs text-gray-500 mt-1">
            Ce message sera affiché sur la page de maintenance (fonctionnalité future)
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3">
          {!maintenanceEnabled ? (
            <button
              onClick={() => handleToggleClick(true)}
              disabled={updating}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Power className="w-5 h-5" />
              {updating ? 'Activation...' : 'Activer la maintenance'}
            </button>
          ) : (
            <button
              onClick={() => handleToggleClick(false)}
              disabled={updating}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Power className="w-5 h-5" />
              {updating ? 'Désactivation...' : 'Désactiver la maintenance'}
            </button>
          )}
        </div>

        {/* Avertissement */}
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Important</p>
              <p className="text-sm text-yellow-700 mt-1">
                En tant que superadmin, vous pourrez toujours accéder au site même en mode maintenance.
                Tous les autres utilisateurs verront la page de maintenance.
              </p>
            </div>
          </div>
        </div>
      </div>

        {/* Modal de confirmation */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmToggle}
          title={pendingState ? 'Activer le mode maintenance ?' : 'Désactiver le mode maintenance ?'}
          message={
            pendingState
              ? 'Tous les utilisateurs (sauf vous) seront redirigés vers la page de maintenance. Êtes-vous sûr de vouloir continuer ?'
              : 'Le site redeviendra accessible à tous les utilisateurs. Êtes-vous sûr de vouloir continuer ?'
          }
          confirmButtonText={pendingState ? 'Oui, activer' : 'Oui, désactiver'}
          cancelButtonText="Annuler"
          type={pendingState ? 'warning' : 'info'}
        />
      </div>
      </div>
    </div>
  );
};

export default MaintenanceToggle;
