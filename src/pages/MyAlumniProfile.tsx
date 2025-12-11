import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Linkedin, Github, Twitter, Globe, Building2, MapPin, Briefcase, Award, Calendar, CheckCircle, Clock, XCircle, Edit, Trash2, Users, AlertCircle, Mail,
  GraduationCap, Star, Heart, Package, MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAlumniProfile, deleteAlumniProfile } from '../services/alumniService';
// import RecommendationsList from '../components/alumni/RecommendationsList'; // Désactivé temporairement
import type { AlumniProfile } from '../types/alumni';
import ConfirmationModal from '../components/ConfirmationModal';

const MyAlumniProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;

      try {
        const data = await getAlumniProfile(currentUser.uid);
        setProfile(data);
      } catch (err) {
        console.error('Erreur chargement profil:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleDeleteProfile = async () => {
    if (!currentUser || !profile) return;

    setDeleting(true);
    try {
      await deleteAlumniProfile(profile.uid);
      setShowDeleteModal(false);
      
      // Afficher le modal de succès
      setShowSuccessModal(true);
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/applications');
      }, 2000);
    } catch (error) {
      console.error('Erreur suppression profil:', error);
      setError('Erreur lors de la suppression du profil');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Aucun profil alumni
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore créé votre profil alumni.
            </p>
            <Link
              to="/complete-alumni-profile"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Créer mon profil alumni
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Déterminer le statut et les couleurs
  const getStatusConfig = () => {
    switch (profile.status) {
      case 'draft':
        return {
          icon: <AlertCircle className="w-6 h-6" />,
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-600',
          textColor: 'text-blue-700',
          title: 'Profil en brouillon',
          message: 'Votre profil n\'a pas encore été soumis. Complétez-le et soumettez-le pour validation.',
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-600',
          textColor: 'text-green-700',
          title: 'Profil approuvé',
          message: 'Votre profil est visible dans l\'annuaire alumni !',
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-6 h-6" />,
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-600',
          textColor: 'text-red-700',
          title: 'Profil rejeté',
          message: 'Votre profil a été rejeté. Veuillez le modifier et le soumettre à nouveau.',
        };
      default: // pending
        return {
          icon: <Clock className="w-6 h-6" />,
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-600',
          textColor: 'text-yellow-700',
          title: 'En attente de validation',
          message: 'Votre profil est en cours de validation par un administrateur.',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mon profil alumni</h1>
          <p className="mt-2 text-gray-600">
            Gérez votre profil et consultez son statut de validation
          </p>
        </div>

        {/* Statut */}
        <div className={`${statusConfig.bgColor} border-l-4 ${statusConfig.borderColor} p-4 rounded mb-6`}>
          <div className="flex items-start">
            <div className={statusConfig.textColor}>
              {statusConfig.icon}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-lg font-medium ${statusConfig.textColor}`}>
                {statusConfig.title}
              </h3>
              <p className={`mt-1 ${statusConfig.textColor}`}>
                {statusConfig.message}
              </p>
              {profile.status === 'rejected' && profile.rejectionReason && (
                <div className="mt-3 p-3 bg-white rounded border border-red-200">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Raison du rejet :
                  </p>
                  <p className="text-sm text-gray-700">{profile.rejectionReason}</p>
                </div>
              )}
            </div>
            <Link
              to="/edit-alumni-profile"
              className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </Link>
          </div>
        </div>

        {/* Informations du profil */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start gap-6 mb-6">
            {/* Photo */}
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {(() => {
                  const nameParts = profile.name.trim().split(' ');
                  if (nameParts.length >= 2) {
                    // Prendre première lettre du prénom et première lettre du nom
                    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
                  } else if (nameParts.length === 1 && nameParts[0].length > 0) {
                    // Si un seul mot, prendre les deux premières lettres si possible
                    return nameParts[0].length >= 2 
                      ? nameParts[0].substring(0, 2).toUpperCase()
                      : nameParts[0].charAt(0).toUpperCase();
                  }
                  return profile.name.charAt(0).toUpperCase();
                })()}
              </div>
            )}

            {/* Infos principales */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {profile.name}
              </h2>
              {profile.headline && (
                <p className="text-lg text-gray-700 mb-3">{profile.headline}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Promo {profile.yearPromo}</span>
                </div>
                {profile.company && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{profile.company}</span>
                  </div>
                )}
                {(profile.city || profile.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Poste actuel */}
              {profile.position && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">Poste actuel</p>
                  <p className="text-gray-900">{profile.position}</p>
                </div>
              )}

              {/* Liens sociaux */}
              {(profile.linkedin || profile.github || profile.twitter || profile.personalWebsite || profile.companyWebsite) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {profile.linkedin && (
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-sm"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                  {profile.github && (
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 text-sm"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                  {profile.twitter && (
                    <a
                      href={profile.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-700 rounded-md hover:bg-sky-100 text-sm"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </a>
                  )}
                  {profile.personalWebsite && (
                    <a
                      href={profile.personalWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 text-sm"
                    >
                      <Globe className="w-4 h-4" />
                      Site web personnel
                    </a>
                  )}
                  {profile.companyWebsite && (
                    <a
                      href={profile.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 text-sm"
                    >
                      <Building2 className="w-4 h-4" />
                      Site de l'entreprise
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">À propos</h3>
              <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
            </div>
          )}

          {/* Secteurs & Expertise */}
          {((profile.sectors && profile.sectors.length > 0) || (profile.expertise && profile.expertise.length > 0)) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Secteurs & Expertise
              </h3>
              
              {profile.sectors && profile.sectors.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Secteurs</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.sectors.map((sector, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.expertise && profile.expertise.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Compétences</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.expertise.map((exp, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-50 text-green-700 rounded text-sm"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Soft Skills */}
          {profile.softSkills && profile.softSkills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Compétences transversales (Soft Skills)
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.softSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Langues */}
          {profile.languages && profile.languages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Langues parlées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.languages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-900">{lang.name}</span>
                    <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {lang.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Centres d'intérêt */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Centres d'intérêt
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Éducation */}
          {profile.education && profile.education.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                Parcours académique
              </h3>
              <div className="space-y-3">
                {profile.education.map((edu, index) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-gray-900">
                      {edu.degree && `${edu.degree} - `}{edu.school}
                    </h4>
                    {edu.field && (
                      <p className="text-gray-600 text-sm mt-1">{edu.field}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {edu.startDate} - {edu.isCurrent ? 'Aujourd\'hui' : edu.endDate}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {profile.portfolio && profile.portfolio.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Portfolio
              </h3>
              <div className="space-y-3">
                {profile.portfolio.map((item, index) => (
                  <div key={index} className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-gray-700 text-sm mt-1">{item.description}</p>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-800 text-sm mt-2 inline-block"
                      >
                        Voir le projet →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/edit-alumni-profile"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              <Edit className="w-5 h-5" />
              Modifier mon profil
            </Link>
            
            {profile.status === 'approved' && (
              <Link
                to={`/alumni/${profile.uid}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Voir mon profil public
              </Link>
            )}
            
            <Link
              to="/alumni"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              <Users className="w-5 h-5" />
              Voir l'annuaire
            </Link>
          </div>

          {/* Section suppression */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Zone de danger</h4>
            <p className="text-sm text-gray-600 mb-3">
              La suppression de votre profil est définitive et irréversible. Vous ne serez plus visible dans l'annuaire.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer mon profil alumni
            </button>
          </div>
        </div>

        {/* Recommandations reçues - Désactivé temporairement */}
        <div className="bg-white rounded-lg shadow-md p-6 opacity-75">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Recommandations reçues
            </h3>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              Bientôt disponible
            </span>
          </div>
          
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">
              Le système de recommandations sera bientôt disponible !
            </p>
            <p className="text-sm text-gray-400">
              Cette fonctionnalité sera activée en fonction de l'avancement de la plateforme.
            </p>
          </div>
        </div>

        {/* Info supplémentaire */}
        {profile.status === 'pending' && (
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Bon à savoir :</strong> La validation peut prendre quelques jours. 
                  Vous serez notifié par email dès que votre profil sera validé.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProfile}
        title="Supprimer votre profil alumni ?"
        message="Cette action est irréversible. Votre profil sera définitivement supprimé de l'annuaire et toutes vos informations seront perdues. Êtes-vous sûr de vouloir continuer ?"
        confirmButtonText={deleting ? "Suppression..." : "Oui, supprimer mon profil"}
        cancelButtonText="Annuler"
        type="danger"
      />

      {/* Modal de succès après suppression */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Profil supprimé avec succès"
        message="Votre profil alumni a été supprimé définitivement. Vous allez être redirigé vers le tableau de bord..."
        type="success"
      />
    </div>
  );
};

export default MyAlumniProfile;
