import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Heart, Linkedin, Github } from 'lucide-react';
import LegalFooter from '../legal/LegalFooter';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-blue-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and tagline */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-2">
                <div className="text-blue-900 font-bold text-lg">E</div>
              </div>
              <div className="font-bold text-xl text-white">
                ESIGELEC Prep Guide
              </div>
            </Link>
            <p className="mt-4 text-blue-200">
              Votre guide pour faciliter votre transition de CPS vers l'ESIGELEC
            </p>
          </div>
          
          {/* Quick links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/applications" className="text-blue-200 hover:text-white transition-colors">
                  Centre d'applications
                </Link>
              </li>
              <li>
                <Link to="/alumni" className="text-blue-200 hover:text-white transition-colors">
                  🆕 Annuaire Alumni
                </Link>
              </li>
              <li>
                <Link to="/resources" className="text-blue-200 hover:text-white transition-colors">
                  Ressources
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-blue-200 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/forum" className="text-blue-200 hover:text-white transition-colors">
                  Forum
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Community */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Communauté</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/complete-alumni-profile" className="text-blue-200 hover:text-white transition-colors">
                  Créer mon profil Alumni
                </Link>
              </li>
              <li>
                <Link to="/webinars" className="text-blue-200 hover:text-white transition-colors">
                  Webinaires
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-blue-200 hover:text-white transition-colors">
                  Centre d'aide
                </Link>
              </li>
              <li>
                <Link to="/tutorial" className="text-blue-200 hover:text-white transition-colors">
                  Tutoriels
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="flex items-center mb-2">
              <Mail className="w-4 h-4 mr-2" />
              <a href="mailto:contact@esiguide.com" className="text-blue-200 hover:text-white transition-colors">
                abdoul.diouf2@groupe-esigelec.org
              </a>
            </div>
            <div className="flex space-x-4 mt-4">
              <a href="https://www.linkedin.com/in/abdoul-ahad-mback%C3%A9-diouf-5b04b4213/" className="text-blue-200 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://github.com/AbdoulDiouf2" className="text-blue-200 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-blue-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-blue-200">
            &copy; {currentYear} ESIGELEC Prep Guide. Tous droits réservés.
          </p>
          <p className="text-sm text-blue-200 mt-2 md:mt-0 flex items-center">
            Développé avec <Heart className="w-4 h-4 mx-1 text-red-400" /> par Abdoul Ahad Mbacké DIOUF - PROMO CPS 2020/2022
          </p>
        </div>
      </div>
      <LegalFooter />
    </footer>
  );
};

export default Footer;