import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  Newspaper,
  TrendingUp,
  BarChart2,
  ArrowRight,
  BookOpen,
  Video,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  cpsUsers: number;
  publishedNews: number;
}

const DirectorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    cpsUsers: 0,
    publishedNews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const safeCount = async (label: string, q: Parameters<typeof getCountFromServer>[0]) => {
        try {
          const snap = await getCountFromServer(q);
          return snap.data().count;
        } catch (err) {
          console.error(`[DirectorDashboard] ${label}:`, err);
          return 0;
        }
      };

      try {
        const [totalUsers, activeUsers, cpsUsers, publishedNews] = await Promise.all([
          safeCount('totalUsers', query(collection(db, 'users'), where('status', 'in', ['cps', 'future']))),
          safeCount('activeUsers', query(collection(db, 'users'), where('lastActive', '>=', thirtyDaysAgo))),
          safeCount('cpsUsers', query(collection(db, 'users'), where('status', '==', 'cps'))),
          safeCount('publishedNews', query(collection(db, 'newsArticles'), where('status', '==', 'published'))),
        ]);

        setStats({ totalUsers, activeUsers, cpsUsers, publishedNews });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const activityRate = stats.totalUsers > 0
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-900">Portail Directeur</h1>
          <p className="text-zinc-500 mt-1">
            Bonjour {currentUser?.displayName} — suivi des étudiants CPS Connect
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
                <Users className="w-5 h-5 text-blue-700" />
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Étudiants inscrits</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">{stats.totalUsers}</p>
              <p className="text-xs text-zinc-400 mt-1">{stats.cpsUsers} en prépa active</p>
            </div>

            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Actifs 30j</span>
              </div>
              <p className="text-3xl font-bold text-green-700">{activityRate}%</p>
              <p className="text-xs text-zinc-400 mt-1">{stats.activeUsers} étudiants</p>
            </div>

            <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Newspaper className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Actualités</span>
              </div>
              <p className="text-3xl font-bold text-blue-700">{stats.publishedNews}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Progression étudiants */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <BarChart2 className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-blue-900">Progression des étudiants</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Suivi de l'avancement des étudiants CPS dans le guide de préparation au visa.
            </p>
            <Link
              to="/director/progressions"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              Voir les progressions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Annonces officielles */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Newspaper className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-blue-900">Annonces officielles</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Publier des annonces et informations officielles pour la communauté CPS.
            </p>
            <Link
              to="/news-editor"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              Gérer les actualités <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Ressources disponibles */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-blue-900">Ressources</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Consulter les ressources mises à disposition des étudiants CPS.
            </p>
            <Link
              to="/all-resources"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              Voir les ressources <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Webinaires */}
          <div className="bg-white border border-zinc-200 shadow-sm rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Video className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-blue-900">Webinaires & Ateliers</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Consulter le calendrier des webinaires et ateliers organisés pour les étudiants CPS.
            </p>
            <Link
              to="/webinars"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              Voir le calendrier <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;
