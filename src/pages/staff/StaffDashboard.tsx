import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen,
  MessageSquare,
  Video,
  Newspaper,
  ArrowRight,
  Upload,
} from 'lucide-react';

interface Stats {
  resourceCount: number;
  webinarCount: number;
  newsCount: number;
}

const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<Stats>({
    resourceCount: 0,
    webinarCount: 0,
    newsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resourceSnap, webinarSnap, newsSnap] = await Promise.all([
          getCountFromServer(collection(db, 'academicResources')),
          getCountFromServer(query(collection(db, 'webinars'), where('isUpcoming', '==', true))),
          getCountFromServer(query(collection(db, 'newsArticles'), where('status', '==', 'published'))),
        ]);

        setStats({
          resourceCount: resourceSnap.data().count,
          webinarCount: webinarSnap.data().count,
          newsCount: newsSnap.data().count,
        });
      } catch (err) {
        console.error('Erreur chargement stats staff:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-900">Portail Staff</h1>
          <p className="text-zinc-500 mt-1">
            Bonjour {currentUser?.displayName} — gestion du contenu et de la communauté
          </p>
        </div>

        {/* KPIs */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-blue-700" />
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Ressources</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">{stats.resourceCount}</p>
            </div>

            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Video className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Webinaires</span>
              </div>
              <p className="text-3xl font-bold text-blue-700">{stats.webinarCount}</p>
              <p className="text-xs text-zinc-400 mt-1">à venir</p>
            </div>

            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Newspaper className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Actualités</span>
              </div>
              <p className="text-3xl font-bold text-blue-700">{stats.newsCount}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Ressources pédagogiques */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-blue-900">Ressources</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Uploader et gérer les documents, fiches et annales de la prépa.
            </p>
            <Link
              to="/all-resources"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              Gérer les ressources <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Modération forum */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-blue-900">Modération du forum</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Modérer les discussions, supprimer les contenus inappropriés.
            </p>
            <Link
              to="/forum"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              Accéder au forum <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Webinaires */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Video className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-blue-900">Webinaires</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Créer et gérer le calendrier des webinaires de la prépa.
            </p>
            <Link
              to="/editor/webinars"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              Gérer les webinaires <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Actualités */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Newspaper className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-blue-900">Actualités</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Publier des articles et annonces pour la communauté CPS Connect.
            </p>
            <Link
              to="/news-editor"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              Gérer les actualités <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
