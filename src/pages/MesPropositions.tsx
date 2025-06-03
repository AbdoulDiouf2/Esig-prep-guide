import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { ArrowLeft, ClipboardList, Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// Interface pour les propositions d'ateliers
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
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

const MesPropositions: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<WorkshopProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Rediriger si non connecté
    if (!currentUser) {
      navigate('/login', { state: { from: '/mes-propositions' } });
      return;
    }

    const fetchUserProposals = async () => {
      try {
        setLoading(true);
        
        // Requête simplifiée en attendant la création de l'index
        const q = query(
          collection(db, 'workshopProposals'),
          where('userId', '==', currentUser.uid)
          // orderBy('createdAt', 'desc') - temporairement désactivé en attendant la création de l'index
        );
        
        const querySnapshot = await getDocs(q);
        const userProposals: WorkshopProposal[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<WorkshopProposal, 'id'>;
          userProposals.push({
            id: doc.id,
            ...data,
          });
        });
        
        // Tri côté client en attendant l'index
        userProposals.sort((a, b) => {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
        
        setProposals(userProposals);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des propositions:', error);
        setError('Une erreur est survenue lors de la récupération de vos propositions.');
        setLoading(false);
      }
    };

    fetchUserProposals();
  }, [currentUser, navigate]);

  // Fonction pour afficher un badge coloré selon le statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvée
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejetée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
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
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Mes propositions d'ateliers</h1>
          <p className="text-gray-600 mt-2">
            Consultez l'état de vos propositions d'ateliers soumises.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : proposals.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {proposals.map((proposal) => (
                <li key={proposal.id}>
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{proposal.title}</h3>
                        <div className="mt-1">{getStatusBadge(proposal.status)}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {proposal.createdAt && (
                          <p>Soumise le {proposal.createdAt.toDate().toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-500 line-clamp-2">
                      {proposal.description}
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">Durée: {proposal.expectedDuration}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">
                          {proposal.preferredDate ? `Date préférée: ${proposal.preferredDate}` : 'Aucune date préférée'}
                        </span>
                      </div>
                    </div>
                    
                    {proposal.topics && proposal.topics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {proposal.topics.map((topic, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {proposal.status === 'rejected' && (
                      <div className="mt-4 p-3 bg-red-50 rounded-md">
                        <p className="text-sm text-red-700">
                          Votre proposition a été refusée. Si vous souhaitez proposer une version améliorée, vous pouvez soumettre une nouvelle proposition.
                        </p>
                      </div>
                    )}
                    
                    {proposal.status === 'approved' && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md">
                        <p className="text-sm text-green-700">
                          Félicitations ! Votre proposition a été acceptée. Un membre de l'équipe vous contactera prochainement pour discuter des détails.
                        </p>
                      </div>
                    )}
                    
                    {proposal.status === 'pending' && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                        <p className="text-sm text-yellow-700">
                          Votre proposition est en cours d'examen. Nous vous informerons dès qu'une décision sera prise.
                        </p>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune proposition</h3>
            <p className="mt-1 text-gray-500">Vous n'avez pas encore soumis de proposition d'atelier.</p>
            <button
              onClick={() => navigate('/proposer-atelier')}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Proposer un atelier
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MesPropositions;
