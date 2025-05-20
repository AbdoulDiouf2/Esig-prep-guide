import React, { useState, useEffect } from 'react';
import { useContent, GuidePhase, FAQItem } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, ChevronDown, ChevronUp, MessageSquare, CheckCircle } from 'lucide-react';

const FAQ: React.FC = () => {
  const { faqItems, addFAQItem } = useContent();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<GuidePhase | 'all'>('all');
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showMyQuestions, setShowMyQuestions] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newPhase, setNewPhase] = useState<GuidePhase>('post-cps');
  const [newCategory, setNewCategory] = useState('');

  // Filtrer et séparer les questions en différentes catégories
  const [answeredQuestions, unansweredQuestions, publicQuestions] = faqItems.reduce(
    (acc, item) => {
      // Identifier les questions de l'utilisateur courant
      const isUserQuestion = currentUser && (item.userId === currentUser.uid || item.userEmail === currentUser.email);
      
      // Séparer les questions répondues et non répondues de l'utilisateur
      if (isUserQuestion) {
        // On utilise maintenant le champ dédié isAnswered pour déterminer si une question a reçu une réponse
        if (item.isAnswered) {
          acc[0].push(item); // Questions répondues
        } else {
          acc[1].push(item); // Questions non répondues/en attente
        }
      }
      
      // Filtrer les questions publiques (uniquement questions répondues et approuvées)
      if (item.isApproved && item.isAnswered) {
          
        // Filtrer par phase si nécessaire
        if (selectedPhase === 'all' || item.phase === selectedPhase) {
          // Filtrer par recherche si nécessaire
          if (!searchQuery || 
              item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(searchQuery.toLowerCase())) {
            acc[2].push(item); // Questions publiques filtrées
          }
        }
      }
      
      return acc;
    },
    [[], [], []] as [FAQItem[], FAQItem[], FAQItem[]]
  );
  
  // Les questions publiques sont filtrées directement dans l'array publicQuestions
  
  // Handle toggle question
  const toggleQuestion = (id: string) => {
    if (openQuestionId === id) {
      setOpenQuestionId(null);
    } else {
      setOpenQuestionId(id);
    }
  };
  
  // Handle submit new question
  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newQuestion.trim()) return;
    
    addFAQItem({
      question: newQuestion,
      answer: "Cette question est en attente de réponse par notre équipe.",
      category: newCategory || 'général',
      phase: newPhase,
      isApproved: false,
      isAnswered: false, // Nouvelle question, pas encore répondue
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      userId: currentUser?.uid, // Stocker l'ID de l'utilisateur s'il est connecté
      userEmail: currentUser?.email // Stocker l'email de l'utilisateur s'il est connecté
    });
    
    // Reset form fields but keep the form visible to show confirmation
    setNewQuestion('');
    setNewCategory('');
    setShowConfirmation(true);
    
    // Hide form after confirmation is shown (3 seconds)
    setTimeout(() => {
      setShowConfirmation(false);
      setShowAddQuestion(false);
    }, 5000);
  };
  
  // Reset confirmation message when form is closed manually
  useEffect(() => {
    if (!showAddQuestion) {
      setShowConfirmation(false);
    }
  }, [showAddQuestion]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">Questions fréquemment posées</h1>
          <p className="text-blue-100">
            Trouvez les réponses à vos questions ou posez-en de nouvelles.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Search and filter */}
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8">
          <div className="flex-grow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Rechercher une question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value as GuidePhase | 'all')}
              className="block rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={showMyQuestions} // Désactiver le filtre par phase quand on affiche "Mes questions"
            >
              <option value="all">Toutes les phases</option>
              <option value="post-cps">Post-CPS</option>
              <option value="during-process">Pendant les démarches</option>
              <option value="pre-arrival">Pré-arrivée</option>
            </select>
            
            {currentUser && (
              <button
                type="button"
                onClick={() => setShowMyQuestions(!showMyQuestions)}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${showMyQuestions ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}
              >
                {showMyQuestions ? 'Toutes les questions' : 'Mes questions'}
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setShowAddQuestion(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" /> Question
            </button>
          </div>
        </div>
        
        {/* Add question form */}
        {showAddQuestion && (
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl p-8 max-w-xl mx-auto mb-8 animate-fade-in">
  <h2 className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2">
    <MessageSquare className="w-6 h-6 text-blue-500" />
    Poser une nouvelle question
  </h2>
  <p className="text-blue-700 text-sm mb-6">Votre question sera transmise à l’équipe, qui y répondra rapidement.</p>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Poser une nouvelle question</h2>
            <form onSubmit={handleSubmitQuestion} className="space-y-7">
              <div className="space-y-4">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                    Votre question
                  </label>
                  <textarea
                    id="question"
                    rows={3}
                    className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                    placeholder="Posez votre question ici..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phase" className="block text-sm font-medium text-gray-700">
                      Phase concernée
                    </label>
                    <select
                      id="phase"
                      className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                      value={newPhase}
                      onChange={(e) => setNewPhase(e.target.value as GuidePhase)}
                      required
                    >
                      <option value="post-cps">Post-CPS</option>
                      <option value="during-process">Pendant les démarches</option>
                      <option value="pre-arrival">Pré-arrivée</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      id="category"
                      className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                      placeholder="Ex: visa, logement, transport..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                </div>
                
                {showConfirmation ? (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">Votre question a bien été envoyée !</span>
                  </div>
                  <p className="mt-2 text-sm text-green-600">
                    Vous recevrez la réponse de l'administrateur par email et elle apparaîtra également sur la plateforme en tant que question anonyme.
                  </p>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddQuestion(false)}
                    className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-5 py-2.5 rounded-xl shadow-md text-base font-bold text-white bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all gap-2"
                  >
                    Soumettre la question
                  </button>
                </div>
              )}
              </div>
            </form>
          </div>
        )}
        
        {/* FAQ items */}
        {!showMyQuestions ? (
          // Mode standard : toutes les questions approuvées
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Questions et réponses</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {publicQuestions.length > 0 ? (
                publicQuestions.map((item) => (
                <div key={item.id} className="p-6">
                  <button
                    onClick={() => toggleQuestion(item.id)}
                    className="flex justify-between items-start w-full text-left"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-blue-700" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.question}
                          {showMyQuestions && !item.isApproved && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              En attente
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                            {item.phase === 'post-cps' ? 'Post-CPS' :
                             item.phase === 'during-process' ? 'Pendant les démarches' :
                             'Pré-arrivée'}
                          </span>
                          {item.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {openQuestionId === item.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {openQuestionId === item.id && (
                    <div className="mt-4 ml-11">
                      <p className="text-gray-700">{item.answer}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Mise à jour le {item.updatedDate}
                      </p>
                    </div>
                  )}
                </div>
              ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">
                    Aucune question ne correspond à votre recherche.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Mode "Mes questions" : affichage en deux colonnes
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Colonne 1: Questions répondues */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Questions répondues
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {answeredQuestions.length}
                  </span>
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {answeredQuestions.length > 0 ? (
                  answeredQuestions.map((item) => (
                    <div key={item.id} className="p-6">
                      <button
                        onClick={() => toggleQuestion(item.id)}
                        className="flex justify-between items-start w-full text-left"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-green-700" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900">{item.question}</h3>
                            <div className="flex items-center mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                {item.phase === 'post-cps' ? 'Post-CPS' :
                                 item.phase === 'during-process' ? 'Pendant les démarches' :
                                 'Pré-arrivée'}
                              </span>
                              {item.category && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {openQuestionId === item.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      
                      {openQuestionId === item.id && (
                        <div className="mt-4 ml-11">
                          <p className="text-gray-700">{item.answer}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Mise à jour le {item.updatedDate}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">
                      Vous n'avez pas encore de questions répondues.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Colonne 2: Questions en attente */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Questions en attente
                  <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {unansweredQuestions.length}
                  </span>
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {unansweredQuestions.length > 0 ? (
                  unansweredQuestions.map((item) => (
                    <div key={item.id} className="p-6">
                      <button
                        onClick={() => toggleQuestion(item.id)}
                        className="flex justify-between items-start w-full text-left"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-yellow-700" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900">
                              {item.question}
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                En attente
                              </span>
                            </h3>
                            <div className="flex items-center mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                {item.phase === 'post-cps' ? 'Post-CPS' :
                                 item.phase === 'during-process' ? 'Pendant les démarches' :
                                 'Pré-arrivée'}
                              </span>
                              {item.category && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {item.category}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 ml-2">
                                Posée le {item.createdDate}
                              </span>
                            </div>
                          </div>
                        </div>
                        {openQuestionId === item.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      
                      {openQuestionId === item.id && (
                        <div className="mt-4 ml-11">
                          <p className="text-gray-700 italic">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">
                      Vous n'avez pas de questions en attente de réponse.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQ;