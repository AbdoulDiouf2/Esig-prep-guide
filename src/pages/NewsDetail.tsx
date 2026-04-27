import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, Tag, Edit } from 'lucide-react';
import { getNewsArticle } from '../services/newsService';
import { NewsArticle, NewsArticleType, NEWS_TYPE_LABELS } from '../types/news';
import { useAuth } from '../contexts/AuthContext';

const TYPE_BADGE_STYLES: Record<NewsArticleType, string> = {
  annonce: 'bg-blue-100 text-blue-800',
  success_story: 'bg-green-100 text-green-800',
  evenement: 'bg-amber-100 text-amber-800',
  nouveaute: 'bg-purple-100 text-purple-800',
};

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isEditor } = useAuth();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getNewsArticle(id);
        if (!data) {
          setError('Article introuvable.');
        } else {
          setArticle(data);
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger cet article.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const canEdit = isAdmin() || isEditor();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-500">
        Chargement...
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 text-lg">{error ?? 'Article introuvable.'}</p>
        <button
          onClick={() => navigate('/news')}
          className="flex items-center gap-2 text-blue-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux actualités
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Cover image */}
      {article.coverImageUrl && (
        <div className="w-full max-h-96 overflow-hidden">
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="w-full h-96 object-cover"
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-500 hover:text-blue-700 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          {canEdit && (
            <Link
              to="/admin/news"
              className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </Link>
          )}
        </div>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Badge + date */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${TYPE_BADGE_STYLES[article.type]}`}
            >
              {NEWS_TYPE_LABELS[article.type]}
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400 text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(article.publishedAt ?? article.createdAt)}
            </span>
          </div>

          {/* Titre */}
          <h1 className="text-2xl md:text-4xl font-bold text-blue-900 leading-tight mb-4">
            {article.title}
          </h1>

          {/* Auteur */}
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-8 pb-6 border-b border-zinc-200">
            <User className="w-4 h-4" />
            <span>Par {article.authorName}</span>
          </div>

          {/* Contenu */}
          <div className="prose prose-zinc max-w-none">
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-base">
              {article.content}
            </p>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-zinc-200">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="w-4 h-4 text-zinc-400" />
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-amber-50 text-amber-700 border border-amber-200 px-3 py-0.5 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.article>
      </div>
    </div>
  );
};

export default NewsDetail;
