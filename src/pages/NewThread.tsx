import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getForumCategories, addForumThread } from '../services/forumService';
import { ForumCategory } from '../types/forum';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send } from 'lucide-react';

const NewThread: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategoryId = queryParams.get('categoryId');
  
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId || '');
  
  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/forum/new-thread' } });
    }
  }, [currentUser, navigate]);
  
  // Charger les catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getForumCategories();
        setCategories(categoriesData);
        
        // Si aucune catégorie n'est sélectionnée et qu'il y a des catégories disponibles,
        // sélectionner la première par défaut si aucune n'a été spécifiée dans l'URL
        if (!categoryId && categoriesData.length > 0 && !initialCategoryId) {
          setCategoryId(categoriesData[0].id);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des catégories:', err);
        setError('Impossible de charger les catégories. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, [categoryId, initialCategoryId]);
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !title.trim() || !content.trim() || !categoryId) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const newThread = {
        categoryId,
        title: title.trim(),
        content: content.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Utilisateur',
        authorEmail: currentUser.email || undefined,
        isPinned: false,
        isLocked: false
      };
      
      const threadId = await addForumThread(newThread);
      
      // Rediriger vers la discussion créée
      navigate(`/forum/thread/${threadId}`);
      
    } catch (err) {
      console.error('Erreur lors de la création de la discussion:', err);
      setError('Impossible de créer la discussion. Veuillez réessayer plus tard.');
      setSubmitting(false);
    }
  };
  
  if (!currentUser) {
    return null; // L'utilisateur sera redirigé via l'effet useEffect
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="mb-4">
        <Link 
          to={categoryId ? `/forum/category/${categoryId}` : '/forum'} 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au forum
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Nouvelle discussion</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Sélection de la catégorie */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              id="category"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={loading || submitting}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Titre */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              id="title"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Titre de votre discussion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={submitting}
              maxLength={100}
            />
          </div>
          
          {/* Contenu */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Contenu
            </label>
            <textarea
              id="content"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={10}
              placeholder="Rédigez votre message ici..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={submitting}
            ></textarea>
          </div>
          
          {/* Bouton de soumission */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || !title.trim() || !content.trim() || !categoryId}
            >
              {submitting ? 'Création en cours...' : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Créer la discussion</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewThread;
