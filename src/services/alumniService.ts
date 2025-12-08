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
      status: 'draft', // Brouillon par défaut, l'utilisateur doit compléter puis soumettre
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

    // Nettoyer les valeurs undefined (Firestore ne les accepte pas)
    const cleanedData: Partial<UpdateAlumniProfileData> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
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
          profile.expertise.some((e) => e.toLowerCase().includes(searchLower))
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
