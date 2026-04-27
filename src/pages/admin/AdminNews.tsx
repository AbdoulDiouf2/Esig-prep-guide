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
  BarChart2,
  X,
  Heart,
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
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  const [statsArticle, setStatsArticle] = useState<NewsArticle | null>(null);
  const [statsUsers, setStatsUsers] = useState<{ viewers: string[]; likers: string[] }>({ viewers: [], likers: [] });
  const [statsLoading, setStatsLoading] = useState(false);

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

  const openStats = async (article: NewsArticle) => {
    setStatsArticle(article);
    setStatsLoading(true);
    setStatsUsers({ viewers: [], likers: [] });
    const allUids = [...new Set([...article.viewedBy, ...article.likedBy])];
    const names: Record<string, string> = {};
    await Promise.all(
      allUids.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          names[uid] = snap.exists()
            ? (snap.data().displayName as string) || snap.data().email as string || uid
            : uid;
        } catch {
          names[uid] = uid;
        }
      })
    );
    setStatsUsers({
      viewers: article.viewedBy.map((uid) => names[uid] || uid),
      likers: article.likedBy.map((uid) => names[uid] || uid),
    });
    setStatsLoading(false);
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
                  <th className="text-left px-4 py-3 text-zinc-600 font-medium hidden md:table-cell">Stats</th>
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
                    <td className="px-4 py-3 text-zinc-500 hidden lg:table-cell whitespace-nowrap">
                      {formatDate(article.publishedAt ?? article.createdAt)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <button
                        onClick={() => openStats(article)}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-700 transition-colors bg-zinc-50 border border-zinc-200 rounded-full px-2.5 py-1"
                      >
                        <Eye className="w-3 h-3" /> {article.viewedBy.length}
                        <span className="w-px h-3 bg-zinc-200" />
                        <Heart className="w-3 h-3 fill-red-400 text-red-400" /> {article.likedBy.length}
                      </button>
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

      {/* Modal statistiques */}
      {statsArticle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setStatsArticle(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-700" />
                <h2 className="text-base font-bold text-blue-900 line-clamp-1">{statsArticle.title}</h2>
              </div>
              <button onClick={() => setStatsArticle(null)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-6">
              {statsLoading ? (
                <p className="text-center text-zinc-400 py-6">Chargement...</p>
              ) : (
                <>
                  {/* Vues */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-4 h-4 text-zinc-400" />
                      <h3 className="text-sm font-semibold text-zinc-700">
                        Vues <span className="text-zinc-400 font-normal">({statsUsers.viewers.length})</span>
                      </h3>
                    </div>
                    {statsUsers.viewers.length === 0 ? (
                      <p className="text-zinc-400 text-sm">Aucune vue pour le moment.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {statsUsers.viewers.map((name, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </span>
                            {name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Likes */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">❤️</span>
                      <h3 className="text-sm font-semibold text-zinc-700">
                        J'aime <span className="text-zinc-400 font-normal">({statsUsers.likers.length})</span>
                      </h3>
                    </div>
                    {statsUsers.likers.length === 0 ? (
                      <p className="text-zinc-400 text-sm">Aucun like pour le moment.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {statsUsers.likers.map((name, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 bg-red-50 rounded-lg px-3 py-2">
                            <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </span>
                            {name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
