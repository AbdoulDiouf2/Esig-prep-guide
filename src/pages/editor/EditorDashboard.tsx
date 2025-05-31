import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, HelpCircle, MessageSquare, ArrowLeft, FolderArchive } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const EditorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Gestion du contenu',
      description: 'Éditer les sections du guide, modifier le contenu informatif',
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      link: '/editor/content',
    },
    {
      title: 'Gestion des ressources',
      description: 'Ajouter, modifier ou supprimer des ressources',
      icon: <FileText className="w-8 h-8 text-green-500" />,
      link: '/editor/resources',
    },
    {
      title: 'Gestion de la FAQ',
      description: 'Répondre aux questions et gérer les catégories de FAQ',
      icon: <HelpCircle className="w-8 h-8 text-yellow-500" />,
      link: '/editor/faq?mode=faq',
    },
    {
      title: 'Modération du forum',
      description: 'Gérer les catégories, épingler, verrouiller ou supprimer des discussions',
      icon: <MessageSquare className="w-8 h-8 text-purple-500" />,
      link: '/editor/forum',
    },
    {
      title: 'Gestion de Dropbox',
      description: 'Accéder et gérer les fichiers sur Dropbox',
      icon: <FolderArchive className="w-8 h-8 text-blue-400" />,
      link: '/editor/dropbox',
    }
  ];

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
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord Éditeur</h1>
        <p className="text-gray-600 mt-2">
          Bienvenue {currentUser?.displayName || 'Éditeur'}, gérez le contenu et les ressources de la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            to={item.link}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col"
          >
            <div className="mb-4">{item.icon}</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h2>
            <p className="text-gray-600 flex-grow">{item.description}</p>
            <div className="mt-4 text-blue-600 font-medium hover:text-blue-800">
              Accéder →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EditorDashboard;
