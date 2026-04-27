import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, User, Tag, Edit, Share2, Check, Eye, Heart } from 'lucide-react';
import { getNewsArticle, getNewsArticles, toggleLike, recordView } from '../services/newsService';
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
  const { isAdmin, isEditor, currentUser } = useAuth();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeAnimating, setLikeAnimating] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const [data, all] = await Promise.all([
          getNewsArticle(id),
          getNewsArticles({ status: 'published' }),
        ]);
        if (!data) {
          setError('Article introuvable.');
        } else {
          setArticle(data);
          setLikesCount(data.likesCount);
          if (currentUser) {
            setLiked(data.likedBy.includes(currentUser.uid));
          }
          setRelated(all.filter((a) => a.id !== id).slice(0, 3));

          // Enregistrer la vue une seule fois par utilisateur
          if (currentUser && !data.viewedBy.includes(currentUser.uid)) {
            recordView(id, currentUser.uid).catch(console.error);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger cet article.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, currentUser]);

  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const canEdit = isAdmin() || isEditor();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: article?.title, url });
      } catch {
        // annulé par l'utilisateur
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = async () => {
    if (!currentUser || !id || likeAnimating) return;
    setLikeAnimating(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => c + (newLiked ? 1 : -1));
    try {
      await toggleLike(id, currentUser.uid, !newLiked);
    } catch (err) {
      // rollback
      setLiked(!newLiked);
      setLikesCount((c) => c + (newLiked ? -1 : 1));
      console.error(err);
    } finally {
      setTimeout(() => setLikeAnimating(false), 300);
    }
  };

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
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copié !</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Partager
                </>
              )}
            </button>
            {canEdit && (
              <Link
                to={isAdmin() ? '/admin/news' : '/editor/news'}
                className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </Link>
            )}
          </div>
        </div>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Badge + date */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
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

          {/* Auteur + stats */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-200">
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <User className="w-4 h-4" />
              <span>Par {article.authorName}</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {article.viewedBy.length}
              </span>
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 transition-colors group"
                title={liked ? "Ne plus aimer" : "J'aime"}
              >
                <motion.span
                  animate={likeAnimating ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="text-lg leading-none"
                >
                  {liked ? '❤️' : '🤍'}
                </motion.span>
                <span className={`font-medium tabular-nums ${liked ? 'text-red-500' : 'text-zinc-400 group-hover:text-red-400'}`}>
                  {likesCount}
                </span>
              </button>
            </div>
          </div>

          {/* Cover image */}
          {article.coverImageUrl && (
            <>
              <div className="mb-8 rounded-2xl overflow-hidden">
                <img
                  src={article.coverImageUrl}
                  alt={article.title}
                  className="w-full object-cover"
                />
              </div>
              <hr className="border-zinc-200 mb-8" />
            </>
          )}

          {/* Contenu */}
          <div className="prose prose-zinc max-w-none">
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-base">
              {article.content}
            </p>
          </div>

          {/* Tags + like en bas */}
          <div className="mt-10 pt-6 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-4">
            {article.tags.length > 0 ? (
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
            ) : <div />}

            {/* Gros bouton like bas de page */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 font-medium text-sm ${
                liked
                  ? 'bg-red-50 border-red-200 text-red-500'
                  : 'bg-white border-zinc-200 text-zinc-500 hover:border-red-200 hover:text-red-400'
              }`}
            >
              <motion.span
                animate={likeAnimating ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.3 }}
                className="text-base leading-none"
              >
                {liked ? '❤️' : '🤍'}
              </motion.span>
              {liked ? "J'aime · " : "J'aime · "}
              <span className="tabular-nums">{likesCount}</span>
            </button>
          </div>
        </motion.article>
      </div>

      {/* Articles suggérés */}
      {related.length > 0 && (
        <div className="border-t border-zinc-200 bg-zinc-50 mt-4">
          <div className="max-w-3xl mx-auto px-6 py-10">
            <h2 className="text-lg font-bold text-blue-900 mb-5">À lire aussi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((a) => (
                <Link
                  key={a.id}
                  to={`/news/${a.id}`}
                  className="flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={a.coverImageUrl}
                      alt={a.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <span className={`inline-block self-start px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE_STYLES[a.type]}`}>
                      {NEWS_TYPE_LABELS[a.type]}
                    </span>
                    <p className="text-sm font-bold text-blue-900 line-clamp-2 leading-snug">{a.title}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-auto pt-1">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {formatDate(a.publishedAt ?? a.createdAt)}
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Heart className="w-3 h-3 fill-red-400 text-red-400 flex-shrink-0" /> {a.likedBy.length}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsDetail;
