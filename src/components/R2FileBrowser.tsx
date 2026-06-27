import React, { useState, useEffect, useCallback } from 'react';
import { listR2Files, type R2Object } from '../utils/r2Utils';
import { detectFileTypeFromName } from '../utils/fileTypeUtils';

interface R2FileBrowserProps {
  onSelect: (url: string, fileName: string, fileType: string) => void;
  showTitle?: boolean;
}

const FOLDER_PREFIXES = [
  { label: 'Tous les fichiers', prefix: '' },
  { label: 'Ressources', prefix: 'resources/' },
  { label: 'Photos alumni', prefix: 'alumni/' },
  { label: 'Chat', prefix: 'chat_attachments/' },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function R2FileBrowser({ onSelect, showTitle = true }: R2FileBrowserProps) {
  const [files, setFiles] = useState<R2Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePrefix, setActivePrefix] = useState('');

  const loadFiles = useCallback(async (prefix: string) => {
    setLoading(true);
    setError(null);
    try {
      const objects = await listR2Files(prefix || undefined);
      setFiles(objects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les fichiers R2.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles(activePrefix);
  }, [loadFiles, activePrefix]);

  const filteredFiles = searchTerm
    ? files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : files;

  const handleSelect = (file: R2Object) => {
    const fileType = detectFileTypeFromName(file.name);
    onSelect(file.url, file.name, fileType);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {showTitle && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Fichiers Cloudflare R2</h3>
        </div>
      )}

      <div className="p-4">
        {/* Filtres par dossier */}
        <div className="flex flex-wrap gap-2 mb-3">
          {FOLDER_PREFIXES.map(fp => (
            <button
              key={fp.prefix}
              onClick={() => setActivePrefix(fp.prefix)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activePrefix === fp.prefix
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {fp.label}
            </button>
          ))}
        </div>

        {/* Barre recherche + refresh */}
        <div className="flex items-center mb-4 space-x-2">
          <input
            type="text"
            placeholder="Rechercher des fichiers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={() => loadFiles(activePrefix)}
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
            title="Actualiser"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            <p>{error}</p>
            <button
              onClick={() => loadFiles(activePrefix)}
              className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            <ul className="space-y-1">
              {filteredFiles.map(file => {
                const fileType = detectFileTypeFromName(file.name);
                return (
                  <li key={file.key}>
                    <button
                      onClick={() => handleSelect(file)}
                      className="w-full flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                        {fileType === 'pdf' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : fileType === 'image' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(file.size)} · {file.folder || 'racine'}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500 text-sm">
            Aucun fichier trouvé.
          </div>
        )}
      </div>
    </div>
  );
}
