import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Une table générique à exporter : en-têtes + lignes déjà formatées en string. */
export interface ExportTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export const exportTablesToCSV = (filename: string, tables: ExportTable[]): void => {
  const blocks = tables.map((t) => {
    const csv = Papa.unparse({ fields: t.headers, data: t.rows });
    return tables.length > 1 ? `${t.title}\n${csv}` : csv;
  });
  const content = blocks.join('\n\n');
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportTablesToPDF = (filename: string, mainTitle: string, subtitle: string, tables: ExportTable[]): void => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(mainTitle, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle, 14, 25);
  doc.setTextColor(0);

  let cursorY = 32;
  tables.forEach((t, i) => {
    if (i > 0) {
      doc.setFontSize(12);
      doc.text(t.title, 14, cursorY);
      cursorY += 4;
    }
    autoTable(doc, {
      head: [t.headers],
      body: t.rows,
      startY: cursorY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 20 },
      didDrawPage: () => {
        cursorY = 20;
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save(filename);
};
