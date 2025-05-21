import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function getAllUserProgressions() {
  const progressionSnap = await getDocs(collection(db, 'progressions'));
  const progressions: { userId: string, completedSections: string[] }[] = [];
  progressionSnap.forEach(docSnap => {
    progressions.push({
      userId: docSnap.id,
      completedSections: docSnap.data().completedSections || [],
    });
  });
  return progressions;
}
