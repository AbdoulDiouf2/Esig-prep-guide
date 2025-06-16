import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { X, User, GraduationCap, MapPin } from 'lucide-react';
import { STATUS_OPTIONS } from '../../constants/statusOptions';

// Les options de statut sont maintenant importées depuis constants/statusOptions

export default function UserStatusModal() {
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      // Si pas d'utilisateur connecté, on ne fait rien
      if (!currentUser) {
        console.log('Pas d\'utilisateur connecté');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Vérification du statut pour', currentUser.uid);
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        // ÉTAPE 1: Vérification de l'existence du champ statut
        if (!userDoc.exists()) {
          // Le document utilisateur n'existe pas, on le crée avec statut 'none'
          console.log('Document utilisateur inexistant, création avec statut "none"');
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            status: 'none',
            createdAt: new Date()
          });
          setShowModal(true);
        } else {
          // Le document existe
          const userData = userDoc.data();
          console.log('Données utilisateur:', userData);
          
          // Si le statut n'existe pas, on l'initialise à 'none'
          if (userData.status === undefined) {
            console.log('Champ statut inexistant, initialisation à "none"');
            await updateDoc(userRef, { status: 'none' });
            setShowModal(true);
          }
          // ÉTAPE 2: Vérification de la valeur du statut
          else if (userData.status === 'none') {
            console.log('Statut "none", affichage du modal');
            setShowModal(true);
          }
          // ÉTAPE 3: Si statut déjà initialisé, ne rien faire
          else {
            console.log('Statut déjà défini:', userData.status);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      checkUserStatus();
    }
  }, [currentUser]);

  const handleStatusSelect = async (status: string) => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      console.log(`Mise à jour du statut: "${status}" pour l'utilisateur`, currentUser.uid);
      
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        status,
        updatedAt: new Date()
      });
      
      console.log('Statut mis à jour avec succès');
      setShowModal(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    } finally {
      setIsLoading(false);
    }
  };

  console.log('Rendu du composant UserStatusModal', { isLoading, showModal, currentUser: !!currentUser });
  
  if (isLoading) {
    console.log('Chargement en cours...');
    return null;
  }
  
  if (!showModal) {
    console.log('Modal non affiché car showModal est false');
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Quel est votre statut ?</h2>
          <button 
            onClick={() => setShowModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Pour mieux vous accompagner, veuillez nous indiquer votre situation actuelle.
        </p>
        
        <div className="space-y-3">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusSelect(option.value)}
              disabled={isLoading}
              className="w-full flex items-start p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-colors"
            >
              <div className="mr-3 mt-0.5">
                {option.iconName === 'User' && <User className={`w-6 h-6 ${option.iconColor}`} />}
                {option.iconName === 'GraduationCap' && <GraduationCap className={`w-6 h-6 ${option.iconColor}`} />}
                {option.iconName === 'MapPin' && <MapPin className={`w-6 h-6 ${option.iconColor}`} />}
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">{option.label}</h3>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
        
        {isLoading && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Enregistrement en cours...
          </div>
        )}
      </div>
    </div>
  );
}
