import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Book, Workflow, Map, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import InfiniteLogoScroll from '../components/InfiniteLogoScroll';

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Votre guide pour passer de CPS à l'ESIGELEC
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-8">
                Trouvez toutes les ressources et l'accompagnement nécessaires pour réussir votre transition des Classes Préparatoires Scientifiques de Dakar vers l'ESIGELEC à Rouen.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {currentUser ? (
                  <Link 
                    to="/dashboard" 
                    className="bg-white text-blue-900 hover:bg-blue-50 px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
                  >
                    Accédez à votre tableau de bord
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                ) : (
                  <>
                    <Link 
                      to="/register" 
                      className="bg-white text-blue-900 hover:bg-blue-50 px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
                    >
                      Commencer maintenant
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                    <Link 
                      to="/login" 
                      className="border border-white text-white hover:bg-white hover:bg-opacity-10 px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
                    >
                      J'ai déjà un compte
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center md:pl-8 mt-6 md:mt-0">
  <img
    src="https://welcome-esigelec.fr/wp-content/uploads/2023/01/J8A1391hd-800x800.jpg"
    alt="Campus universitaire"
    className={`rounded-lg shadow-lg w-full max-w-[320px] md:max-w-[380px] lg:max-w-[420px] h-auto object-cover transition-opacity duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
  />
</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin pour réussir votre transition
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Notre plateforme vous guide à travers chaque étape du processus, du post-CPS jusqu'à votre arrivée en France.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Workflow className="w-7 h-7 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Guides étape par étape
              </h3>
              <p className="text-gray-600">
                Des guides détaillés pour chaque phase de votre parcours, de la fin des CPS jusqu'à votre installation à Rouen.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Book className="w-7 h-7 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Ressources documentaires
              </h3>
              <p className="text-gray-600">
                Accédez à tous les documents nécessaires pour vos démarches Campus France, visa, logement et plus encore.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Map className="w-7 h-7 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Guide de la vie en France
              </h3>
              <p className="text-gray-600">
                Découvrez tout ce que vous devez savoir sur la vie à Rouen, les transports, le logement et la vie étudiante.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Communauté d'entraide
              </h3>
              <p className="text-gray-600">
                Posez vos questions et bénéficiez de l'expérience des anciens étudiants qui ont suivi le même parcours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Phases Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Les trois phases de votre parcours
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Notre plateforme couvre l'intégralité de votre parcours en trois grandes phases.
            </p>
          </div>

          <div className="flex flex-col space-y-6">
            {/* Phase 1 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 bg-blue-800 text-white p-6 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold mb-2">Post-CPS</h3>
                  <p className="text-blue-100">
                    Préparation des dossiers et candidatures après la fin des classes préparatoires.
                  </p>
                </div>
                <div className="md:w-2/3 p-6">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-800"></div>
                      </div>
                      <span>Préparation dossier Campus France</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-800"></div>
                      </div>
                      <span>Candidature ESIGELEC</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-800"></div>
                      </div>
                      <span>Validation des acquis et prérequis</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 bg-blue-700 text-white p-6 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold mb-2">Pendant les démarches</h3>
                  <p className="text-blue-100">
                    Gestion des procédures administratives et préparation pratique.
                  </p>
                </div>
                <div className="md:w-2/3 p-6">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-700"></div>
                      </div>
                      <span>Demande de visa étudiant</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-700"></div>
                      </div>
                      <span>Recherche de logement</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-700"></div>
                      </div>
                      <span>Préparation financière et budgétaire</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 bg-blue-600 text-white p-6 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold mb-2">Pré-arrivée en France</h3>
                  <p className="text-blue-100">
                    Derniers préparatifs et informations sur l'arrivée et l'installation.
                  </p>
                </div>
                <div className="md:w-2/3 p-6">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      </div>
                      <span>Transport vers la France</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      </div>
                      <span>Installation et démarches à l'arrivée</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      </div>
                      <span>Intégration à l'ESIGELEC et vie étudiante</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback CTA Section */}
      <section className="py-12 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center border border-blue-100">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-3">Votre avis compte !</h2>
            <p className="text-blue-800 mb-6">Aidez-nous à améliorer la plateforme en partageant vos suggestions, remarques ou critiques constructives. Nous lisons chaque retour avec attention.</p>
            <Link
              to="/feedback"
              className="inline-block px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg shadow hover:bg-blue-800 transition-colors text-lg"
            >
              Donner mon avis
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-800 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Prêt à commencer votre parcours vers l'ESIGELEC ?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Rejoignez notre communauté d'étudiants CPS et bénéficiez de toutes les ressources dont vous avez besoin pour réussir votre transition.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {currentUser ? (
              <Link 
                to="/dashboard" 
                className="bg-white text-green-900 hover:bg-green-50 px-8 py-3 rounded-md font-medium transition-colors duration-200"
              >
                Accéder à mon tableau de bord
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="bg-white text-green-900 hover:bg-green-50 px-8 py-3 rounded-md font-medium transition-colors duration-200"
                >
                  S'inscrire gratuitement
                </Link>
                <Link 
                  to="/login" 
                  className="border border-white text-white hover:bg-white hover:bg-opacity-10 px-8 py-3 rounded-md font-medium transition-colors duration-200"
                >
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Logo Slider Section */}
      <InfiniteLogoScroll />
    </div>
  );
};

export default Home;