import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';

export interface Invitation {
  id: string;
  email: string;
  role: 'user' | 'editor' | 'director' | 'staff' | 'admin';
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

/**
 * Creates an invitation document in Firestore and returns the token.
 */
export async function createInvitation(
  email: string,
  role: string,
  createdBy: string
): Promise<string> {
  const token = crypto.randomUUID();
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromDate(
    new Date(now.toDate().getTime() + 7 * 24 * 60 * 60 * 1000)
  );

  await addDoc(collection(db, 'invitations'), {
    email,
    role,
    token,
    status: 'pending',
    createdBy,
    createdAt: serverTimestamp(),
    expiresAt,
  });

  return token;
}

/**
 * Returns the invitation matching the token if it is still pending and not expired.
 */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const q = query(
    collection(db, 'invitations'),
    where('token', '==', token),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  const data = docSnap.data() as Omit<Invitation, 'id'>;

  // Check expiry client-side (Firestore rules can't do this easily without an index)
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
    return null;
  }

  return { id: docSnap.id, ...data };
}

/**
 * Marks an invitation as accepted.
 */
export async function acceptInvitation(token: string): Promise<void> {
  const q = query(collection(db, 'invitations'), where('token', '==', token));
  const snap = await getDocs(q);
  if (snap.empty) return;
  await updateDoc(doc(db, 'invitations', snap.docs[0].id), { status: 'accepted' });
}

/**
 * Marks an invitation as expired (revoke).
 */
export async function revokeInvitation(invitationId: string): Promise<void> {
  await updateDoc(doc(db, 'invitations', invitationId), { status: 'expired' });
}

/**
 * Returns all invitations ordered by creation date descending.
 */
export async function getInvitations(): Promise<Invitation[]> {
  const q = query(collection(db, 'invitations'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Invitation, 'id'>) }));
}
