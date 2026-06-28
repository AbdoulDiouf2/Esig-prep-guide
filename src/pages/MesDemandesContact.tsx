import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, Mail, Send, Inbox, ChevronDown, ChevronUp } from 'lucide-react';

interface ContactRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromEmail: string;
  toUid: string;
  toName: string;
  toEmail: string;
  subject: string;
  message: string;
  status: string;
  dateCreated: { seconds: number } | null;
}

const formatDate = (ts: { seconds: number } | null) => {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const RequestCard: React.FC<{ req: ContactRequest; side: 'sent' | 'received' }> = ({ req, side }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
      <button
        className="w-full flex items-start justify-between px-4 py-3 hover:bg-zinc-50 transition-colors text-left gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-blue-900 text-sm truncate">{req.subject || '(sans objet)'}</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {side === 'sent'
              ? <>À <span className="text-zinc-600 font-medium">{req.toName}</span></>
              : <>De <span className="text-zinc-600 font-medium">{req.fromName}</span></>
            }
            <span className="ml-2">{formatDate(req.dateCreated)}</span>
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 bg-zinc-50 border-t border-zinc-100 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Expéditeur</p>
              <p className="font-medium text-zinc-800">{req.fromName}</p>
              <a href={`mailto:${req.fromEmail}`} className="text-blue-600 hover:underline text-xs">{req.fromEmail}</a>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">Destinataire</p>
              <p className="font-medium text-zinc-800">{req.toName}</p>
              <a href={`mailto:${req.toEmail}`} className="text-blue-600 hover:underline text-xs">{req.toEmail}</a>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Objet</p>
            <p className="text-zinc-800">{req.subject || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Message</p>
            <p className="text-zinc-700 whitespace-pre-wrap bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs leading-relaxed">
              {req.message || '—'}
            </p>
          </div>
          {side === 'received' && (
            <a
              href={`mailto:${req.fromEmail}?subject=Re: ${req.subject}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> Répondre par email
            </a>
          )}
        </div>
      )}
    </div>
  );
};

const MesDemandesContact: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [received, setReceived] = useState<ContactRequest[]>([]);
  const [sent, setSent] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const load = async () => {
      setLoading(true);
      const col = collection(db, 'contactRequests');
      const [recSnap, sentSnap] = await Promise.all([
        getDocs(query(col, where('toUid', '==', currentUser.uid))),
        getDocs(query(col, where('fromUid', '==', currentUser.uid))),
      ]);
      const sort = (docs: typeof recSnap) =>
        docs.docs
          .map(d => ({ id: d.id, ...d.data() } as ContactRequest))
          .sort((a, b) => (b.dateCreated?.seconds ?? 0) - (a.dateCreated?.seconds ?? 0));
      setReceived(sort(recSnap));
      setSent(sort(sentSnap));
      setLoading(false);
    };
    load();
  }, [currentUser, navigate]);

  const list = tab === 'received' ? received : sent;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900">Mes demandes de contact</h1>
            <p className="text-sm text-zinc-400">Historique de vos échanges via l'annuaire alumni</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border border-zinc-200 rounded-xl overflow-hidden mb-6 bg-white shadow-sm">
          <button
            onClick={() => setTab('received')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === 'received' ? 'bg-blue-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}
          >
            <Inbox className="w-4 h-4" />
            Reçues
            {received.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'received' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                {received.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-l border-zinc-200 ${tab === 'sent' ? 'bg-blue-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}
          >
            <Send className="w-4 h-4" />
            Envoyées
            {sent.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'sent' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                {sent.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {tab === 'received' ? 'Aucune demande reçue' : 'Aucune demande envoyée'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(req => (
              <RequestCard key={req.id} req={req} side={tab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MesDemandesContact;
