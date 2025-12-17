import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader } from 'lucide-react';

interface LocationResult {
  properties: {
    name: string;
    city?: string;
    country?: string;
    state?: string;
    postcode?: string;
    osm_type?: string;
    osm_id?: number;
    type?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface LocationAutocompleteProps {
  city: string;
  country: string;
  onChange: (city: string, country: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  city,
  country,
  onChange,
  placeholder = "Rechercher une ville ou un pays...",
  className = "",
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Construire la valeur affichée
  const displayValue = city && country ? `${city}, ${country}` : city || country || '';

  // Fonction pour rechercher via l'API Photon
  const searchLocations = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=fr`
      );
      
      if (!response.ok) {
        throw new Error('Erreur de recherche');
      }
      
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Erreur lors de la recherche de localisation:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de l'input avec débounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Si l'utilisateur tape manuellement, on met tout dans city pour l'instant
    onChange(newValue, '');
    
    // Annuler le timeout précédent
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Nouveau timeout pour éviter trop de requêtes
    const timeout = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // Sélectionner une suggestion
  const handleSelectSuggestion = (suggestion: LocationResult) => {
    const props = suggestion.properties;
    let city = '';
    let country = '';
    
    // Extraire la ville et le pays
    if (props.city) {
      city = props.city;
    } else if (props.name && !props.country) {
      // Si c'est un nom sans pays, c'est probablement une ville
      city = props.name;
    } else {
      city = props.name || '';
    }
    
    country = props.country || '';
    
    onChange(city, country);
    setSuggestions([]);
    setIsOpen(false);
  };

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Nettoyer le timeout
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Loader className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 text-gray-400" />
          )}
        </div>
        {displayValue && (
          <button
            type="button"
            onClick={() => {
              onChange('', '');
              setSuggestions([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown des suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => {
            const props = suggestion.properties;
            let displayName = props.name;
            let subtitle = '';
            
            // Construire l'affichage
            if (props.city && props.city !== props.name) {
              displayName = props.city;
              subtitle = `${props.name}, ${props.country}`;
            } else if (props.country && props.country !== props.name) {
              subtitle = props.country;
            }
            
            if (props.state) {
              subtitle = subtitle ? `${subtitle}, ${props.state}` : props.state;
            }

            return (
              <button
                key={`${props.osm_type}-${props.osm_id}-${index}`}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {displayName}
                    </div>
                    {subtitle && (
                      <div className="text-sm text-gray-500 truncate">
                        {subtitle}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
