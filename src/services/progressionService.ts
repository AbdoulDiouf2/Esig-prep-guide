import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function getUserProgression(userId: string): Promise<string[]> {
  const docRef = doc(db, 'progressions', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().completedSections || [];
  }
  return [];
}

export async function setUserProgression(userId: string, completedSections: string[]) {
  const docRef = doc(db, 'progressions', userId);
  try {
    await setDoc(docRef, { completedSections }, { merge: true });
    console.log('Progression enregistrée sur Firestore:', userId, completedSections);
  } catch (e) {
    console.error('Erreur Firestore progression:', e);
  }
}
