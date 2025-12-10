import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { ParsedAlumniData, validateAlumniData } from '../../utils/fileParser';

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
  const [activeTab, setActiveTab] = useState<'valid' | 'errors'>('valid');

  if (!isOpen) return null;

  // Séparer les données valides et invalides
  const validData = data.filter(row => validateAlumniData(row).valid);
  const invalidData = data.map((row, index) => {
    const validation = validateAlumniData(row);
    return {
      row,
      index: index + 2, // +2 car ligne 1 = headers
      validation,
    };
  }).filter(item => !item.validation.valid);

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

          {/* Tabs */}
          <div className="px-6 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('valid')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'valid'
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Profils valides ({validCount})</span>
                </div>
              </button>
              {errorCount > 0 && (
                <button
                  onClick={() => setActiveTab('errors')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'errors'
                      ? 'border-red-600 text-red-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Erreurs ({errorCount})</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'valid' ? (
              // Onglet Profils valides
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {validData.slice(0, 50).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 border-b">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900 border-b font-medium">
                          {row.Prénom} {row.Nom}
                        </td>
                        <td className="px-4 py-3 text-gray-600 border-b">{row.Mail}</td>
                        <td className="px-4 py-3 text-gray-600 border-b">{row['Promotion (année de sortie CPC)']}</td>
                        <td className="px-4 py-3 text-gray-600 border-b">{row.Ville || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 border-b">{row['Poste Occupé ou Recherché'] || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 border-b">{row.Domaine || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validData.length > 50 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    ... et {validData.length - 50} autres profils valides
                  </div>
                )}
              </div>
            ) : (
              // Onglet Erreurs
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Ligne</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Nom</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Prénom</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Promo</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Erreurs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invalidData.map((item, index) => (
                      <tr key={index} className="bg-red-50 hover:bg-red-100">
                        <td className="px-4 py-3 text-gray-900 border-b font-medium">
                          {item.index}
                        </td>
                        <td className="px-4 py-3 text-gray-900 border-b">
                          {item.row.Nom || <span className="text-red-600 font-medium">Manquant</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-900 border-b">
                          {item.row.Prénom || <span className="text-red-600 font-medium">Manquant</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-900 border-b">
                          {item.row.Mail || <span className="text-red-600 font-medium">Manquant</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-900 border-b">
                          {item.row['Promotion (année de sortie CPC)'] || <span className="text-red-600 font-medium">Manquant</span>}
                        </td>
                        <td className="px-4 py-3 border-b">
                          <div className="flex flex-wrap gap-1">
                            {item.validation.errors.map((error, errIndex) => (
                              <span
                                key={errIndex}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-medium"
                              >
                                <AlertCircle className="w-3 h-3" />
                                {error}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {invalidData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucune erreur détectée
                  </div>
                )}
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
