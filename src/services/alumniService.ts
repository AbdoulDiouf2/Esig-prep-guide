/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  Query,
  DocumentData,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationService } from './NotificationService';
import {
  AlumniProfile,
  AlumniProfileStatus,
  CreateAlumniProfileData,
  UpdateAlumniProfileData,
  AlumniSearchFilters,
  AlumniSortOption,
  AlumniStats,
  AlumniRecommendation,
} from '../types/alumni';

const ALUMNI_COLLECTION = 'alumni';
const PRODUCTION_URL = 'https://esig-prep-guide.vercel.app';

/**
 * Créer un profil alumni automatiquement lors de l'inscription
 */
export const createAlumniProfileOnSignup = async (
  data: CreateAlumniProfileData
): Promise<void> => {
  try {
    const alumniRef = doc(db, ALUMNI_COLLECTION, data.uid);

    const alumniProfile: AlumniProfile = {
      uid: data.uid,
      name: data.name,
      email: data.email,
      yearPromo: data.yearPromo,
      headline: data.headline || '',
      bio: data.bio || '',
      photo: data.photo || '',
      sectors: data.sectors || [],
      expertise: data.expertise || [],
      company: data.company || '',
      position: data.position || '',
      ...(data.school ? { education: [{ school: data.school }] } : {}),
      ...(data.city ? { city: data.city } : {}),
      status: 'draft',
      dateCreated: Timestamp.now(),
    };

    await setDoc(alumniRef, alumniProfile);
    console.log('✅ Profil alumni créé avec succès:', data.uid);
  } catch (error) {
    console.error('❌ Erreur lors de la création du profil alumni:', error);
    throw error;
  }
};

/**
 * Soumettre un profil alumni pour validation
 * Passe le statut de 'draft' à 'pending'
 */
export const submitAlumniProfileForValidation = async (uid: string): Promise<void> => {
  try {
    const alumniRef = doc(db, ALUMNI_COLLECTION, uid);
    const alumniSnap = await getDoc(alumniRef);

    if (!alumniSnap.exists()) {
      throw new Error('Profil alumni introuvable');
    }

    const profile = alumniSnap.data() as AlumniProfile;

    if (profile.status !== 'draft') {
      throw new Error('Seuls les profils en brouillon peuvent être soumis');
    }

    // Mettre à jour le statut
    await updateDoc(alumniRef, {
      status: 'pending',
      dateUpdated: Timestamp.now(),
    });

    console.log('✅ Profil soumis pour validation:', uid);

    // TODO: Envoyer une notification à l'admin (optionnel)
  } catch (error) {
    console.error('❌ Erreur lors de la soumission du profil:', error);
    throw error;
  }
};

/**
 * Récupérer un profil alumni par UID
 */
export const getAlumniProfile = async (
  uid: string
): Promise<AlumniProfile | null> => {
  try {
    const alumniRef = doc(db, ALUMNI_COLLECTION, uid);
    const alumniSnap = await getDoc(alumniRef);

    if (alumniSnap.exists()) {
      return alumniSnap.data() as AlumniProfile;
    }

    return null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil alumni:', error);
    throw error;
  }
};

/**
 * Mettre à jour un profil alumni
 */
export const updateAlumniProfile = async (
  uid: string,
  data: UpdateAlumniProfileData
): Promise<void> => {
  try {
    const alumniRef = doc(db, ALUMNI_COLLECTION, uid);

    // Nettoyer les valeurs undefined et gérer la suppression explicite
    const cleanedData: Partial<UpdateAlumniProfileData> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        // Ignorer les valeurs null/undefined
        return;
      } else if (value === '') {
        // Supprimer explicitement le champ de la base de données
        (cleanedData as Record<string, unknown>)[key] = deleteField();
      } else {
        // Conserver la valeur normale
        (cleanedData as Record<string, unknown>)[key] = value;
      }
    });

    const updateData = {
      ...cleanedData,
      dateUpdated: Timestamp.now(),
    };

    await updateDoc(alumniRef, updateData);
    console.log('✅ Profil alumni mis à jour avec succès:', uid);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du profil alumni:', error);
    throw error;
  }
};

/**
 * Mettre à jour le statut d'un profil alumni (admin uniquement)
 */
export const updateAlumniStatus = async (
  uid: string,
  status: AlumniProfileStatus,
  validatedBy?: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const alumniRef = doc(db, ALUMNI_COLLECTION, uid);

    const updateData: Record<string, Timestamp | string | ReturnType<typeof deleteField>> = {
      status,
      dateUpdated: Timestamp.now(),
    };

    if (status === 'approved') {
      updateData.dateValidation = Timestamp.now();
      if (validatedBy) {
        updateData.validatedBy = validatedBy;
      }
      // Supprimer la raison de rejet si elle existe
      updateData.rejectionReason = deleteField();
    } else if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason || '';
      // Supprimer les champs de validation
      updateData.dateValidation = deleteField();
      updateData.validatedBy = deleteField();
    }

    await updateDoc(alumniRef, updateData);
    console.log('✅ Statut du profil alumni mis à jour:', uid, status);

    // Envoyer une notification email à l'alumni
    try {
      const profile = await getAlumniProfile(uid);
      if (profile && profile.email) {
        if (status === 'approved') {
          await NotificationService.sendCustomEmail(
            profile.email,
            'Votre profil alumni a été approuvé !',
            `
Bonjour ${profile.name},

Nous avons le plaisir de vous informer que votre profil alumni a été approuvé par notre équipe !

🎉 Félicitations ! Votre profil est maintenant visible dans l'annuaire alumni.

Vous pouvez dès à présent :
• Consulter votre profil public
• Être contacté par d'autres alumni
• Profiter de toutes les fonctionnalités de l'annuaire

Pour voir votre profil : ${PRODUCTION_URL}/#/alumni/${uid}

Merci de faire partie de notre communauté !

---
Ceci est une notification automatique, merci de ne pas y répondre directement.
            `.trim(),
            profile.name
          );
        } else if (status === 'rejected') {
          await NotificationService.sendCustomEmail(
            profile.email,
            'Votre profil alumni nécessite des modifications',
            `
Bonjour ${profile.name},

Nous avons examiné votre profil alumni et nous avons besoin que vous apportiez quelques modifications avant de pouvoir l'approuver.

📝 Raison du rejet :
${rejectionReason || 'Aucune raison spécifiée'}

Que faire maintenant ?
• Connectez-vous à votre compte
• Accédez à "Mon profil alumni"
• Modifiez les informations selon les indications ci-dessus
• Soumettez à nouveau votre profil

Nous examinerons votre profil dès que possible après vos modifications.

Pour modifier votre profil : ${PRODUCTION_URL}/#/my-alumni-profile

Si vous avez des questions, n'hésitez pas à nous contacter.

---
Ceci est une notification automatique, merci de ne pas y répondre directement.
            `.trim(),
            profile.name
          );
        }
        console.log('✅ Email de notification envoyé à:', profile.email);
      }
    } catch (emailError) {
      console.error('⚠️ Erreur lors de l\'envoi de l\'email de notification:', emailError);
      // Ne pas bloquer la mise à jour du statut si l'email échoue
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
};

/**
 * Récupérer tous les profils alumni rejetés (admin uniquement)
 */
export const getRejectedAlumniProfiles = async (): Promise<AlumniProfile[]> => {
  try {
    const alumniRef = collection(db, ALUMNI_COLLECTION);
    const q = query(
      alumniRef,
      where('status', '==', 'rejected'),
      orderBy('dateUpdated', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as AlumniProfile[];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des profils rejetés:', error);
    throw error;
  }
};

/**
 * Récupérer tous les profils alumni approuvés (pour l'annuaire public)
 */
export const getApprovedAlumniProfiles = async (
  sortBy: AlumniSortOption = 'dateCreated',
  limitCount: number = 50
): Promise<AlumniProfile[]> => {
  try {
    const alumniRef = collection(db, ALUMNI_COLLECTION);
    let q: Query<DocumentData>;

    // Construire la requête avec tri
    if (sortBy === 'name') {
      q = query(
        alumniRef,
        where('status', '==', 'approved'),
        orderBy('name', 'asc'),
        limit(limitCount)
      );
    } else if (sortBy === 'dateCreated') {
      q = query(
        alumniRef,
        where('status', '==', 'approved'),
        orderBy('dateCreated', 'desc'),
        limit(limitCount)
      );
    } else {
      // relevance - par défaut, tri par date
      q = query(
        alumniRef,
        where('status', '==', 'approved'),
        orderBy('dateCreated', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const profiles: AlumniProfile[] = [];

    querySnapshot.forEach((doc) => {
      profiles.push(doc.data() as AlumniProfile);
    });

    return profiles;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des profils approuvés:', error);
    throw error;
  }
};

/**
 * Récupérer tous les profils alumni en brouillon (pour admin)
 */
export const getDraftAlumniProfiles = async (): Promise<AlumniProfile[]> => {
  try {
    const alumniRef = collection(db, ALUMNI_COLLECTION);
    const q = query(
      alumniRef,
      where('status', '==', 'draft')
    );

    const querySnapshot = await getDocs(q);
    const profiles: AlumniProfile[] = [];

    querySnapshot.forEach((doc) => {
      profiles.push(doc.data() as AlumniProfile);
    });

    // Trier côté client par date de création (plus récent en premier)
    profiles.sort((a, b) => {
      const dateA = a.dateCreated?.toMillis?.() || 0;
      const dateB = b.dateCreated?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return profiles;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des profils brouillons:', error);
    throw error;
  }
};

/**
 * Récupérer tous les profils alumni en attente (pour validation admin)
 */
export const getPendingAlumniProfiles = async (): Promise<AlumniProfile[]> => {
  try {
    const alumniRef = collection(db, ALUMNI_COLLECTION);
    const q = query(
      alumniRef,
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    const profiles: AlumniProfile[] = [];

    querySnapshot.forEach((doc) => {
      profiles.push(doc.data() as AlumniProfile);
    });

    // Trier côté client par date de création (plus récent en premier)
    profiles.sort((a, b) => {
      const dateA = a.dateCreated?.toMillis?.() || 0;
      const dateB = b.dateCreated?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return profiles;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des profils en attente:', error);
    throw error;
  }
};

/**
 * Rechercher des profils alumni avec filtres
 * Note: Firestore ne supporte pas la recherche full-text native.
 * Cette fonction filtre côté client pour la V1.
 * Pour une vraie recherche full-text, utiliser Algolia ou Elasticsearch.
 */
export const searchAlumni = async (
  filters: AlumniSearchFilters,
  sortBy: AlumniSortOption = 'dateCreated',
  limitCount: number = 50
): Promise<AlumniProfile[]> => {
  try {
    // Récupérer tous les profils approuvés
    let profiles = await getApprovedAlumniProfiles(sortBy, 1000); // Limite élevée pour filtrage client

    // Filtrage côté client (V1 - à améliorer avec Algolia)
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      profiles = profiles.filter((profile) => {
        return (
          profile.name.toLowerCase().includes(searchLower) ||
          profile.headline?.toLowerCase().includes(searchLower) ||
          profile.bio?.toLowerCase().includes(searchLower) ||
          profile.company?.toLowerCase().includes(searchLower) ||
          profile.sectors.some((s) => s.toLowerCase().includes(searchLower)) ||
          profile.expertise.some((e) => e.toLowerCase().includes(searchLower)) ||
          profile.softSkills?.some((s) => s.toLowerCase().includes(searchLower)) ||
          profile.interests?.some((i) => i.toLowerCase().includes(searchLower))
        );
      });
    }

    // Filtrer par secteurs
    if (filters.sectors && filters.sectors.length > 0) {
      profiles = profiles.filter((profile) =>
        profile.sectors.some((s) => filters.sectors!.includes(s))
      );
    }

    // Filtrer par expertise
    if (filters.expertise && filters.expertise.length > 0) {
      profiles = profiles.filter((profile) =>
        profile.expertise.some((e) => filters.expertise!.includes(e))
      );
    }

    // Filtrer par année de promo
    if (filters.yearPromoMin) {
      profiles = profiles.filter((profile) => profile.yearPromo >= filters.yearPromoMin!);
    }
    if (filters.yearPromoMax) {
      profiles = profiles.filter((profile) => profile.yearPromo <= filters.yearPromoMax!);
    }

    // Filtrer par localisation
    if (filters.city) {
      profiles = profiles.filter(
        (profile) => profile.city?.toLowerCase() === filters.city!.toLowerCase()
      );
    }
    if (filters.country) {
      profiles = profiles.filter(
        (profile) => profile.country?.toLowerCase() === filters.country!.toLowerCase()
      );
    }

    // Filtrer par "Je cherche"
    if (filters.seeking && filters.seeking.length > 0) {
      profiles = profiles.filter((profile) =>
        profile.seeking?.some((s) => filters.seeking!.includes(s))
      );
    }

    // Filtrer par "Je propose"
    if (filters.offering && filters.offering.length > 0) {
      profiles = profiles.filter((profile) =>
        profile.offering?.some((o) => filters.offering!.includes(o))
      );
    }

    // Filtrer par soft skills
    if (filters.softSkills && filters.softSkills.length > 0) {
      profiles = profiles.filter((profile) =>
        profile.softSkills?.some((s) => filters.softSkills!.includes(s))
      );
    }

    // Filtrer par langues
    if (filters.languages && filters.languages.length > 0) {
      profiles = profiles.filter((profile) =>
        profile.languages?.some((l) => filters.languages!.includes(l.name))
      );
    }

    // Filtrer par disponibilité
    if (filters.availability) {
      profiles = profiles.filter((profile) => 
        profile.availability === filters.availability
      );
    }

    // Limiter les résultats
    return profiles.slice(0, limitCount);
  } catch (error) {
    console.error('❌ Erreur lors de la recherche de profils alumni:', error);
    throw error;
  }
};

/**
 * Récupérer les derniers profils approuvés (pour mise en avant)
 */
export const getLatestApprovedProfiles = async (
  count: number = 3
): Promise<AlumniProfile[]> => {
  try {
    const alumniRef = collection(db, ALUMNI_COLLECTION);
    const q = query(
      alumniRef,
      where('status', '==', 'approved'),
      orderBy('dateValidation', 'desc'),
      limit(count)
    );

    const querySnapshot = await getDocs(q);
    const profiles: AlumniProfile[] = [];

    querySnapshot.forEach((doc) => {
      profiles.push(doc.data() as AlumniProfile);
    });

    return profiles;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des derniers profils:', error);
    throw error;
  }
};

/**
 * Récupérer des profils aléatoires approuvés (pour "À découvrir")
 */
export const getRandomApprovedProfiles = async (
  count: number = 3
): Promise<AlumniProfile[]> => {
  try {
    // Récupérer tous les profils approuvés
    const allProfiles = await getApprovedAlumniProfiles('dateCreated', 1000);

    // Mélanger aléatoirement
    const shuffled = allProfiles.sort(() => 0.5 - Math.random());

    // Retourner les N premiers
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de profils aléatoires:', error);
    throw error;
  }
};

/**
 * Calculer les statistiques de l'annuaire alumni
 */
export const getAlumniStats = async (): Promise<AlumniStats> => {
  try {
    const alumniRef = collection(db, ALUMNI_COLLECTION);
    const querySnapshot = await getDocs(alumniRef);

    const stats: AlumniStats = {
      totalProfiles: 0,
      approvedProfiles: 0,
      pendingProfiles: 0,
      rejectedProfiles: 0,
      profilesByYear: {},
      profilesBySector: {},
      profilesByCountry: {},
    };

    querySnapshot.forEach((doc) => {
      const profile = doc.data() as AlumniProfile;
      stats.totalProfiles++;

      // Compter par statut
      if (profile.status === 'approved') stats.approvedProfiles++;
      if (profile.status === 'pending') stats.pendingProfiles++;
      if (profile.status === 'rejected') stats.rejectedProfiles++;

      // Compter par année
      if (profile.yearPromo) {
        stats.profilesByYear[profile.yearPromo] =
          (stats.profilesByYear[profile.yearPromo] || 0) + 1;
      }

      // Compter par secteur
      profile.sectors.forEach((sector) => {
        stats.profilesBySector[sector] = (stats.profilesBySector[sector] || 0) + 1;
      });

      // Compter par pays
      if (profile.country) {
        stats.profilesByCountry[profile.country] =
          (stats.profilesByCountry[profile.country] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    console.error('❌ Erreur lors du calcul des statistiques:', error);
    throw error;
  }
};

/**
 * Vérifier si un utilisateur a un profil alumni
 */
export const hasAlumniProfile = async (uid: string): Promise<boolean> => {
  try {
    const profile = await getAlumniProfile(uid);
    return profile !== null;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du profil alumni:', error);
    return false;
  }
};

/**
 * Récupérer tous les secteurs uniques (pour autocomplete)
 */
export const getAllSectors = async (): Promise<string[]> => {
  try {
    const alumniRef = collection(db, ALUMNI_COLLECTION);
    const q = query(alumniRef, where('status', '==', 'approved'));
    const querySnapshot = await getDocs(q);

    const sectorsSet = new Set<string>();

    querySnapshot.forEach((doc) => {
      const profile = doc.data() as AlumniProfile;
      profile.sectors.forEach((sector) => sectorsSet.add(sector));
    });

    return Array.from(sectorsSet).sort();
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des secteurs:', error);
    throw error;
  }
};

/**
 * Récupérer toutes les expertises uniques (pour autocomplete)
 */
export const getAllExpertise = async (): Promise<string[]> => {
  try {
    const alumniRef = collection(db, ALUMNI_COLLECTION);
    const q = query(alumniRef, where('status', '==', 'approved'));
    const querySnapshot = await getDocs(q);

    const expertiseSet = new Set<string>();

    querySnapshot.forEach((doc) => {
      const profile = doc.data() as AlumniProfile;
      profile.expertise.forEach((exp) => expertiseSet.add(exp));
    });

    return Array.from(expertiseSet).sort();
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des expertises:', error);
    throw error;
  }
};

/**
 * Supprimer un profil alumni (admin uniquement)
 */
export const deleteAlumniProfile = async (uid: string): Promise<void> => {
  try {
    const alumniRef = doc(db, ALUMNI_COLLECTION, uid);
    await deleteDoc(alumniRef);
    console.log('✅ Profil alumni supprimé:', uid);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du profil alumni:', error);
    throw error;
  }
};

/**
 * Envoyer une demande de contact entre alumni
 */
export const sendContactRequest = async (data: {
  fromUid: string;
  fromName: string;
  fromEmail: string;
  toUid: string;
  toName: string;
  toEmail: string;
  subject: string;
  message: string;
}): Promise<void> => {
  try {
    // Créer l'enregistrement de la demande dans Firestore
    const contactRequestsRef = collection(db, 'contactRequests');
    const newRequestRef = doc(contactRequestsRef);

    const contactRequest = {
      id: newRequestRef.id,
      fromUid: data.fromUid,
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      toUid: data.toUid,
      toName: data.toName,
      toEmail: data.toEmail,
      subject: data.subject,
      message: data.message,
      status: 'pending' as const,
      dateCreated: Timestamp.now(),
    };

    await setDoc(newRequestRef, contactRequest);

    // Envoyer l'email au destinataire
    try {
      await NotificationService.sendCustomEmail(
        data.toEmail,
        `Nouvelle demande de contact : ${data.subject}`,
        `
Bonjour ${data.toName},

Vous avez reçu une nouvelle demande de contact via l'annuaire alumni CPS Connect.

👤 De : ${data.fromName}
📧 Email : ${data.fromEmail}
📋 Objet : ${data.subject}

💬 Message :
${data.message}

---

Vous pouvez répondre directement à ${data.fromEmail} pour donner suite à cette demande.

Pour voir le profil de ${data.fromName} : ${PRODUCTION_URL}/#/alumni/${data.fromUid}

---
Ceci est une notification automatique de CPS Connect.
        `.trim(),
        data.toName
      );

      // Mettre à jour le statut à 'sent'
      await updateDoc(newRequestRef, { status: 'sent' });
      console.log('✅ Demande de contact envoyée avec succès');
    } catch (emailError) {
      console.error('⚠️ Erreur lors de l\'envoi de l\'email:', emailError);
      // Mettre à jour le statut à 'failed'
      await updateDoc(newRequestRef, { status: 'failed' });
      throw new Error('Échec de l\'envoi de l\'email');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la demande de contact:', error);
    throw error;
  }
};

/**
 * Import en masse - Types et interfaces
 */
export interface ImportAlumniData {
  name: string;
  email: string;
  yearPromo: number;
  city?: string;
  position?: string;
  sectors?: string[];
  expertise?: string[];
  bio?: string;
}

export interface ImportResult {
  success: number;
  skipped: number;
  updated: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

/**
 * Créer un compte utilisateur + profil alumni pour l'import
 * Utilise Firebase Client SDK (createUserWithEmailAndPassword)
 * Si le compte Auth existe déjà, crée uniquement le profil alumni
 */
export const createAlumniAccountWithProfile = async (
  data: ImportAlumniData
): Promise<{ success: boolean; uid?: string; error?: string }> => {
  try {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const { secondaryAuth } = await import('../firebase');
    const { generateSecurePassword } = await import('../utils/passwordGenerator');
    
    // Vérifier que l'instance secondaire est disponible
    if (!secondaryAuth) {
      return {
        success: false,
        error: 'Instance secondaire Firebase non disponible',
      };
    }
    
    let user;
    let isNewAccount = false;
    
    try {
      // 1. Essayer de créer le compte avec l'instance SECONDAIRE
      // ✅ Cela ne déconnecte PAS l'utilisateur principal !
      const tempPassword = generateSecurePassword();
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, tempPassword);
      user = userCredential.user;
      isNewAccount = true;
      
      // 2. Mettre à jour le displayName dans Firebase Auth
      // Important : faire ça AVANT de déconnecter
      await updateProfile(user, {
        displayName: data.name,
      });
      
      // 3. Créer le document utilisateur dans Firestore
      // Le displayName est sauvegardé ici aussi pour cohérence
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: data.email,
        displayName: data.name, // Même valeur que Firebase Auth
        emailVerified: false,
        isAdmin: false,
        isSuperAdmin: false,
        isEditor: false,
        yearPromo: data.yearPromo,
        profileComplete: true,
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
      });
      
      // 4. Déconnecter l'instance secondaire (APRÈS avoir tout sauvegardé)
      await secondaryAuth.signOut();
      
      console.log(`✅ Nouveau compte Auth créé pour ${data.email}`);
    } catch (authError: any) {
      // Si l'email existe déjà dans Auth
      if (authError.code === 'auth/email-already-in-use') {
        console.log(`ℹ️  Compte Auth existe déjà pour ${data.email}, récupération de l'UID...`);
        
        // Récupérer l'UID depuis le document users dans Firestore
        const usersSnapshot = await getDocs(
          query(
            collection(db, 'users'),
            where('email', '==', data.email.toLowerCase())
          )
        );
        
        if (!usersSnapshot.empty) {
          const existingUser = usersSnapshot.docs[0];
          user = { uid: existingUser.id } as any;
          console.log(`✅ UID récupéré: ${user.uid}`);
        } else {
          // Cas très rare: compte Auth existe mais pas dans Firestore users
          return {
            success: false,
            error: 'Compte Auth existe mais UID introuvable dans Firestore',
          };
        }
      } else {
        // Autre erreur Auth
        throw authError;
      }
    }
    
    // 4. Créer le profil alumni (que le compte soit nouveau ou existant)
    const alumniRef = doc(db, ALUMNI_COLLECTION, user.uid);
    await setDoc(alumniRef, {
      uid: user.uid,
      name: data.name,
      email: data.email,
      yearPromo: data.yearPromo,
      headline: '',
      bio: data.bio || '',
      photo: '',
      sectors: data.sectors || [],
      expertise: data.expertise || [],
      company: '',
      position: data.position || '',
      companyDescription: '',
      companyWebsite: '',
      personalWebsite: '',
      city: data.city || '',
      country: '',
      linkedin: '',
      github: '',
      twitter: '',
      portfolio: [],
      services: [],
      seeking: [],
      offering: [],
      status: 'approved', // Pré-approuvé
      dateCreated: Timestamp.now(),
      dateUpdated: Timestamp.now(),
      importedFrom: 'bulk_import',
      importedAt: Timestamp.now(),
    });
    
    if (isNewAccount) {
      console.log(`✅ Compte complet créé pour ${data.email} (UID: ${user.uid})`);
    } else {
      console.log(`✅ Profil alumni créé pour compte existant ${data.email} (UID: ${user.uid})`);
    }
    
    return {
      success: true,
      uid: user.uid,
    };
  } catch (error: any) {
    console.error('Erreur création compte alumni:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue',
    };
  }
};

/**
 * Import en masse de profils alumni depuis un fichier parsé
 * Crée les comptes Firebase Auth + profils Firestore
 */
export const importAlumniFromFile = async (
  parsedData: ImportAlumniData[],
  onProgress?: (current: number, total: number) => void,
  options?: { sendActivationEmail?: boolean }
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: 0,
    skipped: 0,
    updated: 0,
    errors: [],
  };
  
  console.log(`🚀 Début de l'import de ${parsedData.length} profils...`);
  
  for (let i = 0; i < parsedData.length; i++) {
    const row = parsedData[i];
    const rowNumber = i + 2; // +2 car ligne 1 = headers, index commence à 0
    
    try {
      // Notifier la progression
      if (onProgress) {
        onProgress(i + 1, parsedData.length);
      }
      
      // Vérifier si l'email existe déjà
      const existingProfiles = await getDocs(
        query(
          collection(db, ALUMNI_COLLECTION),
          where('email', '==', row.email.toLowerCase())
        )
      );
      
      if (!existingProfiles.empty) {
        const existingDoc = existingProfiles.docs[0];
        const existingData = existingDoc.data();
        // Mettre à jour uniquement les champs non vides qui ont changé
        const updates: Record<string, unknown> = {};
        if (row.city && row.city !== existingData.city) updates.city = row.city;
        if (row.position && row.position !== existingData.position) updates.position = row.position;
        if (row.sectors && row.sectors.length > 0) updates.sectors = row.sectors;
        if (row.expertise && row.expertise.length > 0) updates.expertise = row.expertise;
        if (row.yearPromo && row.yearPromo !== existingData.yearPromo) updates.yearPromo = row.yearPromo;
        if (Object.keys(updates).length > 0) {
          updates.dateUpdated = Timestamp.now();
          await updateDoc(doc(db, ALUMNI_COLLECTION, existingDoc.id), updates);
          console.log(`🔄 Ligne ${rowNumber}: Email ${row.email} mis à jour`);
          result.updated++;
        } else {
          console.log(`⏭️  Ligne ${rowNumber}: Email ${row.email} inchangé, ignoré`);
          result.skipped++;
        }
        continue;
      }
      
      // Créer le compte + profil
      const createResult = await createAlumniAccountWithProfile(row);
      
      if (createResult.success) {
        console.log(`✅ Ligne ${rowNumber}: Compte créé pour ${row.email}`);
        result.success++;
        if (options?.sendActivationEmail) {
          try {
            const appUrl = import.meta.env.VITE_APP_URL || 'https://cps-connect.web.app';
            const subject = "Votre compte CPS Connect a été créé";
            const message = `Bonjour ${row.name},\n\nVotre compte sur CPS Connect a été créé suite au recensement de la communauté alumni CPS.\n\nPour accéder à votre espace :\n1. Rendez-vous sur ${appUrl}/login\n2. Cliquez sur "Mot de passe oublié"\n3. Entrez votre adresse email : ${row.email}\n4. Suivez les instructions pour définir votre mot de passe\n\nUne fois connecté, complétez votre profil pour être visible dans l'annuaire.\n\nÀ bientôt sur CPS Connect 🎓`.trim();
            await NotificationService.sendCustomEmail(row.email, subject, message, row.name);
          } catch (emailError) {
            console.warn(`⚠️ Email non envoyé pour ${row.email}:`, emailError);
          }
        }
      } else {
        console.error(`❌ Ligne ${rowNumber}: Erreur pour ${row.email}: ${createResult.error}`);
        result.errors.push({
          row: rowNumber,
          email: row.email,
          error: createResult.error || 'Erreur inconnue',
        });
      }
      
      // Pause plus longue pour éviter le rate limiting de Firebase Auth
      await new Promise(resolve => setTimeout(resolve, 5000)); // 2 secondes entre chaque création
      
    } catch (error: any) {
      console.error(`❌ Ligne ${rowNumber}: Erreur pour ${row.email}:`, error.message);
      result.errors.push({
        row: rowNumber,
        email: row.email,
        error: error.message || 'Erreur inconnue',
      });
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ DE L\'IMPORT');
  console.log('='.repeat(50));
  console.log(`Total traité    : ${parsedData.length}`);
  console.log(`✅ Succès       : ${result.success}`);
  console.log(`🔄 Mis à jour   : ${result.updated}`);
  console.log(`⏭️  Ignorés      : ${result.skipped}`);
  console.log(`❌ Erreurs      : ${result.errors.length}`);
  console.log('='.repeat(50));
  
  return result;
};

/**
 * ===== IMPORT SIMPLIFIÉ (NOM + EMAIL) =====
 */

export interface MinimalImportEntry {
  name: string;
  email: string;
}

export interface EmailImportResult {
  success: number;
  skipped: number;
  errors: Array<{ email: string; error: string }>;
}

export const importEmailsOnly = async (
  entries: MinimalImportEntry[],
  options: { yearPromo?: number; sendActivationEmail?: boolean },
  onProgress?: (current: number, total: number) => void
): Promise<EmailImportResult> => {
  const result: EmailImportResult = { success: 0, skipped: 0, errors: [] };
  const appUrl = import.meta.env.VITE_APP_URL || 'https://cps-connect.web.app';

  console.log(`🚀 Import simplifié : ${entries.length} entrées...`);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    try {
      if (onProgress) onProgress(i + 1, entries.length);

      // Vérifier si email existe déjà dans alumni
      const existing = await getDocs(
        query(collection(db, ALUMNI_COLLECTION), where('email', '==', entry.email.toLowerCase()))
      );

      if (!existing.empty) {
        console.log(`⏭️  ${entry.email} existe déjà, ignoré`);
        result.skipped++;
        continue;
      }

      // Créer compte + profil alumni
      const createResult = await createAlumniAccountWithProfile({
        name: entry.name,
        email: entry.email,
        yearPromo: options.yearPromo ?? 0,
      });

      if (!createResult.success) {
        result.errors.push({ email: entry.email, error: createResult.error || 'Erreur inconnue' });
        continue;
      }

      // Envoyer email d'activation
      if (options.sendActivationEmail !== false) {
        const subject = "Votre compte CPS Connect a été créé";
        const message = `Bonjour ${entry.name},\n\nVotre compte sur CPS Connect — la plateforme communautaire des alumni CPS — a été créé suite au recensement de la communauté.\n\nPour accéder à votre espace :\n1. Rendez-vous sur ${appUrl}/login\n2. Cliquez sur "Mot de passe oublié"\n3. Entrez votre adresse email : ${entry.email}\n4. Suivez les instructions reçues pour définir votre mot de passe\n\nUne fois connecté, complétez votre profil alumni pour être visible dans l'annuaire et entrer en contact avec la communauté.\n\nÀ bientôt sur CPS Connect !`;
        await NotificationService.sendCustomEmail(entry.email, subject, message, entry.name);
      }

      result.success++;
      console.log(`✅ ${entry.email} créé`);

      // Rate limiting Firebase Auth
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error: any) {
      console.error(`❌ ${entry.email}:`, error.message);
      result.errors.push({ email: entry.email, error: error.message || 'Erreur inconnue' });
    }
  }

  console.log(`\n📊 Import simplifié — Succès: ${result.success} | Ignorés: ${result.skipped} | Erreurs: ${result.errors.length}`);
  return result;
};

/**
 * ===== RAPPELS D'ACTIVATION =====
 */

export interface ReminderResult {
  sent: number;
  alreadyActive: number;
  errors: Array<{ email: string; error: string }>;
}

export interface InactiveAlumni { uid: string; name: string; email: string; }

export const getInactiveAlumni = async (
  importedFrom: 'bulk_import' | 'email_only_import'
): Promise<InactiveAlumni[]> => {
  const alumniSnap = await getDocs(
    query(collection(db, ALUMNI_COLLECTION), where('importedFrom', '==', importedFrom))
  );
  const inactive: InactiveAlumni[] = [];
  for (const alumniDoc of alumniSnap.docs) {
    const alumni = alumniDoc.data();
    if (!alumni.uid || !alumni.email) continue;
    const userDoc = await getDoc(doc(db, 'users', alumni.uid));
    if (!userDoc.exists() || !userDoc.data().lastActive) {
      inactive.push({ uid: alumni.uid, name: alumni.name || '', email: alumni.email });
    }
  }
  return inactive;
};

export const sendActivationReminders = async (
  importedFrom: 'bulk_import' | 'email_only_import',
  onProgress?: (current: number, total: number) => void
): Promise<ReminderResult> => {
  const result: ReminderResult = { sent: 0, alreadyActive: 0, errors: [] };
  const appUrl = import.meta.env.VITE_APP_URL || 'https://cps-connect.web.app';

  // 1. Récupérer tous les alumni importés
  const alumniSnap = await getDocs(
    query(collection(db, ALUMNI_COLLECTION), where('importedFrom', '==', importedFrom))
  );

  const total = alumniSnap.size;

  // 2. Pour chaque alumni, vérifier si lastActive absent dans users
  for (let i = 0; i < alumniSnap.docs.length; i++) {
    const alumniDoc = alumniSnap.docs[i];
    const alumni = alumniDoc.data();
    if (onProgress) onProgress(i + 1, total);

    try {
      const uid = alumni.uid;
      if (!uid || !alumni.email) { result.alreadyActive++; continue; }

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists() || userDoc.data().lastActive) {
        // lastActive présent → s'est déjà connecté
        result.alreadyActive++;
        continue;
      }

      // Jamais connecté → envoyer rappel
      const name = alumni.name || '';
      const subject = "Rappel : votre compte CPS Connect vous attend";
      const message = `Bonjour ${name},\n\nVotre compte sur CPS Connect a été créé suite au recensement de la communauté alumni CPS, mais il n'a pas encore été activé.\n\nPour accéder à votre espace :\n1. Rendez-vous sur ${appUrl}/login\n2. Cliquez sur "Mot de passe oublié"\n3. Entrez votre adresse email : ${alumni.email}\n4. Suivez les instructions pour définir votre mot de passe\n\nUne fois connecté, complétez votre profil pour être visible dans l'annuaire.\n\nÀ bientôt sur CPS Connect 🎓`.trim();

      await NotificationService.sendCustomEmail(alumni.email, subject, message, name);
      result.sent++;

      // Pause pour éviter rate limit EmailJS
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      result.errors.push({ email: alumni.email || '?', error: error.message });
    }
  }

  return result;
};

/**
 * ===== FONCTIONNALITÉS DE RECOMMANDATIONS =====
 */

/**
 * Envoyer une recommandation à un alumni
 */
export const sendRecommendation = async (data: {
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  message: string;
}): Promise<void> => {
  try {
    const recommendationsRef = collection(db, 'recommendations');
    const newRecommendationRef = doc(recommendationsRef);

    const recommendation = {
      id: newRecommendationRef.id,
      fromUid: data.fromUid,
      fromName: data.fromName,
      toUid: data.toUid,
      toName: data.toName,
      message: data.message,
      date: Timestamp.now(),
      status: 'pending' as const,
    };

    await setDoc(newRecommendationRef, recommendation);

    // Mettre à jour le compteur d'endorsements du profil destinataire
    const alumniRef = doc(db, ALUMNI_COLLECTION, data.toUid);
    await updateDoc(alumniRef, {
      endorsementCount: increment(1),
    });

    console.log('✅ Recommandation envoyée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la recommandation:', error);
    throw error;
  }
};

/**
 * Récupérer les recommandations reçues par un alumni
 */
export const getReceivedRecommendations = async (
  uid: string
): Promise<AlumniRecommendation[]> => {
  try {
    const recommendationsRef = collection(db, 'recommendations');
    const q = query(
      recommendationsRef,
      where('toUid', '==', uid),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as AlumniRecommendation);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des recommandations:', error);
    throw error;
  }
};

/**
 * Récupérer les recommandations envoyées par un alumni
 */
export const getSentRecommendations = async (
  uid: string
): Promise<AlumniRecommendation[]> => {
  try {
    const recommendationsRef = collection(db, 'recommendations');
    const q = query(
      recommendationsRef,
      where('fromUid', '==', uid),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as AlumniRecommendation);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des recommandations envoyées:', error);
    throw error;
  }
};
