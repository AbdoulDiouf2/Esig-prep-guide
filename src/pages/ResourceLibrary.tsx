import React, { useState } from 'react';
import { useContent, GuidePhase, ResourceDocument } from '../contexts/ContentContext';
import { Search, FileText, Image, File, Archive, Video, Download, Filter, ChevronDown, X, ExternalLink } from 'lucide-react';

const ResourceLibrary: React.FC = () => {
  const { resources, searchResources } = useContent();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<GuidePhase | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [showPhaseFilter, setShowPhaseFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  
  // État pour la prévisualisation
  const [previewResource, setPreviewResource] = useState<ResourceDocument | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Get unique categories
  const categories = [...new Set(resources.map(resource => resource.category))];
  
  // Fonction pour convertir une URL Dropbox en URL de prévisualisation
  const getPreviewUrl = (fileUrl: string) => {
    if (fileUrl.includes('dropbox.com')) {
      // Remplacer www.dropbox.com par dl.dropboxusercontent.com
      let previewUrl = fileUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      
      // Remplacer ?dl=0 par ?raw=1 ou ajouter ?raw=1 si pas de paramètre
      if (previewUrl.includes('?dl=0')) {
        previewUrl = previewUrl.replace('?dl=0', '?raw=1');
      } else if (!previewUrl.includes('?')) {
        previewUrl += '?raw=1';
      } else {
        previewUrl += '&raw=1';
      }
      
      return previewUrl;
    }
    
    // Si ce n'est pas une URL Dropbox, retourner l'URL originale
    return fileUrl;
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Filter resources
  const filteredResources = resources.filter(resource => {
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewResource.title}</h3>
                <p className="text-sm text-gray-500">{previewResource.category}</p>
              </div>
              <div className="flex space-x-2">
                <a 
                  href={previewResource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ouvrir
                </a>
                <a 
                  href={previewResource.fileUrl}
                  download
                  className="flex items-center bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Télécharger
                </a>
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Fermer
                </button>
              </div>
            </div>
            <div className="p-4 flex-grow overflow-hidden">
              {/* Affichage différent selon le type de fichier */}
              {previewResource.fileType === 'image' ? (
                <div className="flex items-center justify-center h-full">
                  <img 
                    src={getPreviewUrl(previewResource.fileUrl)} 
                    alt={previewResource.title}
                    className="max-w-full max-h-full object-contain rounded-md" 
                  />
                </div>
              ) : (
                <iframe
                  src={getPreviewUrl(previewResource.fileUrl)}
                  className="w-full h-full border-0 rounded-md"
                  title={previewResource.title}
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-popups"
                ></iframe>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceLibrary;