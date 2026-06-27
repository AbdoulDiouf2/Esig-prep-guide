/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { ArrowLeft, Info, Upload, AlertTriangle, FileText, ClipboardList, Mail, Search, CheckCircle, XCircle, AlertCircle, Plus, X } from 'lucide-react';
import { getRecensement, getRecensements, createRecensement, updateRecensementStats } from '../../services/recensementService';
import { Recensement } from '../../types/recensement';
import FileUploader from '../../components/admin/FileUploader';
import ImportProgress from '../../components/admin/ImportProgress';
import ImportReport from '../../components/admin/ImportReport';
import { parseCSV, parseXLSX, cleanEmail, extractYearPromo } from '../../utils/fileParser';
import { importAlumniFromFile, ImportAlumniData, ImportResult, importEmailsOnly, MinimalImportEntry, EmailImportResult } from '../../services/alumniService';

// ─── Mapping dynamique ───────────────────────────────────────────────────────

interface FieldMapping {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  yearPromo: string;
  city: string;
  position: string;
  sectors: string;
  expertise: string;
  bio: string;
}

const EMPTY_MAPPING: FieldMapping = {
  email: '', firstName: '', lastName: '', displayName: '',
  yearPromo: '', city: '', position: '', sectors: '', expertise: '', bio: '',
};

const SYSTEM_FIELDS: Array<{ key: keyof FieldMapping; label: string; required?: boolean; hint?: string }> = [
  { key: 'email',       label: 'Email',                required: true },
  { key: 'firstName',   label: 'Prénom',               hint: 'ou utiliser "Nom complet"' },
  { key: 'lastName',    label: 'Nom de famille',        hint: 'ou utiliser "Nom complet"' },
  { key: 'displayName', label: 'Nom complet',           hint: 'si prénom+nom dans une seule colonne' },
  { key: 'yearPromo',   label: 'Année de promotion' },
  { key: 'city',        label: 'Ville' },
  { key: 'position',    label: 'Poste occupé / recherché' },
  { key: 'sectors',     label: 'Domaine(s)' },
  { key: 'expertise',   label: 'Expertise / précision' },
  { key: 'bio',         label: 'Bio / Commentaire' },
];

const AUTO_DETECT_HINTS: Record<keyof FieldMapping, string[]> = {
  email:       ['mail', 'email', 'e-mail', 'courriel', 'adresse'],
  firstName:   ['prénom', 'prenom', 'first name', 'firstname', 'given name'],
  lastName:    ['nom de famille', 'last name', 'lastname', 'surname'],
  displayName: ['nom complet', 'full name', 'nom et prénom', 'prénom et nom'],
  yearPromo:   ['promo', 'promotion', 'année', 'year', 'sortie cpc'],
  city:        ['ville', 'city', 'location', 'localisation'],
  position:    ['poste', 'position', 'job', 'emploi'],
  sectors:     ['domaine', 'secteur', 'sector'],
  expertise:   ['précision', 'expertise', 'spécialité'],
  bio:         ['bio', 'commentaire', 'about', 'présentation', 'description'],
};

function autoDetectMapping(headers: string[]): FieldMapping {
  const mapping: FieldMapping = { ...EMPTY_MAPPING };
  const lowerHeaders = headers.map(h => h.toLowerCase());

  // "Nom" seul → lastName (pas displayName)
  for (const [field, hints] of Object.entries(AUTO_DETECT_HINTS) as Array<[keyof FieldMapping, string[]]>) {
    for (const hint of hints) {
      const idx = lowerHeaders.findIndex(h => h.includes(hint));
      if (idx !== -1 && !mapping[field]) {
        mapping[field] = headers[idx];
        break;
      }
    }
  }
  // Si "Nom" détecté comme lastName ET aucun prénom → essayer colonne "Nom" seul comme lastName
  const nomIdx = lowerHeaders.findIndex(h => h === 'nom');
  if (nomIdx !== -1 && !mapping.lastName) mapping.lastName = headers[nomIdx];

  return mapping;
}

function applyMapping(
  rows: Record<string, any>[],
  mapping: FieldMapping
): { data: ImportAlumniData[]; errors: Array<{ row: number; email: string; error: string }> } {
  const data: ImportAlumniData[] = [];
  const errors: Array<{ row: number; email: string; error: string }> = [];
  const parseSectors = (val: string): string[] =>
    val ? val.split(/,|\set\s/i).map(s => s.trim()).filter(Boolean) : [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const email = cleanEmail(String(row[mapping.email] || ''));

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: rowNumber, email: email || 'N/A', error: 'Email manquant ou invalide' });
      return;
    }

    let name = '';
    if (mapping.displayName) {
      name = String(row[mapping.displayName] || '').trim();
    } else {
      const first = mapping.firstName ? String(row[mapping.firstName] || '').trim() : '';
      const last  = mapping.lastName  ? String(row[mapping.lastName]  || '').trim() : '';
      name = `${first} ${last}`.trim();
    }

    if (!name) {
      errors.push({ row: rowNumber, email, error: 'Nom manquant' });
      return;
    }

    data.push({
      name,
      email,
      yearPromo: mapping.yearPromo ? extractYearPromo(row[mapping.yearPromo]) : 0,
      city:      mapping.city      ? String(row[mapping.city]      || '') : '',
      position:  mapping.position  ? String(row[mapping.position]  || '') : '',
      sectors:   mapping.sectors   ? parseSectors(String(row[mapping.sectors]   || '')) : [],
      expertise: mapping.expertise ? [String(row[mapping.expertise] || '')].filter(s => s.trim()) : [],
      bio:       mapping.bio       ? String(row[mapping.bio]       || '') : '',
    });
  });

  return { data, errors };
}

// ─── Helpers import simplifié ────────────────────────────────────────────────

function parseTextEntries(raw: string): MinimalImportEntry[] {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const lastComma = line.lastIndexOf(',');
      if (lastComma === -1) return null;
      return {
        name: line.slice(0, lastComma).trim(),
        email: line.slice(lastComma + 1).trim().toLowerCase(),
      };
    })
    .filter(Boolean) as MinimalImportEntry[];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type EntryStatus = 'valid' | 'exists' | 'invalid_email' | 'invalid_name' | 'duplicate';

interface PreviewEntry extends MinimalImportEntry {
  status: EntryStatus;
}

// ─────────────────────────────────────────────────────────────────────────────

const ImportAlumni: React.FC = () => {
  const { currentUser } = useAuth();
  const canImport = usePermission('alumni.validate');
  const [searchParams] = useSearchParams();
  const recensementIdParam = searchParams.get('recensementId');
  const [selectedRecensementId, setSelectedRecensementId] = useState<string | null>(recensementIdParam);
  const recensementId = selectedRecensementId;
  const [recensement, setRecensement] = useState<Recensement | null>(null);
  const [allRecensements, setAllRecensements] = useState<Recensement[]>([]);
  const [showNewRecensement, setShowNewRecensement] = useState(false);
  const [newRecForm, setNewRecForm] = useState({ title: '', year: new Date().getFullYear(), closedAt: '' });
  const [creatingRec, setCreatingRec] = useState(false);

  // Mode : 'fichier' | 'simplifie'
  const [importMode, setImportMode] = useState<'fichier' | 'simplifie'>('fichier');

  // États mode fichier
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({ ...EMPTY_MAPPING });
  const [fichierStep, setFichierStep] = useState<'upload' | 'mapping' | 'processing' | 'completed'>('upload');
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [fichierSendEmail, setFichierSendEmail] = useState(false);

  // États mode simplifié
  const [simpleText, setSimpleText] = useState('');
  const [simplePreview, setSimplePreview] = useState<PreviewEntry[]>([]);
  const [simplePreviewed, setSimplePreviewed] = useState(false);
  const [simpleYearPromo, setSimpleYearPromo] = useState<number>(0);
  const [simpleSendEmail, setSimpleSendEmail] = useState(true);
  const [simpleStatus, setSimpleStatus] = useState<'idle' | 'checking' | 'processing' | 'completed' | 'error'>('idle');
  const [simpleProgress, setSimpleProgress] = useState({ current: 0, total: 0 });
  const [simpleResult, setSimpleResult] = useState<EmailImportResult | null>(null);

  useEffect(() => {
    getRecensements().then(setAllRecensements);
  }, []);

  useEffect(() => {
    if (selectedRecensementId) {
      getRecensement(selectedRecensementId).then(r => setRecensement(r));
    } else {
      setRecensement(null);
    }
  }, [selectedRecensementId]);

  const handleFileSelect = async (file: File) => {
    setParseError('');
    setRawHeaders([]);
    setRawRows([]);

    try {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      let result;

      if (ext === '.csv') result = await parseCSV(file);
      else if (ext === '.xlsx') result = await parseXLSX(file);
      else { setParseError('Format de fichier non supporté'); return; }

      if (result.errors.length > 0) {
        setParseError(`${result.errors.length} erreur(s) de parsing détectée(s)`);
      }

      const rows = result.data as Record<string, any>[];
      setRawHeaders(result.headers);
      setRawRows(rows);
      setFieldMapping(autoDetectMapping(result.headers));
      if (rows.length > 0) setFichierStep('mapping');
    } catch (error: any) {
      setParseError(error.message || 'Erreur lors de la lecture du fichier');
    }
  };

  const handleStartImport = async () => {
    if (rawRows.length === 0) return;

    setFichierStep('processing');
    setImportStatus('processing');
    setImportProgress({ current: 0, total: rawRows.length });

    try {
      const { data: dataToImport, errors: validationErrors } = applyMapping(rawRows, fieldMapping);

      const result = await importAlumniFromFile(
        dataToImport,
        (current, total) => { setImportProgress({ current, total }); },
        { sendActivationEmail: fichierSendEmail }
      );

      result.errors.push(...validationErrors);

      if (recensementId) {
        try {
          await updateRecensementStats(recensementId, {
            totalForms: recensement?.stats.totalForms ?? rawRows.length,
            newAccounts: result.success,
            updatedAccounts: result.updated,
            alreadyExisted: result.skipped,
            errors: result.errors.length,
          });
        } catch (e) {
          console.error('Erreur mise à jour recensement:', e);
        }
      }

      setImportResult(result);
      setImportStatus('completed');
      setFichierStep('completed');
    } catch (error: any) {
      console.error('Erreur import:', error);
      setImportStatus('error');
      setParseError(error.message || 'Erreur lors de l\'import');
    }
  };

  const handleCreateRecensement = async () => {
    if (!newRecForm.title.trim() || !newRecForm.closedAt) return;
    setCreatingRec(true);
    try {
      const { Timestamp } = await import('firebase/firestore');
      const id = await createRecensement(
        {
          title: newRecForm.title.trim(),
          year: newRecForm.year,
          closedAt: Timestamp.fromDate(new Date(newRecForm.closedAt)),
          notes: '',
          totalForms: 0,
        },
        currentUser!.uid
      );
      const updated = await getRecensements();
      setAllRecensements(updated);
      setSelectedRecensementId(id);
      setShowNewRecensement(false);
      setNewRecForm({ title: '', year: new Date().getFullYear(), closedAt: '' });
    } finally {
      setCreatingRec(false);
    }
  };

  const handleNewImport = () => {
    setRawHeaders([]);
    setRawRows([]);
    setFieldMapping({ ...EMPTY_MAPPING });
    setFichierStep('upload');
    setImportStatus('idle');
    setImportProgress({ current: 0, total: 0 });
    setImportResult(null);
    setParseError('');
  };

  // ─── Handlers mode simplifié ──────────────────────────────────────────────

  const handleAnalyze = async () => {
    const raw = parseTextEntries(simpleText);
    const seen = new Set<string>();
    const preview: PreviewEntry[] = raw.map(entry => {
      if (!isValidEmail(entry.email)) return { ...entry, status: 'invalid_email' as EntryStatus };
      if (!entry.name) return { ...entry, status: 'invalid_name' as EntryStatus };
      if (seen.has(entry.email)) return { ...entry, status: 'duplicate' as EntryStatus };
      seen.add(entry.email);
      return { ...entry, status: 'valid' as EntryStatus };
    });

    // Vérifier les emails existants en Firestore
    setSimpleStatus('checking');
    const { getDocs, query, collection, where } = await import('firebase/firestore');
    const { db } = await import('../../firebase');

    for (const entry of preview) {
      if (entry.status !== 'valid') continue;
      const snap = await getDocs(query(collection(db, 'alumni'), where('email', '==', entry.email)));
      if (!snap.empty) entry.status = 'exists';
    }

    setSimplePreview(preview);
    setSimplePreviewed(true);
    setSimpleStatus('idle');
  };

  const handleSimpleImport = async () => {
    const toImport = simplePreview.filter(e => e.status === 'valid');
    if (toImport.length === 0) return;

    setSimpleStatus('processing');
    setSimpleProgress({ current: 0, total: toImport.length });

    try {
      const result = await importEmailsOnly(
        toImport,
        { yearPromo: simpleYearPromo || undefined, sendActivationEmail: simpleSendEmail },
        (current, total) => setSimpleProgress({ current, total })
      );

      if (recensementId) {
        try {
          await updateRecensementStats(recensementId, {
            totalForms: recensement?.stats.totalForms ?? toImport.length,
            newAccounts: result.success,
            updatedAccounts: 0,
            alreadyExisted: result.skipped + simplePreview.filter(e => e.status === 'exists').length,
            errors: result.errors.length,
          });
        } catch (e) { console.error('Erreur recensement:', e); }
      }

      setSimpleResult(result);
      setSimpleStatus('completed');
    } catch (error: any) {
      setSimpleStatus('error');
    }
  };

  const handleSimpleReset = () => {
    setSimpleText('');
    setSimplePreview([]);
    setSimplePreviewed(false);
    setSimpleStatus('idle');
    setSimpleResult(null);
    setSimpleProgress({ current: 0, total: 0 });
  };

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Upload className="w-8 h-8 text-indigo-600" />
              Import en masse de profils alumni
            </h1>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
              🔒 Superadmin uniquement
            </span>
          </div>
          <p className="mt-2 text-gray-600">
            Importez des profils alumni depuis un fichier CSV ou Excel
          </p>
        </div>

        {/* Recensement lié */}
        {recensementIdParam ? (
          recensement && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-indigo-900">
                  Import lié au recensement : <span className="font-bold">{recensement.title}</span>
                </p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  Les statistiques seront automatiquement mises à jour après l'import
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="mb-6 p-4 bg-white border border-zinc-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-zinc-500" />
              <p className="text-sm font-medium text-zinc-700">Rattacher à un recensement (optionnel)</p>
            </div>
            <select
              value={selectedRecensementId ?? ''}
              onChange={e => setSelectedRecensementId(e.target.value || null)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">— Aucun (import libre) —</option>
              {allRecensements.map(r => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.year}) — {r.status === 'pending' ? 'En attente' : r.status === 'imported' ? 'Importé' : 'Partiel'}
                </option>
              ))}
            </select>
            {recensement && (
              <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Les stats de ce recensement seront mises à jour après l'import
              </p>
            )}

            {/* Mini-formulaire création inline */}
            {!showNewRecensement ? (
              <button
                onClick={() => setShowNewRecensement(true)}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Créer un nouveau recensement
              </button>
            ) : (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-indigo-800">Nouveau recensement</p>
                  <button onClick={() => setShowNewRecensement(false)} className="text-indigo-400 hover:text-indigo-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-indigo-700 mb-0.5 font-medium">Titre</label>
                  <input
                    type="text"
                    placeholder="ex: Recensement 2026 - Vague 1"
                    value={newRecForm.title}
                    onChange={e => setNewRecForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border border-indigo-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div className="flex gap-2">
                  <div>
                    <label className="block text-xs text-indigo-700 mb-0.5 font-medium">Année</label>
                    <input
                      type="number"
                      value={newRecForm.year}
                      onChange={e => setNewRecForm(f => ({ ...f, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                      className="w-24 border border-indigo-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-indigo-700 mb-0.5 font-medium">Date de clôture du formulaire</label>
                    <input
                      type="date"
                      value={newRecForm.closedAt}
                      onChange={e => setNewRecForm(f => ({ ...f, closedAt: e.target.value }))}
                      className="w-full border border-indigo-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateRecensement}
                  disabled={creatingRec || !newRecForm.title.trim() || !newRecForm.closedAt}
                  className="w-full py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {creatingRec ? 'Création...' : 'Créer et rattacher'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sélecteur de mode */}
        <div className="flex gap-2 mb-6 bg-white border border-zinc-200 rounded-lg p-1 shadow-sm w-fit">
          <button
            onClick={() => setImportMode('fichier')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              importMode === 'fichier'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Import fichier CSV/XLSX
          </button>
          <button
            onClick={() => setImportMode('simplifie')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              importMode === 'simplifie'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <Mail className="w-4 h-4" />
            Import simplifié (Nom + Email)
          </button>
        </div>

        {/* ─── MODE SIMPLIFIÉ ──────────────────────────────────────────── */}
        {importMode === 'simplifie' && (
          <div className="space-y-6">
            {/* Info */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 text-sm mb-1">Import simplifié — Nom + Email uniquement</p>
                  <p className="text-sm text-blue-800">
                    Colle la liste ci-dessous, une entrée par ligne au format : <code className="bg-blue-100 px-1 rounded">Prénom Nom, email@domain.com</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Saisie */}
            {simpleStatus === 'idle' && !simpleResult && (
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Liste des entrées</h2>
                <textarea
                  value={simpleText}
                  onChange={e => { setSimpleText(e.target.value); setSimplePreviewed(false); setSimplePreview([]); }}
                  placeholder={"Jean Dupont, jean.dupont@gmail.com\nMarie Fall, marie.fall@esigelec.fr\nAliou Sow, aliou@insa-lyon.fr"}
                  rows={10}
                  className="w-full border border-zinc-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleAnalyze}
                    disabled={!simpleText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Analyser
                  </button>
                </div>
              </div>
            )}

            {/* Checking */}
            {simpleStatus === 'checking' && (
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 text-center text-sm text-zinc-500">
                Vérification des emails en cours...
              </div>
            )}

            {/* Preview */}
            {simplePreviewed && simpleStatus === 'idle' && !simpleResult && (
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 space-y-4">
                {/* Compteurs */}
                <div className="flex gap-4 text-sm flex-wrap">
                  {(() => {
                    const v = simplePreview.filter(e => e.status === 'valid').length;
                    const ex = simplePreview.filter(e => e.status === 'exists').length;
                    const inv = simplePreview.filter(e => ['invalid_email','invalid_name','duplicate'].includes(e.status)).length;
                    return (
                      <>
                        <span className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                          <CheckCircle className="w-3.5 h-3.5" /> {v} nouveau{v > 1 ? 'x' : ''}
                        </span>
                        {ex > 0 && (
                          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {ex} déjà existant{ex > 1 ? 's' : ''}
                          </span>
                        )}
                        {inv > 0 && (
                          <span className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                            <XCircle className="w-3.5 h-3.5" /> {inv} invalide{inv > 1 ? 's' : ''}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Tableau */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 text-left">
                        <th className="px-3 py-2 font-medium text-zinc-600 rounded-l">Nom</th>
                        <th className="px-3 py-2 font-medium text-zinc-600">Email</th>
                        <th className="px-3 py-2 font-medium text-zinc-600 rounded-r">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {simplePreview.map((entry, i) => (
                        <tr key={i} className="hover:bg-zinc-50">
                          <td className="px-3 py-2 text-zinc-900">{entry.name || <span className="text-red-400 italic">manquant</span>}</td>
                          <td className="px-3 py-2 text-zinc-600 font-mono text-xs">{entry.email}</td>
                          <td className="px-3 py-2">
                            {entry.status === 'valid' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Nouveau</span>}
                            {entry.status === 'exists' && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Existe déjà</span>}
                            {entry.status === 'duplicate' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Doublon</span>}
                            {entry.status === 'invalid_email' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Email invalide</span>}
                            {entry.status === 'invalid_name' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Nom manquant</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Options */}
                <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Année promo (optionnel)</label>
                    <input
                      type="number"
                      value={simpleYearPromo || ''}
                      onChange={e => setSimpleYearPromo(parseInt(e.target.value) || 0)}
                      placeholder="Ex: 2023"
                      className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:self-end">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={simpleSendEmail}
                      onChange={e => setSimpleSendEmail(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="sendEmail" className="text-sm text-zinc-700">Envoyer email d'activation</label>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={handleSimpleReset}
                    className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    Recommencer
                  </button>
                  <button
                    onClick={handleSimpleImport}
                    disabled={simplePreview.filter(e => e.status === 'valid').length === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Lancer l'import ({simplePreview.filter(e => e.status === 'valid').length} compte{simplePreview.filter(e => e.status === 'valid').length > 1 ? 's' : ''})
                  </button>
                </div>
              </div>
            )}

            {/* Progression */}
            {simpleStatus === 'processing' && (
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Import en cours...</h2>
                <ImportProgress current={simpleProgress.current} total={simpleProgress.total} status="processing" />
              </div>
            )}

            {/* Résultat */}
            {simpleResult && simpleStatus === 'completed' && (
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Rapport d'import simplifié</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{simpleResult.success}</p>
                    <p className="text-xs text-green-600 mt-1">Comptes créés</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-2xl font-bold text-amber-700">{simpleResult.skipped}</p>
                    <p className="text-xs text-amber-600 mt-1">Ignorés (existants)</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-2xl font-bold text-red-700">{simpleResult.errors.length}</p>
                    <p className="text-xs text-red-600 mt-1">Erreurs</p>
                  </div>
                </div>
                {simpleResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-700 mb-2">Erreurs :</p>
                    <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
                      {simpleResult.errors.map((e, i) => (
                        <li key={i} className="font-mono">{e.email} — {e.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSimpleReset}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Nouvel import
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── MODE FICHIER ────────────────────────────────────────────── */}
        {importMode === 'fichier' && <>

        {/* Avertissement */}
        {fichierStep === 'upload' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Formats acceptés : CSV (.csv) et Excel (.xlsx)</li>
                <li>Les comptes seront créés avec des mots de passe aléatoires — les alumni devront utiliser "Mot de passe oublié"</li>
                <li>Comptez ~30–60 s par profil — ne fermez pas cette page</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 1 : Upload */}
        {fichierStep === 'upload' && (
          <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Choisir un fichier
            </h2>
            <FileUploader onFileSelect={handleFileSelect} />
            {parseError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{parseError}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2 : Mapping dynamique */}
        {fichierStep === 'mapping' && (
          <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Mapping des colonnes</h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {rawRows.length} ligne(s) · {rawHeaders.length} colonne(s) détectée(s)
                </p>
              </div>
              <button
                onClick={() => { setFichierStep('upload'); setRawHeaders([]); setRawRows([]); setFieldMapping({ ...EMPTY_MAPPING }); }}
                className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Changer de fichier
              </button>
            </div>

            {parseError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">{parseError}</p>
              </div>
            )}

            {/* Grille mapping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SYSTEM_FIELDS.map(({ key, label, required, hint }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                    {hint && <span className="text-zinc-400 font-normal ml-1">({hint})</span>}
                  </label>
                  <select
                    value={fieldMapping[key]}
                    onChange={e => setFieldMapping(m => ({ ...m, [key]: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                      required && !fieldMapping[key] ? 'border-red-300 bg-red-50' : 'border-zinc-200'
                    }`}
                  >
                    <option value="">(ignorer)</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Messages de validation */}
            <div className="space-y-1">
              {!fieldMapping.email && (
                <p className="text-xs text-red-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Colonne Email requise</p>
              )}
              {!fieldMapping.displayName && !fieldMapping.firstName && !fieldMapping.lastName && (
                <p className="text-xs text-red-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Mapper Prénom + Nom de famille <strong>ou</strong> Nom complet</p>
              )}
              {fieldMapping.email && (fieldMapping.displayName || fieldMapping.firstName || fieldMapping.lastName) && (
                <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Mapping valide — prêt à importer</p>
              )}
            </div>

            {/* Aperçu des 3 premières lignes */}
            {rawRows.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Aperçu (3 premières lignes)</p>
                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Email</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Nom</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Promo</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Ville</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-600">Poste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {rawRows.slice(0, 3).map((row, i) => {
                        const previewEmail = fieldMapping.email ? String(row[fieldMapping.email] || '—') : '—';
                        let previewName = '—';
                        if (fieldMapping.displayName) previewName = String(row[fieldMapping.displayName] || '—');
                        else {
                          const f = fieldMapping.firstName ? String(row[fieldMapping.firstName] || '') : '';
                          const l = fieldMapping.lastName  ? String(row[fieldMapping.lastName]  || '') : '';
                          previewName = `${f} ${l}`.trim() || '—';
                        }
                        return (
                          <tr key={i} className="hover:bg-zinc-50">
                            <td className="px-3 py-2 font-mono text-zinc-600 max-w-[160px] truncate">{previewEmail}</td>
                            <td className="px-3 py-2 text-zinc-900">{previewName}</td>
                            <td className="px-3 py-2 text-zinc-600">{fieldMapping.yearPromo ? String(row[fieldMapping.yearPromo] || '—') : '—'}</td>
                            <td className="px-3 py-2 text-zinc-600">{fieldMapping.city ? String(row[fieldMapping.city] || '—') : '—'}</td>
                            <td className="px-3 py-2 text-zinc-600 max-w-[150px] truncate">{fieldMapping.position ? String(row[fieldMapping.position] || '—') : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Options + bouton lancer */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fichierSendEmail}
                  onChange={e => setFichierSendEmail(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm text-zinc-700">Envoyer email d'activation aux nouveaux comptes</span>
              </label>
              <button
                onClick={handleStartImport}
                disabled={
                  !fieldMapping.email ||
                  (!fieldMapping.displayName && !fieldMapping.firstName && !fieldMapping.lastName)
                }
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="w-4 h-4" />
                Lancer l'import ({rawRows.length} ligne{rawRows.length > 1 ? 's' : ''})
              </button>
            </div>
          </div>
        )}

        {/* Step 3 : Progression */}
        {fichierStep === 'processing' && (
          <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import en cours...</h2>
            <ImportProgress
              current={importProgress.current}
              total={importProgress.total}
              status={importStatus}
            />
          </div>
        )}

        {/* Step 4 : Rapport */}
        {fichierStep === 'completed' && importResult && (
          <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Rapport d'import</h2>
            <ImportReport result={importResult} onNewImport={handleNewImport} />
          </div>
        )}

        </> /* fin MODE FICHIER */}
      </div>
    </div>
  );
};

export default ImportAlumni;
