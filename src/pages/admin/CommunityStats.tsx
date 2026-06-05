import React, { useEffect, useState, useCallback, useRef } from 'react';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
  DocumentData,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAlumniStats } from '../../services/alumniService';
import type { AlumniStats } from '../../types/alumni';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Globe,
  Briefcase,
  Star,
  MessageSquare,
  FileText,
  Video,
  Newspaper,
  Heart,
  Send,
  TrendingUp,
  Download,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  cpsUsers: number;
  alumniUsers: number;
  futureUsers: number;
  emailVerified: number;
  googleUsers: number;
  githubUsers: number;
  emailUsers: number;
  alumni: AlumniStats | null;
  usersByYear: Record<number, number>;
  alumniWithPhoto: number;
  alumniWithLinkedin: number;
  alumniWithExperiences: number;
  avgCompleteness: number;
  totalRecommendations: number;
  totalContactRequests: number;
  alumniMentoring: number;
  alumniSeeking: number;
  forumThreads: number;
  forumPosts: number;
  feedbacks: number;
  pendingWorkshops: number;
  webinars: number;
  publishedArticles: number;
}

const initialStats: Stats = {
  totalUsers: 0, cpsUsers: 0, alumniUsers: 0, futureUsers: 0,
  emailVerified: 0, googleUsers: 0, githubUsers: 0, emailUsers: 0,
  alumni: null,
  usersByYear: {},
  alumniWithPhoto: 0, alumniWithLinkedin: 0, alumniWithExperiences: 0, avgCompleteness: 0,
  totalRecommendations: 0, totalContactRequests: 0, alumniMentoring: 0, alumniSeeking: 0,
  forumThreads: 0, forumPosts: 0,
  feedbacks: 0, pendingWorkshops: 0, webinars: 0, publishedArticles: 0,
};

// ── UI helpers ──────────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  sub?: string;
}> = ({ label, value, icon, color = 'blue', sub }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
    rose: 'bg-rose-50 text-rose-700',
    zinc: 'bg-zinc-50 text-zinc-700',
  };
  return (
    <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4 flex items-start gap-4">
      <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.blue}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-blue-900">{value}</p>
        <p className="text-sm text-zinc-500">{label}</p>
        {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center gap-2 mb-4 mt-8">
    <span className="text-blue-900">{icon}</span>
    <h2 className="text-lg font-semibold text-blue-900">{title}</h2>
    <div className="flex-1 h-px bg-zinc-200 ml-2" />
  </div>
);

const TopBar: React.FC<{ label: string; count: number; total: number; color?: string }> = ({
  label, count, total, color = 'bg-blue-600',
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-zinc-700 truncate">{label}</span>
        <span className="font-medium text-blue-900 ml-2">{count}</span>
      </div>
      <div className="w-full bg-zinc-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ── Export helpers ───────────────────────────────────────────────────────────

function buildExportSections(stats: Stats, approvalRate: number) {
  const { alumni } = stats;
  const mergedExport: Record<number, { inscrits: number; profils: number }> = {};
  Object.entries(stats.usersByYear).forEach(([y, c]) => {
    const yr = Number(y);
    if (!mergedExport[yr]) mergedExport[yr] = { inscrits: 0, profils: 0 };
    mergedExport[yr].inscrits = c;
  });
  if (alumni) {
    Object.entries(alumni.profilesByYear).forEach(([y, c]) => {
      const yr = Number(y);
      if (!mergedExport[yr]) mergedExport[yr] = { inscrits: 0, profils: 0 };
      mergedExport[yr].profils = c;
    });
  }
  return [
    {
      title: 'Comptes utilisateurs',
      rows: [
        ['Total comptes créés', stats.totalUsers],
        ['Étudiants CPS actifs', stats.cpsUsers],
        ['Comptes Alumni', stats.alumniUsers],
        ['Futurs étudiants', stats.futureUsers],
        ['Emails vérifiés', stats.emailVerified],
        ['Taux vérification email (%)', stats.totalUsers > 0 ? Math.round((stats.emailVerified / stats.totalUsers) * 100) : 0],
        ['Connexion Google', stats.googleUsers],
        ['Connexion GitHub', stats.githubUsers],
        ['Connexion Email/Password', stats.emailUsers],
      ],
    },
    {
      title: 'Profils Alumni',
      rows: [
        ['Total profils créés', alumni?.totalProfiles ?? 0],
        ['Profils validés', alumni?.approvedProfiles ?? 0],
        ['En attente de validation', alumni?.pendingProfiles ?? 0],
        ['Profils rejetés', alumni?.rejectedProfiles ?? 0],
        ["Taux d'approbation (%)", approvalRate],
        ['Avec photo de profil', stats.alumniWithPhoto],
        ['Avec LinkedIn', stats.alumniWithLinkedin],
        ['Avec expériences renseignées', stats.alumniWithExperiences],
        ['Complétude moyenne profil (%)', stats.avgCompleteness],
      ],
    },
    {
      title: 'Top Secteurs',
      rows: alumni ? Object.entries(alumni.profilesBySector).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => [k, v]) : [],
    },
    {
      title: 'Top Pays',
      rows: alumni ? Object.entries(alumni.profilesByCountry).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => [k, v]) : [],
    },
    {
      title: 'Répartition par promotion',
      rows: [
        ['Promotion', 'Inscrits (users)', 'Profils alumni'],
        ...Object.entries(mergedExport)
          .sort((a, b) => Number(b[0]) - Number(a[0]))
          .map(([y, d]) => [`Promo ${y}`, (d as { inscrits: number; profils: number }).inscrits, (d as { inscrits: number; profils: number }).profils]),
      ],
    },
    {
      title: 'Réseau & Engagement',
      rows: [
        ['Recommandations envoyées', stats.totalRecommendations],
        ['Demandes de contact', stats.totalContactRequests],
        ['Alumni proposant du mentoring', stats.alumniMentoring],
        ['Alumni en recherche active', stats.alumniSeeking],
      ],
    },
    {
      title: 'Forum',
      rows: [
        ['Fils de discussion', stats.forumThreads],
        ['Réponses / Posts', stats.forumPosts],
      ],
    },
    {
      title: 'Contenus & Activité',
      rows: [
        ['Feedbacks reçus', stats.feedbacks],
        ['Ateliers en attente', stats.pendingWorkshops],
        ['Webinaires créés', stats.webinars],
        ['Articles publiés', stats.publishedArticles],
      ],
    },
  ];
}

// ── Main component ───────────────────────────────────────────────────────────

const CommunityStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [
          alumniStats,
          usersSnap,
          alumniSnap,
          recommendationsCount,
          contactRequestsCount,
          forumThreadsCount,
          forumPostsCount,
          feedbacksCount,
          pendingWorkshopsCount,
          webinarsCount,
          publishedArticlesCount,
        ] = await Promise.all([
          getAlumniStats(),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'alumni')),
          getCountFromServer(collection(db, 'recommendations')).then(s => s.data().count).catch(() => 0),
          getCountFromServer(collection(db, 'contactRequests')).then(s => s.data().count).catch(() => 0),
          getCountFromServer(collection(db, 'forumThreads')).then(s => s.data().count).catch(() => 0),
          getCountFromServer(collection(db, 'forumPosts')).then(s => s.data().count).catch(() => 0),
          getCountFromServer(collection(db, 'feedback')).then(s => s.data().count).catch(() => 0),
          getCountFromServer(query(collection(db, 'workshopProposals'), where('status', '==', 'pending'))).then(s => s.data().count).catch(() => 0),
          getCountFromServer(collection(db, 'webinars')).then(s => s.data().count).catch(() => 0),
          getCountFromServer(query(collection(db, 'newsArticles'), where('status', '==', 'published'))).then(s => s.data().count).catch(() => 0),
        ]);

        let cpsUsers = 0, alumniUsers = 0, futureUsers = 0;
        let emailVerified = 0, googleUsers = 0, githubUsers = 0, emailUsers = 0;
        const usersByYear: Record<number, number> = {};
        usersSnap.forEach((d: DocumentData) => {
          const u = d.data();
          if (u.status === 'cps') cpsUsers++;
          else if (u.status === 'alumni') alumniUsers++;
          else if (u.status === 'future') futureUsers++;
          if (u.emailVerified) emailVerified++;
          const providers: { providerId?: string }[] = u.providerData || [];
          if (providers.some(p => p.providerId === 'google.com')) googleUsers++;
          else if (providers.some(p => p.providerId === 'github.com')) githubUsers++;
          else emailUsers++;
          if (typeof u.yearPromo === 'number') {
            usersByYear[u.yearPromo] = (usersByYear[u.yearPromo] || 0) + 1;
          }
        });

        let alumniWithPhoto = 0, alumniWithLinkedin = 0, alumniWithExperiences = 0;
        let totalCompleteness = 0, completenessCount = 0;
        let alumniMentoring = 0, alumniSeeking = 0;
        alumniSnap.forEach((d: DocumentData) => {
          const a = d.data();
          if (a.photo) alumniWithPhoto++;
          if (a.linkedin) alumniWithLinkedin++;
          if (Array.isArray(a.experiences) && a.experiences.length > 0) alumniWithExperiences++;
          if (typeof a.profileCompleteness === 'number') {
            totalCompleteness += a.profileCompleteness;
            completenessCount++;
          }
          if (Array.isArray(a.offering) && a.offering.some((o: string) => o.toLowerCase().includes('mentor'))) alumniMentoring++;
          if (Array.isArray(a.seeking) && a.seeking.length > 0) alumniSeeking++;
        });

        setStats({
          totalUsers: usersSnap.size,
          cpsUsers, alumniUsers, futureUsers, emailVerified,
          googleUsers, githubUsers, emailUsers,
          alumni: alumniStats,
          usersByYear,
          alumniWithPhoto, alumniWithLinkedin, alumniWithExperiences,
          avgCompleteness: completenessCount > 0 ? Math.round(totalCompleteness / completenessCount) : 0,
          totalRecommendations: recommendationsCount,
          totalContactRequests: contactRequestsCount,
          alumniMentoring, alumniSeeking,
          forumThreads: forumThreadsCount,
          forumPosts: forumPostsCount,
          feedbacks: feedbacksCount,
          pendingWorkshops: pendingWorkshopsCount,
          webinars: webinarsCount,
          publishedArticles: publishedArticlesCount,
        });
      } catch (e) {
        console.error('CommunityStats load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const approvalRate = stats.alumni && stats.alumni.totalProfiles > 0
    ? Math.round((stats.alumni.approvedProfiles / stats.alumni.totalProfiles) * 100)
    : 0;

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    setExporting(true);
    try {
      const sections = buildExportSections(stats, approvalRate);
      const lines: string[] = [];
      lines.push('Rapport Communauté CPS Connect');
      lines.push(`Généré le,${new Date().toLocaleDateString('fr-FR')}`);
      lines.push('');
      for (const section of sections) {
        lines.push(`# ${section.title}`);
        lines.push('Indicateur,Valeur');
        for (const [label, value] of section.rows) {
          lines.push(`"${label}",${value}`);
        }
        lines.push('');
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stats-communaute-cps-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [stats, approvalRate]);

  // ── Export Excel ────────────────────────────────────────────────────────────
  const exportExcel = useCallback(() => {
    setExporting(true);
    try {
      const sections = buildExportSections(stats, approvalRate);
      const wb = XLSX.utils.book_new();

      // Feuille synthèse : toutes les sections empilées
      const summaryRows: (string | number)[][] = [
        ['Rapport Communauté CPS Connect'],
        [`Généré le : ${new Date().toLocaleDateString('fr-FR')}`],
        [],
      ];
      for (const section of sections) {
        summaryRows.push([section.title, '']);
        summaryRows.push(['Indicateur', 'Valeur']);
        for (const row of section.rows) summaryRows.push(row as (string | number)[]);
        summaryRows.push([]);
      }
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 45 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Synthèse');

      // Une feuille par section
      for (const section of sections) {
        if (section.rows.length === 0) continue;
        const ws = XLSX.utils.aoa_to_sheet([
          [section.title],
          ['Indicateur', 'Valeur'],
          ...section.rows as (string | number)[][],
        ]);
        ws['!cols'] = [{ wch: 45 }, { wch: 15 }];
        const sheetName = section.title.slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      XLSX.writeFile(wb, `stats-communaute-cps-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  }, [stats, approvalRate]);

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const exportPDF = useCallback(() => {
    setExporting(true);
    try {
      const sections = buildExportSections(stats, approvalRate);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = new jsPDF() as any;
      const dateStr = new Date().toLocaleDateString('fr-FR');
      const BLUE = [30, 58, 138] as [number, number, number];
      const AMBER = [217, 119, 6] as [number, number, number];

      // ── Page de couverture ──
      doc.setFillColor(...BLUE);
      doc.rect(0, 0, 210, 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Rapport Communauté CPS Connect', 14, 30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Généré le ${dateStr}`, 14, 42);

      // Sommaire rapide
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicateurs clés', 14, 76);

      const highlights = [
        [`${stats.totalUsers}`, 'Comptes créés'],
        [`${stats.alumni?.approvedProfiles ?? 0}`, 'Alumni validés'],
        [`${approvalRate}%`, "Taux d'approbation"],
        [`${stats.cpsUsers}`, 'Étudiants CPS'],
        [`${stats.forumThreads}`, 'Fils de discussion'],
        [`${stats.feedbacks}`, 'Feedbacks'],
      ];
      highlights.forEach(([val, lbl], i) => {
        const x = 14 + (i % 3) * 62;
        const y = 86 + Math.floor(i / 3) * 28;
        doc.setFillColor(245, 247, 255);
        doc.roundedRect(x, y, 58, 22, 3, 3, 'F');
        doc.setTextColor(...AMBER);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(val, x + 4, y + 13);
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(lbl, x + 4, y + 20);
      });

      let currentY = 152;

      // ── Sections ──
      for (const section of sections) {
        if (section.rows.length === 0) continue;

        // Titre de section
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        doc.setFillColor(...BLUE);
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, 17, currentY + 5.5);
        currentY += 10;

        autoTable(doc, {
          head: [['Indicateur', 'Valeur']],
          body: section.rows,
          startY: currentY,
          margin: { left: 14, right: 14 },
          headStyles: {
            fillColor: [219, 234, 254],
            textColor: [30, 58, 138],
            fontStyle: 'bold',
            fontSize: 9,
          },
          bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          columnStyles: {
            0: { cellWidth: 140 },
            1: { cellWidth: 42, halign: 'right' },
          },
          didDrawPage: () => { currentY = 20; },
        });

        currentY = (doc.lastAutoTable?.finalY ?? currentY) + 8;
      }

      // ── Pied de page sur chaque page ──
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(245, 247, 255);
        doc.rect(0, 284, 210, 13, 'F');
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('CPS Connect — Rapport généré automatiquement', 14, 291);
        doc.text(`Page ${i} / ${pageCount}`, 196, 291, { align: 'right' });
      }

      doc.save(`rapport-communaute-cps-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(false);
    }
  }, [stats, approvalRate]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        <span className="ml-3 text-zinc-500">Chargement des statistiques…</span>
      </div>
    );
  }

  const { alumni } = stats;
  const topSectors = alumni
    ? Object.entries(alumni.profilesBySector).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];
  const topCountries = alumni
    ? Object.entries(alumni.profilesByCountry).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];
  // Fusion users.yearPromo + alumni.profilesByYear
  const mergedPromos: Record<number, { inscrits: number; profils: number }> = {};
  Object.entries(stats.usersByYear).forEach(([y, count]) => {
    const year = Number(y);
    if (!mergedPromos[year]) mergedPromos[year] = { inscrits: 0, profils: 0 };
    mergedPromos[year].inscrits = count;
  });
  if (alumni) {
    Object.entries(alumni.profilesByYear).forEach(([y, count]) => {
      const year = Number(y);
      if (!mergedPromos[year]) mergedPromos[year] = { inscrits: 0, profils: 0 };
      mergedPromos[year].profils = count;
    });
  }
  const promoByYear = Object.entries(mergedPromos)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 8);

  return (
    <div className="space-y-2">

      {/* ── Barre d'export ── */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-zinc-500">Données en temps réel depuis Firestore</p>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Export…' : 'Exporter'}
            <svg className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {[
                { label: 'CSV (.csv)', action: exportCSV, color: 'text-zinc-700' },
                { label: 'Excel (.xlsx)', action: exportExcel, color: 'text-green-700' },
                { label: 'PDF (.pdf)', action: exportPDF, color: 'text-blue-700' },
              ].map(({ label, action, color }) => (
                <button
                  key={label}
                  onClick={() => { setDropdownOpen(false); action(); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium ${color} hover:bg-zinc-50 flex items-center gap-2`}
                >
                  <Download className="w-4 h-4 opacity-60" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 1. COMPTES ── */}
      <SectionTitle title="Comptes utilisateurs" icon={<Users className="w-5 h-5" />} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard label="Total comptes créés" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} color="blue" />
        <KpiCard label="Étudiants CPS actifs" value={stats.cpsUsers} icon={<UserCheck className="w-5 h-5" />} color="blue" />
        <KpiCard label="Comptes Alumni" value={stats.alumniUsers} icon={<Star className="w-5 h-5" />} color="purple" />
        <KpiCard label="Futurs étudiants" value={stats.futureUsers} icon={<Clock className="w-5 h-5" />} color="amber" />
        <KpiCard
          label="Email vérifiés"
          value={stats.totalUsers > 0 ? `${Math.round((stats.emailVerified / stats.totalUsers) * 100)}%` : '—'}
          icon={<Mail className="w-5 h-5" />}
          color="green"
          sub={`${stats.emailVerified} / ${stats.totalUsers}`}
        />
        <KpiCard label="Connexion Google" value={stats.googleUsers} icon={<Globe className="w-5 h-5" />} color="rose" />
        <KpiCard label="Connexion GitHub" value={stats.githubUsers} icon={<Globe className="w-5 h-5" />} color="zinc" />
        <KpiCard label="Connexion Email" value={stats.emailUsers} icon={<Mail className="w-5 h-5" />} color="blue" />
      </div>

      {/* ── 2. PROFILS ALUMNI ── */}
      <SectionTitle title="Profils Alumni" icon={<UserCheck className="w-5 h-5" />} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="Total profils créés" value={alumni?.totalProfiles ?? 0} icon={<Users className="w-5 h-5" />} color="purple" />
        <KpiCard label="Profils validés" value={alumni?.approvedProfiles ?? 0} icon={<UserCheck className="w-5 h-5" />} color="green" />
        <KpiCard label="En attente de validation" value={alumni?.pendingProfiles ?? 0} icon={<Clock className="w-5 h-5" />} color="amber" />
        <KpiCard label="Taux d'approbation" value={`${approvalRate}%`} icon={<TrendingUp className="w-5 h-5" />} color="green" sub={`${alumni?.approvedProfiles ?? 0} validés / ${alumni?.totalProfiles ?? 0}`} />
        <KpiCard label="Profils rejetés" value={alumni?.rejectedProfiles ?? 0} icon={<UserX className="w-5 h-5" />} color="rose" />
        <KpiCard label="Avec photo de profil" value={stats.alumniWithPhoto} icon={<UserCheck className="w-5 h-5" />} color="purple" />
        <KpiCard label="Avec LinkedIn" value={stats.alumniWithLinkedin} icon={<Globe className="w-5 h-5" />} color="blue" />
        <KpiCard label="Avec expériences renseignées" value={stats.alumniWithExperiences} icon={<Briefcase className="w-5 h-5" />} color="blue" />
        <KpiCard
          label="Complétude moyenne profil"
          value={stats.avgCompleteness > 0 ? `${stats.avgCompleteness}%` : '—'}
          icon={<Star className="w-5 h-5" />}
          color="amber"
          sub={stats.avgCompleteness === 0 ? 'Champ profileCompleteness non renseigné' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topSectors.length > 0 && (
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Top 5 Secteurs</h3>
            {topSectors.map(([sector, count]) => (
              <TopBar key={sector} label={sector} count={count} total={alumni?.approvedProfiles ?? 1} color="bg-purple-500" />
            ))}
          </div>
        )}
        {topCountries.length > 0 && (
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Top 5 Pays</h3>
            {topCountries.map(([country, count]) => (
              <TopBar key={country} label={country} count={count} total={alumni?.approvedProfiles ?? 1} color="bg-blue-500" />
            ))}
          </div>
        )}
        {promoByYear.length > 0 && (
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Par promotion</h3>
            <div className="flex gap-4 text-xs text-zinc-400 mb-3">
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-500" />Inscrits</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-500" />Profils alumni</span>
            </div>
            {promoByYear.map(([year, data]) => {
              const { inscrits, profils } = data as { inscrits: number; profils: number };
              const maxVal = Math.max(inscrits, 1);
              return (
                <div key={year} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-zinc-700">Promo {year}</span>
                    <span className="text-zinc-400 text-xs">{inscrits} inscrits · {profils} profils</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="w-full bg-zinc-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.round((inscrits / maxVal) * 100)}%` }} />
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.round((profils / maxVal) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. RÉSEAU & ENGAGEMENT ── */}
      <SectionTitle title="Réseau & Engagement alumni" icon={<Heart className="w-5 h-5" />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Recommandations envoyées" value={stats.totalRecommendations} icon={<Send className="w-5 h-5" />} color="purple" />
        <KpiCard label="Demandes de contact" value={stats.totalContactRequests} icon={<Mail className="w-5 h-5" />} color="blue" />
        <KpiCard label="Alumni proposant du mentoring" value={stats.alumniMentoring} icon={<UserCheck className="w-5 h-5" />} color="green" />
        <KpiCard label="Alumni en recherche active" value={stats.alumniSeeking} icon={<TrendingUp className="w-5 h-5" />} color="amber" />
      </div>

      {/* ── 4. FORUM ── */}
      <SectionTitle title="Forum" icon={<MessageSquare className="w-5 h-5" />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Fils de discussion" value={stats.forumThreads} icon={<MessageSquare className="w-5 h-5" />} color="blue" />
        <KpiCard label="Réponses / Posts" value={stats.forumPosts} icon={<FileText className="w-5 h-5" />} color="blue" />
      </div>

      {/* ── 5. CONTENUS & ACTIVITÉ ── */}
      <SectionTitle title="Contenus & Activité" icon={<FileText className="w-5 h-5" />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Feedbacks reçus" value={stats.feedbacks} icon={<Heart className="w-5 h-5" />} color="rose" />
        <KpiCard label="Ateliers en attente" value={stats.pendingWorkshops} icon={<Clock className="w-5 h-5" />} color="amber" />
        <KpiCard label="Webinaires créés" value={stats.webinars} icon={<Video className="w-5 h-5" />} color="blue" />
        <KpiCard label="Articles publiés" value={stats.publishedArticles} icon={<Newspaper className="w-5 h-5" />} color="green" />
      </div>
    </div>
  );
};

export default CommunityStats;
