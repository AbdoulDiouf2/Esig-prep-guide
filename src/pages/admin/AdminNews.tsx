import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  Newspaper,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  getNewsArticles,
  addNewsArticle,
  updateNewsArticle,
  publishNewsArticle,
  unpublishNewsArticle,
  deleteNewsArticle,
} from '../../services/newsService';
import { NewsArticle, NewsArticleType, NewsStatus, NEWS_TYPE_LABELS } from '../../types/news';

const TYPE_OPTIONS: { value: NewsArticleType; label: string }[] = [
  { value: 'annonce', label: 'Annonce' },
  { value: 'success_story', label: 'Success story' },
  { value: 'evenement', label: 'Événement' },
  { value: 'nouveaute', label: 'Nouveauté' },
];

const EMPTY_FORM = {
  title: '',
  summary: '',
  content: '',
  type: 'annonce' as NewsArticleType,
  tags: '',
  coverImageUrl: '',
  status: 'draft' as NewsStatus,
};

const AdminNews: React.FC = () => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<NewsStatus | 'all'>('all');

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await getNewsArticles();
      setArticles(data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const openCreate = () => {
    setEditingArticle(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      type: article.type,
      tags: article.tags.join(', '),
      coverImageUrl: article.coverImageUrl || '',
      status: article.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        title: form.title,
        summary: form.summary,
        content: form.content,
        type: form.type,
        tags,
        status: form.status,
        coverImageUrl: form.coverImageUrl || undefined,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email || 'Admin',
        publishedAt: form.status === 'published' ? Date.now() : undefined,
      };
      if (editingArticle) {
        await updateNewsArticle(editingArticle.id, payload);
      } else {
        await addNewsArticle(payload);
      }
      setShowForm(false);
      await loadArticles();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (article: NewsArticle) => {
    try {
      if (article.status === 'published') {
        await unpublishNewsArticle(article.id);
      } else {
        await publishNewsArticle(article.id);
      }
      await loadArticles();
    } catch (err) {
      console.error(err);
      setError('Erreur lors du changement de statut.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet article définitivement ?')) return;
    try {
      await deleteNewsArticle(id);
      await loadArticles();
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la suppression.');
    }
  };

  const filtered = articles.filter((a) => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link
            to="/admin"
            className="inline-flex items-center text-blue-200 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="w-7 h-7 text-amber-400" />
              <div>
                <h1 className="text-2xl font-bold">Gestion des actualités</h1>
                <p className="text-blue-200 text-sm mt-1">{articles.length} article(s) au total</p>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvel article
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            {error}
            <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setError(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par titre ou auteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as NewsStatus | 'all')}
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="text-center py-16 text-zinc-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
            <Newspaper className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">Aucun article trouvé.</p>
            <button onClick={openCreate} className="mt-4 text-blue-700 hover:underline text-sm font-medium">
              Créer le premier article
            </button>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 text-zinc-600 font-medium">Titre</th>
                  <th className="text-left px-4 py-3 text-zinc-600 font-medium hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-zinc-600 font-medium hidden lg:table-cell">Auteur</th>
                  <th className="text-left px-4 py-3 text-zinc-600 font-medium">Statut</th>
                  <th className="text-left px-4 py-3 text-zinc-600 font-medium hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 text-zinc-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((article) => (
                  <tr key={article.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-800 line-clamp-1">{article.title}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <TypeBadge type={article.type} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500 hidden lg:table-cell">{article.authorName}</td>
                    <td className="px-4 py-3">
                      {article.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> Publié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full text-xs font-medium">
                          <Eye className="w-3 h-3" /> Brouillon
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 hidden lg:table-cell">
                      {formatDate(article.publishedAt ?? article.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePublish(article)}
                          title={article.status === 'published' ? 'Dépublier' : 'Publier'}
                          className="text-zinc-400 hover:text-blue-600 transition-colors"
                        >
                          {article.status === 'published' ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(article)}
                          title="Modifier"
                          className="text-zinc-400 hover:text-amber-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          title="Supprimer"
                          className="text-zinc-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-lg font-bold text-blue-900">
                {editingArticle ? "Modifier l'article" : 'Nouvel article'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Titre *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre de l'article"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Type *</label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as NewsArticleType })}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as NewsStatus })}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Résumé *</label>
                <textarea
                  required
                  rows={3}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Résumé court affiché sur la liste (≤ 300 caractères)"
                  maxLength={300}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Contenu *</label>
                <textarea
                  required
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Corps complet de l'article..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Tags <span className="text-zinc-400">(séparés par des virgules)</span>
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="visa, esigelec, bourse..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Image de couverture <span className="text-zinc-400">(URL optionnelle)</span>
                </label>
                <input
                  type="url"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Enregistrement...' : editingArticle ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TYPE_BADGE_STYLES: Record<NewsArticleType, string> = {
  annonce: 'bg-blue-100 text-blue-800',
  success_story: 'bg-green-100 text-green-800',
  evenement: 'bg-amber-100 text-amber-800',
  nouveaute: 'bg-purple-100 text-purple-800',
};

const TypeBadge: React.FC<{ type: NewsArticleType }> = ({ type }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE_STYLES[type]}`}>
    {NEWS_TYPE_LABELS[type]}
  </span>
);

export default AdminNews;
