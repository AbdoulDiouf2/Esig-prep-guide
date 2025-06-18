import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getUserProgression, setUserProgression } from '../services/progressionService';
import { useAuth } from '../contexts/AuthContext';
import { useContent, GuidePhase } from '../contexts/ContentContext';
import { FileText, CheckCircle, List, CheckSquare, Type, X, Check, Info, Users, MessageSquare } from 'lucide-react';
import SubsectionForm from '../components/subsection/SubsectionForm';
import { 
  getUserSubsectionData, 
  saveUserCheckItems, 
  saveUserInputValues,
  saveUserTypedValues, 
  cleanupSubsectionData, 
  TypedValue 
} from '../services/subsectionDataService';
import { ChatNotificationService } from '../services/chatNotificationService';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    guideSections,
    resources,
    getGuideSectionsByPhase,
    faqItems
  } = useContent();
  
  // Références pour le positionnement de la bulle d'aide
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  
  const [activePhase, setActivePhase] = useState<GuidePhase>('post-cps');
  // État pour les notifications de chat non lues
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);
  // Progress tracking (would be stored in user profile in a real app)
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  // État pour les cases à cocher des sous-sections
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  // État pour les champs de saisie des sous-sections
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [typedValues, setTypedValues] = useState<Record<string, TypedValue>>({});
  // État de chargement des données des sous-sections
  const [subsectionDataLoading, setSubsectionDataLoading] = useState<boolean>(true);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [progressLoading, setProgressLoading] = useState<boolean>(true);
  // État de publication du forum

  // Fermer la bulle d'aide si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpButtonRef.current && !helpButtonRef.current.contains(event.target as Node) && showHelp) {
        setShowHelp(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHelp]);

  // Charger les données de progression de l'utilisateur
  useEffect(() => {
    if (currentUser?.uid) {
      setProgressLoading(true);
      getUserProgression(currentUser.uid)
        .then((sections) => setCompletedSections(sections))
        .finally(() => setProgressLoading(false));
    }
  }, [currentUser?.uid]);
  
  // Charger les données des sous-sections (cases à cocher et champs de saisie)
  useEffect(() => {
    if (currentUser?.uid) {
      setSubsectionDataLoading(true);
      getUserSubsectionData(currentUser.uid)
        .then((data) => {
          setCheckedItems(data.checkItems || {});
          setInputValues(data.inputValues || {});
          // Initialiser les valeurs typées si elles existent
          if (data.typedValues) {
            setTypedValues(data.typedValues);
          }
        })
        .catch(error => console.error('Erreur lors du chargement des données de sous-section:', error))
        .finally(() => setSubsectionDataLoading(false));
    }
  }, [currentUser?.uid]);

  // Extraire tous les IDs d'items de sous-sections valides actuellement
  const getAllValidSubsectionItemIds = useCallback(() => {
    const validItemIds: string[] = [];
    
    // Parcourir toutes les sections pour collecter les IDs des items de sous-sections
    guideSections.forEach(section => {
      if (section.subSections) {
        section.subSections.forEach(subSection => {
          subSection.items.forEach(item => {
            validItemIds.push(item.id);
          });
        });
      }
    });
    
    return validItemIds;
  }, [guideSections]);
  
  // Nettoyer les données obsolètes quand les sous-sections changent
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté et que les sections sont chargées
    if (currentUser?.uid && guideSections.length > 0 && !subsectionDataLoading) {
      const validItemIds = getAllValidSubsectionItemIds();
      
      // Nettoyer les données
      cleanupSubsectionData(currentUser.uid, validItemIds)
        .then(() => {
          // Actualiser les données locales après le nettoyage
          return getUserSubsectionData(currentUser.uid)
        .then(data => {
          setCheckedItems(data.checkItems);
          setInputValues(data.inputValues);
          // Initialiser les valeurs typées si elles existent
          if (data.typedValues) {
            setTypedValues(data.typedValues);
          }
        })
        .catch(error => console.error('Erreur lors du chargement des données de sous-section:', error))
        .finally(() => setSubsectionDataLoading(false));
        })
        .catch(error => console.error("Erreur lors du nettoyage des données de sous-section:", error));
    }
  }, [currentUser?.uid, guideSections, getAllValidSubsectionItemIds, subsectionDataLoading]);

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
  
  // Vérifier si une section est complètement remplie
  const checkSectionCompletion = useCallback((sectionId: string, currentCheckedItems: Record<string, boolean>, currentInputValues: Record<string, string>) => {
    // Si la section est déjà marquée comme complétée, rien à faire
    if (completedSections.includes(sectionId)) {
      return false; // Aucun changement nécessaire
    }
    
    // Trouver la section concernée
    const section = guideSections.find(s => s.id === sectionId);
    if (!section || !section.subSections || section.subSections.length === 0) {
      return false; // Pas de sous-sections à vérifier
    }
    
    // Compter les éléments interactifs et ceux complétés
    let totalInteractiveItems = 0;
    let completedInteractiveItems = 0;
    
    section.subSections.forEach(subSection => {
      // Ne vérifier que les sous-sections interactives
      if (subSection.type === 'checkList' || subSection.type === 'inputField') {
        subSection.items.forEach(item => {
          totalInteractiveItems++;
          
          if (subSection.type === 'checkList' && currentCheckedItems[item.id]) {
            completedInteractiveItems++;
          } else if (subSection.type === 'inputField' && currentInputValues[item.id] && currentInputValues[item.id].trim() !== '') {
            completedInteractiveItems++;
          }
        });
      }
    });
    
    // Si tous les éléments interactifs sont complétés, marquer la section comme complète
    return totalInteractiveItems > 0 && completedInteractiveItems === totalInteractiveItems;
  }, [guideSections, completedSections]);
  
  // Mettre à jour la liste des sections complétées et sauvegarder
  const updateCompletedSections = useCallback(async (sectionId: string) => {
    if (!completedSections.includes(sectionId)) {
      const updatedSections = [...completedSections, sectionId];
      setCompletedSections(updatedSections);
      
      if (currentUser?.uid) {
        try {
          await setUserProgression(currentUser.uid, updatedSections);
        } catch (error) {
          console.error('Erreur lors de la mise à jour des sections complétées:', error);
        }
      }
    }
  }, [completedSections, currentUser?.uid]);
  
  // Vérifier les sections après chaque modification des valeurs
  useEffect(() => {
    if (currentUser?.uid && !progressLoading && !subsectionDataLoading) {
      // Vérifier toutes les sections pour la complétion automatique
      guideSections.forEach(section => {
        if (checkSectionCompletion(section.id, checkedItems, inputValues)) {
          updateCompletedSections(section.id);
        }
      });
    }
  }, [checkedItems, inputValues, guideSections, currentUser?.uid, progressLoading, subsectionDataLoading, checkSectionCompletion, updateCompletedSections]);
  
  // Fonction pour mettre à jour et sauvegarder les cases à cocher
  const handleCheckItemChange = useCallback(async (itemId: string) => {
    const newValue = !checkedItems[itemId];
    const updatedItems = {
      ...checkedItems,
      [itemId]: newValue
    };
    
    setCheckedItems(updatedItems);
    
    if (currentUser?.uid) {
      try {
        await saveUserCheckItems(currentUser.uid, updatedItems);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la case à cocher:', error);
      }
    }
  }, [checkedItems, currentUser?.uid]);
  
  // Fonction pour mettre à jour les champs de saisie et les sauvegarder
  const handleInputChange = useCallback((itemId: string, value: string) => {
    const updatedValues = {
      ...inputValues,
      [itemId]: value
    };
    
    setInputValues(updatedValues);
    
    // Sauvegarder les changements dans Firestore
    if (currentUser?.uid) {
      try {
        saveUserInputValues(currentUser.uid, updatedValues);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du champ de saisie:', error);
      }
    }
  }, [inputValues, currentUser?.uid]);
  
  // Fonction pour mettre à jour les valeurs typées sans sauvegarde immédiate
  const handleTypedValueChange = useCallback((itemId: string, value: TypedValue) => {
    const updatedValues = {
      ...typedValues,
      [itemId]: value
    };
    
    setTypedValues(updatedValues);
  }, [typedValues]);
  
  // Passer cette fonction au SubsectionForm pour mise à jour des valeurs typées
  const handleTypedInput = useCallback((itemId: string, value: TypedValue) => {
    handleTypedValueChange(itemId, value);
    // Sauvegarder automatiquement après la mise à jour
    if (currentUser?.uid) {
      saveUserTypedValues(currentUser.uid, {
        ...typedValues,
        [itemId]: value
      });
    }
  }, [currentUser?.uid, handleTypedValueChange, typedValues]);
  
  // Les fonctions validateAndSaveInput et clearInputField ont été supprimées car elles ne sont plus utilisées
  // La fonctionnalité de validation et sauvegarde est désormais gérée directement par handleTypedInput
  // et les composants SubsectionForm et TypedInputField
  
  const phaseSections = getGuideSectionsByPhase ? getGuideSectionsByPhase(activePhase) : [];
  // const phaseResources = getResourcesByPhase ? getResourcesByPhase(activePhase) : [];
  
  // Calculate progress percentage
  const calculateProgressPercentage = (phase: GuidePhase) => {
    const phaseSectionsSafe = getGuideSectionsByPhase ? getGuideSectionsByPhase(phase) : [];
    if (!phaseSectionsSafe || phaseSectionsSafe.length === 0) return 0;
    
    // Calculer le nombre total de composants et ceux complétés
    let totalComponents = 0;
    let completedComponents = 0;
    
    phaseSectionsSafe.forEach(section => {
      // Chaque section compte comme un composant de base
      totalComponents++;
      
      // Si la section est marquée comme complétée
      if (completedSections.includes(section.id)) {
        completedComponents++;
      }
      
      // Ajouter les sous-sections interactives au calcul
      if (section.subSections && section.subSections.length > 0) {
        section.subSections.forEach(subSection => {
          // Traiter uniquement les sous-sections interactives (checkList et inputField)
          if (subSection.type === 'checkList' || subSection.type === 'inputField') {
            // Chaque item dans ces sous-sections compte dans la progression
            const interactiveItemsCount = subSection.items.length;
            totalComponents += interactiveItemsCount;
            
            // Calculer les items complétés
            if (subSection.type === 'checkList') {
              // Compter les cases cochées
              subSection.items.forEach(item => {
                if (checkedItems[item.id]) {
                  completedComponents++;
                }
              });
            } else if (subSection.type === 'inputField') {
              // Compter les champs de saisie remplis
              subSection.items.forEach(item => {
                if (inputValues[item.id] && inputValues[item.id].trim() !== '') {
                  completedComponents++;
                }
              });
            }
          }
        });
      }
    });
    
    // Calculer le pourcentage global
    return totalComponents > 0 ? Math.round((completedComponents / totalComponents) * 100) : 0;
  };

  // Calcul de la progression globale (toutes phases confondues)
  const calculateGlobalProgress = () => {
    if (!guideSections || guideSections.length === 0) return 0;
    
    // Calculer le nombre total de composants et ceux complétés
    let totalComponents = 0;
    let completedComponents = 0;
    
    guideSections.forEach(section => {
      // Chaque section compte comme un composant de base
      totalComponents++;
      
      // Si la section est marquée comme complétée
      if (completedSections.includes(section.id)) {
        completedComponents++;
      }
      
      // Ajouter les sous-sections interactives au calcul
      if (section.subSections && section.subSections.length > 0) {
        section.subSections.forEach(subSection => {
          // Traiter uniquement les sous-sections interactives (checkList et inputField)
          if (subSection.type === 'checkList' || subSection.type === 'inputField') {
            // Chaque item dans ces sous-sections compte dans la progression
            const interactiveItemsCount = subSection.items.length;
            totalComponents += interactiveItemsCount;
            
            // Calculer les items complétés
            if (subSection.type === 'checkList') {
              // Compter les cases cochées
              subSection.items.forEach(item => {
                if (checkedItems[item.id]) {
                  completedComponents++;
                }
              });
            } else if (subSection.type === 'inputField') {
              // Compter les champs de saisie remplis
              subSection.items.forEach(item => {
                if (inputValues[item.id] && inputValues[item.id].trim() !== '') {
                  completedComponents++;
                }
              });
            }
          }
        });
      }
    });
    
    // Calculer le pourcentage global
    return totalComponents > 0 ? Math.round((completedComponents / totalComponents) * 100) : 0;
  };

  // Effet pour vérifier les messages non lus
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Vérifier les messages non lus au chargement
    const checkUnread = async () => {
      const hasUnread = await ChatNotificationService.checkUnreadMessages(currentUser.uid);
      setHasUnreadMessages(hasUnread);
    };

    checkUnread();

    // S'abonner aux changements de messages non lus
    const unsubscribe = ChatNotificationService.subscribeToUnreadMessages(
      currentUser.uid,
      (hasUnread) => {
        setHasUnreadMessages(hasUnread);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Affichage de chargement si les données ne sont pas encore chargées
  if (!resources || !faqItems || !guideSections || progressLoading || subsectionDataLoading) {
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
      
      <div className="container mx-auto px-4 py-8 relative">
        {/* Bouton d'aide flottant */}
        <div className="fixed bottom-6 left-6 z-50">
          <button
            ref={helpButtonRef}
            onClick={() => setShowHelp(!showHelp)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
            aria-label="Aide"
            title="Comment ça fonctionne ?"
          >
            <Info className="w-6 h-6" />
          </button>
          
          {/* Bulle d'aide */}
          {showHelp && (
            <div className="absolute bottom-16 left-0 w-72 bg-white rounded-lg shadow-xl p-4 text-sm animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-900">Comment ça fonctionne ?</h3>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3 text-gray-700">
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Progression</h4>
                  <p>Cocher toutes les cases et remplir tous les champs d'une section la marque automatiquement comme complétée.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Sections</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Naviguez entre les phases avec les onglets en haut</li>
                    <li>Les sous-sections peuvent être des listes, cases à cocher ou champs</li>
                    <li>Vos réponses sont automatiquement sauvegardées</li>
                  </ul>
                </div>
                
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                  <p>Cliquez sur <span className="inline-flex items-center"><Check className="w-3 h-3 text-green-500 mr-1" /></span> pour valider vos réponses</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Forum and Admin Chat Buttons */}
          <div className="mb-4 lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/forum" className="flex items-center justify-between bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 rounded-full p-2">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-800">Forum des étudiants</h3>
                      <p className="text-xs text-blue-600">Discussions entre étudiants</p>
                    </div>
                  </div>
                  <span className="text-blue-600 text-sm font-medium">Accéder →</span>
                </Link>
                
                <Link to="/user-chat" className="flex items-center justify-between bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-3 transition-colors relative">
                  {hasUnreadMessages && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 rounded-full p-2">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800">Discuter avec l'admin</h3>
                      <p className="text-xs text-green-600">Support et assistance</p>
                    </div>
                  </div>
                  <span className="text-green-600 text-sm font-medium">Discuter →</span>
                </Link>
              </div>
          </div>
          
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
                  {activePhase === 'pre-arrival' && 'Après votre arrivée en France'}
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
                          
                          {/* Sous-sections */}
                          {section.subSections && section.subSections.length > 0 && (
                            <div className="mt-4 space-y-4">
                              {section.subSections.map((subSection) => (
                                <div key={subSection.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                  <h4 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                                    {subSection.type === 'bulletList' && <List className="w-4 h-4 text-blue-500 mr-2" />}
                                    {subSection.type === 'checkList' && <CheckSquare className="w-4 h-4 text-green-500 mr-2" />}
                                    {subSection.type === 'inputField' && <Type className="w-4 h-4 text-purple-500 mr-2" />}
                                    {subSection.title}
                                  </h4>
                                  
                                  <div className="ml-1">
                                    <SubsectionForm
                                      subSection={subSection}
                                      checkedItems={checkedItems}
                                      inputValues={inputValues}
                                      typedValues={typedValues}
                                      onCheckChange={(itemId) => handleCheckItemChange(itemId)}
                                      onInputChange={handleInputChange}
                                      onTypedValueChange={handleTypedInput}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
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