import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export interface AdminActivityLog {
  id: string;
  type: string; // 'Ajout', 'Suppression', 'Modification', etc.
  target: string; // 'Ressource', 'Section', 'FAQ', etc.
  targetId?: string;
  user?: string;
  date: string;
  details?: Record<string, unknown>;
}

export function useRecentAdminActivity(max = 20) {
  const [recentActivity, setRecentActivity] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'adminActivityLog'),
          orderBy('date', 'desc'),
          limit(max)
        );
        const snapshot = await getDocs(q);
        setRecentActivity(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdminActivityLog[]);
      } catch {
        setRecentActivity([]);
      }
      setLoading(false);
    };
    fetchActivity();
  }, [max]);

  return { recentActivity, loading };
}
