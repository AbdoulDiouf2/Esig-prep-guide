import React, { useState } from 'react';
import { Briefcase, MapPin, Link as LinkIcon, Award, Package, Users } from 'lucide-react';

interface AlumniProfileFormData {
  // Infos de base
  headline: string;
  bio: string;
  photo?: string;
  
  // Secteurs & Expertise
  sectors: string[];
  expertise: string[];
  
  // Professionnel
  company?: string;
  position?: string;
  companyDescription?: string;
  website?: string;
  
  // Portfolio
  portfolio: {
    title: string;
    description: string;
    url?: string;
    image?: string;
  }[];
  
  // Services
  services: {
    name: string;
    description: string;
    category: string;
  }[];
  
  // Je cherche / Je propose
  seeking?: string[];
  offering?: string[];
  
  // Réseaux sociaux
  linkedin?: string;
  github?: string;
  twitter?: string;
  
  // Localisation
  city?: string;
  country?: string;
}

interface AlumniProfileFormProps {
  initialData?: Partial<AlumniProfileFormData>;
  onSubmit: (data: AlumniProfileFormData) => void | Promise<void>;
  onPhotoUpload?: (file: File) => Promise<string>;
  loading?: boolean;
}

const AlumniProfileForm: React.FC<AlumniProfileFormProps> = ({
  initialData,
  onSubmit,
  onPhotoUpload,
  loading = false,
}) => {
  const [formData, setFormData] = useState<AlumniProfileFormData>({
    headline: initialData?.headline || '',
    bio: initialData?.bio || '',
    photo: initialData?.photo,
    sectors: initialData?.sectors || [],
    expertise: initialData?.expertise || [],
    company: initialData?.company,
    position: initialData?.position,
    companyDescription: initialData?.companyDescription,
    website: initialData?.website,
    portfolio: initialData?.portfolio || [],
    services: initialData?.services || [],
    seeking: initialData?.seeking || [],
    offering: initialData?.offering || [],
    linkedin: initialData?.linkedin,
    github: initialData?.github,
    twitter: initialData?.twitter,
    city: initialData?.city,
    country: initialData?.country,
  });

  const [newSector, setNewSector] = useState('');
  const [newExpertise, setNewExpertise] = useState('');
  const [newSeeking, setNewSeeking] = useState('');
  const [newOffering, setNewOffering] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Options prédéfinies pour "Je cherche / Je propose"
  const seekingOptions = [
    'Collaborateur',
    'Développeur',
    'Designer',
    'Mentor',
    'Opportunité',
    'Stage',
    'Emploi',
    'Partenaire',
    'Investisseur',
    'Conseil',
  ];

  const offeringOptions = [
    'Mentorat',
    'Conseil',
    'Collaboration',
    'Service',
    'Formation',
    'Recrutement',
    'Partenariat',
    'Investissement',
    'Expertise technique',
    'Réseau',
  ];

  // Secteurs prédéfinis
  const predefinedSectors = [
    'Tech', 'Finance', 'Design', 'Marketing', 'Startup', 
    'Consulting', 'Education', 'Santé', 'E-commerce', 'Autre'
  ];

  const handleAddSector = (sector: string) => {
    if (sector && !formData.sectors.includes(sector)) {
      setFormData(prev => ({ ...prev, sectors: [...prev.sectors, sector] }));
      setNewSector('');
    }
  };

  const handleRemoveSector = (sector: string) => {
    setFormData(prev => ({
      ...prev,
      sectors: prev.sectors.filter(s => s !== sector),
    }));
  };

  const handleAddExpertise = () => {
    if (newExpertise && !formData.expertise.includes(newExpertise)) {
      setFormData(prev => ({ ...prev, expertise: [...prev.expertise, newExpertise] }));
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (exp: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== exp),
    }));
  };

  const handleAddPortfolio = () => {
    setFormData(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, { title: '', description: '', url: '', image: '' }],
    }));
  };

  const handleRemovePortfolio = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index),
    }));
  };

  const handlePortfolioChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { name: '', description: '', category: '' }],
    }));
  };

  const handleRemoveService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Fonctions pour "Je cherche"
  const handleAddSeeking = (item: string) => {
    if (item && !formData.seeking?.includes(item)) {
      setFormData(prev => ({ ...prev, seeking: [...(prev.seeking || []), item] }));
      setNewSeeking('');
    }
  };

  const handleRemoveSeeking = (item: string) => {
    setFormData(prev => ({
      ...prev,
      seeking: prev.seeking?.filter(s => s !== item) || [],
    }));
  };

  // Fonctions pour "Je propose"
  const handleAddOffering = (item: string) => {
    if (item && !formData.offering?.includes(item)) {
      setFormData(prev => ({ ...prev, offering: [...(prev.offering || []), item] }));
      setNewOffering('');
    }
  };

  const handleRemoveOffering = (item: string) => {
    setFormData(prev => ({
      ...prev,
      offering: prev.offering?.filter(o => o !== item) || [],
    }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoUpload) {
      setUploadingPhoto(true);
      try {
        const photoUrl = await onPhotoUpload(file);
        setFormData(prev => ({ ...prev, photo: photoUrl }));
      } catch (error) {
        console.error('Erreur upload photo:', error);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1 : Infos de base */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Informations de base
        </h3>

        <div className="space-y-4">
          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo de profil
            </label>
            {formData.photo && (
              <img
                src={formData.photo}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploadingPhoto}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadingPhoto && <p className="text-sm text-gray-500 mt-1">Upload en cours...</p>}
          </div>

          {/* Headline */}
          <div>
            <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">
              Titre professionnel *
            </label>
            <input
              id="headline"
              type="text"
              required
              value={formData.headline}
              onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
              placeholder="Ex: Développeur Full-Stack | Fondateur de Startup"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio / Description *
            </label>
            <textarea
              id="bio"
              required
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Parle de toi, ton parcours, tes passions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 2 : Secteurs & Expertise */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-blue-600" />
          Secteurs & Expertise
        </h3>

        <div className="space-y-4">
          {/* Secteurs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secteurs d'activité
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {predefinedSectors.map(sector => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => handleAddSector(sector)}
                  disabled={formData.sectors.includes(sector)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    formData.sectors.includes(sector)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                placeholder="Autre secteur..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddSector(newSector)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.sectors.map(sector => (
                <span
                  key={sector}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {sector}
                  <button
                    type="button"
                    onClick={() => handleRemoveSector(sector)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compétences / Expertise
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())}
                placeholder="Ex: React, Marketing Digital, Levée de fonds..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.expertise.map(exp => (
                <span
                  key={exp}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {exp}
                  <button
                    type="button"
                    onClick={() => handleRemoveExpertise(exp)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 : Professionnel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
          Informations professionnelles
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Entreprise
              </label>
              <input
                id="company"
                type="text"
                value={formData.company || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Nom de l'entreprise"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Poste
              </label>
              <input
                id="position"
                type="text"
                value={formData.position || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Ton poste actuel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description de l'entreprise
            </label>
            <textarea
              id="companyDescription"
              rows={3}
              value={formData.companyDescription || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, companyDescription: e.target.value }))}
              placeholder="Que fait ton entreprise ?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Site web
            </label>
            <input
              id="website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 4 : Portfolio */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-blue-600" />
          Portfolio / Projets
        </h3>

        <div className="space-y-4">
          {formData.portfolio.map((item, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">Projet {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemovePortfolio(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handlePortfolioChange(index, 'title', e.target.value)}
                  placeholder="Titre du projet"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) => handlePortfolioChange(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  value={item.url || ''}
                  onChange={(e) => handlePortfolioChange(index, 'url', e.target.value)}
                  placeholder="URL du projet"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPortfolio}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600"
          >
            + Ajouter un projet
          </button>
        </div>
      </div>

      {/* Section 5 : Services */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-blue-600" />
          Services offerts
        </h3>

        <div className="space-y-4">
          {formData.services.map((service, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">Service {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveService(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                  placeholder="Nom du service"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  rows={2}
                  value={service.description}
                  onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={service.category}
                  onChange={(e) => handleServiceChange(index, 'category', e.target.value)}
                  placeholder="Catégorie (ex: Développement, Design...)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddService}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600"
          >
            + Ajouter un service
          </button>
        </div>
      </div>

      {/* Section 6 : Je cherche / Je propose */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-purple-600" />
          Je cherche / Je propose
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Indique ce que tu cherches et ce que tu proposes pour faciliter le networking et les opportunités.
        </p>

        <div className="space-y-6">
          {/* Je cherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Je cherche
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.seeking?.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveSeeking(item)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {seekingOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAddSeeking(option)}
                  disabled={formData.seeking?.includes(option)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.seeking?.includes(option)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  + {option}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSeeking}
                onChange={(e) => setNewSeeking(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSeeking(newSeeking);
                  }
                }}
                placeholder="Ou ajoute un élément personnalisé..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => handleAddSeeking(newSeeking)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Je propose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💡 Je propose
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.offering?.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveOffering(item)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {offeringOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAddOffering(option)}
                  disabled={formData.offering?.includes(option)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formData.offering?.includes(option)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  + {option}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOffering}
                onChange={(e) => setNewOffering(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOffering(newOffering);
                  }
                }}
                placeholder="Ou ajoute un élément personnalisé..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              <button
                type="button"
                onClick={() => handleAddOffering(newOffering)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 7 : Réseaux sociaux */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <LinkIcon className="w-5 h-5 mr-2 text-blue-600" />
          Réseaux sociaux
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn
            </label>
            <input
              id="linkedin"
              type="url"
              value={formData.linkedin || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub
            </label>
            <input
              id="github"
              type="url"
              value={formData.github || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
              placeholder="https://github.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
              Twitter
            </label>
            <input
              id="twitter"
              type="url"
              value={formData.twitter || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
              placeholder="https://twitter.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 7 : Localisation */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Localisation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <input
              id="city"
              type="text"
              value={formData.city || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Ex: Dakar"
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
              value={formData.country || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              placeholder="Ex: Sénégal"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bouton de soumission */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-3 rounded-md text-white font-medium ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Enregistrement...' : 'Soumettre pour validation'}
        </button>
      </div>
    </form>
  );
};

export default AlumniProfileForm;
export type { AlumniProfileFormData };
