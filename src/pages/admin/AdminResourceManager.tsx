import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { logAdminActivity } from './adminActivityLog';
import { useContent, GuidePhase } from '../../contexts/ContentContext';
import { 
  Trash2, Save, ArrowLeft, Link as LinkIcon, FileText, FileImage, 
  FileQuestion, UploadCloud, Plus, FolderOpen, FileIcon, RefreshCw,
  Download, ExternalLink, CheckCircle, CloudOff, X
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import DropboxUploader from '../../components/dropbox';
import DropboxFileBrowser from '../../components/DropboxFileBrowser';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Dropbox } from 'dropbox';
import { getDropboxAccessToken } from '../../utils/dropboxUtils';

// Types de fichiers supportés
type FileType = 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt' | 'image' | 'video' | 'audio' | 'zip' | 'link';

// Interface pour les fichiers Dropbox
interface DropboxFile {
  id: string;
  name: string;
  path_lower: string;
  path_display?: string;
  size?: number;
  client_modified?: string;
  is_downloadable?: boolean;
  shared_link?: {
    url: string;
  }
}

// Interface pour les erreurs Dropbox
interface DropboxError {
  status: number;
  error?: {
    shared_link_already_exists?: boolean;
    [key: string]: unknown;
  };
}

const AdminResourceManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser  } = useAuth();
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
  const [fileType, setFileType] = useState<FileType>('link');
  
  // États pour les modales et UI
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFileBrowserModal, setShowFileBrowserModal] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  
  // États pour la navigation Dropbox
  const [dropboxFiles, setDropboxFiles] = useState<DropboxFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<DropboxFile | null>(null);
  const [dropboxError, setDropboxError] = useState<string>('');
  const [showDropboxExplorer, setShowDropboxExplorer] = useState<boolean>(false);
  
  // Liste prédéfinie de catégories pour organiser les ressources
  const predefinedCategories = [
    'visa',
    'logement',
    'inscription',
    'documents-administratifs',
    'assurance',
    'transport',
    'finances',
    'santé',
    'cours-préparatoires',
    'vie-étudiante',
    'culture-française',
    'emploi-stage',
    'outils-informatiques',
    'bourses',
    'calendrier-académique',
    'restauration',
    'bibliothèque',
    'sport',
    'associations-étudiantes',
    'procédures-campus-france'
  ];
  
  // Combine les catégories prédéfinies avec celles déjà existantes
  const categories = [...new Set([...predefinedCategories, ...resources.map(resource => resource.category).filter(Boolean)])];
  
  // Liste les fichiers disponibles dans Dropbox
  const listDropboxFiles = async () => {
    setLoadingFiles(true);
    setDropboxError('');
    
    try {
      const dbx = new Dropbox({
        accessToken: await getDropboxAccessToken() // Utilisation de l'access token récupéré
      });
      
      // Lister le contenu du dossier racine
      const response = await dbx.filesListFolder({
        path: '',
        include_media_info: true,
        include_deleted: false,
        include_has_explicit_shared_members: false
      });
      
      const files = response.result.entries.filter(entry => entry['.tag'] === 'file');
      
      // Convertir au format DropboxFile
      const formattedFiles: DropboxFile[] = files.map(file => ({
        id: file.id,
        name: file.name,
        path_lower: file.path_lower || '',
        path_display: file.path_display || file.name,
        size: 'size' in file ? file.size : undefined,
        client_modified: 'client_modified' in file ? file.client_modified : undefined,
        is_downloadable: true
      }));
      
      setDropboxFiles(formattedFiles);
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      if (error instanceof Error) {
        setDropboxError(`Erreur lors de la récupération des fichiers: ${error.message}`);
      } else {
        setDropboxError(`Erreur lors de la récupération des fichiers: ${String(error)}`);
      }
    } finally {
      setLoadingFiles(false);
    }
  };
  
  // Créer un lien de partage pour un fichier
  const createShareLink = async (file: DropboxFile) => {
    try {
      const dbx = new Dropbox({
        accessToken: await getDropboxAccessToken() // Utilisation de l'access token récupéré
      });
      
      let shareUrl = '';
      
      try {
        // Essayer de créer un nouveau lien
        const response = await dbx.sharingCreateSharedLinkWithSettings({
          path: file.path_lower,
        });
        shareUrl = response.result.url;
      } catch (err: unknown) {
        // Convertir en DropboxError pour accéder aux propriétés spécifiques
        const dropboxErr = err as DropboxError;
        // Si erreur 409 (lien déjà existant), récupérer le lien existant
        if (dropboxErr.status === 409 || (dropboxErr.error && dropboxErr.error.shared_link_already_exists)) {
          console.log('Lien de partage déjà existant, récupération...');
          const listLinksResponse = await dbx.sharingListSharedLinks({
            path: file.path_lower,
            direct_only: true
          });
          
          if (listLinksResponse.result.links && listLinksResponse.result.links.length > 0) {
            shareUrl = listLinksResponse.result.links[0].url;
          } else {
            throw new Error('Impossible de récupérer le lien existant');
          }
        } else {
          // Si c'est une autre erreur, la relancer
          throw err;
        }
      }
      
      // Convertir en lien 'raw' pour téléchargement direct
      const rawUrl = shareUrl.replace("?dl=0", "?raw=1");
      
      // Mise à jour du fichier sélectionné avec le lien
      setSelectedFile({
        ...file,
        shared_link: {
          url: rawUrl
        }
      });
      
      // Mise à jour de l'URL du fichier dans le formulaire
      setFileUrl(rawUrl);
      setSelectedFileName(file.name);
      setDropboxError(''); // Effacer les erreurs précédentes
      
      // Déterminer le type de fichier en fonction de l'extension
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (extension === 'pdf') setFileType('pdf');
      else if (['doc', 'docx'].includes(extension)) setFileType('docx');
      else if (['xls', 'xlsx'].includes(extension)) setFileType('xlsx');
      else if (['ppt', 'pptx'].includes(extension)) setFileType('pptx');
      else if (extension === 'txt') setFileType('txt');
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) setFileType('image');
      else if (['mp4', 'webm', 'avi', 'mov'].includes(extension)) setFileType('video');
      else if (['mp3', 'wav', 'ogg'].includes(extension)) setFileType('audio');
      else if (['zip', 'rar', 'tar', 'gz'].includes(extension)) setFileType('zip');
      else setFileType('link');
      
      return rawUrl;
    } catch (error) {
      console.error('Erreur lors de la création du lien de partage:', error);
      if (error instanceof Error) {
        setDropboxError(`Erreur lors de la création du lien de partage: ${error.message}`);
      } else {
        setDropboxError(`Erreur lors de la création du lien de partage: ${String(error)}`);
      }
    }
  };
  
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
      setFileType('link');
      
      // Charger les fichiers Dropbox pour les nouveaux ajouts
      listDropboxFiles();
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
        user: (typeof currentUser  === 'object' && currentUser ?.displayName) ? currentUser .displayName : undefined,
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
        user: (typeof currentUser  === 'object' && currentUser ?.displayName) ? currentUser .displayName : undefined,
        details: { title }
      });
    }
    
    // Navigate back to admin dashboard
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
        user: (typeof currentUser  === 'object' && currentUser ?.displayName) ? currentUser .displayName : undefined,
        details: { title }
      });
      // Navigate back to admin dashboard
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
      case 'docx':
      case 'txt':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'image':
        return <FileImage className="w-5 h-5 text-green-600" />;
      case 'link':
        return <LinkIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <FileQuestion className="w-5 h-5 text-gray-600" />;
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
                      <div className="rounded-md bg-blue-50 p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <UploadCloud className="w-5 h-5 text-blue-600 mr-2" />
                          <h3 className="text-sm font-medium text-gray-700">Upload direct vers Dropbox</h3>
                        </div>
                        <div className="mt-2 text-sm text-blue-700 mb-3">
                          Uploadez directement votre fichier vers Dropbox et le lien sera automatiquement ajouté ci-dessous.
                        </div>
                        <DropboxUploader 
                          onSuccess={(url) => {
                            setFileUrl(url);
                            setSelectedFileName(url.split('/').pop() || '');
                          }}
                          buttonText="Uploader le fichier vers Dropbox"
                        />
                      </div>
                    )}
                    
                    {fileType === 'link' && (
                      <div className="mb-4">
                        <div className="flex flex-col space-y-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-700 flex items-center">
                              <FileIcon className="w-4 h-4 text-blue-600 mr-2" />
                              Fichiers Dropbox
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setShowDropboxExplorer(!showDropboxExplorer);
                                if (!showDropboxExplorer) listDropboxFiles();
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              {showDropboxExplorer ? (
                                <>
                                  <X className="w-3 h-3 mr-1" />
                                  Masquer
                                </>
                              ) : (
                                <>
                                  <FolderOpen className="w-3 h-3 mr-1" />
                                  Explorer
                                </>
                              )}
                            </button>
                          </div>
                          
                          {showDropboxExplorer && (
                            <div className="mt-2 border rounded-md">
                              <div className="flex items-center justify-between bg-gray-100 px-3 py-2 border-b">
                                <h4 className="text-sm font-medium text-gray-700">Fichiers disponibles</h4>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={listDropboxFiles}
                                    className="inline-flex items-center p-1 text-xs text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                                    disabled={loadingFiles}
                                  >
                                    {loadingFiles ? (
                                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3" />
                                    )}
                                    <span className="ml-1">Actualiser</span>
                                  </button>
                                </div>
                              </div>
                              
                              {dropboxError && (
                                <div className="p-3 text-sm text-red-600 bg-red-50">
                                  <div className="flex items-start">
                                    <CloudOff className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                                    <span>{dropboxError}</span>
                                  </div>
                                </div>
                              )}
                              
                              {loadingFiles ? (
                                <div className="flex justify-center items-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                              ) : dropboxFiles.length > 0 ? (
                                <div className="max-h-60 overflow-y-auto">
                                  <ul className="divide-y">
                                    {dropboxFiles.map((file) => (
                                      <li key={file.id}>
                                        <div 
                                          className={`flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer ${
                                            selectedFile?.id === file.id ? 'bg-blue-50' : ''
                                          }`}
                                          onClick={() => setSelectedFile(file)}
                                        >
                                          <div className="flex items-center flex-grow pr-3 truncate">
                                            <FileText className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                                            <div className="truncate">
                                              <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
                                              <div className="text-xs text-gray-500">
                                                {file.size ? `${Math.round((file.size as number) / 1024)} Ko` : ''}
                                                {file.client_modified ? ` • ${new Date(file.client_modified).toLocaleDateString()}` : ''}
                                              </div>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              createShareLink(file);
                                            }}
                                          >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            Utiliser
                                          </button>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <div className="py-8 text-center">
                                  <p className="text-sm text-gray-500">
                                    {dropboxFiles.length === 0 && !dropboxError ? "Cliquez sur Actualiser pour afficher vos fichiers." : "Aucun fichier trouvé."}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => setShowFileBrowserModal(true)}
                              className="flex-1 flex items-center justify-center gap-2 p-2 border border-blue-200 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm transition-colors"
                            >
                              <FolderOpen className="w-4 h-4 text-blue-600" />
                              Parcourir Dropbox
                            </button>
                          </div>
                          
                          {selectedFile && selectedFile.shared_link && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-md">
                              <div className="flex items-center text-sm text-green-800 mb-2">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Fichier sélectionné : {selectedFile.name}
                              </div>
                              <div className="flex items-center">
                                <input 
                                  type="text" 
                                  readOnly 
                                  value={selectedFile.shared_link.url} 
                                  className="flex-1 text-xs py-1 px-2 bg-white border rounded-l-md focus:outline-none"
                                />
                                <button 
                                  type="button"
                                  className="bg-blue-600 text-white py-1 px-2 rounded-r-md text-xs"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedFile.shared_link!.url);
                                  }}
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="relative">
                          <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                            <LinkIcon className="w-5 h-5 text-gray-500" />
                          </div>
                          <input
                            type="url"
                            id="fileUrl"
                            className="block w-full pl-10 p-2.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="URL du fichier (Dropbox/Google Drive/etc.)"
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            required
                          />
                          {selectedFileName && (
                            <div className="mt-1 text-xs text-blue-600">
                              Fichier sélectionné: {selectedFileName}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {fileType !== 'link' && (
                      <div className="mt-2">
                        <div className="flex items-center mb-2">
                          <div className="flex-1 relative">
                            <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                              <LinkIcon className="w-5 h-5 text-gray-500" />
                            </div>
                            <input
                              type="url"
                              id="fileUrl"
                              className="block w-full pl-10 p-2.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="URL du fichier (générée automatiquement)"
                              value={fileUrl}
                              onChange={(e) => setFileUrl(e.target.value)}
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowFileBrowserModal(true)}
                            className="ml-2 p-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
                            title="Parcourir les fichiers existants"
                          >
                            <FolderOpen className="w-5 h-5" />
                          </button>
                        </div>
                        {selectedFileName && (
                          <div className="mt-1 text-xs text-blue-600">
                            Fichier sélectionné: {selectedFileName}
                          </div>
                        )}
                      </div>
                    )}
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
                className="text-gray-400 hover:text-gray-500 focus:outline-none">
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
