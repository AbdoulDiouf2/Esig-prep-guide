import React from 'react';
import './InfiniteLogoScroll.css';

// Définir les logos des écoles
const schoolLogos = [
  {
    id: 1,
    name: 'ESIGELEC',
    logoUrl: 'https://www.francemobilites.fr/sites/frenchmobility/files/images/2021/06/esigelec-rouen-2baselines_0.png',
    alt: 'Logo ESIGELEC'
  },
  {
    id: 2,
    name: 'CPS Dakar',
    logoUrl: '/public/logo_CPS.jpeg',
    alt: 'Logo CPS Dakar'
  },
  {
    id: 3,
    name: 'ESMT',
    logoUrl: 'https://burkina24.com/wp-content/uploads/2023/05/ESMT-logo.png',
    alt: 'Logo ESMT'
  },
  {
    id: 4,
    name: 'College Sacré Coeur',
    logoUrl: 'https://www.courssacrecoeur.info/images/logo.gif',
    alt: 'Logo Collège Sacré Coeur'
  }
];

const InfiniteLogoScroll: React.FC = () => {
  // Dupliquer les logos pour créer l'effet de défilement infini
  const duplicatedLogos = [...schoolLogos, ...schoolLogos];
  
  return (
    <div className="bg-white py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
          Les écoles partenaires
        </h2>
        <div className="infinite-logo-container">
          <div className="infinite-logo-scroll">
            {duplicatedLogos.map((logo, index) => (
              <div key={`${logo.id}-${index}`} className="logo-item">
                <div className="flex items-center justify-center h-40 bg-white rounded-lg shadow-sm p-4">
                  <img 
                    src={logo.logoUrl} 
                    alt={logo.alt} 
                    className="max-h50 max-w-full object-contain" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfiniteLogoScroll;
