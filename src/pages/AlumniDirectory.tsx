import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Briefcase, Calendar, MapPin, Globe, Users } from 'lucide-react';
import { getApprovedAlumniProfiles } from '../services/alumniService';
import AlumniCard from '../components/alumni/AlumniCard';
import FilterModal, { AlumniFilters } from '../components/alumni/FilterModal';
import type { AlumniProfile, AlumniSearchFilters } from '../types/alumni';

const AlumniDirectory: React.FC = () => {
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
    // Nouveaux filtres enrichis
    softSkills: [],
    languages: [],
    availability: undefined,
  });

  // Secteurs disponibles
  const availableSectors = [
    'Tech', 'Finance', 'Design', 'Marketing', 'Startup',
    'Consulting', 'Education', 'Santé', 'E-commerce', 'Entreprenariat', 'Autre'
  ];

  // État pour tous les profils (non filtrés)
  const [allProfiles, setAllProfiles] = useState<AlumniProfile[]>([]);

  // Options pour les nouveaux filtres enrichis
  const availableSoftSkills = [
    'Communication', 'Leadership', 'Gestion d\'équipe', 'Résolution de problèmes',
    'Créativité', 'Adaptabilité', 'Travail d\'équipe', 'Gestion du temps',
    'Esprit critique', 'Intelligence émotionnelle', 'Prise de décision', 'Négociation'
  ];

  // Extraire les années de promotion uniques et triées
  const availableYears = React.useMemo(() => {
    const years = [...new Set(allProfiles.map(p => p.yearPromo).filter(year => year !== undefined))];
    return years.sort((a, b) => b - a); // Tri décroissant (plus récent d'abord)
  }, [allProfiles]);

  // Extraire les villes uniques et triées
  const availableCities = React.useMemo(() => {
    const cities = [...new Set(allProfiles.map(p => p.city).filter((city): city is string => 
      city !== undefined
    ))];
    return cities.sort();
  }, [allProfiles]);

  // Extraire les pays uniques et triés
  const availableCountries = React.useMemo(() => {
    const countries = [...new Set(allProfiles.map(p => p.country).filter((country): country is string => 
      country !== undefined
    ))];
    return countries.sort();
  }, [allProfiles]);

  // Charger tous les profils une seule fois
  useEffect(() => {
    loadAllProfiles();
  }, []);

  const loadAllProfiles = async () => {
    setLoading(true);
    try {
      const data = await getApprovedAlumniProfiles('dateCreated', 1000); // Charger plus pour filtrer côté client
      // Trier par ordre alphabétique
      const sortedData = data.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase(), 'fr'));
      setAllProfiles(sortedData);
      setProfiles(sortedData);
    } catch (error) {
      console.error('Erreur chargement profils:', error);
    } finally {
      setLoading(false);
    }
  };

  // // Extraire les promotions uniques et triées
  // const availablePromos = React.useMemo(() => {
  //   const promos = [...new Set(allProfiles.map(p => p.yearPromo).filter(Boolean))];
  //   return promos.sort((a, b) => b - a); // Tri décroissant (plus récent d'abord)
  // }, [allProfiles]);

  // // Extraire les expertises uniques
  // const availableExpertise = React.useMemo(() => {
  //   const expertise = [...new Set(allProfiles.flatMap(p => p.expertise || []))];
  //   return expertise.sort();
  // }, [allProfiles]);

  // // Extraire les entreprises uniques
  // const availableCompanies = React.useMemo(() => {
  //   const companies = [...new Set(allProfiles.map(p => p.company).filter(Boolean))];
  //   return companies.sort();
  // }, [allProfiles]);

  // // Options pour "Je cherche / Je propose"
  // const seekingOptions = [
  //   'Collaborateur', 'Développeur', 'Designer', 'Mentor', 'Opportunité',
  //   'Stage', 'Emploi', 'Recrutement', 'Partenariat', 'Investissement',
  //   'Expertise technique', 'Réseau'
  // ];

  // const offeringOptions = [
  //   'Mentorat', 'Collaboration', 'Conseil', 'Expertise technique',
  //   'Investissement', 'Partenariat', 'Recrutement', 'Opportunité',
  //   'Stage', 'Emploi', 'Réseau', 'Support'
  // ];

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
        profile.city?.toLowerCase().split(',').map(v => v.trim()).some(v => v.toLowerCase().includes(query)) ||
        profile.country?.toLowerCase().split(',').map(c => c.trim()).some(c => c.toLowerCase().includes(query)) ||
        profile.sectors?.some(sector => sector.toLowerCase().includes(query)) ||
        profile.expertise?.some(exp => exp.toLowerCase().includes(query)) ||
        // Ajout des nouveaux champs
        profile.seeking?.some(item => item.toLowerCase().includes(query)) ||
        profile.offering?.some(item => item.toLowerCase().includes(query)) ||
        profile.softSkills?.some(skill => skill.toLowerCase().includes(query)) ||
        profile.languages?.some(lang => lang.name.toLowerCase().includes(query)) ||
        profile.availability?.toLowerCase().includes(query) ||
        // Ajout des autres champs
        profile.companyDescription?.toLowerCase().includes(query) ||
        profile.companyWebsite?.toLowerCase().includes(query) ||
        profile.personalWebsite?.toLowerCase().includes(query)
      );
    });

    // Maintenir le tri alphabétique après filtrage
    const sortedFiltered = filtered.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase(), 'fr'));
    setProfiles(sortedFiltered);
  }, [searchQuery, allProfiles]);

  // Gestion du modal de filtres
  const handleApplyFiltersModal = (newFilters: AlumniFilters) => {
    // console.log('Filtres reçus du modal:', newFilters);
    
    // Convertir AlumniFilters vers AlumniSearchFilters
    const convertedFilters: AlumniSearchFilters = {
      sectors: newFilters.sectors || [],
      expertise: newFilters.expertise || [],
      yearPromos: newFilters.singleYear 
        ? [newFilters.singleYear] 
        : (newFilters.yearPromo.min > 0 && newFilters.yearPromo.max > 0)
        ? Array.from({ length: newFilters.yearPromo.max - newFilters.yearPromo.min + 1 }, (_, i) => newFilters.yearPromo.min + i)
        : [], // Plage vide si min = 0 ou max = 0
      city: newFilters.city || undefined,
      country: newFilters.country || undefined,
      company: undefined,
      position: undefined,
      seeking: newFilters.seeking || [],
      offering: newFilters.offering || [],
      softSkills: newFilters.softSkills || [],
      languages: newFilters.languages || [],
      availability: newFilters.availability ? 'Disponible' : undefined,
    };
    
    // console.log('Filtres convertis:', convertedFilters);
    // console.log('Nombre de profils avant filtrage:', allProfiles.length);
    
    setFilters(convertedFilters);
    applyFilters(convertedFilters);
  };

  const handleResetFiltersModal = () => {
    const resetFilters: AlumniSearchFilters = {
      sectors: [],
      expertise: [],
      yearPromos: [],
      city: undefined,
      country: undefined,
      company: undefined,
      position: undefined,
      seeking: [],
      offering: [],
      softSkills: [],
      languages: [],
      availability: undefined,
    };
    setFilters(resetFilters);
    setProfiles(allProfiles);
  };

  // Appliquer les filtres côté client
  const applyFilters = (filtersToApply: AlumniSearchFilters) => {
    // console.log('applyFilters appelé avec:', filtersToApply);
    let filtered = [...allProfiles];
    
    // Filtrer par secteurs
    if (filtersToApply.sectors && filtersToApply.sectors.length > 0) {
      filtered = filtered.filter(profile => 
        profile.sectors?.some(sector => filtersToApply.sectors!.includes(sector))
      );
    }
    
    // Filtrer par expertise
    if (filtersToApply.expertise && filtersToApply.expertise.length > 0) {
      filtered = filtered.filter(profile => 
        profile.expertise?.some(exp => filtersToApply.expertise!.includes(exp))
      );
    }
    
    // Filtrer par promotions - CORRIGÉ
    if (filtersToApply.yearPromos && filtersToApply.yearPromos.length > 0) {
      // console.log('Filtrage par années:', filtersToApply.yearPromos);
      filtered = filtered.filter(profile => {
        const matches = filtersToApply.yearPromos!.includes(profile.yearPromo);
        // console.log(`Profile ${profile.name} (${profile.yearPromo}) matches:`, matches);
        return matches;
      });
      // console.log('Résultats après filtrage année:', filtered.length);
    }
    
    // Filtrer par ville
    if (filtersToApply.city) {
      const filterCities = filtersToApply.city.toLowerCase().split(',').map(v => v.trim());
      filtered = filtered.filter(profile => 
        profile.city?.toLowerCase().split(',').map(v => v.trim()).some(city => 
          filterCities.includes(city.toLowerCase())
        )
      );
    }
    
    // Filtrer par pays
    if (filtersToApply.country) {
      const filterCountries = filtersToApply.country.toLowerCase().split(',').map(c => c.trim());
      filtered = filtered.filter(profile => 
        profile.country?.toLowerCase().split(',').map(c => c.trim()).some(country => 
          filterCountries.includes(country.toLowerCase())
        )
      );
    }
    
    // Filtrer par entreprise
    if (filtersToApply.company) {
      filtered = filtered.filter(profile => 
        profile.company === filtersToApply.company
      );
    }
    
    // Filtrer par poste
    if (filtersToApply.position) {
      filtered = filtered.filter(profile => 
        profile.position?.toLowerCase().includes(filtersToApply.position!.toLowerCase())
      );
    }
    
    // Filtrer par "je cherche"
    if (filtersToApply.seeking && filtersToApply.seeking.length > 0) {
      filtered = filtered.filter(profile => 
        profile.seeking?.some(item => filtersToApply.seeking!.includes(item))
      );
    }
    
    // Filtrer par "je propose"
    if (filtersToApply.offering && filtersToApply.offering.length > 0) {
      filtered = filtered.filter(profile => 
        profile.offering?.some(item => filtersToApply.offering!.includes(item))
      );
    }
    
    // Filtrer par soft skills
    if (filtersToApply.softSkills && filtersToApply.softSkills.length > 0) {
      filtered = filtered.filter(profile => 
        profile.softSkills?.some(skill => filtersToApply.softSkills!.includes(skill))
      );
    }
    
    // Filtrer par langues
    if (filtersToApply.languages && filtersToApply.languages.length > 0) {
      filtered = filtered.filter(profile => 
        profile.languages?.some(lang => filtersToApply.languages!.includes(lang.name))
      );
    }
    
    // Filtrer par disponibilité
    if (filtersToApply.availability) {
      filtered = filtered.filter(profile => 
        profile.availability === filtersToApply.availability
      );
    }
    
    // Maintenir le tri alphabétique après application des filtres
    const sortedFiltered = filtered.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase(), 'fr'));
    setProfiles(sortedFiltered);
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
      // Nouveaux filtres enrichis
      softSkills: [],
      languages: [],
      availability: undefined,
    });
    setSearchQuery('');
    setProfiles(allProfiles);
  };

  // // Fonctions pour gérer les filtres
  // const toggleSector = (sector: string) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     sectors: prev.sectors?.includes(sector)
  //       ? prev.sectors.filter(s => s !== sector)
  //       : [...(prev.sectors || []), sector]
  //   }));
  // };

  // const toggleExpertise = (exp: string) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     expertise: prev.expertise?.includes(exp)
  //       ? prev.expertise.filter(e => e !== exp)
  //       : [...(prev.expertise || []), exp]
  //   }));
  // };

  // const toggleSeeking = (item: string) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     seeking: prev.seeking?.includes(item)
  //       ? prev.seeking.filter(s => s !== item)
  //       : [...(prev.seeking || []), item]
  //   }));
  // };

  // const toggleOffering = (item: string) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     offering: prev.offering?.includes(item)
  //       ? prev.offering.filter(o => o !== item)
  //       : [...(prev.offering || []), item]
  //   }));
  // };

  // // Fonctions pour les nouveaux filtres enrichis
  // const toggleSoftSkill = (skill: string) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     softSkills: prev.softSkills?.includes(skill)
  //       ? prev.softSkills.filter(s => s !== skill)
  //       : [...(prev.softSkills || []), skill]
  //   }));
  // };

  // const toggleLanguage = (language: string) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     languages: prev.languages?.includes(language)
  //       ? prev.languages.filter(l => l !== language)
  //       : [...(prev.languages || []), language]
  //   }));
  // };

  // const setAvailability = (availability: string | undefined) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     availability: availability
  //   }));
  // };

  const activeFiltersCount = 
    (filters.sectors?.length || 0) + 
    (filters.expertise?.length || 0) +
    (filters.yearPromos && filters.yearPromos.length > 0 ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.country ? 1 : 0) +
    (filters.seeking?.length || 0) +
    (filters.offering?.length || 0) +
    // Nouveaux filtres enrichis
    (filters.softSkills?.length || 0) +
    (filters.languages?.length || 0) +
    (filters.availability ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0 || searchQuery.trim() !== '';

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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche instantanée */}
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher instantanément par nom, bio, expertise, entreprise..."
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Bouton filtres */}
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all relative group"
            >
              <Filter className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-gray-700">Filtres</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filtres actifs */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.sectors && filters.sectors.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      <Briefcase className="w-3 h-3" />
                      {filters.sectors.length} secteur{filters.sectors.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {filters.yearPromos && filters.yearPromos.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      <Calendar className="w-3 h-3" />
                      {filters.yearPromos.length === 1 
                        ? filters.yearPromos[0] 
                        : `${Math.min(...filters.yearPromos)}-${Math.max(...filters.yearPromos)}`
                      }
                    </span>
                  )}
                  {filters.city && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      <MapPin className="w-3 h-3" />
                      {filters.city}
                    </span>
                  )}
                  {filters.country && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <Globe className="w-3 h-3" />
                      {filters.country}
                    </span>
                  )}
                  {filters.availability && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                      <Users className="w-3 h-3" />
                      Disponible
                    </span>
                  )}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                      <Search className="w-3 h-3" />
                      "{searchQuery.substring(0, 20)}{searchQuery.length > 20 ? '...' : ''}"
                    </span>
                  )}
                </div>
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Effacer tout
                </button>
              </div>
            </div>
          )}

          {/* Modal de filtres */}
          <FilterModal
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            onApplyFilters={handleApplyFiltersModal}
            onResetFilters={handleResetFiltersModal}
            initialFilters={{
              search: searchQuery,
              sectors: filters.sectors || [],
              expertise: filters.expertise || [],
              yearPromo: filters.yearPromos && filters.yearPromos.length > 1 
                ? { min: Math.min(...filters.yearPromos), max: Math.max(...filters.yearPromos) }
                : filters.yearPromos && filters.yearPromos.length === 1
                ? { min: filters.yearPromos[0], max: filters.yearPromos[0] }
                : { min: 0, max: 0 }, // Plage vide par défaut
              singleYear: filters.yearPromos && filters.yearPromos.length === 1 ? filters.yearPromos[0] : undefined,
              country: filters.country || '',
              city: filters.city || '',
              availability: !!filters.availability,
              seeking: filters.seeking || [],
              offering: filters.offering || [],
              softSkills: filters.softSkills || [],
              languages: filters.languages || [],
            }}
            availableSectors={availableSectors}
            availableExpertise={availableSoftSkills}
            availableCountries={availableCountries}
            availableCities={availableCities}
            availableYears={availableYears}
          />
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
            <p className="text-gray-500 text-lg">
              {hasActiveFilters ? 'Aucun résultat pour vos filtres' : 'Aucun profil trouvé'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {hasActiveFilters 
                ? 'Essayez d\'élargir vos critères ou d\'effacer les filtres'
                : 'Aucun alumni n\'est encore inscrit sur la plateforme'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Effacer tous les filtres
              </button>
            )}
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
