import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Download, RefreshCw, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react';
import { ImportResult } from '../../services/alumniService';

interface ImportReportProps {
  result: ImportResult;
  onNewImport: () => void;
}

const ImportReport: React.FC<ImportReportProps> = ({ result, onNewImport }) => {
  const [showErrors, setShowErrors] = useState(false);

  const handleDownloadReport = () => {
    // Créer un CSV des erreurs
    const csvContent = [
      ['Ligne', 'Email', 'Erreur'].join(','),
      ...result.errors.map(err => [err.row, err.email, `"${err.error}"`].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-import-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const total = result.success + (result.updated ?? 0) + result.skipped + result.errors.length;

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total traité</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>

        {/* Succès */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Succès</p>
              <p className="text-2xl font-bold text-green-900">{result.success}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Mis à jour */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Mis à jour</p>
              <p className="text-2xl font-bold text-blue-900">{result.updated ?? 0}</p>
            </div>
            <RefreshCcw className="w-12 h-12 text-blue-600" />
          </div>
          <p className="text-xs text-blue-600 mt-2">Profils existants modifiés</p>
        </div>

        {/* Ignorés */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Inchangés</p>
              <p className="text-2xl font-bold text-yellow-900">{result.skipped}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-yellow-600" />
          </div>
          <p className="text-xs text-yellow-600 mt-2">Déjà à jour</p>
        </div>

        {/* Erreurs */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Erreurs</p>
              <p className="text-2xl font-bold text-red-900">{result.errors.length}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Liste des erreurs */}
      {result.errors.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-900">
                Détails des erreurs ({result.errors.length})
              </span>
            </div>
            {showErrors ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showErrors && (
            <div className="border-t border-gray-200 max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ligne
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Erreur
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.errors.map((error, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{error.row}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{error.email}</td>
                      <td className="px-6 py-4 text-sm text-red-600">{error.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {result.errors.length > 0 && (
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Télécharger le rapport
          </button>
        )}
        <button
          onClick={onNewImport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Nouvel import
        </button>
      </div>
    </div>
  );
};

export default ImportReport;
