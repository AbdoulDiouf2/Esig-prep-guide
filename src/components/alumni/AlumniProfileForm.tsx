import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, Award, Users, Globe, Eye, MapPin, Link as LinkIcon, Package, GraduationCap, Heart, Star } from 'lucide-react';
import LocationAutocomplete from '../common/LocationAutocomplete';
import { EducationEntry, ExperienceEntry, CertificationEntry } from '../../types/alumni';

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
  companyWebsite?: string;
  personalWebsite?: string;
  
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
  seekingDetails?: string;
  availabilityNote?: string;
  rateIfPaid?: string;
  
  // NOUVEAUX CHAMPS RECOMMANDÉS
  education?: EducationEntry[];
  experiences?: ExperienceEntry[];
  certifications?: CertificationEntry[];
  softSkills?: string[];
  languages?: {
    name: string;
    level: string;
  }[];
  availability?: string;
  visibility?: {
    showEmail?: boolean;
    showCity?: boolean;
    showCompany?: boolean;
  };
  interests?: string[];
  
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
  // onPhotoUpload?: (file: File) => Promise<string>; // Désactivé temporairement
  loading?: boolean;
}

const AlumniProfileForm: React.FC<AlumniProfileFormProps> = ({
  initialData,
  onSubmit,
  // onPhotoUpload, // Désactivé temporairement
  loading = false,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AlumniProfileFormData>({
    headline: initialData?.headline || '',
    bio: initialData?.bio || '',
    photo: initialData?.photo,
    sectors: initialData?.sectors || [],
    expertise: initialData?.expertise || [],
    company: initialData?.company,
    position: initialData?.position,
    companyDescription: initialData?.companyDescription,
    companyWebsite: initialData?.companyWebsite,
    personalWebsite: initialData?.personalWebsite,
    portfolio: initialData?.portfolio || [],
    services: initialData?.services || [],
    seeking: initialData?.seeking || [],
    offering: initialData?.offering || [],
    seekingDetails: initialData?.seekingDetails || '',
    availabilityNote: initialData?.availabilityNote || '',
    rateIfPaid: initialData?.rateIfPaid || '',
    
    // NOUVEAUX CHAMPS
    education: initialData?.education || [],
    experiences: initialData?.experiences || [],
    certifications: initialData?.certifications || [],
    softSkills: initialData?.softSkills || [],
    languages: initialData?.languages || [],
    availability: initialData?.availability || '',
    visibility: initialData?.visibility || {
      showEmail: false,  // Plus privé par défaut
      showCity: true,
      showCompany: true,
    },
    interests: initialData?.interests || [],
    
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
  
  // États pour les nouveaux champs
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLanguageLevel, setNewLanguageLevel] = useState('');
  const [newInterest, setNewInterest] = useState('');
  
  // Options prédéfinies
  const softSkillOptions = [
    'Leadership', 'Communication', 'Gestion de projet', 'Travail d\'équipe',
    'Résolution de problèmes', 'Créativité', 'Adaptabilité', 'Analytique',
    'Prise de décision', 'Négociation', 'Présentation', 'Management'
  ];
  
  const languageLevels = ['Débutant', 'Intermédiaire', 'Courant', 'Bilingue', 'Natif'];
  
  const interestOptions = [
    'Sport', 'Musique', 'Voyage', 'Lecture', 'Photographie', 'Cuisine',
    'Technologie', 'Entrepreneuriat', 'Art', 'Nature', 'Jeux vidéo', 'Bénévolat'
  ];
  // const [uploadingPhoto, setUploadingPhoto] = useState(false); // Désactivé temporairement

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
    'Consulting', 'Education', 'Santé', 'E-commerce', 'Entreprenariat', 'Autre'
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

  // Fonctions pour Soft Skills
  const handleAddSoftSkill = (skill: string) => {
    if (skill && !formData.softSkills?.includes(skill)) {
      setFormData(prev => ({ ...prev, softSkills: [...(prev.softSkills || []), skill] }));
      setNewSoftSkill('');
    }
  };

  const handleRemoveSoftSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      softSkills: prev.softSkills?.filter(s => s !== skill) || [],
    }));
  };

  // Fonctions pour Langues
  const handleAddLanguage = () => {
    if (newLanguage && newLanguageLevel) {
      const newLang = { name: newLanguage, level: newLanguageLevel };
      const exists = formData.languages?.some(lang => lang.name === newLanguage);
      if (!exists) {
        setFormData(prev => ({ 
          ...prev, 
          languages: [...(prev.languages || []), newLang] 
        }));
        setNewLanguage('');
        setNewLanguageLevel('');
      }
    }
  };

  const handleRemoveLanguage = (languageName: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages?.filter(l => l.name !== languageName) || [],
    }));
  };

  // Fonctions pour Intérêts
  const handleAddInterest = (interest: string) => {
    if (interest && !formData.interests?.includes(interest)) {
      setFormData(prev => ({ ...prev, interests: [...(prev.interests || []), interest] }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests?.filter(i => i !== interest) || [],
    }));
  };

  // Fonctions pour Éducation
  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...(prev.education || []), { 
        school: '', 
        degree: '', 
        field: '', 
        startDate: '', 
        endDate: '', 
        isCurrent: false 
      }],
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleEducationChange = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ) || [],
    }));
  };

  // Fonctions pour Expériences
  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      experiences: [...(prev.experiences || []), { 
        company: '', 
        role: '', 
        startDate: '', 
        endDate: '', 
        isCurrent: false,
        description: '' 
      }],
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleExperienceChange = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences?.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ) || [],
    }));
  };

  // Fonctions pour Certifications
  const handleAddCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), { 
        name: '', 
        issuer: '', 
        date: '', 
        url: '' 
      }],
    }));
  };

  const handleRemoveCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleCertificationChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications?.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ) || [],
    }));
  };

  // Fonctions pour Visibilité
  const handleVisibilityChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      visibility: { ...prev.visibility, [field]: value },
    }));
  };

  // const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file && onPhotoUpload) {
  //     setUploadingPhoto(true);
  //     try {
  //       const photoUrl = await onPhotoUpload(file);
  //       setFormData(prev => ({ ...prev, photo: photoUrl }));
  //     } catch (error) {
  //       console.error('Erreur upload photo:', error);
  //     } finally {
  //       setUploadingPhoto(false);
  //     }
  //   }
  // }; // Désactivé temporairement

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Nettoyer les données undefined avant la soumission
    const cleanedData = {
      ...formData,
      availability: formData.availability || undefined,
      availabilityNote: formData.availabilityNote || undefined,
      company: formData.company || undefined,
      position: formData.position || undefined,
      companyDescription: formData.companyDescription || undefined,
      companyWebsite: formData.companyWebsite || undefined,
      personalWebsite: formData.personalWebsite || undefined,
      linkedin: formData.linkedin || undefined,
      github: formData.github || undefined,
      twitter: formData.twitter || undefined,
      city: formData.city || undefined,
      country: formData.country || undefined,
    };
    
    onSubmit(cleanedData);
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
          <div className="opacity-60">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo de profil
            </label>
            <div className="bg-gray-100 border border-gray-300 rounded-md p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                🚫 L'upload de photos est temporairement désactivé
              </p>
              <p className="text-xs text-gray-500">
                Le stockage Firebase Storage sera bientôt activé
              </p>
            </div>
            {formData.photo && (
              <img
                src={formData.photo}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-2 mt-2"
              />
            )}
          </div>

          {/* Headline */}
          <div>
            <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">
              Titre professionnel *
            </label>
            <div className="relative">
              <input
                id="headline"
                type="text"
                required
                value={formData.headline}
                onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                placeholder="Ex: Développeur Full-Stack | Fondateur de Startup"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.headline && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, headline: '' }))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio / Description *
            </label>
            <div className="relative">
              <textarea
                id="bio"
                required
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Parle-nous de toi, ton parcours, tes projets..."
                rows={4}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.bio && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, bio: '' }))}
                  className="absolute right-2 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
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
              <div className="relative">
                <input
                  id="company"
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Nom de l'entreprise"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.company && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, company: undefined }))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Poste
              </label>
              <div className="relative">
                <input
                  id="position"
                  type="text"
                  value={formData.position || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Ton poste actuel"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.position && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, position: undefined }))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description de l'entreprise
            </label>
            <div className="relative">
              <textarea
                id="companyDescription"
                rows={3}
                value={formData.companyDescription || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, companyDescription: e.target.value }))}
                placeholder="Que fait ton entreprise ?"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.companyDescription && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, companyDescription: undefined }))}
                  className="absolute right-2 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-1">
              Site web de l'entreprise
            </label>
            <div className="relative">
              <input
                id="companyWebsite"
                type="url"
                value={formData.companyWebsite || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                placeholder="https://exemple-entreprise.com"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.companyWebsite && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, companyWebsite: undefined }))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
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

      {/* Section 8 : Compétences transversales (Soft Skills) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-600" />
          Compétences transversales (Soft Skills)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Ajoute tes soft skills pour montrer tes compétences interpersonnelles et professionnelles.
        </p>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {softSkillOptions.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleAddSoftSkill(skill)}
                disabled={formData.softSkills?.includes(skill)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  formData.softSkills?.includes(skill)
                    ? 'bg-yellow-200 text-yellow-800 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-yellow-100 hover:text-yellow-700'
                }`}
              >
                + {skill}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.softSkills?.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSoftSkill(skill)}
                  className="ml-2 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSoftSkill}
              onChange={(e) => setNewSoftSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSoftSkill(newSoftSkill);
                }
              }}
              placeholder="Ou ajoute un soft skill personnalisé..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
            />
            <button
              type="button"
              onClick={() => handleAddSoftSkill(newSoftSkill)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Section 9 : Langues */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-blue-600" />
          Langues parlées
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Indique les langues que tu parles et ton niveau de maîtrise.
        </p>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.languages?.map((lang, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {lang.name} ({lang.level})
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang.name)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder="Langue (ex: Français)"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <select
              value={newLanguageLevel}
              onChange={(e) => setNewLanguageLevel(e.target.value || '')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Niveau</option>
              {languageLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddLanguage}
              disabled={!newLanguage || !newLanguageLevel}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Section 10 : Centres d'intérêt */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-red-600" />
          Centres d'intérêt
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Partage tes passions pour humaniser ton profil et faciliter les connexions.
        </p>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {interestOptions.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => handleAddInterest(interest)}
                disabled={formData.interests?.includes(interest)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  formData.interests?.includes(interest)
                    ? 'bg-red-200 text-red-800 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'
                }`}
              >
                + {interest}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.interests?.map((interest, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInterest(newInterest);
                }
              }}
              placeholder="Ou ajoute un intérêt personnalisé..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
            <button
              type="button"
              onClick={() => handleAddInterest(newInterest)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Ajouter
            </button>
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
            <div className="relative">
              <input
                id="linkedin"
                type="url"
                value={formData.linkedin || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.linkedin && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, linkedin: undefined }))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub
            </label>
            <div className="relative">
              <input
                id="github"
                type="url"
                value={formData.github || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                placeholder="https://github.com/..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.github && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, github: undefined }))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
              Twitter
            </label>
            <div className="relative">
              <input
                id="twitter"
                type="url"
                value={formData.twitter || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="https://twitter.com/..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.twitter && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, twitter: undefined }))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="personalWebsite" className="block text-sm font-medium text-gray-700 mb-1">
              Site web personnel
            </label>
            <div className="relative">
              <input
                id="personalWebsite"
                type="url"
                value={formData.personalWebsite || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, personalWebsite: e.target.value }))}
                placeholder="https://mon-portfolio.com"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.personalWebsite && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, personalWebsite: undefined }))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ton portfolio, blog personnel, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Section 7 : Localisation */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Localisation
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Ville et/ou Pays
            </label>
            <LocationAutocomplete
              city={formData.city || ''}
              country={formData.country || ''}
              onChange={(city, country) => setFormData(prev => ({ ...prev, city, country }))}
              placeholder="Rechercher une ville ou un pays (ex: Paris, Dakar...)"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Saisissez une ville, un pays ou une combinaison (ex: "Paris, France")
            </p>
          </div>
        </div>
      </div>

      {/* Section 11 : Éducation */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
          Parcours académique
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Ajoute tes formations académiques après la prépa (école, diplômes, etc.).
        </p>

        <div className="space-y-4">
          {formData.education?.map((edu, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">Formation {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={edu.school}
                  onChange={(e) => handleEducationChange(index, 'school', e.target.value)}
                  placeholder="Établissement"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={edu.degree || ''}
                  onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                  placeholder="Diplôme (ex: Master Informatique)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={edu.field || ''}
                  onChange={(e) => handleEducationChange(index, 'field', e.target.value)}
                  placeholder="Domaine (ex: IA / Data)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Date début</label>
                    <input
                      type="month"
                      value={edu.startDate || ''}
                      onChange={(e) => handleEducationChange(index, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Date fin</label>
                    <input
                      type="month"
                      value={edu.endDate || ''}
                      onChange={(e) => handleEducationChange(index, 'endDate', e.target.value)}
                      disabled={edu.isCurrent}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={edu.isCurrent || false}
                    onChange={(e) => handleEducationChange(index, 'isCurrent', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">En cours</span>
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddEducation}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-purple-500 hover:text-purple-600"
          >
            + Ajouter une formation
          </button>
        </div>
      </div>

      {/* Section 12 : Expériences professionnelles */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
          Expériences professionnelles
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Décris tes expériences professionnelles passées et actuelles.
        </p>

        <div className="space-y-4">
          {formData.experiences?.map((exp, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">Expérience {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                  placeholder="Entreprise"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => handleExperienceChange(index, 'role', e.target.value)}
                  placeholder="Poste/Rôle"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Date début</label>
                    <input
                      type="month"
                      value={exp.startDate || ''}
                      onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Date fin</label>
                    <input
                      type="month"
                      value={exp.endDate || ''}
                      onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                      disabled={exp.isCurrent}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
              <textarea
                rows={2}
                value={exp.description || ''}
                onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                placeholder="Description de tes missions et réalisations..."
                className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exp.isCurrent || false}
                    onChange={(e) => handleExperienceChange(index, 'isCurrent', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Poste actuel</span>
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddExperience}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600"
          >
            + Ajouter une expérience
          </button>
        </div>
      </div>

      {/* Section 13 : Certifications */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-green-600" />
          Certifications
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Ajoute tes certifications professionnelles et formations continues.
        </p>

        <div className="space-y-4">
          {formData.certifications?.map((cert, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-md">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">Certification {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveCertification(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={cert.name}
                  onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                  placeholder="Nom de la certification"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={cert.issuer}
                  onChange={(e) => handleCertificationChange(index, 'issuer', e.target.value)}
                  placeholder="Organisme émetteur"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={cert.date}
                  onChange={(e) => handleCertificationChange(index, 'date', e.target.value)}
                  placeholder="Date d'obtention (ex: 2023)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="url"
                  value={cert.url || ''}
                  onChange={(e) => handleCertificationChange(index, 'url', e.target.value)}
                  placeholder="URL (optionnel)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCertification}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-green-500 hover:text-green-600"
          >
            + Ajouter une certification
          </button>
        </div>
      </div>

      {/* Section 14 : Confidentialité */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Eye className="w-5 h-5 mr-2 text-gray-600" />
          Paramètres de confidentialité
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choisis quelles informations afficher publiquement dans l'annuaire.
        </p>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.visibility?.showEmail ?? false}
              onChange={(e) => handleVisibilityChange('showEmail', e.target.checked)}
              className="mr-3"
            />
            <span className="text-gray-700">Afficher mon email</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.visibility?.showCity ?? true}
              onChange={(e) => handleVisibilityChange('showCity', e.target.checked)}
              className="mr-3"
            />
            <span className="text-gray-700">Afficher ma ville</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.visibility?.showCompany ?? true}
              onChange={(e) => handleVisibilityChange('showCompany', e.target.checked)}
              className="mr-3"
            />
            <span className="text-gray-700">Afficher mon entreprise</span>
          </label>
        </div>
      </div>

      {/* Section 15 : Disponibilité */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Disponibilités
          </h3>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ 
              ...prev, 
              availability: '', 
              availabilityNote: '' 
            }))}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium text-sm"
          >
            Réinitialiser
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
              Statut professionnel
            </label>
            <select
              id="availability"
              value={formData.availability || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionne un statut</option>
              <option value="Ouvert à opportunités">Ouvert à opportunités</option>
              <option value="En recherche active">En recherche active</option>
              <option value="Freelance">Freelance</option>
              <option value="Pas disponible">Pas disponible</option>
            </select>
          </div>
          <div>
            <label htmlFor="availabilityNote" className="block text-sm font-medium text-gray-700 mb-1">
              Notes de disponibilité
            </label>
            <div className="relative">
              <textarea
                id="availabilityNote"
                rows={2}
                value={formData.availabilityNote || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, availabilityNote: e.target.value }))}
                placeholder="Précise tes disponibilités, tarifs si applicable, etc."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.availabilityNote && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, availabilityNote: undefined }))}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Boutons de soumission */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate('/my-alumni-profile')}
          className="px-6 py-3 rounded-md text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-3 rounded-md text-white font-medium ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  );
};

export default AlumniProfileForm;
export type { AlumniProfileFormData };
