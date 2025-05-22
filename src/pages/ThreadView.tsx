import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getForumThread, getForumPosts, addForumPost } from '../services/forumService';
import { ForumThread, ForumPost } from '../types/forum';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MessageSquare, Clock, User, Send } from 'lucide-react';

const ThreadView: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Charger le thread et les posts
  useEffect(() => {
    const loadThreadAndPosts = async () => {
      if (!threadId) return;
      
      try {
        setLoading(true);
        
        // Charger le thread
        const threadData = await getForumThread(threadId);
        if (!threadData) {
          setError('Cette discussion n\'existe pas ou a été supprimée.');
          setLoading(false);
          return;
        }
        
        setThread(threadData);
        
        // Charger les posts
        const postsData = await getForumPosts(threadId);
        setPosts(postsData);
        
      } catch (err) {
        console.error('Erreur lors du chargement de la discussion:', err);
        setError('Impossible de charger la discussion. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    loadThreadAndPosts();
  }, [threadId]);
  
  // Gérer l'envoi d'une réponse
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !thread || !threadId || !replyContent.trim()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const newPost: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'isEdited'> = {
        threadId,
        content: replyContent,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Utilisateur',
        authorEmail: currentUser.email || undefined
      };
      
      await addForumPost(newPost);
      
      // Recharger les posts
      const updatedPosts = await getForumPosts(threadId);
      setPosts(updatedPosts);
      
      // Réinitialiser le formulaire
      setReplyContent('');
      
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la réponse:', err);
      alert('Impossible d\'envoyer votre réponse. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Formater la date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Discussion introuvable'}</p>
        </div>
        <div className="mt-4">
          <Link to="/forum" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Retour au forum
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="mb-4">
        <Link 
          to={thread.categoryId ? `/forum/category/${thread.categoryId}` : '/forum'} 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux discussions
        </Link>
      </div>
      
      {/* En-tête de la discussion */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{thread.title}</h1>
          <div className="flex items-center text-gray-500 text-sm">
            <User className="w-4 h-4 mr-1" />
            <span className="mr-4">{thread.authorName}</span>
            <Clock className="w-4 h-4 mr-1" />
            <span>{formatDate(thread.createdAt)}</span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="prose max-w-none">
            {thread.content.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
      
      {/* Réponses */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span>Réponses</span>
          {posts.length > 0 && <span className="text-gray-500 text-sm">({posts.length})</span>}
        </h2>
        
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                  <div className="flex items-center text-gray-700">
                    <User className="w-4 h-4 mr-1" />
                    <span className="font-medium">{post.authorName}</span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{formatDate(post.createdAt)}</span>
                    {post.isEdited && <span className="ml-2 text-xs">(modifié)</span>}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="prose max-w-none">
                    {post.content.split('\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune réponse pour le moment. Soyez le premier à répondre !</p>
          </div>
        )}
      </div>
      
      {/* Formulaire de réponse */}
      {!thread.isLocked ? (
        currentUser ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-medium text-gray-800">Votre réponse</h3>
            </div>
            
            <form onSubmit={handleReplySubmit} className="p-4">
              <div className="mb-4">
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="Rédigez votre réponse ici..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  required
                  disabled={submitting}
                ></textarea>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting || !replyContent.trim()}
                >
                  {submitting ? 'Envoi en cours...' : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Envoyer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800 mb-2">Vous devez être connecté pour répondre à cette discussion.</p>
            <button
              onClick={() => navigate('/login', { state: { from: `/forum/thread/${threadId}` } })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Se connecter
            </button>
          </div>
        )
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-700">
          <p>Cette discussion est verrouillée et n'accepte plus de nouvelles réponses.</p>
        </div>
      )}
    </div>
  );
};

export default ThreadView;
