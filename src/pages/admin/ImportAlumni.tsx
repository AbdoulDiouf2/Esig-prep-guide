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
import ImportPreviewModal from '../../components/admin/ImportPreviewModal';
import { parseCSV, parseXLSX, ParsedAlumniData, cleanEmail, extractYearPromo, validateAlumniData } from '../../utils/fileParser';
import { importAlumniFromFile, ImportAlumniData, ImportResult, importEmailsOnly, MinimalImportEntry, EmailImportResult } from '../../services/alumniService';

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

  // États mode fichier (existants)
  const [parsedData, setParsedData] = useState<ParsedAlumniData[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
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
    setParsedData([]);

    try {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      let result;

      if (fileExtension === '.csv') {
        result = await parseCSV(file);
      } else if (fileExtension === '.xlsx') {
        result = await parseXLSX(file);
      } else {
        setParseError('Format de fichier non supporté');
        return;
      }

      if (result.errors.length > 0) {
        setParseError(`Erreurs de parsing: ${result.errors.length} ligne(s) avec des erreurs`);
      }

      setParsedData(result.data);
      console.log('✅ Fichier parsé:', result.data.length, 'lignes');
      
      // Ouvrir automatiquement le modal de prévisualisation
      if (result.data.length > 0) {
        setShowPreviewModal(true);
      }
    } catch (error: any) {
      setParseError(error.message || 'Erreur lors de la lecture du fichier');
      console.error('Erreur parsing:', error);
    }
  };

  const handleStartImport = async () => {
    if (parsedData.length === 0) return;

    setImportStatus('processing');
    setImportProgress({ current: 0, total: parsedData.length });

    try {
      // Transformer les données parsées en ImportAlumniData
      const dataToImport: ImportAlumniData[] = [];
      const validationErrors: Array<{ row: number; email: string; error: string }> = [];

      parsedData.forEach((row, index) => {
        const rowNumber = index + 2; // +2 car ligne 1 = headers
        const validation = validateAlumniData(row);

        if (!validation.valid) {
          validationErrors.push({
            row: rowNumber,
            email: String(row.Mail || 'N/A'),
            error: validation.errors.join(', '),
          });
          return;
        }

        // Parser les domaines (splitter par virgules et "et")
        const parseSectors = (domaine: string): string[] => {
          if (!domaine) return [];
          return domaine
            .split(/,|\set\s/i) // Split par virgule OU " et " (case insensitive)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        };

        dataToImport.push({
          name: `${row.Prénom} ${row.Nom}`.trim(),
          email: cleanEmail(String(row.Mail)),
          yearPromo: extractYearPromo(row['Promotion (année de sortie CPC)']),
          city: row.Ville || '',
          position: row['Poste Occupé ou Recherché'] || '',
          sectors: parseSectors(row.Domaine || ''),
          expertise: row['Précision de votre domaine'] ? [row['Précision de votre domaine']] : [],
          bio: '', // Pas de mapping depuis Commentaire
        });
      });

      // Lancer l'import
      const result = await importAlumniFromFile(
        dataToImport,
        (current, total) => { setImportProgress({ current, total }); },
        { sendActivationEmail: fichierSendEmail }
      );

      // Ajouter les erreurs de validation au résultat
      result.errors.push(...validationErrors);

      // Mettre à jour les stats du recensement lié
      if (recensementId) {
        try {
          await updateRecensementStats(recensementId, {
            totalForms: recensement?.stats.totalForms ?? parsedData.length,
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
    setParsedData([]);
    setImportStatus('idle');
    setImportProgress({ current: 0, total: 0 });
    setImportResult(null);
    setParseError('');
    setShowPreviewModal(false);
  };

  const handleConfirmImport = () => {
    if (!canImport) return;
    setShowPreviewModal(false);
    handleStartImport();
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

  // Calculer le nombre de profils valides et invalides
  const validationStats = parsedData.reduce(
    (acc, row) => {
      const validation = validateAlumniData(row);
      if (validation.valid) {
        acc.valid++;
      } else {
        acc.invalid++;
      }
      return acc;
    },
    { valid: 0, invalid: 0 }
  );

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

        {/* Section 1 : Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Instructions d'import</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Formats acceptés : CSV (.csv) et Excel (.xlsx)</li>
                <li>Taille maximale : 5 MB</li>
                <li>Les comptes utilisateurs seront créés automatiquement</li>
                <li>Les profils seront pré-approuvés (status: approved)</li>
                <li>Les doublons (emails existants) seront ignorés</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2 : Mapping des colonnes */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Mapping des colonnes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Champ formulaire</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Champ profil</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Obligatoire</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Exemple</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-gray-900">Nom + Prénom</td>
                  <td className="px-4 py-3 text-gray-600">name</td>
                  <td className="px-4 py-3"><span className="text-red-600 font-bold">Oui</span></td>
                  <td className="px-4 py-3 text-gray-500">John Doe</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Mail</td>
                  <td className="px-4 py-3 text-gray-600">email</td>
                  <td className="px-4 py-3"><span className="text-red-600 font-bold">Oui</span></td>
                  <td className="px-4 py-3 text-gray-500">john@example.com</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Promotion (année de sortie CPC)</td>
                  <td className="px-4 py-3 text-gray-600">yearPromo</td>
                  <td className="px-4 py-3"><span className="text-red-600 font-bold">Oui</span></td>
                  <td className="px-4 py-3 text-gray-500">2022</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Ville</td>
                  <td className="px-4 py-3 text-gray-600">city</td>
                  <td className="px-4 py-3 text-gray-500">Non</td>
                  <td className="px-4 py-3 text-gray-500">Paris</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Poste Occupé ou Recherché</td>
                  <td className="px-4 py-3 text-gray-600">position</td>
                  <td className="px-4 py-3 text-gray-500">Non</td>
                  <td className="px-4 py-3 text-gray-500">Développeur Full Stack</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Domaine</td>
                  <td className="px-4 py-3 text-gray-600">sectors (array)</td>
                  <td className="px-4 py-3 text-gray-500">Non</td>
                  <td className="px-4 py-3 text-gray-500">
                    <div className="text-xs">
                      <div>"Informatique, Finance" → ["Informatique", "Finance"]</div>
                      <div>"Data et IA" → ["Data", "IA"]</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Précision de votre domaine</td>
                  <td className="px-4 py-3 text-gray-600">expertise (array)</td>
                  <td className="px-4 py-3 text-gray-500">Non</td>
                  <td className="px-4 py-3 text-gray-500">React, Node.js</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Avertissement */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Points importants</h3>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Les comptes seront créés avec des mots de passe aléatoires</li>
                <li>Les utilisateurs devront utiliser "Mot de passe oublié" pour se connecter</li>
                <li>L'import prend environ 30-60 secondes par profil (pause de 500ms entre chaque création)</li>
                <li>Pour 107 profils, comptez environ 50-90 minutes d'import</li>
                <li>Ne fermez pas cette page pendant l'import</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 3 : Upload de fichier */}
        {importStatus === 'idle' && !importResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload de fichier</h2>
            <FileUploader onFileSelect={handleFileSelect} />

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="fichierSendEmail"
                checked={fichierSendEmail}
                onChange={e => setFichierSendEmail(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <label htmlFor="fichierSendEmail" className="text-sm text-zinc-700">
                Envoyer un email d'activation aux nouveaux comptes créés
              </label>
            </div>

            {parseError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{parseError}</p>
              </div>
            )}
          </div>
        )}

        {/* Section 4 : Progression */}
        {importStatus === 'processing' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Import en cours...</h2>
            <ImportProgress
              current={importProgress.current}
              total={importProgress.total}
              status={importStatus}
            />
          </div>
        )}

        {/* Section 5 : Rapport */}
        {importResult && importStatus === 'completed' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Rapport d'import</h2>
            <ImportReport result={importResult} onNewImport={handleNewImport} />
          </div>
        )}

        </> /* fin MODE FICHIER */}

        {/* Modal de prévisualisation */}
        <ImportPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onConfirm={handleConfirmImport}
          data={parsedData}
          validCount={validationStats.valid}
          errorCount={validationStats.invalid}
        />
      </div>
    </div>
  );
};

export default ImportAlumni;
