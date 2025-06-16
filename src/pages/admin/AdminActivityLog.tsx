import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, where, limit, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { AdminActivityLog } from './useRecentAdminActivity';
import { ArrowLeft, Search, Clock, User, RefreshCw } from 'lucide-react';

const AdminActivityLogPage: React.FC = () => {
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const itemsPerPage = 20;

  // Helper function to format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculer la date pour le filtre
  const getFilterDate = (): Date | null => {
    const now = new Date();
    let resultDate: Date | null = null;
    
    switch (dateFilter) {
      case 'today':
        resultDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        resultDate = new Date();
        resultDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        resultDate = new Date();
        resultDate.setMonth(now.getMonth() - 1);
        break;
      default:
        resultDate = null;
    }
    
    return resultDate;
  };

  // Fetch activities
  const fetchActivities = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setLastVisible(null);
      } else {
        setLoadingMore(true);
      }

      let q = query(
        collection(db, 'adminActivityLog'),
        orderBy('date', 'desc')
      );

      // Apply date filter if needed
      const filterDate = getFilterDate();
      if (filterDate) {
        q = query(q, where('date', '>=', filterDate.toISOString()));
      }

      // Apply pagination if not reset
      if (!reset && lastVisible) {
        q = query(q, limit(itemsPerPage));
      } else {
        q = query(q, limit(itemsPerPage));
      }

      const snapshot = await getDocs(q);
      
      // Check if there might be more data
      setHasMore(snapshot.docs.length === itemsPerPage);
      
      // Store last document for pagination
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
        setHasMore(false);
      }

      const activityData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminActivityLog[];

      // Apply client-side filtering
      let filteredData = activityData;
      
      if (actionFilter !== 'all') {
        filteredData = filteredData.filter(activity => activity.type === actionFilter);
      }
      
      if (targetFilter !== 'all') {
        filteredData = filteredData.filter(activity => activity.target === targetFilter);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(activity => 
          activity.user?.toLowerCase().includes(query) ||
          activity.target.toLowerCase().includes(query) ||
          activity.type.toLowerCase().includes(query) ||
          (activity.details && JSON.stringify(activity.details).toLowerCase().includes(query))
        );
      }
      
      if (reset) {
        setActivities(filteredData);
      } else {
        setActivities(prev => [...prev, ...filteredData]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchActivities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, targetFilter, dateFilter]);

  // Helper to render action badge
  const renderActionBadge = (type: string) => {
    let bgColor = 'bg-blue-100 text-blue-800';
    
    switch (type.toLowerCase()) {
      case 'ajout':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'suppression':
        bgColor = 'bg-red-100 text-red-800';
        break;
      case 'modification':
        bgColor = 'bg-yellow-100 text-yellow-800';
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {type}
      </span>
    );
  };

  // Helper to render target badge
  const renderTargetBadge = (target: string) => {
    // Default style
    let bgColor = 'bg-gray-100 text-gray-800';
    
    // Map target types to their corresponding styles
    const targetStyles: Record<string, string> = {
      'ressource': 'bg-purple-100 text-purple-800',
      'section': 'bg-indigo-100 text-indigo-800',
      'sous-section': 'bg-indigo-50 text-indigo-700',
      'faq': 'bg-blue-100 text-blue-800',
      'utilisateur': 'bg-pink-100 text-pink-800',
      'webinaire': 'bg-teal-100 text-teal-800',
      'forum': 'bg-amber-100 text-amber-800',
      'profil': 'bg-cyan-100 text-cyan-800',
      'paramètre': 'bg-gray-200 text-gray-800',
      'document': 'bg-emerald-100 text-emerald-800',
      'catégorie': 'bg-fuchsia-100 text-fuchsia-800'
    };
    
    // Apply style if target exists, otherwise use default
    const targetLower = target.toLowerCase();
    if (targetStyles[targetLower]) {
      bgColor = targetStyles[targetLower];
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {target}
      </span>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <Link to="/admin" className="p-2 rounded-full hover:bg-blue-800 transition mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold mb-2">Journal d'activité</h1>
              <p className="text-blue-100">
                Historique détaillé des activités administratives
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Rechercher dans les activités..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filters */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <option value="all">Toutes les actions</option>
                  <option value="Ajout">Ajout</option>
                  <option value="Modification">Modification</option>
                  <option value="Suppression">Suppression</option>
                </select>
              </div>
              
              <div className="relative flex-1">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                >
                  <option value="all">Toutes les cibles</option>
                  <option value="Ressource">Ressources</option>
                  <option value="Section">Sections</option>
                  <option value="Sous-section">Sous-sections</option>
                  <option value="FAQ">FAQ</option>
                  <option value="Utilisateur">Utilisateurs</option>
                  <option value="Webinaire">Webinaires</option>
                  <option value="Forum">Forums</option>
                  <option value="Profil">Profils</option>
                  <option value="Paramètre">Paramètres</option>
                  <option value="Document">Documents</option>
                  <option value="Catégorie">Catégories</option>
                </select>
              </div>
            </div>
            
            {/* Date filter */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Toute période</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">7 derniers jours</option>
                  <option value="month">30 derniers jours</option>
                </select>
              </div>
              
              <button
                onClick={() => fetchActivities()}
                className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Activity list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Activités récentes</h2>
          </div>
          
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucune activité à afficher. Ajustez les filtres ou effectuez des actions administratives.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activities.map(activity => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                    <div className="flex items-center mb-2 sm:mb-0">
                      {renderActionBadge(activity.type)}
                      <span className="mx-2">•</span>
                      {renderTargetBadge(activity.target)}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formatDate(activity.date)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    {activity.user && (
                      <div className="text-sm text-gray-500 flex items-center mr-4">
                        <User className="h-4 w-4 mr-1" />
                        <span>{activity.user}</span>
                      </div>
                    )}
                  </div>
                  
                  {activity.details && (
                    <div className="mt-2 bg-gray-50 p-3 rounded text-sm">
                      <h4 className="font-medium mb-1">Détails</h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(activity.details).map(([key, value]) => (
                          <div key={key} className="flex">
                            <dt className="font-medium text-gray-500 mr-2">{key}:</dt>
                            <dd className="text-gray-900">{
                              typeof value === 'object' 
                                ? JSON.stringify(value)
                                : String(value)
                            }</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                  
                  {activity.targetId && (
                    <div className="mt-1 text-sm">
                      <span className="font-medium text-gray-500">ID:</span> {activity.targetId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {hasMore && !loading && (
            <div className="p-4 border-t border-gray-200 text-center">
              <button
                onClick={() => fetchActivities(false)}
                disabled={loadingMore}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loadingMore ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-blue-500 rounded-full"></span>
                    Chargement...
                  </span>
                ) : (
                  'Charger plus d\'activités'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLogPage;
