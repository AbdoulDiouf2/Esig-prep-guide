import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getForumThread, getForumPosts, addForumPost, deleteForumPost, deleteForumThread, updateThreadRepliesCount } from '../services/forumService';
import { ForumThread, ForumPost } from '../types/forum';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MessageSquare, Clock, User, Send, Trash2, AlertCircle, X, Loader } from 'lucide-react';

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
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState<'post' | 'thread' | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState<boolean>(false);
  
  // Charger le thread et les posts
  useEffect(() => {
    const loadThreadAndPosts = async () => {
      if (!threadId) return;
      
      try {
        setLoading(true);
        
        // Charger le thread
        const threadData = await getForumThread(threadId);
        setThread(threadData);
        
        const postsData = await getForumPosts(threadId);
        setPosts(postsData);
        
        // Vérifier et mettre à jour le compteur de réponses si nécessaire
        // Si le nombre de posts ne correspond pas au repliesCount stocké
        if (threadData && postsData.length !== threadData.repliesCount) {
          await updateThreadRepliesCount(threadId);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement de la discussion';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    if (threadId) {
      loadThreadAndPosts();
    }
  }, [threadId]);
  
  // Gérer l'envoi d'une réponse
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !thread || !threadId || !replyContent.trim()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Créer le nouveau message
      const newPost = {
        threadId,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Utilisateur',
        content: replyContent,
        createdAt: new Date(),
        isEdited: false
      };
      
      // Ajouter la réponse
      await addForumPost(newPost);
      
      // Vider le formulaire
      setReplyContent('');
      
      // Mettre à jour le compteur de réponses avec le nombre exact
      const actualCount = await updateThreadRepliesCount(threadId);
      
      // Recharger la liste des messages pour inclure le nouveau message
      const updatedPosts = await getForumPosts(threadId);
      setPosts(updatedPosts);
      
      // Mettre à jour le thread local avec le nouveau compteur de réponses
      if (thread) {
        setThread({...thread, repliesCount: actualCount});
      }
      
      // Faire défiler jusqu'au bas pour voir la nouvelle réponse
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    } catch (error) {
      alert('Erreur lors de l\'envoi de la réponse: ' + error);
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
  
  // Vérifier si l'utilisateur est l'auteur d'un élément (message ou discussion) ou un administrateur/super-administrateur
  const isAuthor = (authorId: string | undefined): boolean => {
    // Permettre à l'auteur du contenu de le supprimer
    const isContentAuthor = !!currentUser && !!authorId && currentUser.uid === authorId;
    
    // Permettre aux administrateurs et super-administrateurs de supprimer n'importe quel contenu
    const isAdminUser = !!currentUser && (currentUser.isAdmin === true || currentUser.isSuperAdmin === true);
    
    // Retourne vrai si l'utilisateur est l'auteur ou un administrateur
    return isContentAuthor || isAdminUser;
  };
  
  // Ouvrir la modale de confirmation de suppression
  const confirmDelete = (id: string, type: 'post' | 'thread') => {
    setDeletingItemId(id);
    setDeletingType(type);
    setShowDeleteModal(true);
  };
  
  // Fermer la modale de confirmation
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingItemId(null);
    setDeletingType(null);
  };
  
  // Exécuter la suppression
  const handleDelete = async () => {
    if (!deletingItemId || !deletingType || !threadId) {
      return;
    }
    
    setDeletingInProgress(true);
    
    try {
      if (deletingType === 'post') {
        // Supprimer le message
        await deleteForumPost(deletingItemId, threadId);
        
        // Mettre à jour le compteur de réponses avec le nombre exact
        const actualCount = await updateThreadRepliesCount(threadId);
        
        // Mettre à jour la liste des posts
        const updatedPosts = posts.filter(post => post.id !== deletingItemId);
        setPosts(updatedPosts);
        
        // Mettre à jour le thread local avec le nouveau compteur
        if (thread) {
          setThread({...thread, repliesCount: actualCount});
        }
      } else if (deletingType === 'thread') {
        await deleteForumThread(deletingItemId);
        
        // Rediriger vers la page du forum
        navigate('/forum');
        return; // Sortir de la fonction car on a redirigé
      }
      
      // Fermer la modale
      setShowDeleteModal(false);
      setDeletingItemId(null);
      setDeletingType(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Une erreur est survenue lors de la suppression. Veuillez réessayer.');
    } finally {
      setDeletingInProgress(false);
    }
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
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux discussions
        </Link>
      </div>
      
      {/* En-tête de la discussion */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{thread.title}</h1>
          
          <div className="flex items-center text-sm text-gray-500 gap-4">
            <div className="flex items-center">
              <User className="mr-1" size={14} />
              {thread.authorName}
            </div>
            <div className="flex items-center">
              <Clock className="mr-1" size={14} />
              {formatDate(thread.createdAt)}
            </div>
          </div>
        </div>
        
        {/* Bouton de suppression de la discussion (visible uniquement par l'auteur) */}
        {isAuthor(thread.authorId) && (
          <button 
            className="flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm"
            onClick={() => confirmDelete(thread.id, 'thread')}
          >
            <Trash2 className="mr-1" size={14} />
            Supprimer la discussion
          </button>
        )}
      </div>
      
      {/* Contenu de la discussion */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold mb-2">Contenu de la discussion</h2>
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
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{formatDate(post.createdAt)}</span>
                      {post.isEdited && <span className="ml-2 text-xs">(modifié)</span>}
                    </div>
                    
                    {/* Bouton de suppression pour les messages (visible uniquement par l'auteur) */}
                    {isAuthor(post.authorId) && (
                      <button
                        className="flex items-center text-red-500 hover:text-red-700 text-sm"
                        onClick={() => confirmDelete(post.id, 'post')}
                        title="Supprimer ce message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
      
      {/* Modale de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                Confirmer la suppression
              </h3>
              <button 
                onClick={cancelDelete}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="mb-4">
                {deletingType === 'thread' 
                  ? `Êtes-vous sûr de vouloir supprimer cette discussion ? Cette action supprimera également tous les messages associés et ne peut pas être annulée.` 
                  : `Êtes-vous sûr de vouloir supprimer ce message ? Cette action ne peut pas être annulée.`}
              </p>
              
              {/* Message spécial pour les administrateurs */}
              {currentUser && (currentUser.isAdmin === true || currentUser.isSuperAdmin === true) && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                  <p className="font-medium">Action administrative</p>
                  <p>En tant qu'administrateur, vous pouvez supprimer n'importe quel contenu du forum.</p>
                  <p>Utilisez cette capacité avec discernement et uniquement pour le contenu inapproprié ou qui enfreint les règles du forum.</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={deletingInProgress}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={deletingInProgress}
                >
                  {deletingInProgress ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadView;
