import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, X, Loader2, Calendar, Clock, Users, User, Mail, AlertCircle } from 'lucide-react';
import { db } from '../../firebase';
import { doc, collection, addDoc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { Webinar } from './WebinarCard';

interface WebinarRegistrationFormProps {
  webinar: Webinar;
  onClose: () => void;
}

const WebinarRegistrationForm: React.FC<WebinarRegistrationFormProps> = ({ webinar, onClose }) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    question: '',
    receiveUpdates: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation simple
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    
    if (!currentUser) {
      setError('Vous devez être connecté pour vous inscrire à un webinaire.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Vérifier si le webinaire existe et s'il y a encore de la place
      const webinarRef = doc(db, 'webinars', webinar.id);
      const webinarSnap = await getDoc(webinarRef);
      
      if (!webinarSnap.exists()) {
        throw new Error('Ce webinaire n\'existe plus.');
      }
      
      const webinarData = webinarSnap.data();
      if (webinarData.currentParticipants >= webinarData.maxParticipants) {
        throw new Error('Désolé, ce webinaire est complet.');
      }
      
      // Créer l'inscription dans la collection "webinarRegistrations"
      const registrationData = {
        webinarId: webinar.id,
        webinarTitle: webinar.title,
        userId: currentUser.uid,
        userName: formData.name,
        userEmail: formData.email,
        userPhone: formData.phone,
        question: formData.question,
        receiveUpdates: formData.receiveUpdates,
        status: 'confirmed', // confirmed, cancelled, attended
        registeredAt: serverTimestamp(),
        webinarDate: webinar.date
      };
      
      // Ajouter l'inscription à Firestore
      const registrationRef = await addDoc(collection(db, 'webinarRegistrations'), registrationData);
      
      // Incrémenter le nombre de participants du webinaire
      await updateDoc(webinarRef, {
        currentParticipants: increment(1),
        updatedAt: serverTimestamp()
      });
      
      // Mettre à jour l'utilisateur pour ajouter cette inscription à son profil (optionnel)
      // Si vous avez une collection "users", vous pourriez mettre à jour l'utilisateur
      if (currentUser.uid) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            await updateDoc(userRef, {
              webinarRegistrations: [...(userSnap.data().webinarRegistrations || []), registrationRef.id],
              updatedAt: serverTimestamp()
            });
          }
        } catch (userErr) {
          // Ne pas bloquer le processus si cette mise à jour échoue
          console.error('Erreur lors de la mise à jour du profil utilisateur:', userErr);
        }
      }
      
      setIsSuccess(true);
      
      // En production, vous pourriez vouloir rediriger vers une page de confirmation
      // ou simplement fermer le formulaire et mettre à jour l'état dans le composant parent
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (err: unknown) {
      console.error('Erreur lors de l\'inscription:', err);
      
      // Vérifier si l'erreur est un objet avec une propriété message
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Une erreur est survenue lors de votre inscription. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isSuccess) {
    return (
      <div className="rounded-lg bg-green-50 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Inscription confirmée !</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Votre inscription au webinaire a bien été enregistrée. Vous recevrez bientôt un email de confirmation avec les détails de connexion.</p>
            </div>
            {webinar.meetingLink && (
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <a
                    href={webinar.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                  >
                    Accéder au webinaire
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">S'inscrire au webinaire</h3>
            <p className="mt-1 text-sm text-gray-500">
              Complétez le formulaire ci-dessous pour vous inscrire à ce webinaire.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">{webinar.title}</h4>
              <div className="mt-2 space-y-2 text-sm text-blue-700">
                <div className="flex items-start">
                  <Calendar className="flex-shrink-0 h-5 w-5 mr-2" />
                  <span>{formatDate(webinar.date)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="flex-shrink-0 h-5 w-5 mr-2" />
                  <span>{webinar.duration} minutes</span>
                </div>
                <div className="flex items-center">
                  <Users className="flex-shrink-0 h-5 w-5 mr-2" />
                  <span>
                    {webinar.currentParticipants + 1} / {webinar.maxParticipants} participants (dont vous)
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Vos informations</h4>
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                  Avez-vous des questions pour l'intervenant ?
                </label>
                <div className="mt-1">
                  <textarea
                    id="question"
                    name="question"
                    rows={3}
                    value={formData.question}
                    onChange={handleChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Posez ici vos questions à l'avance..."
                  />
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="receiveUpdates"
                    name="receiveUpdates"
                    type="checkbox"
                    checked={formData.receiveUpdates}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="receiveUpdates" className="font-medium text-gray-700">
                    Recevoir les mises à jour concernant ce webinaire
                  </label>
                  <p className="text-gray-500">
                    Vous recevrez des rappels et des informations complémentaires par email.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Traitement...
                      </>
                    ) : (
                      "Confirmer l'inscription"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebinarRegistrationForm;
