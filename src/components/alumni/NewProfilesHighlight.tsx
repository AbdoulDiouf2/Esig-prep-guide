import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, MapPin, Briefcase } from 'lucide-react';
import { AlumniProfile } from '../../types/alumni';
import { getApprovedAlumniProfiles } from '../../services/alumniService';

/**
 * Composant pour mettre en avant les derniers profils alumni approuvés
 * Affiche les 3 derniers profils dans un bandeau attractif
 */
const NewProfilesHighlight: React.FC = () => {
  const [newProfiles, setNewProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewProfiles = async () => {
      try {
        // Récupérer les 3 derniers profils approuvés (triés par date de création)
        const profiles = await getApprovedAlumniProfiles('dateCreated', 3);
        setNewProfiles(profiles);
      } catch (error) {
        console.error('Erreur lors du chargement des nouveaux profils:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewProfiles();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  if (newProfiles.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border border-purple-100">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Nouveaux profils publiés
          </h2>
        </div>
        <span className="text-sm text-purple-600 font-medium">
          {newProfiles.length} nouveau{newProfiles.length > 1 ? 'x' : ''}
        </span>
      </div>

      {/* Grille des profils */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {newProfiles.map((profile) => (
          <Link
            key={profile.uid}
            to={`/alumni/${profile.uid}`}
            className="bg-white rounded-lg p-4 hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-purple-300 group"
          >
            <div className="flex items-start space-x-3">
              {/* Photo */}
              <div className="flex-shrink-0">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg border-2 border-purple-200">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                  {profile.name}
                </h3>
                
                {profile.headline && (
                  <p className="text-sm text-gray-600 line-clamp-1 mb-1">
                    {profile.headline}
                  </p>
                )}

                {profile.company && (
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <Briefcase className="w-3 h-3 mr-1" />
                    <span className="truncate">{profile.company}</span>
                  </div>
                )}

                {(profile.city || profile.country) && (
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">
                      {[profile.city, profile.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {/* Secteurs (badges) */}
                {profile.sectors && profile.sectors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.sectors.slice(0, 2).map((sector, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                      >
                        {sector}
                      </span>
                    ))}
                    {profile.sectors.length > 2 && (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{profile.sectors.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bouton "Découvrir tous les profils" */}
      <div className="text-center">
        <Link
          to="/alumni"
          className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium text-sm group"
        >
          <span>Découvrir tous les profils</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default NewProfilesHighlight;
