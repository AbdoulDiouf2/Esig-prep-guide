import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Award, Linkedin, Github, Twitter, Globe, Building2, Users, Star } from 'lucide-react';
import type { AlumniProfile } from '../../types/alumni';

interface AlumniCardProps {
  profile: AlumniProfile;
}

const AlumniCard: React.FC<AlumniCardProps> = ({ profile }) => {
  return (
    <Link 
      to={`/alumni/${profile.uid}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02] p-6 cursor-pointer h-full flex flex-col"
    >
      {/* Header avec photo et nom */}
      <div className="flex items-start gap-4 mb-4">
        {profile.photo ? (
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {(() => {
              const nameParts = profile.name.trim().split(' ');
              if (nameParts.length >= 2) {
                // Prendre première lettre du prénom et première lettre du nom
                return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
              } else if (nameParts.length === 1 && nameParts[0].length > 0) {
                // Si un seul mot, prendre les deux premières lettres si possible
                return nameParts[0].length >= 2 
                  ? nameParts[0].substring(0, 2).toUpperCase()
                  : nameParts[0].charAt(0).toUpperCase();
              }
              return profile.name.charAt(0).toUpperCase();
            })()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {profile.name}
          </h3>
          {profile.headline && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {profile.headline}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Promo {profile.yearPromo}
          </p>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-gray-700 line-clamp-3 mb-4">
          {profile.bio}
        </p>
      )}

      {/* Position/Entreprise */}
      {(profile.position || profile.company) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Briefcase className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {profile.position && (
              <>{profile.position}{profile.company && ' chez '}</>
            )}
            {profile.company}
          </span>
        </div>
      )}

      {/* Localisation */}
      {(profile.city || profile.country) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {profile.city && (
              profile.city.split(',').map((city, index) => (
                <span
                  key={`city-${index}`}
                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {city.trim()}
                </span>
              ))
            )}
            {profile.country && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                {profile.country}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Secteurs */}
      {profile.sectors && profile.sectors.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {profile.sectors.slice(0, 3).map((sector, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                {sector}
              </span>
            ))}
            {profile.sectors.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                +{profile.sectors.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Expertise */}
      {profile.expertise && profile.expertise.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1">
            <Award className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Expertise</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {profile.expertise.slice(0, 4).map((exp, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-green-50 text-green-700 rounded"
              >
                {exp}
              </span>
            ))}
            {profile.expertise.length > 4 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">
                +{profile.expertise.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Disponibilité - seulement si pertinent */}
      {profile.availability && profile.availability !== 'Pas disponible' && (
        <div className="mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {profile.availability}
            </span>
          </div>
        </div>
      )}

      {/* Soft Skills - limités aux 2-3 premiers */}
      {profile.softSkills && profile.softSkills.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="text-xs font-medium text-gray-500">Soft Skills</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {profile.softSkills.slice(0, 2).map((skill, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded"
              >
                {skill}
              </span>
            ))}
            {profile.softSkills.length > 2 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">
                +{profile.softSkills.length - 2}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Espace flexible pour pousser le footer en bas */}
      <div className="flex-1"></div>
      
      {/* Footer avec réseaux sociaux et lien */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
        {/* Réseaux sociaux */}
        <div className="flex items-center gap-3">
          {profile.linkedin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(profile.linkedin, '_blank', 'noopener,noreferrer');
              }}
              className="text-gray-600 hover:text-blue-600 transition-colors p-1 rounded"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </button>
          )}
          {profile.github && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(profile.github, '_blank', 'noopener,noreferrer');
              }}
              className="text-gray-600 hover:text-gray-900 transition-colors p-1 rounded"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </button>
          )}
          {profile.twitter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(profile.twitter, '_blank', 'noopener,noreferrer');
              }}
              className="text-gray-600 hover:text-blue-400 transition-colors p-1 rounded"
              title="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </button>
          )}
          {profile.personalWebsite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(profile.personalWebsite, '_blank', 'noopener,noreferrer');
              }}
              className="text-gray-600 hover:text-purple-600 transition-colors p-1 rounded"
              title="Site web personnel"
            >
              <Globe className="w-4 h-4" />
            </button>
          )}
          {profile.companyWebsite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(profile.companyWebsite, '_blank', 'noopener,noreferrer');
              }}
              className="text-gray-600 hover:text-orange-600 transition-colors p-1 rounded"
              title="Site web de l'entreprise"
            >
              <Building2 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Indicateur cliquable */}
        <span className="text-sm font-medium text-blue-600">
          Voir profil →
        </span>
      </div>
    </Link>
  );
};

export default AlumniCard;
