import { Timestamp } from 'firebase/firestore';

export type RecensementStatus = 'pending' | 'imported' | 'partial';

export interface RecensementStats {
  totalForms: number;
  newAccounts: number;
  updatedAccounts: number;
  alreadyExisted: number;
  errors: number;
}

export interface Recensement {
  id: string;
  title: string;
  year: number;
  closedAt: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
  status: RecensementStatus;
  importedAt: Timestamp | null;
  notes: string;
  stats: RecensementStats;
}

export interface CreateRecensementData {
  title: string;
  year: number;
  closedAt: Timestamp;
  notes: string;
  totalForms: number;
}
