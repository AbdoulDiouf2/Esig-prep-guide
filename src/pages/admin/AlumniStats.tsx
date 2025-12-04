import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApprovedAlumniProfiles, getPendingAlumniProfiles, getRejectedAlumniProfiles } from '../../services/alumniService';
import { AlumniProfile } from '../../types/alumni';
import { exportToCSV, exportToPDF, calculateAlumniStats } from '../../utils/exportService';
import { 
  Users, 
  Download, 
  FileText, 
  TrendingUp, 
  MapPin, 
  Briefcase,
  Award,
  Filter,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';

const AlumniStats: React.FC = () => {
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const [approved, pending, rejected] = await Promise.all([
        getApprovedAlumniProfiles('dateCreated', 1000),
        getPendingAlumniProfiles(),
        getRejectedAlumniProfiles()
      ]);
      setProfiles([...approved, ...pending, ...rejected]);
    } catch (error) {
      console.error('Erreur lors du chargement des profils:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    if (filter === 'all') return true;
    return profile.status === filter;
  });

  // Stats pour les profils filtrés (graphiques)
  const stats = calculateAlumniStats(filteredProfiles);
  
  // Stats totaux pour les boutons de filtre (toujours basés sur tous les profils)
  const totalStats = calculateAlumniStats(profiles);

  const handleExportCSV = () => {
    const filename = `alumni-export-${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filteredProfiles, filename);
  };

  const handleExportPDF = () => {
    exportToPDF(filteredProfiles);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Statistiques Alumni</h1>
              <p className="text-gray-600 mt-1">Vue d'ensemble et export des données</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                to="/admin/alumni-validation"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                <Award className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Valider des profils</span>
                <span className="sm:hidden">Validation</span>
              </Link>
              <Link
                to="/alumni"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Voir l'annuaire</span>
                <span className="sm:hidden">Annuaire</span>
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Retour
              </Link>
            </div>
          </div>

          {/* Filtres et Export */}
          <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtrer :</span>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium ${
                    filter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous ({totalStats.total})
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium ${
                    filter === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approuvés ({totalStats.approved})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium ${
                    filter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  En attente ({totalStats.pending})
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium ${
                    filter === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Rejetés ({totalStats.rejected})
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Profils</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approuvés</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux d'approbation</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.approvalRate}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques et Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Secteurs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Briefcase className="w-5 h-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Top 5 Secteurs</h2>
            </div>
            <div className="space-y-3">
              {stats.topSectors.map(([sector, count], index) => (
                <div key={sector} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-purple-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">{sector}</span>
                      <span className="text-sm text-gray-600">{count} profils</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {stats.topSectors.length === 0 && (
                <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
              )}
            </div>
          </div>

          {/* Top Pays */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Top 5 Pays</h2>
            </div>
            <div className="space-y-3">
              {stats.topCountries.map(([country, count], index) => (
                <div key={country} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">{country}</span>
                      <span className="text-sm text-gray-600">{count} profils</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {stats.topCountries.length === 0 && (
                <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Expertises */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center mb-4">
            <Award className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Top 10 Expertises</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.topExpertises.map(([expertise, count]) => (
              <div key={expertise} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{expertise}</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {count} profils
                </span>
              </div>
            ))}
            {stats.topExpertises.length === 0 && (
              <p className="text-gray-500 text-sm col-span-2">Aucune donnée disponible</p>
            )}
          </div>
        </div>

        {/* Distribution par année de promo */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Distribution par année de promotion</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(stats.promoCounts)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([year, count]) => (
                <div key={year} className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600">{count}</p>
                  <p className="text-sm text-gray-600 mt-1">Promo {year}</p>
                </div>
              ))}
            {Object.keys(stats.promoCounts).length === 0 && (
              <p className="text-gray-500 text-sm col-span-full">Aucune donnée disponible</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniStats;
