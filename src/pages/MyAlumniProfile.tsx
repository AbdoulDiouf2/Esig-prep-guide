import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Linkedin, Github, Twitter, Globe, Building2, MapPin, Briefcase,
  Award, Calendar, CheckCircle, Clock, XCircle, Edit, Trash2, Users,
  AlertCircle, Mail, GraduationCap, Star, Heart, Package,
  User, ExternalLink, Layers, BadgeCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAlumniProfile, deleteAlumniProfile } from '../services/alumniService';
import type { AlumniProfile } from '../types/alumni';
import ConfirmationModal from '../components/ConfirmationModal';
import ProfileCoverHeader from '../components/profile/ProfileCoverHeader';

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
      setShowSuccessModal(true);
      setTimeout(() => navigate('/applications'), 2000);
    } catch {
      setError('Erreur lors de la suppression du profil');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50 py-16">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10">
            <Users className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun profil alumni</h2>
            <p className="text-gray-500 text-sm mb-6">Créez votre profil pour rejoindre l'annuaire et le réseau CPS Connect.</p>
            <Link
              to="/complete-alumni-profile"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm transition-colors"
            >
              Créer mon profil alumni
            </Link>
            <div className="mt-4">
              <Link to="/profile" className="text-sm text-blue-600 hover:text-blue-800">← Mon compte</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Config statut
  type StatusConfig = {
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeBg: string;
    badgeText: string;
    title: string;
    message: string;
  };

  const statusConfig: StatusConfig = (() => {
    switch (profile.status) {
      case 'approved': return {
        icon: <CheckCircle className="w-4 h-4" />,
        bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700',
        badgeBg: 'bg-green-100', badgeText: 'text-green-800',
        title: 'Profil approuvé', message: "Votre profil est visible dans l'annuaire alumni.",
      };
      case 'rejected': return {
        icon: <XCircle className="w-4 h-4" />,
        bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700',
        badgeBg: 'bg-red-100', badgeText: 'text-red-800',
        title: 'Profil rejeté', message: 'Votre profil a été rejeté. Modifiez-le et soumettez-le à nouveau.',
      };
      case 'draft': return {
        icon: <AlertCircle className="w-4 h-4" />,
        bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700',
        badgeBg: 'bg-blue-100', badgeText: 'text-blue-800',
        title: 'Brouillon', message: "Profil non soumis. Complétez-le et soumettez-le pour validation.",
      };
      default: return {
        icon: <Clock className="w-4 h-4" />,
        bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700',
        badgeBg: 'bg-amber-100', badgeText: 'text-amber-800',
        title: 'En attente de validation', message: "Votre profil est en cours de validation par un administrateur.",
      };
    }
  })();

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const completeness = profile.profileCompleteness ?? 0;

  const coverSubtitle = [
    profile.headline,
    profile.yearPromo ? `Promo ${profile.yearPromo}` : null,
    profile.city && profile.country ? `${profile.city}, ${profile.country}` : (profile.country || profile.city),
  ].filter(Boolean).join(' · ');

  const statusBadge = (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.badgeBg} ${statusConfig.badgeText}`}>
      {statusConfig.icon} {statusConfig.title}
    </span>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Cover header */}
        <ProfileCoverHeader
          name={profile.name}
          subtitle={coverSubtitle}
          photoURL={profile.photo}
          initials={getInitials(profile.name)}
          badge={statusBadge}
          actions={
            <>
              <Link
                to="/edit-alumni-profile"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" /> Modifier
              </Link>
              {profile.status === 'approved' && (
                <Link
                  to={`/alumni/${profile.uid}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-300 text-gray-700 bg-white text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voir profil public <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-300 text-gray-700 bg-white text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Mon compte
              </Link>
            </>
          }
        />

        {/* Bannière statut (sauf approved) */}
        {profile.status !== 'approved' && (
          <div className={`${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-xl p-4 mb-6 flex items-start gap-3`}>
            <span className={statusConfig.textColor}>{statusConfig.icon}</span>
            <div className="flex-1">
              <p className={`text-sm font-medium ${statusConfig.textColor}`}>{statusConfig.message}</p>
              {profile.status === 'rejected' && profile.rejectionReason && (
                <div className="mt-2 p-3 bg-white rounded-lg border border-red-200 text-sm text-gray-700">
                  <span className="font-medium">Raison :</span> {profile.rejectionReason}
                </div>
              )}
              {profile.status === 'pending' && (
                <p className="text-xs mt-1 text-amber-600">La validation peut prendre quelques jours. Vous serez notifié par email.</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* === SIDEBAR === */}
          <div className="space-y-4">

            {/* Complétude */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Complétude</h2>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-blue-900">{completeness}%</span>
                {completeness === 100 && <BadgeCheck className="w-5 h-5 text-green-500" />}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-800 rounded-full h-2 transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              {completeness < 100 && (
                <Link to="/edit-alumni-profile" className="mt-3 block text-xs text-blue-600 hover:text-blue-800">
                  Compléter mon profil →
                </Link>
              )}
            </div>

            {/* Coordonnées */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Coordonnées</h2>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </li>
                {(profile.city || profile.country) && (
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    {[profile.city, profile.country].filter(Boolean).join(', ')}
                  </li>
                )}
                {profile.company && (
                  <li className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                    {profile.company}
                    {profile.position && <span className="text-gray-400">· {profile.position}</span>}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  Promo {profile.yearPromo}
                </li>
                {profile.availability && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {profile.availability}
                  </li>
                )}
              </ul>
            </div>

            {/* Liens sociaux */}
            {(profile.linkedin || profile.github || profile.twitter || profile.personalWebsite || profile.companyWebsite) && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Liens</h2>
                <div className="flex flex-col gap-2">
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                      <Github className="w-4 h-4" /> GitHub
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-sky-700 hover:text-sky-900">
                      <Twitter className="w-4 h-4" /> Twitter
                    </a>
                  )}
                  {profile.personalWebsite && (
                    <a href={profile.personalWebsite} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900">
                      <Globe className="w-4 h-4" /> Site personnel
                    </a>
                  )}
                  {profile.companyWebsite && (
                    <a href={profile.companyWebsite} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-orange-700 hover:text-orange-900">
                      <Building2 className="w-4 h-4" /> Site entreprise
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Actions annuaire */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Annuaire</h2>
              <Link
                to="/alumni"
                className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
              >
                <Users className="w-4 h-4" /> Voir l'annuaire
              </Link>
            </div>

            {/* Zone danger */}
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-red-600 mb-2">Zone de danger</h2>
              <p className="text-xs text-gray-500 mb-3">Suppression définitive et irréversible.</p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer mon profil
              </button>
            </div>
          </div>

          {/* === MAIN CONTENT === */}
          <div className="lg:col-span-2 space-y-4">

            {/* Empty state si profil vide */}
            {!profile.bio && (!profile.experiences || profile.experiences.length === 0) && (!profile.education || profile.education.length === 0) && (!profile.expertise || profile.expertise.length === 0) && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Edit className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Profil incomplet</h3>
                <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                  Ajoutez vos expériences, compétences et informations pour rendre votre profil visible dans l'annuaire.
                </p>
                <Link
                  to="/edit-alumni-profile"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" /> Compléter mon profil
                </Link>
              </div>
            )}

            {/* À propos */}
            {profile.bio && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">À propos</h2>
                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Expériences */}
            {profile.experiences && profile.experiences.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Expériences
                </h2>
                <div className="space-y-4">
                  {profile.experiences.map((exp, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1 bg-blue-200 rounded-full shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{exp.role}</p>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {exp.startDate} – {exp.isCurrent ? "Aujourd'hui" : exp.endDate}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Éducation */}
            {profile.education && profile.education.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" /> Parcours académique
                </h2>
                <div className="space-y-4">
                  {profile.education.map((edu, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1 bg-purple-200 rounded-full shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {edu.degree ? `${edu.degree}` : ''}{edu.degree && edu.school ? ' · ' : ''}{edu.school}
                        </p>
                        {edu.field && <p className="text-sm text-gray-600">{edu.field}</p>}
                        {(edu.startDate || edu.endDate) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {edu.startDate} – {edu.isCurrent ? "Aujourd'hui" : edu.endDate}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compétences & secteurs */}
            {((profile.sectors && profile.sectors.length > 0) || (profile.expertise && profile.expertise.length > 0)) && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" /> Compétences & Secteurs
                </h2>
                {profile.sectors && profile.sectors.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Secteurs</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.sectors.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.expertise && profile.expertise.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.expertise.map((e, i) => (
                        <span key={i} className="px-3 py-1 bg-zinc-100 text-gray-700 rounded-full text-xs font-medium">{e}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Soft skills */}
            {profile.softSkills && profile.softSkills.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" /> Soft Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.softSkills.map((s, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" /> Certifications
                </h2>
                <div className="space-y-3">
                  {profile.certifications.map((cert, i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                        <p className="text-xs text-gray-500">{cert.issuer} · {cert.date}</p>
                      </div>
                      {cert.url && (
                        <a href={cert.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 shrink-0">
                          Voir →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Langues */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" /> Langues
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {profile.languages.map((lang, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{lang.name}</span>
                      <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{lang.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {profile.portfolio && profile.portfolio.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-600" /> Portfolio
                </h2>
                <div className="space-y-4">
                  {profile.portfolio.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1 bg-orange-200 rounded-full shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-orange-600 hover:text-orange-800 mt-1 inline-flex items-center gap-1">
                            Voir le projet <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Centres d'intérêt */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" /> Centres d'intérêt
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((int, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">{int}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Je cherche / Je propose */}
            {((profile.seeking && profile.seeking.length > 0) || (profile.offering && profile.offering.length > 0)) && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Networking
                </h2>
                {profile.seeking && profile.seeking.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Je cherche</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.seeking.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.offering && profile.offering.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Je propose</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.offering.map((o, i) => (
                        <span key={i} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">{o}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProfile}
        title="Supprimer votre profil alumni ?"
        message="Cette action est irréversible. Votre profil sera définitivement supprimé de l'annuaire."
        confirmButtonText={deleting ? 'Suppression...' : 'Oui, supprimer'}
        cancelButtonText="Annuler"
        type="danger"
      />
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Profil supprimé"
        message="Votre profil alumni a été supprimé. Redirection en cours..."
        type="success"
      />
    </div>
  );
};

export default MyAlumniProfile;
