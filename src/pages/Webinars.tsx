import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Plus, 
  Search, 
  CalendarCheck,
  XCircle,
  Filter,
  Bookmark,
  UserCheck,
  MessageSquare } from 'lucide-react';
import WebinarCard from '../components/webinars/WebinarCard';
import { db } from '../firebase';
import { collection, query, getDocs, Timestamp, orderBy, where } from 'firebase/firestore';

export interface Speaker {
  name: string;
  title: string;
  avatar?: string;
}

export interface Webinar {
  id: string;
  title: string;
  description: string;
  date: Date;
  duration: number; // in minutes
  maxParticipants: number;
  currentParticipants: number;
  category: string;
  customCategory?: string; // Catégorie personnalisée pour l'option "autre"
  level: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  speakers: Speaker[];
  meetingLink?: string;
  isLive: boolean;
  isUpcoming: boolean;
  isCompleted: boolean;
  tags: string[];
  createdBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const Webinars: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRegistered, setShowRegistered] = useState(false);
  const [favoriteWebinarIds, setFavoriteWebinarIds] = useState<string[]>([]);
  const [registeredWebinarIds, setRegisteredWebinarIds] = useState<string[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // Mémoriser la fonction fetchFavorites avec useCallback
  const fetchFavorites = useCallback(async () => {
    if (!currentUser) return;
    
    setLoadingFavorites(true);
    try {
      // Récupérer tous les favoris de l'utilisateur
      const favoritesQuery = query(
        collection(db, 'webinarFavorites'),
        where('userId', '==', currentUser.uid)
      );
      
      const favoritesSnapshot = await getDocs(favoritesQuery);
      const favoriteIds: string[] = [];
      
      favoritesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.webinarId) {
          favoriteIds.push(data.webinarId);
        }
      });
      
      setFavoriteWebinarIds(favoriteIds);
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
    } finally {
      setLoadingFavorites(false);
    }
  }, [currentUser]); // currentUser est la seule dépendance

  // Récupérer les webinaires auxquels l'utilisateur est inscrit
  const fetchRegistrations = useCallback(async () => {
    if (!currentUser) return;
    
    setLoadingRegistrations(true);
    try {
      // Récupérer toutes les inscriptions de l'utilisateur
      const registrationsQuery = query(
        collection(db, 'webinarRegistrations'),
        where('userId', '==', currentUser.uid)
      );
      
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const registeredIds: string[] = [];
      
      registrationsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.webinarId) {
          registeredIds.push(data.webinarId);
        }
      });
      
      setRegisteredWebinarIds(registeredIds);
    } catch (error) {
      console.error('Erreur lors de la récupération des inscriptions:', error);
    } finally {
      setLoadingRegistrations(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchWebinars();
  }, []);

  useEffect(() => {
    // Récupérer les favoris uniquement si l'utilisateur est connecté
    if (currentUser) {
      fetchFavorites();
      fetchRegistrations();
    } else {
      setFavoriteWebinarIds([]);
      setRegisteredWebinarIds([]);
    }
  }, [currentUser, fetchFavorites, fetchRegistrations]);

  const fetchWebinars = async () => {
    setLoading(true);
    setError('');
    try {
      const webinarsRef = collection(db, 'webinars');
      const webinarsQuery = query(webinarsRef, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(webinarsQuery);
      
      const webinarsList: Webinar[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const webinar: Webinar = {
          id: doc.id,
          title: data.title,
          description: data.description,
          date: data.date?.toDate() || new Date(),
          duration: data.duration,
          maxParticipants: data.maxParticipants,
          currentParticipants: data.currentParticipants,
          category: data.category,
          customCategory: data.customCategory,
          level: data.level,
          imageUrl: data.imageUrl,
          speakers: data.speakers || [],
          meetingLink: data.meetingLink,
          isLive: data.isLive,
          isUpcoming: data.isUpcoming,
          isCompleted: data.isCompleted,
          tags: data.tags || [],
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
        webinarsList.push(webinar);
      });

      setWebinars(webinarsList);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des webinaires:', error);
      setError('Erreur lors de la récupération des webinaires. Veuillez réessayer ultérieurement.');
      setLoading(false);
    }
  };

  const filteredWebinars = webinars.filter(webinar => {
    // Filtre par recherche
    const matchesSearch = webinar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      webinar.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      webinar.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtre par catégorie
    const matchesCategory = selectedCategory === 'all' || webinar.category === selectedCategory;
    
    // Filtre par niveau
    const matchesLevel = selectedLevel === 'all' || webinar.level === selectedLevel;
    
    // Filtre par date
    const matchesDate = showPastEvents || webinar.isUpcoming || webinar.isLive;
    
    // Filtre par favoris - Corrigé pour n'afficher que les favoris quand showFavorites est true
    const matchesFavorite = showFavorites ? favoriteWebinarIds.includes(webinar.id) : true;
    
    // Filtre par inscriptions - Afficher uniquement les webinaires où l'utilisateur est inscrit quand showRegistered est true
    const matchesRegistered = showRegistered ? registeredWebinarIds.includes(webinar.id) : true;
    
    // Le webinaire doit passer tous les filtres pour être affiché
    return matchesSearch && matchesCategory && matchesLevel && matchesDate && matchesFavorite && matchesRegistered;
  });

  const upcomingWebinars = filteredWebinars.filter(w => w.isUpcoming);
  const liveWebinars = filteredWebinars.filter(w => w.isLive);
  const pastWebinars = showPastEvents ? filteredWebinars.filter(w => w.isCompleted) : [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Webinaires & événements</h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">
            Restez informé et participez aux événements organisés pour la communauté ESIG.
          </p>
          {currentUser && (
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate('/proposer-atelier')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="-ml-1 mr-2 h-4 w-4" />
                Proposer un atelier
              </button>
              <button
                onClick={() => navigate('/mes-propositions')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <MessageSquare className="-ml-1 mr-2 h-4 w-4" />
                Mes propositions
              </button>
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm" role="alert">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un événement..."
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XCircle className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
              Filtres {showFilters ? '▲' : '▼'}
            </button>
            {currentUser && (
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowFavorites(true);
                    setShowRegistered(false);
                  }}
                  className={`inline-flex items-center px-4 py-2 border ${
                    showFavorites 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 bg-white text-gray-700'
                  } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <Bookmark className={`-ml-1 mr-2 h-5 w-5 ${showFavorites ? 'text-blue-500 fill-current' : 'text-gray-400'}`} />
                  Favoris {loadingFavorites && <span className="ml-2 animate-pulse">...</span>}
                </button>
                
                <button
                  onClick={() => {
                    setShowRegistered(true);
                    setShowFavorites(false);
                  }}
                  className={`inline-flex items-center px-4 py-2 border ${
                    showRegistered 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-300 bg-white text-gray-700'
                  } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                >
                  <UserCheck className={`-ml-1 mr-2 h-5 w-5 ${showRegistered ? 'text-green-500' : 'text-gray-400'}`} />
                  Mes inscriptions {loadingRegistrations && <span className="ml-2 animate-pulse">...</span>}
                </button>
                
                {(showFavorites || showRegistered) && (
                  <button
                    onClick={() => {
                      setShowFavorites(false);
                      setShowRegistered(false);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <XCircle className="ml-1 mr-2 h-5 w-5 text-gray-400" />
                    Tous les webinaires
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Type d'événement</label>
                  <select 
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">Tous les types</option>
                    <option value="workshop">Ateliers</option>
                    <option value="coaching">Coaching</option>
                    <option value="info">Information</option>
                    <option value="campus-france">Campus France</option>
                    <option value="academique">Académique</option>
                    <option value="installation">Installation</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                  <select 
                    id="level"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="all">Tous les niveaux</option>
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input 
                    id="showPastEvents" 
                    type="checkbox" 
                    checked={showPastEvents} 
                    onChange={() => setShowPastEvents(!showPastEvents)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showPastEvents" className="ml-2 block text-sm text-gray-700">
                    Afficher les événements passés
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      
        {/* Webinaires en direct */}
        {liveWebinars.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-8 w-1 bg-red-500 rounded-full"></div>
              <h2 className="ml-3 text-2xl font-bold text-gray-900">En direct maintenant</h2>
              <span className="ml-4 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                {liveWebinars.length} en cours
              </span>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {liveWebinars.map((webinar) => (
                <WebinarCard key={webinar.id} webinar={webinar} />
              ))}
            </div>
          </div>
        )}

        {/* Webinaires à venir */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-8 w-1 bg-blue-500 rounded-full"></div>
            <h2 className="ml-3 text-2xl font-bold text-gray-900">Prochains événements</h2>
            <span className="ml-4 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {upcomingWebinars.length} à venir
            </span>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : upcomingWebinars.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingWebinars.map((webinar) => (
                <WebinarCard key={webinar.id} webinar={webinar} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <CalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun événement à venir</h3>
              <p className="mt-1 text-gray-500">Revenez plus tard pour découvrir nos prochains webinaires.</p>
              {currentUser && (currentUser.isAdmin || currentUser.isEditor) && !showFavorites && (
                <div className="mt-6">
                  <Link
                    to="/admin/webinars"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow px-5 py-3 inline-flex items-center text-base font-medium text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="-ml-1 mr-2 h-4 w-4" />
                    Créer un événement
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Webinaires passés */}
        {showPastEvents && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
              </div>
            ) : pastWebinars.length > 0 ? (
              <div>
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 h-8 w-1 bg-gray-300 rounded-full"></div>
                  <h2 className="ml-3 text-2xl font-bold text-gray-900">Événements passés</h2>
                  <span className="ml-4 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {pastWebinars.length} événements
                  </span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastWebinars.map((webinar) => (
                    <WebinarCard key={webinar.id} webinar={webinar} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <CalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun événement passé</h3>
                <p className="mt-1 text-gray-500">Les événements passés apparaîtront ici.</p>
              </div>
            )}
          </div>
        )}

        {/* Appel à l'action */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-hidden lg:grid lg:grid-cols-2 lg:gap-4">
          <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
            <div className="lg:self-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                <span className="block">Vous proposez un atelier ?</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-blue-100">
                Rejoignez notre équipe d'intervenants et partagez votre expertise avec notre communauté étudiante.
              </p>
              <Link
                to="/proposer-atelier"
                className="mt-8 bg-white border border-transparent rounded-md shadow px-5 py-3 inline-flex items-center text-base font-medium text-blue-600 hover:bg-blue-50"
              >
                Proposer un atelier <ArrowRight className="ml-3 -mr-1 h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="-mt-6 aspect-w-5 aspect-h-3 md:aspect-w-2 md:aspect-h-1">
            <img
              className="transform translate-x-6 translate-y-6 rounded-md object-cover object-left-top sm:translate-x-16 lg:translate-y-20"
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              alt="Étudiants en atelier"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Webinars;
