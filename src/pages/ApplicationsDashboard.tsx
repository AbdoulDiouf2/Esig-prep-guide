import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAlumniProfile } from '../services/alumniService';
import NewProfilesHighlight from '../components/alumni/NewProfilesHighlight';
import type { AlumniProfile } from '../types/alumni';
import { 
  BookOpen, 
  FileText, 
  HelpCircle, 
  MessageSquare,
  Users,
  BarChart2,
  Settings,
  Shield,
  Bell,
  Clock,
  Briefcase,
  Zap,
  Database,
  Star,
  Activity,
  Video,
  Map,
  Plane,
  Hotel,
  Bot,
  Download,
  Globe,
  Server,
  CalendarCheck,
  Phone,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface AppFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  roles: string[]; // admin, editor, user
  disabled?: boolean;
  comingSoon?: boolean;
}

interface CategoryFeatures {
  [key: string]: {
    title: string;
    icon: React.ReactNode;
    features: AppFeature[];
  }
}

const ApplicationsDashboard: React.FC = () => {
  const { currentUser, isAdmin, isEditor, isSuperAdmin } = useAuth();
  const [isSuperAdminState, setIsSuperAdminState] = useState(false);
  const [activeCategory, setActiveCategory] = useState('mentorship');
  const [alumniProfile, setAlumniProfile] = useState<AlumniProfile | null>(null);
  const [loadingAlumni, setLoadingAlumni] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Définir la catégorie par défaut selon le profil utilisateur
  useEffect(() => {
    if (currentUser) {
      if (isAdmin()) {
        setActiveCategory('admin');
      } else if (isEditor() && !isAdmin()) {
        setActiveCategory('editor');
      } else {
        setActiveCategory('mentorship'); // Alumni par défaut pour les utilisateurs simples
      }
    }
  }, [currentUser, isAdmin, isEditor]);

  // Vérifier si l'utilisateur est superadmin
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (currentUser) {
        try {
          const superAdminStatus = await isSuperAdmin();
          setIsSuperAdminState(superAdminStatus);
        } catch (error) {
          console.error("Erreur lors de la vérification du statut superadmin:", error);
        }
      }
    };

    checkSuperAdmin();
  }, [currentUser, isSuperAdmin]);

  // Vérifier si l'utilisateur a un profil alumni
  useEffect(() => {
    const checkAlumniProfile = async () => {
      if (currentUser) {
        try {
          const profile = await getAlumniProfile(currentUser.uid);
          setAlumniProfile(profile);
        } catch (error) {
          console.error("Erreur lors de la récupération du profil alumni:", error);
        } finally {
          setLoadingAlumni(false);
        }
      }
    };

    checkAlumniProfile();
  }, [currentUser]);

  const allFeatures: CategoryFeatures = {
    mentorship: {
      title: "Alumni",
      icon: <Users className="w-6 h-6 text-purple-600" />,
      features: [
        {
          icon: <Users className="w-8 h-8 text-purple-600" />,
          title: "Annuaire Alumni",
          description: "Connecte-toi avec des alumni : trouve des collaborateurs, des mentors, des opportunités",
          link: "/alumni",
          roles: ["admin", "editor", "user"]
        },
        {
          icon: <Briefcase className="w-8 h-8 text-blue-500" />,
          title: "Mon profil Alumni",
          description: "Complète ton profil pour être visible et accéder aux opportunités de mentorat et business",
          link: alumniProfile ? "/my-alumni-profile" : "/complete-alumni-profile",
          roles: ["admin", "editor", "user"]
        },
        {
          icon: <MessageSquare className="w-8 h-8 text-purple-500" />,
          title: "Forum",
          description: "Participez aux discussions avec les autres étudiants et alumni",
          link: "/forum",
          roles: ["admin", "editor", "user"]
        },
        {
          icon: <Video className="w-8 h-8 text-blue-500" />,
          title: "Webinaires",
          description: "Découvrez et inscrivez-vous aux webinaires à venir",
          link: "/webinars",
          roles: ["admin", "editor", "user"]
        },
        {
          icon: <Users className="w-8 h-8 text-green-600" />,
          title: "Programme de mentorat",
          description: "Trouvez un mentor ou devenez mentor pour les étudiants",
          link: "/mentorship",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <CalendarCheck className="w-8 h-8 text-indigo-600" />,
          title: "Événements networking",
          description: "Participez aux événements de networking virtuels et physiques",
          link: "/networking-events",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Briefcase className="w-8 h-8 text-green-600" />,
          title: "Offres d'emploi et stages",
          description: "Consultez et postulez aux opportunités partagées par la communauté",
          link: "/opportunities",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <FileText className="w-8 h-8 text-blue-600" />,
          title: "Mes candidatures",
          description: "Suivez l'état de vos candidatures et recevez des feedbacks",
          link: "/my-applications",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Bell className="w-8 h-8 text-yellow-600" />,
          title: "Alertes emploi",
          description: "Recevez des notifications pour les offres correspondant à votre profil",
          link: "/job-alerts",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Users className="w-8 h-8 text-purple-600" />,
          title: "Cooptations",
          description: "Recommandez des candidats et gagnez des bonus de cooptation",
          link: "/my-referrals",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Briefcase className="w-8 h-8 text-indigo-600" />,
          title: "Publier une offre",
          description: "Déposez une offre d'emploi, stage ou mission freelance",
          link: "/opportunities/create",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        }
      ]
    },
    learning: {
      title: "CPS",
      icon: <BookOpen className="w-6 h-6 text-green-600" />,
      features: [
        {
          icon: <BookOpen className="w-8 h-8 text-blue-500" />,
          title: "Module Étudiants CPS – Guide de préparation",
          description: "Consultez le guide de préparation interactif et suivez votre progression étape par étape",
          link: "/dashboard",
          roles: ["admin", "editor", "user"]
        },
        {
          icon: <BookOpen className="w-8 h-8 text-indigo-600" />,
          title: "Ressources Académiques",
          description: "Accédez aux cours, TD, TP organisés par année d'étude",
          link: "/academic-resources",
          roles: ["admin", "editor", "user"]
        },
        {
          icon: <FileText className="w-8 h-8 text-green-500" />,
          title: "Bibliothèque de ressources",
          description: "Consultez les documents et ressources disponibles",
          link: "/resources",
          roles: ["admin", "editor", "user"]
        },
        {
          icon: <HelpCircle className="w-8 h-8 text-yellow-500" />,
          title: "FAQ",
          description: "Consultez les questions fréquentes ou posez vos questions",
          link: "/faq",
          roles: ["admin", "editor", "user"]
        },
        {
          icon: <Video className="w-8 h-8 text-red-600" />,
          title: "Bibliothèque vidéo",
          description: "Accédez aux témoignages et retours d'expérience des alumni",
          link: "/video-library",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Database className="w-8 h-8 text-purple-600" />,
          title: "Projets open source",
          description: "Participez à des projets communautaires et développez vos compétences",
          link: "/open-source-projects",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        }
      ]
    },
    admin: {
      title: "Administration",
      icon: <Shield className="w-6 h-6 text-red-500" />,
      features: [
        {
          icon: <Settings className="w-8 h-8 text-gray-700" />,
          title: "Tableau de bord administrateur",
          description: "Accédez au panneau d'administration complet",
          link: "/admin",
          roles: ["admin"]
        },
        {
          icon: <BookOpen className="w-8 h-8 text-blue-600" />,
          title: "Gestion du contenu",
          description: "Éditer les sections du guide et le contenu informatif",
          link: "/admin/content",
          roles: ["admin", "editor"]
        },
        {
          icon: <FileText className="w-8 h-8 text-green-600" />,
          title: "Gestion des ressources",
          description: "Ajouter, modifier ou supprimer des ressources",
          link: "/admin/resources",
          roles: ["admin", "editor"]
        },
        {
          icon: <Users className="w-8 h-8 text-indigo-600" />,
          title: "Gestion des utilisateurs",
          description: "Gérer les comptes utilisateurs et les permissions",
          link: "/admin/users",
          roles: ["admin"]
        },
        {
          icon: <Database className="w-8 h-8 text-blue-700" />,
          title: "Gestion de Dropbox",
          description: "Accéder et gérer les fichiers sur Dropbox",
          link: "/admin/dropbox",
          roles: ["admin", "editor"]
        },
        {
          icon: <BarChart2 className="w-8 h-8 text-green-700" />,
          title: "Suivi des progressions",
          description: "Visualiser la progression des étudiants",
          link: "/admin/progressions",
          roles: ["admin"]
        },
        {
          icon: <Activity className="w-8 h-8 text-red-600" />,
          title: "Logs d'activité",
          description: "Consulter les journaux d'activité du système",
          link: "/admin/activity",
          roles: ["admin"]
        },
        {
          icon: <Bell className="w-8 h-8 text-yellow-600" />,
          title: "Gestion des feedbacks",
          description: "Consulter et gérer les retours utilisateurs",
          link: "/admin/feedbacks",
          roles: ["admin", "editor"]
        }
      ]
    },
    editor: {
      title: "Édition",
      icon: <BookOpen className="w-6 h-6 text-blue-500" />,
      features: [
        {
          icon: <Settings className="w-8 h-8 text-blue-600" />,
          title: "Tableau de bord éditeur",
          description: "Accédez au panneau d'édition de contenu",
          link: "/editor",
          roles: ["editor"]
        },
        {
          icon: <HelpCircle className="w-8 h-8 text-yellow-600" />,
          title: "Gestion de la FAQ",
          description: "Répondre aux questions et gérer les catégories de FAQ",
          link: "/editor/faq?mode=faq",
          roles: ["editor"]
        },
        {
          icon: <MessageSquare className="w-8 h-8 text-purple-600" />,
          title: "Modération du forum",
          description: "Modérer les discussions et gérer les catégories",
          link: "/editor/forum",
          roles: ["editor"]
        }
      ]
    },
    travel: {
      title: "Voyage & Installation",
      icon: <Plane className="w-6 h-6 text-blue-600" />,
      features: [
        {
          icon: <Plane className="w-8 h-8 text-indigo-500" />,
          title: "Réservation de billets d'avion",
          description: "Trouvez et réservez vos billets d'avion au meilleur prix",
          link: "https://touba-aviation-group.com/#/demande-vol",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Hotel className="w-8 h-8 text-indigo-600" />,
          title: "Réservations de logement",
          description: "Service de réservation de logements à Rouen",
          link: "#",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <CalendarCheck className="w-8 h-8 text-green-600" />,
          title: "Planificateur de voyage",
          description: "Outil de planification avec alertes et check-lists",
          link: "#",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Map className="w-8 h-8 text-yellow-600" />,
          title: "Itinéraires personnalisés",
          description: "Création d'itinéraires depuis le pays d'origine jusqu'à l'ESIGELEC",
          link: "#",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Users className="w-8 h-8 text-purple-600" />,
          title: "Buddy System",
          description: "Connectez-vous avec des alumni pour un accompagnement personnalisé",
          link: "/buddy-system",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Map className="w-8 h-8 text-blue-600" />,
          title: "Carte mondiale des alumni",
          description: "Visualisez la communauté d'alumni à travers le monde",
          link: "/alumni-map",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        }
      ]
    },
    tools: {
      title: "Outils & Services",
      icon: <Briefcase className="w-6 h-6 text-indigo-600" />,
      features: [
        {
          icon: <Bot className="w-8 h-8 text-indigo-500" />,
          title: "Assistant IA",
          description: "Posez vos questions à notre assistant intelligent",
          link: "/chat-ai",
          roles: ["admin"],
          disabled: !isSuperAdminState
        },
        {
          icon: <Download className="w-8 h-8 text-green-600" />,
          title: "Téléchargements",
          description: "Téléchargez des documents et outils utiles",
          link: "#",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Globe className="w-8 h-8 text-blue-500" />,
          title: "Traduction multilingue",
          description: "Service de traduction pour les documents importants",
          link: "#",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Phone className="w-8 h-8 text-red-600" />,
          title: "Assistance mobile",
          description: "Application mobile d'assistance et de suivi",
          link: "#",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Database className="w-8 h-8 text-purple-600" />,
          title: "Marketplace services",
          description: "Accédez aux services partagés par la communauté (coaching, relecture...)",
          link: "/marketplace",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <FileText className="w-8 h-8 text-orange-600" />,
          title: "Vérification CV IA",
          description: "Analyse et optimisation automatique de votre CV par IA",
          link: "/cv-checker",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        }
      ]
    },
    advanced: {
      title: "Fonctionnalités avancées",
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      features: [
        {
          icon: <Server className="w-8 h-8 text-purple-600" />,
          title: "API et intégrations",
          description: "Intégrez nos services à vos applications",
          link: "#",
          roles: ["admin"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <CreditCard className="w-8 h-8 text-purple-600" />,
          title: "Paiements sécurisés",
          description: "Système de paiement sécurisé multi-devises",
          link: "#",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Star className="w-8 h-8 text-yellow-600" />,
          title: "Gamification & Badges",
          description: "Gagnez des points et des badges en participant à la communauté",
          link: "/gamification",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Users className="w-8 h-8 text-green-600" />,
          title: "Recommandations",
          description: "Demandez et recevez des recommandations écrites de la communauté",
          link: "/recommendations",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <CreditCard className="w-8 h-8 text-red-600" />,
          title: "Dons & Soutien",
          description: "Soutenez l'association alumni par vos contributions",
          link: "/donations",
          roles: ["admin", "editor", "user"],
          disabled: true,
          comingSoon: true
        },
        {
          icon: <Activity className="w-8 h-8 text-blue-600" />,
          title: "Analytics avancés",
          description: "Tableaux de bord analytiques détaillés et rapports personnalisés",
          link: "/analytics",
          roles: ["admin"],
          disabled: true,
          comingSoon: true
        }
      ]
    }
  };

  // Filtrer les fonctionnalités par rôle
  const getUserRole = () => {
    if (isAdmin()) return "admin";
    if (isEditor()) return "editor";
    return "user";
  };

  const userRole = getUserRole();
  const filteredCategories = Object.entries(allFeatures).reduce((acc, [key, category]) => {
    const filteredFeatures = category.features.filter(feature => 
      feature.roles.includes(userRole) && (showComingSoon || !feature.comingSoon)
    );
    
    // Filtrer également par recherche
    const searchedFeatures = searchQuery 
      ? filteredFeatures.filter(feature =>
          feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          feature.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : filteredFeatures;
    
    if (searchedFeatures.length > 0) {
      acc[key] = {
        ...category,
        features: searchedFeatures
      };
    }
    
    return acc;
  }, {} as CategoryFeatures);

  const categories = Object.keys(filteredCategories);

  // S'assurer que la catégorie active existe toujours après filtrage
  useEffect(() => {
    if (!categories.includes(activeCategory) && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Plateforme CPS Connect · Centre d'applications</h1>
        <p className="text-gray-600 mt-2">
          Bienvenue <strong>{currentUser?.displayName || 'Utilisateur'}</strong>, cet espace centralise l'ensemble des modules et fonctionnalités disponibles pour votre profil
          (Étudiants CPS, Alumni, administration, édition, outils et services).
        </p>
      </div>

      {/* Notification profil alumni brouillon */}
      {!loadingAlumni && alumniProfile && alumniProfile.status === 'draft' && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Complète ton profil alumni
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Ton profil est en brouillon. Complète-le et soumets-le pour validation afin d'être visible dans l'annuaire.
              </p>
              <Link 
                to="/complete-alumni-profile" 
                className="mt-2 inline-block text-sm font-medium text-blue-800 underline hover:text-blue-900"
              >
                Compléter mon profil →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Notification profil alumni en attente */}
      {!loadingAlumni && alumniProfile && alumniProfile.status === 'pending' && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Profil alumni en attente de validation
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Votre profil alumni a été soumis et est en cours de validation par un administrateur. 
                Vous serez notifié dès qu'il sera approuvé et visible dans l'annuaire.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification profil alumni approuvé */}
      {!loadingAlumni && alumniProfile && alumniProfile.status === 'approved' && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
          <div className="flex items-start">
            <Bell className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">
                ✅ Profil alumni validé !
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Votre profil est maintenant visible dans l'annuaire alumni. 
                <Link to="/alumni" className="font-medium underline ml-1">
                  Voir l'annuaire →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification profil alumni rejeté */}
      {!loadingAlumni && alumniProfile && alumniProfile.status === 'rejected' && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex items-start">
            <Bell className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Profil alumni non validé
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Votre profil n'a pas été validé. Raison : {alumniProfile.rejectionReason || 'Non spécifiée'}
              </p>
              <Link 
                to="/edit-alumni-profile" 
                className="mt-2 inline-block text-sm font-medium text-red-800 underline"
              >
                Modifier mon profil →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Category Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full flex items-center ${
                  activeCategory === category 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className="mr-2">{filteredCategories[category].icon}</span>
                {filteredCategories[category].title}
              </button>
            ))}
          </div>
          
          {/* Mini-recherche */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Toggle Coming Soon */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showComingSoon}
              onChange={(e) => setShowComingSoon(e.target.checked)}
              className="sr-only"
            />
            <div className="relative">
              <div className={`block w-14 h-8 rounded-full transition-colors ${
                showComingSoon ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                showComingSoon ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </div>
            <span className="ml-3 text-sm text-gray-600">
              Afficher les fonctionnalités en développement
            </span>
          </label>
        </div>
      </div>

      {/* Nouveaux profils alumni (uniquement dans la catégorie mentorship) */}
      {activeCategory === 'mentorship' && (
        <div className="mb-8">
          <NewProfilesHighlight />
        </div>
      )}

      {/* Features Grid */}
      {filteredCategories[activeCategory] && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            {filteredCategories[activeCategory].icon}
            <span className="ml-2">{filteredCategories[activeCategory].title}</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories[activeCategory].features.map((feature, index) => (
            <Link 
              key={index}
              to={feature.disabled ? '#' : feature.link}
              className={`bg-white rounded-lg shadow-md p-6 flex flex-col ${
                feature.disabled 
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:shadow-lg transition-all cursor-pointer hover:scale-105'
              }`}
              onClick={(e) => feature.disabled && e.preventDefault()}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                {feature.title}
                {feature.comingSoon && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                    Bientôt disponible
                  </span>
                )}
                {!feature.comingSoon && !feature.disabled && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                    Nouveau
                  </span>
                )}
              </h3>
              <p className="text-gray-600 flex-grow">{feature.description}</p>
              <div className="mt-4">
                {feature.disabled ? (
                  <span className="text-gray-500 font-medium">
                    {feature.comingSoon ? 'En développement' : 'Non disponible'}
                  </span>
                ) : (
                  <span className="text-blue-600 font-medium hover:text-blue-800">
                    Accéder →
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
      )}

      {/* Coming Soon Features */}
      {Object.keys(filteredCategories).some(category => 
        filteredCategories[category].features.some(feature => feature.comingSoon)
      ) && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Nouvelles fonctionnalités en développement
          </h3>
          <p className="text-blue-700">
            Nous travaillons continuellement à améliorer la plateforme. Les fonctionnalités marquées "Bientôt disponible" 
            seront déployées progressivement au cours des prochains mois.
          </p>
        </div>
      )}
    </div>
  );
};

export default ApplicationsDashboard;
