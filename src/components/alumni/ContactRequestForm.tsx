import React, { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import { AlumniProfile } from '../../types/alumni';
import { useAuth } from '../../contexts/AuthContext';
import { sendContactRequest } from '../../services/alumniService';

interface ContactRequestFormProps {
  targetProfile: AlumniProfile;
  onClose: () => void;
}

/**
 * Formulaire de demande de contact entre alumni
 * Permet d'envoyer un message à un autre alumni
 */
const ContactRequestForm: React.FC<ContactRequestFormProps> = ({
  targetProfile,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError('Vous devez être connecté pour envoyer une demande de contact');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendContactRequest({
        fromUid: currentUser.uid,
        fromName: currentUser.displayName || currentUser.email || 'Utilisateur',
        fromEmail: currentUser.email || '',
        toUid: targetProfile.uid,
        toName: targetProfile.name,
        toEmail: targetProfile.email,
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccess(true);
      
      // Fermer automatiquement après 3 secondes
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la demande:', err);
      setError('Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Affichage du message de succès
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Demande envoyée !
          </h3>
          <p className="text-gray-600 mb-4">
            Merci ! Ta demande a été envoyée à <strong>{targetProfile.name}</strong>.
            <br />
            On te répond dans les meilleurs délais.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // Formulaire de contact
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Demander un contact
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Envoyer un message à <strong>{targetProfile.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Profil cible */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center space-x-3">
            {targetProfile.photo ? (
              <img
                src={targetProfile.photo}
                alt={targetProfile.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {targetProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{targetProfile.name}</h3>
              {targetProfile.headline && (
                <p className="text-sm text-gray-600">{targetProfile.headline}</p>
              )}
            </div>
          </div>

          {/* Objet */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Objet de la demande <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Collaboration sur un projet, Demande de conseil..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {subject.length}/100 caractères
            </p>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Votre message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présentez-vous et expliquez pourquoi vous souhaitez entrer en contact..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/1000 caractères
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Informations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">📧 Comment ça marche ?</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Votre message sera envoyé par email à {targetProfile.name}</li>
              <li>Vos coordonnées seront partagées pour faciliter le contact</li>
              <li>Soyez professionnel et courtois dans votre message</li>
            </ul>
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !subject.trim() || !message.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Envoyer ma demande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactRequestForm;
