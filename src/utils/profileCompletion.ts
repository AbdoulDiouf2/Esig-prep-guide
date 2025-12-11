import { AlumniProfile } from '../types/alumni';

/**
 * Calcule le pourcentage de complétion d'un profil alumni
 * Basé sur les champs remplis vs les champs disponibles
 */
export const calculateProfileCompletion = (profile: AlumniProfile): number => {
  const fields = {
    // Champs obligatoires (toujours remplis, mais comptés)
    name: !!profile.name,
    email: !!profile.email,
    yearPromo: !!profile.yearPromo,
    
    // Champs importants (poids plus élevé)
    headline: !!profile.headline && profile.headline.trim().length > 0,
    bio: !!profile.bio && profile.bio.trim().length > 20, // Au moins 20 caractères
    photo: !!profile.photo,
    
    // Secteurs & Expertise
    sectors: profile.sectors && profile.sectors.length > 0,
    expertise: profile.expertise && profile.expertise.length > 0,
    
    // Professionnel
    company: !!profile.company && profile.company.trim().length > 0,
    position: !!profile.position && profile.position.trim().length > 0,
    
    // Localisation
    location: (!!profile.city && profile.city.trim().length > 0) || 
              (!!profile.country && profile.country.trim().length > 0),
    
    // Réseaux sociaux et sites web (au moins un)
    socialMedia: !!profile.linkedin || !!profile.github || !!profile.twitter || 
                 !!profile.personalWebsite || !!profile.companyWebsite,
    
    // Portfolio
    portfolio: profile.portfolio && profile.portfolio.length > 0,
    
    // Services
    services: profile.services && profile.services.length > 0,
    
    // Je cherche / Je propose
    seekingOffering: (profile.seeking && profile.seeking.length > 0) || 
                     (profile.offering && profile.offering.length > 0),
    
    // NOUVEAUX CHAMPS ENRICHIS
    
    // Soft Skills
    softSkills: profile.softSkills && profile.softSkills.length > 0,
    
    // Langues
    languages: profile.languages && profile.languages.length > 0,
    
    // Centres d'intérêt
    interests: profile.interests && profile.interests.length > 0,
    
    // Éducation
    education: profile.education && profile.education.length > 0,
    
    // Expériences professionnelles
    experiences: profile.experiences && profile.experiences.length > 0,
    
    // Certifications
    certifications: profile.certifications && profile.certifications.length > 0,
    
    // Disponibilité
    availability: !!profile.availability && profile.availability.trim().length > 0,
    
    // Détails "Je cherche / Je propose"
    seekingDetails: !!profile.seekingDetails && profile.seekingDetails.trim().length > 10,
    
    // Tarifs si services payants
    rateIfPaid: !!profile.rateIfPaid && profile.rateIfPaid.trim().length > 0,
    
    // Confidentialité (bonus si configuré)
    visibilityConfigured: !!profile.visibility && (
      profile.visibility.showEmail !== undefined ||
      profile.visibility.showCity !== undefined ||
      profile.visibility.showCompany !== undefined
    ),
  };

  // Compter les champs remplis
  const filledFields = Object.values(fields).filter(Boolean).length;
  const totalFields = Object.keys(fields).length;

  // Calculer le pourcentage
  const percentage = Math.round((filledFields / totalFields) * 100);

  return percentage;
};

/**
 * Retourne les suggestions pour améliorer le profil
 */
export const getProfileSuggestions = (profile: AlumniProfile): string[] => {
  const suggestions: string[] = [];

  if (!profile.headline || profile.headline.trim().length === 0) {
    suggestions.push('Ajoute un titre professionnel pour te présenter en un coup d\'œil');
  }

  if (!profile.bio || profile.bio.trim().length < 20) {
    suggestions.push('Rédige une bio détaillée pour que les autres alumni te connaissent mieux');
  }

  if (!profile.photo) {
    suggestions.push('Ajoute une photo de profil pour humaniser ton profil');
  }

  if (!profile.sectors || profile.sectors.length === 0) {
    suggestions.push('Indique tes secteurs d\'activité pour être trouvé plus facilement');
  }

  if (!profile.expertise || profile.expertise.length === 0) {
    suggestions.push('Ajoute tes expertises pour montrer tes compétences');
  }

  if (!profile.company || profile.company.trim().length === 0) {
    suggestions.push('Renseigne ton entreprise actuelle');
  }

  if (!profile.position || profile.position.trim().length === 0) {
    suggestions.push('Indique ton poste actuel');
  }

  if (!profile.city && !profile.country) {
    suggestions.push('Ajoute ta localisation pour faciliter le networking local');
  }

  if (!profile.linkedin && !profile.github && !profile.twitter && 
      !profile.personalWebsite && !profile.companyWebsite) {
    suggestions.push('Ajoute au moins un lien vers tes réseaux sociaux ou ton site web');
  }

  if (!profile.seeking || profile.seeking.length === 0) {
    suggestions.push('Indique ce que tu cherches (collaborateur, mentor, opportunité...)');
  }

  if (!profile.offering || profile.offering.length === 0) {
    suggestions.push('Indique ce que tu proposes (conseil, mentorat, service...)');
  }

  if (!profile.portfolio || profile.portfolio.length === 0) {
    suggestions.push('Ajoute des projets à ton portfolio pour valoriser ton travail');
  }

  // NOUVELLES SUGGESTIONS POUR LES CHAMPS ENRICHIS

  if (!profile.softSkills || profile.softSkills.length === 0) {
    suggestions.push('Ajoute tes soft skills (communication, leadership, etc.) pour montrer tes qualités humaines');
  }

  if (!profile.languages || profile.languages.length === 0) {
    suggestions.push('Indique les langues que tu parles pour élargir tes opportunités');
  }

  if (!profile.interests || profile.interests.length === 0) {
    suggestions.push('Partage tes centres d\'intérêt pour créer des connexions personnelles');
  }

  if (!profile.education || profile.education.length === 0) {
    suggestions.push('Ajoute ton parcours éducatif pour valoriser ta formation');
  }

  if (!profile.experiences || profile.experiences.length === 0) {
    suggestions.push('Décris tes expériences professionnelles pour montrer ton parcours');
  }

  if (!profile.certifications || profile.certifications.length === 0) {
    suggestions.push('Ajoute tes certifications pour valider tes compétences officiellement');
  }

  if (!profile.availability || profile.availability.trim().length === 0) {
    suggestions.push('Indique ta disponibilité (freelance, ouvert à opportunités, etc.)');
  }

  if (!profile.seekingDetails || profile.seekingDetails.trim().length < 10) {
    suggestions.push('Décris en détail ce que tu cherches pour attirer les bonnes opportunités');
  }

  if (!profile.rateIfPaid || profile.rateIfPaid.trim().length === 0) {
    suggestions.push('Indique tes tarifs si tu proposes des services payants');
  }

  return suggestions;
};

/**
 * Retourne un message motivant selon le niveau de complétion
 */
export const getCompletionMessage = (percentage: number): { message: string; color: string } => {
  if (percentage >= 90) {
    return {
      message: '🎉 Excellent ! Ton profil est presque parfait !',
      color: 'text-green-600',
    };
  } else if (percentage >= 70) {
    return {
      message: '👍 Très bien ! Quelques détails en plus et ce sera parfait !',
      color: 'text-blue-600',
    };
  } else if (percentage >= 50) {
    return {
      message: '💪 Bon début ! Continue de compléter ton profil !',
      color: 'text-yellow-600',
    };
  } else if (percentage >= 30) {
    return {
      message: '🚀 C\'est un bon début ! Ajoute plus d\'infos pour être visible !',
      color: 'text-orange-600',
    };
  } else {
    return {
      message: '📝 Commence par remplir les informations essentielles !',
      color: 'text-red-600',
    };
  }
};
