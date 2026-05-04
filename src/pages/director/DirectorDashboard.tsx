import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CpsOverview from '../admin/CpsOverview';
import { BarChart2, Newspaper, BookOpen, Video, ArrowRight } from 'lucide-react';

const DirectorDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-900">Portail Directeur</h1>
          <p className="text-zinc-500 mt-1">
            Bonjour {currentUser?.displayName} — suivi des étudiants CPS Connect
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
                <BarChart2 className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-blue-900">Progression des étudiants</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-4">Suivi détaillé de l'avancement par étudiant et par phase.</p>
              <Link to="/director/progressions" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors">
                Voir les progressions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Newspaper className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-blue-900">Annonces officielles</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-4">Publier des annonces et informations officielles pour la communauté CPS.</p>
              <Link to="/news-editor" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors">
                Gérer les actualités <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-blue-900">Ressources</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-4">Consulter les ressources mises à disposition des étudiants CPS.</p>
              <Link to="/all-resources" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors">
                Voir les ressources <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Video className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-blue-900">Webinaires & Ateliers</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-4">Consulter le calendrier des webinaires organisés pour les étudiants CPS.</p>
              <Link to="/webinars" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors">
                Voir le calendrier <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;
