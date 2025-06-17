import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getForumCategories, getForumThreads, initializeDefaultCategories } from '../services/forumService';
import { ForumCategory, ForumThread } from '../types/forum';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Plus, ChevronRight } from 'lucide-react';

const Forum: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ForumCategory | null>(null);
  
  // Charger les catégories au chargement de la page
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        // Initialiser les catégories par défaut si c'est la première utilisation
        await initializeDefaultCategories();
        
        // Charger les catégories
        const categoriesData = await getForumCategories();
        setCategories(categoriesData);
        
        // Si un categoryId est spécifié dans l'URL, le définir comme actif
        if (categoryId) {
          const selectedCategory = categoriesData.find(cat => cat.id === categoryId);
          if (selectedCategory) {
            setActiveCategory(selectedCategory);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des catégories:', err);
        setError('Impossible de charger les catégories du forum. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, [categoryId]);
  
  // Charger les discussions lorsqu'une catégorie est sélectionnée
  useEffect(() => {
    const loadThreads = async () => {
      if (activeCategory) {
        try {
          setLoading(true);
          const threadsData = await getForumThreads(activeCategory.id);
          setThreads(threadsData);
        } catch (err) {
          console.error('Erreur lors du chargement des discussions:', err);
          setError('Impossible de charger les discussions. Veuillez réessayer plus tard.');
        } finally {
          setLoading(false);
        }
      } else {
        setThreads([]);
      }
    };
    
    loadThreads();
  }, [activeCategory]);
  
  // Gérer la sélection d'une catégorie
  const handleCategorySelect = (category: ForumCategory) => {
    setActiveCategory(category);
    navigate(`/forum/category/${category.id}`);
  };
  
  // Gérer le clic sur une discussion
  const handleThreadClick = (thread: ForumThread) => {
    navigate(`/forum/thread/${thread.id}`);
  };
  
  // Gérer la création d'une nouvelle discussion
  const handleNewThread = () => {
    if (!currentUser) {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
      navigate('/login', { state: { from: `/forum/category/${activeCategory?.id}` } });
      return;
    }
    
    navigate(`/forum/new-thread${activeCategory ? `?categoryId=${activeCategory.id}` : ''}`);
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
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-lg mb-8 shadow-md overflow-hidden">
        <div className="px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Forum ESIG</h1>
          <p className="text-lg text-blue-100 mb-6">
            Échangez avec la communauté, posez vos questions et partagez vos expériences.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar des catégories */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Catégories</h2>
            
            {loading && categories.length === 0 ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {categories.map(category => (
                  <li key={category.id}>
                    <button
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        activeCategory?.id === category.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Liste des discussions */}
        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* En-tête avec le titre de la catégorie et bouton de nouvelle discussion */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {activeCategory ? activeCategory.name : 'Toutes les discussions'}
              </h2>
              
              <button
                onClick={handleNewThread}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                disabled={!activeCategory}
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle discussion</span>
              </button>
            </div>
            
            {/* Description de la catégorie */}
            {activeCategory && (
              <div className="p-4 bg-gray-50 border-b">
                <p className="text-gray-600">{activeCategory.description}</p>
              </div>
            )}
            
            {/* Liste des discussions */}
            {loading && threads.length === 0 ? (
              <div className="p-4 animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-b pb-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : activeCategory ? (
              threads.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {threads.map(thread => (
                    <div 
                      key={thread.id}
                      onClick={() => handleThreadClick(thread)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                            {thread.isPinned && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Épinglé</span>
                            )}
                            {thread.isLocked && (
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">Verrouillé</span>
                            )}
                            {thread.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            par {thread.authorName} • {formatDate(thread.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          <span>{thread.repliesCount}</span>
                        </div>
                      </div>
                      
                      {thread.lastReplyAt && (
                        <div className="mt-2 text-xs text-gray-500">
                          Dernière réponse par {thread.lastReplyAuthor} • {formatDate(thread.lastReplyAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-4">Aucune discussion dans cette catégorie pour le moment.</p>
                  <button
                    onClick={handleNewThread}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer la première discussion</span>
                  </button>
                </div>
              )
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>Sélectionnez une catégorie pour voir les discussions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
