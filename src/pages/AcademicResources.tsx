import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  ExternalLink,
  Calendar,
  Users,
  Clock,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

interface ResourceLink {
  id: string;
  title: string;
  url: string;
}

interface AcademicResource {
  id?: string;
  title: string;
  description: string;
  type: 'cours' | 'td' | 'tp' | 'exam' | 'project' | 'all';
  year: 1 | 2 | 3;
  semester: 5 | 6 | 7 | 8 | 9 | 10;
  subject: string;
  parcours?: string; // Pour S7
  specialisation?: string; // Pour S8 et 3ème année
  departement?: 'TIC' | 'ET' | 'GEE' | 'SEI';
  links: ResourceLink[]; // Plusieurs liens possibles
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ResourceFormData {
  title: string;
  description: string;
  type: 'cours' | 'td' | 'tp' | 'exam' | 'project' | 'all';
  year: 1 | 2 | 3;
  semester: 5 | 6 | 7 | 8 | 9 | 10;
  subject: string;
  parcours?: string;
  specialisation?: string;
  departement?: 'TIC' | 'ET' | 'GEE' | 'SEI';
  links: ResourceLink[];
}

const AcademicResources: React.FC = () => {
  const { currentUser, isAdmin, isEditor } = useAuth();
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [selectedParcours, setSelectedParcours] = useState<string>('all');
  const [selectedSpecialisation, setSelectedSpecialisation] = useState<string>('all');
  const [selectedDepartement, setSelectedDepartement] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState<AcademicResource | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const [formData, setFormData] = useState<ResourceFormData>({
    title: '',
    description: '',
    type: 'all',
    year: 1,
    semester: 5,
    subject: '',
    parcours: '',
    specialisation: '',
    departement: undefined,
    links: [{ id: '1', title: 'Lien principal', url: '' }]
  });

  const canEdit = isAdmin() || isEditor();

  // Données de structure académique
  const parcoursS7 = [
    'ET-GEE', 'ET-TIC', 'ET-SEI', 'GEE-TIC', 'GEE-SEI', 'TIC-SEI', 'ET', 'GEE', 'TIC', 'SEI'
  ];

  const specialisations = {
    TIC: ['BDTN', 'CERT', 'ISN', 'IA-IR', 'IF', 'IA et Big Data (Campus Poitiers)', 'Développement logiciel : Test & Qualité (Campus Poitiers)'],
    ET: ['ESAA'],
    GEE: ['DARIA', 'GET', 'IA_DES', 'EDD'],
    SEI: ['ISEMAC', 'MCTSE', 'ISE-VA']
  };

  const departements = ['TIC', 'ET', 'GEE', 'SEI'] as const;

  // Fonction pour obtenir les semestres disponibles selon l'année
  const getAvailableSemesters = (year: number) => {
    switch (year) {
      case 1: return [5, 6]; // 1ère année: S5, S6 (tronc commun)
      case 2: return [7, 8]; // 2ème année: S7 (parcours), S8 (spécialisation)
      case 3: return [9, 10]; // 3ème année: S9, S10 (spécialisation)
      default: return [5, 6, 7, 8, 9, 10];
    }
  };

  // Fonction pour déterminer si on doit afficher les champs parcours/spécialisation
  const shouldShowParcours = () => formData.year === 2 && formData.semester === 7;
  const shouldShowSpecialisation = () => (formData.year === 2 && formData.semester === 8) || formData.year === 3;
  const shouldShowDepartement = () => shouldShowSpecialisation();

  // Charger les ressources depuis Firestore
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const resourcesRef = collection(db, 'academicResources');
        const q = query(resourcesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const resourcesList: AcademicResource[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          resourcesList.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as AcademicResource);
        });
        
        setResources(resourcesList);
      } catch (error) {
        console.error('Erreur lors du chargement des ressources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Filtrer les ressources
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = selectedYear === 'all' || resource.year === selectedYear;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesSemester = selectedSemester === 'all' || resource.semester === selectedSemester;
    const matchesParcours = selectedParcours === 'all' || resource.parcours === selectedParcours;
    const matchesSpecialisation = selectedSpecialisation === 'all' || resource.specialisation === selectedSpecialisation;
    const matchesDepartement = selectedDepartement === 'all' || resource.departement === selectedDepartement;
    
    return matchesSearch && matchesYear && matchesType && matchesSemester && matchesParcours && matchesSpecialisation && matchesDepartement;
  });

  // Grouper les ressources par année
  const resourcesByYear = filteredResources.reduce((acc, resource) => {
    const year = resource.year;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(resource);
    return acc;
  }, {} as Record<number, AcademicResource[]>);

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setIsSubmitting(true);
      // Nettoyer les données avant l'envoi - supprimer les valeurs undefined
      const cleanedFormData = Object.fromEntries(
        Object.entries(formData).filter(([, value]) => value !== undefined && value !== '')
      );
      
      const resourceData = {
        ...cleanedFormData,
        createdBy: currentUser.uid,
        updatedAt: new Date()
      };

      if (editingResource && editingResource.id) {
        // Mise à jour
        await updateDoc(doc(db, 'academicResources', editingResource.id), resourceData);
        setResources(prev => prev.map(r => 
          r.id === editingResource.id 
            ? { ...r, ...resourceData, updatedAt: new Date() }
            : r
        ));
      } else {
        // Création
        const docRef = await addDoc(collection(db, 'academicResources'), {
          ...resourceData,
          createdAt: new Date()
        });
        setResources(prev => [...prev, {
          id: docRef.id,
          ...cleanedFormData,
          createdBy: currentUser.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        } as AcademicResource]);
      }

      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        type: 'all',
        year: 1,
        semester: 5,
        subject: '',
        parcours: '',
        specialisation: '',
        departement: undefined,
        links: [{ id: '1', title: 'Lien principal', url: '' }]
      });
      setShowAddForm(false);
      setEditingResource(null);
      setToast({
        show: true,
        message: editingResource ? 'Ressource modifiée avec succès !' : 'Ressource ajoutée avec succès !',
        type: 'success'
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setToast({
        show: true,
        message: 'Erreur lors de la sauvegarde.',
        type: 'error'
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer une ressource
  const handleDelete = async (resourceId: string) => {
    setShowDeleteModal(true);
    setResourceToDelete(resourceId);
  };

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;

    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'academicResources', resourceToDelete));
      setResources(prev => prev.filter(r => r.id !== resourceToDelete));
      setToast({
        show: true,
        message: 'Ressource supprimée avec succès !',
        type: 'success'
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setToast({
        show: true,
        message: 'Erreur lors de la suppression.',
        type: 'error'
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setResourceToDelete(null);
    }
  };

  // Préparer l'édition
  const handleEdit = (resource: AcademicResource) => {
    // Gérer la rétrocompatibilité avec l'ancien champ url
    let linksToEdit: ResourceLink[] = [];
    
    if (resource.links && resource.links.length > 0) {
      // Nouvelle structure avec liens multiples
      linksToEdit = resource.links;
    } else if ((resource as any).url) {
      // Ancienne structure avec url simple - convertir
      linksToEdit = [{ 
        id: '1', 
        title: 'Lien principal', 
        url: (resource as any).url 
      }];
    } else {
      // Aucun lien existant
      linksToEdit = [{ id: '1', title: 'Lien principal', url: '' }];
    }
    
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      year: resource.year,
      semester: resource.semester,
      subject: resource.subject,
      parcours: resource.parcours || '',
      specialisation: resource.specialisation || '',
      departement: resource.departement,
      links: linksToEdit
    });
    setEditingResource(resource);
    setShowAddForm(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cours': return <BookOpen className="w-4 h-4" />;
      case 'td': return <Users className="w-4 h-4" />;
      case 'tp': return <FileText className="w-4 h-4" />;
      case 'exam': return <Clock className="w-4 h-4" />;
      case 'project': return <Calendar className="w-4 h-4" />;
      case 'all': return <BookOpen className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cours': return 'Cours';
      case 'td': return 'TD';
      case 'tp': return 'TP';
      case 'exam': return 'Examen';
      case 'project': return 'Projet';
      case 'all': return 'Toutes ressources';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cours': return 'bg-blue-100 text-blue-800';
      case 'td': return 'bg-green-100 text-green-800';
      case 'tp': return 'bg-purple-100 text-purple-800';
      case 'exam': return 'bg-red-100 text-red-800';
      case 'project': return 'bg-yellow-100 text-yellow-800';
      case 'all': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Gérer les changements d'année pour mettre à jour les semestres disponibles
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value) as 1 | 2 | 3;
    const availableSemesters = getAvailableSemesters(newYear);
    
    setFormData(prev => ({
      ...prev,
      year: newYear,
      semester: availableSemesters[0] as 5 | 6 | 7 | 8 | 9 | 10,
      // Réinitialiser les champs spécifiques selon l'année
      parcours: newYear === 2 && prev.semester === 7 ? prev.parcours : '',
      specialisation: (newYear === 2 && prev.semester === 8) || newYear === 3 ? prev.specialisation : '',
      departement: (newYear === 2 && prev.semester === 8) || newYear === 3 ? prev.departement : undefined
    }));
  };

  // Gérer les changements de semestre
  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSemester = parseInt(e.target.value) as 5 | 6 | 7 | 8 | 9 | 10;
    
    setFormData(prev => ({
      ...prev,
      semester: newSemester,
      // Réinitialiser les champs selon le semestre
      parcours: newSemester === 7 ? prev.parcours : '',
      specialisation: newSemester === 8 || newSemester >= 9 ? prev.specialisation : '',
      departement: newSemester === 8 || newSemester >= 9 ? prev.departement : undefined
    }));
  };

  // Gérer les changements de département
  const handleDepartementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDepartement = e.target.value as 'TIC' | 'ET' | 'GEE' | 'SEI' | '';
    
    setFormData(prev => ({
      ...prev,
      departement: newDepartement || undefined,
      specialisation: '' // Réinitialiser la spécialisation
    }));
  };

  // Gestion des liens multiples
  const addLink = () => {
    const newId = Date.now().toString();
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { id: newId, title: '', url: '' }]
    }));
  };

  const removeLink = (linkId: string) => {
    // Empêcher la suppression du dernier lien
    if (formData.links.length <= 1) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== linkId)
    }));
  };

  const updateLink = (linkId: string, field: 'title' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map(link => 
        link.id === linkId ? { ...link, [field]: value } : link
      )
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des ressources académiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            to="/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </Link>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
              Ressources Académiques
            </h1>
            <p className="text-gray-600 mt-2">
              Accédez à tous les cours, TD, TP et ressources pédagogiques organisés par année d'étude
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingResource(null);
                setFormData({
                  title: '',
                  description: '',
                  type: 'all' as const,
                  year: 1,
                  semester: 5,
                  subject: '',
                  parcours: '',
                  specialisation: '',
                  departement: undefined,
                  links: [{ id: '1', title: 'Lien principal', url: '' }]
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une ressource
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Rechercher
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Titre, matière, description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Année
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les années</option>
              <option value={1}>1ère année</option>
              <option value={2}>2ème année</option>
              <option value={3}>3ème année</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="cours">Cours</option>
              <option value="td">TD</option>
              <option value="tp">TP</option>
              <option value="exam">Examens</option>
              <option value="project">Projets</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semestre</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les semestres</option>
              <option value={5}>S5</option>
              <option value={6}>S6</option>
              <option value={7}>S7</option>
              <option value={8}>S8</option>
              <option value={9}>S9</option>
              <option value={10}>S10</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Parcours</label>
            <select
              value={selectedParcours}
              onChange={(e) => setSelectedParcours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les parcours</option>
              {parcoursS7.map(parcours => (
                <option key={parcours} value={parcours}>{parcours}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Spécialisation</label>
            <select
              value={selectedSpecialisation}
              onChange={(e) => setSelectedSpecialisation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les spécialisations</option>
              {Object.values(specialisations).flat().map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddForm(false);
              setEditingResource(null);
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingResource ? 'Modifier la ressource' : 'Ajouter une nouvelle ressource'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'cours' | 'td' | 'tp' | 'exam' | 'project' | 'all' }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Toutes ressources (Cours + TD + TP + Projet)</option>
                    <option value="cours">Cours</option>
                    <option value="td">TD</option>
                    <option value="tp">TP</option>
                    <option value="exam">Examen</option>
                    <option value="project">Projet</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Ex: Mathématiques, Physique, Toutes matières..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année *</label>
                  <select
                    value={formData.year}
                    onChange={handleYearChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1ère année</option>
                    <option value={2}>2ème année</option>
                    <option value={3}>3ème année</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semestre *</label>
                  <select
                    value={formData.semester}
                    onChange={handleSemesterChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getAvailableSemesters(formData.year).map(semester => (
                      <option key={semester} value={semester}>S{semester}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Champs spécifiques selon l'année et le semestre */}
              {shouldShowParcours() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parcours (S7)</label>
                  <select
                    value={formData.parcours || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, parcours: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un parcours</option>
                    {parcoursS7.map(parcours => (
                      <option key={parcours} value={parcours}>{parcours}</option>
                    ))}
                  </select>
                </div>
              )}

              {shouldShowDepartement() && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                    <select
                      value={formData.departement || ''}
                      onChange={handleDepartementChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un département</option>
                      {departements.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Spécialisation</label>
                    <select
                      value={formData.specialisation || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialisation: e.target.value }))}
                      disabled={!formData.departement}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Sélectionner une spécialisation</option>
                      {formData.departement && specialisations[formData.departement]?.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Gestion des liens multiples */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Liens/Ressources *</label>
                  <button
                    type="button"
                    onClick={addLink}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un lien
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.links.map((link, index) => (
                    <div key={link.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Lien {index + 1}</span>
                        {formData.links.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLink(link.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer ce lien"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {formData.links.length === 1 && (
                          <span className="text-xs text-gray-500 italic">
                            Lien obligatoire
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                          placeholder="Nom du lien (ex: Cours magistral, TD1...)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                          required
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingResource(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {isSubmitting ? 'En cours...' : (editingResource ? 'Modifier' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des ressources */}
      <div className="space-y-8">
        {Object.keys(resourcesByYear).length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">Aucune ressource trouvée</h3>
            <p className="text-gray-500">
              {searchTerm || selectedYear !== 'all' || selectedType !== 'all' || selectedSemester !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : canEdit 
                  ? 'Commencez par ajouter des ressources académiques.'
                  : 'Les ressources seront bientôt disponibles.'
              }
            </p>
          </div>
        ) : (
          [1, 2, 3].map(year => {
            if (!resourcesByYear[year] || resourcesByYear[year].length === 0) return null;
            
            return (
              <div key={year} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                  <h2 className="text-xl font-bold">
                    {year === 1 ? '1ère année (Tronc commun)' : year === 2 ? '2ème année (Parcours & Spécialisations)' : '3ème année (Spécialisations)'}
                  </h2>
                  <p className="text-blue-100">
                    {resourcesByYear[year].length} ressource{resourcesByYear[year].length > 1 ? 's' : ''} disponible{resourcesByYear[year].length > 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resourcesByYear[year].map((resource) => (
                      <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            {getTypeIcon(resource.type)}
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                              {getTypeLabel(resource.type)}
                            </span>
                          </div>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEdit(resource)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Modifier"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(resource.id!)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-gray-800 mb-2">{resource.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{resource.subject}</p>
                        {resource.description && (
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{resource.description}</p>
                        )}
                        
                        {/* Affichage des informations spécifiques */}
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>S{resource.semester}</span>
                            <span>Mis à jour le {resource.updatedAt?.toLocaleDateString('fr-FR')}</span>
                          </div>
                          {resource.parcours && (
                            <div className="text-xs text-blue-600 font-medium">
                              Parcours: {resource.parcours}
                            </div>
                          )}
                          {resource.departement && (
                            <div className="text-xs text-purple-600 font-medium">
                              Département: {resource.departement}
                            </div>
                          )}
                          {resource.specialisation && (
                            <div className="text-xs text-green-600 font-medium">
                              Spécialisation: {resource.specialisation}
                            </div>
                          )}
                        </div>
                        
                        {/* Affichage des liens multiples */}
                        <div className="space-y-2">
                          {resource.links && resource.links.length > 0 ? (
                            resource.links.map((link, index) => (
                              <div key={link.id || index} className="mb-2">
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors duration-200"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{link.title || `Lien ${index + 1}`}</span>
                                </a>
                              </div>
                            ))
                          ) : (
                            // Fallback pour les anciennes données avec url simple
                            resource.url && (
                              <div className="mb-2">
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors duration-200"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                                  <span>Accéder à la ressource</span>
                                </a>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Supprimer la ressource</h2>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer cette ressource ?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
          toast.show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}>
          <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className={`flex-shrink-0 ${
              toast.type === 'success' ? 'text-green-100' : 'text-red-100'
            }`}>
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="flex-shrink-0 ml-4 text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicResources;
