import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Mail, Bug, Lightbulb, MessageCircle, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

type FeedbackType = 'bug' | 'suggestion' | 'remarque';
type FeedbackStatus = 'nouveau' | 'en_cours' | 'résolu' | 'ignoré';

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: React.ReactNode; badge: string; statBg: string }> = {
  bug:        { label: 'Bug',        icon: <Bug className="w-3.5 h-3.5" />,        badge: 'bg-red-100 text-red-700 border border-red-200',     statBg: 'bg-red-50 border-red-200 text-red-700' },
  suggestion: { label: 'Suggestion', icon: <Lightbulb className="w-3.5 h-3.5" />, badge: 'bg-amber-100 text-amber-700 border border-amber-200', statBg: 'bg-amber-50 border-amber-200 text-amber-700' },
  remarque:   { label: 'Remarque',   icon: <MessageCircle className="w-3.5 h-3.5" />, badge: 'bg-blue-100 text-blue-700 border border-blue-200',   statBg: 'bg-blue-50 border-blue-200 text-blue-700' },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string }> = {
  nouveau:  { label: 'Nouveau',  color: 'bg-gray-100 text-gray-700 border border-gray-300' },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700 border border-blue-300' },
  résolu:   { label: 'Résolu',   color: 'bg-green-100 text-green-700 border border-green-300' },
  ignoré:   { label: 'Ignoré',   color: 'bg-zinc-100 text-zinc-500 border border-zinc-300' },
};

const STATUS_OPTIONS: FeedbackStatus[] = ['nouveau', 'en_cours', 'résolu', 'ignoré'];

interface FeedbackItem {
  id: string;
  type?: FeedbackType;
  status?: FeedbackStatus;
  message: string;
  email?: string | null;
  userId?: string | null;
  createdAt?: { seconds: number; nanoseconds: number };
}

const FeedbackAdmin: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedbackType | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items: FeedbackItem[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as FeedbackItem[];
      setFeedbacks(items);
      setLoading(false);
    };
    fetchFeedbacks();
  }, []);

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, 'feedback', id), { status: newStatus });
      setFeedbacks(prev => prev.map(fb => fb.id === id ? { ...fb, status: newStatus } : fb));
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = {
    all: feedbacks.length,
    bug: feedbacks.filter(f => f.type === 'bug').length,
    suggestion: feedbacks.filter(f => f.type === 'suggestion').length,
    remarque: feedbacks.filter(f => (!f.type || f.type === 'remarque')).length,
  };

  const displayed = filter === 'all'
    ? feedbacks
    : filter === 'remarque'
      ? feedbacks.filter(f => !f.type || f.type === 'remarque')
      : feedbacks.filter(f => f.type === filter);

  const getType = (fb: FeedbackItem): FeedbackType => (fb.type && TYPE_CONFIG[fb.type] ? fb.type : 'remarque');
  const getStatus = (fb: FeedbackItem): FeedbackStatus => (fb.status && STATUS_CONFIG[fb.status] ? fb.status : 'nouveau');

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin" className="flex items-center text-blue-700 hover:text-blue-900 text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour admin
          </Link>
          <h1 className="text-2xl font-bold text-blue-900">Feedbacks utilisateurs</h1>
          <span className="ml-auto text-sm text-gray-500">{counts.all} au total</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(['bug', 'suggestion', 'remarque'] as FeedbackType[]).map(type => {
            const cfg = TYPE_CONFIG[type];
            return (
              <div key={type} className={`flex items-center gap-3 border rounded-lg px-4 py-3 ${cfg.statBg}`}>
                <span>{cfg.icon}</span>
                <div>
                  <div className="text-2xl font-bold">{counts[type]}</div>
                  <div className="text-xs font-medium">{cfg.label}s</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['all', 'bug', 'suggestion', 'remarque'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filter === f
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {f === 'all' ? `Tous (${counts.all})` : `${TYPE_CONFIG[f].label}s (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-16 text-blue-700 font-semibold">Chargement...</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun feedback dans cette catégorie.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayed.map(fb => {
              const type = getType(fb);
              const status = getStatus(fb);
              const typeCfg = TYPE_CONFIG[type];
              const statusCfg = STATUS_CONFIG[status];
              return (
                <div
                  key={fb.id}
                  className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${typeCfg.badge}`}>
                        {typeCfg.icon} {typeCfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {fb.createdAt && new Date(fb.createdAt.seconds * 1000).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {fb.email && fb.email.trim() !== '' ? (
                        <a href={`mailto:${fb.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Mail className="w-3.5 h-3.5" /> {fb.email}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Anonyme</span>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed mb-3">
                    {fb.message}
                  </p>

                  {/* Status selector */}
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                    <span className="text-xs text-gray-500 font-medium">Statut :</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s}
                          disabled={updatingId === fb.id}
                          onClick={() => handleStatusChange(fb.id, s)}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                            status === s
                              ? STATUS_CONFIG[s].color + ' ring-2 ring-offset-1 ring-current'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                          } disabled:opacity-50`}
                        >
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackAdmin;
