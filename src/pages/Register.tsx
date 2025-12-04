import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MultiStepForm, Step } from '../components/forms/MultiStepForm';
import { Eye, EyeOff } from 'lucide-react';
import { createAlumniProfileOnSignup } from '../services/alumniService';

const Register: React.FC = () => {
  // États pour les données du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    yearPromo: new Date().getFullYear() + 1, // Année par défaut
    isEntrepreneur: false,
    // Données entrepreneur
    company: '',
    sector: '',
    city: '',
    country: '',
    description: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  // Fonction pour mettre à jour les données du formulaire
  const updateFormData = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation Étape 1 : Informations de base
  const validateStep1 = (): boolean => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Tous les champs sont obligatoires');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (!formData.yearPromo) {
      setError('L\'année de promotion est obligatoire');
      return false;
    }
    if (!termsAccepted) {
      setError('Vous devez accepter les conditions d\'utilisation');
      return false;
    }
    setError('');
    return true;
  };

  // Validation Étape 2 : Choix entrepreneur
  const validateStep2 = (): boolean => {
    if (formData.isEntrepreneur === false || formData.isEntrepreneur === true) {
      setError('');
      return true;
    }
    setError('Veuillez sélectionner une option');
    return false;
  };

  // Validation Étape 3 : Données entrepreneur
  const validateStep3 = (): boolean => {
    if (!formData.company || !formData.sector) {
      setError('Le nom de l\'entreprise et le secteur sont obligatoires');
      return false;
    }
    setError('');
    return true;
  };

  // Gestion de la complétion du formulaire
  const handleComplete = async () => {
    try {
      setError('');
      
      // Créer le compte utilisateur
      const user = await register(formData.email, formData.password, formData.name, formData.yearPromo);
      
      // Si entrepreneur, créer le profil alumni
      if (formData.isEntrepreneur) {
        await createAlumniProfileOnSignup({
          uid: user.uid,
          name: formData.name,
          email: formData.email,
          yearPromo: formData.yearPromo,
          company: formData.company,
          sectors: formData.sector ? [formData.sector] : [],
          expertise: [],
          bio: formData.description,
        });
        console.log('✅ Profil alumni créé avec succès');
      }
      
      // Redirection
      navigate('/applications');
    } catch (err) {
      setError('Erreur lors de la création du compte');
      console.error(err);
    }
  };

  // Étape 1 : Informations de base
  const Step1Component = (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nom complet *
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Adresse email *
        </label>
        <input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="yearPromo" className="block text-sm font-medium text-gray-700 mb-1">
          Année de promotion (année de sortie de prépa) *
        </label>
        <input
          id="yearPromo"
          type="number"
          required
          min="2000"
          max="2050"
          value={formData.yearPromo}
          onChange={(e) => updateFormData('yearPromo', parseInt(e.target.value))}
          placeholder="Ex: 2022"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Ex: Si tu as fini la prépa en 2022, ta promo est 2022. Si tu es en 1ère année, indique ton année de sortie estimée.
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Mot de passe *
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirmez le mot de passe *
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={formData.confirmPassword}
            onChange={(e) => updateFormData('confirmPassword', e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-start">
        <input
          id="terms"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
          J'accepte les{' '}
          <Link to="/legal/CGU" className="font-medium text-blue-600 hover:text-blue-500" target="_blank">
            conditions d'utilisation
          </Link>
          {' '}*
        </label>
      </div>
    </div>
  );

  // Étape 2 : Décision entrepreneur
  const Step2Component = (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Souhaitez-vous créer un profil alumni ?
        </h3>
        <p className="text-sm text-gray-600">
          Le profil alumni vous permet d'être visible dans l'annuaire et de vous connecter avec d'autres alumni.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => updateFormData('isEntrepreneur', false)}
          className={`p-6 border-2 rounded-lg transition-all ${
            formData.isEntrepreneur === false
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">👤</div>
            <div className="font-medium text-gray-900">Non</div>
            <div className="text-sm text-gray-600 mt-1">
              Compte basique uniquement
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => updateFormData('isEntrepreneur', true)}
          className={`p-6 border-2 rounded-lg transition-all ${
            formData.isEntrepreneur === true
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🚀</div>
            <div className="font-medium text-gray-900">Oui</div>
            <div className="text-sm text-gray-600 mt-1">
              Créer mon profil alumni
            </div>
          </div>
        </button>
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        {formData.isEntrepreneur === null 
          ? 'Sélectionnez une option pour continuer' 
          : formData.isEntrepreneur 
            ? '✓ Vous allez créer un profil alumni' 
            : '✓ Vous créez un compte basique'}
      </p>
    </div>
  );

  // Étape 3 : Données entrepreneur
  const Step3Component = (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
          Nom de l'entreprise / Projet *
        </label>
        <input
          id="company"
          type="text"
          required
          value={formData.company}
          onChange={(e) => updateFormData('company', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
          Secteur d'activité *
        </label>
        <select
          id="sector"
          required
          value={formData.sector}
          onChange={(e) => updateFormData('sector', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sélectionnez un secteur</option>
          <option value="Tech">Tech / IT</option>
          <option value="Finance">Finance</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Consulting">Consulting</option>
          <option value="Education">Éducation</option>
          <option value="Santé">Santé</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Ville
          </label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Pays
          </label>
          <input
            id="country"
            type="text"
            value={formData.country}
            onChange={(e) => updateFormData('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description courte
        </label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Décris brièvement ton activité..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  // Étape 4 : Résumé
  const Step4Component = (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
        <p className="text-sm text-blue-700">
          Vérifiez vos informations avant de créer votre compte.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Informations personnelles</h4>
          <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm">
            <p><span className="font-medium">Nom :</span> {formData.name}</p>
            <p><span className="font-medium">Email :</span> {formData.email}</p>
            <p><span className="font-medium">Promotion :</span> {formData.yearPromo}</p>
          </div>
        </div>

        {formData.isEntrepreneur && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Profil alumni</h4>
            <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm">
              <p><span className="font-medium">Entreprise :</span> {formData.company}</p>
              <p><span className="font-medium">Secteur :</span> {formData.sector}</p>
              {formData.city && <p><span className="font-medium">Ville :</span> {formData.city}</p>}
              {formData.country && <p><span className="font-medium">Pays :</span> {formData.country}</p>}
              {formData.description && (
                <p><span className="font-medium">Description :</span> {formData.description}</p>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              ⏳ Votre profil alumni sera soumis pour validation avant d'être visible dans l'annuaire.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Définition des étapes
  const steps: Step[] = [
    {
      id: 1,
      title: 'Informations de base',
      component: Step1Component,
      validation: validateStep1,
    },
    {
      id: 2,
      title: 'Profil alumni',
      component: Step2Component,
      validation: validateStep2,
    },
    ...(formData.isEntrepreneur
      ? [
          {
            id: 3,
            title: 'Détails entrepreneur',
            component: Step3Component,
            validation: validateStep3,
          },
        ]
      : []),
    {
      id: 4,
      title: 'Résumé',
      component: Step4Component,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center shadow-sm">
          <div className="text-white font-bold text-lg">E</div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Créez votre compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            connectez-vous avec un compte existant
          </Link>
        </p>
      </div>

      <MultiStepForm
        steps={steps}
        currentStepIndex={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleComplete}
        onCancel={() => navigate('/login')}
      />
    </div>
  );
};

export default Register;
