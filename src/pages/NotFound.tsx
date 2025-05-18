import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 to-blue-800 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-white rounded-full">
          <span className="text-5xl font-bold text-blue-900">404</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">Page non trouvée</h1>
        <p className="text-blue-100 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-blue-900 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
        >
          <Home className="mr-2 h-5 w-5" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;