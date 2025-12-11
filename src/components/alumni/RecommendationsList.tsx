import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Send, ThumbsUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getReceivedRecommendations, sendRecommendation } from '../../services/alumniService';
import type { AlumniProfile, AlumniRecommendation } from '../../types/alumni';

interface RecommendationsListProps {
  profile: AlumniProfile;
  isOwnProfile?: boolean;
}

const RecommendationsList: React.FC<RecommendationsListProps> = ({ 
  profile, 
  isOwnProfile = false 
}) => {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState<AlumniRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecommendForm, setShowRecommendForm] = useState(false);
  const [recommendationText, setRecommendationText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const recs = await getReceivedRecommendations(profile.uid);
        setRecommendations(recs);
      } catch (error) {
        console.error('Erreur chargement recommandations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [profile.uid]);

  const handleSubmitRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !recommendationText.trim()) return;

    setSubmitting(true);
    try {
      await sendRecommendation({
        fromUid: currentUser.uid,
        fromName: currentUser.displayName || 'Anonyme',
        toUid: profile.uid,
        toName: profile.name,
        message: recommendationText.trim(),
      });

      setRecommendationText('');
      setShowRecommendForm(false);
      
      // Recharger les recommandations
      const updatedRecs = await getReceivedRecommendations(profile.uid);
      setRecommendations(updatedRecs);
    } catch (error) {
      console.error('Erreur envoi recommandation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-600" />
          Recommandations ({recommendations.length})
        </h3>
        
        {/* Bouton pour recommander (si ce n'est pas son propre profil) */}
        {!isOwnProfile && currentUser && currentUser.uid !== profile.uid && (
          <button
            onClick={() => setShowRecommendForm(!showRecommendForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <ThumbsUp className="w-4 h-4" />
            Recommander
          </button>
        )}
      </div>

      {/* Formulaire de recommandation */}
      {showRecommendForm && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <form onSubmit={handleSubmitRecommendation}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ta recommandation pour {profile.name}
              </label>
              <textarea
                value={recommendationText}
                onChange={(e) => setRecommendationText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Partage ton expérience avec cette personne..."
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting || !recommendationText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Envoi...' : 'Envoyer'}
              </button>
              <button
                type="button"
                onClick={() => setShowRecommendForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des recommandations */}
      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            {isOwnProfile 
              ? "Tu n'as pas encore reçu de recommandations"
              : `${profile.name} n'a pas encore reçu de recommandations`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="border-l-4 border-yellow-500 pl-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{rec.fromName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(rec.date.toDate()).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 italic">"{rec.message}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badge d'endorsements */}
      {profile.endorsementCount && profile.endorsementCount > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <ThumbsUp className="w-4 h-4" />
            <span>
              <strong>{profile.endorsementCount}</strong> personne{profile.endorsementCount > 1 ? 's' : ''} 
              {' '}recommande{profile.endorsementCount > 1 ? 'nt' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsList;
