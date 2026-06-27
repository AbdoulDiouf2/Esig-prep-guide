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
import { usePermission } from '../../hooks/usePermission';
import R2Uploader from '../../components/R2Uploader';
import R2FileBrowser from '../../components/R2FileBrowser';
import ConfirmationModal from '../../components/ConfirmationModal';
import { listR2Files, type R2Object } from '../../utils/r2Utils';
import { detectFileTypeFromName } from '../../utils/fileTypeUtils';

// Types de fichiers supportés
type FileType = 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt' | 'image' | 'video' | 'audio' | 'zip' | 'link';

const AdminResourceManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin, isEditor } = useAuth();
  const canManageResources = usePermission('resources.manage');
  
  // Déterminer si l'utilisateur est en mode admin ou éditeur en fonction de l'URL et des droits
  const urlIndicatesAdmin = window.location.href.includes('/admin/');
  
  // Si l'URL est de type admin mais que l'utilisateur n'est qu'un éditeur, force le mode éditeur
  const isAdminMode = urlIndicatesAdmin ? isAdmin() : false;
  
  // Rediriger les éditeurs qui tentent d'accéder à l'interface admin
  useEffect(() => {
    if (urlIndicatesAdmin && !isAdmin() && isEditor()) {
      // Rediriger vers l'interface éditeur avec les mêmes paramètres
      const currentParams = window.location.search;
      navigate(`/editor/resources${currentParams}`);
    }
  }, [urlIndicatesAdmin, isAdmin, isEditor, navigate]);
  
  // Fonction pour construire les liens en fonction du rôle de l'utilisateur
  const buildEditLink = (id: string) => {
    const baseUrl = isAdminMode ? '/admin' : '/editor';
    return `${baseUrl}/resources?edit=${id}`;
  };
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
  
  // États pour la navigation R2
  const [r2Files, setR2Files] = useState<R2Object[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [selectedR2File, setSelectedR2File] = useState<R2Object | null>(null);
  const [r2Error, setR2Error] = useState<string>('');
  const [showR2Explorer, setShowR2Explorer] = useState<boolean>(false);

  // États pour le feedback de sauvegarde
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [formError, setFormError] = useState('');
  
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
  
  // Liste les fichiers R2
  const loadR2Files = async () => {
    setLoadingFiles(true);
    setR2Error('');
    try {
      const files = await listR2Files('resources/');
      setR2Files(files);
    } catch (error) {
      setR2Error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingFiles(false);
    }
  };

  // Sélectionner un fichier R2 existant
  const selectR2File = (file: R2Object) => {
    setSelectedR2File(file);
    setFileUrl(file.url);
    setSelectedFileName(file.name);
    setFileType(detectFileTypeFromName(file.name));
    setR2Error('');
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
    }
  }, [editResourceId, isNewResource, resources]);
  
  const currentUserDisplayName = (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saveStatus === 'saving') return; // empêche double-soumission

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedCategory = category.trim();

    if (!trimmedTitle || !trimmedDescription || !trimmedCategory || !fileUrl.trim()) {
      setFormError('Tous les champs sont obligatoires.');
      return;
    }
    if (trimmedTitle.length > 200) {
      setFormError('Le titre ne doit pas dépasser 200 caractères.');
      return;
    }
    if (trimmedDescription.length > 2000) {
      setFormError('La description ne doit pas dépasser 2000 caractères.');
      return;
    }
    setFormError('');
    setSaveStatus('saving');

    try {
      if (editResourceId) {
        // Update existing resource
        await updateResource(editResourceId, {
          title: trimmedTitle,
          description: trimmedDescription,
          phase,
          category: trimmedCategory,
          fileUrl,
          fileType,
          updatedDate: new Date().toISOString().split('T')[0]
        });
        logAdminActivity({
          type: 'Modification',
          target: 'Ressource',
          targetId: editResourceId,
          user: currentUserDisplayName,
          details: { title: trimmedTitle }
        });
      } else {
        // Add new resource
        await addResource({
          title: trimmedTitle,
          description: trimmedDescription,
          phase,
          category: trimmedCategory,
          fileUrl,
          fileType,
          uploadDate: new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0]
        });
        logAdminActivity({
          type: 'Ajout',
          target: 'Ressource',
          user: currentUserDisplayName,
          details: { title: trimmedTitle }
        });

        // Reset du formulaire après ajout réussi
        setTitle('');
        setDescription('');
        setPhase('post-cps');
        setCategory('');
        setFileUrl('');
        setFileType('link');
        setSelectedFileName('');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la ressource:', error);
      setSaveStatus('error');
      setSaveErrorMsg('Échec de l\'enregistrement. Vérifiez votre connexion et réessayez.');
    }
  };
  
  // Demande de confirmation avant suppression
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  // Procéder à la suppression après confirmation
  const handleConfirmDelete = async () => {
    if (editResourceId) {
      try {
        await deleteResource(editResourceId);
        logAdminActivity({
          type: 'Suppression',
          target: 'Ressource',
          targetId: editResourceId,
          user: currentUserDisplayName,
          details: { title }
        });
        setShowDeleteModal(false);
        navigate(isAdminMode ? '/admin' : '/editor');
      } catch (error) {
        console.error('Erreur lors de la suppression de la ressource:', error);
        setSaveStatus('error');
        setSaveErrorMsg('Échec de la suppression. Vérifiez votre connexion et réessayez.');
        setShowDeleteModal(false);
      }
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
      {(saveStatus === 'success' || saveStatus === 'error') && (
        <div
          className={`fixed top-6 right-6 p-4 rounded-md shadow-lg z-50 text-sm flex items-center ${
            saveStatus === 'success'
              ? 'bg-green-100 border-l-4 border-green-500 text-green-800'
              : 'bg-red-100 border-l-4 border-red-500 text-red-800'
          }`}
        >
          {saveStatus === 'success' ? 'Ressource enregistrée avec succès.' : saveErrorMsg}
        </div>
      )}
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
                {formError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                    {formError}
                  </div>
                )}
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
                      <div className="rounded-md bg-orange-50 p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <UploadCloud className="w-5 h-5 text-orange-600 mr-2" />
                          <h3 className="text-sm font-medium text-gray-700">Upload direct vers Cloudflare R2</h3>
                        </div>
                        <div className="mt-2 text-sm text-orange-700 mb-3">
                          Uploadez directement votre fichier sur Cloudflare R2 — le lien public sera ajouté automatiquement.
                        </div>
                        <R2Uploader
                          onSuccess={(url) => {
                            setFileUrl(url);
                            setSelectedFileName(url.split('/').pop() || '');
                          }}
                          buttonText="Uploader le fichier vers R2"
                          folder="resources"
                        />
                      </div>
                    )}
                    
                    {fileType === 'link' && (
                      <div className="mb-4">
                        <div className="flex flex-col space-y-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-700 flex items-center">
                              <FileIcon className="w-4 h-4 text-orange-500 mr-2" />
                              Fichiers Cloudflare R2
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setShowR2Explorer(!showR2Explorer);
                                if (!showR2Explorer) loadR2Files();
                              }}
                              className="text-xs text-orange-600 hover:text-orange-800 flex items-center"
                            >
                              {showR2Explorer ? (
                                <><X className="w-3 h-3 mr-1" />Masquer</>
                              ) : (
                                <><FolderOpen className="w-3 h-3 mr-1" />Explorer R2</>
                              )}
                            </button>
                          </div>

                          {showR2Explorer && (
                            <div className="mt-2 border rounded-md">
                              <div className="flex items-center justify-between bg-gray-100 px-3 py-2 border-b">
                                <h4 className="text-sm font-medium text-gray-700">Fichiers R2 disponibles</h4>
                                <button
                                  type="button"
                                  onClick={loadR2Files}
                                  className="inline-flex items-center p-1 text-xs text-orange-700 bg-orange-50 rounded hover:bg-orange-100"
                                  disabled={loadingFiles}
                                >
                                  {loadingFiles ? (
                                    <div className="animate-spin w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3" />
                                  )}
                                  <span className="ml-1">Actualiser</span>
                                </button>
                              </div>

                              {r2Error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50">
                                  <div className="flex items-start">
                                    <CloudOff className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                                    <span>{r2Error}</span>
                                  </div>
                                </div>
                              )}

                              {loadingFiles ? (
                                <div className="flex justify-center items-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                                </div>
                              ) : r2Files.length > 0 ? (
                                <div className="max-h-60 overflow-y-auto">
                                  <ul className="divide-y">
                                    {r2Files.map(file => (
                                      <li key={file.key}>
                                        <div
                                          className={`flex items-center justify-between p-3 hover:bg-orange-50 cursor-pointer ${selectedR2File?.key === file.key ? 'bg-orange-50' : ''}`}
                                          onClick={() => setSelectedR2File(file)}
                                        >
                                          <div className="flex items-center flex-grow pr-3 truncate">
                                            <FileText className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                                            <div className="truncate">
                                              <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
                                              <div className="text-xs text-gray-500">{Math.round(file.size / 1024)} Ko</div>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            className="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded flex items-center"
                                            onClick={e => { e.stopPropagation(); selectR2File(file); }}
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
                                  <p className="text-sm text-gray-500">Cliquez sur Actualiser pour afficher les fichiers R2.</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => setShowFileBrowserModal(true)}
                              className="flex-1 flex items-center justify-center gap-2 p-2 border border-orange-200 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm transition-colors"
                            >
                              <FolderOpen className="w-4 h-4 text-orange-500" />
                              Parcourir Cloudflare R2
                            </button>
                          </div>

                          {selectedR2File && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-md">
                              <div className="flex items-center text-sm text-green-800 mb-2">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Fichier sélectionné : {selectedR2File.name}
                              </div>
                              <div className="flex items-center">
                                <input type="text" readOnly value={selectedR2File.url} className="flex-1 text-xs py-1 px-2 bg-white border rounded-l-md focus:outline-none" />
                                <button type="button" className="bg-orange-500 text-white py-1 px-2 rounded-r-md text-xs" onClick={() => navigator.clipboard.writeText(selectedR2File.url)}>
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
                      {editResourceId && canManageResources && (
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

                      {canManageResources && (
                        <button
                          type="submit"
                          disabled={saveStatus === 'saving'}
                          className="inline-flex items-center px-5 py-2.5 rounded-xl shadow-md text-base font-bold text-white bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {saveStatus === 'saving' ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          {saveStatus === 'saving' ? 'Enregistrement...' : (isNewResource ? 'Ajouter' : 'Enregistrer')}
                        </button>
                      )}
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
                  onClick={() => navigate(`${isAdminMode ? '/admin' : '/editor'}/resources?new=resource`)}
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
                            onClick={() => navigate(buildEditLink(resource.id))}
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
                            onClick={() => navigate(buildEditLink(resource.id))}
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
                            onClick={() => navigate(buildEditLink(resource.id))}
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
              <h3 className="text-lg font-medium text-gray-900">Sélectionner un fichier Cloudflare R2</h3>
              <button
                onClick={() => setShowFileBrowserModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-grow overflow-y-auto">
              <R2FileBrowser
                onSelect={(url, fileName) => {
                  setFileUrl(url);
                  setSelectedFileName(fileName);
                  setFileType(detectFileTypeFromName(fileName));
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
