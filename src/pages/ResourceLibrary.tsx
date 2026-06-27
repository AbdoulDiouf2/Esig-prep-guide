import React, { useState } from 'react';
import { useContent, GuidePhase, ResourceDocument } from '../contexts/ContentContext';
import { Search, FileText, Image, File, Archive, Video, Download, Filter, ChevronDown, X, ExternalLink } from 'lucide-react';
import { getR2PreviewUrl } from '../utils/r2Utils';

const ResourceLibrary: React.FC = () => {
  const { resources } = useContent();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<GuidePhase | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [showPhaseFilter, setShowPhaseFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'videos'>('all');
  
  // État pour la prévisualisation
  const [previewResource, setPreviewResource] = useState<ResourceDocument | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Get unique categories
  const categories = [...new Set(resources.map(resource => resource.category))];
  
  // URLs R2 sont directes — pas de transformation nécessaire
  const getPreviewUrl = (fileUrl: string) => fileUrl;

  // Helper function to get embeddable video URLs
  const getVideoEmbedUrl = (url: string): string => {
    let embedUrl = url;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        const videoId = urlObj.hostname.includes('youtu.be') 
          ? urlObj.pathname.substring(1).split('?')[0] // Ensure query params are not part of ID
          : urlObj.searchParams.get('v');
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (urlObj.hostname.includes('vimeo.com')) {
        const pathParts = urlObj.pathname.split('/');
        const videoId = pathParts.find(part => /^\d+$/.test(part)); // Find the numeric video ID in path
        if (videoId) {
          embedUrl = `https://player.vimeo.com/video/${videoId}`;
        }
      }
    } catch (error) {
      console.error("Error parsing video URL for embedding:", error);
      // Return original URL if parsing fails, it might be a direct video link
    }
    return embedUrl;
  };

  const getGoogleViewerUrl = (fileUrl: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  };

  const getOfficeViewerUrl = (fileUrl: string) => {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  };

  const isOfficeFile = (fileUrl: string) => {
    const lower = fileUrl.toLowerCase();
    return lower.endsWith('.docx') || lower.endsWith('.doc') ||
           lower.endsWith('.xlsx') || lower.endsWith('.xls') ||
           lower.endsWith('.pptx') || lower.endsWith('.ppt');
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Filter resources
  const filteredResources = resources.filter(resource => {
    // Filter by active tab first
    if (activeTab === 'videos' && resource.fileType !== 'video') {
      return false;
    }
    
    // Filter by phase
    if (selectedPhase !== 'all' && resource.phase !== selectedPhase) {
      return false;
    }
    
    // Filter by category
    if (selectedCategory !== 'all' && resource.category !== selectedCategory) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      return (
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return true;
  });

  // Function to get appropriate icon based on file type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <File className="w-6 h-6 text-red-500" />;
      case 'image':
        return <Image className="w-6 h-6 text-green-500" />;
      case 'video':
        return <Video className="w-6 h-6 text-purple-500" />;
      case 'archive':
        return <Archive className="w-6 h-6 text-yellow-500" />;
      case 'doc':
      case 'docx':
      case 'txt':
      default:
        return <FileText className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">Bibliothèque de ressources</h1>
          <p className="text-blue-100">
            Trouvez tous les documents et guides dont vous avez besoin pour votre parcours.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            {/* Tabs Navigation */}
            <div className="mb-6 flex border-b border-gray-200">
              <button
                className={`px-4 py-2 font-medium text-sm -mb-px border-b-2 focus:outline-none ${
                  activeTab === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('all')}
              >
                Toutes les ressources
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm -mb-px border-b-2 focus:outline-none ${
                  activeTab === 'videos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('videos')}
              >
                Vidéos
              </button>
            </div>

            <form onSubmit={handleSearch}>
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-grow">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Rechercher une ressource..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {/* Phase filter */}
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
                      onClick={() => setShowPhaseFilter(!showPhaseFilter)}
                    >
                      <span className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        {selectedPhase === 'all' ? 'Toutes les phases' : 
                         selectedPhase === 'post-cps' ? 'Post-CPS' :
                         selectedPhase === 'during-process' ? 'Pendant les démarches' :
                         'Pré-arrivée'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    
                    {showPhaseFilter && (
                      <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <button
                            type="button"
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              selectedPhase === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            }`}
                            onClick={() => {
                              setSelectedPhase('all');
                              setShowPhaseFilter(false);
                            }}
                          >
                            Toutes les phases
                          </button>
                          <button
                            type="button"
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              selectedPhase === 'post-cps' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            }`}
                            onClick={() => {
                              setSelectedPhase('post-cps');
                              setShowPhaseFilter(false);
                            }}
                          >
                            Post-CPS
                          </button>
                          <button
                            type="button"
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              selectedPhase === 'during-process' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            }`}
                            onClick={() => {
                              setSelectedPhase('during-process');
                              setShowPhaseFilter(false);
                            }}
                          >
                            Pendant les démarches
                          </button>
                          <button
                            type="button"
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              selectedPhase === 'pre-arrival' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            }`}
                            onClick={() => {
                              setSelectedPhase('pre-arrival');
                              setShowPhaseFilter(false);
                            }}
                          >
                            Pré-arrivée
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Category filter */}
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
                      onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    >
                      <span className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        {selectedCategory === 'all' ? 'Toutes les catégories' : selectedCategory}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    
                    {showCategoryFilter && (
                      <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <button
                            type="button"
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              selectedCategory === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            }`}
                            onClick={() => {
                              setSelectedCategory('all');
                              setShowCategoryFilter(false);
                            }}
                          >
                            Toutes les catégories
                          </button>
                          {categories.map(category => (
                            <button
                              key={category}
                              type="button"
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                selectedCategory === category ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              }`}
                              onClick={() => {
                                setSelectedCategory(category);
                                setShowCategoryFilter(false);
                              }}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Resources grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
                onClick={() => {
                  setPreviewResource(resource);
                  setShowPreview(true);
                }}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                      {getFileIcon(resource.fileType)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {resource.phase === 'post-cps' ? 'Post-CPS' :
                       resource.phase === 'during-process' ? 'Pendant les démarches' :
                       'Pré-arrivée'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {resource.category}
                    </span>
                    
                    {/* Badge pour le type de fichier */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      resource.fileType === 'pdf' ? 'bg-red-100 text-red-800' :
                      resource.fileType === 'doc' || resource.fileType === 'docx' || resource.fileType === 'txt' ? 'bg-blue-100 text-blue-800' :
                      resource.fileType === 'xls' || resource.fileType === 'xlsx' ? 'bg-green-100 text-green-800' :
                      resource.fileType === 'ppt' || resource.fileType === 'pptx' ? 'bg-orange-100 text-orange-800' :
                      resource.fileType === 'image' ? 'bg-purple-100 text-purple-800' :
                      resource.fileType === 'video' ? 'bg-pink-100 text-pink-800' :
                      resource.fileType === 'audio' ? 'bg-indigo-100 text-indigo-800' :
                      resource.fileType === 'zip' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {resource.fileType.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Mis à jour le {resource.updatedDate}</span>
                    <a 
                      href={resource.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()} // Empêche le clic de déclencher l'aperçu
                    >
                      <Download className="w-4 h-4 mr-1" />
                      <span>Télécharger</span>
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune ressource trouvée</h3>
              <p className="text-gray-500">
                Essayez de modifier vos filtres ou votre recherche.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de prévisualisation */}
      {showPreview && previewResource && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" 
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="bg-slate-800 rounded-lg shadow-xl w-full max-w-5xl h-auto max-h-[90vh] flex flex-col overflow-hidden relative"
            onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{previewResource.title}</h3>
                <p className="text-sm text-slate-300">{previewResource.category}</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto items-center">
                <a 
                  href={previewResource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Ouvrir
                </a>
                <a 
                  href={previewResource.fileUrl}
                  download
                  className="flex items-center justify-center w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Télécharger
                </a>
                <button 
                  onClick={() => setShowPreview(false)} 
                  className="p-1.5 ml-0 sm:ml-2 rounded-md hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-200"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-grow overflow-auto"> 
              {/* Affichage différent selon le type de fichier */}
              {previewResource.fileType === 'video' ? (
                <div className="p-1 sm:p-2 md:p-4 w-full"> {/* Responsive padding for video section */}
                  <div className="relative w-full bg-black rounded-md" style={{ paddingTop: '56.25%' }}> {/* 16:9 Aspect Ratio */}
                    <iframe
                      src={getVideoEmbedUrl(previewResource.fileUrl)}
                      className="absolute top-0 left-0 w-full h-full border-0 rounded-md"
                      title={previewResource.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              ) : previewResource.fileType === 'image' ? (
                <div className="flex items-center justify-center h-full p-4 bg-white">
                  <img
                    src={previewResource.fileUrl}
                    alt={previewResource.title}
                    className="max-w-full max-h-full object-contain rounded-md"
                  />
                </div>
              ) : isOfficeFile(previewResource.fileUrl) ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 bg-white text-center">
                  <FileText className="w-16 h-16 text-blue-300" />
                  <p className="text-gray-600 text-sm max-w-xs">
                    Ce format ne peut pas être prévisualisé directement. Téléchargez le fichier pour l'ouvrir.
                  </p>
                  <a
                    href={previewResource.fileUrl}
                    download
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le fichier
                  </a>
                </div>
              ) : (
                <div className="flex flex-col h-full bg-white">
                  <div className="flex-grow">
                    <iframe
                      src={getR2PreviewUrl(previewResource.fileUrl)}
                      className="w-full h-full border-0"
                      title={previewResource.title}
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="p-2 text-center text-sm text-gray-500 border-t border-gray-200">
                    Si le document ne s'affiche pas, essayez de le{' '}
                    <a
                      href={previewResource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 mx-1 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      télécharger
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceLibrary;