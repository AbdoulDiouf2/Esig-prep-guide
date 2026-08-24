import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs } from 'antd';
import { Column, Bar, Pie } from '@ant-design/plots';
import { RefreshCw, Zap, Users, AlertCircle, ChevronLeft, ChevronRight, Pencil, Trash2, X, Download, Link2, Clock, Copy, Check } from 'lucide-react';
import { exportTablesToCSV, exportTablesToPDF, type ExportTable } from '../utils/tableExport';
import {
  getSkillupAccess,
  getSkillupJournal,
  getSkillupBinomeJournal,
  getSkillupBilan,
  getSkillupMembers,
  getSkillupSessions,
  getSkillupBinomes,
  patchSkillupSession,
  deleteSkillupSession,
  defineSkillupBinome,
  removeSkillupBinome,
  addSkillupMember,
  createSkillupSession,
  editSkillupMember,
  getSkillupDiscordMembers,
  getSkillupVaguesAdmin,
  createSkillupVague,
  activateSkillupVague,
  closeSkillupVague,
  getSkillupSalons,
  addSkillupSalon,
  removeSkillupSalon,
  getSkillupDiscordVoiceChannels,
  getSkillupDiscordAvatars,
  getSkillupMyObjectif,
  setSkillupObjectifVague,
  patchSkillupMySession,
  deleteSkillupMySession,
  linkSkillupMemberThread,
  syncSkillupMemberObjectif,
  syncSkillupMembersObjectifAll,
  getSkillupBilanTexteSemaine,
  getSkillupBilansSemaineAdmin,
  getSkillupBilanInfoAdmin,
  getSkillupBilanSemaine,
  setSkillupBilanSemaine,
  getSkillupBilanVague,
  setSkillupBilanVague,
  type SkillupAccess,
  type SkillupSessionChamp,
  type SkillupMembreChamp,
  type SkillupProfil,
  type SkillupDiscordMember,
  type SkillupVagueAdmin,
  type SkillupSalon,
  type SkillupDiscordVoiceChannel,
  type SkillupBilanInfo,
  type SkillupBilanTexte,
  type SkillupBilanMembre,
  type SkillupObjectifSyncResult,
} from '../services/skillupService';

interface SkillupSession {
  id: number;
  date: string;
  creneau: string;
  statut: 'complète' | 'incomplète' | string;
  debut?: string;
  fin?: string | null;
  objectif: string | null;
  bilan: string | null;
  blocages: string | null;
  canal_nom?: string | null;
  membre_nom?: string;
}

interface SkillupMember {
  id: number;
  discord_id: string;
  nom: string;
  profil: string;
  certif_ou_projet: string | null;
  objectif_vague?: string | null;
  thread_objectif_id?: string | null;
}

const SKILLUP_PROFILS: SkillupProfil[] = ['étudiant', "demandeur d'emploi", 'cadre', 'alternant', 'autre'];
const SKILLUP_CRENEAUX = ['5h-7h', '19h-21h', '21h-23h'];
// Tri numérique par heure de début — un tri alphabétique classerait "19h-21h" avant
// "5h-7h" (comparaison de chaînes), ce qui n'a aucun sens pour des horaires.
const sortCreneaux = (creneaux: string[]) =>
  [...creneaux].sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));

// Couleurs fixes pour les statuts connus du donut "Répartition par statut" — tout statut
// inattendu (fallback géré au niveau de l'appel) reste visible en gris plutôt que de casser
// le rendu (l'ancienne version codait un tableau de 2 couleurs en dur, invalide dès qu'un
// 3e statut comme 'ouverte' apparaissait dans les données).
const STATUT_COLORS: Record<string, string> = {
  'complète': '#16a34a',
  'incomplète': '#d97706',
  'ouverte': '#94a3b8',
};


interface SkillupBinome {
  membre_a: number;
  nom_a: string;
  membre_b: number;
  nom_b: string;
}

interface SkillupBilan {
  nom: string;
  label: string;
  nb_sessions: number;
  nb_completes: number;
  nb_incompletes: number;
  duree_totale: string;
  blocages: string[];
}

// L'API SkillUp renvoie soit un tableau brut, soit un objet wrapper contenant la liste
// sous une clé nommée (ex: { wave_id, wave_nom, membres: [...] }).
const extractList = <T,>(value: unknown, key: string): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>)[key])) {
    return (value as Record<string, T[]>)[key];
  }
  return [];
};

const isLinked = (value: unknown): value is SkillupAccess =>
  typeof value === 'object' && value !== null && 'is_participant' in value;

// Message d'erreur d'un appel individuel, extrait proprement (Error standard ou throw brut).
const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Erreur inconnue';

// Le bilan renvoie un label du type "vague Vague Août 2026, semaine 2" : on en extrait
// le numéro de semaine pour savoir où on se situe et pouvoir naviguer dans l'historique.
const parseWeekNumber = (label: string | undefined): number | null => {
  const match = label?.match(/semaine\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
};

// Même label : "vague Vague Août 2026, semaine 2" -> "Vague Août 2026".
const parseVagueName = (label: string | undefined): string | null => {
  const match = label?.match(/vague\s+(.+?),\s*semaine/i);
  return match ? match[1].trim() : null;
};

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-indigo-600',
];

const avatarColor = (seed: number): string => AVATAR_COLORS[seed % AVATAR_COLORS.length];

// Même format que `duree_totale` calculé côté API (bot/services/journal_service.summarize_sessions) : "Xh mm".
const formatDuration = (totalSeconds: number): string => {
  const heures = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${heures}h${String(minutes).padStart(2, '0')}`;
};

// Sans le jour de la semaine — utilisée pour les axes de graphique, plus courte que formatDate.
const formatShortDate = (isoDate: string): string => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const formatDate = (isoDate: string): string => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
};

const StatutBadge: React.FC<{ statut: string }> = ({ statut }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
      statut === 'complète'
        ? 'bg-green-100 text-green-800'
        : statut === 'incomplète'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-gray-100 text-gray-800'
    }`}
  >
    {statut}
  </span>
);

const TruncatedText: React.FC<{ value: string | null }> = ({ value }) => {
  const [expanded, setExpanded] = useState(false);
  if (!value) return <span className="text-zinc-400">—</span>;
  const isLong = value.length > 120;
  return (
    <div className="max-w-xs">
      <p className={`text-sm text-zinc-700 whitespace-pre-line ${!expanded && isLong ? 'line-clamp-2' : ''}`}>{value}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-blue-700 hover:text-blue-900 mt-1"
        >
          {expanded ? 'Réduire' : 'Voir plus'}
        </button>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-center py-10 text-sm text-zinc-500">{label}</div>
);

const bilanInfoToText = (info: SkillupBilanInfo): string => {
  const lignes = [
    `${info.nb_sessions} session(s) — ${info.nb_completes} complète(s), ${info.nb_incompletes} incomplète(s) — durée totale ${info.duree_totale}`,
  ];
  if (info.blocages.length > 0) lignes.push(`Blocages : ${info.blocages.join(' ; ')}`);
  return lignes.join('\n');
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1 rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
      aria-label="Copier"
      title="Copier"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

const SessionsTable: React.FC<{
  sessions: SkillupSession[];
  withMember: boolean;
  emptyLabel: string;
  onEdit?: (session: SkillupSession) => void;
  onDelete?: (session: SkillupSession) => void;
}> = ({ sessions, withMember, emptyLabel, onEdit, onDelete }) => {
  if (sessions.length === 0) return <EmptyState label={emptyLabel} />;
  const editable = Boolean(onEdit || onDelete);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
            {withMember && (
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Membre</th>
            )}
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Statut</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Salon</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Objectif</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Bilan</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Blocages</th>
            {editable && (
              <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-zinc-200">
          {sessions.map((session) => (
            <tr key={session.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3 whitespace-nowrap align-top">
                <div className="text-sm font-medium text-zinc-900">{formatDate(session.date)}</div>
                <div className="text-xs text-zinc-500">{session.creneau}</div>
              </td>
              {withMember && (
                <td className="px-4 py-3 whitespace-nowrap align-top text-sm text-zinc-700">{session.membre_nom}</td>
              )}
              <td className="px-4 py-3 whitespace-nowrap align-top">
                <StatutBadge statut={session.statut} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap align-top text-sm text-zinc-600">
                {session.canal_nom || <span className="text-zinc-400">—</span>}
              </td>
              <td className="px-4 py-3 align-top"><TruncatedText value={session.objectif} /></td>
              <td className="px-4 py-3 align-top"><TruncatedText value={session.bilan} /></td>
              <td className="px-4 py-3 align-top"><TruncatedText value={session.blocages} /></td>
              {editable && (
                <td className="px-4 py-3 whitespace-nowrap align-top text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(session)}
                        className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-blue-700 transition-colors"
                        aria-label={`Corriger la session ${session.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(session)}
                        className="p-1.5 rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label={`Supprimer la session ${session.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Bouton "Exporter" générique — dropdown CSV/PDF, respecte les données déjà filtrées passées en `tables`. */
const ExportButtons: React.FC<{
  tables: ExportTable[];
  filenamePrefix: string;
  pdfTitle: string;
  pdfSubtitle?: string;
  disabled?: boolean;
}> = ({ tables, filenamePrefix, pdfTitle, pdfSubtitle, disabled }) => {
  const [open, setOpen] = useState(false);
  const isEmpty = tables.every((t) => t.rows.length === 0);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled || isEmpty}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="w-3.5 h-3.5" /> Exporter
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-32 bg-white border border-zinc-200 rounded-md shadow-lg z-10 overflow-hidden">
          <button
            type="button"
            onClick={() => { exportTablesToCSV(`${filenamePrefix}.csv`, tables); setOpen(false); }}
            className="block w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => { exportTablesToPDF(`${filenamePrefix}.pdf`, pdfTitle, pdfSubtitle ?? '', tables); setOpen(false); }}
            className="block w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            PDF
          </button>
        </div>
      )}
    </div>
  );
};

const SkillUp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'participant' | 'admin'>('participant');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [access, setAccess] = useState<SkillupAccess | null>(null);
  // Distingue "compte pas éligible" (pas de discordId lié) d'une vraie panne réseau/API,
  // pour ne pas afficher un message d'inéligibilité trompeur quand l'appel a juste échoué.
  const [linked, setLinked] = useState(true);
  const [accessFailed, setAccessFailed] = useState(false);

  const [journal, setJournal] = useState<SkillupSession[]>([]);
  const [journalError, setJournalError] = useState('');
  const [binomeJournal, setBinomeJournal] = useState<SkillupSession[]>([]);
  const [binomeJournalError, setBinomeJournalError] = useState('');
  const [binomePartnerName, setBinomePartnerName] = useState<string | null>(null);
  const [binomePartnerDiscordId, setBinomePartnerDiscordId] = useState<string | null>(null);
  const [bilan, setBilan] = useState<SkillupBilan | null>(null);
  const [bilanError, setBilanError] = useState('');
  // Bilan rédigé à la main par l'admin pour la semaine affichée — distinct du résumé
  // informatif ci-dessus, chargé une fois la semaine résolue (currentSemaineNumber ou
  // semaine explicitement filtrée).
  const [bilanTexteSemaine, setBilanTexteSemaine] = useState<SkillupBilanTexte | null>(null);
  const [bilanTexteSemaineLoading, setBilanTexteSemaineLoading] = useState(false);
  const [bilanTexteSemaineError, setBilanTexteSemaineError] = useState('');

  const [members, setMembers] = useState<SkillupMember[]>([]);
  const [membersError, setMembersError] = useState('');
  const [discordAvatars, setDiscordAvatars] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<SkillupSession[]>([]);
  const [sessionsError, setSessionsError] = useState('');

  // Filtres tableau Sessions — purement client-side (la semaine est déjà filtrée côté API).
  const [sessionsFilterMembre, setSessionsFilterMembre] = useState('');
  const [sessionsFilterSalon, setSessionsFilterSalon] = useState('');
  const [sessionsFilterDate, setSessionsFilterDate] = useState('');
  const [sessionsFilterCreneau, setSessionsFilterCreneau] = useState('');
  const [sessionsFilterStatut, setSessionsFilterStatut] = useState('');

  const sessionsFiltered = useMemo(() => {
    return sessions.filter((s) => {
      if (sessionsFilterMembre && s.membre_nom !== sessionsFilterMembre) return false;
      if (sessionsFilterSalon && s.canal_nom !== sessionsFilterSalon) return false;
      if (sessionsFilterDate && s.date !== sessionsFilterDate) return false;
      if (sessionsFilterCreneau && s.creneau !== sessionsFilterCreneau) return false;
      if (sessionsFilterStatut && s.statut !== sessionsFilterStatut) return false;
      return true;
    });
  }, [sessions, sessionsFilterMembre, sessionsFilterSalon, sessionsFilterDate, sessionsFilterCreneau, sessionsFilterStatut]);

  // Options des menus déroulants — dérivées des sessions actuellement chargées (semaine/vague).
  const sessionsMembresOptions = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.membre_nom).filter((v): v is string => Boolean(v)))).sort(),
    [sessions]
  );
  const sessionsSalonsOptions = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.canal_nom).filter((v): v is string => Boolean(v)))).sort(),
    [sessions]
  );
  const sessionsCreneauxOptions = useMemo(
    () => sortCreneaux(Array.from(new Set(sessions.map((s) => s.creneau).filter((v): v is string => Boolean(v))))),
    [sessions]
  );
  const sessionsStatutsOptions = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.statut).filter((v): v is string => Boolean(v)))).sort(),
    [sessions]
  );
  const [binomes, setBinomes] = useState<SkillupBinome[]>([]);
  const [binomesError, setBinomesError] = useState('');
  const [binomesSemaine, setBinomesSemaine] = useState<number | null>(null);

  const [editingSession, setEditingSession] = useState<SkillupSession | null>(null);
  const [editSessionForm, setEditSessionForm] = useState({ objectif: '', bilan: '', blocages: '', creneau: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  // 'admin' = onglet Sessions (Vue admin, aucune vérif de propriétaire) ; 'self' = carte
  // "Journal de la semaine" (Ma vague, l'appelant ne peut corriger que ses propres sessions).
  const [editSessionScope, setEditSessionScope] = useState<'admin' | 'self'>('admin');

  // Retourne la semaine résolue par l'API (utile côté appelant : /sessions, contrairement à
  // /binomes, ne résout pas de "semaine courante" par défaut — il faut la lui passer explicitement).
  const reloadBinomes = useCallback(async (semaine?: number, vague?: number): Promise<number | null> => {
    setBinomesLoading(true);
    try {
      const res = await getSkillupBinomes(
        semaine !== undefined ? String(semaine) : undefined,
        vague !== undefined ? String(vague) : undefined
      );
      setBinomes(extractList<SkillupBinome>(res, 'binomes'));
      const resolvedSemaine =
        res && typeof res === 'object' && 'semaine' in res ? (res as { semaine: number }).semaine : null;
      setBinomesSemaine(resolvedSemaine);
      setBinomesError('');
      return resolvedSemaine;
    } catch (err) {
      setBinomes([]);
      setBinomesError(errorMessage(err));
      return null;
    } finally {
      setBinomesLoading(false);
    }
  }, []);

  const [definingBinome, setDefiningBinome] = useState(false);
  const [defineSemaine, setDefineSemaine] = useState('');
  const [defineMembreA, setDefineMembreA] = useState('');
  const [defineMembreB, setDefineMembreB] = useState('');
  const [defineSaving, setDefineSaving] = useState(false);
  const [defineError, setDefineError] = useState('');
  const [defineSuccess, setDefineSuccess] = useState<{
    semaine: number;
    nomA: string;
    nomB: string;
    dmEchecs: string[];
  } | null>(null);
  // Binômes déjà existants pour la semaine tapée dans la modale — recalculés à chaque
  // changement de semaine pour désactiver les membres déjà associés (évite un refus API).
  const [defineSemaineBinomes, setDefineSemaineBinomes] = useState<SkillupBinome[]>([]);
  const [defineSemaineLoading, setDefineSemaineLoading] = useState(false);

  const [removingBinome, setRemovingBinome] = useState<SkillupBinome | null>(null);
  const [removeSaving, setRemoveSaving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  const [deletingSession, setDeletingSession] = useState<SkillupSession | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSessionScope, setDeleteSessionScope] = useState<'admin' | 'self'>('admin');

  const openEdit = useCallback((session: SkillupSession, scope: 'admin' | 'self' = 'admin') => {
    setEditingSession(session);
    setEditSessionScope(scope);
    setEditSessionForm({
      objectif: session.objectif || '',
      bilan: session.bilan || '',
      blocages: session.blocages || '',
      creneau: session.creneau || '',
    });
    setEditError('');
  }, []);

  const openDeleteSession = useCallback((session: SkillupSession, scope: 'admin' | 'self' = 'admin') => {
    setDeletingSession(session);
    setDeleteSessionScope(scope);
    setDeleteError('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingSession) return;
    const champs: SkillupSessionChamp[] = ['objectif', 'bilan', 'blocages', 'creneau'];
    const changed = champs.filter((c) => editSessionForm[c] !== (editingSession[c] || ''));
    if (changed.length === 0) {
      setEditingSession(null);
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      for (const champ of changed) {
        if (editSessionScope === 'self') {
          await patchSkillupMySession(editingSession.id, champ, editSessionForm[champ]);
        } else {
          await patchSkillupSession(editingSession.id, champ, editSessionForm[champ]);
        }
      }
      const updater = (s: SkillupSession) => (s.id === editingSession.id ? { ...s, ...editSessionForm } : s);
      if (editSessionScope === 'self') setJournal((prev) => prev.map(updater));
      else setSessions((prev) => prev.map(updater));
      setEditingSession(null);
    } catch (err) {
      setEditError(errorMessage(err));
    } finally {
      setEditSaving(false);
    }
  }, [editingSession, editSessionForm, editSessionScope]);

  useEffect(() => {
    if (!editingSession) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingSession(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingSession]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingSession) return;
    setDeleteSaving(true);
    setDeleteError('');
    try {
      if (deleteSessionScope === 'self') {
        await deleteSkillupMySession(deletingSession.id);
        setJournal((prev) => prev.filter((s) => s.id !== deletingSession.id));
      } else {
        await deleteSkillupSession(deletingSession.id);
        setSessions((prev) => prev.filter((s) => s.id !== deletingSession.id));
      }
      setDeletingSession(null);
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setDeleteSaving(false);
    }
  }, [deletingSession, deleteSessionScope]);

  useEffect(() => {
    if (!definingBinome || !defineSemaine) {
      setDefineSemaineBinomes([]);
      return;
    }
    let cancelled = false;
    setDefineSemaineLoading(true);
    getSkillupBinomes(defineSemaine)
      .then((res) => {
        if (!cancelled) setDefineSemaineBinomes(extractList<SkillupBinome>(res, 'binomes'));
      })
      .catch(() => {
        if (!cancelled) setDefineSemaineBinomes([]);
      })
      .finally(() => {
        if (!cancelled) setDefineSemaineLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [definingBinome, defineSemaine]);

  const pairedMemberIds = useMemo(() => {
    const ids = new Set<number>();
    defineSemaineBinomes.forEach((b) => {
      ids.add(b.membre_a);
      ids.add(b.membre_b);
    });
    return ids;
  }, [defineSemaineBinomes]);

  const openDefineBinome = useCallback(() => {
    setDefiningBinome(true);
    setDefineSemaine(binomesSemaine !== null ? String(binomesSemaine) : '');
    setDefineMembreA('');
    setDefineMembreB('');
    setDefineError('');
    setDefineSuccess(null);
  }, [binomesSemaine]);

  const handleDefineBinome = useCallback(async () => {
    const semaineNum = Number(defineSemaine);
    if (!semaineNum || !defineMembreA || !defineMembreB) {
      setDefineError('Renseigne la semaine et les deux membres.');
      return;
    }
    if (defineMembreA === defineMembreB) {
      setDefineError('Choisis deux membres différents.');
      return;
    }
    setDefineSaving(true);
    setDefineError('');
    try {
      const result = await defineSkillupBinome(semaineNum, defineMembreA, defineMembreB);
      await reloadBinomes(semaineNum);
      setDefineSuccess({
        semaine: semaineNum,
        nomA: members.find((m) => m.discord_id === defineMembreA)?.nom || defineMembreA,
        nomB: members.find((m) => m.discord_id === defineMembreB)?.nom || defineMembreB,
        dmEchecs: 'dm_echecs' in result ? result.dm_echecs : [],
      });
    } catch (err) {
      setDefineError(errorMessage(err));
    } finally {
      setDefineSaving(false);
    }
  }, [defineSemaine, defineMembreA, defineMembreB, members, reloadBinomes]);

  const handleConfirmRemoveBinome = useCallback(async () => {
    if (!removingBinome || binomesSemaine === null) return;
    const discordIdA = members.find((m) => m.id === removingBinome.membre_a)?.discord_id;
    if (!discordIdA) {
      setRemoveError("Impossible de retrouver l'ID Discord de ce membre.");
      return;
    }
    setRemoveSaving(true);
    setRemoveError('');
    try {
      const result = await removeSkillupBinome(binomesSemaine, discordIdA);
      if ('dm_echecs' in result && result.dm_echecs.length > 0) {
        setBinomesError(`Binôme retiré. DM non délivré à : ${result.dm_echecs.join(', ')}.`);
      }
      await reloadBinomes(binomesSemaine);
      setRemovingBinome(null);
    } catch (err) {
      setRemoveError(errorMessage(err));
    } finally {
      setRemoveSaving(false);
    }
  }, [removingBinome, binomesSemaine, members, reloadBinomes]);

  // null = semaine/vague courante (comportement par défaut, aucun paramètre envoyé à l'API).
  const [selectedSemaine, setSelectedSemaine] = useState<number | null>(null);
  const [currentSemaineNumber, setCurrentSemaineNumber] = useState<number | null>(null);
  const [vagueName, setVagueName] = useState<string | null>(null);
  // Liste complète des vagues du système (GET /vagues, migrée depuis /members/{discord_id}/vagues
  // qui ne renvoyait que les vagues auxquelles l'appelant avait personnellement participé) —
  // source unique pour les deux sélecteurs "Ma vague" (participant) et "Vue admin" (partagé
  // Membres/Sessions/Binômes/Dashboard). `brouillon` exclue : jamais sélectionnable (aucun
  // membre ne peut y être rattaché).
  const [vagues, setVagues] = useState<SkillupVagueAdmin[]>([]);
  const [selectedVague, setSelectedVague] = useState<number | null>(null);
  const [participantLoading, setParticipantLoading] = useState(false);

  // Vague partagée par tout l'onglet "Vue admin" (Dashboard/Membres/Sessions/Binômes).
  // La semaine, elle, est propre à chaque sous-onglet Sessions/Binômes (cf. sessionsSelectedSemaine
  // / binomesSelectedSemaine plus bas) — Dashboard et Membres n'en ont pas besoin.
  const [adminSelectedVague, setAdminSelectedVague] = useState<number | null>(null);
  const [adminActiveSubTab, setAdminActiveSubTab] = useState('dashboard');

  // Référence "semaine courante" de la vague sélectionnée, résolue une fois via /binomes
  // (seul endpoint qui la calcule) et partagée comme borne de navigation par les deux
  // sélecteurs Sessions/Binômes, même si leurs données affichées sont chargées séparément.
  const [adminCurrentSemaineNumber, setAdminCurrentSemaineNumber] = useState<number | null>(null);

  const [membersLoading, setMembersLoading] = useState(false);

  // "Tous les membres du serveur" — chargé à la demande (pas au montage), croisé avec
  // `members` (vague active) par discord_id pour repérer qui n'est pas encore inscrit.
  const [membersViewMode, setMembersViewMode] = useState<'vague' | 'serveur'>('vague');
  const [discordMembers, setDiscordMembers] = useState<SkillupDiscordMember[]>([]);
  const [discordMembersLoaded, setDiscordMembersLoaded] = useState(false);
  const [discordMembersLoading, setDiscordMembersLoading] = useState(false);
  const [discordMembersError, setDiscordMembersError] = useState('');

  // Sessions "toutes semaines" de la vague — source du Dashboard (stats + graphiques).
  const [allSessions, setAllSessions] = useState<SkillupSession[]>([]);
  const [allSessionsError, setAllSessionsError] = useState('');
  const [allSessionsLoading, setAllSessionsLoading] = useState(false);

  // Tous les créneaux déjà vus en base (toutes vagues/semaines chargées) + les créneaux
  // standards — le rattrapage doit pouvoir réutiliser un créneau historique hors liste
  // fixe (ex. "17h-19h") sans forcer une saisie manuelle à chaque fois.
  const createSessionCreneauOptions = useMemo(
    () =>
      sortCreneaux(
        Array.from(
          new Set([
            ...SKILLUP_CRENEAUX,
            ...allSessions.map((s) => s.creneau),
            ...sessions.map((s) => s.creneau),
          ].filter((v): v is string => Boolean(v)))
        )
      ),
    [allSessions, sessions]
  );

  const [sessionsSelectedSemaine, setSessionsSelectedSemaine] = useState<number | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [binomesSelectedSemaine, setBinomesSelectedSemaine] = useState<number | null>(null);
  const [binomesLoading, setBinomesLoading] = useState(false);

  // Objectif de vague — indépendant de la navigation semaine/vague de "Ma vague" (l'API
  // ne le résout que sur la vague active, même règle que /objectif-vague sur Discord).
  const [myObjectif, setMyObjectif] = useState<string | null>(null);
  const [myObjectifLoading, setMyObjectifLoading] = useState(false);
  const [myObjectifError, setMyObjectifError] = useState('');
  const [editingObjectif, setEditingObjectif] = useState(false);
  const [objectifValeur, setObjectifValeur] = useState('');
  const [objectifSaving, setObjectifSaving] = useState(false);
  const [objectifError, setObjectifError] = useState('');

  const loadMyObjectif = useCallback(async () => {
    setMyObjectifLoading(true);
    try {
      const res = await getSkillupMyObjectif();
      setMyObjectif('objectif_vague' in res ? res.objectif_vague ?? null : null);
      setMyObjectifError('');
    } catch (err) {
      setMyObjectif(null);
      setMyObjectifError(errorMessage(err));
    } finally {
      setMyObjectifLoading(false);
    }
  }, []);

  const openEditObjectif = useCallback(() => {
    setObjectifValeur(myObjectif ?? '');
    setObjectifError('');
    setEditingObjectif(true);
  }, [myObjectif]);

  const handleSaveObjectif = useCallback(async () => {
    setObjectifSaving(true);
    setObjectifError('');
    try {
      const res = await setSkillupObjectifVague(objectifValeur);
      setMyObjectif('objectif_vague' in res ? res.objectif_vague ?? objectifValeur : objectifValeur);
      setEditingObjectif(false);
    } catch (err) {
      setObjectifError(errorMessage(err));
    } finally {
      setObjectifSaving(false);
    }
  }, [objectifValeur]);

  const loadParticipant = useCallback(async (semaine?: number, vague?: number) => {
    setParticipantLoading(true);
    const semaineParam = semaine !== undefined ? String(semaine) : undefined;
    const vagueParam = vague !== undefined ? String(vague) : undefined;
    const [journalRes, binomeRes, bilanRes] = await Promise.allSettled([
      getSkillupJournal(semaineParam, vagueParam),
      getSkillupBinomeJournal(semaineParam, vagueParam),
      getSkillupBilan(semaineParam, vagueParam),
    ]);

    if (journalRes.status === 'fulfilled') {
      setJournal(extractList<SkillupSession>(journalRes.value, 'sessions'));
      setJournalError('');
    } else {
      setJournal([]);
      setJournalError(errorMessage(journalRes.reason));
    }

    if (binomeRes.status === 'fulfilled') {
      setBinomeJournal(extractList<SkillupSession>(binomeRes.value, 'sessions'));
      setBinomeJournalError('');
      const isBinomeShape = (v: unknown): v is { partenaire_nom: string; partenaire_discord_id?: string } =>
        Boolean(v && typeof v === 'object' && 'partenaire_nom' in v);
      const partenaire = isBinomeShape(binomeRes.value) ? binomeRes.value.partenaire_nom : null;
      const partenaireId = isBinomeShape(binomeRes.value) ? binomeRes.value.partenaire_discord_id ?? null : null;
      setBinomePartnerName(partenaire);
      setBinomePartnerDiscordId(partenaireId);
    } else {
      setBinomeJournal([]);
      setBinomeJournalError(errorMessage(binomeRes.reason));
      // Pas de binôme cette semaine (ou erreur) : pas de partenaire à afficher.
      setBinomePartnerName(null);
      setBinomePartnerDiscordId(null);
    }

    if (bilanRes.status === 'fulfilled') {
      const bilanValue = bilanRes.value as SkillupBilan;
      setBilan(bilanValue);
      setBilanError('');
      // Le nom de vague vient d'abord de /vagues (fiable) ; le label du bilan sert de repli.
      setVagueName((current) => current ?? parseVagueName(bilanValue?.label));
      // On ne fixe la semaine de référence (pour la navigation ◀ ▶) qu'au chargement par défaut
      // (sans paramètre `semaine`) : elle représente la dernière semaine connue de la vague affichée,
      // qu'il s'agisse de la vague active ou d'une vague passée.
      if (semaine === undefined) {
        setCurrentSemaineNumber(parseWeekNumber(bilanValue?.label));
      }
    } else {
      setBilan(null);
      setBilanError(errorMessage(bilanRes.reason));
    }

    // Bilan hebdo rédigé par l'admin — chargé séparément une fois la semaine résolue
    // (soit passée explicitement, soit déduite du label du résumé informatif ci-dessus).
    const resolvedSemaine = semaine ?? (bilanRes.status === 'fulfilled' ? parseWeekNumber((bilanRes.value as SkillupBilan)?.label) : null);
    if (resolvedSemaine !== null) {
      setBilanTexteSemaineLoading(true);
      try {
        const texte = await getSkillupBilanTexteSemaine(String(resolvedSemaine), vagueParam);
        setBilanTexteSemaine(texte ?? null);
        setBilanTexteSemaineError('');
      } catch (err) {
        setBilanTexteSemaine(null);
        setBilanTexteSemaineError(errorMessage(err));
      } finally {
        setBilanTexteSemaineLoading(false);
      }
    } else {
      setBilanTexteSemaine(null);
    }

    setParticipantLoading(false);
  }, []);

  // On ne transmet le paramètre `vague` que si la vague choisie n'est pas la vague active
  // par défaut (comportement existant : absent = vague active, cf. spec API).
  const vagueParamFor = useCallback(
    (vagueId: number | null) => {
      if (vagueId === null) return undefined;
      const active = vagues.find((v) => v.statut === 'active');
      return active && active.id === vagueId ? undefined : vagueId;
    },
    [vagues]
  );

  const goToWeek = useCallback(
    (target: number) => {
      if (target < 1) return;
      const vagueArg = vagueParamFor(selectedVague);
      if (currentSemaineNumber !== null && vagueArg === undefined && target >= currentSemaineNumber) {
        setSelectedSemaine(null);
        loadParticipant(undefined, vagueArg);
      } else {
        setSelectedSemaine(target);
        loadParticipant(target, vagueArg);
      }
    },
    [currentSemaineNumber, selectedVague, vagueParamFor, loadParticipant]
  );

  const goToVague = useCallback(
    (vagueId: number) => {
      setSelectedVague(vagueId);
      setSelectedSemaine(null);
      setCurrentSemaineNumber(null);
      const vagueInfo = vagues.find((v) => v.id === vagueId);
      setVagueName(vagueInfo?.nom ?? null);
      loadParticipant(undefined, vagueParamFor(vagueId));
    },
    [vagues, vagueParamFor, loadParticipant]
  );

  const loadMembers = useCallback(async (vague?: number) => {
    setMembersLoading(true);
    try {
      const res = await getSkillupMembers(vague !== undefined ? String(vague) : undefined);
      setMembers(extractList<SkillupMember>(res, 'membres'));
      setMembersError('');
    } catch (err) {
      setMembers([]);
      setMembersError(errorMessage(err));
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const loadDiscordMembers = useCallback(async () => {
    setDiscordMembersLoading(true);
    try {
      const res = await getSkillupDiscordMembers();
      setDiscordMembers('members' in res ? res.members : []);
      setDiscordMembersError('');
    } catch (err) {
      setDiscordMembers([]);
      setDiscordMembersError(errorMessage(err));
    } finally {
      setDiscordMembersLoading(false);
      setDiscordMembersLoaded(true);
    }
  }, []);

  const handleShowServerMembers = useCallback(() => {
    setMembersViewMode('serveur');
    if (!discordMembersLoaded) loadDiscordMembers();
  }, [discordMembersLoaded, loadDiscordMembers]);

  // discord_id des membres déjà inscrits à la vague sélectionnée — pour marquer, côté vue
  // "serveur", qui est présent sur Discord mais pas encore inscrit.
  const vagueDiscordIds = useMemo(() => new Set(members.map((m) => m.discord_id)), [members]);

  // Sous-onglet "Vagues" — gestion des vagues (créer/activer/clôturer) et des salons de
  // coworking, chargés à la demande au premier affichage du sous-onglet (usage rare).
  const [vaguesAdminList, setVaguesAdminList] = useState<SkillupVagueAdmin[]>([]);
  const [vaguesAdminLoaded, setVaguesAdminLoaded] = useState(false);
  const [vaguesAdminLoading, setVaguesAdminLoading] = useState(false);
  const [vaguesAdminError, setVaguesAdminError] = useState('');

  const [salonsList, setSalonsList] = useState<SkillupSalon[]>([]);
  const [salonsLoading, setSalonsLoading] = useState(false);
  const [salonsError, setSalonsError] = useState('');

  // canal_id déjà rattachés (actifs) à la vague active — "Rattacher un salon" cible toujours
  // la vague active par défaut, donc on exclut ceux-là du sélecteur pour éviter un doublon.
  const activeVagueLinkedCanalIds = useMemo(() => {
    const activeVagueNom = vaguesAdminList.find((v) => v.statut === 'active')?.nom;
    if (!activeVagueNom) return new Set<string>();
    return new Set(
      salonsList.filter((s) => s.actif && s.wave_nom === activeVagueNom).map((s) => s.canal_id)
    );
  }, [salonsList, vaguesAdminList]);

  const loadVaguesAdmin = useCallback(async () => {
    setVaguesAdminLoading(true);
    try {
      const res = await getSkillupVaguesAdmin();
      setVaguesAdminList('vagues' in res ? res.vagues : []);
      setVaguesAdminError('');
    } catch (err) {
      setVaguesAdminList([]);
      setVaguesAdminError(errorMessage(err));
    } finally {
      setVaguesAdminLoading(false);
      setVaguesAdminLoaded(true);
    }
  }, []);

  const loadSalonsAdmin = useCallback(async () => {
    setSalonsLoading(true);
    try {
      const res = await getSkillupSalons();
      setSalonsList('salons' in res ? res.salons : []);
      setSalonsError('');
    } catch (err) {
      setSalonsList([]);
      setSalonsError(errorMessage(err));
    } finally {
      setSalonsLoading(false);
    }
  }, []);

  // Tous les salons vocaux existants sur le serveur Discord — différent de "Salons de
  // coworking" ci-dessus, qui ne liste que ceux déjà rattachés à une vague.
  const [allVoiceChannels, setAllVoiceChannels] = useState<SkillupDiscordVoiceChannel[]>([]);
  const [allVoiceChannelsLoading, setAllVoiceChannelsLoading] = useState(false);
  const [allVoiceChannelsError, setAllVoiceChannelsError] = useState('');

  const loadAllVoiceChannels = useCallback(async () => {
    setAllVoiceChannelsLoading(true);
    try {
      const res = await getSkillupDiscordVoiceChannels();
      setAllVoiceChannels('channels' in res ? res.channels : []);
      setAllVoiceChannelsError('');
    } catch (err) {
      setAllVoiceChannels([]);
      setAllVoiceChannelsError(errorMessage(err));
    } finally {
      setAllVoiceChannelsLoading(false);
    }
  }, []);

  // La liste des vagues est déjà chargée systématiquement (cf. loadAdminForVague, requise
  // par le Dashboard) — seuls salons et salons vocaux Discord restent chargés à la demande.
  const [salonsLoaded, setSalonsLoaded] = useState(false);

  const handleOpenVaguesTab = useCallback(() => {
    if (!salonsLoaded) {
      loadSalonsAdmin();
      loadAllVoiceChannels();
      setSalonsLoaded(true);
    }
  }, [salonsLoaded, loadSalonsAdmin, loadAllVoiceChannels]);

  // Sous-onglet "Bilans" — bilan hebdo (par membre × semaine) et bilan de vague (par
  // membre × vague) rédigés à la main par l'admin. Le panneau "résumé" (nb sessions,
  // durée, blocages) est purement informatif — jamais copié automatiquement dans le
  // texte libre, l'admin rédige lui-même.
  const [bilanMembreDiscordId, setBilanMembreDiscordId] = useState('');
  const [bilanSemaineNum, setBilanSemaineNum] = useState(1);
  // Se cale une seule fois sur la semaine courante de la vague dès qu'elle est connue
  // (même pattern que dashboardSemaineDefaulted) — évite d'afficher "semaine 1" par
  // défaut alors que la vague en est à sa semaine 4.
  const bilanSemaineDefaulted = useRef(false);
  useEffect(() => {
    if (bilanSemaineDefaulted.current || adminCurrentSemaineNumber === null) return;
    bilanSemaineDefaulted.current = true;
    setBilanSemaineNum(adminCurrentSemaineNumber);
  }, [adminCurrentSemaineNumber]);

  // ID de vague toujours explicite (jamais omis) pour les bilans — contrairement à
  // vagueParamFor (qui omet le paramètre quand c'est la vague active, pour coller au
  // comportement historique de /bilan côté Discord), on a besoin ici de forcer la vague
  // filtrée à chaque appel : le résumé informatif passe par resolve_member_sessions, qui
  // sans vague ET avec semaine agrège TOUTES les vagues du membre (pas seulement la vague
  // affichée) — sinon le résumé ne correspond plus à ce que montre /bilan-semaine avec la
  // vague précisée.
  const bilanEffectiveVagueId = useMemo(() => {
    if (adminSelectedVague !== null) return adminSelectedVague;
    return vaguesAdminList.find((v) => v.statut === 'active')?.id ?? null;
  }, [adminSelectedVague, vaguesAdminList]);

  const [bilanInfoSemaine, setBilanInfoSemaine] = useState<SkillupBilanInfo | null>(null);
  const [bilanInfoSemaineLoading, setBilanInfoSemaineLoading] = useState(false);
  const [bilanInfoVague, setBilanInfoVague] = useState<SkillupBilanInfo | null>(null);
  const [bilanInfoVagueLoading, setBilanInfoVagueLoading] = useState(false);

  const [bilanSemaineTexte, setBilanSemaineTexte] = useState('');
  const [bilanSemaineLoading, setBilanSemaineLoading] = useState(false);
  const [bilanSemaineSaving, setBilanSemaineSaving] = useState(false);
  const [bilanSemaineError, setBilanSemaineError] = useState('');

  const [bilanVagueTexte, setBilanVagueTexte] = useState('');
  const [bilanVagueLoading, setBilanVagueLoading] = useState(false);
  const [bilanVagueSaving, setBilanVagueSaving] = useState(false);
  const [bilanVagueError, setBilanVagueError] = useState('');

  // Vue d'ensemble : bilan hebdo de TOUS les membres pour la semaine sélectionnée
  // (texte à null si pas encore rédigé) — permet à l'admin de voir en un coup d'œil
  // qui a déjà un bilan, sans passer membre par membre.
  const [bilansSemaineAll, setBilansSemaineAll] = useState<SkillupBilanMembre[]>([]);
  const [bilansSemaineAllLoading, setBilansSemaineAllLoading] = useState(false);
  const [bilansSemaineAllError, setBilansSemaineAllError] = useState('');

  const loadBilansSemaineAll = useCallback(
    async (semaine: number) => {
      setBilansSemaineAllLoading(true);
      setBilansSemaineAllError('');
      try {
        const res = await getSkillupBilansSemaineAdmin(String(semaine), bilanEffectiveVagueId !== null ? String(bilanEffectiveVagueId) : undefined);
        setBilansSemaineAll('bilans' in res ? res.bilans : []);
      } catch (err) {
        setBilansSemaineAll([]);
        setBilansSemaineAllError(errorMessage(err));
      } finally {
        setBilansSemaineAllLoading(false);
      }
    },
    [bilanEffectiveVagueId]
  );

  const loadBilanSemaineData = useCallback(
    async (discordId: string, semaine: number) => {
      if (!discordId || bilanEffectiveVagueId === null) return;
      setBilanInfoSemaineLoading(true);
      setBilanSemaineLoading(true);
      setBilanSemaineError('');
      try {
        const [info, texte] = await Promise.all([
          getSkillupBilanInfoAdmin(discordId, String(bilanEffectiveVagueId), String(semaine)),
          getSkillupBilanSemaine(discordId, String(bilanEffectiveVagueId), String(semaine)),
        ]);
        setBilanInfoSemaine(info ?? null);
        setBilanSemaineTexte(texte?.texte ?? '');
      } catch (err) {
        setBilanInfoSemaine(null);
        setBilanSemaineError(errorMessage(err));
      } finally {
        setBilanInfoSemaineLoading(false);
        setBilanSemaineLoading(false);
      }
    },
    [bilanEffectiveVagueId]
  );

  const loadBilanVagueData = useCallback(
    async (discordId: string) => {
      if (!discordId || bilanEffectiveVagueId === null) return;
      setBilanInfoVagueLoading(true);
      setBilanVagueLoading(true);
      setBilanVagueError('');
      try {
        const [info, texte] = await Promise.all([
          getSkillupBilanInfoAdmin(discordId, String(bilanEffectiveVagueId)),
          getSkillupBilanVague(discordId, String(bilanEffectiveVagueId)),
        ]);
        setBilanInfoVague(info ?? null);
        setBilanVagueTexte(texte?.texte ?? '');
      } catch (err) {
        setBilanInfoVague(null);
        setBilanVagueError(errorMessage(err));
      } finally {
        setBilanInfoVagueLoading(false);
        setBilanVagueLoading(false);
      }
    },
    [bilanEffectiveVagueId]
  );

  useEffect(() => {
    if (!bilanMembreDiscordId) return;
    loadBilanSemaineData(bilanMembreDiscordId, bilanSemaineNum);
    loadBilanVagueData(bilanMembreDiscordId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bilanMembreDiscordId, bilanSemaineNum, bilanEffectiveVagueId]);

  useEffect(() => {
    if (!bilanMembreDiscordId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBilanMembreDiscordId('');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bilanMembreDiscordId]);

  useEffect(() => {
    loadBilansSemaineAll(bilanSemaineNum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bilanSemaineNum, bilanEffectiveVagueId]);

  const handleSaveBilanSemaine = useCallback(async () => {
    if (!bilanMembreDiscordId || bilanEffectiveVagueId === null) return;
    setBilanSemaineSaving(true);
    setBilanSemaineError('');
    try {
      await setSkillupBilanSemaine(bilanMembreDiscordId, String(bilanEffectiveVagueId), String(bilanSemaineNum), bilanSemaineTexte);
      loadBilansSemaineAll(bilanSemaineNum);
    } catch (err) {
      setBilanSemaineError(errorMessage(err));
    } finally {
      setBilanSemaineSaving(false);
    }
  }, [bilanMembreDiscordId, bilanSemaineNum, bilanSemaineTexte, bilanEffectiveVagueId, loadBilansSemaineAll]);

  const handleSaveBilanVague = useCallback(async () => {
    if (!bilanMembreDiscordId || bilanEffectiveVagueId === null) return;
    setBilanVagueSaving(true);
    setBilanVagueError('');
    try {
      await setSkillupBilanVague(bilanMembreDiscordId, String(bilanEffectiveVagueId), bilanVagueTexte);
    } catch (err) {
      setBilanVagueError(errorMessage(err));
    } finally {
      setBilanVagueSaving(false);
    }
  }, [bilanMembreDiscordId, bilanVagueTexte, bilanEffectiveVagueId]);

  const [creatingVague, setCreatingVague] = useState(false);
  const [createVagueNom, setCreateVagueNom] = useState('');
  const [createVagueDebut, setCreateVagueDebut] = useState('');
  const [createVagueFin, setCreateVagueFin] = useState('');
  const [createVagueSaving, setCreateVagueSaving] = useState(false);
  const [createVagueError, setCreateVagueError] = useState('');

  const openCreateVague = useCallback(() => {
    setCreatingVague(true);
    setCreateVagueNom('');
    setCreateVagueDebut('');
    setCreateVagueFin('');
    setCreateVagueError('');
  }, []);

  const handleCreateVague = useCallback(async () => {
    if (!createVagueNom.trim() || !createVagueDebut || !createVagueFin) {
      setCreateVagueError('Renseigne le nom et les deux dates.');
      return;
    }
    setCreateVagueSaving(true);
    setCreateVagueError('');
    try {
      await createSkillupVague(createVagueNom.trim(), createVagueDebut, createVagueFin);
      await loadVaguesAdmin();
      setCreatingVague(false);
    } catch (err) {
      setCreateVagueError(errorMessage(err));
    } finally {
      setCreateVagueSaving(false);
    }
  }, [createVagueNom, createVagueDebut, createVagueFin, loadVaguesAdmin]);

  const [vagueActionLoadingId, setVagueActionLoadingId] = useState<number | null>(null);
  const [vagueActionError, setVagueActionError] = useState('');

  const handleActivateVague = useCallback(
    async (vagueId: number) => {
      setVagueActionLoadingId(vagueId);
      setVagueActionError('');
      try {
        await activateSkillupVague(vagueId);
        await loadVaguesAdmin();
      } catch (err) {
        setVagueActionError(errorMessage(err));
      } finally {
        setVagueActionLoadingId(null);
      }
    },
    [loadVaguesAdmin]
  );

  const [closingVague, setClosingVague] = useState<SkillupVagueAdmin | null>(null);
  const [closeVagueSaving, setCloseVagueSaving] = useState(false);
  const [closeVagueError, setCloseVagueError] = useState('');

  const handleConfirmCloseVague = useCallback(async () => {
    if (!closingVague) return;
    setCloseVagueSaving(true);
    setCloseVagueError('');
    try {
      await closeSkillupVague(closingVague.id);
      await loadVaguesAdmin();
      setClosingVague(null);
    } catch (err) {
      setCloseVagueError(errorMessage(err));
    } finally {
      setCloseVagueSaving(false);
    }
  }, [closingVague, loadVaguesAdmin]);

  const [addingSalon, setAddingSalon] = useState(false);
  const [addSalonCanalId, setAddSalonCanalId] = useState('');
  const [addSalonSaving, setAddSalonSaving] = useState(false);
  const [addSalonError, setAddSalonError] = useState('');

  // Salons vocaux existants sur le serveur Discord — peuple le sélecteur pour éviter
  // de devoir connaître un ID de salon par cœur (chargé à la demande, une fois par ouverture).
  const [voiceChannels, setVoiceChannels] = useState<SkillupDiscordVoiceChannel[]>([]);
  const [voiceChannelsLoading, setVoiceChannelsLoading] = useState(false);
  const [voiceChannelsError, setVoiceChannelsError] = useState('');

  const openAddSalon = useCallback(() => {
    setAddingSalon(true);
    setAddSalonCanalId('');
    setAddSalonError('');
    setVoiceChannelsLoading(true);
    setVoiceChannelsError('');
    getSkillupDiscordVoiceChannels()
      .then((res) => setVoiceChannels('channels' in res ? res.channels : []))
      .catch((err) => setVoiceChannelsError(errorMessage(err)))
      .finally(() => setVoiceChannelsLoading(false));
  }, []);

  const handleAddSalon = useCallback(async () => {
    const channel = voiceChannels.find((c) => c.channel_id === addSalonCanalId);
    if (!channel) {
      setAddSalonError('Choisis un salon.');
      return;
    }
    setAddSalonSaving(true);
    setAddSalonError('');
    try {
      await addSkillupSalon(channel.channel_id, channel.name);
      await loadSalonsAdmin();
      setAddingSalon(false);
    } catch (err) {
      setAddSalonError(errorMessage(err));
    } finally {
      setAddSalonSaving(false);
    }
  }, [addSalonCanalId, voiceChannels, loadSalonsAdmin]);

  const [removingSalon, setRemovingSalon] = useState<SkillupSalon | null>(null);
  const [removeSalonSaving, setRemoveSalonSaving] = useState(false);
  const [removeSalonError, setRemoveSalonError] = useState('');

  const handleConfirmRemoveSalon = useCallback(async () => {
    if (!removingSalon) return;
    setRemoveSalonSaving(true);
    setRemoveSalonError('');
    try {
      await removeSkillupSalon(removingSalon.canal_id);
      await loadSalonsAdmin();
      setRemovingSalon(null);
    } catch (err) {
      setRemoveSalonError(errorMessage(err));
    } finally {
      setRemoveSalonSaving(false);
    }
  }, [removingSalon, loadSalonsAdmin]);

  // Sans `semaine`, /sessions liste TOUTES les semaines de la vague — exactement ce qu'il
  // faut pour les stats/graphiques globaux du Dashboard.
  const loadAllSessions = useCallback(async (vague?: number) => {
    setAllSessionsLoading(true);
    try {
      const res = await getSkillupSessions(vague !== undefined ? String(vague) : undefined);
      setAllSessions(extractList<SkillupSession>(res, 'sessions'));
      setAllSessionsError('');
    } catch (err) {
      setAllSessions([]);
      setAllSessionsError(errorMessage(err));
    } finally {
      setAllSessionsLoading(false);
    }
  }, []);

  const loadSessionsFiltered = useCallback(async (semaine?: number, vague?: number) => {
    setSessionsLoading(true);
    try {
      const res = await getSkillupSessions(
        vague !== undefined ? String(vague) : undefined,
        semaine !== undefined ? String(semaine) : undefined
      );
      setSessions(extractList<SkillupSession>(res, 'sessions'));
      setSessionsError('');
    } catch (err) {
      setSessions([]);
      setSessionsError(errorMessage(err));
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  // Recharge tout ce qui dépend de la vague sélectionnée : membres + sessions globales
  // (Dashboard/Membres), puis résout la semaine courante via /binomes et l'utilise pour
  // seeder Sessions et Binômes sur "cette semaine" par défaut.
  const loadAdminForVague = useCallback(
    async (vague?: number) => {
      // La liste des vagues est chargée systématiquement ici (pas seulement à l'ouverture
      // du sous-onglet Vagues) : le Dashboard en a besoin dès son premier affichage
      // (KPI "Nombre de vagues", sélecteur de portée "Toutes les vagues").
      await Promise.all([loadMembers(vague), loadAllSessions(vague), loadVaguesAdmin()]);
      const resolvedSemaine = await reloadBinomes(undefined, vague);
      setAdminCurrentSemaineNumber(resolvedSemaine);
      setSessionsSelectedSemaine(null);
      setBinomesSelectedSemaine(null);
      await loadSessionsFiltered(resolvedSemaine ?? undefined, vague);
    },
    [loadMembers, loadAllSessions, loadVaguesAdmin, reloadBinomes, loadSessionsFiltered]
  );

  const goToSessionsWeek = useCallback(
    (target: number) => {
      if (target < 1) return;
      const vagueArg = vagueParamFor(adminSelectedVague);
      if (adminCurrentSemaineNumber !== null && vagueArg === undefined && target >= adminCurrentSemaineNumber) {
        setSessionsSelectedSemaine(null);
        loadSessionsFiltered(undefined, vagueArg);
      } else {
        setSessionsSelectedSemaine(target);
        loadSessionsFiltered(target, vagueArg);
      }
    },
    [adminCurrentSemaineNumber, adminSelectedVague, vagueParamFor, loadSessionsFiltered]
  );

  const goToBinomesWeek = useCallback(
    (target: number) => {
      if (target < 1) return;
      const vagueArg = vagueParamFor(adminSelectedVague);
      if (adminCurrentSemaineNumber !== null && vagueArg === undefined && target >= adminCurrentSemaineNumber) {
        setBinomesSelectedSemaine(null);
        reloadBinomes(undefined, vagueArg);
      } else {
        setBinomesSelectedSemaine(target);
        reloadBinomes(target, vagueArg);
      }
    },
    [adminCurrentSemaineNumber, adminSelectedVague, vagueParamFor, reloadBinomes]
  );

  const goToAdminVague = useCallback(
    (vagueId: number) => {
      setAdminSelectedVague(vagueId);
      loadAdminForVague(vagueParamFor(vagueId));
    },
    [vagueParamFor, loadAdminForVague]
  );

  const [addingMember, setAddingMember] = useState(false);
  const [addDiscordId, setAddDiscordId] = useState('');
  const [addNom, setAddNom] = useState('');
  const [addProfil, setAddProfil] = useState<SkillupProfil>('étudiant');
  const [addCertif, setAddCertif] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState<{ nom: string; dmOk: boolean } | null>(null);

  const openAddMember = useCallback(() => {
    setAddingMember(true);
    setAddDiscordId('');
    setAddNom('');
    setAddProfil('étudiant');
    setAddCertif('');
    setAddError('');
    setAddSuccess(null);
    if (!discordMembersLoaded) loadDiscordMembers();
  }, [discordMembersLoaded, loadDiscordMembers]);

  // Membres du serveur pas encore rattachés à la vague sélectionnée — seuls candidats
  // valides pour "Ajouter un membre" (évite le refus API "déjà membre de cette vague").
  const addMemberOptions = useMemo(
    () => discordMembers.filter((dm) => !members.some((m) => m.discord_id === dm.discord_id)),
    [discordMembers, members]
  );

  const handleAddMember = useCallback(async () => {
    if (!addDiscordId.trim() || !addNom.trim()) {
      setAddError('Renseigne au moins l\'ID Discord et le nom.');
      return;
    }
    setAddSaving(true);
    setAddError('');
    try {
      const result = await addSkillupMember(
        addDiscordId.trim(),
        addNom.trim(),
        addProfil,
        addCertif.trim() || undefined,
        vagueParamFor(adminSelectedVague) !== undefined ? String(vagueParamFor(adminSelectedVague)) : undefined
      );
      await loadMembers(vagueParamFor(adminSelectedVague));
      setAddSuccess({
        nom: 'nom' in result ? result.nom : addNom,
        dmOk: 'dm_ok' in result ? result.dm_ok : false,
      });
    } catch (err) {
      setAddError(errorMessage(err));
    } finally {
      setAddSaving(false);
    }
  }, [addDiscordId, addNom, addProfil, addCertif, adminSelectedVague, vagueParamFor, loadMembers]);

  const [creatingSession, setCreatingSession] = useState(false);
  const [createSessionDiscordId, setCreateSessionDiscordId] = useState('');
  const [createSessionDate, setCreateSessionDate] = useState('');
  const [createSessionCreneau, setCreateSessionCreneau] = useState<string>(SKILLUP_CRENEAUX[0]);
  const [createSessionCreneauAutre, setCreateSessionCreneauAutre] = useState('');
  const [createSessionHeureDebut, setCreateSessionHeureDebut] = useState('');
  const [createSessionHeureFin, setCreateSessionHeureFin] = useState('');
  const [createSessionObjectif, setCreateSessionObjectif] = useState('');
  const [createSessionBilan, setCreateSessionBilan] = useState('');
  const [createSessionBlocages, setCreateSessionBlocages] = useState('');
  const [createSessionCanalId, setCreateSessionCanalId] = useState('');
  const [createSessionSaving, setCreateSessionSaving] = useState(false);
  const [createSessionError, setCreateSessionError] = useState('');
  const [createSessionSuccess, setCreateSessionSuccess] = useState<{ id: number } | null>(null);

  const openCreateSession = useCallback(() => {
    setCreatingSession(true);
    setCreateSessionDiscordId('');
    setCreateSessionDate('');
    setCreateSessionCreneau(SKILLUP_CRENEAUX[0]);
    setCreateSessionCreneauAutre('');
    setCreateSessionHeureDebut('');
    setCreateSessionHeureFin('');
    setCreateSessionObjectif('');
    setCreateSessionBilan('');
    setCreateSessionBlocages('');
    setCreateSessionCanalId('');
    setCreateSessionError('');
    setCreateSessionSuccess(null);
    if (!salonsLoaded) {
      loadSalonsAdmin();
      setSalonsLoaded(true);
    }
  }, [salonsLoaded, loadSalonsAdmin]);

  const handleCreateSession = useCallback(async () => {
    const creneauFinal = createSessionCreneau === '__autre__' ? createSessionCreneauAutre.trim() : createSessionCreneau;
    if (!createSessionDiscordId || !createSessionDate || !creneauFinal || !createSessionHeureDebut) {
      setCreateSessionError('Membre, date, créneau et heure de début sont obligatoires.');
      return;
    }
    setCreateSessionSaving(true);
    setCreateSessionError('');
    try {
      const canal = salonsList.find((s) => s.canal_id === createSessionCanalId);
      const result = await createSkillupSession(
        createSessionDiscordId,
        createSessionDate,
        creneauFinal,
        createSessionHeureDebut,
        createSessionHeureFin.trim() || undefined,
        createSessionObjectif.trim() || undefined,
        createSessionBilan.trim() || undefined,
        canal?.canal_id,
        canal?.canal_nom,
        createSessionBlocages.trim() || undefined,
        vagueParamFor(adminSelectedVague) !== undefined ? String(vagueParamFor(adminSelectedVague)) : undefined
      );
      await loadSessionsFiltered(
        sessionsSelectedSemaine ?? adminCurrentSemaineNumber ?? undefined,
        vagueParamFor(adminSelectedVague)
      );
      await loadAllSessions(vagueParamFor(adminSelectedVague));
      setCreateSessionSuccess({ id: 'id' in result ? result.id : 0 });
    } catch (err) {
      setCreateSessionError(errorMessage(err));
    } finally {
      setCreateSessionSaving(false);
    }
  }, [
    createSessionDiscordId,
    createSessionDate,
    createSessionCreneau,
    createSessionCreneauAutre,
    createSessionHeureDebut,
    createSessionHeureFin,
    createSessionObjectif,
    createSessionBilan,
    createSessionBlocages,
    createSessionCanalId,
    salonsList,
    adminSelectedVague,
    vagueParamFor,
    sessionsSelectedSemaine,
    adminCurrentSemaineNumber,
    loadSessionsFiltered,
    loadAllSessions,
  ]);

  const [editingMember, setEditingMember] = useState<SkillupMember | null>(null);
  const [editMemberForm, setEditMemberForm] = useState({ nom: '', profil: '', certif_ou_projet: '', objectif_vague: '' });
  const [editMemberSaving, setEditMemberSaving] = useState(false);
  const [editMemberError, setEditMemberError] = useState('');

  const openEditMember = useCallback((member: SkillupMember) => {
    setEditingMember(member);
    setEditMemberForm({
      nom: member.nom,
      profil: member.profil,
      certif_ou_projet: member.certif_ou_projet || '',
      objectif_vague: member.objectif_vague || '',
    });
    setEditMemberError('');
  }, []);

  const handleSaveEditMember = useCallback(async () => {
    if (!editingMember) return;
    const champs: SkillupMembreChamp[] = ['nom', 'profil', 'certif_ou_projet', 'objectif_vague'];
    const original: Record<SkillupMembreChamp, string> = {
      nom: editingMember.nom,
      profil: editingMember.profil,
      certif_ou_projet: editingMember.certif_ou_projet || '',
      objectif_vague: editingMember.objectif_vague || '',
    };
    const changed = champs.filter((c) => editMemberForm[c] !== original[c]);
    if (changed.length === 0) {
      setEditingMember(null);
      return;
    }
    setEditMemberSaving(true);
    setEditMemberError('');
    const vagueArg = vagueParamFor(adminSelectedVague) !== undefined ? String(vagueParamFor(adminSelectedVague)) : undefined;
    try {
      for (const champ of changed) {
        await editSkillupMember(editingMember.discord_id, champ, editMemberForm[champ], vagueArg);
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === editingMember.id ? { ...m, ...editMemberForm } : m))
      );
      setEditingMember(null);
    } catch (err) {
      setEditMemberError(errorMessage(err));
    } finally {
      setEditMemberSaving(false);
    }
  }, [editingMember, editMemberForm, adminSelectedVague, vagueParamFor]);

  useEffect(() => {
    if (!editingMember) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingMember(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingMember]);

  const [linkingThreadMember, setLinkingThreadMember] = useState<SkillupMember | null>(null);
  const [linkThreadValeur, setLinkThreadValeur] = useState('');
  const [linkThreadSaving, setLinkThreadSaving] = useState(false);
  const [linkThreadError, setLinkThreadError] = useState('');
  const [linkThreadSuccess, setLinkThreadSuccess] = useState(false);

  const openLinkThread = useCallback((member: SkillupMember) => {
    setLinkingThreadMember(member);
    setLinkThreadValeur('');
    setLinkThreadError('');
    setLinkThreadSuccess(false);
  }, []);

  const handleSaveLinkThread = useCallback(async () => {
    if (!linkingThreadMember || !linkThreadValeur.trim()) return;
    setLinkThreadSaving(true);
    setLinkThreadError('');
    try {
      await linkSkillupMemberThread(
        linkingThreadMember.discord_id,
        linkThreadValeur.trim(),
        vagueParamFor(adminSelectedVague) !== undefined ? String(vagueParamFor(adminSelectedVague)) : undefined
      );
      setLinkThreadSuccess(true);
    } catch (err) {
      setLinkThreadError(errorMessage(err));
    } finally {
      setLinkThreadSaving(false);
    }
  }, [linkingThreadMember, linkThreadValeur, adminSelectedVague, vagueParamFor]);

  // Synchro objectif de vague — récupère le contenu réel du post objectif Discord déjà
  // rattaché (thread_objectif_id) et l'écrit dans objectif_vague. Utile pour les membres
  // dont le post existait avant l'automatisation /objectif-vague, ou rattaché après coup.
  const [syncingObjectifDiscordId, setSyncingObjectifDiscordId] = useState<string | null>(null);
  const [syncObjectifError, setSyncObjectifError] = useState('');

  const handleSyncMemberObjectif = useCallback(
    async (member: SkillupMember) => {
      setSyncingObjectifDiscordId(member.discord_id);
      setSyncObjectifError('');
      try {
        await syncSkillupMemberObjectif(
          member.discord_id,
          vagueParamFor(adminSelectedVague) !== undefined ? String(vagueParamFor(adminSelectedVague)) : undefined
        );
        await loadMembers(vagueParamFor(adminSelectedVague));
      } catch (err) {
        setSyncObjectifError(errorMessage(err));
      } finally {
        setSyncingObjectifDiscordId(null);
      }
    },
    [adminSelectedVague, vagueParamFor, loadMembers]
  );

  const [bulkSyncingObjectifs, setBulkSyncingObjectifs] = useState(false);
  const [bulkSyncResults, setBulkSyncResults] = useState<SkillupObjectifSyncResult[] | null>(null);
  const [bulkSyncError, setBulkSyncError] = useState('');

  const handleBulkSyncObjectifs = useCallback(async () => {
    setBulkSyncingObjectifs(true);
    setBulkSyncError('');
    setBulkSyncResults(null);
    try {
      const res = await syncSkillupMembersObjectifAll(
        vagueParamFor(adminSelectedVague) !== undefined ? String(vagueParamFor(adminSelectedVague)) : undefined
      );
      setBulkSyncResults('resultats' in res ? res.resultats : []);
      await loadMembers(vagueParamFor(adminSelectedVague));
    } catch (err) {
      setBulkSyncError(errorMessage(err));
    } finally {
      setBulkSyncingObjectifs(false);
    }
  }, [adminSelectedVague, vagueParamFor, loadMembers]);

  // Sélecteur de portée du Dashboard — un vrai menu déroulant, entièrement indépendant du
  // sélecteur de vague partagé par Membres/Sessions/Binômes : n'importe quelle vague non-
  // brouillon directement, ou "Toutes les vagues". Une seule source de données pour les
  // deux cas (`dashboardAllVagues`, sessions+membres par vague), chargée une fois.
  const [dashboardScope, setDashboardScope] = useState<number | 'all'>('all');
  const dashboardScopeDefaulted = useRef(false);

  // Filtre semaine du Dashboard — indépendant de Sessions/Binômes. Défaut sur la semaine
  // courante (résolue via adminCurrentSemaineNumber, cf. loadAdminForVague), une seule fois.
  const [dashboardSemaine, setDashboardSemaine] = useState<number | 'all'>('all');
  const dashboardSemaineDefaulted = useRef(false);
  const [dashboardWeekSessions, setDashboardWeekSessions] = useState<SkillupSession[]>([]);
  const [dashboardWeekLoading, setDashboardWeekLoading] = useState(false);
  const [dashboardWeekError, setDashboardWeekError] = useState('');
  const [dashboardAllVagues, setDashboardAllVagues] = useState<
    { vagueId: number; vagueNom: string; sessions: SkillupSession[]; membresCount: number }[]
  >([]);
  const [dashboardAllLoading, setDashboardAllLoading] = useState(false);
  const [dashboardAllError, setDashboardAllError] = useState('');
  const [dashboardAllLoaded, setDashboardAllLoaded] = useState(false);

  const loadDashboardAllVagues = useCallback(async () => {
    setDashboardAllLoading(true);
    try {
      const targets = vaguesAdminList.filter((v) => v.statut !== 'brouillon');
      let membresIndisponibles = false;
      const results = await Promise.all(
        targets.map(async (v) => {
          // allSettled, pas all : sessions et membres sont deux appels indépendants
          // (même vague, données non liées) — un échec transitoire sur l'un (ex: 429
          // Discord sur le check admin de /members, appelé en live à chaque requête,
          // pas mis en cache contrairement aux rôles) ne doit jamais faire disparaître
          // les données de l'autre, ni celles des autres vagues du batch.
          const [sessionsRes, membersRes] = await Promise.allSettled([
            getSkillupSessions(String(v.id)),
            getSkillupMembers(String(v.id)),
          ]);
          if (membersRes.status === 'rejected') membresIndisponibles = true;
          return {
            vagueId: v.id,
            vagueNom: v.nom,
            sessions:
              sessionsRes.status === 'fulfilled' ? extractList<SkillupSession>(sessionsRes.value, 'sessions') : [],
            membresCount:
              membersRes.status === 'fulfilled' ? extractList<SkillupMember>(membersRes.value, 'membres').length : 0,
          };
        })
      );
      setDashboardAllVagues(results);
      setDashboardAllError(
        membresIndisponibles ? 'Effectif de certaines vagues temporairement indisponible (Discord).' : ''
      );
    } catch (err) {
      setDashboardAllVagues([]);
      setDashboardAllError(errorMessage(err));
    } finally {
      setDashboardAllLoading(false);
      setDashboardAllLoaded(true);
    }
  }, [vaguesAdminList]);

  // Charge dès que la liste des vagues est connue (une fois) — nécessaire pour peupler le
  // menu déroulant, qu'une vague spécifique ou "Toutes les vagues" soit choisie ensuite.
  useEffect(() => {
    if (vaguesAdminList.length > 0 && !dashboardAllLoaded) loadDashboardAllVagues();
  }, [vaguesAdminList, dashboardAllLoaded, loadDashboardAllVagues]);

  // Défaut sur la vague active plutôt que "Toutes les vagues" — une seule fois, pour ne
  // pas écraser un choix manuel de l'utilisateur (ex. retour à "Toutes les vagues").
  useEffect(() => {
    if (dashboardScopeDefaulted.current || vaguesAdminList.length === 0) return;
    dashboardScopeDefaulted.current = true;
    const active = vaguesAdminList.find((v) => v.statut === 'active');
    if (active) setDashboardScope(active.id);
  }, [vaguesAdminList]);

  useEffect(() => {
    if (dashboardSemaineDefaulted.current || adminCurrentSemaineNumber === null) return;
    dashboardSemaineDefaulted.current = true;
    setDashboardSemaine(adminCurrentSemaineNumber);
  }, [adminCurrentSemaineNumber]);

  const loadDashboardWeekSessions = useCallback(async () => {
    if (dashboardSemaine === 'all') return;
    setDashboardWeekLoading(true);
    try {
      const targets = dashboardScope === 'all' ? dashboardAllVagues.map((v) => v.vagueId) : [dashboardScope];
      const results = await Promise.all(
        targets.map((id) => getSkillupSessions(String(id), String(dashboardSemaine)))
      );
      setDashboardWeekSessions(results.flatMap((r) => extractList<SkillupSession>(r, 'sessions')));
      setDashboardWeekError('');
    } catch (err) {
      setDashboardWeekSessions([]);
      setDashboardWeekError(errorMessage(err));
    } finally {
      setDashboardWeekLoading(false);
    }
  }, [dashboardSemaine, dashboardScope, dashboardAllVagues]);

  useEffect(() => {
    if (dashboardSemaine !== 'all') loadDashboardWeekSessions();
  }, [dashboardSemaine, dashboardScope, loadDashboardWeekSessions]);

  // KPI "Binômes actifs" — propre au Dashboard, pas le `binomes` partagé du sous-onglet
  // Binômes (lui reste sur adminSelectedVague/sa propre semaine). Un binôme n'existe que
  // pour une semaine donnée : en mode "Toutes les semaines", on retombe sur la semaine
  // courante comme proxy de "actifs maintenant".
  const [dashboardBinomesCount, setDashboardBinomesCount] = useState(0);
  const [dashboardBinomesLoading, setDashboardBinomesLoading] = useState(false);

  const loadDashboardBinomes = useCallback(async () => {
    const semaineEff = dashboardSemaine !== 'all' ? dashboardSemaine : adminCurrentSemaineNumber;
    if (semaineEff === null) {
      setDashboardBinomesCount(0);
      return;
    }
    setDashboardBinomesLoading(true);
    try {
      const targets = dashboardScope === 'all' ? dashboardAllVagues.map((v) => v.vagueId) : [dashboardScope];
      const results = await Promise.all(
        targets.map((id) => getSkillupBinomes(String(semaineEff), String(id)))
      );
      setDashboardBinomesCount(
        results.reduce((acc, r) => acc + extractList<SkillupBinome>(r, 'binomes').length, 0)
      );
    } catch {
      setDashboardBinomesCount(0);
    } finally {
      setDashboardBinomesLoading(false);
    }
  }, [dashboardSemaine, dashboardScope, dashboardAllVagues, adminCurrentSemaineNumber]);

  useEffect(() => {
    loadDashboardBinomes();
  }, [loadDashboardBinomes]);

  const dashboardScopeLabel = useMemo(() => {
    if (dashboardScope === 'all') return 'Toutes les vagues';
    return dashboardAllVagues.find((v) => v.vagueId === dashboardScope)?.vagueNom ?? 'Vague';
  }, [dashboardScope, dashboardAllVagues]);

  // Sessions "à plat" selon la portée choisie — source unique pour stats + graphiques.
  // Le filtre semaine, quand actif, remplace entièrement cette liste par le résultat déjà
  // filtré côté API (dashboardWeekSessions) — les sessions n'ont pas de champ `semaine`
  // exploitable côté client.
  const dashboardSessions = useMemo(() => {
    if (dashboardSemaine !== 'all') return dashboardWeekSessions;
    if (dashboardScope === 'all') return dashboardAllVagues.flatMap((v) => v.sessions);
    return dashboardAllVagues.find((v) => v.vagueId === dashboardScope)?.sessions ?? [];
  }, [dashboardScope, dashboardAllVagues, dashboardSemaine, dashboardWeekSessions]);

  // Métriques et graphiques du Dashboard — calculés côté frontend à partir de ce que
  // /sessions et /members renvoient déjà pour chaque vague non-brouillon. Pas de nouvel
  // endpoint pour cette V1.
  const dashboardStats = useMemo(() => {
    const totalSessions = dashboardSessions.length;
    const completes = dashboardSessions.filter((s) => s.statut === 'complète').length;
    const incompletes = dashboardSessions.filter((s) => s.statut === 'incomplète').length;
    // Delta : sessions ni complètes ni incomplètes (ex: 'ouverte' — jamais clôturée).
    const autres = totalSessions - completes - incompletes;
    const tauxCompletion = totalSessions > 0 ? Math.round((completes / totalSessions) * 100) : 0;
    const totalSeconds = dashboardSessions.reduce((acc, s) => {
      if (!s.debut || !s.fin) return acc;
      const debut = new Date(s.debut).getTime();
      const fin = new Date(s.fin).getTime();
      return Number.isNaN(debut) || Number.isNaN(fin) ? acc : acc + Math.max(0, (fin - debut) / 1000);
    }, 0);
    const totalMembres =
      dashboardScope === 'all'
        ? dashboardAllVagues.reduce((acc, v) => acc + v.membresCount, 0)
        : dashboardAllVagues.find((v) => v.vagueId === dashboardScope)?.membresCount ?? 0;
    return {
      totalMembres,
      nombreVagues: vaguesAdminList.filter((v) => v.statut !== 'brouillon').length,
      totalSessions,
      completes,
      incompletes,
      autres,
      tauxCompletion,
      binomesActifs: dashboardBinomesCount,
      dureeCumulee: formatDuration(totalSeconds),
    };
  }, [dashboardSessions, dashboardScope, dashboardAllVagues, vaguesAdminList, dashboardBinomesCount]);

  // Comparaison entre vagues — sessions totales par vague, uniquement en mode "Toutes les
  // vagues" (une seule barre n'aurait pas de sens en mode vague unique).
  const sessionsParVagueData = useMemo(
    () => dashboardAllVagues.map((v) => ({ vague: v.vagueNom, count: v.sessions.length })),
    [dashboardAllVagues]
  );

  const sessionsParJourData = useMemo(() => {
    const counts = new Map<string, number>();
    dashboardSessions.forEach((s) => counts.set(s.date, (counts.get(s.date) || 0) + 1));
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: formatShortDate(date), count }));
  }, [dashboardSessions]);

  const sessionsParMembreData = useMemo(() => {
    const counts = new Map<string, number>();
    dashboardSessions.forEach((s) => {
      const nom = s.membre_nom || 'Inconnu';
      counts.set(nom, (counts.get(nom) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([membre, count]) => ({ membre, count }));
  }, [dashboardSessions]);

  const statutRepartitionData = useMemo(() => {
    const counts = new Map<string, number>();
    dashboardSessions.forEach((s) => counts.set(s.statut, (counts.get(s.statut) || 0) + 1));
    return Array.from(counts.entries()).map(([statut, count]) => ({ statut, count }));
  }, [dashboardSessions]);

  const creneauRepartitionData = useMemo(() => {
    const counts = new Map<string, number>();
    dashboardSessions.forEach((s) => counts.set(s.creneau, (counts.get(s.creneau) || 0) + 1));
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([creneau, count]) => ({ creneau, count }));
  }, [dashboardSessions]);

  // Export Dashboard (CSV + PDF) — reflète la portée vague + le filtre semaine actifs,
  // puisque toutes les données sources (dashboardStats, ...Data) en découlent déjà.
  const dashboardExportTables = useMemo<ExportTable[]>(() => {
    const tables: ExportTable[] = [
      {
        title: 'Indicateurs',
        headers: ['Indicateur', 'Valeur'],
        rows: [
          ['Membres', dashboardStats.totalMembres],
          ['Vagues', dashboardStats.nombreVagues],
          ['Sessions totales', dashboardStats.totalSessions],
          ['Sessions complètes', dashboardStats.completes],
          ['Sessions incomplètes', dashboardStats.incompletes],
          ['Sessions autres', dashboardStats.autres],
          ['Taux de complétion', `${dashboardStats.tauxCompletion}%`],
          ['Binômes actifs', dashboardStats.binomesActifs],
          ['Durée cumulée', dashboardStats.dureeCumulee],
        ],
      },
      {
        title: 'Sessions par jour',
        headers: ['Date', 'Sessions'],
        rows: sessionsParJourData.map((d) => [d.date, d.count]),
      },
      {
        title: 'Sessions par membre',
        headers: ['Membre', 'Sessions'],
        rows: sessionsParMembreData.map((d) => [d.membre, d.count]),
      },
      {
        title: 'Répartition par statut',
        headers: ['Statut', 'Sessions'],
        rows: statutRepartitionData.map((d) => [d.statut, d.count]),
      },
      {
        title: 'Répartition par créneau',
        headers: ['Créneau', 'Sessions'],
        rows: creneauRepartitionData.map((d) => [d.creneau, d.count]),
      },
    ];
    if (dashboardScope === 'all' && sessionsParVagueData.length > 1) {
      tables.push({
        title: 'Comparaison par vague',
        headers: ['Vague', 'Sessions'],
        rows: sessionsParVagueData.map((d) => [d.vague, d.count]),
      });
    }
    return tables;
  }, [dashboardStats, sessionsParJourData, sessionsParMembreData, statutRepartitionData, creneauRepartitionData, dashboardScope, sessionsParVagueData]);

  const dashboardExportSubtitle = useMemo(() => {
    const semaineLabel = dashboardSemaine === 'all' ? 'Toutes les semaines' : `Semaine ${dashboardSemaine}`;
    return `${dashboardScopeLabel} — ${semaineLabel}`;
  }, [dashboardScopeLabel, dashboardSemaine]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    setAccessFailed(false);
    setLinked(true);
    try {
      let accessResult: SkillupAccess | { linked: false };
      try {
        accessResult = await getSkillupAccess();
      } catch (err) {
        setAccessFailed(true);
        setError(errorMessage(err));
        setAccess(null);
        return;
      }
      if (!isLinked(accessResult)) {
        setLinked(false);
        setAccess(null);
        return;
      }
      setAccess(accessResult);
      setActiveTab(accessResult.is_participant ? 'participant' : 'admin');

      // Liste complète des vagues du système (GET /vagues) — plus le scope "vagues de
      // l'appelant" de /members/{discord_id}/vagues (limite historique notée au catalogue
      // admin §1, maintenant migrée). Brouillon exclue : jamais sélectionnable.
      const vaguesRes = await getSkillupVaguesAdmin();
      let activeVagueId: number | null = null;
      if ('vagues' in vaguesRes) {
        const selectables = vaguesRes.vagues.filter((v) => v.statut !== 'brouillon');
        setVagues(selectables);
        activeVagueId = selectables.find((v) => v.statut === 'active')?.id ?? null;
      } else {
        setVagues([]);
      }

      // Chaque section charge indépendamment : l'échec d'un appel (ex: pas de binôme
      // cette semaine) ne doit pas empêcher l'affichage des autres données déjà chargées.
      if (accessResult.is_participant) {
        setSelectedSemaine(null);
        setSelectedVague(activeVagueId);
        await loadParticipant();
        loadMyObjectif();
      }

      if (accessResult.is_admin) {
        setAdminSelectedVague(activeVagueId);
        await loadAdminForVague();
      }

      if (accessResult.is_participant || accessResult.is_admin) {
        // Avatars Discord vérifiés (onglet Binômes admin + carte binôme self-service) —
        // échec silencieux, fallback aux initiales.
        getSkillupDiscordAvatars()
          .then((res) => setDiscordAvatars(('avatars' in res && res.avatars) || {}))
          .catch(() => setDiscordAvatars({}));
      }
    } catch (err) {
      console.error('Erreur chargement SkillUp:', err);
      setError('Impossible de charger les données SkillUp pour le moment.');
    } finally {
      setLoading(false);
    }
  }, [loadParticipant, loadMyObjectif, loadAdminForVague]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!access && accessFailed) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-blue-900 mb-2">Connexion à SkillUp impossible</h1>
          <p className="text-zinc-600 text-sm mb-6">{error || 'Le service SkillUp est momentanément indisponible.'}</p>
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!access) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-blue-700" />
          </div>
          <h1 className="text-xl font-bold text-blue-900 mb-2">SkillUp non disponible</h1>
          <p className="text-zinc-600 text-sm mb-6">
            {linked
              ? "Cet onglet n'est accessible qu'aux participants et admins de la vague active."
              : 'Lie ton compte Discord depuis ton profil pour accéder à SkillUp.'}
          </p>
          <Link
            to={linked ? '/' : '/profile'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors"
          >
            {linked ? "Retour à l'accueil" : 'Lier mon compte Discord'}
          </Link>
        </div>
      </div>
    );
  }

  const showParticipant = access.is_participant;
  const showAdmin = access.is_admin;

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-700" />
              SkillUp
            </h1>
            <p className="text-zinc-500 mt-1">
              Suivi de la vague de coworking Alumni CPS
              {vagueName && (
                <>
                  {' '}— <span className="font-medium text-zinc-700">{vagueName}</span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-blue-700 bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {showParticipant && showAdmin && (
          <div className="flex border-b border-zinc-200 mb-6 bg-white shadow-sm rounded-t-xl overflow-hidden">
            <button
              onClick={() => setActiveTab('participant')}
              className={`flex-1 py-3 px-6 text-center font-medium text-sm transition-colors ${
                activeTab === 'participant'
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Ma vague{vagueName ? ` — ${vagueName}` : ''}
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-3 px-6 text-center font-medium text-sm transition-colors ${
                activeTab === 'admin'
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Vue admin
            </button>
          </div>
        )}

        {showParticipant && activeTab === 'participant' && (
          <div className="space-y-6">
            {vagues.length > 1 && (
              <div className="flex items-center justify-center gap-3 bg-white border border-zinc-200 shadow-sm rounded-xl p-3">
                <label htmlFor="vague-select" className="text-sm text-zinc-500">
                  Vague
                </label>
                <select
                  id="vague-select"
                  value={selectedVague ?? ''}
                  disabled={participantLoading}
                  onChange={(e) => goToVague(Number(e.target.value))}
                  className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {vagues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nom}{v.statut === 'active' ? ' (active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 bg-white border border-zinc-200 shadow-sm rounded-xl p-3">
              <button
                type="button"
                onClick={() => goToWeek((selectedSemaine ?? currentSemaineNumber ?? 1) - 1)}
                disabled={participantLoading || (selectedSemaine ?? currentSemaineNumber ?? 1) <= 1}
                className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Semaine précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-zinc-900 min-w-[7rem] text-center">
                {selectedSemaine !== null
                  ? `Semaine ${selectedSemaine}`
                  : currentSemaineNumber !== null
                  ? `Semaine ${currentSemaineNumber} (actuelle)`
                  : 'Semaine actuelle'}
              </span>
              <button
                type="button"
                onClick={() => selectedSemaine !== null && goToWeek(selectedSemaine + 1)}
                disabled={participantLoading || selectedSemaine === null}
                className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Semaine suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Mon objectif de vague</div>
                  {myObjectifLoading ? (
                    <div className="text-sm text-zinc-400">Chargement...</div>
                  ) : myObjectifError ? (
                    <div className="text-sm text-zinc-500">{myObjectifError}</div>
                  ) : myObjectif ? (
                    <p className="text-sm text-zinc-700 whitespace-pre-line">{myObjectif}</p>
                  ) : (
                    <p className="text-sm text-zinc-400 italic">Aucun objectif défini</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openEditObjectif}
                  className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-blue-700 transition-colors shrink-0"
                  aria-label="Modifier mon objectif de vague"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
              <h2 className="font-semibold text-blue-900 mb-4">Journal de la semaine</h2>
              {participantLoading ? (
                <div className="py-10 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                </div>
              ) : journalError ? (
                <p className="text-sm text-zinc-600">{journalError}</p>
              ) : (
                <SessionsTable
                  sessions={journal}
                  withMember={false}
                  emptyLabel="Aucune session cette semaine"
                  onEdit={(session) => openEdit(session, 'self')}
                  onDelete={(session) => openDeleteSession(session, 'self')}
                />
              )}
            </div>

            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="font-semibold text-blue-900">Journal de mon binôme</h2>
                {!participantLoading && binomePartnerName && (
                  <div className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 border border-zinc-200">
                    {discordAvatars[binomePartnerDiscordId ?? ''] ? (
                      <img
                        src={discordAvatars[binomePartnerDiscordId ?? '']}
                        alt={binomePartnerName}
                        className="w-7 h-7 rounded-full object-cover shadow-sm"
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-full ${avatarColor(0)} text-white flex items-center justify-center text-[11px] font-semibold shadow-sm`}>
                        {getInitials(binomePartnerName)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-zinc-900">{binomePartnerName}</span>
                  </div>
                )}
              </div>
              {participantLoading ? (
                <div className="py-10 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                </div>
              ) : binomeJournalError ? (
                <p className="text-sm text-zinc-600">{binomeJournalError}</p>
              ) : (
                <SessionsTable sessions={binomeJournal} withMember={false} emptyLabel="Aucune donnée" />
              )}
            </div>

            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
              <h2 className="font-semibold text-blue-900 mb-4">Bilan hebdomadaire</h2>
              {participantLoading ? (
                <div className="py-10 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                </div>
              ) : bilanError ? (
                <p className="text-sm text-zinc-600">{bilanError}</p>
              ) : bilan ? (
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-zinc-900">{bilan.nom}</p>
                    <p className="text-sm text-zinc-500">{bilan.label}</p>
                  </div>

                  {bilanTexteSemaineLoading ? (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm text-zinc-400">Chargement du bilan...</div>
                  ) : bilanTexteSemaineError ? (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm text-zinc-500">{bilanTexteSemaineError}</div>
                  ) : bilanTexteSemaine ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">Bilan de l'animateur</p>
                      <p className="text-sm text-zinc-700 whitespace-pre-line">{bilanTexteSemaine.texte}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400 italic">Pas encore de bilan rédigé par l'animateur pour cette semaine.</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-zinc-50 rounded-lg p-3">
                      <div className="text-xs text-zinc-500 uppercase tracking-wide">Sessions</div>
                      <div className="text-xl font-bold text-zinc-900">{bilan.nb_sessions}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-green-700 uppercase tracking-wide">Complètes</div>
                      <div className="text-xl font-bold text-green-700">{bilan.nb_completes}</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="text-xs text-amber-700 uppercase tracking-wide">Incomplètes</div>
                      <div className="text-xl font-bold text-amber-700">{bilan.nb_incompletes}</div>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-3">
                      <div className="text-xs text-zinc-500 uppercase tracking-wide">Durée totale</div>
                      <div className="text-xl font-bold text-zinc-900">{bilan.duree_totale}</div>
                    </div>
                  </div>
                  {bilan.blocages?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 mb-1">Blocages rencontrés</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-zinc-700">
                        {bilan.blocages.map((blocage, index) => (
                          <li key={index}>{blocage}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState label="Aucun bilan pour cette semaine" />
              )}
            </div>
          </div>
        )}

        {showAdmin && activeTab === 'admin' && (
          <div className="space-y-6">
            {vagues.length > 1 && (
              <div className="flex items-center justify-center gap-3 bg-white border border-zinc-200 shadow-sm rounded-xl p-3">
                <label htmlFor="admin-vague-select" className="text-sm text-zinc-500">
                  Vague
                </label>
                <select
                  id="admin-vague-select"
                  value={adminSelectedVague ?? ''}
                  onChange={(e) => goToAdminVague(Number(e.target.value))}
                  className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {vagues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nom}{v.statut === 'active' ? ' (active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Tabs
                activeKey={adminActiveSubTab}
                onChange={(key) => {
                  setAdminActiveSubTab(key);
                  if (key === 'vagues') handleOpenVaguesTab();
                }}
                items={[
                  {
                    key: 'dashboard',
                    label: 'Dashboard',
                    children: (
                      <div className="space-y-6 pt-2">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <h2 className="font-semibold text-blue-900">
                            Dashboard <span className="text-zinc-400 font-normal">— {dashboardScopeLabel}</span>
                          </h2>
                          <div className="flex items-center gap-2">
                            <select
                              value={dashboardScope}
                              onChange={(e) => setDashboardScope(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                              disabled={dashboardAllLoading}
                              className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all">Toutes les vagues</option>
                              {[...vaguesAdminList]
                                .filter((v) => v.statut !== 'brouillon')
                                .sort((a, b) => b.date_debut.localeCompare(a.date_debut))
                                .map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.nom}{v.statut === 'active' ? ' (active)' : ''}
                                  </option>
                                ))}
                            </select>
                            <select
                              value={dashboardSemaine}
                              onChange={(e) => setDashboardSemaine(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                              disabled={dashboardWeekLoading}
                              className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all">Toutes les semaines</option>
                              {Array.from(
                                { length: Math.max(adminCurrentSemaineNumber ?? 1, typeof dashboardSemaine === 'number' ? dashboardSemaine : 1) },
                                (_, i) => i + 1
                              ).map((s) => (
                                <option key={s} value={s}>
                                  Semaine {s}{adminCurrentSemaineNumber === s ? ' (courante)' : ''}
                                </option>
                              ))}
                            </select>
                            <ExportButtons
                              tables={dashboardExportTables}
                              filenamePrefix="skillup-dashboard"
                              pdfTitle="Dashboard SkillUp"
                              pdfSubtitle={dashboardExportSubtitle}
                              disabled={dashboardAllLoading || dashboardWeekLoading}
                            />
                          </div>
                        </div>

                        {(dashboardAllError || dashboardWeekError) && (
                          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {dashboardAllError || dashboardWeekError}
                          </div>
                        )}

                        {dashboardAllLoading || dashboardWeekLoading ? (
                          <div className="py-10 flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                              <div className="bg-indigo-50 rounded-lg p-4">
                                <div className="text-xs text-indigo-700 uppercase tracking-wide">Membres</div>
                                <div className="text-2xl font-bold text-indigo-700">{dashboardStats.totalMembres}</div>
                              </div>
                              <div className="bg-teal-50 rounded-lg p-4">
                                <div className="text-xs text-teal-700 uppercase tracking-wide">Vagues</div>
                                <div className="text-2xl font-bold text-teal-700">{dashboardStats.nombreVagues}</div>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div className="text-xs text-blue-700 uppercase tracking-wide">Sessions</div>
                                <div className="text-2xl font-bold text-blue-700">{dashboardStats.totalSessions}</div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-4">
                                <div className="text-xs text-green-700 uppercase tracking-wide">Taux de complétion</div>
                                <div className="text-2xl font-bold text-green-700">{dashboardStats.tauxCompletion}%</div>
                                <div className="text-xs text-zinc-500 mt-1">
                                  {dashboardStats.completes} complètes · {dashboardStats.incompletes} incomplètes
                                  {dashboardStats.autres > 0 ? ` · ${dashboardStats.autres} autres` : ''}
                                </div>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-4">
                                <div className="text-xs text-purple-700 uppercase tracking-wide">Binômes actifs</div>
                                <div className="text-2xl font-bold text-purple-700">{dashboardStats.binomesActifs}</div>
                              </div>
                              <div className="bg-amber-50 rounded-lg p-4">
                                <div className="text-xs text-amber-700 uppercase tracking-wide">Durée cumulée</div>
                                <div className="text-2xl font-bold text-amber-700">{dashboardStats.dureeCumulee}</div>
                              </div>
                            </div>

                            {dashboardScope === 'all' && sessionsParVagueData.length > 1 && (
                              <div className="bg-white border border-zinc-200 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-zinc-700 mb-2">Sessions totales par vague</h3>
                                <Column
                                  data={sessionsParVagueData}
                                  xField="vague"
                                  yField="count"
                                  height={260}
                                  axis={{ y: { title: false }, x: { title: false } }}
                                  tooltip={{ title: 'vague', items: [{ field: 'count', name: 'Sessions' }] }}
                                />
                              </div>
                            )}

                            {dashboardScope === 'all' && sessionsParVagueData.length <= 1 && (
                              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-sm text-zinc-500">
                                Pas assez de vagues avec des données pour comparer.
                              </div>
                            )}

                            {dashboardSessions.length === 0 ? (
                              <EmptyState label="Aucune session pour cette portée" />
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="bg-white border border-zinc-200 rounded-xl p-4">
                                  <h3 className="text-sm font-semibold text-zinc-700 mb-2">Sessions par jour</h3>
                                  <Column
                                    data={sessionsParJourData}
                                    xField="date"
                                    yField="count"
                                    height={260}
                                    axis={{ y: { title: false }, x: { title: false } }}
                                    tooltip={{ title: 'date', items: [{ field: 'count', name: 'Sessions' }] }}
                                  />
                                </div>
                                <div className="bg-white border border-zinc-200 rounded-xl p-4">
                                  <h3 className="text-sm font-semibold text-zinc-700 mb-2">Sessions par membre</h3>
                                  <Bar
                                    data={sessionsParMembreData}
                                    xField="membre"
                                    yField="count"
                                    height={Math.max(260, sessionsParMembreData.length * 36)}
                                    axis={{ y: { title: false }, x: { title: false } }}
                                    tooltip={{ title: 'membre', items: [{ field: 'count', name: 'Sessions' }] }}
                                  />
                                </div>
                                <div className="bg-white border border-zinc-200 rounded-xl p-4">
                                  <h3 className="text-sm font-semibold text-zinc-700 mb-2">Répartition par statut</h3>
                                  <Pie
                                    data={statutRepartitionData}
                                    angleField="count"
                                    colorField="statut"
                                    innerRadius={0.6}
                                    height={260}
                                    color={(d: { statut: string }) => STATUT_COLORS[d.statut] ?? '#94a3b8'}
                                    label={{ text: 'statut' }}
                                    tooltip={{ title: 'statut', items: [{ field: 'count', name: 'Sessions' }] }}
                                  />
                                </div>
                                <div className="bg-white border border-zinc-200 rounded-xl p-4">
                                  <h3 className="text-sm font-semibold text-zinc-700 mb-2">Répartition par créneau</h3>
                                  <Pie
                                    data={creneauRepartitionData}
                                    angleField="count"
                                    colorField="creneau"
                                    innerRadius={0.6}
                                    height={260}
                                    label={{ text: 'creneau' }}
                                    tooltip={{ title: 'creneau', items: [{ field: 'count', name: 'Sessions' }] }}
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'membres',
                    label: 'Membres',
                    children: (
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-700" />
                            Membres
                          </h2>
                          <div className="flex items-center gap-3">
                            <div className="inline-flex rounded-md border border-zinc-200 overflow-hidden text-sm">
                              <button
                                type="button"
                                onClick={() => setMembersViewMode('vague')}
                                className={`px-3 py-1.5 font-medium transition-colors ${
                                  membersViewMode === 'vague' ? 'bg-blue-700 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
                                }`}
                              >
                                Membres de la vague
                              </button>
                              <button
                                type="button"
                                onClick={handleShowServerMembers}
                                className={`px-3 py-1.5 font-medium transition-colors border-l border-zinc-200 ${
                                  membersViewMode === 'serveur' ? 'bg-blue-700 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
                                }`}
                              >
                                Tous les membres du serveur
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={openAddMember}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
                            >
                              Ajouter un membre
                            </button>
                            {membersViewMode === 'vague' && (
                              <button
                                type="button"
                                onClick={handleBulkSyncObjectifs}
                                disabled={bulkSyncingObjectifs}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                                title="Récupère le contenu des posts objectifs Discord déjà rattachés"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${bulkSyncingObjectifs ? 'animate-spin' : ''}`} />
                                Synchroniser les objectifs
                              </button>
                            )}
                            <ExportButtons
                              tables={
                                membersViewMode === 'vague'
                                  ? [{
                                      title: 'Membres de la vague',
                                      headers: ['Nom', 'Profil', 'Certification / Projet', 'Objectif de vague', 'Post objectif rattaché', 'ID Discord'],
                                      rows: members.map((m) => [
                                        m.nom, m.profil, m.certif_ou_projet ?? '', m.objectif_vague ?? '',
                                        m.thread_objectif_id ?? '', m.discord_id,
                                      ]),
                                    }]
                                  : [{
                                      title: 'Membres du serveur Discord',
                                      headers: ['Nom', 'ID Discord', 'Inscrit à la vague'],
                                      rows: discordMembers.map((dm) => [
                                        dm.username, dm.discord_id, vagueDiscordIds.has(dm.discord_id) ? 'Oui' : 'Non',
                                      ]),
                                    }]
                              }
                              filenamePrefix={membersViewMode === 'vague' ? 'skillup-membres-vague' : 'skillup-membres-serveur'}
                              pdfTitle={membersViewMode === 'vague' ? 'Membres de la vague' : 'Membres du serveur Discord'}
                            />
                          </div>
                        </div>

                        {syncObjectifError && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{syncObjectifError}</div>
                        )}
                        {bulkSyncError && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{bulkSyncError}</div>
                        )}
                        {bulkSyncResults && (
                          <div className="mb-4 bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-zinc-700">
                                {bulkSyncResults.filter((r) => r.ok).length}/{bulkSyncResults.length} objectif(s) synchronisé(s)
                              </p>
                              <button
                                type="button"
                                onClick={() => setBulkSyncResults(null)}
                                className="text-zinc-400 hover:text-zinc-600"
                                aria-label="Fermer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {bulkSyncResults.length === 0 ? (
                              <p className="text-zinc-500">Aucun membre avec un post objectif rattaché.</p>
                            ) : (
                              <ul className="space-y-1">
                                {bulkSyncResults.map((r) => (
                                  <li key={r.discord_id} className={r.ok ? 'text-zinc-700' : 'text-red-700'}>
                                    {r.ok ? '✓' : '✗'} {r.nom} — {r.message}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {membersViewMode === 'vague' ? (
                          membersLoading ? (
                            <div className="py-10 flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                            </div>
                          ) : membersError ? (
                            <p className="text-sm text-zinc-600">{membersError}</p>
                          ) : members.length === 0 ? (
                            <EmptyState label="Aucun membre" />
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-zinc-200">
                                <thead className="bg-zinc-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Nom</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Profil</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Certification / Projet</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Objectif de vague</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Post objectif</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">ID Discord</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-zinc-200">
                                  {members.map((member) => (
                                    <tr key={member.id} className="hover:bg-zinc-50">
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-zinc-900">{member.nom}</td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                          {member.profil}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-zinc-700">{member.certif_ou_projet || '—'}</td>
                                      <td className="px-4 py-3 text-sm text-zinc-700 max-w-sm whitespace-pre-line">
                                        {member.objectif_vague ? member.objectif_vague : <span className="text-zinc-400 italic">Non défini</span>}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        {member.thread_objectif_id ? (
                                          <div className="flex flex-col gap-0.5">
                                            <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                              Rattaché
                                            </span>
                                            <span className="text-xs font-mono text-zinc-400">{member.thread_objectif_id}</span>
                                          </div>
                                        ) : (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600">
                                            Non rattaché
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-zinc-400">{member.discord_id}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right">
                                        <button
                                          type="button"
                                          onClick={() => openEditMember(member)}
                                          className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-blue-700 transition-colors"
                                          aria-label={`Éditer ${member.nom}`}
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openLinkThread(member)}
                                          className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-blue-700 transition-colors"
                                          aria-label={`Rattacher le post objectif de ${member.nom}`}
                                        >
                                          <Link2 className="w-4 h-4" />
                                        </button>
                                        {member.thread_objectif_id && (
                                          <button
                                            type="button"
                                            onClick={() => handleSyncMemberObjectif(member)}
                                            disabled={syncingObjectifDiscordId === member.discord_id}
                                            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-blue-700 disabled:opacity-50 transition-colors"
                                            aria-label={`Synchroniser l'objectif de ${member.nom} depuis Discord`}
                                            title="Synchroniser l'objectif depuis le post Discord"
                                          >
                                            <RefreshCw className={`w-4 h-4 ${syncingObjectifDiscordId === member.discord_id ? 'animate-spin' : ''}`} />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )
                        ) : discordMembersLoading ? (
                          <div className="py-10 flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                          </div>
                        ) : discordMembersError ? (
                          <p className="text-sm text-zinc-600">{discordMembersError}</p>
                        ) : discordMembers.length === 0 ? (
                          <EmptyState label="Aucun membre sur le serveur" />
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-zinc-200">
                              <thead className="bg-zinc-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Nom</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">ID Discord</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Statut</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-zinc-200">
                                {discordMembers.map((dm) => {
                                  const inWave = vagueDiscordIds.has(dm.discord_id);
                                  return (
                                    <tr key={dm.discord_id} className="hover:bg-zinc-50">
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-zinc-900">{dm.username}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-zinc-400">{dm.discord_id}</td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        {inWave ? (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Inscrit à la vague
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                            Pas inscrit à la vague
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'sessions',
                    label: 'Sessions',
                    children: (
                      <div className="pt-2 space-y-4">
                        <div className="flex items-center justify-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                          <button
                            type="button"
                            onClick={() => goToSessionsWeek((sessionsSelectedSemaine ?? adminCurrentSemaineNumber ?? 1) - 1)}
                            disabled={sessionsLoading || (sessionsSelectedSemaine ?? adminCurrentSemaineNumber ?? 1) <= 1}
                            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            aria-label="Semaine précédente"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-medium text-zinc-900 min-w-[7rem] text-center">
                            {sessionsSelectedSemaine !== null
                              ? `Semaine ${sessionsSelectedSemaine}`
                              : adminCurrentSemaineNumber !== null
                              ? `Semaine ${adminCurrentSemaineNumber} (actuelle)`
                              : 'Semaine actuelle'}
                          </span>
                          <button
                            type="button"
                            onClick={() => sessionsSelectedSemaine !== null && goToSessionsWeek(sessionsSelectedSemaine + 1)}
                            disabled={sessionsLoading || sessionsSelectedSemaine === null}
                            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            aria-label="Semaine suivante"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center flex-wrap gap-2">
                          <select
                            value={sessionsFilterMembre}
                            onChange={(e) => setSessionsFilterMembre(e.target.value)}
                            className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Tous les membres</option>
                            {sessionsMembresOptions.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <select
                            value={sessionsFilterSalon}
                            onChange={(e) => setSessionsFilterSalon(e.target.value)}
                            className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Tous les salons</option>
                            {sessionsSalonsOptions.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={sessionsFilterDate}
                            onChange={(e) => setSessionsFilterDate(e.target.value)}
                            className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={sessionsFilterCreneau}
                            onChange={(e) => setSessionsFilterCreneau(e.target.value)}
                            className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Tous les créneaux</option>
                            {sessionsCreneauxOptions.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <select
                            value={sessionsFilterStatut}
                            onChange={(e) => setSessionsFilterStatut(e.target.value)}
                            className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Tous les statuts</option>
                            {sessionsStatutsOptions.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {(sessionsFilterMembre || sessionsFilterSalon || sessionsFilterDate || sessionsFilterCreneau || sessionsFilterStatut) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSessionsFilterMembre('');
                                setSessionsFilterSalon('');
                                setSessionsFilterDate('');
                                setSessionsFilterCreneau('');
                                setSessionsFilterStatut('');
                              }}
                              className="text-sm text-zinc-500 hover:text-zinc-700"
                            >
                              Réinitialiser
                            </button>
                          )}
                          <div className="ml-auto flex items-center gap-2">
                            <button
                              type="button"
                              onClick={openCreateSession}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
                            >
                              <Clock className="w-4 h-4" /> Créer une session
                            </button>
                            <ExportButtons
                              tables={[{
                                title: 'Sessions',
                                headers: ['Date', 'Créneau', 'Membre', 'Statut', 'Salon', 'Objectif', 'Bilan', 'Blocages'],
                                rows: sessionsFiltered.map((s) => [
                                  formatDate(s.date), s.creneau, s.membre_nom ?? '', s.statut,
                                  s.canal_nom ?? '', s.objectif ?? '', s.bilan ?? '', s.blocages ?? '',
                                ]),
                              }]}
                              filenamePrefix="skillup-sessions"
                              pdfTitle="Sessions SkillUp"
                              pdfSubtitle={`${sessionsFiltered.length} session(s) — filtres actifs pris en compte`}
                            />
                          </div>
                        </div>

                        {sessionsLoading ? (
                          <div className="py-10 flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                          </div>
                        ) : sessionsError ? (
                          <p className="text-sm text-zinc-600">{sessionsError}</p>
                        ) : (
                          <SessionsTable
                            sessions={sessionsFiltered}
                            withMember
                            emptyLabel="Aucune session"
                            onEdit={openEdit}
                            onDelete={openDeleteSession}
                          />
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'binomes',
                    label: 'Binômes',
                    children: (
                      <div className="pt-2 space-y-4">
                        <div className="flex items-center justify-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                          <button
                            type="button"
                            onClick={() => goToBinomesWeek((binomesSelectedSemaine ?? adminCurrentSemaineNumber ?? 1) - 1)}
                            disabled={binomesLoading || (binomesSelectedSemaine ?? adminCurrentSemaineNumber ?? 1) <= 1}
                            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            aria-label="Semaine précédente"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-medium text-zinc-900 min-w-[7rem] text-center">
                            {binomesSelectedSemaine !== null
                              ? `Semaine ${binomesSelectedSemaine}`
                              : adminCurrentSemaineNumber !== null
                              ? `Semaine ${adminCurrentSemaineNumber} (actuelle)`
                              : 'Semaine actuelle'}
                          </span>
                          <button
                            type="button"
                            onClick={() => binomesSelectedSemaine !== null && goToBinomesWeek(binomesSelectedSemaine + 1)}
                            disabled={binomesLoading || binomesSelectedSemaine === null}
                            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            aria-label="Semaine suivante"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <h2 className="font-semibold text-blue-900">
                            Binômes {binomesSemaine !== null ? `— semaine ${binomesSemaine}` : ''}
                          </h2>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={openDefineBinome}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
                            >
                              Définir un binôme
                            </button>
                            <ExportButtons
                              tables={[{
                                title: 'Binômes',
                                headers: ['Membre A', 'Membre B'],
                                rows: binomes.map((b) => [b.nom_a, b.nom_b]),
                              }]}
                              filenamePrefix={`skillup-binomes-semaine-${binomesSemaine ?? 'courante'}`}
                              pdfTitle="Binômes SkillUp"
                              pdfSubtitle={binomesSemaine !== null ? `Semaine ${binomesSemaine}` : ''}
                            />
                          </div>
                        </div>

                        {binomesLoading ? (
                          <div className="py-10 flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                          </div>
                        ) : binomesError ? (
                          <p className="text-sm text-zinc-600">{binomesError}</p>
                        ) : binomes.length === 0 ? (
                          <EmptyState label="Aucun binôme cette semaine" />
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {binomes.map((binome, index) => {
                              const avatarUrlA = discordAvatars[members.find((m) => m.id === binome.membre_a)?.discord_id ?? ''];
                              const avatarUrlB = discordAvatars[members.find((m) => m.id === binome.membre_b)?.discord_id ?? ''];
                              return (
                              <div
                                key={`${binome.membre_a}-${binome.membre_b}`}
                                className="relative bg-gradient-to-br from-blue-50 to-purple-50 border border-zinc-200 rounded-xl p-4 pt-8"
                              >
                                <button
                                  type="button"
                                  onClick={() => { setRemovingBinome(binome); setRemoveError(''); }}
                                  className="absolute top-2.5 right-2.5 p-1.5 rounded-md text-zinc-400 hover:bg-white hover:text-red-600 transition-colors"
                                  aria-label={`Retirer le binôme ${binome.nom_a} / ${binome.nom_b}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 min-w-0 flex flex-col items-center gap-1.5 text-center">
                                    {avatarUrlA ? (
                                      <img
                                        src={avatarUrlA}
                                        alt={binome.nom_a}
                                        className="w-11 h-11 rounded-full object-cover shadow-sm"
                                      />
                                    ) : (
                                      <div
                                        className={`w-11 h-11 rounded-full ${avatarColor(index * 2)} text-white flex items-center justify-center text-sm font-semibold shadow-sm`}
                                      >
                                        {getInitials(binome.nom_a)}
                                      </div>
                                    )}
                                    <span className="text-sm font-medium text-zinc-900 truncate max-w-full">{binome.nom_a}</span>
                                  </div>
                                  <Users className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0 flex flex-col items-center gap-1.5 text-center">
                                    {avatarUrlB ? (
                                      <img
                                        src={avatarUrlB}
                                        alt={binome.nom_b}
                                        className="w-11 h-11 rounded-full object-cover shadow-sm"
                                      />
                                    ) : (
                                      <div
                                        className={`w-11 h-11 rounded-full ${avatarColor(index * 2 + 1)} text-white flex items-center justify-center text-sm font-semibold shadow-sm`}
                                      >
                                        {getInitials(binome.nom_b)}
                                      </div>
                                    )}
                                    <span className="text-sm font-medium text-zinc-900 truncate max-w-full">{binome.nom_b}</span>
                                  </div>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'vagues',
                    label: 'Vagues',
                    children: (
                      <div className="pt-2 space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-blue-900">Vagues</h2>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={openCreateVague}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
                              >
                                Créer une vague
                              </button>
                              <ExportButtons
                                tables={[{
                                  title: 'Vagues',
                                  headers: ['Nom', 'Début', 'Fin', 'Statut'],
                                  rows: vaguesAdminList.map((v) => [v.nom, v.date_debut, v.date_fin, v.statut]),
                                }]}
                                filenamePrefix="skillup-vagues"
                                pdfTitle="Vagues SkillUp"
                              />
                            </div>
                          </div>
                          {vagueActionError && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                              {vagueActionError}
                            </div>
                          )}
                          {vaguesAdminLoading ? (
                            <div className="py-10 flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                            </div>
                          ) : vaguesAdminError ? (
                            <p className="text-sm text-zinc-600">{vaguesAdminError}</p>
                          ) : vaguesAdminList.length === 0 ? (
                            <EmptyState label="Aucune vague" />
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-zinc-200">
                                <thead className="bg-zinc-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Nom</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Début</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Fin</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-zinc-200">
                                  {vaguesAdminList.map((v) => (
                                    <tr key={v.id} className="hover:bg-zinc-50">
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-zinc-900">{v.nom}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-700">{v.date_debut}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-700">{v.date_fin}</td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                                            v.statut === 'active'
                                              ? 'bg-green-100 text-green-800'
                                              : v.statut === 'brouillon'
                                              ? 'bg-zinc-100 text-zinc-700'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {v.statut}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right">
                                        {v.statut === 'brouillon' && (
                                          <button
                                            type="button"
                                            onClick={() => handleActivateVague(v.id)}
                                            disabled={vagueActionLoadingId === v.id}
                                            className="px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 disabled:opacity-50 transition-colors"
                                          >
                                            {vagueActionLoadingId === v.id ? '...' : 'Activer'}
                                          </button>
                                        )}
                                        {v.statut === 'active' && (
                                          <button
                                            type="button"
                                            onClick={() => { setClosingVague(v); setCloseVagueError(''); }}
                                            className="px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                                          >
                                            Clôturer
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-blue-900">Salons de coworking</h2>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={openAddSalon}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
                              >
                                Rattacher un salon
                              </button>
                              <ExportButtons
                                tables={[{
                                  title: 'Salons de coworking',
                                  headers: ['Salon', 'ID', 'Vague', 'Statut'],
                                  rows: salonsList.map((s) => [s.canal_nom, s.canal_id, s.wave_nom, s.actif ? 'actif' : 'inactif']),
                                }]}
                                filenamePrefix="skillup-salons"
                                pdfTitle="Salons de coworking SkillUp"
                              />
                            </div>
                          </div>
                          {salonsLoading ? (
                            <div className="py-10 flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                            </div>
                          ) : salonsError ? (
                            <p className="text-sm text-zinc-600">{salonsError}</p>
                          ) : salonsList.length === 0 ? (
                            <EmptyState label="Aucun salon de coworking" />
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-zinc-200">
                                <thead className="bg-zinc-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Salon</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Vague</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-zinc-200">
                                  {salonsList.map((s) => (
                                    <tr key={`${s.canal_id}-${s.wave_nom}`} className="hover:bg-zinc-50">
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-zinc-900">{s.canal_nom}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-zinc-400">{s.canal_id}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-700">{s.wave_nom}</td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                                            s.actif ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'
                                          }`}
                                        >
                                          {s.actif ? 'actif' : 'inactif'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right">
                                        {s.actif && (
                                          <button
                                            type="button"
                                            onClick={() => { setRemovingSalon(s); setRemoveSalonError(''); }}
                                            className="p-1.5 rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            aria-label={`Retirer ${s.canal_nom}`}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-blue-900">Tous les salons vocaux du serveur</h2>
                            <button
                              type="button"
                              onClick={loadAllVoiceChannels}
                              disabled={allVoiceChannelsLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Actualiser
                            </button>
                          </div>
                          <p className="text-xs text-zinc-500 mb-3">
                            Salons vocaux existants sur Discord — pas seulement ceux rattachés à une vague comme
                            salon de coworking (cf. tableau ci-dessus).
                          </p>
                          {allVoiceChannelsLoading ? (
                            <div className="py-10 flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                            </div>
                          ) : allVoiceChannelsError ? (
                            <p className="text-sm text-zinc-600">{allVoiceChannelsError}</p>
                          ) : allVoiceChannels.length === 0 ? (
                            <EmptyState label="Aucun salon vocal sur le serveur" />
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-zinc-200">
                                <thead className="bg-zinc-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Salon</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Statut</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-zinc-200">
                                  {allVoiceChannels.map((c) => {
                                    const rattache = activeVagueLinkedCanalIds.has(c.channel_id);
                                    return (
                                      <tr key={c.channel_id} className="hover:bg-zinc-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-zinc-900">{c.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-zinc-400">{c.channel_id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                                              rattache ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'
                                            }`}
                                          >
                                            {rattache ? 'Rattaché à la vague active' : 'Non rattaché'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'bilans',
                    label: 'Bilans',
                    children: (
                      <div className="pt-2 space-y-6">
                        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                            <h3 className="font-semibold text-blue-900">Bilans hebdomadaires — tous les membres</h3>
                            <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-md px-1">
                              <button
                                type="button"
                                onClick={() => setBilanSemaineNum((s) => Math.max(1, s - 1))}
                                disabled={bilanSemaineNum <= 1}
                                className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                aria-label="Semaine précédente"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-sm font-medium text-zinc-900 min-w-[9rem] text-center">
                                Semaine {bilanSemaineNum}
                                {adminCurrentSemaineNumber === bilanSemaineNum ? ' (actuelle)' : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => setBilanSemaineNum((s) => s + 1)}
                                className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                                aria-label="Semaine suivante"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {bilansSemaineAllLoading ? (
                            <div className="py-8 flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
                            </div>
                          ) : bilansSemaineAllError ? (
                            <p className="text-sm text-zinc-600">{bilansSemaineAllError}</p>
                          ) : bilansSemaineAll.length === 0 ? (
                            <EmptyState label="Aucun membre" />
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-zinc-200">
                                <thead className="bg-zinc-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Membre</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Bilan</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-zinc-200">
                                  {bilansSemaineAll.map((b) => (
                                    <tr key={b.discord_id} className={`hover:bg-zinc-50 ${b.discord_id === bilanMembreDiscordId ? 'bg-blue-50/50' : ''}`}>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-zinc-900">{b.nom}</td>
                                      <td className="px-4 py-3 text-sm text-zinc-700 max-w-md whitespace-pre-line">
                                        {b.texte ? b.texte : <span className="text-zinc-400 italic">Pas encore rédigé</span>}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right">
                                        <button
                                          type="button"
                                          onClick={() => setBilanMembreDiscordId(b.discord_id)}
                                          className="px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                                        >
                                          {b.texte ? 'Éditer' : 'Rédiger'}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  },
                ]}
            />
          </div>
        )}
      </div>

      {bilanMembreDiscordId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setBilanMembreDiscordId('')}
        >
          <div
            className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-blue-900">
                {members.find((m) => m.discord_id === bilanMembreDiscordId)?.nom ?? 'Membre'}
              </h2>
              <button
                onClick={() => setBilanMembreDiscordId('')}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-900">Bilan hebdomadaire — semaine {bilanSemaineNum}</h3>

                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm text-zinc-700">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Résumé informatif — à copier/adapter, non enregistré ici
                    </p>
                    {bilanInfoSemaine && <CopyButton text={bilanInfoToText(bilanInfoSemaine)} />}
                  </div>
                  {bilanInfoSemaineLoading ? (
                    <p className="text-zinc-400">Chargement…</p>
                  ) : bilanInfoSemaine ? (
                    <div className="space-y-1">
                      <p>{bilanInfoSemaine.nb_sessions} session(s) — {bilanInfoSemaine.nb_completes} complète(s), {bilanInfoSemaine.nb_incompletes} incomplète(s) — durée totale {bilanInfoSemaine.duree_totale}</p>
                      {bilanInfoSemaine.blocages.length > 0 && (
                        <p>Blocages : {bilanInfoSemaine.blocages.join(' ; ')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-zinc-400">Aucune session pour cette semaine.</p>
                  )}
                </div>

                {bilanSemaineError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{bilanSemaineError}</div>
                )}
                <textarea
                  value={bilanSemaineTexte}
                  onChange={(e) => setBilanSemaineTexte(e.target.value)}
                  disabled={bilanSemaineLoading}
                  rows={5}
                  placeholder="Bilan de la semaine — rédigé à la main par l'admin."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveBilanSemaine}
                    disabled={bilanSemaineSaving || bilanSemaineLoading}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
                  >
                    {bilanSemaineSaving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <h3 className="font-semibold text-blue-900">Bilan de vague</h3>

                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm text-zinc-700">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Résumé informatif — à copier/adapter, non enregistré ici
                    </p>
                    {bilanInfoVague && <CopyButton text={bilanInfoToText(bilanInfoVague)} />}
                  </div>
                  {bilanInfoVagueLoading ? (
                    <p className="text-zinc-400">Chargement…</p>
                  ) : bilanInfoVague ? (
                    <div className="space-y-1">
                      <p>{bilanInfoVague.nb_sessions} session(s) — {bilanInfoVague.nb_completes} complète(s), {bilanInfoVague.nb_incompletes} incomplète(s) — durée totale {bilanInfoVague.duree_totale}</p>
                      {bilanInfoVague.blocages.length > 0 && (
                        <p>Blocages : {bilanInfoVague.blocages.join(' ; ')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-zinc-400">Aucune session pour cette vague.</p>
                  )}
                </div>

                {bilanVagueError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{bilanVagueError}</div>
                )}
                <textarea
                  value={bilanVagueTexte}
                  onChange={(e) => setBilanVagueTexte(e.target.value)}
                  disabled={bilanVagueLoading}
                  rows={6}
                  placeholder="Bilan de synthèse de la vague — rédigé à la main par l'admin."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveBilanVague}
                    disabled={bilanVagueSaving || bilanVagueLoading}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
                  >
                    {bilanVagueSaving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingSession && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setEditingSession(null)}
        >
          <div
            className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Corriger la session #{editingSession.id}
              </h2>
              <button
                onClick={() => setEditingSession(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Créneau</label>
                <input
                  type="text"
                  value={editSessionForm.creneau}
                  onChange={(e) => setEditSessionForm((f) => ({ ...f, creneau: e.target.value }))}
                  placeholder="Ex: 19h-21h"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Objectif</label>
                <textarea
                  value={editSessionForm.objectif}
                  onChange={(e) => setEditSessionForm((f) => ({ ...f, objectif: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Bilan</label>
                <textarea
                  value={editSessionForm.bilan}
                  onChange={(e) => setEditSessionForm((f) => ({ ...f, bilan: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Blocages</label>
                <textarea
                  value={editSessionForm.blocages}
                  onChange={(e) => setEditSessionForm((f) => ({ ...f, blocages: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {editSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Supprimer cette session ?</h3>
            <p className="text-gray-600 text-sm mb-4">
              Session #{deletingSession.id}{deletingSession.membre_nom ? ` — ${deletingSession.membre_nom}` : ''}
              {' '}({formatDate(deletingSession.date)}, {deletingSession.creneau}). Cette action est irréversible.
            </p>
            {deleteError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingSession(null)}
                disabled={deleteSaving}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60"
              >
                {deleteSaving ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingObjectif && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-blue-900">Mon objectif de vague</h2>
              <button onClick={() => setEditingObjectif(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {objectifError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {objectifError}
                </div>
              )}
              <textarea
                value={objectifValeur}
                onChange={(e) => setObjectifValeur(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ton objectif pour cette vague..."
              />
              <p className="text-xs text-zinc-500">
                Le fil du forum Discord <code>objectifs</code> n'est pas mis à jour automatiquement — utilise{' '}
                <code>/objectif-vague</code> sur Discord si tu veux aussi synchroniser ton post.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingObjectif(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveObjectif}
                  disabled={objectifSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {objectifSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {definingBinome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                <Users className="w-4 h-4" /> Définir un binôme
              </h2>
              <button onClick={() => setDefiningBinome(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {defineSuccess ? (
              <div className="px-6 py-5 space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                  Binôme créé : <strong>{defineSuccess.nomA}</strong> ↔ <strong>{defineSuccess.nomB}</strong>
                  {' '}(semaine {defineSuccess.semaine}).
                </div>
                {defineSuccess.dmEchecs.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
                    DM non délivré à : {defineSuccess.dmEchecs.join(', ')} (DMs probablement fermés).
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setDefiningBinome(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                {defineError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {defineError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Semaine</label>
                  <input
                    type="number"
                    min={1}
                    value={defineSemaine}
                    onChange={(e) => setDefineSemaine(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Membre A
                    {defineSemaineLoading && <span className="text-zinc-400 font-normal"> (vérification...)</span>}
                  </label>
                  <select
                    value={defineMembreA}
                    onChange={(e) => setDefineMembreA(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choisir un membre</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.discord_id} disabled={pairedMemberIds.has(m.id)}>
                        {m.nom}{pairedMemberIds.has(m.id) ? ' — déjà en binôme' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Membre B
                    {defineSemaineLoading && <span className="text-zinc-400 font-normal"> (vérification...)</span>}
                  </label>
                  <select
                    value={defineMembreB}
                    onChange={(e) => setDefineMembreB(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choisir un membre</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.discord_id} disabled={pairedMemberIds.has(m.id)}>
                        {m.nom}{pairedMemberIds.has(m.id) ? ' — déjà en binôme' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDefiningBinome(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDefineBinome}
                    disabled={defineSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {defineSaving ? 'Création...' : 'Définir'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {removingBinome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Retirer ce binôme ?</h3>
            <p className="text-gray-600 text-sm mb-4">
              {removingBinome.nom_a} ↔ {removingBinome.nom_b}
              {binomesSemaine !== null ? ` (semaine ${binomesSemaine})` : ''}. Les deux membres seront prévenus par DM.
            </p>
            {removeError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {removeError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRemovingBinome(null)}
                disabled={removeSaving}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRemoveBinome}
                disabled={removeSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60"
              >
                {removeSaving ? 'Retrait...' : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {addingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                <Users className="w-4 h-4" /> Ajouter un membre
              </h2>
              <button onClick={() => setAddingMember(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {addSuccess ? (
              <div className="px-6 py-5 space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                  <strong>{addSuccess.nom}</strong> ajouté(e) à la vague.
                </div>
                {!addSuccess.dmOk && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
                    DM de bienvenue non délivré (DMs probablement fermés).
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setAddingMember(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                {addError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {addError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Membre Discord</label>
                  {discordMembersLoading ? (
                    <div className="text-sm text-zinc-500 py-2">Chargement des membres du serveur...</div>
                  ) : (
                    <select
                      value={addDiscordId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setAddDiscordId(id);
                        const dm = addMemberOptions.find((m) => m.discord_id === id);
                        if (dm && !addNom) setAddNom(dm.username);
                      }}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un membre...</option>
                      {addMemberOptions.map((dm) => (
                        <option key={dm.discord_id} value={dm.discord_id}>{dm.username}</option>
                      ))}
                    </select>
                  )}
                  {discordMembersError && (
                    <p className="text-xs text-red-600 mt-1">{discordMembersError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={addNom}
                    onChange={(e) => setAddNom(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Profil</label>
                  <select
                    value={addProfil}
                    onChange={(e) => setAddProfil(e.target.value as SkillupProfil)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SKILLUP_PROFILS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Certification / Projet (optionnel)</label>
                  <input
                    type="text"
                    value={addCertif}
                    onChange={(e) => setAddCertif(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddingMember(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={addSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {addSaving ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {creatingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Créer une session (rattrapage)
              </h2>
              <button onClick={() => setCreatingSession(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {createSessionSuccess ? (
              <div className="px-6 py-5 space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                  Session #{createSessionSuccess.id} créée.
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setCreatingSession(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                {createSessionError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {createSessionError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Membre <span className="text-red-500">*</span></label>
                    <select
                      value={createSessionDiscordId}
                      onChange={(e) => setCreateSessionDiscordId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner...</option>
                      {members.map((m) => (
                        <option key={m.discord_id} value={m.discord_id}>{m.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Salon (optionnel)</label>
                    <select
                      value={createSessionCanalId}
                      onChange={(e) => setCreateSessionCanalId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Aucun</option>
                      {salonsList.filter((s) => s.actif).map((s) => (
                        <option key={s.canal_id} value={s.canal_id}>{s.canal_nom}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={createSessionDate}
                      onChange={(e) => setCreateSessionDate(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Créneau <span className="text-red-500">*</span></label>
                    <select
                      value={createSessionCreneau}
                      onChange={(e) => setCreateSessionCreneau(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {createSessionCreneauOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__autre__">Autre...</option>
                    </select>
                    {createSessionCreneau === '__autre__' && (
                      <input
                        type="text"
                        value={createSessionCreneauAutre}
                        onChange={(e) => setCreateSessionCreneauAutre(e.target.value)}
                        placeholder="Ex: 17h-19h"
                        className="w-full mt-2 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Heure début <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      value={createSessionHeureDebut}
                      onChange={(e) => setCreateSessionHeureDebut(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Heure fin (optionnel)</label>
                    <input
                      type="time"
                      value={createSessionHeureFin}
                      onChange={(e) => setCreateSessionHeureFin(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Objectif (optionnel)</label>
                  <textarea
                    value={createSessionObjectif}
                    onChange={(e) => setCreateSessionObjectif(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Bilan (optionnel — sinon statut "incomplète")</label>
                  <textarea
                    value={createSessionBilan}
                    onChange={(e) => setCreateSessionBilan(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Blocages (optionnel)</label>
                  <textarea
                    value={createSessionBlocages}
                    onChange={(e) => setCreateSessionBlocages(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreatingSession(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSession}
                    disabled={createSessionSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {createSessionSaving ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editingMember && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setEditingMember(null)}
        >
          <div
            className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Éditer {editingMember.nom}
              </h2>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {editMemberError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {editMemberError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={editMemberForm.nom}
                  onChange={(e) => setEditMemberForm((f) => ({ ...f, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Profil</label>
                <select
                  value={editMemberForm.profil}
                  onChange={(e) => setEditMemberForm((f) => ({ ...f, profil: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SKILLUP_PROFILS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Certification / Projet</label>
                <input
                  type="text"
                  value={editMemberForm.certif_ou_projet}
                  onChange={(e) => setEditMemberForm((f) => ({ ...f, certif_ou_projet: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Objectif de vague</label>
                <textarea
                  value={editMemberForm.objectif_vague}
                  onChange={(e) => setEditMemberForm((f) => ({ ...f, objectif_vague: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditMember}
                  disabled={editMemberSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {editMemberSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {linkingThreadMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Rattacher le post objectif de {linkingThreadMember.nom}
              </h2>
              <button onClick={() => setLinkingThreadMember(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {linkThreadSuccess ? (
              <div className="px-6 py-5 space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                  Post objectif rattaché.
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setLinkingThreadMember(null)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                {linkThreadError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {linkThreadError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Lien ou ID du post</label>
                  <input
                    type="text"
                    value={linkThreadValeur}
                    onChange={(e) => setLinkThreadValeur(e.target.value)}
                    placeholder="https://discord.com/channels/... ou ID brut"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setLinkingThreadMember(null)}
                    className="px-4 py-2 text-sm text-gray-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLinkThread}
                    disabled={linkThreadSaving || !linkThreadValeur.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {linkThreadSaving ? 'Rattachement...' : 'Rattacher'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {creatingVague && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-blue-900">Créer une vague</h2>
              <button onClick={() => setCreatingVague(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {createVagueError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {createVagueError}
                </div>
              )}
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
                Créée en brouillon — utilise "Activer" ensuite pour la rendre active.
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={createVagueNom}
                  onChange={(e) => setCreateVagueNom(e.target.value)}
                  placeholder="Ex: Vague Septembre 2026"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Début</label>
                  <input
                    type="date"
                    value={createVagueDebut}
                    onChange={(e) => setCreateVagueDebut(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Fin</label>
                  <input
                    type="date"
                    value={createVagueFin}
                    onChange={(e) => setCreateVagueFin(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreatingVague(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateVague}
                  disabled={createVagueSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {createVagueSaving ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {closingVague && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Clôturer cette vague ?</h3>
            <p className="text-gray-600 text-sm mb-4">
              La vague <strong>{closingVague.nom}</strong> passera au statut "clôturée". Cette action est irréversible.
            </p>
            {closeVagueError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {closeVagueError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setClosingVague(null)}
                disabled={closeVagueSaving}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmCloseVague}
                disabled={closeVagueSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60"
              >
                {closeVagueSaving ? 'Clôture...' : 'Clôturer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {addingSalon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-blue-900">Rattacher un salon à la vague</h2>
              <button onClick={() => setAddingSalon(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addSalonError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {addSalonError}
                </div>
              )}
              <p className="text-xs text-zinc-500">
                Sélectionne un salon vocal déjà existant sur le serveur — il sera enregistré comme
                salon de coworking pour la vague active. Ça ne crée rien sur Discord.
              </p>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Salon vocal
                  {voiceChannelsLoading && <span className="text-zinc-400 font-normal"> (chargement...)</span>}
                </label>
                {voiceChannelsError ? (
                  <p className="text-sm text-red-600">{voiceChannelsError}</p>
                ) : (
                  <>
                    <select
                      value={addSalonCanalId}
                      onChange={(e) => setAddSalonCanalId(e.target.value)}
                      disabled={voiceChannelsLoading}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choisir un salon</option>
                      {voiceChannels
                        .filter((c) => !activeVagueLinkedCanalIds.has(c.channel_id))
                        .map((c) => (
                          <option key={c.channel_id} value={c.channel_id}>{c.name}</option>
                        ))}
                    </select>
                    {!voiceChannelsLoading &&
                      voiceChannels.length > 0 &&
                      voiceChannels.every((c) => activeVagueLinkedCanalIds.has(c.channel_id)) && (
                        <p className="text-xs text-zinc-500 mt-1">
                          Tous les salons vocaux du serveur sont déjà rattachés à cette vague.
                        </p>
                      )}
                  </>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddingSalon(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddSalon}
                  disabled={addSalonSaving || voiceChannelsLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addSalonSaving ? 'Rattachement...' : 'Rattacher'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {removingSalon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Retirer ce salon ?</h3>
            <p className="text-gray-600 text-sm mb-4">
              <strong>{removingSalon.canal_nom}</strong> ne sera plus considéré comme salon de coworking pour la vague <strong>{removingSalon.wave_nom}</strong>.
            </p>
            {removeSalonError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {removeSalonError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRemovingSalon(null)}
                disabled={removeSalonSaving}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRemoveSalon}
                disabled={removeSalonSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60"
              >
                {removeSalonSaving ? 'Retrait...' : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillUp;
