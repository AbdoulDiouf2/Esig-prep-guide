import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { ParsedAlumniData } from '../../utils/fileParser';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: ParsedAlumniData[];
  validCount: number;
  errorCount: number;
}

const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  data,
  validCount,
  errorCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Prévisualisation de l'import
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Vérifiez les données avant de lancer l'import
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">
                  {validCount} profil{validCount > 1 ? 's' : ''} valide{validCount > 1 ? 's' : ''}
                </span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {errorCount} erreur{errorCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Nom complet</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Promo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Ville</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Poste</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Domaine</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.slice(0, 50).map((row, index) => {
                    const hasError = !row.Mail || !row.Nom || !row.Prénom || !row['Promotion (année de sortie CPC)'];
                    
                    return (
                      <tr 
                        key={index}
                        className={hasError ? 'bg-red-50' : 'hover:bg-gray-50'}
                      >
                        <td className="px-4 py-3 text-gray-600 border-b">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900 border-b font-medium">
                          {row.Prénom} {row.Nom}
                        </td>
                        <td className="px-4 py-3 text-gray-600 border-b">
                          {row.Mail || <span className="text-red-600">Manquant</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 border-b">
                          {row['Promotion (année de sortie CPC)'] || <span className="text-red-600">Manquant</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 border-b">
                          {row.Ville || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 border-b">
                          {row['Poste Occupé ou Recherché'] || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 border-b">
                          {row.Domaine || '-'}
                        </td>
                        <td className="px-4 py-3 border-b">
                          {hasError ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                              <AlertCircle className="w-3 h-3" />
                              Invalide
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Valide
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {data.length > 50 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                ... et {data.length - 50} autres profils
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {validCount > 0 ? (
                <span>
                  <strong>{validCount}</strong> profil{validCount > 1 ? 's' : ''} {validCount > 1 ? 'seront importés' : 'sera importé'}
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  Aucun profil valide à importer
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                disabled={validCount === 0}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  validCount > 0
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirmer l'import ({validCount})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPreviewModal;
