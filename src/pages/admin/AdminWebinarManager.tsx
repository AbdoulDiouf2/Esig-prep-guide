import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import NotificationService from '../../services/NotificationService';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Calendar, 
  Users, 
  Tag, 
  Video,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { logAdminActivity } from './adminActivityLog';

// Définition du type Webinar
interface Webinar {
  id: string;
  title: string;
  description: string;
  date: Date;
  duration: number; // en minutes
  maxParticipants: number;
  currentParticipants: number;
  category: string;
  customCategory?: string; // Catégorie personnalisée pour l'option "autre"
  level: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  speaker: {
    name: string;
    title: string;
    avatar?: string;
  };
  meetingLink?: string;
  isLive: boolean;
  isUpcoming: boolean;
  isCompleted: boolean;
  tags: string[];
  createdBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Définition du type WebinarRegistration
interface WebinarRegistration {
  id: string;
  webinarId?: string;
  webinarTitle?: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  question: string;
  receiveUpdates: boolean;
  status: 'confirmed' | 'cancelled' | 'attended';
  registeredAt: Date;
  webinarDate?: Date;
}

const AdminWebinarManager: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [error, setError] = useState<string>('');

  // États pour les modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [pendingDeletion, setPendingDeletion] = useState<string | null>(null);
  
  // États pour les inscriptions
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [registrations, setRegistrations] = useState<WebinarRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [currentWebinarTitle, setCurrentWebinarTitle] = useState('');
  
  // Onglets
  const [activeTab, setActiveTab] = useState('upcoming');
  
  useEffect(() => {
    fetchWebinars();
  }, []);

  const fetchWebinars = async () => {
    setLoading(true);
    setError('');
    try {
      const webinarsRef = collection(db, 'webinars');
      const webinarsQuery = query(webinarsRef);
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
        webinarsList.push(webinar);
      });

      setWebinars(webinarsList);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des webinaires:', error);
      setError('Erreur lors de la récupération des webinaires. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // Filtrer les webinaires selon l'onglet actif
  const filteredWebinars = webinars.filter(webinar => {
    // Filtrer par statut
    if (activeTab === 'upcoming' && !webinar.isUpcoming) return false;
    if (activeTab === 'live' && !webinar.isLive) return false;
    if (activeTab === 'completed' && !webinar.isCompleted) return false;
    
    // Filtrer par recherche
    if (searchTerm && !webinar.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !webinar.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !webinar.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    
    return true;
  });

  const handleCreateWebinar = () => {
    // Réinitialiser le formulaire avec des valeurs par défaut
    setFormData({
      title: '',
      description: '',
      date: new Date(),
      duration: 60,
      maxParticipants: 50,
      currentParticipants: 0,
      category: '',
      level: 'beginner',
      speaker: {
        name: '',
        title: '',
        avatar: ''
      },
      meetingLink: '',
      isLive: false,
      isUpcoming: true,
      isCompleted: false,
      tags: []
    });
    
    // Ouvrir modal de création
    setSelectedWebinar(null);
    setShowCreateModal(true);
  };

  // Mettre à jour le formulaire quand un webinaire est sélectionné pour édition
  useEffect(() => {
    if (selectedWebinar && showCreateModal) {
      setFormData({
        title: selectedWebinar.title,
        description: selectedWebinar.description,
        date: selectedWebinar.date,
        duration: selectedWebinar.duration,
        maxParticipants: selectedWebinar.maxParticipants,
        currentParticipants: selectedWebinar.currentParticipants,
        category: selectedWebinar.category,
        customCategory: selectedWebinar.customCategory,
        level: selectedWebinar.level,
        imageUrl: selectedWebinar.imageUrl,
        speaker: {
          name: selectedWebinar.speaker.name,
          title: selectedWebinar.speaker.title,
          avatar: selectedWebinar.speaker.avatar || ''
        },
        meetingLink: selectedWebinar.meetingLink || '',
        isLive: selectedWebinar.isLive,
        isUpcoming: selectedWebinar.isUpcoming,
        isCompleted: selectedWebinar.isCompleted,
        tags: selectedWebinar.tags || []
      });
    }
  }, [selectedWebinar, showCreateModal]);

  const handleEditWebinar = (webinar: Webinar) => {
    // Initialiser le formulaire avec les données du webinaire
    setFormData({
      title: webinar.title,
      description: webinar.description,
      date: webinar.date,
      duration: webinar.duration,
      maxParticipants: webinar.maxParticipants,
      currentParticipants: webinar.currentParticipants,
      category: webinar.category,
      customCategory: webinar.customCategory,
      level: webinar.level,
      imageUrl: webinar.imageUrl,
      speaker: {
        // S'assurer que speaker existe et a les propriétés requises
        name: webinar.speaker.name,
        title: webinar.speaker.title,
        avatar: webinar.speaker.avatar
      },
      meetingLink: webinar.meetingLink,
      isLive: webinar.isLive,
      isUpcoming: webinar.isUpcoming,
      isCompleted: webinar.isCompleted,
      tags: webinar.tags
    });
    
    // Ouvrir modal d'édition
    setSelectedWebinar(webinar);
    setShowCreateModal(true);
  };

  const handleDeleteWebinar = async (id: string) => {
    // Préparer la suppression et afficher le modal de confirmation
    setPendingDeletion(id);
    setModalMessage('Êtes-vous sûr de vouloir supprimer ce webinaire ? Cette action est irréversible.');
    setShowConfirmModal(true);
  };
  
  // Fonction exécutée après confirmation de suppression
  const confirmDeleteWebinar = async () => {
    if (!pendingDeletion) return;
    
    try {
      setError('');
      // Récupérer les infos du webinaire avant suppression
      const webinarToDelete = webinars.find(w => w.id === pendingDeletion);
      
      await deleteDoc(doc(db, 'webinars', pendingDeletion));
      
      // Mettre à jour la liste des webinaires
      setWebinars(prevWebinars => prevWebinars.filter(webinar => webinar.id !== pendingDeletion));
      
      // Journalisation de l'activité
      if (webinarToDelete) {
        await logAdminActivity({
          type: 'Suppression',
          target: 'Webinaire',
          targetId: pendingDeletion,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: { 
            title: webinarToDelete.title,
            action: 'Suppression du webinaire',
            date: webinarToDelete.date
          }
        });
      }
      
      // Afficher le modal de succès
      setModalMessage('Webinaire supprimé avec succès.');
      setShowSuccessModal(true);
      
      // Réinitialiser l'ID en attente de suppression
      setPendingDeletion(null);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Erreur lors de la suppression du webinaire:', error);
      setError('Erreur lors de la suppression du webinaire. Veuillez réessayer.');
      
      // Afficher le modal d'erreur
      setModalMessage('Erreur lors de la suppression du webinaire. Veuillez réessayer.');
      setShowErrorModal(true);
      
      // Réinitialiser
      setPendingDeletion(null);
      setShowConfirmModal(false);
    }
  };

  const handleSaveWebinar = async (webinarData: Partial<Webinar>) => {
    try {
      if (!currentUser) {
        setModalMessage('Vous devez être connecté pour effectuer cette action');
        setShowErrorModal(true);
        return;
      }
      
      // Préparation des données pour Firestore
      // Filtrer les valeurs undefined car Firestore ne les accepte pas
      const cleanData = Object.entries(webinarData).reduce((acc, [key, value]) => {
        // Si la valeur est undefined, ne pas l'inclure
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);
      
      const webinarForFirestore = {
        ...cleanData,
        date: Timestamp.fromDate(webinarData.date as Date),
        updatedAt: serverTimestamp()
      };
      
      if (selectedWebinar) {
        // Modification d'un webinaire existant
        const webinarRef = doc(db, 'webinars', selectedWebinar.id);
        await updateDoc(webinarRef, webinarForFirestore);
        
        // Mise à jour de l'UI
        const updatedWebinars = webinars.map(webinar => 
          webinar.id === selectedWebinar.id ? { ...webinar, ...webinarData } as Webinar : webinar
        );
        setWebinars(updatedWebinars);
        
        // Journalisation de l'activité
        await logAdminActivity({
          type: 'Modification',
          target: 'Webinaire',
          targetId: selectedWebinar.id,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: { 
            title: webinarData.title || selectedWebinar.title,
            action: 'Mise à jour du webinaire',
            changes: Object.keys(webinarForFirestore).filter(key => key !== 'updatedAt')
          }
        });
        
        // Afficher le modal de succès
        setModalMessage('Webinaire mis à jour avec succès');
        setShowSuccessModal(true);
      } else {
        // Création d'un nouveau webinaire
        const newWebinarData = {
          ...webinarForFirestore,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
          currentParticipants: 0
        };
        
        const docRef = await addDoc(collection(db, 'webinars'), newWebinarData);
        
        // Mise à jour de l'UI
        const newWebinar = {
          id: docRef.id,
          ...webinarData,
          currentParticipants: 0,
          createdBy: currentUser.uid
        } as Webinar;
        
        setWebinars([...webinars, newWebinar]);
        
        // Journalisation de l'activité
        await logAdminActivity({
          type: 'Ajout',
          target: 'Webinaire',
          targetId: docRef.id,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: { 
            title: newWebinar.title,
            action: 'Création du webinaire',
            date: newWebinar.date,
            speaker: newWebinar.speaker?.name
          }
        });
        
        // Envoi d'emails à tous les étudiants pour les notifier du nouveau webinaire
        try {
          const notificationResult = await NotificationService.sendWebinarCreationNotification(newWebinar);
          console.log(`Notifications envoyées - Succès: ${notificationResult.success}, Échecs: ${notificationResult.failed}`);
          // Afficher le modal de succès avec les informations sur les notifications
          setModalMessage(`Webinaire créé avec succès. Notifications envoyées à ${notificationResult.success} utilisateur(s).`);
        } catch (error) {
          console.error('Erreur lors de l\'envoi des notifications:', error);
          // Afficher le modal de succès mais mentionner l'erreur de notification
          setModalMessage('Webinaire créé avec succès, mais l\'envoi des notifications a échoué.');
        }
        setShowSuccessModal(true);
      }
      
      setShowCreateModal(false);
      setSelectedWebinar(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du webinaire:', error);
      
      // Afficher le modal d'erreur
      setModalMessage('Erreur lors de la sauvegarde du webinaire. Veuillez réessayer.');
      setShowErrorModal(true);
    }
  };

  const handleViewDetails = (id: string) => {
    // Naviguer vers la page de détail du webinaire
    navigate(`/webinars/${id}`);
  };

  const [formData, setFormData] = useState<Partial<Webinar>>({
    title: '',
    description: '',
    date: new Date(),
    duration: 60,
    maxParticipants: 50,
    currentParticipants: 0,
    category: '',
    level: 'beginner',
    speaker: {
      name: '',
      title: '',
      avatar: ''
    },
    meetingLink: '',
    isLive: false,
    isUpcoming: true,
    isCompleted: false,
    tags: []
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si c'est le champ de catégorie et que la valeur est "autre",
    // on réinitialise aussi la catégorie personnalisée
    if (name === 'category' && value !== 'autre') {
      setFormData({ ...formData, [name]: value, customCategory: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      date: new Date(e.target.value)
    });
  };

  const handleSpeakerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    
    // Faire correspondre les noms des champs du formulaire aux propriétés de l'objet speaker
    let speakerProperty = '';
    if (fieldName === 'speakerName') speakerProperty = 'name';
    else if (fieldName === 'speakerTitle') speakerProperty = 'title';
    else if (fieldName === 'speakerAvatar') speakerProperty = 'avatar';
    
    setFormData({
      ...formData,
      speaker: {
        // S'assurer que speaker existe et a les propriétés requises
        name: formData.speaker?.name || '',
        title: formData.speaker?.title || '',
        avatar: formData.speaker?.avatar,
        // Mettre à jour le champ spécifique
        [speakerProperty]: fieldValue
      }
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    // Si l'une des cases de statut est cochée, décocher les autres
    if (name === 'isLive' || name === 'isUpcoming' || name === 'isCompleted') {
      if (checked) {
        // Si on active un statut, désactiver les autres
        setFormData({
          ...formData,
          isLive: name === 'isLive',
          isUpcoming: name === 'isUpcoming',
          isCompleted: name === 'isCompleted'
        });
      } else {
        // Si on désactive un statut, ne pas laisser tous les statuts désactivés
        // Par défaut, activer "isUpcoming" si tous sont désactivés
        const allUnchecked = !formData.isLive && !formData.isUpcoming && !formData.isCompleted;
        if (allUnchecked || (name === 'isUpcoming' && formData.isUpcoming)) {
          setFormData({
            ...formData,
            isUpcoming: true,
            isLive: false,
            isCompleted: false
          });
        } else {
          setFormData({
            ...formData,
            [name]: checked
          });
        }
      }
    } else {
      // Pour les autres cases à cocher qui ne sont pas liées au statut
      setFormData({
        ...formData,
        [name]: checked
      });
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setFormData({
      ...formData,
      tags
    });
  };

  const formatDateTimeForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  // Récupérer les inscriptions pour un webinaire spécifique
  const handleViewRegistrations = async (webinarId: string, title: string) => {
    setLoadingRegistrations(true);
    setCurrentWebinarTitle(title);
    setRegistrations([]);
    setShowRegistrationsModal(true);
    
    try {
      // Journalisation de l'activité
      await logAdminActivity({
        type: 'Consultation',
        target: 'Webinaire',
        targetId: webinarId,
        user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
        details: { 
          title: title,
          action: 'Consultation des inscriptions',
          timestamp: new Date().toISOString()
        }
      });
      const registrationsQuery = query(
        collection(db, 'webinarRegistrations'),
        where('webinarId', '==', webinarId)
      );
      
      const querySnapshot = await getDocs(registrationsQuery);
      const registrationsList: WebinarRegistration[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        registrationsList.push({
          id: doc.id,
          webinarId: data.webinarId,
          webinarTitle: data.webinarTitle,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          userPhone: data.userPhone || 'Non renseigné',
          question: data.question || 'Aucune question',
          receiveUpdates: data.receiveUpdates,
          status: data.status,
          registeredAt: data.registeredAt?.toDate() || new Date(),
          webinarDate: data.webinarDate?.toDate() || new Date(),
        });
      });
      
      // Tri par date d'inscription (la plus récente en premier)
      registrationsList.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());
      
      setRegistrations(registrationsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des inscriptions:', error);
      setModalMessage('Erreur lors de la récupération des inscriptions. Veuillez réessayer.');
      setShowErrorModal(true);
    } finally {
      setLoadingRegistrations(false);
    }
  };
  
  // Fonction pour télécharger les inscriptions en CSV
  const downloadRegistrationsAsCSV = () => {
    if (registrations.length === 0) return;
    
    // Entêtes CSV
    const headers = ['Nom', 'Email', 'Téléphone', 'Question', 'Statut', 'Date d\'inscription', 'Recevoir des mises à jour'];
    
    // Convertir les données en format CSV
    const csvRows = [
      headers.join(','),
      ...registrations.map(reg => {
        const formattedDate = new Date(reg.registeredAt).toLocaleString('fr-FR');
        return [
          `"${reg.userName.replace(/"/g, '""')}"`,
          `"${reg.userEmail.replace(/"/g, '""')}"`,
          `"${reg.userPhone.replace(/"/g, '""')}"`,
          `"${reg.question.replace(/"/g, '""')}"`,
          `"${reg.status}"`,
          `"${formattedDate}"`,
          reg.receiveUpdates ? 'Oui' : 'Non'
        ].join(',');
      })
    ];
    
    // Créer un Blob et le télécharger
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inscriptions_${currentWebinarTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestion des Webinaires</h1>
            <p className="text-gray-600 mt-1">
              Créez, modifiez et supprimez les webinaires proposés aux étudiants
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button
              onClick={handleCreateWebinar}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un webinaire
            </button>
            <Link
              to={currentUser?.isAdmin ? "/admin/workshop-proposals" : "/editor/workshop-proposals"}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Propositions d'ateliers
            </Link>
          </div>
        </div>
      </div>
      
      {/* Filtres et recherche */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-full flex items-center ${activeTab === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <Calendar className="w-4 h-4 mr-1" />
            À venir
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-full flex items-center ${activeTab === 'live' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <Video className="w-4 h-4 mr-1" />
            En direct
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-full flex items-center ${activeTab === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Terminés
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un webinaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-md border border-gray-300 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
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
      
      {/* Liste des webinaires */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredWebinars.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucun webinaire trouvé</h2>
          <p className="text-gray-500 mb-4">
            {searchTerm ? "Aucun résultat pour votre recherche" : "Aucun webinaire n'est disponible dans cette catégorie"}
          </p>
          <button
            onClick={handleCreateWebinar}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un webinaire
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWebinars.map(webinar => (
            <div key={webinar.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Image de couverture */}
              <div className="h-40 bg-gray-200 relative">
                {webinar.imageUrl ? (
                  <img src={webinar.imageUrl} alt={webinar.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <Video className="w-16 h-16 text-blue-300" />
                  </div>
                )}
                {/* Badge statut */}
                <div className="absolute top-2 right-2">
                  {webinar.isLive && (
                    <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium inline-flex items-center">
                      <span className="w-2 h-2 rounded-full bg-white mr-1 animate-pulse"></span>
                      En direct
                    </span>
                  )}
                  {webinar.isUpcoming && !webinar.isLive && (
                    <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      À venir
                    </span>
                  )}
                  {webinar.isCompleted && (
                    <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Terminé
                    </span>
                  )}
                </div>
              </div>
              
              {/* Contenu */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{webinar.title}</h3>
                
                <div className="flex items-start mb-3">
                  <Calendar className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {webinar.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    <span className="mx-1">•</span>
                    {webinar.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="flex items-start mb-3">
                  <Users className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {webinar.currentParticipants}/{webinar.maxParticipants} participants
                  </span>
                </div>
                
                <div className="flex items-start mb-4">
                  <Tag className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {webinar.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                    {webinar.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{webinar.tags.length - 3}</span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex border-t pt-3 mt-2">
                  <button
                    onClick={() => handleViewDetails(webinar.id)}
                    className="flex-1 flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </button>
                  <button
                    onClick={() => handleEditWebinar(webinar)}
                    className="flex-1 flex items-center justify-center text-yellow-600 hover:text-yellow-800 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteWebinar(webinar.id)}
                    className="flex-1 flex items-center justify-center text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </button>
                  <button
                    onClick={() => handleViewRegistrations(webinar.id, webinar.title)}
                    className="flex-1 flex items-center justify-center text-green-600 hover:text-green-800 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Voir les inscriptions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal pour créer/modifier */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedWebinar ? 'Modifier le webinaire' : 'Créer un nouveau webinaire'}
                </h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  {selectedWebinar 
                    ? 'Modifiez les informations du webinaire existant.' 
                    : 'Veuillez remplir tous les champs obligatoires pour créer un nouveau webinaire.'}
                </p>
                <div className="bg-blue-50 text-blue-800 p-3 rounded-md">
                  <p className="text-sm font-medium">
                    Note: Cette interface est un prototype. La fonctionnalité de sauvegarde dans Firestore sera implémentée ultérieurement.
                  </p>
                </div>
              </div>
              
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                if (selectedWebinar) {
                  handleSaveWebinar({
                    ...selectedWebinar,
                    ...formData,
                  });
                } else {
                  handleSaveWebinar({
                    ...formData
                  });
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Titre */}
                  <div className="col-span-full">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Titre du webinaire <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-full">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Date et heure */}
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      Date et heure <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="date"
                      name="date"
                      value={formatDateTimeForInput(formData.date || new Date())}
                      onChange={handleDateChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Durée */}
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Durée (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      min="15"
                      step="5"
                      value={formData.duration}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Nombre max de participants */}
                  <div>
                    <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                      Nombre maximum de participants <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="maxParticipants"
                      name="maxParticipants"
                      min="1"
                      value={formData.maxParticipants}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Participants actuels */}
                  <div>
                    <label htmlFor="currentParticipants" className="block text-sm font-medium text-gray-700">
                      Participants actuels
                    </label>
                    <input
                      type="number"
                      id="currentParticipants"
                      name="currentParticipants"
                      min="0"
                      value={formData.currentParticipants}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Catégorie <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      <option value="workshop">Atelier</option>
                      <option value="coaching">Coaching</option>
                      <option value="info">Information</option>
                      <option value="campus-france">Campus France</option>
                      <option value="académique">Académique</option>
                      <option value="installation">Installation</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  
                  {/* Catégorie personnalisée - apparaît uniquement si "Autre" est sélectionné */}
                  {formData.category === 'autre' && (
                    <div>
                      <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700">
                        Précisez la catégorie <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="customCategory"
                        name="customCategory"
                        value={formData.customCategory || ''}
                        onChange={handleFormChange}
                        required
                        placeholder="Entrez votre catégorie personnalisée"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                  
                  {/* Niveau */}
                  <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                      Niveau <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionnez un niveau</option>
                      <option value="beginner">Débutant</option>
                      <option value="intermediate">Intermédiaire</option>
                      <option value="advanced">Avancé</option>
                    </select>
                  </div>

                  {/* URL de l'image */}
                  <div className="col-span-full">
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                      URL de l'image
                    </label>
                    <input
                      type="text"
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl || ''}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.imageUrl && (
                      <div className="mt-2">
                        <img 
                          src={formData.imageUrl} 
                          alt="Aperçu" 
                          className="h-24 w-auto object-cover rounded" 
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Image+non+disponible';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Intervenant - Nom */}
                  <div>
                    <label htmlFor="speakerName" className="block text-sm font-medium text-gray-700">
                      Nom de l'intervenant <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="speakerName"
                      name="speakerName"
                      value={formData.speaker?.name || ''}
                      onChange={handleSpeakerChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Intervenant - Titre */}
                  <div>
                    <label htmlFor="speakerTitle" className="block text-sm font-medium text-gray-700">
                      Titre de l'intervenant <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="speakerTitle"
                      name="speakerTitle"
                      value={formData.speaker?.title || ''}
                      onChange={handleSpeakerChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Intervenant - Avatar */}
                  <div>
                    <label htmlFor="speakerAvatar" className="block text-sm font-medium text-gray-700">
                      Avatar de l'intervenant (URL)
                    </label>
                    <input
                      type="text"
                      id="speakerAvatar"
                      name="speakerAvatar"
                      value={formData.speaker?.avatar || ''}
                      onChange={handleSpeakerChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.speaker?.avatar && (
                      <div className="mt-2">
                        <img 
                          src={formData.speaker.avatar} 
                          alt="Avatar" 
                          className="h-10 w-10 rounded-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/100?text=Avatar';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Lien de la réunion */}
                  <div className="col-span-full">
                    <label htmlFor="meetingLink" className="block text-sm font-medium text-gray-700">
                      Lien de la réunion
                    </label>
                    <input
                      type="url"
                      id="meetingLink"
                      name="meetingLink"
                      value={formData.meetingLink || ''}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Statut */}
                  <div className="col-span-full">
                    <fieldset>
                      <legend className="text-sm font-medium text-gray-700">Statut</legend>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                          <input
                            id="isLive"
                            name="isLive"
                            type="checkbox"
                            checked={formData.isLive}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isLive" className="ml-2 block text-sm text-gray-700">
                            En direct
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="isUpcoming"
                            name="isUpcoming"
                            type="checkbox"
                            checked={formData.isUpcoming}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isUpcoming" className="ml-2 block text-sm text-gray-700">
                            À venir
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="isCompleted"
                            name="isCompleted"
                            type="checkbox"
                            checked={formData.isCompleted}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isCompleted" className="ml-2 block text-sm text-gray-700">
                            Terminé
                          </label>
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  {/* Tags */}
                  <div className="col-span-full">
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                      Tags (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={(formData.tags || []).join(', ')}
                      onChange={handleTagsChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(formData.tags || []).map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-5 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {selectedWebinar ? 'Enregistrer les modifications' : 'Créer le webinaire'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmation</h3>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteWebinar}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <CheckCircle className="text-green-500 mr-2" size={24} />
              <h3 className="text-lg font-medium text-gray-900">Succès</h3>
            </div>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal d'erreur */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <XCircle className="text-red-500 mr-2" size={24} />
              <h3 className="text-lg font-medium text-gray-900">Erreur</h3>
            </div>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pour afficher les inscriptions */}
      {showRegistrationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Inscriptions pour : {currentWebinarTitle}
              </h3>
              <button
                onClick={() => setShowRegistrationsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {loadingRegistrations ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Chargement des inscriptions...</p>
              </div>
            ) : registrations.length > 0 ? (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <p className="text-sm text-gray-600">{registrations.length} inscription(s) au total</p>
                  <button
                    onClick={downloadRegistrationsAsCSV}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 inline-flex items-center text-sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Télécharger CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'inscription</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registrations.map((registration) => (
                        <tr key={registration.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{registration.userName}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{registration.userEmail}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{registration.userPhone}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div className="max-w-xs truncate" title={registration.question}>
                              {registration.question}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {registration.registeredAt.toLocaleDateString()} {registration.registeredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${registration.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                registration.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {registration.status === 'confirmed' ? 'Confirmé' : 
                               registration.status === 'cancelled' ? 'Annulé' : 
                               registration.status === 'attended' ? 'Présent' : registration.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune inscription</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Ce webinaire n'a pas encore d'inscriptions.
                </p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRegistrationsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWebinarManager;
