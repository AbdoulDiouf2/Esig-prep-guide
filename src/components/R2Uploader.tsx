import React, { useState } from 'react';
import { uploadToR2 } from '../utils/r2Utils';
import { CheckCircle, X, AlertTriangle, FileText, Upload, XCircle } from 'lucide-react';

interface R2UploaderProps {
  onSuccess?: (url: string) => void;
  buttonText?: string;
  compact?: boolean;
  folder?: string;
}

type ModalState = {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | null;
  title: string;
  message: string;
  fileName?: string;
  url?: string;
};

export default function R2Uploader({
  onSuccess,
  buttonText = 'Uploader sur Cloudflare R2',
  compact = false,
  folder = 'resources',
}: R2UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const { url: publicUrl } = await uploadToR2(file, folder);
      setUrl(publicUrl);

      if (onSuccess) onSuccess(publicUrl);

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Upload réussi !',
        message: 'Fichier uploadé sur Cloudflare R2 et prêt à être utilisé.',
        fileName: file.name,
        url: publicUrl,
      });
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'error',
        title: "Échec de l'upload",
        message: err instanceof Error ? err.message : String(err),
        fileName: file.name,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={compact ? 'flex items-center' : 'space-y-3'}>
      <div className={compact ? 'flex-grow mr-2' : 'mb-2'}>
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
          file:rounded-lg file:border-0 file:text-sm file:font-medium
          file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`${compact ? '' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center`}
      >
        {uploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Envoi...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        )}
      </button>

      {url && !compact && (
        <div className="mt-2 text-sm text-gray-600">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Fichier uploadé avec succès
          </a>
        </div>
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
            <div className={`py-4 px-5 flex items-center ${
              modal.type === 'success' ? 'bg-green-50' :
              modal.type === 'error' ? 'bg-red-50' : 'bg-yellow-50'
            }`}>
              <div className="flex-shrink-0 mr-3">
                {modal.type === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
                {modal.type === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
                {modal.type === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
              </div>
              <h3 className={`text-lg font-medium ${
                modal.type === 'success' ? 'text-green-800' :
                modal.type === 'error' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {modal.title}
              </h3>
              <button onClick={closeModal} className="ml-auto bg-transparent text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-gray-700 mb-4">{modal.message}</p>

              {modal.fileName && (
                <div className="flex items-center p-3 bg-gray-50 rounded-md mb-4">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700 truncate" title={modal.fileName}>
                    {modal.fileName}
                  </span>
                </div>
              )}

              {modal.url && (
                <div className="mb-4">
                  <a
                    href={modal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Accéder au fichier
                  </a>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={closeModal} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md transition-colors">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
