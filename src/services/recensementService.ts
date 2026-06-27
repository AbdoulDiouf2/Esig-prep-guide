import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Recensement, RecensementStats, CreateRecensementData } from '../types/recensement';

const COLLECTION = 'recensements';

export async function createRecensement(
  data: CreateRecensementData,
  createdBy: string
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    title: data.title,
    year: data.year,
    closedAt: data.closedAt,
    notes: data.notes,
    createdAt: Timestamp.now(),
    createdBy,
    status: 'pending',
    importedAt: null,
    stats: {
      totalForms: data.totalForms,
      newAccounts: 0,
      updatedAccounts: 0,
      alreadyExisted: 0,
      errors: 0,
    },
  });
  return ref.id;
}

export async function getRecensements(): Promise<Recensement[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy('year', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Recensement));
}

export async function getRecensement(id: string): Promise<Recensement | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Recensement;
}

export async function updateRecensement(
  id: string,
  data: Partial<Omit<Recensement, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data as Record<string, unknown>);
}

export async function updateRecensementStats(
  id: string,
  stats: RecensementStats
): Promise<void> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  const existing = snap.data()?.stats as RecensementStats | undefined;
  const merged: RecensementStats = existing && existing.newAccounts > 0 ? {
    totalForms: existing.totalForms,
    newAccounts: existing.newAccounts + stats.newAccounts,
    updatedAccounts: existing.updatedAccounts + stats.updatedAccounts,
    alreadyExisted: existing.alreadyExisted + stats.alreadyExisted,
    errors: existing.errors + stats.errors,
  } : stats;
  await updateDoc(doc(db, COLLECTION, id), {
    stats: merged,
    status: merged.errors > 0 && merged.newAccounts > 0 ? 'partial' : 'imported',
    importedAt: Timestamp.now(),
  });
}

export async function computeImportedAlumniCount(importedFrom: string = 'bulk_import'): Promise<number> {
  const snap = await getDocs(
    query(collection(db, 'alumni'), where('importedFrom', '==', importedFrom))
  );
  return snap.size;
}

export async function syncRecensementFromBulkImport(id: string, importedFrom: string = 'bulk_import'): Promise<number> {
  const count = await computeImportedAlumniCount(importedFrom);
  await updateRecensementStats(id, {
    totalForms: count,
    newAccounts: count,
    updatedAccounts: 0,
    alreadyExisted: 0,
    errors: 0,
  });
  return count;
}

export async function deleteRecensement(id: string): Promise<void> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) throw new Error('Recensement introuvable');
  if (snap.data().status !== 'pending') {
    throw new Error('Impossible de supprimer un recensement déjà importé');
  }
  await deleteDoc(doc(db, COLLECTION, id));
}
