import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { logAdminActivity } from './adminActivityLog';
import { useContent, GuidePhase, SubSection, SubSectionType, SubSectionItem } from '../../contexts/ContentContext';
import { 
  Trash2, Save, ArrowLeft, MoveVertical, Plus, Mail, Check, AlertCircle,
  List, CheckSquare, Type, X, FileEdit
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import useNotifications from '../../hooks/useNotifications';

const AdminContentEditor: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin, isEditor } = useAuth();
  
  // Déterminer si l'utilisateur est en mode admin ou éditeur en fonction de l'URL et des droits
  // Protection contre les accès non autorisés en fonction du rôle
  const urlIndicatesAdmin = window.location.href.includes('/admin/');
  
  // Si l'URL est de type admin mais que l'utilisateur n'est qu'un éditeur, force le mode éditeur
  // Cela ajoute une couche de sécurité supplémentaire
  const isAdminMode = urlIndicatesAdmin ? isAdmin : false;
  
  // Rediriger les éditeurs qui tentent d'accéder à l'interface admin
  useEffect(() => {
    if (urlIndicatesAdmin && !isAdmin && isEditor) {
      // Rediriger vers l'interface éditeur avec les mêmes paramètres
      const currentParams = window.location.search;
      navigate(`/editor/content${currentParams}`);
    }
  }, [urlIndicatesAdmin, isAdmin, isEditor, navigate]);
  
  const { sendFaqAnswerNotification } = useNotifications();
  
  // Fonction pour construire les liens en fonction du rôle de l'utilisateur
  const buildEditLink = (id: string, type: 'section' | 'faq') => {
    const baseUrl = isAdminMode ? '/admin' : '/editor';
    return `${baseUrl}/content?edit=${id}${type === 'faq' ? '&mode=faq' : ''}`;
  };
  const { 
    guideSections, 
    addGuideSection, 
    updateGuideSection, 
    deleteGuideSection,
    resources,
    faqItems,
    addFAQItem,
    updateFAQItem,
    deleteFAQItem
  } = useContent();

  // Détection du mode FAQ ou Section
  const isNewSection = searchParams.get('new') === 'section';
  const isNewFaq = searchParams.get('new') === 'faq';
  const editSectionId = isNewSection ? null : (searchParams.get('edit') && guideSections.some(s => s.id === searchParams.get('edit')) ? searchParams.get('edit') : null);
  const editFaqId = isNewFaq ? null : (searchParams.get('edit') && faqItems.some(f => f.id === searchParams.get('edit')) ? searchParams.get('edit') : null);

  // États Section
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<GuidePhase>('post-cps');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState(1);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  
  // États pour les sous-sections
  const [subSections, setSubSections] = useState<SubSection[]>([]);
  const [showSubSectionModal, setShowSubSectionModal] = useState(false);
  const [editingSubSection, setEditingSubSection] = useState<SubSection | null>(null);
  const [newSubSectionTitle, setNewSubSectionTitle] = useState('');
  const [newSubSectionType, setNewSubSectionType] = useState<SubSectionType>('bulletList');
  const [newSubSectionItems, setNewSubSectionItems] = useState<SubSectionItem[]>([]);
  const [newItemContent, setNewItemContent] = useState('');

  // États FAQ
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('');
  const [faqPhase, setFaqPhase] = useState<GuidePhase>('post-cps');
  const [questionType, setQuestionType] = useState<'phase' | 'site' | 'general'>('phase');
  const [isApproved, setIsApproved] = useState(true);
  const [isAnswered, setIsAnswered] = useState(false);

  // États pour les modales de confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'section' | 'faq'>('section');
  
  // États pour la notification d'envoi d'email
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [emailNotificationStatus, setEmailNotificationStatus] = useState<'success' | 'error' | null>(null);

  // Initialisation des états pour édition
  useEffect(() => {
    if (editSectionId) {
      const section = guideSections.find(s => s.id === editSectionId);
      if (section) {
        setTitle(section.title);
        setPhase(section.phase);
        setContent(section.content);
        setOrder(section.order);
        setSelectedResources(Array.isArray(section.resources) ? section.resources : []);
        // Initialiser les sous-sections si elles existent
        setSubSections(section.subSections || []);
      }
    } else if (isNewSection) {
      setTitle('');
      setPhase('post-cps');
      setContent('');
      const phaseSections = guideSections.filter(s => s.phase === 'post-cps');
      setOrder(phaseSections.length > 0 ? Math.max(...phaseSections.map(s => s.order)) + 1 : 1);
      setSelectedResources([]);
      setSubSections([]);
    }
    if (editFaqId) {
      const faq = faqItems.find(f => f.id === editFaqId);
      if (faq) {
        setQuestion(faq.question);
        setAnswer(faq.answer);
        setFaqCategory(faq.category || '');
        setFaqPhase(faq.phase || 'post-cps');
        setQuestionType(faq.questionType || 'phase');
        setIsApproved(!!faq.isApproved);
        setIsAnswered(!!faq.isAnswered);
      }
    } else if (isNewFaq) {
      setQuestion('');
      setAnswer('');
      setFaqCategory('');
      setFaqPhase('post-cps');
      setQuestionType('phase');
      setIsApproved(true);
      setIsAnswered(false);
    }
  }, [editSectionId, isNewSection, guideSections, editFaqId, isNewFaq, faqItems]);
  
  // Fonction pour vider le champ de réponse lorsqu'on clique sur Répondre
  const handlePrepareResponse = () => {
    setAnswer('');
    setIsAnswered(false); // Réinitialiser le statut de réponse
  };

  // Met à jour l'état isAnswered en fonction du contenu de la réponse
  const updateAnsweredStatus = (responseText: string) => {
    const hasValidAnswer = responseText.trim() !== '' && 
                           responseText !== "Cette question est en attente de réponse par notre équipe.";
    setIsAnswered(hasValidAnswer);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewFaq || editFaqId) {
      // FAQ mode
      if (editFaqId) {
        // Mettre à jour l'état isAnswered en fonction du contenu de la réponse
        const hasValidAnswer = answer.trim() !== '' && 
                              answer !== "Cette question est en attente de réponse par notre équipe.";
        // Mettre à jour l'état local pour refléter le statut qui sera sauvegardé
        setIsAnswered(hasValidAnswer);
        
        // Récupérer l'ancienne FAQ pour voir si elle avait déjà une réponse
        const oldFaq = faqItems.find(f => f.id === editFaqId);
        const wasAlreadyAnswered = oldFaq?.isAnswered || false;
        
        // Mise à jour de la FAQ dans la base de données
        updateFAQItem(editFaqId, {
          question,
          answer,
          category: faqCategory,
          phase: questionType === 'phase' ? faqPhase : undefined,
          questionType,
          isApproved,
          isAnswered: hasValidAnswer
        });
        
        // Si la question vient de recevoir une réponse et qu'elle n'était pas déjà répondue, envoyer une notification
        if (hasValidAnswer && !wasAlreadyAnswered && editFaqId) {
          // Afficher l'indicateur de chargement
          setShowEmailNotification(true);
          setEmailNotificationStatus(null); // Réinitialiser le statut
          
          // Envoi d'un email de notification à l'utilisateur
          sendFaqAnswerNotification(editFaqId, question, answer)
            .then(success => {
              if (success) {
                console.log('Email de notification envoyé avec succès');
                setEmailNotificationStatus('success');
                
                // Masquer la notification après 5 secondes
                setTimeout(() => {
                  setShowEmailNotification(false);
                }, 5000);
              } else {
                console.error('Échec de l\'envoi de l\'email de notification');
                setEmailNotificationStatus('error');
                
                // Masquer la notification après 5 secondes
                setTimeout(() => {
                  setShowEmailNotification(false);
                }, 5000);
              }
            })
            .catch(error => {
              console.error('Erreur lors de l\'envoi de l\'email de notification:', error);
              setEmailNotificationStatus('error');
              
              // Masquer la notification après 5 secondes
              setTimeout(() => {
                setShowEmailNotification(false);
              }, 5000);
            });
        }
        logAdminActivity({
          type: 'Modification',
          target: 'FAQ',
          targetId: editFaqId,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: { question }
        });
      } else {
        // Pour une nouvelle question, déterminer si elle est déjà répondue
        const hasValidAnswer = answer.trim() !== '' && 
                              answer !== "Cette question est en attente de réponse par notre équipe.";
        // Mettre à jour l'état local pour refléter le statut qui sera sauvegardé
        setIsAnswered(hasValidAnswer);
        
        addFAQItem({
          question,
          answer,
          category: faqCategory,
          phase: questionType === 'phase' ? faqPhase : undefined,
          questionType,
          isApproved,
          isAnswered: hasValidAnswer,
          createdDate: new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
        });
        logAdminActivity({
          type: 'Ajout',
          target: 'FAQ',
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: { question }
        });
      }
    } else {
      // Section mode
      if (editSectionId) {
        updateGuideSection(editSectionId, {
          title,
          phase,
          content,
          order,
          resources: selectedResources,
          subSections: subSections.length > 0 ? subSections : undefined
        });
        logAdminActivity({
          type: 'Modification',
          target: 'Section',
          targetId: editSectionId,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: { title }
        });
      } else {
        addGuideSection({
          title,
          phase,
          content,
          order,
          resources: selectedResources,
          subSections: subSections.length > 0 ? subSections : undefined
        });
        logAdminActivity({
          type: 'Ajout',
          target: 'Section',
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: { title }
        });
      }
    }
    // Rester sur la même page
  
  // Réinitialiser les champs après ajout ou modification
  if (isNewFaq || isNewSection) {
    if (isNewFaq) {
      // Réinitialiser les champs FAQ
      setQuestion('');
      setAnswer('');
      setFaqCategory('');
      setFaqPhase('post-cps');
      setQuestionType('phase');
      setIsApproved(true);
      setIsAnswered(false);
    } else if (isNewSection) {
      // Réinitialiser les champs Section
      setTitle('');
      setContent('');
      // Recalculer l'ordre pour la prochaine section
      const phaseSections = guideSections.filter(s => s.phase === phase);
      setOrder(phaseSections.length > 0 ? Math.max(...phaseSections.map(s => s.order)) + 1 : 1);
      setSelectedResources([]);
    }
  }
  };

  // Demande de confirmation avant suppression
  const handleDeleteClick = (type: 'section' | 'faq') => {
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  // Procéder à la suppression après confirmation
  const handleConfirmDelete = () => {
    if (deleteType === 'section' && editSectionId) {
      deleteGuideSection(editSectionId);
      logAdminActivity({
        type: 'Suppression',
        target: 'Section',
        targetId: editSectionId,
        user: currentUser?.uid,
        details: { title }
      });
      // Redirection vers le tableau de bord
      navigate('/admin/content');
    } else if (deleteType === 'faq' && editFaqId) {
      deleteFAQItem(editFaqId);
      logAdminActivity({
        type: 'Suppression',
        target: 'FAQ',
        targetId: editFaqId,
        user: currentUser?.uid,
        details: { question }
      });
      // Rester sur la même page au lieu de rediriger
    }
    setShowDeleteModal(false);
  };

  // Handle resource selection toggle
  const toggleResource = (resourceId: string) => {
    if (selectedResources.includes(resourceId)) {
      setSelectedResources(selectedResources.filter(id => id !== resourceId));
    } else {
      setSelectedResources([...selectedResources, resourceId]);
    }
  };
  
  // Fonctions pour gérer les sous-sections
  const openSubSectionModal = (subSection?: SubSection) => {
    if (subSection) {
      // Mode édition
      setEditingSubSection(subSection);
      setNewSubSectionTitle(subSection.title);
      setNewSubSectionType(subSection.type);
      setNewSubSectionItems([...subSection.items]);
    } else {
      // Mode création
      setEditingSubSection(null);
      setNewSubSectionTitle('');
      setNewSubSectionType('bulletList');
      setNewSubSectionItems([]);
    }
    setShowSubSectionModal(true);
  };
  
  const closeSubSectionModal = () => {
    setShowSubSectionModal(false);
    setNewSubSectionTitle('');
    setNewItemContent('');
  };
  
  const addItemToSubSection = () => {
    if (newItemContent.trim() === '') return;
    
    const newItem: SubSectionItem = {
      id: Date.now().toString(),
      content: newItemContent,
      checked: false,
      value: ''
    };
    
    setNewSubSectionItems([...newSubSectionItems, newItem]);
    setNewItemContent('');
  };
  
  const removeItemFromSubSection = (itemId: string) => {
    setNewSubSectionItems(newSubSectionItems.filter(item => item.id !== itemId));
  };
  
  const saveSubSection = async () => {
    if (newSubSectionTitle.trim() === '' || newSubSectionItems.length === 0) {
      alert('Veuillez ajouter un titre et au moins un élément');
      return;
    }
    
    const subSection: SubSection = {
      id: editingSubSection ? editingSubSection.id : Date.now().toString(),
      title: newSubSectionTitle,
      type: newSubSectionType,
      items: newSubSectionItems
    };
    
    let updatedSubSections: SubSection[];
    
    if (editingSubSection) {
      // Mode édition: remplacer la sous-section existante
      updatedSubSections = subSections.map(ss => 
        ss.id === editingSubSection.id ? subSection : ss
      );
    } else {
      // Mode création: ajouter une nouvelle sous-section
      updatedSubSections = [...subSections, subSection];
    }
    
    // Mettre à jour l'état local
    setSubSections(updatedSubSections);
    
    // Si on modifie une section existante, sauvegarder immédiatement les changements dans Firestore
    if (editSectionId) {
      try {
        // Récupérer la section actuelle
        const section = guideSections.find(s => s.id === editSectionId);
        if (section) {
          // Mettre à jour la section avec les sous-sections mises à jour
          await updateGuideSection(editSectionId, {
            subSections: updatedSubSections
          });
          
          // Logger l'activité admin
          logAdminActivity({
            type: 'Modification',
            target: 'Sous-section',
            targetId: editSectionId,
            user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
            details: { 
              action: editingSubSection ? 'Modification de sous-section' : 'Ajout de sous-section', 
              sectionTitle: title 
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la sous-section:', error);
        alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
      }
    }
    
    closeSubSectionModal();
  };
  
  const deleteSubSection = async (subSectionId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette sous-section?')) {
      // Mettre à jour l'état local
      const updatedSubSections = subSections.filter(ss => ss.id !== subSectionId);
      setSubSections(updatedSubSections);
      
      // Si on modifie une section existante, sauvegarder immédiatement les changements dans Firestore
      if (editSectionId) {
        try {
          // Récupérer la section actuelle
          const section = guideSections.find(s => s.id === editSectionId);
          if (section) {
            // Mettre à jour la section avec les sous-sections mises à jour
            await updateGuideSection(editSectionId, {
              subSections: updatedSubSections.length > 0 ? updatedSubSections : []
            });
            
            // Logger l'activité admin
            logAdminActivity({
              type: 'Modification',
              target: 'Sous-section',
              targetId: editSectionId,
              user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
              details: { action: 'Suppression de sous-section', sectionTitle: title }
            });
          }
        } catch (error) {
          console.error('Erreur lors de la suppression de la sous-section:', error);
          alert('Erreur lors de la suppression. Veuillez réessayer.');
          // Rétablir l'état précédent en cas d'erreur
          setSubSections(subSections);
        }
      }
    }
  };
  
  const moveSubSectionUp = (index: number) => {
    if (index === 0) return;
    const newSubSections = [...subSections];
    [newSubSections[index], newSubSections[index - 1]] = [newSubSections[index - 1], newSubSections[index]];
    setSubSections(newSubSections);
  };
  
  const moveSubSectionDown = (index: number) => {
    if (index === subSections.length - 1) return;
    const newSubSections = [...subSections];
    [newSubSections[index], newSubSections[index + 1]] = [newSubSections[index + 1], newSubSections[index]];
    setSubSections(newSubSections);
  };
  
  // Filter resources by selected phase
  const phaseResources = resources.filter(resource => resource.phase === phase);
  
  // Group sections by phase
  const sectionsByPhase = {
    'post-cps': guideSections.filter(s => s.phase === 'post-cps').sort((a, b) => a.order - b.order),
    'during-process': guideSections.filter(s => s.phase === 'during-process').sort((a, b) => a.order - b.order),
    'pre-arrival': guideSections.filter(s => s.phase === 'pre-arrival').sort((a, b) => a.order - b.order),
  };

  return (
    <div className="bg-gray-50 min-h-screen relative">
      {/* Notification d'envoi d'email */}
      {showEmailNotification && (
        <div 
          className={`fixed top-6 right-6 p-4 rounded-md shadow-md z-50 flex items-center transition-all duration-300 ease-in-out ${emailNotificationStatus === 'success' ? 'bg-green-100 border-l-4 border-green-500' : emailNotificationStatus === 'error' ? 'bg-red-100 border-l-4 border-red-500' : 'bg-blue-100 border-l-4 border-blue-500'}`}
        >
          {emailNotificationStatus === 'success' ? (
            <Check className="w-5 h-5 text-green-600 mr-3" />
          ) : emailNotificationStatus === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          ) : (
            <Mail className="w-5 h-5 text-blue-600 mr-3 animate-pulse" />
          )}
          <div>
            {emailNotificationStatus === 'success' ? (
              <p className="text-green-800 font-medium">Email de notification envoyé avec succès!</p>
            ) : emailNotificationStatus === 'error' ? (
              <p className="text-red-800 font-medium">Échec de l'envoi de l'email de notification.</p>
            ) : (
              <p className="text-blue-800 font-medium">Envoi de la notification par email...</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">
            {isNewSection ? 'Ajouter une nouvelle section' :
              isNewFaq ? 'Ajouter une question FAQ' :
              editFaqId ? 'Modifier la FAQ' :
              editSectionId ? 'Modifier la section' : 'Édition'}
          </h1>
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Section editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {(isNewFaq || editFaqId)
                ? (
                  // --- FORMULAIRE FAQ ---
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="faq-question" className="block text-sm font-medium text-gray-700">
                          Question
                        </label>
                        <input
                          type="text"
                          id="faq-question"
                          className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                          value={question}
                          onChange={e => setQuestion(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center">
                          <label htmlFor="faq-answer" className="block text-sm font-medium text-gray-700">
                            Réponse
                          </label>
                          {editFaqId && (
                            <button
                              type="button"
                              onClick={handlePrepareResponse}
                              className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                              Vider et répondre
                            </button>
                          )}
                        </div>
                        <textarea
                          id="faq-answer"
                          rows={6}
                          className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                          value={answer}
                          onChange={e => {
                            setAnswer(e.target.value);
                            updateAnsweredStatus(e.target.value);
                          }}
                          required
                        />
                        <div className="mt-2 flex items-center text-sm">
                          <div className={`w-3 h-3 rounded-full ${isAnswered ? 'bg-green-500' : 'bg-yellow-500'} mr-2`}></div>
                          <span className="text-gray-600">
                            {isAnswered 
                              ? "Cette question est marquée comme répondue" 
                              : "Cette question est en attente de réponse"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="faq-questionType" className="block text-sm font-medium text-gray-700">
                          Type de question
                        </label>
                        <select
                          id="faq-questionType"
                          className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                          value={questionType}
                          onChange={e => setQuestionType(e.target.value as 'phase' | 'site' | 'general')}
                          required
                        >
                          <option value="phase">En lien avec une phase</option>
                          <option value="site">Fonctionnement du site</option>
                          <option value="general">Question générale</option>
                        </select>
                      </div>

                      {questionType === 'phase' && (
                        <div>
                          <label htmlFor="faq-phase" className="block text-sm font-medium text-gray-700">
                            Phase
                          </label>
                          <select
                            id="faq-phase"
                            className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                            value={faqPhase}
                            onChange={e => setFaqPhase(e.target.value as GuidePhase)}
                            required={questionType === 'phase'}
                          >
                            <option value="post-cps">Post-CPS</option>
                            <option value="during-process">Pendant les démarches</option>
                            <option value="pre-arrival">Pré-arrivée</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label htmlFor="faq-category" className="block text-sm font-medium text-gray-700">
                          Catégorie
                        </label>
                        <input
                          type="text"
                          id="faq-category"
                          className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                          value={faqCategory}
                          onChange={e => setFaqCategory(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="faq-approved"
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={isApproved}
                            onChange={e => setIsApproved(e.target.checked)}
                          />
                          <label htmlFor="faq-approved" className="ml-2 block text-sm text-gray-700">
                            Approuvée (visible publiquement)
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                          {editFaqId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick('faq')}
                              className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <Trash2 className="mr-2 -ml-0.5 h-4 w-4" /> Supprimer
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-xl shadow-md text-base font-bold text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 border border-blue-200 transition-all gap-2"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-xl shadow-md text-base font-bold text-white bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all gap-2"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {isNewFaq ? 'Ajouter' : 'Enregistrer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit}>


                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Titre de la section
                    </label>
                    <input
                      type="text"
                      id="title"
                      className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phase" className="block text-sm font-medium text-gray-700">
                      Phase
                    </label>
                    <select
                      id="phase"
                      className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                      value={phase}
                      onChange={(e) => {
                        const newPhase = e.target.value as GuidePhase;
                        setPhase(newPhase);
                        // Update order to be at the end of the selected phase
                        const phaseSections = guideSections.filter(s => s.phase === newPhase);
                        setOrder(phaseSections.length > 0 ? Math.max(...phaseSections.map(s => s.order)) + 1 : 1);
                        // Clear selected resources as they may not be relevant to the new phase
                        setSelectedResources([]);
                      }}
                      required
                    >
                      <option value="post-cps">Post-CPS</option>
                      <option value="during-process">Pendant les démarches</option>
                      <option value="pre-arrival">Pré-arrivée</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                      Ordre d'affichage
                    </label>
                    <input
                      type="number"
                      id="order"
                      min="1"
                      className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                      value={order}
                      onChange={(e) => setOrder(parseInt(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Contenu de la section
                    </label>
                    <textarea
                      id="content"
                      rows={8}
                      className="mt-2 block w-full rounded-lg border border-blue-200 bg-blue-50/30 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400 text-base px-4 py-2"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Sous-sections */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Sous-sections
                      </label>
                      <button
                        type="button"
                        onClick={() => openSubSectionModal()}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter une sous-section
                      </button>
                    </div>
                    
                    {subSections.length > 0 ? (
                      <div className="mt-2 space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {subSections.map((subSection, index) => (
                          <div key={subSection.id} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                {subSection.type === 'bulletList' && <List className="w-4 h-4 text-blue-500 mr-2" />}
                                {subSection.type === 'checkList' && <CheckSquare className="w-4 h-4 text-green-500 mr-2" />}
                                {subSection.type === 'inputField' && <Type className="w-4 h-4 text-purple-500 mr-2" />}
                                <h4 className="text-md font-medium text-gray-800">{subSection.title}</h4>
                              </div>
                              <div className="flex space-x-1">
                                <button 
                                  type="button" 
                                  onClick={() => moveSubSectionUp(index)}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded" 
                                  disabled={index === 0}
                                  title="Monter">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => moveSubSectionDown(index)}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded" 
                                  disabled={index === subSections.length - 1}
                                  title="Descendre">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => openSubSectionModal(subSection)}
                                  className="text-blue-500 hover:text-blue-700 p-1 rounded"
                                  title="Modifier">
                                  <FileEdit className="h-4 w-4" />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => deleteSubSection(subSection.id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded"
                                  title="Supprimer">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <ul className="pl-5 mt-1 space-y-1">
                              {subSection.items.map(item => (
                                <li key={item.id} className="text-sm text-gray-700">
                                  {subSection.type === 'bulletList' && <span>• {item.content}</span>}
                                  {subSection.type === 'checkList' && (
                                    <div className="flex items-center">
                                      <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span>{item.content}</span>
                                    </div>
                                  )}
                                  {subSection.type === 'inputField' && (
                                    <div className="flex items-center">
                                      <span>{item.content}:</span>
                                      <span className="ml-2 text-gray-400 italic">champ de saisie</span>
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">
                        Aucune sous-section ajoutée. Ajoutez des sous-sections pour organiser votre contenu.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ressources associées
                    </label>
                    
                    {Array.isArray(phaseResources) && phaseResources.length > 0 ? (
                      <div className="mt-1 border border-gray-300 rounded-md divide-y">
                        {phaseResources.map(resource => (
                          <div
                            key={resource.id}
                            className="flex items-center p-3 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              id={`resource-${resource.id}`}
                              className="h-4 w-4 text-blue-600 rounded"
                              checked={selectedResources.includes(resource.id)}
                              onChange={() => toggleResource(resource.id)}
                            />
                            <label
                              htmlFor={`resource-${resource.id}`}
                              className="ml-3 block text-sm text-gray-700"
                            >
                              {resource.title}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Aucune ressource disponible pour cette phase. Ajoutez d'abord des ressources.
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
                    <div>
                      {editSectionId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick('section')}
                          className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 className="mr-2 -ml-0.5 h-4 w-4" /> Supprimer
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-xl shadow-md text-base font-bold text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 border border-blue-200 transition-all gap-2"
                      >
                        Annuler
                      </button>
                      
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-xl shadow-md text-base font-bold text-white bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all gap-2"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isNewSection ? 'Ajouter' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
          </div>
          
          {/* Sections overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Sections existantes</h2>
                <button
                  onClick={() => navigate(`${isAdminMode ? '/admin' : '/editor'}/content?new=section`)}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Post-CPS sections */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-2">Post-CPS</h3>
                  {Array.isArray(sectionsByPhase['post-cps']) && sectionsByPhase['post-cps'].length > 0 ? (
                    <ul className="space-y-2">
                      {sectionsByPhase['post-cps'].map(section => (
                        <li key={section.id}>
                          <button
                            onClick={() => navigate(buildEditLink(section.id, 'section'))}
                            className={`flex items-center w-full p-2 rounded-md text-left hover:bg-gray-50 transition-colors ${
                              editSectionId === section.id ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div className="w-6 text-center mr-2 text-gray-500">{section.order}</div>
                            <span className="flex-grow">{section.title}</span>
                            <MoveVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune section disponible</p>
                  )}
                </div>
                
                {/* During process sections */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-2">Pendant les démarches</h3>
                  {Array.isArray(sectionsByPhase['during-process']) && sectionsByPhase['during-process'].length > 0 ? (
                    <ul className="space-y-2">
                      {sectionsByPhase['during-process'].map(section => (
                        <li key={section.id}>
                          <button
                            onClick={() => navigate(buildEditLink(section.id, 'section'))}
                            className={`flex items-center w-full p-2 rounded-md text-left hover:bg-gray-50 transition-colors ${
                              editSectionId === section.id ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div className="w-6 text-center mr-2 text-gray-500">{section.order}</div>
                            <span className="flex-grow">{section.title}</span>
                            <MoveVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune section disponible</p>
                  )}
                </div>
                
                {/* Pre-arrival sections */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-2">Pré-arrivée</h3>
                  {Array.isArray(sectionsByPhase['pre-arrival']) && sectionsByPhase['pre-arrival'].length > 0 ? (
                    <ul className="space-y-2">
                      {sectionsByPhase['pre-arrival'].map(section => (
                        <li key={section.id}>
                          <button
                            onClick={() => navigate(buildEditLink(section.id, 'section'))}
                            className={`flex items-center w-full p-2 rounded-md text-left hover:bg-gray-50 transition-colors ${
                              editSectionId === section.id ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div className="w-6 text-center mr-2 text-gray-500">{section.order}</div>
                            <span className="flex-grow">{section.title}</span>
                            <MoveVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune section disponible</p>
                  )}
                </div>
                
                {/* FAQ Items */}
                <div className="mt-8 border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Questions fréquentes</h2>
                    <button
                      onClick={() => navigate(`${isAdminMode ? '/admin' : '/editor'}/content?new=faq&mode=faq`)}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </button>
                  </div>
                  
                  {/* Group FAQ by category */}
                  {(() => {
                    // Group FAQ items by category
                    const faqByCategory: Record<string, typeof faqItems> = {};
                    
                    faqItems.forEach(faq => {
                      const category = faq.category || 'Non catégorisé';
                      if (!faqByCategory[category]) {
                        faqByCategory[category] = [];
                      }
                      faqByCategory[category].push(faq);
                    });
                    
                    // Render each category
                    return Object.entries(faqByCategory).map(([category, items]) => (
                      <div key={category} className="mb-4">
                        <h3 className="text-md font-semibold text-gray-900 mb-2">{category}</h3>
                        {items.length > 0 ? (
                          <ul className="space-y-2">
                            {items.map(faq => (
                              <li key={faq.id}>
                                <button
                                  onClick={() => navigate(buildEditLink(faq.id, 'faq'))}
                                  className={`flex items-center w-full p-2 rounded-md text-left hover:bg-gray-50 transition-colors ${
                                    editFaqId === faq.id ? 'bg-blue-50 border border-blue-200' : ''
                                  }`}
                                >
                                  <span className="flex-grow">{faq.question}</span>
                                  {!faq.isAnswered && 
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mr-2">
                                      En attente
                                    </span>
                                  }
                                  {faq.isApproved ? 
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                      Approuvée
                                    </span> :
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                                      Non approuvée
                                    </span>
                                  }
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">Aucune question disponible</p>
                        )}
                      </div>
                    ));
                  })()} 
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={`Confirmer la suppression de ${deleteType === 'section' ? 'la section' : 'la question FAQ'}`}
        message={deleteType === 'section'
          ? `Êtes-vous sûr de vouloir supprimer la section "${title}" ? Cette action est irréversible.`
          : `Êtes-vous sûr de vouloir supprimer la question "${question}" ? Cette action est irréversible.`
        }
        confirmButtonText="Supprimer"
        type="danger"
      />
      
      {/* Modal d'ajout/édition de sous-section */}
      {showSubSectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {editingSubSection ? 'Modifier la sous-section' : 'Ajouter une sous-section'}
              </h3>
              <button
                onClick={closeSubSectionModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              <div>
                <label htmlFor="subSectionTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la sous-section
                </label>
                <input
                  type="text"
                  id="subSectionTitle"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  value={newSubSectionTitle}
                  onChange={(e) => setNewSubSectionTitle(e.target.value)}
                  placeholder="Ex: Documents nécessaires"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de sous-section
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    className={`flex items-center justify-center px-4 py-2 border rounded-md ${newSubSectionType === 'bulletList' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setNewSubSectionType('bulletList')}
                  >
                    <List className="w-4 h-4 mr-2" />
                    Liste à puces
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center px-4 py-2 border rounded-md ${newSubSectionType === 'checkList' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setNewSubSectionType('checkList')}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Cases à cocher
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center px-4 py-2 border rounded-md ${newSubSectionType === 'inputField' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setNewSubSectionType('inputField')}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Champs à remplir
                  </button>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {newSubSectionType === 'bulletList' ? 'Éléments de la liste' : 
                     newSubSectionType === 'checkList' ? 'Éléments à cocher' : 
                     'Champs à remplir'}
                  </label>
                </div>
                
                <div className="mb-4 flex">
                  <input
                    type="text"
                    className="block w-full rounded-l-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    placeholder={newSubSectionType === 'bulletList' ? 'Nouvel élément de liste' : 
                               newSubSectionType === 'checkList' ? 'Nouvelle case à cocher' : 
                               'Libellé du champ'}
                  />
                  <button
                    type="button"
                    onClick={addItemToSubSection}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-r-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {newSubSectionItems.length > 0 ? (
                  <ul className="bg-gray-50 rounded-md border border-gray-200 p-3 space-y-2 max-h-60 overflow-y-auto">
                    {newSubSectionItems.map((item) => (
                      <li key={item.id} className="flex items-center justify-between group p-2 hover:bg-gray-100 rounded-md">
                        <div className="flex items-center">
                          {newSubSectionType === 'bulletList' && <span className="mr-2">•</span>}
                          {newSubSectionType === 'checkList' && <CheckSquare className="w-4 h-4 mr-2 text-gray-400" />}
                          {newSubSectionType === 'inputField' && <Type className="w-4 h-4 mr-2 text-gray-400" />}
                          <span>{item.content}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemFromSubSection(item.id)}
                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    Aucun élément ajouté. Ajoutez au moins un élément pour continuer.
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeSubSectionModal}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveSubSection}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingSubSection ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminContentEditor;