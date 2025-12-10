/* eslint-disable @typescript-eslint/no-explicit-any */
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedAlumniData {
  Nom: string;
  Prénom: string;
  Mail: string;
  Ville: string;
  'Promotion (année de sortie CPC)': string;
  'Poste Occupé ou Recherché': string;
  Domaine: string;
  'Précision de votre domaine': string;
  Commentaire?: string;
  [key: string]: any; // Pour les colonnes supplémentaires
}

export interface ParseResult {
  data: ParsedAlumniData[];
  errors: Array<{ row: number; message: string }>;
}

/**
 * Parse un fichier CSV
 */
export const parseCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const errors: Array<{ row: number; message: string }> = [];
        
        // Collecter les erreurs de parsing
        if (results.errors && results.errors.length > 0) {
          results.errors.forEach((error) => {
            errors.push({
              row: error.row || 0,
              message: error.message,
            });
          });
        }
        
        resolve({
          data: results.data as ParsedAlumniData[],
          errors,
        });
      },
      error: (error) => {
        reject(new Error(`Erreur de parsing CSV: ${error.message}`));
      },
    });
  });
};

/**
 * Parse un fichier Excel (.xlsx)
 */
export const parseXLSX = (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Impossible de lire le fichier'));
          return;
        }
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en JSON avec header
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }) as any[][];
        
        if (jsonData.length === 0) {
          resolve({ data: [], errors: [] });
          return;
        }
        
        // Première ligne = headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        // Convertir en objets
        const parsedData: ParsedAlumniData[] = rows.map((row) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        resolve({
          data: parsedData,
          errors: [],
        });
      } catch (error: any) {
        reject(new Error(`Erreur de parsing Excel: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur de lecture du fichier'));
    };
    
    reader.readAsBinaryString(file);
  });
};

/**
 * Nettoie et valide un email
 */
export const cleanEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Extrait l'année de promotion d'une chaîne
 * Ex: "2022", "Promo 2022", "2022-2023" → 2022
 */
export const extractYearPromo = (promo: string): number => {
  const match = promo.match(/\d{4}/);
  if (match) {
    const year = parseInt(match[0]);
    // Validation: année entre 2000 et 2050
    if (year >= 2000 && year <= 2050) {
      return year;
    }
  }
  // Par défaut, retourner l'année actuelle
  return new Date().getFullYear();
};

/**
 * Valide les données d'un alumni
 */
export const validateAlumniData = (row: ParsedAlumniData, rowNumber: number): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Email obligatoire
  if (!row.Mail || row.Mail.trim() === '') {
    errors.push('Email manquant');
  } else {
    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.Mail.trim())) {
      errors.push('Format email invalide');
    }
  }
  
  // Nom obligatoire
  if (!row.Nom || row.Nom.trim() === '') {
    errors.push('Nom manquant');
  }
  
  // Prénom obligatoire
  if (!row.Prénom || row.Prénom.trim() === '') {
    errors.push('Prénom manquant');
  }
  
  // Promotion obligatoire
  if (!row['Promotion (année de sortie CPC)'] || row['Promotion (année de sortie CPC)'].trim() === '') {
    errors.push('Année de promotion manquante');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
