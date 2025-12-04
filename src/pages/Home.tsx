import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Book, Workflow, Map, Users, GraduationCap, Award } from 'lucide-react';
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
                CPS Connect - La communauté qui réunit étudiants CPS et alumni
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-8">
                Que tu sois en prépa, à l'ESIGELEC ou ailleurs en France, connecte-toi avec des alumni du parcours CPS pour du mentorat, des opportunités et du networking.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {currentUser ? (
                  <Link 
                    to="/applications" 
                    className="bg-white text-blue-900 hover:bg-blue-50 px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
                  >
                    Accéder au centre d'applications
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                ) : (
                  <>
                    <Link 
                      to="/register" 
                      className="bg-white text-blue-900 hover:bg-blue-50 px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
                    >
                      Je suis étudiant CPS
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                    <Link 
                      to="/register" 
                      className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
                    >
                      Je suis alumni
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center md:pl-8 mt-6 md:mt-0">
              <div className="relative w-full max-w-[380px] h-[280px] sm:h-[350px] md:h-[400px]">
                {/* Photo CPS (en haut à gauche) avec effet glass */}
                <div className={`absolute top-0 left-0 z-20 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                  <div className="relative group cursor-pointer">
                    <img
                      src="https://welcome-esigelec.fr/wp-content/uploads/2023/01/J8A1391hd-800x800.jpg"
                      alt="Étudiants CPS"
                      className="rounded-xl w-[180px] sm:w-[220px] md:w-[280px] h-[140px] sm:h-[170px] md:h-[220px] object-cover shadow-2xl transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Glass border effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-white/5 border-2 border-white/40 pointer-events-none group-hover:border-white/70 group-hover:from-white/20 transition-all duration-300"></div>
                  </div>
                </div>
                
                {/* Photo ESIGELEC (en bas à droite, chevauche la première) avec effet glass */}
                <div className={`absolute bottom-0 right-0 z-10 transition-all duration-700 ease-out delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="relative group cursor-pointer">
                    <img
                      src="https://welcome-esigelec.fr/wp-content/uploads/2023/01/J8A1391hd-800x800.jpg"
                      alt="Campus ESIGELEC"
                      className="rounded-xl w-[180px] sm:w-[220px] md:w-[280px] h-[140px] sm:h-[170px] md:h-[220px] object-cover shadow-2xl transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Glass border effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-white/5 border-2 border-white/40 pointer-events-none group-hover:border-white/70 group-hover:from-white/20 transition-all duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tout ce dont tu as besoin en un seul endroit
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              CPS Connect réunit étudiants et alumni autour de quatre piliers essentiels pour réussir ton parcours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Book className="w-7 h-7 text-blue-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Guides & Ressources
              </h3>
              <p className="text-gray-600">
                Démarches administratives, ressources académiques et guides de vie en France pour tous les étudiants CPS.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-green-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Annuaire Alumni
              </h3>
              <p className="text-gray-600">
                Alumni des prépas CPS, ESIGELEC et autres écoles d'ingénieurs. Entrepreneurs, salariés, consultants de tous secteurs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Workflow className="w-7 h-7 text-purple-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Mentorat & Networking
              </h3>
              <p className="text-gray-600">
                Trouve des mentors qui ont vécu le même parcours. Connecte-toi avec des alumni dans ton domaine.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Map className="w-7 h-7 text-orange-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Opportunités
              </h3>
              <p className="text-gray-600">
                Stages, projets, collaborations et offres d'emploi partagées par la communauté alumni.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Can Join Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Qui peut rejoindre CPS Connect ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cette plateforme est ouverte à tous ceux qui font ou ont fait partie de la communauté CPS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pour les étudiants */}
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-blue-600">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Pour les étudiants CPS
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                  <span className="text-gray-700">Tu es actuellement en prépa CPS</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                  <span className="text-gray-700">Tu prépares ton départ pour la France</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                  <span className="text-gray-700">Tu cherches des conseils et du mentorat</span>
                </li>
              </ul>
            </div>

            {/* Pour les alumni */}
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-green-600">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Pour les alumni
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  </div>
                  <span className="text-gray-700">Tu as fait les CPS (Dakar ou ailleurs)</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  </div>
                  <span className="text-gray-700">Tu es à l'ESIGELEC, dans une autre école, ou déjà diplômé</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  </div>
                  <span className="text-gray-700">Tu veux partager ton expérience et ton réseau</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Deux parcours simples et efficaces selon ton profil.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Parcours Étudiant */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 shadow-md">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Parcours Étudiant CPS
                </h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Inscription</h4>
                    <p className="text-gray-700">Accède aux guides et ressources</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Explore</h4>
                    <p className="text-gray-700">Ressources académiques et administratives</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Connecte</h4>
                    <p className="text-gray-700">Trouve des alumni mentors (toutes écoles)</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Participe</h4>
                    <p className="text-gray-700">Forum, FAQ, événements</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Parcours Alumni */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 shadow-md">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Parcours Alumni
                </h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Inscription</h4>
                    <p className="text-gray-700">Indique ton parcours (prépa + école)</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Profil</h4>
                    <p className="text-gray-700">Partage ton expertise et ton secteur</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Validation</h4>
                    <p className="text-gray-700">Profil vérifié et publié</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Engage</h4>
                    <p className="text-gray-700">Mentorat, opportunités, networking</p>
                  </div>
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
            Rejoins la communauté CPS Connect
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Que tu sois étudiant CPS ou alumni (ESIGELEC, Centrale, INSA, ou autre), cette plateforme est pour toi.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {currentUser ? (
              <Link 
                to="/applications" 
                className="bg-white text-green-900 hover:bg-green-50 px-8 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
              >
                Accéder au centre d'applications
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="bg-white text-green-900 hover:bg-green-50 px-8 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
                >
                  Commencer en tant qu'étudiant
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link 
                  to="/register" 
                  className="border-2 border-white text-white hover:bg-white hover:text-green-900 px-8 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center"
                >
                  Rejoindre en tant qu'alumni
                  <ArrowRight className="ml-2 w-5 h-5" />
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