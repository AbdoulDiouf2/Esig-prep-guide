import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMaintenanceStatus } from '../services/maintenanceService';

export const useMaintenance = () => {
  const { currentUser } = useAuth();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const status = await getMaintenanceStatus();
        
        // Si la maintenance est activée ET que l'utilisateur n'est pas superadmin
        const shouldShowMaintenance = status.enabled && !currentUser?.isSuperAdmin;
        
        setIsMaintenanceMode(shouldShowMaintenance);
      } catch (error) {
        console.error('Erreur vérification maintenance:', error);
        setIsMaintenanceMode(false);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();
  }, [currentUser]);

  return { isMaintenanceMode, loading };
};
