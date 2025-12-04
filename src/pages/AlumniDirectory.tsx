import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { getApprovedAlumniProfiles, searchAlumni } from '../services/alumniService';
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
    yearPromoMin: 2010,
    yearPromoMax: new Date().getFullYear() + 5,
    city: undefined,
    country: undefined,
  });

  // Secteurs disponibles
  const availableSectors = [
    'Tech', 'Finance', 'Design', 'Marketing', 'Startup',
    'Consulting', 'Education', 'Santé', 'E-commerce', 'Autre'
  ];

  // Charger les profils
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await getApprovedAlumniProfiles('dateCreated', 50);
      setProfiles(data);
    } catch (error) {
      console.error('Erreur chargement profils:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recherche
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProfiles();
      return;
    }

    setLoading(true);
    try {
      // La recherche se fait sur tous les champs texte
      const results = await searchAlumni(filters, 'dateCreated', 50);
      setProfiles(results);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Appliquer les filtres
  const handleApplyFilters = async () => {
    setLoading(true);
    try {
      const results = await searchAlumni(filters, 'dateCreated', 50);
      setProfiles(results);
      setShowFilters(false);
    } catch (error) {
      console.error('Erreur filtrage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setFilters({
      sectors: [],
      expertise: [],
      yearPromoMin: 2010,
      yearPromoMax: new Date().getFullYear() + 5,
      city: undefined,
      country: undefined,
    });
    setSearchQuery('');
    loadProfiles();
  };

  // Toggle secteur
  const toggleSector = (sector: string) => {
    setFilters(prev => ({
      ...prev,
      sectors: prev.sectors?.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...(prev.sectors || []), sector]
    }));
  };

  const activeFiltersCount = 
    (filters.sectors?.length || 0) + 
    (filters.expertise?.length || 0) +
    (filters.city ? 1 : 0) +
    (filters.country ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Annuaire Alumni
          </h1>
          <p className="mt-2 text-gray-600">
            Découvrez et connectez-vous avec les alumni de la communauté ESIG
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Rechercher par nom, bio, expertise, entreprise..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Rechercher
              </button>
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
                    Année de promotion
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={filters.yearPromoMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, yearPromoMin: parseInt(e.target.value) }))}
                      min="2000"
                      max={new Date().getFullYear() + 10}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">à</span>
                    <input
                      type="number"
                      value={filters.yearPromoMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, yearPromoMax: parseInt(e.target.value) }))}
                      min="2000"
                      max={new Date().getFullYear() + 10}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
