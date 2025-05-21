import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, 
  Star, 
  Users, 
  BarChart2, 
  Settings, 
  Shield, 
  Zap, 
  MessageSquare, 
  Video, 
  Map, 
  CheckSquare, 
  Book, 
  Bell, 
  Award, 
  Download, 
  Globe,
  Briefcase,
  FileText,
  Key,
  Database,
  Code,
  Server,
  Lock,
  Activity,
  Clock,
  AlertTriangle,
  Plane,
  CalendarCheck,
  Bot,
  CreditCard,
  Phone,
  Hotel
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  timeline: string;
  premium: boolean;
  new?: boolean;
  prototype?: boolean;
}

interface FeatureCategories {
  [key: string]: Feature[];
}

const FutureFeatures: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('travel');

  // Vérifier si l'utilisateur est admin et obtenir son statut superadmin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser || !isAdmin()) {
        navigate('/admin');
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().isSuperAdmin) {
          setIsSuperAdmin(true);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut superadmin:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser, isAdmin, navigate]);

  // Si en cours de chargement, afficher un spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  // Si pas superadmin, cette partie ne sera pas rendue grâce à la redirection dans useEffect
  
  // Liste des fonctionnalités futures par catégorie
  const features: FeatureCategories = {
    travel: [
      {
        icon: <Plane className="h-8 w-8 text-blue-600" />,
        title: "Achat de billets d'avion",
        description: "Système intégré de recherche et d'achat de billets d'avion à tarifs préférentiels pour les étudiants",
        timeline: "Q3 2025",
        premium: false,
        new: true
      },
      {
        icon: <Hotel className="h-8 w-8 text-indigo-600" />,
        title: "Réservations de logement",
        description: "Service de réservation de logements temporaires et permanents à Rouen pour les étudiants",
        timeline: "Q3 2025",
        premium: false,
        new: true
      },
      {
        icon: <CalendarCheck className="h-8 w-8 text-green-600" />,
        title: "Planificateur de voyage",
        description: "Outil de planification des étapes du voyage avec alertes, check-lists et recommandations personnalisées",
        timeline: "Q4 2025",
        premium: false,
        new: true
      },
      {
        icon: <Map className="h-8 w-8 text-yellow-600" />,
        title: "Itinéraires personnalisés",
        description: "Création d'itinéraires personnalisés depuis le pays d'origine jusqu'à l'ESIGELEC",
        timeline: "Q1 2026",
        premium: false,
        new: true
      },
      {
        icon: <CreditCard className="h-8 w-8 text-purple-600" />,
        title: "Paiements sécurisés",
        description: "Système de paiement sécurisé multi-devises pour toutes les transactions de voyage",
        timeline: "Q2 2026",
        premium: false,
        new: true
      },
      {
        icon: <Phone className="h-8 w-8 text-red-600" />,
        title: "Assistance mobile",
        description: "Application mobile dédiée pour gérer ses réservations et recevoir des notifications en temps réel",
        timeline: "Q2 2026",
        premium: false,
        new: true
      }
    ],
    ai: [
      {
        icon: <Bot className="h-8 w-8 text-emerald-600" />,
        title: "Assistant IA personnel",
        description: "Chatbot intelligent pour répondre aux questions et guider les étudiants tout au long de leur parcours",
        timeline: "Q2 2025",
        premium: false,
        new: true,
        prototype: true
      },
      {
        icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
        title: "Traduction en temps réel",
        description: "Traduction instantanée des conversations et documents pour surmonter les barrières linguistiques",
        timeline: "Q3 2025",
        premium: false,
        new: true
      },
      {
        icon: <FileText className="h-8 w-8 text-indigo-500" />,
        title: "Analyse de documents",
        description: "Vérification automatique des documents administratifs et suggestions de corrections",
        timeline: "Q4 2025",
        premium: false,
        new: true
      },
      {
        icon: <Clock className="h-8 w-8 text-orange-500" />,
        title: "Planification intelligente",
        description: "Organisation optimisée des tâches et démarches administratives basée sur l'IA",
        timeline: "Q1 2026",
        premium: false,
        new: true
      },
      {
        icon: <Globe className="h-8 w-8 text-cyan-500" />,
        title: "Recommandations culturelles",
        description: "Conseils personnalisés pour s'adapter à la culture française et aux coutumes locales",
        timeline: "Q2 2026",
        premium: false,
        new: true
      }
    ],
    general: [
      {
        icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
        title: "Forum d'entraide",
        description: "Section permettant aux étudiants d'échanger leurs expériences et conseils",
        timeline: "Q3 2025",
        premium: false
      },
      {
        icon: <Users className="h-8 w-8 text-indigo-500" />,
        title: "Système de mentorat",
        description: "Mise en relation des nouveaux admis avec des étudiants déjà à l'ESIG",
        timeline: "Q4 2025",
        premium: false
      },
      {
        icon: <Video className="h-8 w-8 text-red-500" />,
        title: "Vidéothèque",
        description: "Témoignages, visites virtuelles, tutoriels pour les démarches",
        timeline: "Q3 2025",
        premium: false
      },
      {
        icon: <Map className="h-8 w-8 text-green-500" />,
        title: "Cartes interactives",
        description: "Exploration du campus ESIGELEC et de la ville de Rouen",
        timeline: "Q4 2025",
        premium: false
      },
      {
        icon: <CheckSquare className="h-8 w-8 text-purple-500" />,
        title: "Générateur de check-lists",
        description: "Check-lists personnalisées selon le profil et l'avancement de l'étudiant",
        timeline: "Q2 2025",
        premium: false
      },
      {
        icon: <Book className="h-8 w-8 text-yellow-500" />,
        title: "Base de connaissances collaborative",
        description: "Wiki alimenté par les utilisateurs et validé par les administrateurs",
        timeline: "Q1 2026",
        premium: false
      },
      {
        icon: <Globe className="h-8 w-8 text-blue-600" />,
        title: "Guides par nationalité",
        description: "Ressources spécifiques aux étudiants de différents pays (visa, équivalences, etc.)",
        timeline: "Q2 2026",
        premium: false
      },
      {
        icon: <Activity className="h-8 w-8 text-indigo-600" />,
        title: "Tableau de bord de progression",
        description: "Visualisation des étapes accomplies et des tâches à faire",
        timeline: "Q3 2025",
        premium: false
      },
      {
        icon: <Bell className="h-8 w-8 text-orange-500" />,
        title: "Notifications personnalisées",
        description: "Alertes pour les deadlines importantes selon le profil de l'étudiant",
        timeline: "Q3 2025",
        premium: false
      },
      {
        icon: <Award className="h-8 w-8 text-yellow-600" />,
        title: "Système de badges",
        description: "Récompenses pour les étapes accomplies (gamification)",
        timeline: "Q1 2026",
        premium: false
      },
      {
        icon: <Download className="h-8 w-8 text-blue-800" />,
        title: "Mode hors-ligne",
        description: "Accès aux documents essentiels sans connexion internet",
        timeline: "Q2 2026",
        premium: false
      },
      {
        icon: <Globe className="h-8 w-8 text-green-600" />,
        title: "Traduction multilingue",
        description: "Interface disponible en français, anglais et autres langues",
        timeline: "Q1 2026",
        premium: false
      }
    ],
    premium: [
      {
        icon: <BarChart2 className="h-8 w-8 text-blue-600" />,
        title: "Tableau de bord analytique avancé",
        description: "Statistiques détaillées d'utilisation de la plateforme et des ressources",
        timeline: "Q3 2025",
        premium: true
      },
      {
        icon: <Users className="h-8 w-8 text-indigo-600" />,
        title: "Suivi de cohorte",
        description: "Analyse des parcours par promotion d'étudiants",
        timeline: "Q4 2025",
        premium: true
      },
      {
        icon: <FileText className="h-8 w-8 text-purple-600" />,
        title: "Rapports personnalisables",
        description: "Exportation de données sélectionnées selon différents critères",
        timeline: "Q1 2026",
        premium: true
      },
      {
        icon: <Zap className="h-8 w-8 text-yellow-600" />,
        title: "Prévisions d'admission",
        description: "Algorithme basé sur les données historiques des admissions",
        timeline: "Q2 2026",
        premium: true
      },
      {
        icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
        title: "Détection des problèmes récurrents",
        description: "Identification des blocages communs rencontrés par les étudiants",
        timeline: "Q3 2025",
        premium: true
      },
      {
        icon: <FileText className="h-8 w-8 text-blue-700" />,
        title: "Éditeur de templates",
        description: "Création de modèles de pages et de contenus personnalisés",
        timeline: "Q4 2025",
        premium: true
      },
      {
        icon: <Clock className="h-8 w-8 text-green-700" />,
        title: "Système de versioning",
        description: "Historique et rollback des modifications apportées au contenu",
        timeline: "Q1 2026",
        premium: true
      },
      {
        icon: <Key className="h-8 w-8 text-purple-700" />,
        title: "Gestion des rôles hiérarchiques",
        description: "Création de niveaux d'administration personnalisés",
        timeline: "Q3 2025",
        premium: true
      },
      {
        icon: <Database className="h-8 w-8 text-orange-600" />,
        title: "Synchronisation CRM/ERP",
        description: "Connexion avec les systèmes informatiques de l'ESIGELEC",
        timeline: "Q2 2026",
        premium: true
      },
      {
        icon: <Code className="h-8 w-8 text-indigo-700" />,
        title: "API complète",
        description: "Interface de programmation pour intégration avec d'autres services",
        timeline: "Q3 2026",
        premium: true
      }
    ],
    superadmin: [
      {
        icon: <Settings className="h-8 w-8 text-gray-700" />,
        title: "Mode maintenance",
        description: "Mise en maintenance programmée de la plateforme avec message personnalisé",
        timeline: "Q2 2025",
        premium: true
      },
      {
        icon: <Database className="h-8 w-8 text-blue-800" />,
        title: "Outils de migration de données",
        description: "Import/export massif de données entre environnements",
        timeline: "Q3 2025",
        premium: true
      },
      {
        icon: <Server className="h-8 w-8 text-green-800" />,
        title: "Gestion de l'infrastructure",
        description: "Monitoring des performances et ressources système",
        timeline: "Q4 2025",
        premium: true
      },
      {
        icon: <Shield className="h-8 w-8 text-red-700" />,
        title: "Centre de sécurité",
        description: "Gestion des alertes, tentatives d'intrusion et logs de sécurité",
        timeline: "Q1 2026",
        premium: true
      },
      {
        icon: <Lock className="h-8 w-8 text-purple-800" />,
        title: "Audit de conformité RGPD",
        description: "Vérification automatisée et rapports de conformité aux normes RGPD",
        timeline: "Q2 2025",
        premium: true
      }
    ]
  };

  // Rendu du composant
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <button 
                onClick={() => navigate('/admin')}
                className="flex items-center text-blue-100 hover:text-white transition-colors mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour au tableau de bord
              </button>
              <h1 className="text-2xl font-bold flex items-center">
                <Star className="w-6 h-6 mr-2 text-yellow-300" />
                Fonctionnalités Futures
              </h1>
            </div>
            {isSuperAdmin && (
              <div className="bg-blue-800 px-3 py-1 rounded-full flex items-center">
                <Shield className="w-4 h-4 mr-1 text-yellow-400" />
                <span className="text-sm font-medium">Accès Admin</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Roadmap des fonctionnalités futures</h2>
          <p className="text-gray-700 mb-4">
            Cette page présente les fonctionnalités planifiées pour les prochaines versions d'ESIG-prep-guide. 
            Ces fonctionnalités sont classées par catégorie et incluent à la fois des améliorations générales et des 
            fonctionnalités premium réservées aux administrateurs. 
          </p>
          <p className="text-gray-700">
            En tant qu'Admin, vous avez accès à cette vue d'ensemble stratégique et pouvez contribuer à prioriser 
            le développement de ces fonctionnalités.
          </p>
        </div>

        {/* Tabs for feature categories */}
        <div className="mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'travel'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              onClick={() => setActiveTab('travel')}
            >
              Voyages & Réservations
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'ai'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              onClick={() => setActiveTab('ai')}
            >
              Assistant IA
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              onClick={() => setActiveTab('general')}
            >
              Fonctionnalités Générales
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'premium'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              onClick={() => setActiveTab('premium')}
            >
              Fonctionnalités Premium
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === 'superadmin'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              onClick={() => setActiveTab('superadmin')}
            >
              Outils SuperAdmin
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features[activeTab as keyof typeof features].map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      {feature.title}
                      {feature.premium && (
                        <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                          Premium
                        </span>
                      )}
                      {feature.new && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                          Nouveau
                        </span>
                      )}
                      {feature.prototype && (
                        <Link to="/chat-ai" className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded cursor-pointer hover:bg-blue-200">
                          Prototype disponible
                        </Link>
                      )}
                    </h3>
                    <p className="mt-1 text-gray-600">{feature.description}</p>
                    <div className="mt-3 flex items-center">
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                        Prévu: {feature.timeline}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Strategic Dashboard Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-6 flex items-center">
            <Briefcase className="w-6 h-6 mr-2 text-blue-700" />
            Dashboard de pilotage stratégique (En développement)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Phase 1: Métriques clés</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-green-500" />
                  KPIs de performance et d'engagement
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-green-500" />
                  Taux de complétion des démarches par étudiant
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-green-500" />
                  Mesures de satisfaction utilisateur
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Phase 2: Analyses prédictives</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  Détection précoce des blocages
                </li>
                <li className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  Prévisions des taux de conversion
                </li>
                <li className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  Modélisation de l'expérience utilisateur
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Laboratoire d'innovation</h3>
            <p className="text-gray-700 mb-4">
              Espace réservé pour tester et valider de nouvelles fonctionnalités avant déploiement général.
              Vous pourrez activer/désactiver les fonctionnalités expérimentales et recueillir les retours utilisateurs.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-blue-700 text-sm">
                <strong>Note:</strong> Cette section sera disponible dans la prochaine mise à jour (Q2 2025).
                Les fonctionnalités seront déployées progressivement selon la roadmap stratégique.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FutureFeatures;
