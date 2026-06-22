import React, { useState } from 'react';

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  requiresPassword: boolean;
  loading?: boolean;
  error?: string | null;
}

const CONFIRMATION_TEXT = 'je veux supprimer mon compte';

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  open,
  onClose,
  onConfirm,
  requiresPassword,
  loading = false,
  error,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    if (!open) {
      setConfirmationInput('');
      setPassword('');
    }
  }, [open]);

  if (!open) return null;

  const phraseMatches = confirmationInput === CONFIRMATION_TEXT;
  const canSubmit = phraseMatches && (!requiresPassword || password !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative animate-fadeIn">
        <button
          type="button"
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          disabled={loading}
          aria-label="Fermer"
        >
          ×
        </button>

        <h2 className="text-lg font-bold mb-2 text-red-700">Supprimer définitivement votre compte ?</h2>
        <p className="text-sm text-gray-600 mb-4">
          Cette action est irréversible. Toutes vos données seront perdues.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pour confirmer, tapez exactement : <span className="font-semibold">"{CONFIRMATION_TEXT}"</span>
            </label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {requiresPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Votre mot de passe
              </label>
              <input
                type="password"
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Votre mot de passe..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Suppression en cours...' : 'Supprimer définitivement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
