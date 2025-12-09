import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Briefcase, Award, Linkedin, Github, Twitter, 
  ExternalLink, Mail, ArrowLeft, Package, Users, MessageCircle, Globe, Building2 
} from 'lucide-react';
import { getAlumniProfile } from '../services/alumniService';
import { useAuth } from '../contexts/AuthContext';
import ContactRequestForm from '../components/alumni/ContactRequestForm';
import type { AlumniProfile } from '../types/alumni';

const AlumniDetail: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!uid) {
        setError('ID du profil manquant');
        setLoading(false);
        return;
      }

      try {
        const data = await getAlumniProfile(uid);
        if (!data || data.status !== 'approved') {
          setError('Profil non trouvé ou non publié');
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [uid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
            <p className="text-red-700">{error || 'Profil non trouvé'}</p>
          </div>
          <button
            onClick={() => navigate('/alumni')}
            className="mt-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'annuaire
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bouton retour */}
        <Link
          to="/alumni"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'annuaire
        </Link>

        {/* Header avec photo et infos principales */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Infos principales */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.name}
              </h1>
              {profile.headline && (
                <p className="text-xl text-gray-700 mb-3">
                  {profile.headline}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                {profile.company && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>
                      {profile.position ? `${profile.position} chez ` : ''}{profile.company}
                    </span>
                  </div>
                )}
                {(profile.city || profile.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Promo {profile.yearPromo}</span>
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div className="flex gap-3">
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-50 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                    title="GitHub"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={profile.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-50 text-blue-400 rounded-full hover:bg-blue-100 transition-colors"
                    title="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {profile.personalWebsite && (
                  <a
                    href={profile.personalWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors"
                    title="Site web personnel"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {profile.companyWebsite && (
                  <a
                    href={profile.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
                    title="Site web de l'entreprise"
                  >
                    <Building2 className="w-5 h-5" />
                  </a>
                )}
                <a
                  href={`mailto:${profile.email}`}
                  className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                  title="Envoyer un email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">À propos</h2>
            <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
          </div>
        )}

        {/* Secteurs & Expertise */}
        {((profile.sectors && profile.sectors.length > 0) || (profile.expertise && profile.expertise.length > 0)) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Secteurs & Expertise
            </h2>
            
            {profile.sectors && profile.sectors.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Secteurs d'activité</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.sectors.map((sector, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.expertise && profile.expertise.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Compétences</h3>
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

        {/* Entreprise */}
        {(profile.company || profile.companyDescription || profile.companyWebsite) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Entreprise actuelle
            </h2>
            {profile.company && (
              <div className="mb-2">
                <span className="font-medium text-gray-900">{profile.company}</span>
                {profile.position && <span className="text-gray-600"> - {profile.position}</span>}
              </div>
            )}
            {profile.companyDescription && (
              <p className="text-gray-700 mt-2">{profile.companyDescription}</p>
            )}
            {profile.companyWebsite && (
              <a
                href={profile.companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 mt-2"
              >
                <ExternalLink className="w-4 h-4" />
                Visiter le site web
              </a>
            )}
          </div>
        )}

        {/* Portfolio */}
        {profile.portfolio && profile.portfolio.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Portfolio
            </h2>
            <div className="space-y-4">
              {profile.portfolio.map((item, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-700 mt-1">{item.description}</p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-2 text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Voir le projet
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {profile.services && profile.services.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Services offerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.services.map((service, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  {service.category && (
                    <span className="text-xs text-gray-500">{service.category}</span>
                  )}
                  <p className="text-gray-700 text-sm mt-2">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Je cherche / Je propose */}
        {((profile.seeking && profile.seeking.length > 0) || (profile.offering && profile.offering.length > 0)) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Je cherche / Je propose
            </h2>
            
            {profile.seeking && profile.seeking.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">🔍 Je cherche</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.seeking.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.offering && profile.offering.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">💡 Je propose</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.offering.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section de contact */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contacter {profile.name.split(' ')[0]}</h2>
          
          {currentUser && currentUser.uid !== profile.uid ? (
            <>
              {!showContactForm ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Demander un contact / une intro
                  </button>
                  <a
                    href={`mailto:${profile.email}?subject=Contact depuis l'annuaire CPS Connect`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                  >
                    <Mail className="w-5 h-5" />
                    Envoyer un email direct
                  </a>
                </div>
              ) : (
                <div>
                  <ContactRequestForm
                    targetProfile={profile}
                    onClose={() => setShowContactForm(false)}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-600">
              <p>Vous consultez votre propre profil.</p>
              <Link
                to="/my-alumni-profile"
                className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-800 font-medium"
              >
                Modifier mon profil →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniDetail;
