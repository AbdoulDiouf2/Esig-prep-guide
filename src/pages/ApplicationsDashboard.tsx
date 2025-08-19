import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
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
  CreditCard
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
  const navigate = useNavigate();
  const [isSuperAdminState, setIsSuperAdminState] = useState(false);
  const [activeCategory, setActiveCategory] = useState('main');

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

  const allFeatures: CategoryFeatures = {
    main: {
      title: "Fonctionnalités principales",
      icon: <Star className="w-6 h-6 text-yellow-500" />,
      features: [
        {
          icon: <BookOpen className="w-8 h-8 text-blue-500" />,
          title: "Guide de préparation",
          description: "Accédez au guide de préparation et au contenu informatif",
          link: "/dashboard",
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
          icon: <MessageSquare className="w-8 h-8 text-purple-500" />,
          title: "Forum",
          description: "Participez aux discussions avec les autres étudiants",
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
          icon: <BookOpen className="w-8 h-8 text-indigo-600" />,
          title: "Ressources Académiques",
          description: "Accédez aux cours, TD, TP organisés par année d'étude",
          link: "/academic-resources",
          roles: ["admin", "editor", "user"]
        },
        {
          icon: <Plane className="w-8 h-8 text-indigo-500" />,
          title: "Réservation de billets d'avion",
          description: "Trouvez et réservez vos billets d'avion au meilleur prix",
          link: "https://touba-aviation-group.com/#/demande-vol",
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
      title: "Voyage et Installation",
      icon: <Plane className="w-6 h-6 text-blue-600" />,
      features: [
        {
          icon: <Plane className="w-8 h-8 text-blue-600" />,
          title: "Achat de billets d'avion",
          description: "Système de recherche et d'achat de billets à tarifs préférentiels",
          link: "#",
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
        }
      ]
    },
    tools: {
      title: "Outils et Services",
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
        }
      ]
    },
    advanced: {
      title: "Fonctionnalités avancées",
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      features: [
        {
          icon: <Video className="w-8 h-8 text-red-500" />,
          title: "Webinaires",
          description: "Participez à des webinaires et sessions d'information",
          link: "/webinars",
          roles: ["admin", "editor", "user"]
        },
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
      feature.roles.includes(userRole)
    );
    
    if (filteredFeatures.length > 0) {
      acc[key] = {
        ...category,
        features: filteredFeatures
      };
    }
    
    return acc;
  }, {} as CategoryFeatures);

  const categories = Object.keys(filteredCategories);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Centre d'applications</h1>
        <p className="text-gray-600 mt-2">
          Bienvenue {currentUser?.displayName || 'Utilisateur'}, accédez à toutes les fonctionnalités disponibles pour votre compte.
        </p>
      </div>

      {/* Category Navigation */}
      <div className="mb-8 flex flex-wrap gap-2">
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

      {/* Features Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          {filteredCategories[activeCategory].icon}
          <span className="ml-2">{filteredCategories[activeCategory].title}</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories[activeCategory].features.map((feature, index) => (
            <div 
              key={index}
              className={`bg-white rounded-lg shadow-md p-6 flex flex-col ${
                feature.disabled 
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:shadow-lg transition-shadow cursor-pointer'
              }`}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                {feature.title}
                {feature.comingSoon && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                    Bientôt disponible
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
                  <Link to={feature.link} className="text-blue-600 font-medium hover:text-blue-800">
                    Accéder →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
