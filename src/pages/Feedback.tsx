import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Feedback: React.FC = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, 'feedback'), {
        message,
        email: email || null,
        userId: currentUser?.uid || null,
        createdAt: Timestamp.now()
      });
      setSent(true);
      setMessage('');
    } catch {
      setError("Erreur lors de l'envoi du feedback. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[60vh] bg-gray-50 py-12 px-2">
        <div className="max-w-xl mx-auto p-8 bg-green-50 border border-green-200 rounded-xl text-center shadow relative">
          <Link to="/" className="absolute left-6 top-6 flex items-center text-blue-700 hover:text-blue-900 font-medium text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour à l'accueil
          </Link>
          <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-2 mt-6">Merci pour votre retour !</h2>
          <p className="text-green-700">Votre avis a bien été transmis à l'équipe. Nous apprécions votre contribution !</p>
          <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" onClick={() => setSent(false)}>Envoyer un autre avis</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gray-50 py-12 px-2">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-xl p-8 md:p-10 border border-blue-100 relative">
        <Link to="/" className="absolute left-6 top-6 flex items-center text-blue-700 hover:text-blue-900 font-medium text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour à l'accueil
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4 text-center mt-6">Donnez votre avis</h1>
        <p className="mb-8 text-gray-600 text-center">N'hésitez pas à nous faire part de vos remarques, suggestions ou critiques constructives pour améliorer la plateforme.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Votre message *</label>
            <textarea
              id="message"
              required
              rows={5}
              className="w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
              placeholder="Votre avis, suggestion ou critique..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (optionnel)</label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
              placeholder="Laisser vide pour rester anonyme"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
