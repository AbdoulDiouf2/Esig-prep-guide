import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface EditorRouteProps {
  children: React.ReactNode;
}

const EditorRoute: React.FC<EditorRouteProps> = ({ children }) => {
  const { currentUser, loading, isEditor, isAdmin } = useAuth();

  // Si en cours de chargement, afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si non connecté, rediriger vers la page de connexion
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Si connecté mais pas éditeur ni admin, rediriger vers la page d'accueil
  if (!isEditor() && !isAdmin()) {
    return <Navigate to="/" />;
  }

  // Si éditeur ou admin, afficher le contenu
  return <>{children}</>;
};

export default EditorRoute;
