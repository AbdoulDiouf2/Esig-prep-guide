import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeedbackItem {
  id: string;
  message: string;
  email?: string | null;
  userId?: string | null;
  createdAt?: { seconds: number; nanoseconds: number };
}

const FeedbackAdmin: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items: FeedbackItem[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeedbackItem[];
      setFeedbacks(items);
      setLoading(false);
    };
    fetchFeedbacks();
  }, []);

  return (
    <div className="min-h-[60vh] bg-gray-50 py-12 px-2">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-3 md:p-4 border border-blue-100 relative">
        <Link to="/admin" className="absolute left-3 top-3 flex items-center text-blue-700 hover:text-blue-900 font-medium text-xs">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour admin
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 text-center mt-4">Feedbacks utilisateurs</h1>
        {loading ? (
          <div className="text-center py-8 text-blue-700 font-semibold text-sm">Chargement...</div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">Aucun feedback pour le moment.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {feedbacks.map(fb => (
              <div
                key={fb.id}
                className="flex flex-col border border-blue-100 bg-blue-50/60 rounded-md px-3 py-2 hover:bg-blue-100 transition group"
                title={fb.message}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-gray-500">
                    {fb.createdAt &&
                      new Date(fb.createdAt.seconds * 1000).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                  </span>
                  <span className="text-xs">
                    {fb.email && fb.email.trim() !== '' ? (
                      <a href={`mailto:${fb.email}`} className="flex items-center text-blue-700 hover:underline">
                        <Mail className="w-3 h-3 mr-1" /> {fb.email}
                      </a>
                    ) : (
                      <span className="italic text-gray-500">Utilisateur Anonyme</span>
                    )}
                  </span>
                </div>
                <div className="text-xs text-gray-900 font-medium max-w-full whitespace-pre-line">
                  {fb.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackAdmin;
