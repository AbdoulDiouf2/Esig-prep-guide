import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { getApprovedAlumniProfiles } from '../services/alumniService';
import AlumniCard from '../components/alumni/AlumniCard';
import type { AlumniProfile, AlumniSearchFilters } from '../types/alumni';

const AlumniDirectory: React.FC = () => {
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // États des filtres
  const [filters, setFilters] = useState<AlumniSearchFilters>({
    sectors: [],
    expertise: [],
    yearPromos: [], // Changé vers liste de promotions
    city: undefined,
    country: undefined,
    company: undefined,
    position: undefined,
    seeking: [],
    offering: [],
  });

  // Secteurs disponibles
  const availableSectors = [
    'Tech', 'Finance', 'Design', 'Marketing', 'Startup',
    'Consulting', 'Education', 'Santé', 'E-commerce', 'Entreprenariat', 'Autre'
  ];

  // Charger tous les profils une seule fois
  useEffect(() => {
    loadAllProfiles();
  }, []);

  const loadAllProfiles = async () => {
    setLoading(true);
    try {
      const data = await getApprovedAlumniProfiles('dateCreated', 1000); // Charger plus pour filtrer côté client
      setAllProfiles(data);
      setProfiles(data);
    } catch (error) {
      console.error('Erreur chargement profils:', error);
    } finally {
      setLoading(false);
    }
  };

  // État pour tous les profils (non filtrés)
  const [allProfiles, setAllProfiles] = useState<AlumniProfile[]>([]);

  // Extraire les promotions uniques et triées
  const availablePromos = React.useMemo(() => {
    const promos = [...new Set(allProfiles.map(p => p.yearPromo).filter(Boolean))];
    return promos.sort((a, b) => b - a); // Tri décroissant (plus récent d'abord)
  }, [allProfiles]);

  // Extraire les expertises uniques
  const availableExpertise = React.useMemo(() => {
    const expertise = [...new Set(allProfiles.flatMap(p => p.expertise || []))];
    return expertise.sort();
  }, [allProfiles]);

  // Extraire les entreprises uniques
  const availableCompanies = React.useMemo(() => {
    const companies = [...new Set(allProfiles.map(p => p.company).filter(Boolean))];
    return companies.sort();
  }, [allProfiles]);

  // Options pour "Je cherche / Je propose"
  const seekingOptions = [
    'Collaborateur', 'Développeur', 'Designer', 'Mentor', 'Opportunité',
    'Stage', 'Emploi', 'Recrutement', 'Partenariat', 'Investissement',
    'Expertise technique', 'Réseau'
  ];

  const offeringOptions = [
    'Mentorat', 'Collaboration', 'Conseil', 'Expertise technique',
    'Investissement', 'Partenariat', 'Recrutement', 'Opportunité',
    'Stage', 'Emploi', 'Réseau', 'Support'
  ];

  // Recherche instantanée côté client
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      setProfiles(allProfiles);
      return;
    }

    // Filtrage instantané sur tous les champs
    const filtered = allProfiles.filter(profile => {
      // Rechercher dans tous les champs texte
      return (
        profile.name?.toLowerCase().includes(query) ||
        profile.email?.toLowerCase().includes(query) ||
        profile.bio?.toLowerCase().includes(query) ||
        profile.headline?.toLowerCase().includes(query) ||
        profile.position?.toLowerCase().includes(query) ||
        profile.company?.toLowerCase().includes(query) ||
        profile.city?.toLowerCase().includes(query) ||
        profile.country?.toLowerCase().includes(query) ||
        profile.sectors?.some(sector => sector.toLowerCase().includes(query)) ||
        profile.expertise?.some(exp => exp.toLowerCase().includes(query))
      );
    });

    setProfiles(filtered);
  }, [searchQuery, allProfiles]);

  // Appliquer les filtres côté client
  const handleApplyFilters = () => {
    let filtered = [...allProfiles];
    
    // Filtrer par secteurs
    if (filters.sectors && filters.sectors.length > 0) {
      filtered = filtered.filter(profile => 
        profile.sectors?.some(sector => filters.sectors!.includes(sector))
      );
    }
    
    // Filtrer par expertise
    if (filters.expertise && filters.expertise.length > 0) {
      filtered = filtered.filter(profile => 
        profile.expertise?.some(exp => filters.expertise!.includes(exp))
      );
    }
    
    // Filtrer par promotions
    if (filters.yearPromos && filters.yearPromos.length > 0) {
      filtered = filtered.filter(profile => 
        filters.yearPromos!.includes(profile.yearPromo)
      );
    }
    
    // Filtrer par ville
    if (filters.city) {
      filtered = filtered.filter(profile => 
        profile.city?.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    
    // Filtrer par pays
    if (filters.country) {
      filtered = filtered.filter(profile => 
        profile.country?.toLowerCase().includes(filters.country!.toLowerCase())
      );
    }
    
    // Filtrer par entreprise
    if (filters.company) {
      filtered = filtered.filter(profile => 
        profile.company === filters.company
      );
    }
    
    // Filtrer par poste
    if (filters.position) {
      filtered = filtered.filter(profile => 
        profile.position?.toLowerCase().includes(filters.position!.toLowerCase())
      );
    }
    
    // Filtrer par "je cherche"
    if (filters.seeking && filters.seeking.length > 0) {
      filtered = filtered.filter(profile => 
        profile.seeking?.some(item => filters.seeking!.includes(item))
      );
    }
    
    // Filtrer par "je propose"
    if (filters.offering && filters.offering.length > 0) {
      filtered = filtered.filter(profile => 
        profile.offering?.some(item => filters.offering!.includes(item))
      );
    }
    
    setProfiles(filtered);
    setShowFilters(false);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setFilters({
      sectors: [],
      expertise: [],
      yearPromos: [],
      city: undefined,
      country: undefined,
      seeking: [],
      offering: [],
    });
    setSearchQuery('');
    setProfiles(allProfiles);
  };

  // Fonctions pour gérer les filtres
  const toggleSector = (sector: string) => {
    setFilters(prev => ({
      ...prev,
      sectors: prev.sectors?.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...(prev.sectors || []), sector]
    }));
  };

  const toggleExpertise = (exp: string) => {
    setFilters(prev => ({
      ...prev,
      expertise: prev.expertise?.includes(exp)
        ? prev.expertise.filter(e => e !== exp)
        : [...(prev.expertise || []), exp]
    }));
  };

  const toggleSeeking = (item: string) => {
    setFilters(prev => ({
      ...prev,
      seeking: prev.seeking?.includes(item)
        ? prev.seeking.filter(s => s !== item)
        : [...(prev.seeking || []), item]
    }));
  };

  const toggleOffering = (item: string) => {
    setFilters(prev => ({
      ...prev,
      offering: prev.offering?.includes(item)
        ? prev.offering.filter(o => o !== item)
        : [...(prev.offering || []), item]
    }));
  };

  const activeFiltersCount = 
    (filters.sectors?.length || 0) + 
    (filters.expertise?.length || 0) +
    (filters.yearPromos?.length || 0) +
    (filters.city ? 1 : 0) +
    (filters.country ? 1 : 0) +
    (filters.seeking?.length || 0) +
    (filters.offering?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Annuaire Alumni
          </h1>
          <p className="mt-2 text-lg text-gray-700">
            Trouve en 2 clics des alumni par secteur, pays, promo ou type d'aide (je cherche / je propose)
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Découvrez et connectez-vous avec les alumni de la communauté CPS Connect
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche instantanée */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher instantanément par nom, bio, expertise, entreprise..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Bouton filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 relative"
            >
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Panel de filtres */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Secteurs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteurs
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSectors.map(sector => (
                      <button
                        key={sector}
                        onClick={() => toggleSector(sector)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          filters.sectors?.includes(sector)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {sector}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Année de promo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promotions
                  </label>
                  <div className="relative">
                    <select
                      multiple
                      value={filters.yearPromos?.map(String) || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                        setFilters(prev => ({ ...prev, yearPromos: selected }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      size={4}
                    >
                      {availablePromos.map(promo => (
                        <option key={promo} value={promo}>
                          Promo {promo}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Maintenez Ctrl/Cmd pour sélection multiple
                    </p>
                  </div>
                </div>

                {/* Localisation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localisation
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={filters.city || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value || undefined }))}
                      placeholder="Ville"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={filters.country || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value || undefined }))}
                      placeholder="Pays"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Expertise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expertise
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availableExpertise.map(exp => (
                      <button
                        key={exp}
                        onClick={() => toggleExpertise(exp)}
                        className={`px-2 py-1 rounded-full text-xs ${
                          filters.expertise?.includes(exp)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entreprise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entreprise
                  </label>
                  <select
                    value={filters.company || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Toutes les entreprises</option>
                    {availableCompanies.map(company => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Poste */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poste
                  </label>
                  <input
                    type="text"
                    value={filters.position || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value || undefined }))}
                    placeholder="Ex: Développeur, Manager..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Je cherche */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Je cherche
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {seekingOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => toggleSeeking(option)}
                        className={`px-2 py-1 rounded-full text-xs ${
                          filters.seeking?.includes(option)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Je propose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Je propose
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {offeringOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => toggleOffering(option)}
                        className={`px-2 py-1 rounded-full text-xs ${
                          filters.offering?.includes(option)
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Appliquer les filtres
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Résultats */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            {loading ? 'Chargement...' : `${profiles.length} profil${profiles.length > 1 ? 's' : ''} trouvé${profiles.length > 1 ? 's' : ''}`}
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
              Effacer les filtres
            </button>
          )}
        </div>

        {/* Grille de profils */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun profil trouvé</p>
            <p className="text-gray-400 text-sm mt-2">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(profile => (
              <AlumniCard key={profile.uid} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniDirectory;
