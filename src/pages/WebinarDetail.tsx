import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Video, 
  Calendar, 
  Clock, 
  Users,  
  Share2,
  CalendarPlus,
  MessageSquare,
  Bookmark,
  ExternalLink,
  XCircle,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import WebinarRegistrationForm from '../components/webinars/WebinarRegistrationForm';
import { Webinar } from '../components/webinars/WebinarCard';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const WebinarDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLiveNow, setIsLiveNow] = useState(false);

  // Vérifier si l'utilisateur est déjà inscrit au webinaire - avec useCallback
  const checkIfRegistered = useCallback(async (webinarId: string) => {
    if (!currentUser) return;
    
    try {
      // Requête pour trouver une inscription pour cet utilisateur et ce webinaire
      const registrationsQuery = query(
        collection(db, 'webinarRegistrations'),
        where('userId', '==', currentUser.uid),
        where('webinarId', '==', webinarId)
      );
      
      const registrationsSnapshot = await getDocs(registrationsQuery);
      
      // Si au moins un document est trouvé, l'utilisateur est inscrit
      setIsRegistered(!registrationsSnapshot.empty);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'inscription:', error);
      // En cas d'erreur, on suppose que l'utilisateur n'est pas inscrit
      setIsRegistered(false);
    }
  }, [currentUser]);

  // Vérifier si un webinaire est dans les favoris - avec useCallback
  const checkIfFavorite = useCallback(async (webinarId: string) => {
    if (!currentUser) return;
    
    try {
      // Vérifier dans la collection webinarFavorites
      const favoriteRef = doc(db, 'webinarFavorites', `${currentUser.uid}_${webinarId}`);
      const favoriteSnap = await getDoc(favoriteRef);
      
      setIsFavorite(favoriteSnap.exists());
    } catch (error) {
      console.error('Erreur lors de la vérification des favoris:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    const loadWebinar = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Récupérer le webinaire depuis Firestore
        const webinarRef = doc(db, 'webinars', id);
        const webinarSnap = await getDoc(webinarRef);
        
        if (webinarSnap.exists()) {
          const data = webinarSnap.data();
          // Convertir les dates Firestore en objets Date JavaScript
          const webinarData: Webinar = {
            id: webinarSnap.id,
            title: data.title,
            description: data.description,
            date: data.date?.toDate() || new Date(),
            duration: data.duration,
            maxParticipants: data.maxParticipants,
            currentParticipants: data.currentParticipants,
            category: data.category,
            level: data.level,
            imageUrl: data.imageUrl,
            speaker: data.speaker,
            meetingLink: data.meetingLink,
            isLive: data.isLive,
            isUpcoming: data.isUpcoming,
            isCompleted: data.isCompleted,
            tags: data.tags || [],
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
          
          setWebinar(webinarData);
          
          // Déterminer si le webinaire est en direct aujourd'hui
          const now = new Date();
          const webinarDate = webinarData.date;
          
          // Obtenir la durée en minutes (gestion des types string ou number)
          const webinarDurationMinutes = typeof webinarData.duration === 'string' 
            ? parseInt(webinarData.duration) || 60 
            : webinarData.duration || 60;
          
          const webinarEndTime = new Date(webinarDate);
          webinarEndTime.setMinutes(webinarEndTime.getMinutes() + webinarDurationMinutes);
          
          const isTimeInRange = now >= webinarDate && now <= webinarEndTime;
          const isSameDay = 
            now.getFullYear() === webinarDate.getFullYear() &&
            now.getMonth() === webinarDate.getMonth() &&
            now.getDate() === webinarDate.getDate();
            
          setIsLiveNow(isSameDay && isTimeInRange);
          
          // Vérifier si l'utilisateur est inscrit à ce webinaire
          if (currentUser) {
            checkIfRegistered(webinarSnap.id);
            checkIfFavorite(webinarSnap.id);
          }
          
          setError(null);
        } else {
          setError('Ce webinaire n\'existe pas ou a été supprimé.');
        }
      } catch (err) {
        console.error('Erreur lors du chargement du webinaire:', err);
        setError('Impossible de charger les détails du webinaire. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    loadWebinar();
    
    // Mise à jour du statut "en direct" toutes les minutes
    const intervalId = setInterval(() => {
      if (webinar) {
        const now = new Date();
        const webinarDate = webinar.date;
        
        const isSameDay = 
          now.getFullYear() === webinarDate.getFullYear() &&
          now.getMonth() === webinarDate.getMonth() &&
          now.getDate() === webinarDate.getDate();
          
        const webinarEndTime = new Date(webinarDate);
        const webinarDurationMinutes = typeof webinar.duration === 'string' 
          ? parseInt(webinar.duration) || 60 
          : webinar.duration || 60;
        webinarEndTime.setMinutes(webinarEndTime.getMinutes() + webinarDurationMinutes);
        
        const isTimeInRange = now >= webinarDate && now <= webinarEndTime;
        
        setIsLiveNow(isSameDay && isTimeInRange);
      }
    }, 60000); // Vérifier toutes les minutes
    
    return () => clearInterval(intervalId);
  }, [id, currentUser, webinar, checkIfFavorite, checkIfRegistered]);

  const handleRegisterClick = () => {
    if (!currentUser) {
      // Rediriger vers la page de connexion avec un retour vers cette page
      navigate('/login', { state: { from: `/webinars/${id}` } });
      return;
    }
    setShowRegistrationForm(true);
  };

  const toggleFavorite = async () => {
    if (!currentUser) {
      // Rediriger vers la page de connexion
      navigate('/login', { state: { from: `/webinars/${id}` } });
      return;
    }
    
    if (!webinar) return;
    
    try {
      const favoriteId = `${currentUser.uid}_${webinar.id}`;
      const favoriteRef = doc(db, 'webinarFavorites', favoriteId);
      
      if (isFavorite) {
        // Supprimer des favoris
        await deleteDoc(favoriteRef);
      } else {
        // Ajouter aux favoris
        await setDoc(favoriteRef, {
          userId: currentUser.uid,
          webinarId: webinar.id,
          webinarTitle: webinar.title,
          addedAt: new Date()
        });
      }
      
      // Mettre à jour l'état local
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const shareWebinar = () => {
    if (navigator.share) {
      navigator.share({
        title: webinar?.title || 'Webinaire',
        text: `Découvrez ce webinaire: ${webinar?.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Lien copié dans le presse-papiers !');
      });
    }
  };

  const addToCalendar = () => {
    if (!webinar) return;
    
    // Format de date pour les calendriers (ICS)
    const startDate = webinar.date;
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + webinar.duration);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[:-]/g, '').replace(/\.\d+/, '');
    };
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${webinar.title}`,
      `DESCRIPTION:${webinar.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${webinar.meetingLink || 'En ligne'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `webinaire-${webinar.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Retour */}
        <div className="mb-6">
          <Link to="/webinars" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour aux webinaires
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm" role="alert">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Link
                to="/webinars"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Retour à la liste des webinaires
              </Link>
            </div>
          </div>
        ) : webinar ? (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{webinar.title}</h1>
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <time dateTime={webinar.date.toISOString()}>
                      {formatDate(webinar.date)}
                    </time>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span>{webinar.duration} minutes</span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Users className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span>
                      {webinar.currentParticipants} / {webinar.maxParticipants} participants
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={toggleFavorite}
                  className={`p-2 rounded-full ${
                    isFavorite 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-gray-400 hover:text-gray-500'
                  } hover:bg-gray-100`}
                  title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Bookmark className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={shareWebinar}
                  className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full"
                  title="Partager"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Bannière */}
            <div className="relative h-64 bg-gray-200 overflow-hidden">
              {webinar.imageUrl ? (
                <img
                  src={webinar.imageUrl}
                  alt={webinar.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Video className="h-16 w-16 text-white opacity-20" />
                </div>
              )}
              {(webinar.isLive || isLiveNow) && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center px-3 py-1 rounded-full bg-red-600 text-white text-sm font-medium">
                    <span className="flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    En direct
                  </div>
                </div>
              )}
            </div>

            {/* Détails & actions */}
            <div className="px-4 py-6 sm:px-8">
              {/* Intervenant */}
              <div className="flex items-center mb-4">
                <img
                  src={webinar.speaker.avatar}
                  alt={webinar.speaker.name}
                  className="h-12 w-12 rounded-full object-cover mr-4 border"
                />
                <div>
                  <div className="font-semibold text-gray-900">{webinar.speaker.name}</div>
                  <div className="text-sm text-gray-500">{webinar.speaker.title}</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {webinar.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="prose max-w-none mb-6">
                {webinar.description.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-3 mb-4">
                {(webinar.isLive || isLiveNow) ? (
                  isRegistered ? (
                    <a
                      href={webinar.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> Rejoindre le direct
                    </a>
                  ) : webinar.currentParticipants >= webinar.maxParticipants ? (
                    <div className="inline-flex items-center justify-center px-6 py-3 border border-red-300 rounded-md shadow-sm text-base font-medium text-red-700 bg-red-50">
                      <XCircle className="w-5 h-5 mr-2" />
                      Complet
                    </div>
                  ) : (
                    <a
                      href={webinar.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> Rejoindre le direct
                    </a>
                  )
                ) : isRegistered ? (
                  <div className="inline-flex items-center justify-center px-6 py-3 border border-green-500 rounded-md shadow-sm text-base font-medium text-green-700 bg-green-50">
                    <UserCheck className="w-5 h-5 mr-2" />
                    Déjà Inscrit(e)
                  </div>
                ) : webinar.currentParticipants >= webinar.maxParticipants ? (
                  <div className="inline-flex items-center justify-center px-6 py-3 border border-red-300 rounded-md shadow-sm text-base font-medium text-red-700 bg-red-50">
                    <XCircle className="w-5 h-5 mr-2" />
                    Complet
                  </div>
                ) : (
                  <button
                    onClick={handleRegisterClick}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    S'inscrire
                  </button>
                )}
                <button
                  onClick={addToCalendar}
                  className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 rounded-md shadow-sm text-base font-medium text-blue-600 bg-white hover:bg-blue-50 transition"
                >
                  <CalendarPlus className="w-5 h-5 mr-2" />
                  Ajouter au calendrier
                </button>
              </div>

              {/* Formulaire d'inscription */}
              {showRegistrationForm && (
                <div className="mt-6">
                  <WebinarRegistrationForm
                    webinar={webinar}
                    onClose={() => setShowRegistrationForm(false)}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Video className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Webinaire non trouvé</h3>
            <p className="mt-1 text-gray-500">Ce webinaire n'existe pas ou a été supprimé.</p>
            <div className="mt-6">
              <Link
                to="/webinars"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Voir tous les webinaires
              </Link>
            </div>
          </div>
        )}
        
        {/* Placeholder section pour questions/commentaires */}
        <div className="mt-8 bg-white border border-dashed border-blue-200 rounded-lg p-6 text-center text-blue-600">
          <MessageSquare className="inline-block h-6 w-6 mb-2 text-blue-400" />
          <div className="font-semibold">Section questions / commentaires à venir</div>
          <div className="text-sm text-blue-400 mt-1">Bientôt, vous pourrez poser vos questions ou interagir en direct avec l'intervenant.</div>
        </div>
      </div>
    </div>
  );
};

export default WebinarDetail;
