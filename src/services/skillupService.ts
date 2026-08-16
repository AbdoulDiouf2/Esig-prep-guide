import { getIdToken } from 'firebase/auth';
import { auth } from '../firebase';

const SKILLUP_PROXY_URL = import.meta.env.VITE_SKILLUP_PROXY_URL as string;

export type SkillupAction =
  | 'access'
  | 'vagues'
  | 'journal'
  | 'binomeJournal'
  | 'bilan'
  | 'members'
  | 'sessions'
  | 'binomes'
  | 'sessionCorriger'
  | 'sessionSupprimer'
  | 'binomeDefinir'
  | 'binomeRetirer'
  | 'membreAjouter'
  | 'membreEditer'
  | 'discordMembers'
  | 'vaguesAdminLister'
  | 'vagueCreer'
  | 'vagueActiver'
  | 'vagueCloturer'
  | 'salonsLister'
  | 'salonAjouter'
  | 'salonRetirer'
  | 'discordVoiceChannels'
  | 'discordAvatars'
  | 'objectifVagueLire'
  | 'objectifVagueDefinir'
  | 'sessionCorrigerSelf'
  | 'sessionSupprimerSelf'
  | 'membreLierThread';

export type SkillupSessionChamp = 'objectif' | 'bilan' | 'blocages' | 'creneau';
export type SkillupMembreChamp = 'nom' | 'profil' | 'certif_ou_projet' | 'objectif_vague';
export type SkillupProfil = 'étudiant' | "demandeur d'emploi" | 'cadre' | 'alternant' | 'autre';

export interface SkillupAccess {
  is_participant: boolean;
  is_admin: boolean;
}

export interface SkillupVague {
  id: number;
  nom: string;
  active: boolean;
}

export interface SkillupLinkStatus {
  linked: false;
}

export interface SkillupBinomeAction {
  message: string;
  dm_echecs: string[];
}

export interface SkillupMembreAjouterResult {
  id: number;
  discord_id: string;
  nom: string;
  profil: string;
  certif_ou_projet: string | null;
  dm_ok: boolean;
}

export interface SkillupMemberEditResult {
  id: number;
  discord_id: string;
  nom: string;
  profil: string;
  certif_ou_projet: string | null;
  objectif_vague?: string | null;
}

export interface SkillupDiscordMember {
  discord_id: string;
  username: string;
}

export interface SkillupDiscordVoiceChannel {
  channel_id: string;
  name: string;
}

export interface SkillupVagueAdmin {
  id: number;
  nom: string;
  date_debut: string;
  date_fin: string;
  statut: 'brouillon' | 'active' | 'cloturee' | string;
}

export interface SkillupSalon {
  canal_id: string;
  canal_nom: string;
  actif: boolean;
  wave_nom: string;
}

async function callSkillupProxy<T>(
  action: SkillupAction,
  params?: {
    semaine?: string;
    vague?: string;
    sessionId?: number;
    champ?: string;
    valeur?: string;
    membreDiscordId?: string;
    membreADiscordId?: string;
    membreBDiscordId?: string;
    nom?: string;
    profil?: string;
    certifOuProjet?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
    vagueId?: number;
    canalId?: string;
    canalNom?: string;
    actif?: string;
    lienOuId?: string;
  }
): Promise<T | SkillupLinkStatus> {
  if (!auth.currentUser) {
    throw new Error('Vous devez être connecté pour effectuer cette action');
  }

  const idToken = await getIdToken(auth.currentUser);
  const response = await fetch(SKILLUP_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // corps non-JSON, on garde statusText
    }
    throw new Error(detail);
  }

  return response.json();
}

/**
 * Vérifie si l'utilisateur connecté est participant et/ou admin de la vague SkillUp active.
 * Ne lève jamais d'erreur d'autorisation : renvoie { linked: false } si aucun discordId n'est lié.
 */
export const getSkillupAccess = (): Promise<SkillupAccess | SkillupLinkStatus> =>
  callSkillupProxy<SkillupAccess>('access');

/** Liste des vagues auxquelles l'utilisateur connecté a participé (la plus récente en premier). */
export const getSkillupVagues = (): Promise<{ vagues: SkillupVague[] } | SkillupLinkStatus> =>
  callSkillupProxy('vagues');

export const getSkillupJournal = (semaine?: string, vague?: string) =>
  callSkillupProxy('journal', { semaine, vague });

export const getSkillupBinomeJournal = (semaine?: string, vague?: string) =>
  callSkillupProxy('binomeJournal', { semaine, vague });

export const getSkillupBilan = (semaine?: string, vague?: string) =>
  callSkillupProxy('bilan', { semaine, vague });

export const getSkillupMembers = (vague?: string) =>
  callSkillupProxy('members', { vague });

/** Liste brute de tous les membres du serveur Discord (pas seulement ceux inscrits à une vague). */
export const getSkillupDiscordMembers = () =>
  callSkillupProxy<{ members: SkillupDiscordMember[] }>('discordMembers');

/** Liste les salons vocaux standards du serveur — sert à peupler le sélecteur "Rattacher un salon". */
export const getSkillupDiscordVoiceChannels = () =>
  callSkillupProxy<{ channels: SkillupDiscordVoiceChannel[] }>('discordVoiceChannels');

/**
 * Avatars Discord vérifiés (discordId -> discordAvatarUrl), pour l'onglet Binômes (admin).
 * Passe par la Cloud Function (admin SDK, vérifie is_admin auprès de l'API SkillUp) —
 * les règles Firestore ne connaissent pas la notion d'admin SkillUp, un accès direct
 * échouerait pour un admin SkillUp qui n'est pas admin CPS Connect.
 */
export const getSkillupDiscordAvatars = () =>
  callSkillupProxy<{ avatars: Record<string, string> }>('discordAvatars');

export const getSkillupSessions = (vague?: string, semaine?: string) =>
  callSkillupProxy('sessions', { vague, semaine });

export const getSkillupBinomes = (semaine?: string, vague?: string) =>
  callSkillupProxy('binomes', { semaine, vague });

/** Corrige un champ d'une session existante (admin uniquement, vérifié côté API SkillUp). */
export const patchSkillupSession = (sessionId: number, champ: SkillupSessionChamp, valeur: string) =>
  callSkillupProxy('sessionCorriger', { sessionId, champ, valeur });

/** Supprime une session (admin uniquement, vérifié côté API SkillUp). */
export const deleteSkillupSession = (sessionId: number) =>
  callSkillupProxy('sessionSupprimer', { sessionId });

/**
 * Définit un binôme (admin uniquement). Envoie un DM aux deux membres côté API —
 * `dm_echecs` liste les noms pour qui l'envoi a échoué (DMs fermés), sans bloquer l'action.
 */
export const defineSkillupBinome = (
  semaine: number,
  membreADiscordId: string,
  membreBDiscordId: string,
  vague?: string
) =>
  callSkillupProxy<SkillupBinomeAction>('binomeDefinir', {
    semaine: String(semaine),
    membreADiscordId,
    membreBDiscordId,
    vague,
  });

/** Dissout le binôme d'un membre pour une semaine donnée (admin uniquement). */
export const removeSkillupBinome = (semaine: number, membreDiscordId: string, vague?: string) =>
  callSkillupProxy<SkillupBinomeAction>('binomeRetirer', {
    semaine: String(semaine),
    membreDiscordId,
    vague,
  });

/**
 * Ajoute un membre à une vague (admin uniquement). Envoie un DM de bienvenue côté API —
 * `dm_ok` indique si l'envoi a réussi, sans bloquer la création si les DMs sont fermés.
 */
export const addSkillupMember = (
  discordId: string,
  nom: string,
  profil: SkillupProfil,
  certifOuProjet?: string,
  vague?: string
) =>
  callSkillupProxy<SkillupMembreAjouterResult>('membreAjouter', {
    membreDiscordId: discordId,
    nom,
    profil,
    certifOuProjet,
    vague,
  });

/** Édite un champ d'un membre existant (admin uniquement). */
export const editSkillupMember = (
  discordId: string,
  champ: SkillupMembreChamp,
  valeur: string,
  vague?: string
) =>
  callSkillupProxy<SkillupMemberEditResult>('membreEditer', {
    membreDiscordId: discordId,
    champ,
    valeur,
    vague,
  });

/** Liste toutes les vagues (pas seulement la vague active), filtrables par statut. */
export const getSkillupVaguesAdmin = (statut?: string) =>
  callSkillupProxy<{ vagues: SkillupVagueAdmin[] }>('vaguesAdminLister', { statut });

/** Crée une vague en brouillon (jamais activée automatiquement). `dateDebut`/`dateFin` au format AAAA-MM-JJ. */
export const createSkillupVague = (nom: string, dateDebut: string, dateFin: string) =>
  callSkillupProxy<SkillupVagueAdmin>('vagueCreer', { nom, dateDebut, dateFin });

/** Active une vague en brouillon (refuse si une autre vague est déjà active). */
export const activateSkillupVague = (vagueId: number) =>
  callSkillupProxy<SkillupVagueAdmin>('vagueActiver', { vagueId });

/** Clôture une vague (par défaut la vague active si `vagueId` omis). */
export const closeSkillupVague = (vagueId?: number) =>
  callSkillupProxy<SkillupVagueAdmin>('vagueCloturer', { vagueId });

/** Liste les salons de coworking. Sans `vague`, liste toutes les vagues. */
export const getSkillupSalons = (vague?: string, actif?: boolean) =>
  callSkillupProxy<{ salons: SkillupSalon[] }>('salonsLister', {
    vague,
    actif: actif ? 'true' : undefined,
  });

/** Ajoute (ou réactive) un salon de coworking pour une vague. */
export const addSkillupSalon = (canalId: string, canalNom: string, vague?: string) =>
  callSkillupProxy<SkillupSalon>('salonAjouter', { canalId, canalNom, vague });

/** Lit l'objectif de vague de l'appelant (vague active). */
export const getSkillupMyObjectif = () => callSkillupProxy<SkillupMemberEditResult>('objectifVagueLire');

/**
 * Définit/modifie l'objectif de vague de l'appelant. Ne synchronise pas le fil du forum
 * Discord `objectifs` — champ DB uniquement (cf. `/objectif-vague` sur Discord pour ça).
 */
export const setSkillupObjectifVague = (valeur: string) =>
  callSkillupProxy<SkillupMemberEditResult>('objectifVagueDefinir', { valeur });

/** Corrige une session appartenant à l'appelant (vérifie la propriété côté API). */
export const patchSkillupMySession = (sessionId: number, champ: SkillupSessionChamp, valeur: string) =>
  callSkillupProxy('sessionCorrigerSelf', { sessionId, champ, valeur });

/** Supprime une session appartenant à l'appelant. */
export const deleteSkillupMySession = (sessionId: number) =>
  callSkillupProxy('sessionSupprimerSelf', { sessionId });

/** Rattache manuellement le post objectif existant d'un membre (admin uniquement). */
export const linkSkillupMemberThread = (discordId: string, lienOuId: string, vague?: string) =>
  callSkillupProxy<SkillupMemberEditResult>('membreLierThread', { membreDiscordId: discordId, lienOuId, vague });

/** Désactive un salon de coworking (soft-delete, pas une suppression). */
export const removeSkillupSalon = (canalId: string, vague?: string) =>
  callSkillupProxy('salonRetirer', { canalId, vague });
