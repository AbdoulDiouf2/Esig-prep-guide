import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import R2Uploader from '../../components/R2Uploader';
import { listR2Files, deleteR2File, checkR2Health, type R2Object } from '../../utils/r2Utils';
import {
  AlertTriangle, ArrowLeft, CheckCircle, Download,
  ExternalLink, FileText, RefreshCw, Search, Trash2, X, Cloud
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminCloudflareManager: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [workerStatus, setWorkerStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [r2Files, setR2Files] = useState<R2Object[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<R2Object | null>(null);
  const [r2Error, setR2Error] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 10;

  useEffect(() => {
    if (!currentUser?.uid) navigate('/login');
  }, [currentUser, navigate]);

  const testWorkerConnection = useCallback(async () => {
    setWorkerStatus('loading');
    setR2Error('');
    const ok = await checkR2Health();
    if (ok) {
      setWorkerStatus('success');
      loadR2Files();
    } else {
      setWorkerStatus('error');
      setR2Error('Impossible de joindre le Worker Cloudflare. Vérifiez VITE_R2_WORKER_URL.');
    }
  }, []);

  const loadR2Files = useCallback(async () => {
    setLoadingFiles(true);
    setR2Error('');
    try {
      const files = await listR2Files();
      setR2Files(files);
    } catch (err) {
      setR2Error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const handleDeleteFile = useCallback(async (key: string) => {
    try {
      await deleteR2File(key);
      setR2Files(prev => prev.filter(f => f.key !== key));
      if (selectedFile?.key === key) setSelectedFile(null);
      setDeleteConfirm(null);
    } catch (err) {
      setR2Error(err instanceof Error ? err.message : String(err));
    }
  }, [selectedFile]);

  const handleUploadSuccess = useCallback((url: string) => {
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
    loadR2Files();
    void url;
  }, [loadR2Files]);

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => { testWorkerConnection(); }, [testWorkerConnection]);

  const filteredFiles = searchTerm
    ? r2Files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : r2Files;

  const indexOfLast = currentPage * filesPerPage;
  const indexOfFirst = indexOfLast - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to="/admin" className="flex items-center text-blue-600 mb-4 hover:text-blue-800 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center gap-3">
            <Cloud className="w-7 h-7 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestionnaire Cloudflare R2</h1>
              <p className="text-gray-600 mt-1">Gérez vos fichiers sur Cloudflare R2 Object Storage.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statut du Worker */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Statut du Worker</h2>
        <div className="flex items-center mb-4">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            workerStatus === 'success' ? 'bg-green-500' :
            workerStatus === 'error' ? 'bg-red-500' :
            workerStatus === 'loading' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
          <span className="text-sm">
            {workerStatus === 'success' ? 'Connecté à Cloudflare R2' :
             workerStatus === 'error' ? 'Erreur de connexion' :
             workerStatus === 'loading' ? 'Vérification...' : 'Statut inconnu'}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={testWorkerConnection}
            disabled={workerStatus === 'loading'}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
          >
            {workerStatus === 'loading' ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Test en cours...</>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-2" />Tester la connexion</>
            )}
          </button>

          <button
            onClick={loadR2Files}
            disabled={loadingFiles}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors flex items-center"
          >
            {loadingFiles ? (
              <><div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />Actualisation...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" />Rafraîchir la liste</>
            )}
          </button>
        </div>

        {r2Error && (
          <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Erreur</p>
              <p className="text-sm">{r2Error}</p>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <p>Fichier uploadé avec succès sur R2 !</p>
          </div>
        )}
      </div>

      {/* Upload */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Uploader un nouveau fichier</h2>
        <div className="bg-orange-50 p-4 rounded-md">
          <p className="text-sm text-orange-800 mb-3">Le fichier sera uploadé sur Cloudflare R2 et une URL publique sera générée.</p>
          <R2Uploader onSuccess={handleUploadSuccess} buttonText="Sélectionner un fichier" folder="resources" />
        </div>
      </div>

      {/* Liste des fichiers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Fichiers disponibles <span className="text-sm font-normal text-gray-500">({filteredFiles.length})</span>
          </h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 w-full sm:w-64 text-sm"
              placeholder="Rechercher un fichier..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loadingFiles ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du fichier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dossier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentFiles.map(file => (
                  <tr key={file.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="flex-shrink-0 h-5 w-5 text-orange-500 mr-2" />
                        <span className="text-sm text-gray-900 font-medium truncate max-w-xs">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{file.folder || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatFileSize(file.size)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.uploaded).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedFile(file)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="Copier le lien"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>

                        {deleteConfirm === file.key ? (
                          <div className="flex items-center space-x-1">
                            <button onClick={() => handleDeleteFile(file.key)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors" title="Confirmer">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-50 transition-colors" title="Annuler">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(file.key)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors" title="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-4 space-x-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Précédent</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setCurrentPage(n)} className={`w-8 h-8 rounded-md text-sm ${currentPage === n ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>{n}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Suivant</button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Cloud className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Aucun fichier trouvé</p>
            <p className="text-sm text-gray-500">Uploadez un fichier ou vérifiez la connexion au Worker.</p>
          </div>
        )}

        {/* Lien sélectionné */}
        {selectedFile && (
          <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium text-orange-800">URL publique R2</h3>
              <button onClick={() => setSelectedFile(null)} className="text-orange-700 hover:text-orange-900">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center mb-2">
              <FileText className="h-5 w-5 text-orange-600 mr-2" />
              <p className="text-orange-700 text-sm">{selectedFile.name}</p>
            </div>
            <div className="flex items-center">
              <input type="text" readOnly value={selectedFile.url} className="flex-grow p-2 border border-orange-300 rounded-l-md bg-white text-sm focus:outline-none" />
              <button
                onClick={() => { navigator.clipboard.writeText(selectedFile.url); alert('URL copiée !'); }}
                className="p-2 bg-orange-500 text-white rounded-r-md hover:bg-orange-600 transition-colors"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-orange-700">Cette URL peut être utilisée directement comme ressource.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCloudflareManager;
