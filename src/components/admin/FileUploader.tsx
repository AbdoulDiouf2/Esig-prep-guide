import React, { useRef, useState } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  acceptedFormats = ['.csv', '.xlsx'],
  maxSizeMB = 5,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError('');

    // Vérifier la taille
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Le fichier est trop volumineux (max ${maxSizeMB} MB)`);
      return false;
    }

    // Vérifier le format
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      setError(`Format non supporté. Formats acceptés : ${acceptedFormats.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Zone de drag & drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${selectedFile ? 'bg-green-50 border-green-500' : ''}
          hover:border-blue-400 hover:bg-blue-50 cursor-pointer
        `}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />

        {!selectedFile ? (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Glissez-déposez votre fichier ici
            </p>
            <p className="text-sm text-gray-500 mb-4">
              ou cliquez pour parcourir
            </p>
            <p className="text-xs text-gray-400">
              Formats acceptés : {acceptedFormats.join(', ')} · Max {maxSizeMB} MB
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <File className="w-8 h-8 text-green-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="ml-4 p-1 hover:bg-red-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
