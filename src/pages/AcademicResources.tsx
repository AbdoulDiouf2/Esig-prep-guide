import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Download, 
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

interface AcademicResource {
  id?: string;
  title: string;
  description: string;
  type: 'cours' | 'td' | 'tp' | 'exam' | 'project';
  year: 1 | 2 | 3;
  semester: 5 | 6 | 7 | 8 | 9 | 10;
  subject: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface ResourceFormData {
  title: string;
  description: string;
  type: 'cours' | 'td' | 'tp' | 'exam' | 'project';
  year: 1 | 2 | 3;
  semester: 5 | 6 | 7 | 8 | 9 | 10;
  subject: string;
  url: string;
}

const AcademicResources: React.FC = () => {
  const { currentUser, isAdmin, isEditor } = useAuth();
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState<AcademicResource | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>({
    title: '',
    description: '',
    type: 'cours',
    year: 1,
    semester: 5,
    subject: '',
    url: ''
  });

  const canEdit = isAdmin() || isEditor();

  // Fonction pour obtenir les semestres disponibles selon l'année
  const getAvailableSemesters = (year: number) => {
    switch (year) {
      case 1: return [5, 6]; // 1ère année: S5, S6
      case 2: return [7, 8]; // 2ème année: S7, S8
      case 3: return [9, 10]; // 3ème année: S9, S10
      default: return [5, 6, 7, 8, 9, 10];
    }
  };

  // Charger les ressources depuis Firestore
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const resourcesRef = collection(db, 'academicResources');
        const q = query(resourcesRef, orderBy('year'), orderBy('semester'), orderBy('subject'));
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
                         resource.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = selectedYear === 'all' || resource.year === selectedYear;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesSemester = selectedSemester === 'all' || resource.semester === selectedSemester;
    
    return matchesSearch && matchesYear && matchesType && matchesSemester;
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
      const resourceData = {
        ...formData,
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
          ...resourceData,
          createdAt: new Date(),
          updatedAt: new Date()
        }]);
      }

      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        type: 'cours',
        year: 1,
        semester: 5,
        subject: '',
        url: ''
      });
      setShowAddForm(false);
      setEditingResource(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Une erreur est survenue lors de la sauvegarde.');
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
      await deleteDoc(doc(db, 'academicResources', resourceToDelete));
      setResources(prev => prev.filter(r => r.id !== resourceToDelete));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Une erreur est survenue lors de la suppression.');
    } finally {
      setShowDeleteModal(false);
      setResourceToDelete(null);
    }
  };

  // Préparer l'édition
  const handleEdit = (resource: AcademicResource) => {
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      year: resource.year,
      semester: resource.semester,
      subject: resource.subject,
      url: resource.url
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
      default: return 'bg-gray-100 text-gray-800';
    }
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
                  type: 'cours',
                  year: 1,
                  semester: 5,
                  subject: '',
                  url: ''
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {getAvailableSemesters(selectedYear as number).map(semester => (
                <option key={semester} value={semester}>S{semester}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
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
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, year: parseInt(e.target.value) as any }));
                      setFormData(prev => ({ ...prev, semester: getAvailableSemesters(parseInt(e.target.value) as number)[0] }));
                    }}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, semester: parseInt(e.target.value) as any }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getAvailableSemesters(formData.year).map(semester => (
                      <option key={semester} value={semester}>S{semester}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL/Lien *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  required
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingResource ? 'Modifier' : 'Ajouter'}
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
                    {year === 1 ? '1ère' : year === 2 ? '2ème' : '3ème'} année
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
                                onClick={() => handleDelete(resource.id)}
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
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>S{resource.semester}</span>
                          <span>Mis à jour le {resource.updatedAt.toLocaleDateString('fr-FR')}</span>
                        </div>
                        
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Accéder à la ressource
                        </a>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicResources;

        </div>
      )}
    </div>
  );
};

export default AcademicResources;
