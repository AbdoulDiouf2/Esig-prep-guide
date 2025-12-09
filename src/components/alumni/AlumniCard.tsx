import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Award, Linkedin, Github, Twitter, Globe, Building2 } from 'lucide-react';
import type { AlumniProfile } from '../../types/alumni';

interface AlumniCardProps {
  profile: AlumniProfile;
}

const AlumniCard: React.FC<AlumniCardProps> = ({ profile }) => {
  return (
    <Link 
      to={`/alumni/${profile.uid}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02] p-6 cursor-pointer"
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
            {profile.name.charAt(0).toUpperCase()}
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

      {/* Entreprise */}
      {profile.company && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Briefcase className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {profile.position ? `${profile.position} chez ` : ''}{profile.company}
          </span>
        </div>
      )}

      {/* Localisation */}
      {(profile.city || profile.country) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {[profile.city, profile.country].filter(Boolean).join(', ')}
          </span>
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
        <div className="mb-4">
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

      {/* Réseaux sociaux */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        {profile.linkedin && (
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-600 hover:text-blue-600 transition-colors"
            title="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        )}
        {profile.github && (
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        )}
        {profile.twitter && (
          <a
            href={profile.twitter}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-600 hover:text-blue-400 transition-colors"
            title="Twitter"
          >
            <Twitter className="w-4 h-4" />
          </a>
        )}
        {profile.personalWebsite && (
          <a
            href={profile.personalWebsite}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-600 hover:text-purple-600 transition-colors"
            title="Site web personnel"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}
        {profile.companyWebsite && (
          <a
            href={profile.companyWebsite}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-600 hover:text-orange-600 transition-colors"
            title="Site web de l'entreprise"
          >
            <Building2 className="w-4 h-4" />
          </a>
        )}
        
        <div className="flex-1"></div>
        
        {/* Indicateur cliquable */}
        <span className="text-sm font-medium text-blue-600">
          Voir profil →
        </span>
      </div>
    </Link>
  );
};

export default AlumniCard;
