import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropbox } from 'dropbox';
import DropboxUploader from '../../components/dropbox';
import { 
  AlertTriangle, ArrowLeft, CheckCircle, Download, ExternalLink, 
  FileText, RefreshCw, Search, Trash2, Upload, X 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Fonction pour récupérer un access token via l'endpoint Netlify
async function getDropboxAccessToken(): Promise<string> {
  try {
    const response = await fetch('/.netlify/functions/dropbox-token.cjs');
    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Erreur lors de la récupération du token Dropbox:", error);
    throw error;
  }
}

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
  };
}

// Interface pour les erreurs Dropbox
interface DropboxError {
  status: number;
  error?: {
    shared_link_already_exists?: boolean;
    [key: string]: unknown;
  };
}

const AdminDropboxManager: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser  } = useAuth();

  // États pour la gestion des fichiers Dropbox
  const [dropboxStatus, setDropboxStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dropboxFiles, setDropboxFiles] = useState<DropboxFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<DropboxFile | null>(null);
  const [dropboxError, setDropboxError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(10);

  // Protection de la route admin
  useEffect(() => {
    if (!currentUser ?.uid) {
      navigate('/login');
    }
  }, [currentUser , navigate]);

  // Tester la connexion à Dropbox avec useCallback pour éviter les recréations
  const testDropboxConnection = useCallback(async () => {
    setDropboxStatus('loading');
    setDropboxError('');
    
    try {
      const dbx = new Dropbox({
        accessToken: await getDropboxAccessToken() // Utilisation de l'access token récupéré
      });
      const response = await dbx.usersGetCurrentAccount();
      
      if (response && response.status === 200) {
        setDropboxStatus('success');
        // Une fois la connexion vérifiée, charger les fichiers
        listDropboxFiles();
      } else {
        setDropboxStatus('error');
        setDropboxError("Erreur lors de la connexion à Dropbox");
      }
    } catch (error) {
      console.error('Erreur lors de la connexion à Dropbox:', error);
      setDropboxStatus('error');
      if (error instanceof Error) {
        setDropboxError(`Erreur lors de la connexion à Dropbox: ${error.message}`);
      } else {
        setDropboxError(`Erreur lors de la connexion à Dropbox: ${String(error)}`);
      }
    }
  }, []);
  
  // Liste les fichiers disponibles dans Dropbox
  const listDropboxFiles = useCallback(async () => {
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
  }, []);
  
  // Créer un lien de partage pour un fichier
  const createShareLink = useCallback(async (file: DropboxFile) => {
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
      
      // Mise à jour de la liste des fichiers
      setDropboxFiles(files => 
        files.map(f => 
          f.id === file.id 
            ? { ...f, shared_link: { url: rawUrl } } 
            : f
        )
      );
      
      setDropboxError(''); // Effacer les erreurs précédentes
      return rawUrl;
    } catch (error) {
      console.error('Erreur lors de la création du lien de partage:', error);
      if (error instanceof Error) {
        setDropboxError(`Erreur lors de la création du lien de partage: ${error.message}`);
      } else {
        setDropboxError(`Erreur lors de la création du lien de partage: ${String(error)}`);
      }
    }
  }, []);
  
  // Supprimer un fichier Dropbox
  const deleteDropboxFile = useCallback(async (filePath: string) => {
    try {
      const dbx = new Dropbox({
        accessToken: await getDropboxAccessToken() // Utilisation de l'access token récupéré
      });
      
      await dbx.filesDeleteV2({ path: filePath });
      
      // Supprimer le fichier de la liste locale
      setDropboxFiles(files => files.filter(file => file.path_lower !== filePath));
      
      // Réinitialiser la sélection si le fichier supprimé était sélectionné
      if (selectedFile && selectedFile.path_lower === filePath) {
        setSelectedFile(null);
      }
      
      // Reset confirmation
      setDeleteConfirm(null);
      
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      if (error instanceof Error) {
        setDropboxError(`Erreur lors de la suppression du fichier: ${error.message}`);
      } else {
        setDropboxError(`Erreur lors de la suppression du fichier: ${String(error)}`);
      }
    }
  }, [selectedFile]);
  
  // Formater la taille du fichier
  const formatFileSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Filtrer les fichiers par terme de recherche
  const filteredFiles = searchTerm
    ? dropboxFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : dropboxFiles;
    
  // Pagination
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);
  
  // Effet au chargement initial
  useEffect(() => {
    testDropboxConnection();
  }, [testDropboxConnection]); // Ajout correct de la dépendance
  
  // Gérer l'upload réussi
  const handleUploadSuccess = useCallback(() => {
    setUploadSuccess(true);
    // Masquer le message de succès après 3 secondes
    setTimeout(() => {
      setUploadSuccess(false);
    }, 3000);
    // Rafraîchir la liste des fichiers
    listDropboxFiles();
  }, [listDropboxFiles]);
  
  // Changement de page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to="/admin" className="flex items-center text-blue-600 mb-4 hover:text-blue-800 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Gestionnaire Dropbox</h1>
          <p className="text-gray-600 mt-1">Gérez vos fichiers Dropbox, testez la connectivité et générez des liens de partage.</p>
        </div>
      </div>
      
      {/* Statut de connexion et actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Statut de connexion</h2>
        
        <div className="flex items-center mb-4">
          <div className={`w-3 h-3 rounded-full mr-2 ${dropboxStatus === 'success' ? 'bg-green-500' : dropboxStatus === 'error' ? 'bg-red-500' : dropboxStatus === 'loading' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm">
            {dropboxStatus === 'success' ? 'Connecté à Dropbox' : 
             dropboxStatus === 'error' ? 'Erreur de connexion' : 
             dropboxStatus === 'loading' ? 'Vérification de la connexion...' : 
             'Statut inconnu'}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={testDropboxConnection}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
            disabled={dropboxStatus === 'loading'}
          >
            {dropboxStatus === 'loading' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Test en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Tester la connexion
              </>
            )}
          </button>
          
          <button 
            onClick={listDropboxFiles}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors flex items-center"
            disabled={loadingFiles}
          >
            {loadingFiles ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                Actualisation...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Rafraîchir la liste
              </>
            )}
          </button>
        </div>
        
        {dropboxError && (
          <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Erreur</p>
              <p className="text-sm">{dropboxError}</p>
            </div>
          </div>
        )}
        
        {uploadSuccess && (
          <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <p>Fichier uploadé avec succès! La liste des fichiers a été actualisée.</p>
          </div>
        )}
      </div>
      
      {/* Upload de fichier */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload un nouveau fichier</h2>
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <div className="flex items-center mb-2">
            <Upload className="w-5 h-5 text-blue-600 mr-2" />
            <p className="text-sm font-medium text-blue-800">Sélectionnez un fichier à uploader sur Dropbox</p>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            Le fichier sera uploadé directement sur votre compte Dropbox et apparaitra dans la liste ci-dessous.
          </p>
          <DropboxUploader 
            onSuccess={handleUploadSuccess}
            buttonText="Sélectionner un fichier"
          />
        </div>
      </div>
      
      {/* Gestion des fichiers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Fichiers disponibles</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              placeholder="Rechercher un fichier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Tableau de fichiers */}
        {loadingFiles ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du fichier</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de modification</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="flex-shrink-0 h-5 w-5 text-blue-600 mr-2" />
                        <div className="text-sm text-gray-900 font-medium truncate max-w-xs">{file.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {file.client_modified 
                          ? new Date(file.client_modified).toLocaleDateString('fr-FR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })
                          : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {/* Bouton de lien */}
                        <button
                          onClick={() => createShareLink(file)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="Générer un lien de partage"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        
                        {/* Bouton de suppression */}
                        {deleteConfirm === file.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => deleteDropboxFile(file.path_lower)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                              title="Confirmer la suppression"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-50 transition-colors"
                              title="Annuler"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(file.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                            title="Supprimer le fichier"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-4 space-x-2">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`w-8 h-8 rounded-md ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="flex justify-center mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-2">Aucun fichier trouvé</p>
            <p className="text-sm text-gray-500">Uploadez un fichier ou vérifiez vos paramètres de connexion Dropbox.</p>
          </div>
        )}
        
        {/* Affichage d'un fichier sélectionné */}
        {selectedFile && selectedFile.shared_link && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium text-blue-800">Lien de partage généré</h3>
              <button 
                onClick={() => setSelectedFile(null)}
                className="text-blue-700 hover:text-blue-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-blue-700">{selectedFile.name}</p>
            </div>
            <div className="flex items-center">
              <input 
                type="text" 
                readOnly 
                value={selectedFile.shared_link.url} 
                className="flex-grow p-2 border border-blue-300 rounded-l-md bg-white text-sm focus:outline-none"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(selectedFile.shared_link!.url);
                  alert('Lien copié dans le presse-papier!');
                }}
                className="p-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-blue-700">Ce lien peut être utilisé pour ajouter ce fichier comme ressource.</p>
          </div>
        )}
      </div>
    </div>
  );
  
};

export default AdminDropboxManager;
