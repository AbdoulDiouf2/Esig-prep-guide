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
  | 'membreLierThread'
  | 'membreObjectifSync'
  | 'membresObjectifSyncAll'
  | 'sessionCreer'
  | 'bilanTexteSemaineSelf'
  | 'bilanInfoAdmin'
  | 'bilanVagueInfoAdmin'
  | 'bilansSemaineListerAdmin'
  | 'bilansVagueListerAdmin'
  | 'bilanSemaineLire'
  | 'bilanSemaineSuggerer'
  | 'bilanVagueSuggerer'
  | 'aiSettingsLire'
  | 'aiSettingsEcrire'
  | 'bilanSemaineEcrire'
  | 'bilanVagueLire'
  | 'bilanVagueEcrire';

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

export interface SkillupSessionCreerResult {
  id: number;
  date: string;
  creneau: string;
  statut: string;
  debut: string;
  fin: string | null;
  objectif: string;
  bilan: string | null;
  blocages: string | null;
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
  thread_objectif_id?: string | null;
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
    dateSession?: string;
    creneau?: string;
    heureDebut?: string;
    heureFin?: string;
    objectif?: string;
    bilan?: string;
    blocages?: string;
    poster?: string;
    enabled?: string;
    provider?: string;
    model?: string;
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

/** Bilan hebdomadaire rédigé à la main par l'admin pour l'appelant (self-service,
 * lecture seule) — distinct du résumé informatif `getSkillupBilan`. */
export const getSkillupBilanTexteSemaine = (semaine: string, vague?: string) =>
  callSkillupProxy<SkillupBilanTexte | null>('bilanTexteSemaineSelf', { semaine, vague });

export interface SkillupBilanInfo {
  nom: string;
  label: string;
  nb_sessions: number;
  nb_completes: number;
  nb_incompletes: number;
  duree_totale: string;
  blocages: string[];
}

/** Résumé informatif (nb sessions, durée, blocages) d'un AUTRE membre, à l'usage de
 * l'admin — sert de base "à copier" pour rédiger le bilan hebdo/vague, jamais
 * pré-rempli automatiquement dans le champ libre. */
export const getSkillupBilanInfoAdmin = (membreDiscordId: string, vague?: string, semaine?: string) =>
  callSkillupProxy<SkillupBilanInfo>('bilanInfoAdmin', { membreDiscordId, vague, semaine });

/** Résumé informatif agrégé sur TOUTE la vague (toutes semaines) — à ne pas confondre
 * avec getSkillupBilanInfoAdmin sans semaine, qui retombe sur la semaine courante. */
export const getSkillupBilanVagueInfoAdmin = (membreDiscordId: string, vague: string) =>
  callSkillupProxy<SkillupBilanInfo>('bilanVagueInfoAdmin', { membreDiscordId, vague });

export interface SkillupBilanTexte {
  texte: string;
  ecrit_par_discord_id: string;
  updated_at: string;
  poste_discord?: boolean | null;
}

export interface SkillupBilanMembre {
  discord_id: string;
  nom: string;
  texte: string | null;
  ecrit_par_discord_id: string | null;
  updated_at: string | null;
}

/** Vue d'ensemble admin : bilan hebdo de tous les membres de la vague pour une semaine
 * donnée (texte à null si pas encore rédigé). */
export const getSkillupBilansSemaineAdmin = (semaine: string, vague?: string) =>
  callSkillupProxy<{ wave_nom: string; semaine: number; bilans: SkillupBilanMembre[] }>(
    'bilansSemaineListerAdmin',
    { semaine, vague }
  );

/** Vue d'ensemble admin : bilan de vague de tous les membres (texte à null si pas
 * encore rédigé). */
export const getSkillupBilansVagueAdmin = (vague?: string) =>
  callSkillupProxy<{ wave_nom: string; bilans: SkillupBilanMembre[] }>('bilansVagueListerAdmin', { vague });

/** Bilan hebdomadaire rédigé à la main par l'admin pour un membre — distinct du
 * résumé informatif ci-dessus (non stocké, calculé à la volée). */
export const getSkillupBilanSemaine = (membreDiscordId: string, vague: string, semaine: string) =>
  callSkillupProxy<SkillupBilanTexte | null>('bilanSemaineLire', { membreDiscordId, vague, semaine });

export const setSkillupBilanSemaine = (
  membreDiscordId: string,
  vague: string,
  semaine: string,
  valeur: string,
  poster: boolean = true
) => callSkillupProxy<SkillupBilanTexte>('bilanSemaineEcrire', { membreDiscordId, vague, semaine, valeur, poster: String(poster) });

/** Bilan de synthèse de vague rédigé à la main par l'admin pour un membre. */
export const getSkillupBilanVague = (membreDiscordId: string, vague: string) =>
  callSkillupProxy<SkillupBilanTexte | null>('bilanVagueLire', { membreDiscordId, vague });

export const setSkillupBilanVague = (membreDiscordId: string, vague: string, valeur: string) =>
  callSkillupProxy<SkillupBilanTexte>('bilanVagueEcrire', { membreDiscordId, vague, valeur });

/** Génère un brouillon de bilan hebdomadaire via l'IA, à partir des sessions réelles
 * de la semaine — jamais sauvegardé automatiquement. */
export const getSkillupBilanSemaineSuggestion = (membreDiscordId: string, vague: string, semaine: string) =>
  callSkillupProxy<{ suggestion: string }>('bilanSemaineSuggerer', { membreDiscordId, vague, semaine });

/** Génère un brouillon de bilan de vague via l'IA, à partir des bilans hebdo déjà
 * rédigés et des sessions de toute la vague. */
export const getSkillupBilanVagueSuggestion = (membreDiscordId: string, vague: string) =>
  callSkillupProxy<{ suggestion: string }>('bilanVagueSuggerer', { membreDiscordId, vague });

export type SkillupAiProvider = 'anthropic' | 'groq';

export interface SkillupAiSettings {
  enabled: boolean;
  provider: SkillupAiProvider;
  model: string;
  updated_by_discord_id: string | null;
  updated_at: string | null;
}

export const getSkillupAiSettings = () => callSkillupProxy<SkillupAiSettings>('aiSettingsLire');

export const setSkillupAiSettings = (enabled: boolean, provider: SkillupAiProvider, model: string) =>
  callSkillupProxy<SkillupAiSettings>('aiSettingsEcrire', { enabled: String(enabled), provider, model });

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
 * Crée une session déjà clôturée pour un membre (admin uniquement) — rattrapage
 * pour couvrir une séance qui n'a pas pu être saisie par le membre lui-même
 * (ex. avant l'arrivée du bot sur le serveur).
 */
export const createSkillupSession = (
  discordId: string,
  dateSession: string,
  creneau: string,
  heureDebut: string,
  heureFin?: string,
  objectif?: string,
  bilan?: string,
  canalId?: string,
  canalNom?: string,
  blocages?: string,
  vague?: string
) =>
  callSkillupProxy<SkillupSessionCreerResult>('sessionCreer', {
    membreDiscordId: discordId,
    dateSession,
    creneau,
    heureDebut,
    heureFin,
    objectif,
    bilan,
    canalId,
    canalNom,
    blocages,
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

/** Récupère le contenu réel du post objectif Discord déjà rattaché et l'écrit dans
 * objectif_vague — pour les membres dont le post existait avant l'automatisation. */
export const syncSkillupMemberObjectif = (discordId: string, vague?: string) =>
  callSkillupProxy<SkillupMemberEditResult>('membreObjectifSync', { membreDiscordId: discordId, vague });

export interface SkillupObjectifSyncResult {
  discord_id: string;
  nom: string;
  ok: boolean;
  message: string;
}

/** Synchronise en masse l'objectif de vague de tous les membres ayant un post
 * objectif rattaché — un échec individuel n'interrompt pas les suivants. */
export const syncSkillupMembersObjectifAll = (vague?: string) =>
  callSkillupProxy<{ resultats: SkillupObjectifSyncResult[] }>('membresObjectifSyncAll', { vague });

/** Désactive un salon de coworking (soft-delete, pas une suppression). */
export const removeSkillupSalon = (canalId: string, vague?: string) =>
  callSkillupProxy('salonRetirer', { canalId, vague });
