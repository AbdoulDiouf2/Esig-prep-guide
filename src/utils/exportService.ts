import { AlumniProfile } from '../types/alumni';

/**
 * Service pour exporter les données alumni en CSV et PDF
 */

/**
 * Exporter les profils alumni en CSV
 */
export const exportToCSV = (profiles: AlumniProfile[], filename: string = 'alumni-export.csv'): void => {
  if (profiles.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Définir les colonnes
  const headers = [
    'Nom',
    'Email',
    'Année Promo',
    'Entreprise',
    'Poste',
    'Secteurs',
    'Expertises',
    'Ville',
    'Pays',
    'LinkedIn',
    'GitHub',
    'Twitter',
    'Statut',
    'Date Création',
    'Date Validation'
  ];

  // Créer les lignes de données
  const rows = profiles.map(profile => [
    profile.name || '',
    profile.email || '',
    profile.yearPromo?.toString() || '',
    profile.company || '',
    profile.position || '',
    profile.sectors?.join('; ') || '',
    profile.expertise?.join('; ') || '',
    profile.city || '',
    profile.country || '',
    profile.linkedin || '',
    profile.github || '',
    profile.twitter || '',
    profile.status || '',
    profile.dateCreated?.toDate?.()?.toLocaleDateString('fr-FR') || '',
    profile.dateValidation?.toDate?.()?.toLocaleDateString('fr-FR') || ''
  ]);

  // Combiner headers et rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Créer le blob et télécharger
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporter les profils alumni en PDF
 * Note: Nécessite une bibliothèque comme jsPDF pour une vraie implémentation
 * Pour l'instant, on génère un rapport HTML imprimable
 */
export const exportToPDF = (profiles: AlumniProfile[]): void => {
  if (profiles.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Créer le contenu HTML pour l'impression
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Rapport Alumni - ${new Date().toLocaleDateString('fr-FR')}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          font-size: 12px;
        }
        h1 {
          color: #1e40af;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 10px;
        }
        .summary {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .summary-item {
          display: inline-block;
          margin-right: 30px;
          margin-bottom: 10px;
        }
        .summary-label {
          font-weight: bold;
          color: #4b5563;
        }
        .summary-value {
          font-size: 24px;
          color: #1e40af;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #1e40af;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: bold;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
          background: #f9fafb;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 10px;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <h1>Rapport Annuaire Alumni ESIGELEC</h1>
      <p><strong>Date du rapport :</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      
      <div class="summary">
        <h2>Résumé</h2>
        <div class="summary-item">
          <div class="summary-label">Total profils</div>
          <div class="summary-value">${profiles.length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Profils approuvés</div>
          <div class="summary-value">${profiles.filter(p => p.status === 'approved').length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">En attente</div>
          <div class="summary-value">${profiles.filter(p => p.status === 'pending').length}</div>
        </div>
      </div>

      <h2>Liste des profils</h2>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Promo</th>
            <th>Entreprise</th>
            <th>Secteurs</th>
            <th>Localisation</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${profiles.map(profile => `
            <tr>
              <td>${profile.name || '-'}</td>
              <td>${profile.email || '-'}</td>
              <td>${profile.yearPromo || '-'}</td>
              <td>${profile.company || '-'}</td>
              <td>${profile.sectors?.join(', ') || '-'}</td>
              <td>${[profile.city, profile.country].filter(Boolean).join(', ') || '-'}</td>
              <td>${profile.status === 'approved' ? '✅ Approuvé' : profile.status === 'pending' ? '⏳ En attente' : '❌ Rejeté'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Rapport généré automatiquement par ESIG-prep-guide</p>
        <p>© ${new Date().getFullYear()} ESIGELEC Alumni</p>
      </div>

      <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
          Imprimer / Enregistrer en PDF
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-left: 10px;">
          Fermer
        </button>
      </div>
    </body>
    </html>
  `;

  // Ouvrir dans une nouvelle fenêtre pour impression
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('Veuillez autoriser les pop-ups pour exporter en PDF');
  }
};

/**
 * Calculer des statistiques sur les profils alumni
 */
export const calculateAlumniStats = (profiles: AlumniProfile[]) => {
  const total = profiles.length;
  const approved = profiles.filter(p => p.status === 'approved').length;
  const pending = profiles.filter(p => p.status === 'pending').length;
  const rejected = profiles.filter(p => p.status === 'rejected').length;

  // Statistiques par secteur
  const sectorCounts: Record<string, number> = {};
  profiles.forEach(profile => {
    profile.sectors?.forEach(sector => {
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });
  });

  // Statistiques par pays
  const countryCounts: Record<string, number> = {};
  profiles.forEach(profile => {
    if (profile.country) {
      countryCounts[profile.country] = (countryCounts[profile.country] || 0) + 1;
    }
  });

  // Statistiques par année de promo
  const promoCounts: Record<number, number> = {};
  profiles.forEach(profile => {
    if (profile.yearPromo) {
      promoCounts[profile.yearPromo] = (promoCounts[profile.yearPromo] || 0) + 1;
    }
  });

  // Top expertises
  const expertiseCounts: Record<string, number> = {};
  profiles.forEach(profile => {
    profile.expertise?.forEach(exp => {
      expertiseCounts[exp] = (expertiseCounts[exp] || 0) + 1;
    });
  });

  return {
    total,
    approved,
    pending,
    rejected,
    approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    sectorCounts,
    countryCounts,
    promoCounts,
    expertiseCounts,
    topSectors: Object.entries(sectorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5),
    topCountries: Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5),
    topExpertises: Object.entries(expertiseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10),
  };
};
