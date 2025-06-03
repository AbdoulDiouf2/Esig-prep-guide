import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Send, Check } from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  expectedDuration: string;
  topics: string[];
  targetAudience: string;
  preferredDate: string;
  contactEmail: string;
  notes: string;
}

const ProposerAtelier: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [topicInput, setTopicInput] = useState('');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    expectedDuration: '60',
    topics: [],
    targetAudience: '',
    preferredDate: '',
    contactEmail: currentUser?.email || '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddTopic = () => {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      setFormData({
        ...formData,
        topics: [...formData.topics, topicInput.trim()]
      });
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter(topic => topic !== topicToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Vous devez être connecté pour proposer un atelier');
      return;
    }

    if (!formData.title || !formData.description) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'workshopProposals'), {
        ...formData,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Utilisateur anonyme',
        status: 'pending', // 'pending', 'approved', 'rejected'
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setLoading(false);

      // Réinitialiser le formulaire après 3 secondes de succès
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          title: '',
          description: '',
          expectedDuration: '60',
          topics: [],
          targetAudience: '',
          preferredDate: '',
          contactEmail: currentUser?.email || '',
          notes: ''
        });
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de la soumission de la proposition:', error);
      setError('Une erreur est survenue lors de l\'envoi de votre proposition. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/webinars')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour aux webinaires
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Proposer un atelier</h1>
          
          <p className="text-gray-600 mb-8">
            Vous avez une expertise à partager avec la communauté ESIG ? Proposez-nous un atelier ou un webinaire
            et notre équipe vous contactera pour en discuter. Vos contributions enrichissent notre communauté !
          </p>

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-sm" role="alert">
              <div className="flex items-center">
                <Check className="w-5 h-5 mr-2" />
                <p>Votre proposition a été soumise avec succès ! Notre équipe l'examinera et vous contactera prochainement.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm" role="alert">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Titre de l'atelier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: Introduction à la programmation fonctionnelle"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description détaillée <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  id="description"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Décrivez le contenu, les objectifs et ce que les participants apprendront"
                />
              </div>

              <div>
                <label htmlFor="expectedDuration" className="block text-sm font-medium text-gray-700">
                  Durée estimée (minutes)
                </label>
                <select
                  name="expectedDuration"
                  id="expectedDuration"
                  value={formData.expectedDuration}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 heure</option>
                  <option value="90">1 heure 30</option>
                  <option value="120">2 heures</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sujets abordés
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ajouter un sujet"
                  />
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Ajouter
                  </button>
                </div>
                {formData.topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.topics.map((topic, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(topic)}
                          className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
                  Public cible
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: Débutants, étudiants en informatique, etc."
                />
              </div>

              <div>
                <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700">
                  Date préférée (optionnel)
                </label>
                <input
                  type="date"
                  name="preferredDate"
                  id="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                  Email de contact
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  id="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Votre email pour vous contacter"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes supplémentaires
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Informations complémentaires, besoins spécifiques, etc."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || success}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    loading || success ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Envoi en cours...
                    </>
                  ) : success ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Proposition envoyée
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer ma proposition
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProposerAtelier;
