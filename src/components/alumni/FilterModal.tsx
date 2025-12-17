import React from 'react';
import Modal from '../common/Modal';
import { Briefcase, Award, Search, Calendar, MapPin, Users } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AlumniFilters) => void;
  onResetFilters: () => void;
  initialFilters: AlumniFilters;
  availableSectors: string[];
  availableExpertise: string[];
  availableCountries: string[];
  availableCities: string[];
  availableYears?: number[]; // Ajout des années disponibles
}

export interface AlumniFilters {
  search: string;
  sectors: string[];
  expertise: string[];
  yearPromo: { min: number; max: number };
  singleYear?: number; // Nouveau champ pour année unique
  country: string;
  city: string;
  availability: boolean;
  seeking: string[];
  offering: string[];
  softSkills: string[];
  languages: string[];
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  onResetFilters,
  initialFilters,
  availableSectors,
  availableExpertise,
  availableCountries,
  availableCities,
  availableYears
}) => {
  const [filters, setFilters] = React.useState<AlumniFilters>(initialFilters);

  React.useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleSectorToggle = (sector: string) => {
    setFilters(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector]
    }));
  };

  const handleExpertiseToggle = (expertise: string) => {
    setFilters(prev => ({
      ...prev,
      expertise: prev.expertise.includes(expertise)
        ? prev.expertise.filter(e => e !== expertise)
        : [...prev.expertise, expertise]
    }));
  };

  const handleYearRangeChange = (type: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      yearPromo: {
        ...prev.yearPromo,
        [type]: value
      },
      singleYear: undefined // Réinitialiser l'année unique quand on modifie la plage
    }));
  };

  const handleSingleYearChange = (year: number | undefined) => {
    setFilters(prev => ({ 
      ...prev, 
      singleYear: year,
      yearPromo: year ? { min: year, max: year } : { min: 0, max: 0 } // Plage vide si pas d'année unique
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: AlumniFilters = {
      search: '',
      sectors: [],
      expertise: [],
      yearPromo: { min: 0, max: 0 }, // Plage vide par défaut
      singleYear: undefined, // Réinitialiser l'année unique
      country: '',
      city: '',
      availability: false,
      seeking: [],
      offering: [],
      softSkills: [],
      languages: []
    };
    setFilters(resetFilters);
    onResetFilters();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtres avancés" size="xl">
      <div className="space-y-6">
        {/* Secteurs */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Secteurs d'activité
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableSectors.map(sector => (
              <label key={sector} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={filters.sectors.includes(sector)}
                  onChange={() => handleSectorToggle(sector)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm text-gray-700 font-medium">{sector}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Expertise */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Compétences techniques
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableExpertise.map(exp => (
              <label key={exp} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={filters.expertise.includes(exp)}
                  onChange={() => handleExpertiseToggle(exp)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
                />
                <span className="text-sm text-gray-700 font-medium">{exp}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Je cherche / Je propose */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            Je cherche / Je propose
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Je cherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Je cherche</label>
              <div className="space-y-2">
                {['Collaborateur', 'Développeur', 'Designer', 'Mentor', 'Opportunité', 'Stage', 'Emploi', 'Recrutement', 'Partenariat', 'Investissement', 'Expertise technique', 'Réseau'].map(item => (
                  <label key={item} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.seeking?.includes(item)}
                      onChange={() => {
                        setFilters(prev => ({
                          ...prev,
                          seeking: prev.seeking?.includes(item)
                            ? prev.seeking.filter(s => s !== item)
                            : [...(prev.seeking || []), item]
                        }));
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Je propose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Je propose</label>
              <div className="space-y-2">
                {['Mentorat', 'Collaboration', 'Conseil', 'Expertise technique', 'Investissement', 'Partenariat', 'Recrutement', 'Opportunité', 'Stage', 'Emploi', 'Réseau', 'Support'].map(item => (
                  <label key={item} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.offering?.includes(item)}
                      onChange={() => {
                        setFilters(prev => ({
                          ...prev,
                          offering: prev.offering?.includes(item)
                            ? prev.offering.filter(o => o !== item)
                            : [...(prev.offering || []), item]
                        }));
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Année de promotion */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Année de promotion
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plage d'années */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plage d'années</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={filters.yearPromo.min}
                    onChange={(e) => handleYearRangeChange('min', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={!!filters.singleYear}
                  />
                </div>
                <span className="text-gray-500 font-medium">—</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={filters.yearPromo.max}
                    onChange={(e) => handleYearRangeChange('max', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={!!filters.singleYear}
                  />
                </div>
              </div>
            </div>
            
            {/* Année unique */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ou année unique</label>
              <select
                value={filters.singleYear || ''}
                onChange={(e) => {
                  const year = e.target.value ? parseInt(e.target.value) : undefined;
                  handleSingleYearChange(year);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sélectionner une année</option>
                {availableYears?.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Localisation */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            Localisation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
              <select
                value={filters.country}
                onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tous les pays</option>
                {availableCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
              <select
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Toutes les villes</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Disponibilité */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Disponibilité
          </h3>
          <label className="flex items-center space-x-3 cursor-pointer hover:bg-white p-3 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={filters.availability}
              onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.checked }))}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
            />
            <span className="text-sm text-gray-700 font-medium">Uniquement les alumni disponibles</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 bg-gray-50 rounded-b-lg px-6 pb-6 -mx-4">
          <button
            onClick={handleReset}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-semibold bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105"
          >
            Réinitialiser tout
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:text-gray-900 font-semibold bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105"
            >
              Annuler
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FilterModal;
