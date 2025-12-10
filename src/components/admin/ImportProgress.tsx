import React from 'react';
import { Loader2 } from 'lucide-react';

interface ImportProgressProps {
  current: number;
  total: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

const ImportProgress: React.FC<ImportProgressProps> = ({ current, total, status }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="w-full">
      {/* Barre de progression */}
      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            status === 'error'
              ? 'bg-red-500'
              : status === 'completed'
              ? 'bg-green-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        >
          {status === 'processing' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
          )}
        </div>
      </div>

      {/* Informations */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {status === 'processing' && (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          )}
          <span className="text-gray-700 font-medium">
            {status === 'processing' && 'Import en cours...'}
            {status === 'completed' && '✅ Import terminé !'}
            {status === 'error' && '❌ Erreur lors de l\'import'}
          </span>
        </div>
        <span className="text-gray-600">
          {current} / {total} ({percentage}%)
        </span>
      </div>
    </div>
  );
};

export default ImportProgress;
