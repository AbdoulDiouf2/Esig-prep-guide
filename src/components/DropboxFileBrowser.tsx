import React, { useState, useEffect, useCallback } from "react";
import { Dropbox, files } from "dropbox";

// Interface pour les erreurs Dropbox
interface DropboxError {
  status: number;
  error?: {
    shared_link_already_exists?: boolean;
    [key: string]: unknown;
  };
}

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

// Types pour les props
interface DropboxFileBrowserProps {
  onSelect: (url: string, fileName: string, fileType: string) => void;
  showTitle?: boolean;
}

// Interface pour les fichiers Dropbox
interface DropboxFile {
  id: string;
  name: string;
  path: string;
  url?: string;
  fileType: string;
  size: number;
  isFolder: boolean;
}

export default function DropboxFileBrowser({ onSelect, showTitle = true }: DropboxFileBrowserProps) {
  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Détermine le type de fichier en fonction de son extension
  const getFileType = useCallback((filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(extension)) return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'docx';
    if (['xls', 'xlsx'].includes(extension)) return 'xlsx';
    if (['ppt', 'pptx'].includes(extension)) return 'pptx';
    if (['txt'].includes(extension)) return 'txt';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) return 'image';
    if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'zip';
    
    return 'link';
  }, []);

  // Convertit la taille en format lisible
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Initialisation du SDK Dropbox avec l'access token récupéré via l'endpoint
  const createDropboxClient = async (): Promise<Dropbox | null> => {
    try {
      const accessToken = await getDropboxAccessToken();
      return new Dropbox({ accessToken });
    } catch (err) {
      console.error("Échec de la création du client Dropbox:", err);
      setError("Impossible de se connecter à Dropbox. Vérifiez votre connexion et les permissions.");
      return null;
    }
  };

  // Charge les fichiers depuis Dropbox
  const loadFiles = useCallback(async (path: string = "") => {
    setLoading(true);
    setError(null);
    
    try {
      const dbx = await createDropboxClient();
      if (!dbx) {
        setLoading(false);
        return;
      }
      
      // Récupère les fichiers et dossiers
      const response = await dbx.filesListFolder({
        path: path,
        include_deleted: false
      });
      
      // Transforme les résultats en format plus utilisable
      const filesList: DropboxFile[] = [];
      
      for (const entry of response.result.entries) {
        if (entry[".tag"] === "file" || entry[".tag"] === "folder") {
          const isFolder = entry[".tag"] === "folder";
          
          const file: DropboxFile = {
            id: entry.id || entry.path_lower || "",
            name: entry.name,
            path: entry.path_lower || "",
            fileType: isFolder ? "folder" : getFileType(entry.name),
            size: isFolder ? 0 : (entry as files.FileMetadata).size || 0,
            isFolder: isFolder,
          };
          
          filesList.push(file);
        }
      }
      
      // Trie les fichiers : dossiers d'abord, puis par nom
      filesList.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setFiles(filesList);
      setCurrentPath(path);
      
    } catch (err) {
      console.error("Erreur lors du chargement des fichiers Dropbox:", err);
      setError("Impossible de charger les fichiers depuis Dropbox. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [setFiles, setCurrentPath, setLoading, setError, getFileType]);

  // Obtient l'URL partageable pour un fichier
  const getSharedLink = async (file: DropboxFile) => {
    if (file.url) return file.url; // URL déjà obtenue
    
    try {
      const dbx = await createDropboxClient();
      if (!dbx) return null;
      
      let linkRes;
      try {
        // Essaie d'abord de créer un nouveau lien partagé
        linkRes = await dbx.sharingCreateSharedLinkWithSettings({
          path: file.path,
        });
      } catch (err) {
        const shareErr = err as DropboxError; // Cast avec notre interface d'erreur typée
        // Si le lien existe déjà, essayons de le récupérer
        if (shareErr.status === 409 && shareErr.error?.shared_link_already_exists) {
          try {
            // Récupère les liens existants
            const listLinks = await dbx.sharingListSharedLinks({
              path: file.path,
              direct_only: true
            });
            
            if (listLinks.result.links && listLinks.result.links.length > 0) {
              linkRes = { result: listLinks.result.links[0] };
            } else {
              throw new Error("Aucun lien partagé trouvé");
            }
          } catch (listErr) {
            console.error("Erreur lors de la récupération des liens existants:", listErr);
            throw listErr;
          }
        } else {
          throw shareErr;
        }
      }
      
      // Transforme l'URL en URL directe (raw)
      const rawUrl = linkRes.result.url.replace("?dl=0", "?raw=1");
      
      // Met à jour l'URL dans la liste des fichiers
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === file.id ? { ...f, url: rawUrl } : f
        )
      );
      
      return rawUrl;
    } catch (err) {
      console.error("Erreur lors de la création du lien partageable:", err);
      setError("Impossible de créer un lien pour ce fichier. Vérifiez les permissions dans Dropbox.");
      return null;
    }
  };

  // Gère la navigation dans les dossiers
  const handleFolderClick = (file: DropboxFile) => {
    setPathHistory([...pathHistory, currentPath]);
    loadFiles(file.path);
  };

  // Gère la sélection d'un fichier
  const handleFileSelect = async (file: DropboxFile) => {
    if (file.isFolder) {
      handleFolderClick(file);
      return;
    }
    
    // Obtient l'URL partageable
    const url = await getSharedLink(file);
    if (url) {
      onSelect(url, file.name, file.fileType);
    }
  };

  // Revient au dossier parent
  const handleBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      loadFiles(previousPath);
    }
  };

  // Filtre les fichiers en fonction du terme de recherche
  const filteredFiles = searchTerm 
    ? files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : files;

  // Charge les fichiers au chargement du composant
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <div className="bg-white rounded-lg shadow">
      {showTitle && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Fichiers Dropbox</h3>
        </div>
      )}
      
      <div className="p-4">
        {/* Barre de navigation */}
        <div className="flex items-center mb-4 space-x-2">
          <button
            onClick={handleBack}
            disabled={pathHistory.length === 0}
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <input
            type="text"
            placeholder="Rechercher des fichiers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={() => loadFiles(currentPath)}
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
            title="Actualiser"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Chemin actuel */}
        <p className="text-sm text-gray-500 mb-3">
          {currentPath ? `Dossier: ${currentPath}` : "Dossier racine"}
        </p>
        
        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
            <p>{error}</p>
            <p className="text-sm mt-1">Assurez-vous que le token d'accès Dropbox est configuré correctement dans vos variables d'environnement.</p>
            <button 
              onClick={() => loadFiles(currentPath)}
              className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}
        
        {/* Liste des fichiers */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            <ul className="space-y-1">
              {filteredFiles.map((file) => (
                <li key={file.id}>
                  <button
                    onClick={() => handleFileSelect(file)}
                    className="w-full flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    {/* Icône selon le type de fichier */}
                    <div className="w-10 h-10 flex items-center justify-center mr-3">
                      {file.isFolder ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      ) : file.fileType === 'pdf' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      ) : file.fileType === 'image' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="text-sm font-medium text-gray-900">{file.name}</div>
                      {!file.isFolder && (
                        <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500">
            Aucun fichier trouvé.
          </div>
        )}
      </div>
    </div>
  );
}
