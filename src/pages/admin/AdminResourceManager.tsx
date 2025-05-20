import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { logAdminActivity } from './adminActivityLog';
import { useContent, GuidePhase } from '../../contexts/ContentContext';
import { Trash2, Save, ArrowLeft, Link as LinkIcon, FileText, FileImage, FileQuestion, UploadCloud, Plus, FolderOpen } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import DropboxUploader from '../../components/dropbox';  // Import du composant DropboxUploader
import DropboxFileBrowser from '../../components/DropboxFileBrowser'; // Import du nouveau composant
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminResourceManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
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
  const [fileType, setFileType] = useState<'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt' | 'image' | 'video' | 'audio' | 'zip' | 'link'>('pdf');
  
  // États pour les modales
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFileBrowserModal, setShowFileBrowserModal] = useState(false);
  
  // État pour afficher le nom du fichier sélectionné
  const [selectedFileName, setSelectedFileName] = useState('');  
  
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
      logAdminActivity({
        type: 'Modification',
        target: 'Ressource',
        targetId: editResourceId,
        user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
        details: { title }
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
      logAdminActivity({
        type: 'Ajout',
        target: 'Ressource',
        user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
        details: { title }
      });
    }
    
    // Navigate back to resources list
    navigate('/admin');
  };
  
  // Demande de confirmation avant suppression
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  // Procéder à la suppression après confirmation
  const handleConfirmDelete = () => {
    if (editResourceId) {
      deleteResource(editResourceId);
      logAdminActivity({
        type: 'Suppression',
        target: 'Ressource',
        targetId: editResourceId,
        user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
        details: { title }
      });
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
              <form onSubmit={handleSubmit} className="space-y-7">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Titre de la ressource
                    </label>
                    <input
                      type="text"
                      id="title"
                      className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
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
                      className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
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
                        className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
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
                        className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
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
                      className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value as 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt' | 'image' | 'video' | 'audio' | 'zip' | 'link')}
                      required
                    >
                      <optgroup label="Documents">
                        <option value="pdf">PDF</option>
                        <option value="doc">Word (.doc)</option>
                        <option value="docx">Word (.docx)</option>
                        <option value="txt">Texte (.txt)</option>
                      </optgroup>
                      <optgroup label="Tableurs">
                        <option value="xls">Excel (.xls)</option>
                        <option value="xlsx">Excel (.xlsx)</option>
                      </optgroup>
                      <optgroup label="Présentations">
                        <option value="ppt">PowerPoint (.ppt)</option>
                        <option value="pptx">PowerPoint (.pptx)</option>
                      </optgroup>
                      <optgroup label="Médias">
                        <option value="image">Image (.jpg, .png, etc.)</option>
                        <option value="video">Vidéo (.mp4, etc.)</option>
                        <option value="audio">Audio (.mp3, etc.)</option>
                      </optgroup>
                      <optgroup label="Autres">
                        <option value="zip">Archive (.zip, .rar)</option>
                        <option value="link">Lien externe</option>
                      </optgroup>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700">
                      {fileType === 'link' ? 'URL du lien' : 'URL du fichier'}
                    </label>
                    
                    {fileType !== 'link' && (
                      <div className="mt-3 mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50/30">
                        <div className="flex items-center mb-3">
                          <UploadCloud className="w-5 h-5 text-blue-600 mr-2" />
                          <h3 className="text-sm font-medium text-gray-700">Upload direct vers Dropbox</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Uploadez directement votre fichier vers Dropbox et le lien sera automatiquement ajouté ci-dessous.
                        </p>
                        <DropboxUploader 
                          onSuccess={(url) => setFileUrl(url)}
                          buttonText="Uploader le fichier vers Dropbox"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <div className="w-full flex">
                        <input
                          type="url"
                          id="fileUrl"
                          className="mt-2 block w-full rounded-l-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder={fileType === 'link' ? 'https://example.com' : 'https://dropbox.com/s/...'}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowFileBrowserModal(true)}
                          className="mt-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 border border-l-0 border-blue-200 rounded-r-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          title="Parcourir les fichiers existants"
                        >
                          <FolderOpen className="h-5 w-5 text-blue-600" />
                        </button>
                      </div>
                    </div>
                    {selectedFileName && (
                      <p className="mt-1 text-xs text-blue-600 font-medium">
                        Fichier sélectionné: {selectedFileName}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {fileType === 'link' 
                        ? 'Entrez l\'URL complète du site web externe.' 
                        : 'URL générée automatiquement après upload ou entrez manuellement une URL Dropbox/Google Drive.'}
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      {editResourceId && (
                        <button
                          type="button"
                          onClick={handleDeleteClick}
                          className="inline-flex items-center px-5 py-2.5 rounded-xl shadow-md text-base font-bold text-white bg-gradient-to-r from-red-600 to-red-400 hover:from-red-700 hover:to-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-all gap-2"
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
                        className="inline-flex items-center px-5 py-2.5 rounded-xl shadow-md text-base font-bold text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 border border-blue-200 transition-all gap-2"
                      >
                        Annuler
                      </button>
                      
                      <button
                        type="submit"
                        className="inline-flex items-center px-5 py-2.5 rounded-xl shadow-md text-base font-bold text-white bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all gap-2"
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
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Post-CPS resources */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-2">Post-CPS</h3>
                  {Array.isArray(resourcesByPhase['post-cps']) && resourcesByPhase['post-cps'].length > 0 ? (
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
                  {Array.isArray(resourcesByPhase['during-process']) && resourcesByPhase['during-process'].length > 0 ? (
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
                  {Array.isArray(resourcesByPhase['pre-arrival']) && resourcesByPhase['pre-arrival'].length > 0 ? (
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
      
      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer la ressource "${title}" ? Cette action est irréversible.`}
        confirmButtonText="Supprimer"
        type="danger"
      />
      
      {/* Modal de navigation des fichiers Dropbox */}
      {showFileBrowserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Sélectionner un fichier Dropbox</h3>
              <button
                onClick={() => setShowFileBrowserModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-grow overflow-y-auto">
              <DropboxFileBrowser
                onSelect={(url, fileName, fileType) => {
                  setFileUrl(url);
                  setSelectedFileName(fileName);
                  
                  // Convertir le type de fichier Dropbox en type compatible avec notre form
                  if (fileType === 'pdf') setFileType('pdf');
                  else if (fileType === 'docx') setFileType('docx');
                  else if (fileType === 'xlsx') setFileType('xlsx');
                  else if (fileType === 'pptx') setFileType('pptx');
                  else if (fileType === 'txt') setFileType('txt');
                  else if (fileType === 'image') setFileType('image');
                  else if (fileType === 'video') setFileType('video');
                  else if (fileType === 'audio') setFileType('audio');
                  else if (fileType === 'zip') setFileType('zip');
                  else setFileType('link');
                  
                  setShowFileBrowserModal(false);
                }}
                showTitle={false}
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowFileBrowserModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResourceManager;