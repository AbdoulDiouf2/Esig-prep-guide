import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useContent, GuidePhase, ResourceDocument } from '../../contexts/ContentContext';
import { Trash2, Save, ArrowLeft, Link as LinkIcon, FileText, FileImage, FileQuestion } from 'lucide-react';

const AdminResourceManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    resources, 
    addResource, 
    updateResource, 
    deleteResource
  } = useContent();
  
  const isNewResource = searchParams.get('new') === 'resource';
  const editResourceId = searchParams.get('edit');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<GuidePhase>('post-cps');
  const [category, setCategory] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'doc' | 'image' | 'link'>('pdf');
  
  // Get unique categories for suggestions
  const categories = [...new Set(resources.map(resource => resource.category))];
  
  // Initialize form with existing data if editing
  useEffect(() => {
    if (editResourceId) {
      const resource = resources.find(r => r.id === editResourceId);
      if (resource) {
        setTitle(resource.title);
        setDescription(resource.description);
        setPhase(resource.phase);
        setCategory(resource.category);
        setFileUrl(resource.fileUrl);
        setFileType(resource.fileType);
      }
    } else if (isNewResource) {
      // For a new resource, initialize with default values
      setTitle('');
      setDescription('');
      setPhase('post-cps');
      setCategory('');
      setFileUrl('');
      setFileType('pdf');
    }
  }, [editResourceId, isNewResource, resources]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editResourceId) {
      // Update existing resource
      updateResource(editResourceId, {
        title,
        description,
        phase,
        category,
        fileUrl,
        fileType
      });
    } else {
      // Add new resource
      addResource({
        title,
        description,
        phase,
        category,
        fileUrl,
        fileType,
        uploadDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0]
      });
    }
    
    // Navigate back to resources list
    navigate('/admin');
  };
  
  // Handle delete
  const handleDelete = () => {
    if (editResourceId && window.confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
      deleteResource(editResourceId);
      navigate('/admin');
    }
  };
  
  // Group resources by phase
  const resourcesByPhase = {
    'post-cps': resources.filter(r => r.phase === 'post-cps'),
    'during-process': resources.filter(r => r.phase === 'during-process'),
    'pre-arrival': resources.filter(r => r.phase === 'pre-arrival'),
  };
  
  // Get icon based on file type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
      case 'doc':
        return <FileText className="w-5 h-5" />;
      case 'image':
        return <FileImage className="w-5 h-5" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <FileQuestion className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">
            {isNewResource ? 'Ajouter une nouvelle ressource' : 'Modifier la ressource'}
          </h1>
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resource editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Titre de la ressource
                    </label>
                    <input
                      type="text"
                      id="title"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phase" className="block text-sm font-medium text-gray-700">
                        Phase
                      </label>
                      <select
                        id="phase"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={phase}
                        onChange={(e) => setPhase(e.target.value as GuidePhase)}
                        required
                      >
                        <option value="post-cps">Post-CPS</option>
                        <option value="during-process">Pendant les démarches</option>
                        <option value="pre-arrival">Pré-arrivée</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Catégorie
                      </label>
                      <input
                        type="text"
                        id="category"
                        list="categories"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                      />
                      <datalist id="categories">
                        {categories.map((cat, index) => (
                          <option key={index} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="fileType" className="block text-sm font-medium text-gray-700">
                      Type de fichier
                    </label>
                    <select
                      id="fileType"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value as 'pdf' | 'doc' | 'image' | 'link')}
                      required
                    >
                      <option value="pdf">PDF</option>
                      <option value="doc">Document</option>
                      <option value="image">Image</option>
                      <option value="link">Lien externe</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700">
                      {fileType === 'link' ? 'URL du lien' : 'URL du fichier'}
                    </label>
                    <input
                      type="url"
                      id="fileUrl"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder={fileType === 'link' ? 'https://example.com' : 'https://example.com/file.pdf'}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {fileType === 'link' 
                        ? 'Entrez l\'URL complète du site web externe.' 
                        : 'Entrez l\'URL complète où le fichier est hébergé (Google Drive, Dropbox, etc.).'}
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      {editResourceId && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </button>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Annuler
                      </button>
                      
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isNewResource ? 'Ajouter' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          {/* Resources overview */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Ressources</h2>
                <button
                  onClick={() => navigate('/admin/resources?new=resource')}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <LinkIcon className="w-4 h-4 mr-1" />
                  Ajouter
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Post-CPS resources */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-2">Post-CPS</h3>
                  {resourcesByPhase['post-cps'].length > 0 ? (
                    <ul className="space-y-2">
                      {resourcesByPhase['post-cps'].map(resource => (
                        <li key={resource.id}>
                          <button
                            onClick={() => navigate(`/admin/resources?edit=${resource.id}`)}
                            className={`flex items-center w-full p-2 rounded-md text-left hover:bg-gray-50 transition-colors ${
                              editResourceId === resource.id ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-3">
                              {getFileIcon(resource.fileType)}
                            </div>
                            <div className="flex-grow">
                              <span className="block text-sm font-medium">{resource.title}</span>
                              <span className="block text-xs text-gray-500">{resource.category}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune ressource disponible</p>
                  )}
                </div>
                
                {/* During process resources */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-2">Pendant les démarches</h3>
                  {resourcesByPhase['during-process'].length > 0 ? (
                    <ul className="space-y-2">
                      {resourcesByPhase['during-process'].map(resource => (
                        <li key={resource.id}>
                          <button
                            onClick={() => navigate(`/admin/resources?edit=${resource.id}`)}
                            className={`flex items-center w-full p-2 rounded-md text-left hover:bg-gray-50 transition-colors ${
                              editResourceId === resource.id ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-3">
                              {getFileIcon(resource.fileType)}
                            </div>
                            <div className="flex-grow">
                              <span className="block text-sm font-medium">{resource.title}</span>
                              <span className="block text-xs text-gray-500">{resource.category}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune ressource disponible</p>
                  )}
                </div>
                
                {/* Pre-arrival resources */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-2">Pré-arrivée</h3>
                  {resourcesByPhase['pre-arrival'].length > 0 ? (
                    <ul className="space-y-2">
                      {resourcesByPhase['pre-arrival'].map(resource => (
                        <li key={resource.id}>
                          <button
                            onClick={() => navigate(`/admin/resources?edit=${resource.id}`)}
                            className={`flex items-center w-full p-2 rounded-md text-left hover:bg-gray-50 transition-colors ${
                              editResourceId === resource.id ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-3">
                              {getFileIcon(resource.fileType)}
                            </div>
                            <div className="flex-grow">
                              <span className="block text-sm font-medium">{resource.title}</span>
                              <span className="block text-xs text-gray-500">{resource.category}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune ressource disponible</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResourceManager;