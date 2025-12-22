import { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { updateDoc } from 'firebase/firestore'; // Ajout de l'import manquant
import { auth } from '../firebase';
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Type pour l'utilisateur dans l'application
export type AppUser = {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  isEditor?: boolean;
  yearPromo?: number; // Année de promotion (année de sortie de prépa)
  status?: 'alumni' | 'cps' | 'future'; // Statut déterminé automatiquement
  profileComplete?: boolean; // Indique si le profil est complet (pour migration)
  createdAt?: Date;
  lastLogin?: Date;
  photoURL?: string;
  providerData?: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }>;
};

type AuthContextType = {
  currentUser: AppUser | null;
  loading: boolean;
  register: (email: string, password: string, name: string, yearPromo: number) => Promise<FirebaseUser>;
  login: (email: string, password: string) => Promise<AppUser | null>;
  loginWithGoogle: () => Promise<AppUser | null>;
  loginWithGithub: () => Promise<AppUser | null>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isEditor: () => boolean;
  isSuperAdmin: () => Promise<boolean>;
  sendVerificationEmail: () => Promise<void>;
  updateCurrentUser: (data: Partial<AppUser>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Fonction pour convertir un utilisateur Firebase en utilisateur de l'application
const mapFirebaseUser = async (firebaseUser: FirebaseUser | null): Promise<AppUser | null> => {
  if (!firebaseUser) return null;

  // Vérifier si l'utilisateur existe dans Firestore
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  const userData = userDoc.data();

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || userData?.displayName || firebaseUser.email?.split('@')[0] || 'Utilisateur',
    emailVerified: firebaseUser.emailVerified,
    isAdmin: userData?.isAdmin || false,
    isSuperAdmin: userData?.isSuperAdmin || false,
    isEditor: userData?.isEditor || false,
    yearPromo: userData?.yearPromo,
    status: userData?.status,
    profileComplete: userData?.profileComplete,
    photoURL: firebaseUser.photoURL || userData?.photoURL,
    createdAt: userData?.createdAt?.toDate(),
    lastLogin: userData?.lastLogin?.toDate(),
    providerData: firebaseUser.providerData.map(provider => ({
      providerId: provider.providerId,
      uid: provider.uid,
      displayName: provider.displayName,
      email: provider.email,
      photoURL: provider.photoURL
    }))
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Vérifier/créer le profil Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (!userSnapshot.exists()) {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            emailVerified: firebaseUser.emailVerified,
            isAdmin: false,
            isEditor: false,
            createdAt: serverTimestamp(),
            ...(firebaseUser.displayName ? { displayName: firebaseUser.displayName } : {}),
            ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
          };
          await setDoc(userDocRef, userData);

        }
        const appUser = await mapFirebaseUser(firebaseUser);
        setCurrentUser(appUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Nettoyer l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, []);

  // Enregistrer un nouvel utilisateur
  const register = async (email: string, password: string, displayName: string, yearPromo: number) => {
    try {
      // 1. Créer l'utilisateur avec Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      // 2. Déterminer le statut automatiquement à partir de l'année de promotion
      const currentYear = new Date().getFullYear();
      let status: 'alumni' | 'cps' | 'future';
      
      if (yearPromo < currentYear) {
        status = 'alumni'; // A terminé la prépa
      } else if (yearPromo >= currentYear && yearPromo <= currentYear + 1) {
        status = 'cps'; // En prépa (1ère ou 2ème année)
      } else {
        status = 'future'; // Futur étudiant
      }

      // 3. Mettre à jour le profil avec le nom d'affichage
      await updateProfile(user, { displayName });

      // 4. Envoyer l'email de vérification
      await sendEmailVerification(user);

      // 5. Créer un document utilisateur dans Firestore
      const userData = {
        uid: user.uid,
        email: user.email || '',
        emailVerified: user.emailVerified,
        isAdmin: false, // Par défaut, l'utilisateur n'est pas admin
        isEditor: false, // Par défaut, l'utilisateur n'est pas éditeur
        yearPromo: yearPromo, // Année de promotion (année de sortie de prépa)
        status: status, // Statut déterminé automatiquement
        profileComplete: true, // Profil complété lors de l'inscription
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(displayName ? { displayName } : {}),
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
      };
      await setDoc(doc(db, 'users', user.uid), userData);

      // 5. Mettre à jour l'état de l'utilisateur
      const appUser = await mapFirebaseUser(user);
      setCurrentUser(appUser);

      return user;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  };

  // Envoyer un email de vérification
  const sendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de vérification:', error);
      throw error;
    }
  };

  // Connexion d'un utilisateur
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Vérifier/créer le profil Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);
      const loginTimestamp = new Date();
      
      if (!userSnapshot.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          isAdmin: false,
          createdAt: serverTimestamp(),
          lastLogin: loginTimestamp,
          photoURL: user.photoURL ?? undefined,
        });
      } else {
        // Mettre à jour la date de dernière connexion
        await updateDoc(userDocRef, {
          lastLogin: loginTimestamp
        });
      }
      
      const appUser = await mapFirebaseUser(user);
      const updatedUser: AppUser = {
        ...appUser,
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        emailVerified: user.emailVerified,
        isAdmin: userSnapshot.exists() ? userSnapshot.data()?.isAdmin ?? false : false,
        lastLogin: loginTimestamp
      };
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  };

  // Déconnexion de l'utilisateur
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  // Vérifier si l'utilisateur est administrateur
  const isAdmin = () => {
    return Boolean(currentUser && (currentUser.isAdmin || currentUser.isSuperAdmin));
  };

  // Vérifier si l'utilisateur est éditeur
  const isEditor = () => {
    return Boolean(currentUser && currentUser.isEditor);
  };

  // Vérifier si l'utilisateur est superadmin
  const isSuperAdmin = async () => {
    if (!currentUser) return false;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userSnapshot = await getDoc(userDocRef);
      if (userSnapshot.exists()) {
        return userSnapshot.data().isSuperAdmin || false;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut superadmin:', error);
      return false;
    }
  };

  // Connexion avec Google
  const loginWithGoogle = async (): Promise<AppUser | null> => {
    const provider = new GoogleAuthProvider();
    let user = null;
    const loginTimestamp = new Date();
    
    try {
      const result = await signInWithPopup(auth, provider);
      user = result.user;
      console.log('[Google] Utilisateur connecté:', user);

      // Vérifier si le document utilisateur existe déjà
      const userDocRef = doc(db, 'users', user.uid);
      let userSnapshot;
      
      try {
        userSnapshot = await getDoc(userDocRef);
        console.log('[Google] Document utilisateur existe:', userSnapshot.exists());

        if (!userSnapshot.exists()) {
          try {
            // Création du document utilisateur avec isAdmin: false par défaut
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              emailVerified: user.emailVerified,
              isAdmin: false,
              isEditor: false,
              createdAt: serverTimestamp(),
              lastLogin: loginTimestamp,
              photoURL: user.photoURL ?? undefined,
            });
            console.log('[Google] Document utilisateur créé dans Firestore');
          } catch (firestoreError) {
            console.error('[Google] Erreur lors de la création du document utilisateur:', firestoreError);
            // On continue quand même pour permettre la connexion, même si le document n'a pas pu être créé
          }
        } else {
          // Mettre à jour la date de dernière connexion
          try {
            await updateDoc(userDocRef, {
              lastLogin: loginTimestamp
            });
            console.log('[Google] Date de dernière connexion mise à jour');
          } catch (updateError) {
            console.error('[Google] Erreur lors de la mise à jour de la dernière connexion:', updateError);
          }
        }
      } catch (firestoreError) {
        console.error('[Google] Erreur lors de la vérification du document utilisateur:', firestoreError);
        // On suppose que le document n'existe pas mais on continue la connexion
        userSnapshot = { exists: () => false, data: () => ({ isAdmin: false, isEditor: false }) };
      }

    // Retourne l'utilisateur sous forme AppUser
    const appUser: AppUser = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      emailVerified: user.emailVerified,
      isAdmin: userSnapshot.exists() ? userSnapshot.data()?.isAdmin ?? false : false,
      isEditor: userSnapshot.exists() ? userSnapshot.data()?.isEditor ?? false : false,
      createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : undefined,
      photoURL: user.photoURL ?? undefined,
    };
    console.log('[Google] AppUser retourné:', appUser);
    return appUser;
  } catch (error) {
    console.error('[Google] Erreur dans loginWithGoogle:', error, user);
    throw error;
  }
};

  // Connexion avec GitHub
  const loginWithGithub = async (): Promise<AppUser | null> => {
  const provider = new GithubAuthProvider();
  let user = null;
  try {
    const result = await signInWithPopup(auth, provider);
    user = result.user;
    console.log('[GitHub] Utilisateur connecté:', user);

    // Vérifier si le document utilisateur existe déjà
    const userDocRef = doc(db, 'users', user.uid);
    let userSnapshot;
    
    const loginTimestamp = new Date();
    
    try {
      userSnapshot = await getDoc(userDocRef);
      console.log('[GitHub] Document utilisateur existe:', userSnapshot.exists());

      if (!userSnapshot.exists()) {
        try {
          // Création du document utilisateur avec isAdmin: false par défaut
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
            isAdmin: false,
            isEditor: false,
            createdAt: serverTimestamp(),
            lastLogin: loginTimestamp,
            photoURL: user.photoURL ?? undefined,
          });
          console.log('[GitHub] Document utilisateur créé dans Firestore');
        } catch (firestoreError) {
          console.error('[GitHub] Erreur lors de la création du document utilisateur:', firestoreError);
          // On continue quand même pour permettre la connexion, même si le document n'a pas pu être créé
        }
      } else {
        // Mettre à jour la date de dernière connexion
        try {
          await updateDoc(userDocRef, {
            lastLogin: loginTimestamp
          });
          console.log('[GitHub] Date de dernière connexion mise à jour');
        } catch (updateError) {
          console.error('[GitHub] Erreur lors de la mise à jour de la dernière connexion:', updateError);
        }
      }
    } catch (firestoreError) {
      console.error('[GitHub] Erreur lors de la vérification du document utilisateur:', firestoreError);
      // On suppose que le document n'existe pas mais on continue la connexion
      userSnapshot = { 
        exists: () => false, 
        data: () => ({ 
          isAdmin: false, 
          isEditor: false,
          isSuperAdmin: false 
        }) 
      };
    }

    // Récupérer les données de l'utilisateur depuis Firestore
    const userData = userSnapshot.exists() ? userSnapshot.data() : {};
    
    // Retourne l'utilisateur sous forme AppUser
    const appUser: AppUser = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      emailVerified: user.emailVerified,
      isAdmin: userData?.isAdmin ?? false,
      isEditor: userData?.isEditor ?? false,
      isSuperAdmin: userData?.isSuperAdmin ?? false,
      createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : undefined,
      lastLogin: loginTimestamp,
      photoURL: user.photoURL ?? undefined,
    };
    console.log('[GitHub] AppUser retourné:', appUser);
    return appUser;
  } catch (error) {
    console.error('[GitHub] Erreur dans loginWithGithub:', error, user);
    throw error;
  }
};

const value = {
  currentUser,
  loading,
  register,
  login,
  loginWithGoogle,
  loginWithGithub,
  logout,
  isAdmin,
  isEditor,
  isSuperAdmin,
  sendVerificationEmail,
  updateCurrentUser: (data: Partial<AppUser>) => {
    setCurrentUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
  }
};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};