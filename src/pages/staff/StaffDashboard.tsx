import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CpsOverview from '../admin/CpsOverview';
import { Upload, MessageSquare, Video, Newspaper, ArrowRight } from 'lucide-react';

const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-900">Portail Staff</h1>
          <p className="text-zinc-500 mt-1">
            Bonjour {currentUser?.displayName} — gestion du contenu et de la communauté
          </p>
        </div>

        {/* Layout principal : CpsOverview (3/5) + cartes (2/5) */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/5 min-w-0">
            <CpsOverview backPath="/director/progressions" />
          </div>

          <div className="lg:w-2/5 flex flex-col gap-4">
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Upload className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-blue-900">Ressources</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-4">Uploader et gérer les documents, fiches et annales de la prépa.</p>
              <Link to="/all-resources" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors">
                Gérer les ressources <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-blue-900">Modération du forum</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-4">Modérer les discussions, supprimer les contenus inappropriés.</p>
              <Link to="/forum" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors">
                Accéder au forum <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Video className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-blue-900">Webinaires</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-4">Créer et gérer le calendrier des webinaires de la prépa.</p>
              <Link to="/editor/webinars" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors">
                Gérer les webinaires <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Newspaper className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-blue-900">Actualités</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-4">Publier des articles et annonces pour la communauté CPS Connect.</p>
              <Link to="/news-editor" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors">
                Gérer les actualités <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
