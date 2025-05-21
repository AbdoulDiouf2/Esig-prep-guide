import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, ChevronDown, LogOut, User, Settings, BookOpen, HelpCircle } from 'lucide-react';

const Header: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-md' 
          : 'bg-gradient-to-r from-blue-900 to-blue-800'
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center space-x-6">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <div className="text-blue-900 font-bold text-lg">E</div>
              </div>
              <div className={`font-bold text-xl transition-colors duration-300 ${
                isScrolled ? 'text-blue-900' : 'text-white'
              }`}>
                ESIGELEC Prep Guide
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            {currentUser && (
              <>
                <Link to="/dashboard" className={`transition-colors duration-300 hover:text-blue-400 whitespace-nowrap ${
                  isScrolled ? 'text-blue-800' : 'text-white'
                }`}>
                  Tableau de bord
                </Link>
                <Link to="/resources" className={`transition-colors duration-300 hover:text-blue-400 ${
                  isScrolled ? 'text-blue-800' : 'text-white'
                }`}>
                  Ressources
                </Link>
                <Link to="/faq" className={`transition-colors duration-300 hover:text-blue-400 ${
                  isScrolled ? 'text-blue-800' : 'text-white'
                }`}>
                  FAQ
                </Link>
                <Link to="/tutorial" className={`transition-colors duration-300 hover:text-blue-400 ${
                  isScrolled ? 'text-blue-800' : 'text-white'
                }`}>
                  Tutoriel
                </Link>
                <Link to="/help" className={`transition-colors duration-300 hover:text-blue-400 ${
                  isScrolled ? 'text-blue-800' : 'text-white'
                }`}>
                  <span className="flex items-center">
                    <HelpCircle className="w-4 h-4 mr-1" />
                    Aide
                  </span>
                </Link>
                {isAdmin() && (
                  <Link to="/admin" className={`transition-colors duration-300 hover:text-blue-400 ${
                    isScrolled ? 'text-blue-800' : 'text-white'
                  }`}>
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center space-x-2 transition-colors duration-300 border border-blue-200 bg-white/60 rounded-lg px-2 py-1 shadow-sm ${
                    isScrolled ? 'text-blue-800' : 'text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {(currentUser.displayName || currentUser.email || 'Utilisateur').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{currentUser.displayName || currentUser.email || 'Utilisateur'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span>Profil</span>
                    </Link>
                    {isAdmin() && (
                      <Link 
                        to="/admin" 
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        <span>Administration</span>
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className={`font-medium transition-colors duration-300 ${
                    isScrolled ? 'text-blue-800' : 'text-white'
                  }`}
                >
                  Connexion
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-blue-900 hover:bg-blue-50 px-4 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? 'text-blue-800' : 'text-white'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isScrolled ? 'text-blue-800' : 'text-white'}`} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {currentUser ? (
                <>
                  <div className="flex items-center mb-2">
  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
    <span className="text-white font-medium text-sm">
      {(currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U').toUpperCase()}
    </span>
  </div>
  <span className={`ml-2 font-medium ${isScrolled ? 'text-blue-800' : 'text-white'}`}>
    {currentUser.displayName || currentUser.email || 'Utilisateur'}
  </span>
</div>
<Link
  to="/profile"
  className={`flex items-center py-2 ${isScrolled ? 'text-blue-800' : 'text-white'}`}
>
  <User className="w-4 h-4 mr-2" />
  Profil
</Link>
                  <Link 
                    to="/dashboard" 
                    className={`py-2 ${isScrolled ? 'text-blue-800' : 'text-white'}`}
                  >
                    Tableau de bord
                  </Link>
                  <Link 
                    to="/resources" 
                    className={`py-2 ${isScrolled ? 'text-blue-800' : 'text-white'}`}
                  >
                    Ressources
                  </Link>
                  <Link 
                    to="/faq" 
                    className={`py-2 ${isScrolled ? 'text-blue-800' : 'text-white'}`}
                  >
                    FAQ
                  </Link>
                  <Link 
                    to="/tutorial" 
                    className={`flex items-center py-2 ${isScrolled ? 'text-blue-800' : 'text-white'}`}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Tutoriel
                  </Link>
                  <Link 
                    to="/help" 
                    className={`flex items-center py-2 ${isScrolled ? 'text-blue-800' : 'text-white'}`}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Aide
                  </Link>
                  {isAdmin() && (
                    <Link 
                      to="/admin" 
                      className={`py-2 ${isScrolled ? 'text-blue-800' : 'text-white'}`}
                    >
                      Administration
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className={`flex items-center py-2 ${isScrolled ? 'text-blue-800' : 'text-white'}`}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link 
                    to="/login" 
                    className={`font-medium ${isScrolled ? 'text-blue-800' : 'text-white'}`}
                  >
                    Connexion
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-white text-blue-900 hover:bg-blue-50 px-4 py-2 rounded-md font-medium transition-colors duration-200 text-center"
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;