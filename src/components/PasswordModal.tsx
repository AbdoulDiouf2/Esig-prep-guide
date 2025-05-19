import React, { useState } from 'react';

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  loading?: boolean;
  error?: string | null;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ open, onClose, onSubmit, loading = false, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  React.useEffect(() => {
    if (!open) setPassword('');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-xs w-full relative animate-fadeIn">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          disabled={loading}
          aria-label="Fermer"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4 text-center">Mot de passe requis</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Mot de passe admin..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            autoFocus
          />
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading || password === ''}
          >
            Valider
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
