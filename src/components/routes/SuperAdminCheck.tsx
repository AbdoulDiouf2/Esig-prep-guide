import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface SuperAdminCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Composant qui affiche son contenu uniquement si l'utilisateur est superadmin
const SuperAdminCheck: React.FC<SuperAdminCheckProps> = ({ children, fallback = null }) => {
  const { currentUser, isAdmin } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      if (!currentUser || !isAdmin()) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Vérifier si l'utilisateur est superadmin
        // Accéder au document utilisateur
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDocRef);
          
        if (userSnapshot.exists() && userSnapshot.data().isSuperAdmin) {
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut superadmin:", error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdminStatus();
  }, [currentUser, isAdmin]);

  if (loading) return null;
  
  return isSuperAdmin ? <>{children}</> : <>{fallback}</>;
};

export default SuperAdminCheck;
