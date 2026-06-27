import React from 'react';

interface ProfileCoverHeaderProps {
  name: string;
  subtitle?: string;
  photoURL?: string;
  initials?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

const ProfileCoverHeader: React.FC<ProfileCoverHeaderProps> = ({
  name,
  subtitle,
  photoURL,
  initials,
  badge,
  actions,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm mb-6">
      {/* Bandeau cover */}
      <div className="h-32 bg-gradient-to-r from-blue-900 to-blue-700 rounded-t-2xl" />

      {/* Zone contenu */}
      <div className="px-6 pb-5">
        {/* Ligne avatar + actions : avatar overlap, actions alignées à droite */}
        <div className="flex items-start justify-between -mt-12">
          {/* Avatar seul qui overlap */}
          <div className="relative shrink-0">
            {photoURL ? (
              <img
                src={photoURL}
                alt={name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-gray-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold">
                {initials || name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Actions : poussées sous le bandeau avec mt-14 */}
          {actions && (
            <div className="flex flex-wrap gap-2 mt-14">{actions}</div>
          )}
        </div>

        {/* Nom + badge + subtitle : toujours dans la zone blanche */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCoverHeader;
