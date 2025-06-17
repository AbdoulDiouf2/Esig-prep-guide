import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Définir les logos des écoles
const schoolLogos = [
  {
    id: 1,
    name: 'ESIGELEC',
    logoUrl: '/public/Logo_ESIGELEC.svg',
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
    logoUrl: '/public/logo.png',
    alt: 'Logo ESMT'
  },
  {
    id: 4,
    name: 'College Sacré Coeur',
    logoUrl: '/public/pay1.jpg',
    alt: 'Logo Cours Sacré Coeurs'
  }
];

const LogoSlider: React.FC = () => {
  const settings = {
    dots: false,
    infinite: true,
    speed: 8000,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    pauseOnHover: false,
    cssEase: 'linear',
    arrows: false,
    swipe: false,
    draggable: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  return (
    <div className="bg-white py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
          Les écoles partenaires
        </h2>
        <Slider {...settings}>
          {schoolLogos.map((logo) => (
            <div key={logo.id} className="px-4">
              <div className="flex flex-col items-center justify-center h-32 bg-white rounded-lg shadow-sm p-4 transition-transform hover:scale-105">
                <img 
                  src={logo.logoUrl} 
                  alt={logo.alt} 
                  className="max-h-20 max-w-full object-contain" 
                />
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default LogoSlider;
