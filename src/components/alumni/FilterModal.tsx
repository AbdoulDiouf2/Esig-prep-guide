import React from 'react';
import Modal from '../common/Modal';

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
}

export interface AlumniFilters {
  search: string;
  sectors: string[];
  expertise: string[];
  yearPromo: { min: number; max: number };
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
  availableCities
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
      }
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
      yearPromo: { min: 2020, max: 2030 },
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
    <Modal isOpen={isOpen} onClose={onClose} title="Filtres avancés" size="lg">
      <div className="space-y-6">
        {/* Secteurs */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Secteurs</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableSectors.map(sector => (
              <label key={sector} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.sectors.includes(sector)}
                  onChange={() => handleSectorToggle(sector)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{sector}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Expertise */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Expertise</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableExpertise.map(exp => (
              <label key={exp} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.expertise.includes(exp)}
                  onChange={() => handleExpertiseToggle(exp)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{exp}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Année de promotion */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Année de promotion</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min</label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={filters.yearPromo.min}
                onChange={(e) => handleYearRangeChange('min', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center text-gray-500">—</div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Max</label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={filters.yearPromo.max}
                onChange={(e) => handleYearRangeChange('max', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Localisation */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Localisation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
              <select
                value={filters.country}
                onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les pays</option>
                {availableCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <select
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.availability}
              onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Uniquement les alumni disponibles</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Réinitialiser
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
