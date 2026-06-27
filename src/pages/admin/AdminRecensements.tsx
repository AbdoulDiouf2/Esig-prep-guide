import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  UserPlus,
  RefreshCw,
  XCircle,
  Trash2,
  X,
  Pencil,
  BarChart2,
  List,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  FileSpreadsheet,
  FileText,
  Bell,
  BellOff,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import {
  getRecensements,
  createRecensement,
  updateRecensement,
  deleteRecensement,
  computeImportedAlumniCount,
  syncRecensementFromBulkImport,
} from '../../services/recensementService';
import { Recensement, CreateRecensementData } from '../../types/recensement';
import { sendActivationReminders, ReminderResult, getInactiveAlumni, InactiveAlumni } from '../../services/alumniService';

// ─── Composant Stats ────────────────────────────────────────────────────────

interface StatsViewProps { recensements: Recensement[]; }

function exportStatsCSV(years: number[], byYear: Record<number, { newAccounts: number; updated: number; errors: number; forms: number }>, totals: { forms: number; newAccounts: number; updated: number; errors: number }, conversionRate: number) {
  const header = ['Année', 'Réponses formulaire', 'Nouveaux comptes', 'Profils mis à jour', 'Erreurs'];
  const rows = years.map(y => [y, byYear[y].forms, byYear[y].newAccounts, byYear[y].updated, byYear[y].errors]);
  const footer = ['TOTAL', totals.forms, totals.newAccounts, totals.updated, totals.errors];
  const meta = ['', '', 'Taux de conversion', `${conversionRate}%`, ''];
  const csv = [header, ...rows, footer, meta].map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `cps-connect-recensements-${new Date().getFullYear()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

async function exportStatsExcel(years: number[], byYear: Record<number, { newAccounts: number; updated: number; errors: number; forms: number }>, recensements: Recensement[], totals: { forms: number; newAccounts: number; updated: number; errors: number }, conversionRate: number) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // Feuille 1 — Évolution par année
  const evol = [
    ['Année', 'Réponses formulaire', 'Nouveaux comptes', 'Profils mis à jour', 'Erreurs'],
    ...years.map(y => [y, byYear[y].forms, byYear[y].newAccounts, byYear[y].updated, byYear[y].errors]),
    [],
    ['TOTAL', totals.forms, totals.newAccounts, totals.updated, totals.errors],
    ['Taux de conversion', `${conversionRate}%`],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(evol), 'Évolution par année');

  // Feuille 2 — Détail des recensements
  const detail = [
    ['Titre', 'Année', 'Date clôture', 'Statut', 'Réponses', 'Nouveaux', 'Mis à jour', 'Erreurs'],
    ...recensements.filter(r => r.status !== 'pending').map(r => [
      r.title, r.year,
      r.closedAt.toDate().toLocaleDateString('fr-FR'),
      r.status === 'imported' ? 'Importé' : 'Partiel',
      r.stats.totalForms, r.stats.newAccounts, r.stats.updatedAccounts, r.stats.errors,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detail), 'Détail recensements');

  XLSX.writeFile(wb, `cps-connect-recensements-${new Date().getFullYear()}.xlsx`);
}

async function exportStatsPDF(years: number[], byYear: Record<number, { newAccounts: number; updated: number; errors: number; forms: number }>, recensements: Recensement[], totals: { forms: number; newAccounts: number; updated: number; errors: number }, conversionRate: number, lastYear: number | undefined, prevYear: number | undefined) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const blue = [30, 58, 138] as [number, number, number];

  // En-tête
  doc.setFillColor(...blue);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('CPS Connect — Rapport des recensements', 14, 12);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${dateStr}`, 14, 20);

  // KPIs globaux
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Totaux cumulés', 14, 38);

  autoTable(doc, {
    startY: 42,
    head: [['Métrique', 'Valeur']],
    body: [
      ['Réponses formulaires (total)', totals.forms.toString()],
      ['Nouveaux comptes créés', totals.newAccounts.toString()],
      ['Profils mis à jour', totals.updated.toString()],
      ['Erreurs d\'import', totals.errors.toString()],
      ['Taux de conversion', `${conversionRate}%`],
    ],
    headStyles: { fillColor: blue, textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  // Évolution par année
  const afterKpi = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Évolution par année', 14, afterKpi);

  autoTable(doc, {
    startY: afterKpi + 4,
    head: [['Année', 'Réponses', 'Nouveaux comptes', 'Mis à jour', 'Erreurs']],
    body: years.map(y => [y, byYear[y].forms, byYear[y].newAccounts, byYear[y].updated, byYear[y].errors]),
    headStyles: { fillColor: blue, textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  // Comparatif N vs N-1
  if (lastYear && prevYear) {
    const afterEvol = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text(`Comparatif ${lastYear} vs ${prevYear}`, 14, afterEvol);
    const last = byYear[lastYear]; const prev = byYear[prevYear];
    const pct = (curr: number, p: number) => p > 0 ? `${Math.round(((curr - p) / p) * 100) >= 0 ? '+' : ''}${Math.round(((curr - p) / p) * 100)}%` : '—';
    autoTable(doc, {
      startY: afterEvol + 4,
      head: [['Métrique', prevYear.toString(), lastYear.toString(), 'Évolution']],
      body: [
        ['Nouveaux comptes', prev.newAccounts, last.newAccounts, pct(last.newAccounts, prev.newAccounts)],
        ['Profils mis à jour', prev.updated, last.updated, pct(last.updated, prev.updated)],
        ['Réponses formulaire', prev.forms, last.forms, pct(last.forms, prev.forms)],
      ],
      headStyles: { fillColor: blue, textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
  }

  // Détail des recensements
  doc.addPage();
  doc.setFillColor(...blue); doc.rect(0, 0, 210, 20, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('Détail des recensements', 14, 13);

  autoTable(doc, {
    startY: 26,
    head: [['Titre', 'Année', 'Date clôture', 'Statut', 'Réponses', 'Nouveaux', 'Mis à jour']],
    body: recensements.filter(r => r.status !== 'pending').map(r => [
      r.title, r.year,
      r.closedAt.toDate().toLocaleDateString('fr-FR'),
      r.status === 'imported' ? 'Importé' : 'Partiel',
      r.stats.totalForms, r.stats.newAccounts, r.stats.updatedAccounts,
    ]),
    headStyles: { fillColor: blue, textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  // Pied de page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`CPS Connect — Rapport recensements — Page ${i}/${pageCount}`, 14, 290);
    doc.text(dateStr, 180, 290, { align: 'right' });
  }

  doc.save(`cps-connect-recensements-${new Date().getFullYear()}.pdf`);
}

const StatsView: React.FC<StatsViewProps> = ({ recensements }) => {
  const [exportOpen, setExportOpen] = React.useState(false);
  const imported = recensements.filter(r => r.status !== 'pending');

  const totals = imported.reduce(
    (acc, r) => ({
      forms: acc.forms + r.stats.totalForms,
      newAccounts: acc.newAccounts + r.stats.newAccounts,
      updated: acc.updated + r.stats.updatedAccounts,
      errors: acc.errors + r.stats.errors,
    }),
    { forms: 0, newAccounts: 0, updated: 0, errors: 0 }
  );

  const conversionRate = totals.forms > 0
    ? Math.round((totals.newAccounts / totals.forms) * 100)
    : 0;

  // Grouper par année (sommer si plusieurs recensements la même année)
  const byYear = imported.reduce<Record<number, { newAccounts: number; updated: number; errors: number; forms: number }>>((acc, r) => {
    if (!acc[r.year]) acc[r.year] = { newAccounts: 0, updated: 0, errors: 0, forms: 0 };
    acc[r.year].newAccounts += r.stats.newAccounts;
    acc[r.year].updated += r.stats.updatedAccounts;
    acc[r.year].errors += r.stats.errors;
    acc[r.year].forms += r.stats.totalForms;
    return acc;
  }, {});

  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  const maxNew = Math.max(...years.map(y => byYear[y].newAccounts), 1);

  // Comparatif : dernière année vs avant-dernière
  const lastYear = years[years.length - 1];
  const prevYear = years[years.length - 2];
  const lastData = lastYear ? byYear[lastYear] : null;
  const prevData = prevYear ? byYear[prevYear] : null;

  function delta(curr: number, prev: number) {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  }

  if (imported.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-12 text-center">
        <BarChart2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium">Aucune donnée d'import disponible</p>
        <p className="text-zinc-400 text-sm mt-1">Les statistiques apparaîtront après le premier import</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Bouton export */}
      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={() => setExportOpen(o => !o)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          {exportOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 overflow-hidden">
              <button
                onClick={() => { exportStatsCSV(years, byYear, totals, conversionRate); setExportOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-zinc-400" />
                Exporter CSV
              </button>
              <button
                onClick={() => { exportStatsExcel(years, byYear, recensements, totals, conversionRate); setExportOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Exporter Excel
              </button>
              <button
                onClick={() => { exportStatsPDF(years, byYear, recensements, totals, conversionRate, lastYear, prevYear); setExportOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-red-500" />
                Exporter PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPIs globaux */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-900" />
          Totaux cumulés — tous recensements importés
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-zinc-900">{totals.forms}</p>
            <p className="text-xs text-zinc-500 mt-1">Réponses formulaires</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-800">{totals.newAccounts}</p>
            <p className="text-xs text-green-600 mt-1">Nouveaux comptes créés</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-800">{totals.updated}</p>
            <p className="text-xs text-blue-600 mt-1">Profils mis à jour</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-800">{conversionRate}%</p>
            <p className="text-xs text-amber-600 mt-1">Taux de conversion</p>
          </div>
        </div>
      </div>

      {/* Évolution par année */}
      {years.length > 0 && (
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6">
          <h2 className="text-base font-semibold text-zinc-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-900" />
            Évolution des nouveaux comptes par année
          </h2>
          <div className="space-y-4">
            {years.map(year => {
              const d = byYear[year];
              const pct = Math.round((d.newAccounts / maxNew) * 100);
              const upd_pct = Math.round((d.updated / maxNew) * 100);
              return (
                <div key={year}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-zinc-700">{year}</span>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        {d.newAccounts} nouveaux
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                        {d.updated} mis à jour
                      </span>
                      {d.errors > 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                          {d.errors} erreurs
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-7 bg-zinc-100 rounded-full overflow-hidden">
                    {/* Barre mises à jour (derrière) */}
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-200 rounded-full transition-all duration-500"
                      style={{ width: `${upd_pct}%` }}
                    />
                    {/* Barre nouveaux comptes (devant) */}
                    <div
                      className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-white drop-shadow">
                      {d.newAccounts > 0 ? d.newAccounts : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Nouveaux comptes</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-200 inline-block" /> Profils mis à jour</span>
          </div>
        </div>
      )}

      {/* Comparatif N vs N-1 */}
      {lastData && prevData && (
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6">
          <h2 className="text-base font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-900" />
            Comparatif {lastYear} vs {prevYear}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Nouveaux comptes', curr: lastData.newAccounts, prev: prevData.newAccounts },
              { label: 'Profils mis à jour', curr: lastData.updated, prev: prevData.updated },
              { label: 'Réponses formulaire', curr: lastData.forms, prev: prevData.forms },
            ].map(({ label, curr, prev }) => {
              const d = delta(curr, prev);
              const isUp = d !== null && d > 0;
              const isDown = d !== null && d < 0;
              return (
                <div key={label} className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-2">{label}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-zinc-900">{curr}</p>
                      <p className="text-xs text-zinc-400">vs {prev} en {prevYear}</p>
                    </div>
                    {d !== null ? (
                      <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg ${
                        isUp ? 'bg-green-100 text-green-700' :
                        isDown ? 'bg-red-100 text-red-700' :
                        'bg-zinc-100 text-zinc-500'
                      }`}>
                        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> :
                         isDown ? <TrendingDown className="w-3.5 h-3.5" /> :
                         <Minus className="w-3.5 h-3.5" />}
                        {isUp ? '+' : ''}{d}%
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: 'En attente d\'import', color: 'indigo', Icon: Clock },
  imported: { label: 'Importé', color: 'green', Icon: CheckCircle },
  partial: { label: 'Import partiel', color: 'amber', Icon: AlertTriangle },
};

const AdminRecensements: React.FC = () => {
  const { currentUser } = useAuth();
  const canManage = usePermission('recensement.manage');
  const isSuperAdmin = currentUser?.isSuperAdmin === true;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'liste' | 'stats'>('liste');
  const [recensements, setRecensements] = useState<Recensement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecensement, setEditingRecensement] = useState<Recensement | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [reminding, setReminding] = useState<string | null>(null);
  const [reminderProgress, setReminderProgress] = useState({ current: 0, total: 0 });
  const [reminderResult, setReminderResult] = useState<ReminderResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewList, setPreviewList] = useState<InactiveAlumni[] | null>(null);
  const [previewImportedFrom, setPreviewImportedFrom] = useState<'bulk_import' | 'email_only_import'>('bulk_import');
  const [previewRecensementId, setPreviewRecensementId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    year: new Date().getFullYear(),
    closedAt: '',
    notes: '',
    totalForms: 0,
    newAccounts: 0,
    updatedAccounts: 0,
    errors: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [computing, setComputing] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSyncFromBulkImport(id: string) {
    if (!confirm('Synchroniser depuis les imports Firestore ? Les stats seront écrasées et le statut passera à "Importé".')) return;
    setSyncing(id);
    try {
      const count = await syncRecensementFromBulkImport(id);
      await loadRecensements();
      alert(`${count} profils trouvés — recensement marqué comme importé.`);
    } catch {
      setError('Erreur lors de la synchronisation');
    } finally {
      setSyncing(null);
    }
  }

  async function handlePreviewReminders(recensementId: string, importedFrom: 'bulk_import' | 'email_only_import') {
    setPreviewLoading(true);
    setPreviewRecensementId(recensementId);
    setPreviewImportedFrom(importedFrom);
    try {
      const list = await getInactiveAlumni(importedFrom);
      setPreviewList(list);
    } catch {
      setError('Erreur lors du chargement de la liste');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleConfirmReminders() {
    if (!previewRecensementId) return;
    setPreviewList(null);
    setReminding(previewRecensementId);
    setReminderProgress({ current: 0, total: 0 });
    setReminderResult(null);
    try {
      const result = await sendActivationReminders(previewImportedFrom, (current, total) => {
        setReminderProgress({ current, total });
      });
      setReminderResult(result);
    } catch {
      setError('Erreur lors de l\'envoi des rappels');
    } finally {
      setReminding(null);
    }
  }

  async function handleComputeFromImports() {
    setComputing(true);
    try {
      const count = await computeImportedAlumniCount('bulk_import');
      setForm(f => ({ ...f, totalForms: count }));
    } finally {
      setComputing(false);
    }
  }

  useEffect(() => {
    loadRecensements();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) setShowModal(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showModal]);

  async function loadRecensements() {
    setLoading(true);
    try {
      const data = await getRecensements();
      setRecensements(data);
    } catch (e) {
      setError('Erreur lors du chargement des recensements');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(r: Recensement) {
    setEditingRecensement(r);
    const dateStr = r.closedAt.toDate().toISOString().split('T')[0];
    setForm({
      title: r.title,
      year: r.year,
      closedAt: dateStr,
      notes: r.notes,
      totalForms: r.stats.totalForms,
      newAccounts: r.stats.newAccounts,
      updatedAccounts: r.stats.updatedAccounts,
      errors: r.stats.errors,
    });
    setFormError('');
    setShowModal(true);
  }

  function openCreate() {
    setEditingRecensement(null);
    setForm({ title: '', year: new Date().getFullYear(), closedAt: '', notes: '', totalForms: 0, newAccounts: 0, updatedAccounts: 0, errors: 0 });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Le titre est requis');
      return;
    }
    if (!form.closedAt) {
      setFormError('La date de clôture est requise');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      if (editingRecensement) {
        const hasImportData = form.newAccounts > 0 || form.updatedAccounts > 0;
        const newStatus = hasImportData ? 'imported' : editingRecensement.status;
        await updateRecensement(editingRecensement.id, {
          title: form.title.trim(),
          year: form.year,
          closedAt: Timestamp.fromDate(new Date(form.closedAt)),
          notes: form.notes.trim(),
          stats: {
            totalForms: form.totalForms,
            newAccounts: form.newAccounts,
            updatedAccounts: form.updatedAccounts,
            alreadyExisted: editingRecensement.stats.alreadyExisted,
            errors: form.errors,
          },
          status: newStatus,
        });
      } else {
        const data: CreateRecensementData = {
          title: form.title.trim(),
          year: form.year,
          closedAt: Timestamp.fromDate(new Date(form.closedAt)),
          notes: form.notes.trim(),
          totalForms: form.totalForms,
        };
        await createRecensement(data, currentUser!.uid);
      }
      setShowModal(false);
      setEditingRecensement(null);
      setForm({ title: '', year: new Date().getFullYear(), closedAt: '', notes: '', totalForms: 0, newAccounts: 0, updatedAccounts: 0, errors: 0 });
      await loadRecensements();
    } catch (e) {
      setFormError(editingRecensement ? 'Erreur lors de la modification' : 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce recensement ?')) return;
    setDeleting(id);
    try {
      await deleteRecensement(id);
      setRecensements(prev => prev.filter(r => r.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  }

  function formatDate(ts: Timestamp) {
    return ts.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link to="/admin" className="inline-flex items-center text-zinc-500 hover:text-zinc-900 mb-4 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-amber-500" />
                Recensements
              </h1>
            </div>
            {canManage && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nouveau recensement
              </button>
            )}
          </div>
          <p className="mt-2 text-zinc-500">
            Historique de tous les recensements de la communauté et chiffres-clés associés
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mb-6 bg-white border border-zinc-200 rounded-xl p-1 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('liste')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'liste'
                ? 'bg-blue-900 text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <List className="w-4 h-4" />
            Recensements
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-blue-900 text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Statistiques
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Vue Statistiques */}
        {activeTab === 'stats' && !loading && <StatsView recensements={recensements} />}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
          </div>
        )}

        {/* Liste */}
        {activeTab === 'liste' && !loading && recensements.length === 0 && (
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-12 text-center">
            <ClipboardList className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">Aucun recensement enregistré</p>
            <p className="text-zinc-400 text-sm mt-1">Créez votre premier recensement pour commencer</p>
          </div>
        )}
        {activeTab === 'liste' && !loading && recensements.length > 0 && (
          <div className="space-y-4">
            {recensements.map(r => {
              const cfg = STATUS_CONFIG[r.status];
              const StatusIcon = cfg.Icon;
              return (
                <div key={r.id} className="bg-white border border-zinc-200 shadow-sm rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg font-semibold text-zinc-900">{r.title}</h2>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${cfg.color}-100 text-${cfg.color}-700`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">
                        Année {r.year} · Clôturé le {formatDate(r.closedAt)}
                        {r.importedAt && ` · Importé le ${formatDate(r.importedAt)}`}
                      </p>
                      {r.notes && (
                        <p className="text-sm text-zinc-400 mt-1 italic">{r.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isSuperAdmin && r.status === 'pending' && (
                        <button
                          onClick={() => handleSyncFromBulkImport(r.id)}
                          disabled={syncing === r.id}
                          className="p-1.5 text-zinc-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
                          title="Synchroniser depuis les imports Firestore (bulk_import)"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncing === r.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      {isSuperAdmin && r.status !== 'pending' && (
                        <button
                          onClick={() => handlePreviewReminders(r.id, 'bulk_import')}
                          disabled={reminding === r.id}
                          className="p-1.5 text-zinc-400 hover:text-amber-600 transition-colors disabled:opacity-50"
                          title="Envoyer rappel aux non-activés"
                        >
                          <Bell className={`w-4 h-4 ${reminding === r.id ? 'animate-pulse' : ''}`} />
                        </button>
                      )}
                      {isSuperAdmin && (
                        <button
                          onClick={() => navigate(`/admin/import-alumni?recensementId=${r.id}`)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 transition-colors"
                          title="Importer des données"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                      {canManage && (
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 text-zinc-400 hover:text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canManage && r.status === 'pending' && (
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deleting === r.id}
                          className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-zinc-500 mb-0.5">Formulaires</p>
                          <p className="text-xl font-bold text-zinc-800">{r.stats.totalForms}</p>
                        </div>
                        <ClipboardList className="w-8 h-8 text-zinc-300" />
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-600 mb-0.5">Nouveaux comptes</p>
                          <p className="text-xl font-bold text-green-800">{r.stats.newAccounts}</p>
                        </div>
                        <UserPlus className="w-8 h-8 text-green-200" />
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-600 mb-0.5">Mis à jour</p>
                          <p className="text-xl font-bold text-blue-800">{r.stats.updatedAccounts}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-200" />
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-red-600 mb-0.5">Erreurs</p>
                          <p className="text-xl font-bold text-red-800">{r.stats.errors}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-200" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">
                {editingRecensement ? 'Modifier le recensement' : 'Nouveau recensement'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex : Recensement 2026 - Vague 1"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Année *</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                    min={2000}
                    max={2100}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Date de clôture *</label>
                  <input
                    type="date"
                    value={form.closedAt}
                    onChange={e => setForm(f => ({ ...f, closedAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Total réponses formulaire</label>
                <input
                  type="number"
                  value={form.totalForms}
                  onChange={e => setForm(f => ({ ...f, totalForms: parseInt(e.target.value) || 0 }))}
                  min={0}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-zinc-400">Nombre de réponses dans le Google Form</p>
                  <button
                    type="button"
                    onClick={handleComputeFromImports}
                    disabled={computing}
                    className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1 transition-colors"
                    title="Calcule depuis les profils importés en masse (importedFrom: bulk_import)"
                  >
                    <RefreshCw className={`w-3 h-3 ${computing ? 'animate-spin' : ''}`} />
                    {computing ? 'Calcul...' : 'Calculer depuis imports Firestore'}
                  </button>
                </div>
              </div>
              {/* Stats manuelles — visibles uniquement en édition */}
              {editingRecensement && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <p className="col-span-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Statistiques d'import</p>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Nouveaux comptes</label>
                    <input
                      type="number"
                      value={form.newAccounts}
                      onChange={e => setForm(f => ({ ...f, newAccounts: parseInt(e.target.value) || 0 }))}
                      min={0}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Mis à jour</label>
                    <input
                      type="number"
                      value={form.updatedAccounts}
                      onChange={e => setForm(f => ({ ...f, updatedAccounts: parseInt(e.target.value) || 0 }))}
                      min={0}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Erreurs</label>
                    <input
                      type="number"
                      value={form.errors}
                      onChange={e => setForm(f => ({ ...f, errors: parseInt(e.target.value) || 0 }))}
                      min={0}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Remarques sur ce recensement..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 border border-zinc-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium"
                >
                  {submitting
                    ? (editingRecensement ? 'Modification...' : 'Création...')
                    : (editingRecensement ? 'Enregistrer' : 'Créer le recensement')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal chargement preview */}
      {previewLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-xl text-center">
            <Bell className="w-10 h-10 text-amber-500 mx-auto mb-4 animate-pulse" />
            <p className="font-semibold text-zinc-900">Analyse des comptes en cours…</p>
            <p className="text-sm text-zinc-400 mt-2">Vérification des connexions</p>
          </div>
        </div>
      )}

      {/* Modal prévisualisation liste non-activés */}
      {previewList && !previewLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Rappels d'activation
                </h3>
                <button onClick={() => setPreviewList(null)} className="text-zinc-400 hover:text-zinc-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                {previewList.length === 0
                  ? "Tous les alumni ont activé leur compte."
                  : `${previewList.length} alumni n'ont jamais activé leur compte. Un email de rappel leur sera envoyé.`}
              </p>
            </div>

            {previewList.length > 0 && (
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-zinc-600">#</th>
                      <th className="px-4 py-2 text-left font-medium text-zinc-600">Nom</th>
                      <th className="px-4 py-2 text-left font-medium text-zinc-600">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {previewList.map((a, i) => (
                      <tr key={a.uid} className="hover:bg-zinc-50">
                        <td className="px-4 py-2 text-zinc-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2 text-zinc-800">{a.name || <span className="text-zinc-400 italic">—</span>}</td>
                        <td className="px-4 py-2 text-zinc-500 font-mono text-xs">{a.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3">
              <button
                onClick={() => setPreviewList(null)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Annuler
              </button>
              {previewList.length > 0 && (
                <button
                  onClick={handleConfirmReminders}
                  className="px-5 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Envoyer {previewList.length} rappel{previewList.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal rappels en cours */}
      {reminding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-xl text-center">
            <Bell className="w-10 h-10 text-amber-500 mx-auto mb-4 animate-pulse" />
            <p className="font-semibold text-zinc-900 mb-2">Envoi des rappels en cours…</p>
            {reminderProgress.total > 0 && (
              <>
                <p className="text-sm text-zinc-500 mb-3">
                  {reminderProgress.current} / {reminderProgress.total} alumni traités
                </p>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round((reminderProgress.current / reminderProgress.total) * 100)}%` }}
                  />
                </div>
              </>
            )}
            <p className="text-xs text-zinc-400 mt-4">Ne fermez pas cette page</p>
          </div>
        </div>
      )}

      {/* Modal résultat rappels */}
      {reminderResult && !reminding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Rappels envoyés
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-2xl font-bold text-amber-700">{reminderResult.sent}</p>
                <p className="text-xs text-amber-600 mt-1">Envoyés</p>
              </div>
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{reminderResult.alreadyActive}</p>
                <p className="text-xs text-green-600 mt-1">Déjà actifs</p>
              </div>
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-2xl font-bold text-red-700">{reminderResult.errors.length}</p>
                <p className="text-xs text-red-600 mt-1">Erreurs</p>
              </div>
            </div>
            {reminderResult.errors.length > 0 && (
              <div className="mb-4 max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                {reminderResult.errors.map((e, i) => (
                  <p key={i} className="font-mono">{e.email} — {e.error}</p>
                ))}
              </div>
            )}
            <button
              onClick={() => setReminderResult(null)}
              className="w-full py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecensements;
