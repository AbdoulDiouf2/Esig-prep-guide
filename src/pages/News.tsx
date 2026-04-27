import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Newspaper, Search, Calendar, User } from 'lucide-react';
import { getNewsArticles } from '../services/newsService';
import { NewsArticle, NewsArticleType, NEWS_TYPE_LABELS } from '../types/news';

const TYPE_BADGE_STYLES: Record<NewsArticleType, string> = {
  annonce: 'bg-blue-100 text-blue-800',
  success_story: 'bg-green-100 text-green-800',
  evenement: 'bg-amber-100 text-amber-800',
  nouveaute: 'bg-purple-100 text-purple-800',
};

const FILTER_OPTIONS: { value: NewsArticleType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'annonce', label: 'Annonces' },
  { value: 'success_story', label: 'Success stories' },
  { value: 'evenement', label: 'Événements' },
  { value: 'nouveaute', label: 'Nouveautés' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const News: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<NewsArticleType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getNewsArticles({ status: 'published' });
        setArticles(data);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les actualités.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = articles.filter((a) => {
    const matchType = activeType === 'all' || a.type === activeType;
    const matchSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Newspaper className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <h1 className="text-xl font-bold leading-tight">Actualités</h1>
            <p className="text-blue-200 text-sm">Annonces, success stories, événements et nouveautés de la communauté.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Pills type */}
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActiveType(opt.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeType === opt.value
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">Chargement des actualités...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-sm">
            <Newspaper className="w-14 h-14 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg font-medium">Aucun article pour le moment.</p>
            <p className="text-zinc-400 text-sm mt-1">Revenez bientôt !</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((article) => (
              <motion.div key={article.id} variants={cardVariants}>
                <Link
                  to={`/news/${article.id}`}
                  className="block bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200 h-full"
                >
                  {article.coverImageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.coverImageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE_STYLES[article.type]}`}
                      >
                        {NEWS_TYPE_LABELS[article.type]}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-blue-900 mb-2 line-clamp-2 leading-snug">
                      {article.title}
                    </h2>
                    <p className="text-zinc-500 text-sm line-clamp-3 mb-4">{article.summary}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 border-t border-zinc-100 pt-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {article.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.publishedAt ?? article.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default News;
