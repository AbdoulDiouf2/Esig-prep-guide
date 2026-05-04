/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { ArrowLeft, Info, Upload, AlertTriangle, FileText } from 'lucide-react';
import FileUploader from '../../components/admin/FileUploader';
import ImportProgress from '../../components/admin/ImportProgress';
import ImportReport from '../../components/admin/ImportReport';
import ImportPreviewModal from '../../components/admin/ImportPreviewModal';
import { parseCSV, parseXLSX, ParsedAlumniData, cleanEmail, extractYearPromo, validateAlumniData } from '../../utils/fileParser';
import { importAlumniFromFile, ImportAlumniData, ImportResult } from '../../services/alumniService';

const ImportAlumni: React.FC = () => {
  useAuth();
  const canImport = usePermission('alumni.validate');
  const [parsedData, setParsedData] = useState<ParsedAlumniData[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleFileSelect = async (file: File) => {
    setParseError('');
    setParsedData([]);

    try {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      let result;

      if (fileExtension === '.csv') {
        result = await parseCSV(file);
      } else if (fileExtension === '.xlsx') {
        result = await parseXLSX(file);
      } else {
        setParseError('Format de fichier non supporté');
        return;
      }

      if (result.errors.length > 0) {
        setParseError(`Erreurs de parsing: ${result.errors.length} ligne(s) avec des erreurs`);
      }

      setParsedData(result.data);
      console.log('✅ Fichier parsé:', result.data.length, 'lignes');
      
      // Ouvrir automatiquement le modal de prévisualisation
      if (result.data.length > 0) {
        setShowPreviewModal(true);
      }
    } catch (error: any) {
      setParseError(error.message || 'Erreur lors de la lecture du fichier');
      console.error('Erreur parsing:', error);
    }
  };

  const handleStartImport = async () => {
    if (parsedData.length === 0) return;

    setImportStatus('processing');
    setImportProgress({ current: 0, total: parsedData.length });

    try {
      // Transformer les données parsées en ImportAlumniData
      const dataToImport: ImportAlumniData[] = [];
      const validationErrors: Array<{ row: number; email: string; error: string }> = [];

      parsedData.forEach((row, index) => {
        const rowNumber = index + 2; // +2 car ligne 1 = headers
        const validation = validateAlumniData(row);

        if (!validation.valid) {
          validationErrors.push({
            row: rowNumber,
            email: String(row.Mail || 'N/A'),
            error: validation.errors.join(', '),
          });
          return;
        }

        // Parser les domaines (splitter par virgules et "et")
        const parseSectors = (domaine: string): string[] => {
          if (!domaine) return [];
          return domaine
            .split(/,|\set\s/i) // Split par virgule OU " et " (case insensitive)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        };

        dataToImport.push({
          name: `${row.Prénom} ${row.Nom}`.trim(),
          email: cleanEmail(String(row.Mail)),
          yearPromo: extractYearPromo(row['Promotion (année de sortie CPC)']),
          city: row.Ville || '',
          position: row['Poste Occupé ou Recherché'] || '',
          sectors: parseSectors(row.Domaine || ''),
          expertise: row['Précision de votre domaine'] ? [row['Précision de votre domaine']] : [],
          bio: '', // Pas de mapping depuis Commentaire
        });
      });

      // Lancer l'import
      const result = await importAlumniFromFile(dataToImport, (current, total) => {
        setImportProgress({ current, total });
      });

      // Ajouter les erreurs de validation au résultat
      result.errors.push(...validationErrors);

      setImportResult(result);
      setImportStatus('completed');
    } catch (error: any) {
      console.error('Erreur import:', error);
      setImportStatus('error');
      setParseError(error.message || 'Erreur lors de l\'import');
    }
  };

  const handleNewImport = () => {
    setParsedData([]);
    setImportStatus('idle');
    setImportProgress({ current: 0, total: 0 });
    setImportResult(null);
    setParseError('');
    setShowPreviewModal(false);
  };

  const handleConfirmImport = () => {
    if (!canImport) return;
    setShowPreviewModal(false);
    handleStartImport();
  };

  // Calculer le nombre de profils valides et invalides
  const validationStats = parsedData.reduce(
    (acc, row) => {
      const validation = validateAlumniData(row);
      if (validation.valid) {
        acc.valid++;
      } else {
        acc.invalid++;
      }
      return acc;
    },
    { valid: 0, invalid: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Upload className="w-8 h-8 text-indigo-600" />
              Import en masse de profils alumni
            </h1>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
              🔒 Superadmin uniquement
            </span>
          </div>
          <p className="mt-2 text-gray-600">
            Importez des profils alumni depuis un fichier CSV ou Excel
          </p>
        </div>

        {/* Section 1 : Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Instructions d'import</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Formats acceptés : CSV (.csv) et Excel (.xlsx)</li>
                <li>Taille maximale : 5 MB</li>
                <li>Les comptes utilisateurs seront créés automatiquement</li>
                <li>Les profils seront pré-approuvés (status: approved)</li>
                <li>Les doublons (emails existants) seront ignorés</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2 : Mapping des colonnes */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Mapping des colonnes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Champ formulaire</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Champ profil</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Obligatoire</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Exemple</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-gray-900">Nom + Prénom</td>
                  <td className="px-4 py-3 text-gray-600">name</td>
                  <td className="px-4 py-3"><span className="text-red-600 font-bold">Oui</span></td>
                  <td className="px-4 py-3 text-gray-500">John Doe</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Mail</td>
                  <td className="px-4 py-3 text-gray-600">email</td>
                  <td className="px-4 py-3"><span className="text-red-600 font-bold">Oui</span></td>
                  <td className="px-4 py-3 text-gray-500">john@example.com</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Promotion (année de sortie CPC)</td>
                  <td className="px-4 py-3 text-gray-600">yearPromo</td>
                  <td className="px-4 py-3"><span className="text-red-600 font-bold">Oui</span></td>
                  <td className="px-4 py-3 text-gray-500">2022</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Ville</td>
                  <td className="px-4 py-3 text-gray-600">city</td>
                  <td className="px-4 py-3 text-gray-500">Non</td>
                  <td className="px-4 py-3 text-gray-500">Paris</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Poste Occupé ou Recherché</td>
                  <td className="px-4 py-3 text-gray-600">position</td>
                  <td className="px-4 py-3 text-gray-500">Non</td>
                  <td className="px-4 py-3 text-gray-500">Développeur Full Stack</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Domaine</td>
                  <td className="px-4 py-3 text-gray-600">sectors (array)</td>
                  <td className="px-4 py-3 text-gray-500">Non</td>
                  <td className="px-4 py-3 text-gray-500">
                    <div className="text-xs">
                      <div>"Informatique, Finance" → ["Informatique", "Finance"]</div>
                      <div>"Data et IA" → ["Data", "IA"]</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-900">Précision de votre domaine</td>
                  <td className="px-4 py-3 text-gray-600">expertise (array)</td>
                  <td className="px-4 py-3 text-gray-500">Non</td>
                  <td className="px-4 py-3 text-gray-500">React, Node.js</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Avertissement */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Points importants</h3>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Les comptes seront créés avec des mots de passe aléatoires</li>
                <li>Les utilisateurs devront utiliser "Mot de passe oublié" pour se connecter</li>
                <li>L'import prend environ 30-60 secondes par profil (pause de 500ms entre chaque création)</li>
                <li>Pour 107 profils, comptez environ 50-90 minutes d'import</li>
                <li>Ne fermez pas cette page pendant l'import</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 3 : Upload de fichier */}
        {importStatus === 'idle' && !importResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload de fichier</h2>
            <FileUploader onFileSelect={handleFileSelect} />
            
            {parseError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{parseError}</p>
              </div>
            )}
          </div>
        )}

        {/* Section 4 : Progression */}
        {importStatus === 'processing' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Import en cours...</h2>
            <ImportProgress
              current={importProgress.current}
              total={importProgress.total}
              status={importStatus}
            />
          </div>
        )}

        {/* Section 5 : Rapport */}
        {importResult && importStatus === 'completed' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Rapport d'import</h2>
            <ImportReport result={importResult} onNewImport={handleNewImport} />
          </div>
        )}

        {/* Modal de prévisualisation */}
        <ImportPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onConfirm={handleConfirmImport}
          data={parsedData}
          validCount={validationStats.valid}
          errorCount={validationStats.invalid}
        />
      </div>
    </div>
  );
};

export default ImportAlumni;
