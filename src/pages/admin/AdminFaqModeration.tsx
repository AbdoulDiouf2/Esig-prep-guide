import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Send, Trash2, ExternalLink } from 'lucide-react';
import { useContent, FAQItem } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import useNotifications from '../../hooks/useNotifications';
import ConfirmationModal from '../../components/ConfirmationModal';
import { logAdminActivity } from './adminActivityLog';

type ModerationFilter = 'pending' | 'unapproved' | 'all';

const formatDateFr = (isoDate?: string): string => {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const AdminFaqModeration: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const canModerate = usePermission('faq.moderate');
  const { faqItems, updateFAQItem, deleteFAQItem } = useContent();
  const { sendFaqAnswerNotification } = useNotifications();

  const currentUserDisplayName = (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined;

  const urlIndicatesAdmin = window.location.href.includes('/admin/');
  const isAdminMode = urlIndicatesAdmin;

  useEffect(() => {
    if (urlIndicatesAdmin && !canModerate) {
      navigate('/editor/faq-moderation');
    }
  }, [urlIndicatesAdmin, canModerate, navigate]);

  const [filter, setFilter] = useState<ModerationFilter>('pending');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FAQItem | null>(null);

  const isPending = (f: FAQItem) => !f.isAnswered;
  const isUnapproved = (f: FAQItem) => f.isAnswered && !f.isApproved;

  const counts = {
    pending: faqItems.filter(isPending).length,
    unapproved: faqItems.filter(isUnapproved).length,
    all: faqItems.length,
  };

  const filtered = (filter === 'pending'
    ? faqItems.filter(isPending)
    : filter === 'unapproved'
      ? faqItems.filter(isUnapproved)
      : faqItems
  ).slice().sort((a, b) => {
    const priority = (f: FAQItem) => (isPending(f) ? 0 : isUnapproved(f) ? 1 : 2);
    const diff = priority(a) - priority(b);
    if (diff !== 0) return diff;
    return (b.createdDate || '').localeCompare(a.createdDate || '');
  });

  const showFeedback = (success: boolean, msg: string) => {
    if (success) {
      setActionError('');
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(''), 3000);
    } else {
      setActionSuccess('');
      setActionError(msg);
      setTimeout(() => setActionError(''), 4000);
    }
  };

  const handleApprove = async (faq: FAQItem) => {
    setUpdatingId(faq.id);
    try {
      await updateFAQItem(faq.id, { isApproved: true });
      logAdminActivity({
        type: 'Modification',
        target: 'FAQ',
        targetId: faq.id,
        user: currentUserDisplayName,
        details: { question: faq.question, action: 'Approbation' }
      });
      showFeedback(true, 'Question approuvée.');
    } catch (error) {
      console.error('Erreur lors de l\'approbation de la FAQ:', error);
      showFeedback(false, 'Échec de l\'approbation. Réessayez.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendAnswer = async (faq: FAQItem) => {
    const answer = (draftAnswers[faq.id] ?? '').trim();
    if (!answer) {
      showFeedback(false, 'La réponse ne peut pas être vide.');
      return;
    }
    setUpdatingId(faq.id);
    try {
      await updateFAQItem(faq.id, {
        answer,
        isAnswered: true,
        updatedDate: new Date().toISOString().split('T')[0]
      });
      logAdminActivity({
        type: 'Modification',
        target: 'FAQ',
        targetId: faq.id,
        user: currentUserDisplayName,
        details: { question: faq.question, action: 'Réponse' }
      });
      sendFaqAnswerNotification(faq.id, faq.question, answer).catch(error => {
        console.error('Erreur lors de l\'envoi de la notification FAQ:', error);
      });
      setDraftAnswers(prev => {
        const next = { ...prev };
        delete next[faq.id];
        return next;
      });
      showFeedback(true, 'Réponse envoyée.');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la réponse:', error);
      showFeedback(false, 'Échec de l\'enregistrement de la réponse. Réessayez.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteClick = (faq: FAQItem) => {
    setDeleteTarget(faq);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setUpdatingId(deleteTarget.id);
    try {
      await deleteFAQItem(deleteTarget.id);
      logAdminActivity({
        type: 'Suppression',
        target: 'FAQ',
        targetId: deleteTarget.id,
        user: currentUserDisplayName,
        details: { question: deleteTarget.question }
      });
      showFeedback(true, 'Question supprimée.');
    } catch (error) {
      console.error('Erreur lors de la suppression de la FAQ:', error);
      showFeedback(false, 'Échec de la suppression. Réessayez.');
    } finally {
      setUpdatingId(null);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {(actionSuccess || actionError) && (
        <div
          className={`fixed top-6 right-6 p-4 rounded-md shadow-lg z-50 text-sm ${
            actionSuccess ? 'bg-green-100 border-l-4 border-green-500 text-green-800' : 'bg-red-100 border-l-4 border-red-500 text-red-800'
          }`}
        >
          {actionSuccess || actionError}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">Modérer la FAQ</h1>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            ['pending', `En attente (${counts.pending})`],
            ['unapproved', `Non approuvées (${counts.unapproved})`],
            ['all', `Toutes (${counts.all})`],
          ] as [ModerationFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filter === key
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Aucune question dans cette catégorie.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(faq => (
              <div
                key={faq.id}
                className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2 gap-3">
                  <p className="text-sm font-medium text-gray-900">{faq.question}</p>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {!faq.isAnswered && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-800">En attente</span>
                    )}
                    {faq.isApproved ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-800">Approuvée</span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-800">Non approuvée</span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{faq.category} {faq.phase ? `• ${faq.phase}` : ''}</span>
                  <span>
                    Posée par {faq.userEmail || (faq.userId ? `utilisateur ${faq.userId}` : 'anonyme')}
                  </span>
                  <span>Créée le {formatDateFr(faq.createdDate)}</span>
                  {faq.updatedDate && faq.updatedDate !== faq.createdDate && (
                    <span>Mise à jour le {formatDateFr(faq.updatedDate)}</span>
                  )}
                </div>

                {faq.isAnswered && faq.answer && (
                  <p className="text-sm text-gray-700 whitespace-pre-line mb-3 bg-gray-50 rounded-md p-3">{faq.answer}</p>
                )}

                {!faq.isAnswered && (
                  <div className="mb-3">
                    <textarea
                      rows={3}
                      placeholder="Écrire une réponse..."
                      className="block w-full rounded-md border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all text-sm px-3 py-2"
                      value={draftAnswers[faq.id] ?? ''}
                      onChange={e => setDraftAnswers(prev => ({ ...prev, [faq.id]: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                  <div className="flex gap-2">
                    {!faq.isAnswered && (
                      <button
                        disabled={updatingId === faq.id}
                        onClick={() => handleSendAnswer(faq)}
                        className="inline-flex items-center text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5 mr-1" /> Envoyer la réponse
                      </button>
                    )}
                    {!faq.isApproved && (
                      <button
                        disabled={updatingId === faq.id}
                        onClick={() => handleApprove(faq)}
                        className="inline-flex items-center text-xs px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Approuver
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`${isAdminMode ? '/admin' : '/editor'}/content?edit=${faq.id}&mode=faq`)}
                      className="inline-flex items-center text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Édition avancée
                    </button>
                    <button
                      disabled={updatingId === faq.id}
                      onClick={() => handleDeleteClick(faq)}
                      className="inline-flex items-center text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer la question "${deleteTarget?.question}" ? Cette action est irréversible.`}
        confirmButtonText="Supprimer"
        type="danger"
      />
    </div>
  );
};

export default AdminFaqModeration;
