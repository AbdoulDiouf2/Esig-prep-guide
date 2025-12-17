import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
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

  // Options pour les nouveaux filtres enrichis
  const availableSoftSkills = [
    'Communication', 'Leadership', 'Gestion d\'équipe', 'Résolution de problèmes',
    'Créativité', 'Adaptabilité', 'Travail d\'équipe', 'Gestion du temps',
    'Esprit critique', 'Intelligence émotionnelle', 'Prise de décision', 'Négociation'
  ];

  // const availableLanguages = [
  //   'Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Portugais',
  //   'Néerlandais', 'Chinois', 'Japonais', 'Arabe', 'Russe', 'Coréen', 'Turc'
  // ];

  // const availabilityOptions = [
  //   'Disponible', 'Freelance', 'Ouvert à opportunités', 'Non disponible', 'Contactez-moi'
  // ];

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

  // État pour tous les profils (non filtrés)
  const [allProfiles, setAllProfiles] = useState<AlumniProfile[]>([]);

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
        profile.city?.toLowerCase().includes(query) ||
        profile.country?.toLowerCase().includes(query) ||
        profile.sectors?.some(sector => sector.toLowerCase().includes(query)) ||
        profile.expertise?.some(exp => exp.toLowerCase().includes(query))
      );
    });

    // Maintenir le tri alphabétique après filtrage
    const sortedFiltered = filtered.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase(), 'fr'));
    setProfiles(sortedFiltered);
  }, [searchQuery, allProfiles]);

  // Gestion du modal de filtres
  const handleApplyFiltersModal = (newFilters: AlumniFilters) => {
    // Convertir AlumniFilters vers AlumniSearchFilters
    const convertedFilters: AlumniSearchFilters = {
      sectors: newFilters.sectors || [],
      expertise: newFilters.expertise || [],
      yearPromos: [], // Convertir yearPromo en tableau si nécessaire
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
    (filters.yearPromos?.length || 0) +
    (filters.city ? 1 : 0) +
    (filters.country ? 1 : 0) +
    (filters.seeking?.length || 0) +
    (filters.offering?.length || 0) +
    // Nouveaux filtres enrichis
    (filters.softSkills?.length || 0) +
    (filters.languages?.length || 0) +
    (filters.availability ? 1 : 0);

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
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Bouton filtres */}
            <button
              onClick={() => setShowFilters(true)}
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
              yearPromo: { min: 2020, max: 2030 },
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
            availableCountries={['France', 'Canada', 'USA', 'UK', 'Allemagne', 'Suisse', 'Belgique', 'Luxembourg', 'Italie']}
            availableCities={['Paris', 'Lyon', 'Marseille', 'Lille', 'Bordeaux', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Rome']}
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
