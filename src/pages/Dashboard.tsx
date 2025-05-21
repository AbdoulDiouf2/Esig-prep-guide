import React, { useState, useEffect } from 'react';
import { getUserProgression, setUserProgression } from '../services/progressionService';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContent, GuidePhase } from '../contexts/ContentContext';
import { FileText, CheckCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    guideSections,
    resources,
    getGuideSectionsByPhase,
    faqItems
  } = useContent();
  
  const [activePhase, setActivePhase] = useState<GuidePhase>('post-cps');
  
  // Progress tracking (would be stored in user profile in a real app)
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [progressLoading, setProgressLoading] = useState<boolean>(true);

  useEffect(() => {
    if (currentUser?.uid) {
      setProgressLoading(true);
      getUserProgression(currentUser.uid)
        .then((sections) => setCompletedSections(sections))
        .finally(() => setProgressLoading(false));
    }
  }, [currentUser?.uid]);

  const toggleSectionCompletion = async (sectionId: string) => {
    let updatedSections;
    if (completedSections.includes(sectionId)) {
      updatedSections = completedSections.filter(id => id !== sectionId);
    } else {
      updatedSections = [...completedSections, sectionId];
    }
    setCompletedSections(updatedSections);
    if (currentUser?.uid) {
      await setUserProgression(currentUser.uid, updatedSections);
    }
  };

  const phaseSections = getGuideSectionsByPhase ? getGuideSectionsByPhase(activePhase) : [];
  // const phaseResources = getResourcesByPhase ? getResourcesByPhase(activePhase) : [];
  
  // Calculate progress percentage
  const calculateProgressPercentage = (phase: GuidePhase) => {
    const phaseSectionsSafe = getGuideSectionsByPhase ? getGuideSectionsByPhase(phase) : [];
    if (!phaseSectionsSafe || phaseSectionsSafe.length === 0) return 0;
    const completedPhaseSections = phaseSectionsSafe.filter(section => 
      completedSections.includes(section.id)
    );
    return Math.round((completedPhaseSections.length / phaseSectionsSafe.length) * 100);
  };

  // Calcul de la progression globale (toutes phases confondues)
  const calculateGlobalProgress = () => {
    if (!guideSections || guideSections.length === 0) return 0;
    const completed = guideSections.filter(section => completedSections.includes(section.id));
    return Math.round((completed.length / guideSections.length) * 100);
  };



  // Affichage de chargement si les données ne sont pas encore chargées
  if (!resources || !faqItems || !guideSections || progressLoading) {
    return <div className="p-8 text-center">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">Tableau de bord</h1>
          <p className="text-blue-100">
            Bienvenue, <strong>{currentUser?.displayName || currentUser?.email} !</strong> Suivez votre progression et accédez à vos ressources.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Phases navigation */}
            <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
              <div className="flex flex-wrap">
                <button
                  onClick={() => setActivePhase('post-cps')}
                  className={`flex-1 py-4 px-4 text-center font-medium transition-colors duration-200 ${
                    activePhase === 'post-cps' 
                      ? 'bg-blue-800 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Post-CPS
                </button>
                <button
                  onClick={() => setActivePhase('during-process')}
                  className={`flex-1 py-4 px-4 text-center font-medium transition-colors duration-200 ${
                    activePhase === 'during-process' 
                      ? 'bg-blue-800 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Pendant les démarches
                </button>
                <button
                  onClick={() => setActivePhase('pre-arrival')}
                  className={`flex-1 py-4 px-4 text-center font-medium transition-colors duration-200 ${
                    activePhase === 'pre-arrival' 
                      ? 'bg-blue-800 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Pré-arrivée
                </button>
              </div>
            </div>
            
            {/* Guide sections */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {activePhase === 'post-cps' && 'Après votre CPS'}
                  {activePhase === 'during-process' && 'Pendant vos démarches administratives'}
                  {activePhase === 'pre-arrival' && 'Avant votre arrivée en France'}
                </h2>
                <p className="text-gray-600">
                  {activePhase === 'post-cps' && 'Les étapes essentielles après la fin de votre classe préparatoire'}
                  {activePhase === 'during-process' && 'Les démarches à effectuer pour préparer votre départ'}
                  {activePhase === 'pre-arrival' && 'Préparez votre arrivée et votre installation en France'}
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {(phaseSections && phaseSections.length > 0) ? (
                  phaseSections.map((section) => (
                    <div key={section.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex flex-wrap md:flex-nowrap items-start">
                        <div className="md:flex-shrink-0 mb-4 md:mb-0 md:mr-4">
                          <button
                            onClick={() => toggleSectionCompletion(section.id)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              completedSections.includes(section.id)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {section.title}
                          </h3>
                          <p className="text-gray-600 mb-4">{section.content}</p>
                          
                          {/* Associated resources */}
                          {Array.isArray(section.resources) && section.resources.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                Ressources associées:
                              </h4>
                              <div className="space-y-2">
                                {section.resources.map(resourceId => {
                                  const resource = resources.find(r => r.id === resourceId);
                                  return resource ? (
                                    <a 
                                      key={resource.id}
                                      href={resource.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      {resource.title}
                                    </a>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    Aucune section disponible pour cette phase actuellement.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress tracking */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Votre progression</h2>

              {/* Progression globale */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-gray-700">Progression globale</span>
                  <span className="text-sm font-bold text-blue-700">{calculateGlobalProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-900 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${calculateGlobalProgress()}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-4">
                {/* Post-CPS progress */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Post-CPS</span>
                    <span className="text-sm font-medium text-gray-700">
                      {calculateProgressPercentage('post-cps')}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-800 h-2.5 rounded-full" 
                      style={{ width: `${calculateProgressPercentage('post-cps')}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* During process progress */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Pendant les démarches</span>
                    <span className="text-sm font-medium text-gray-700">
                      {calculateProgressPercentage('during-process')}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-800 h-2.5 rounded-full" 
                      style={{ width: `${calculateProgressPercentage('during-process')}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Pre-arrival progress */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Pré-arrivée</span>
                    <span className="text-sm font-medium text-gray-700">
                      {calculateProgressPercentage('pre-arrival')}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-800 h-2.5 rounded-full" 
                      style={{ width: `${calculateProgressPercentage('pre-arrival')}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent resources */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Ressources récentes</h2>
                <Link to="/resources" className="text-sm text-blue-600 hover:text-blue-800">
                  Voir tout
                </Link>
              </div>
              
              <div className="space-y-3">
                {(resources || []).slice(0, 3).map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start p-3 hover:bg-gray-50 rounded-md transition-colors duration-200"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">{resource.title}</h3>
                      <p className="text-xs text-gray-500">{resource.phase}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            {/* Recent FAQ */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Questions fréquentes</h2>
                <Link to="/faq" className="text-sm text-blue-600 hover:text-blue-800">
                  Voir tout
                </Link>
              </div>
              
              <div className="space-y-3">
                {(faqItems || []).slice(0, 2).map((faq) => (
                  <div key={faq.id} className="p-3 hover:bg-gray-50 rounded-md transition-colors duration-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{faq.question}</h3>
                    <p className="text-xs text-gray-700">{faq.answer && faq.answer.length > 100 ? `${faq.answer.substring(0, 100)}...` : faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;