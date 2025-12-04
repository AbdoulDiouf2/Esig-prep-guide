import { Timestamp } from 'firebase/firestore';

/**
 * Statut du profil alumni
 * - pending: En attente de validation admin
 * - approved: Validé par admin, visible dans l'annuaire
 * - rejected: Rejeté par admin, non visible
 */
export type AlumniProfileStatus = 'pending' | 'approved' | 'rejected';

/**
 * Item de portfolio
 */
export interface PortfolioItem {
  title: string;
  description: string;
  url?: string;
  image?: string;
}

/**
 * Service offert
 */
export interface ServiceOffered {
  name: string;
  description: string;
  category: string;
}

/**
 * Profil alumni complet
 * Utilisé pour l'annuaire des alumni et le réseau professionnel
 */
export interface AlumniProfile {
  // ===== Infos de base (OBLIGATOIRES) =====
  uid: string;
  name: string;
  email: string;
  yearPromo: number; // Année de sortie de prépa (fin 2ème année)

  // ===== Profil professionnel (OPTIONNELS) =====
  headline?: string; // Ex: "Développeur React | Startup Founder"
  bio?: string; // Description détaillée
  photo?: string; // URL photo (Firebase Storage)

  // ===== Secteurs & Expertise (FLEXIBLES) =====
  sectors: string[]; // Ex: ["Tech", "Startup", "Finance"]
  expertise: string[]; // Tags libres, ex: ["React", "Node.js", "Levée de fonds"]

  // ===== Professionnel =====
  company?: string;
  position?: string;
  companyDescription?: string;
  website?: string;

  // ===== Portfolio (FLEXIBLE) =====
  portfolio?: PortfolioItem[];

  // ===== Services offerts (FLEXIBLE) =====
  services?: ServiceOffered[];

  // ===== "Je cherche / Je propose" (NOUVEAU) =====
  seeking?: string[]; // Ex: ["Collaborateur", "Mentor", "Opportunité"]
  offering?: string[]; // Ex: ["Conseil", "Mentorat", "Service"]

  // ===== Réseaux sociaux =====
  linkedin?: string;
  github?: string;
  twitter?: string;

  // ===== Localisation =====
  city?: string;
  country?: string;

  // ===== Métadonnées =====
  status: AlumniProfileStatus;
  dateCreated: Timestamp;
  dateUpdated?: Timestamp;
  dateValidation?: Timestamp;
  validatedBy?: string; // UID admin qui a validé
  rejectionReason?: string; // Raison du rejet (si status = rejected)
}

/**
 * Demande de contact entre alumni
 */
export interface ContactRequest {
  id: string;
  fromUid: string; // Qui demande
  fromName: string;
  fromEmail: string;
  toUid: string; // Qui reçoit
  toName: string;
  toEmail: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  dateCreated: Timestamp;
}

/**
 * Filtres de recherche pour l'annuaire alumni
 */
export interface AlumniSearchFilters {
  searchQuery?: string; // Recherche full-text
  sectors?: string[]; // Filtrer par secteurs
  expertise?: string[]; // Filtrer par expertise
  yearPromoMin?: number; // Année de promo minimum
  yearPromoMax?: number; // Année de promo maximum
  city?: string;
  country?: string;
  seeking?: string[]; // Filtrer par "Je cherche"
  offering?: string[]; // Filtrer par "Je propose"
}

/**
 * Options de tri pour l'annuaire
 */
export type AlumniSortOption = 'name' | 'dateCreated' | 'relevance';

/**
 * Données pour créer un profil alumni
 * (version simplifiée pour la création initiale)
 */
export interface CreateAlumniProfileData {
  uid: string;
  name: string;
  email: string;
  yearPromo: number;
  headline?: string;
  bio?: string;
  sectors?: string[];
  expertise?: string[];
  company?: string;
  position?: string;
  photo?: string;
}

/**
 * Données pour mettre à jour un profil alumni
 */
export type UpdateAlumniProfileData = Partial<Omit<AlumniProfile, 'uid' | 'dateCreated' | 'status' | 'validatedBy' | 'dateValidation'>>;

/**
 * Statistiques de l'annuaire alumni
 */
export interface AlumniStats {
  totalProfiles: number;
  approvedProfiles: number;
  pendingProfiles: number;
  rejectedProfiles: number;
  profilesByYear: Record<number, number>; // Ex: { 2022: 15, 2023: 20 }
  profilesBySector: Record<string, number>; // Ex: { "Tech": 30, "Finance": 10 }
  profilesByCountry: Record<string, number>;
}
