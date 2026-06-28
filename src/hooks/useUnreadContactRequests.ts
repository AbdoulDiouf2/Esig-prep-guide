import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useUnreadContactRequests(): number {
  const { currentUser } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!currentUser) { setCount(0); return; }

    const q = query(
      collection(db, 'contactRequests'),
      where('toUid', '==', currentUser.uid),
    );

    const unsub = onSnapshot(q, snap => {
      const unread = snap.docs.filter(d => !d.data().isRead).length;
      setCount(unread);
    });

    return unsub;
  }, [currentUser]);

  return count;
}
