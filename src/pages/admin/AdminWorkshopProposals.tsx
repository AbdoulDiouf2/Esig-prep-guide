import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Calendar, Clock, User, Mail, Check, X, MessageSquare, Download, ExternalLink, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface WorkshopProposal {
  id: string;
  title: string;
  description: string;
  expectedDuration: string;
  topics: string[];
  targetAudience: string;
  preferredDate: string;
  contactEmail: string;
  notes: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp; // Utiliser le type Timestamp de Firestore
}

const AdminWorkshopProposals: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<WorkshopProposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<WorkshopProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProposals, setExpandedProposals] = useState<string[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // États pour le modal de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'approve' | 'reject' | 'pending',
    id: string
  } | null>(null);

  // Récupérer les propositions d'ateliers
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'workshopProposals'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const proposalsData: WorkshopProposal[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<WorkshopProposal, 'id'>;
          proposalsData.push({
            id: doc.id,
            ...data,
          });
        });
        
        setProposals(proposalsData);
        setFilteredProposals(proposalsData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des propositions:', error);
        setError('Une erreur est survenue lors de la récupération des propositions.');
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  // Filtrer les propositions en fonction du status et du terme de recherche
  useEffect(() => {
    let filtered = proposals;
    
    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }
    
    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        proposal =>
          proposal.title.toLowerCase().includes(term) ||
          proposal.description.toLowerCase().includes(term) ||
          proposal.userName.toLowerCase().includes(term) ||
          proposal.userEmail.toLowerCase().includes(term) ||
          (proposal.topics && proposal.topics.some(topic => topic.toLowerCase().includes(term)))
      );
    }
    
    setFilteredProposals(filtered);
  }, [statusFilter, searchTerm, proposals]);

  const toggleExpand = (id: string) => {
    setExpandedProposals(prev => 
      prev.includes(id) 
        ? prev.filter(propId => propId !== id) 
        : [...prev, id]
    );
  };

  const updateProposalStatus = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    if (!currentUser) return;
    
    try {
      setProcessing(id);
      const proposalRef = doc(db, 'workshopProposals', id);
      await updateDoc(proposalRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.uid
      });
      
      // Mettre à jour l'état local
      setProposals(prevProposals => 
        prevProposals.map(proposal => 
          proposal.id === id ? { ...proposal, status: newStatus } : proposal
        )
      );
      
      setProcessing(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setError('Une erreur est survenue lors de la mise à jour du statut.');
      setProcessing(null);
    }
  };

  const confirmStatusChange = (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return;
    
    let title = '';
    let message = '';
    
    if (newStatus === 'approved') {
      title = 'Approuver la proposition';
      message = `Êtes-vous sûr de vouloir approuver la proposition "${proposal.title}" ? L'auteur pourrait être notifié de cette décision.`;
      setPendingAction({ type: 'approve', id });
    } else if (newStatus === 'rejected') {
      title = 'Rejeter la proposition';
      message = `Êtes-vous sûr de vouloir rejeter la proposition "${proposal.title}" ? L'auteur pourrait être notifié de cette décision.`;
      setPendingAction({ type: 'reject', id });
    } else {
      title = 'Remettre en attente';
      message = `Êtes-vous sûr de vouloir remettre la proposition "${proposal.title}" en attente ?`;
      setPendingAction({ type: 'pending', id });
    }
    
    setModalTitle(title);
    setModalMessage(message);
    setShowConfirmModal(true);
  };

  const deleteProposal = async (id: string) => {
    try {
      setProcessing(id);
      await deleteDoc(doc(db, 'workshopProposals', id));
      
      // Mettre à jour l'état local
      setProposals(prevProposals => prevProposals.filter(proposal => proposal.id !== id));
      setProcessing(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Une erreur est survenue lors de la suppression de la proposition.');
      setProcessing(null);
    }
  };
  
  const confirmDelete = (id: string) => {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return;
    
    setModalTitle('Supprimer la proposition');
    setModalMessage(`Êtes-vous sûr de vouloir supprimer définitivement la proposition "${proposal.title}" ? Cette action est irréversible.`);
    setPendingAction({ type: 'delete', id });
    setShowConfirmModal(true);
  };
  
  const handleConfirmAction = () => {
    if (!pendingAction) return;
    
    if (pendingAction.type === 'delete') {
      deleteProposal(pendingAction.id);
    } else {
      const status = pendingAction.type as 'pending' | 'approved' | 'rejected';
      updateProposalStatus(pendingAction.id, status);
    }
    
    setShowConfirmModal(false);
    setPendingAction(null);
  };
  
  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const exportToCSV = () => {
    if (filteredProposals.length === 0) return;
    
    const headers = [
      'Titre',
      'Description',
      'Durée (min)',
      'Sujets',
      'Public cible',
      'Date préférée',
      'Email',
      'Nom',
      'Status',
      'Date de création'
    ];
    
    const csvData = filteredProposals.map(proposal => [
      `"${proposal.title.replace(/"/g, '""')}"`,
      `"${proposal.description.replace(/"/g, '""')}"`,
      proposal.expectedDuration,
      `"${proposal.topics ? proposal.topics.join(', ') : ''}"`,
      `"${proposal.targetAudience || ''}"`,
      proposal.preferredDate || '',
      proposal.contactEmail,
      `"${proposal.userName}"`,
      proposal.status,
      proposal.createdAt ? new Date(proposal.createdAt.toDate()).toLocaleString() : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `propositions-ateliers-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Propositions d'ateliers</h1>
          <p className="text-gray-600 mt-2">
            Gérez les propositions d'ateliers soumises par les utilisateurs.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm" role="alert">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvés</option>
                  <option value="rejected">Rejetés</option>
                </select>
              </div>
              
              <div className="relative">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Rechercher
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par titre, sujet..."
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                />
              </div>
            </div>
            
            <div>
              <button
                onClick={exportToCSV}
                disabled={filteredProposals.length === 0}
                className={`flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  filteredProposals.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter CSV
              </button>
            </div>
          </div>
        </div>

        {/* Liste des propositions */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des propositions...</p>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune proposition</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune proposition ne correspond à vos critères de recherche.'
                  : 'Aucune proposition d\'atelier n\'a été soumise pour le moment.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProposals.map((proposal) => (
                <div key={proposal.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                    <div className="mb-4 sm:mb-0">
                      <div className="flex items-center">
                        <h2 className="text-xl font-semibold text-gray-900">{proposal.title}</h2>
                        <span 
                          className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(proposal.status)}`}
                        >
                          {getStatusText(proposal.status)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Soumis par {proposal.userName} • {proposal.createdAt?.toDate ? new Date(proposal.createdAt.toDate()).toLocaleString() : 'Date inconnue'}
                      </div>
                      
                      <div className="mt-2">
                        {proposal.topics && proposal.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proposal.topics.map((topic, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      {proposal.status !== 'approved' && (
                        <button
                          onClick={() => confirmStatusChange(proposal.id, 'approved')}
                          disabled={!!processing}
                          className={`px-2 py-1 rounded text-xs flex items-center ${
                            processing === proposal.id
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approuver
                        </button>
                      )}
                      
                      {proposal.status !== 'rejected' && (
                        <button
                          onClick={() => confirmStatusChange(proposal.id, 'rejected')}
                          disabled={!!processing}
                          className={`px-2 py-1 rounded text-xs flex items-center ${
                            processing === proposal.id
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Rejeter
                        </button>
                      )}
                      
                      {proposal.status !== 'pending' && (
                        <button
                          onClick={() => confirmStatusChange(proposal.id, 'pending')}
                          disabled={!!processing}
                          className={`px-2 py-1 rounded text-xs flex items-center ${
                            processing === proposal.id
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          En attente
                        </button>
                      )}
                      
                      <button
                        onClick={() => confirmDelete(proposal.id)}
                        disabled={!!processing}
                        className={`px-2 py-1 rounded text-xs flex items-center ${
                          processing === proposal.id
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                  
                  {/* Bouton pour afficher/masquer les détails */}
                  <button
                    onClick={() => toggleExpand(proposal.id)}
                    className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    {expandedProposals.includes(proposal.id) ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Masquer les détails
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Voir les détails
                      </>
                    )}
                  </button>
                  
                  {/* Détails de la proposition */}
                  {expandedProposals.includes(proposal.id) && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700 whitespace-pre-line mb-4">{proposal.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-start mb-2">
                            <Clock className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Durée estimée</h4>
                              <p className="text-sm text-gray-700">{proposal.expectedDuration} minutes</p>
                            </div>
                          </div>
                          
                          {proposal.targetAudience && (
                            <div className="flex items-start mb-2">
                              <User className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">Public cible</h4>
                                <p className="text-sm text-gray-700">{proposal.targetAudience}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          {proposal.preferredDate && (
                            <div className="flex items-start mb-2">
                              <Calendar className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">Date préférée</h4>
                                <p className="text-sm text-gray-700">{new Date(proposal.preferredDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-start mb-2">
                            <Mail className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Contact</h4>
                              <p className="text-sm text-gray-700">
                                <a href={`mailto:${proposal.contactEmail}`} className="text-blue-600 hover:underline flex items-center">
                                  {proposal.contactEmail}
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {proposal.notes && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Notes supplémentaires</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{proposal.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{modalTitle}</h3>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelAction}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkshopProposals;
