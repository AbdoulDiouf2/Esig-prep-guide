import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { logAdminActivity } from './adminActivityLog';
import { useContent, GuidePhase } from '../../contexts/ContentContext';
import { Trash2, Save, ArrowLeft, MoveVertical, Plus, Mail, Check, AlertCircle } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import useNotifications from '../../hooks/useNotifications';

const AdminContentEditor: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { sendFaqAnswerNotification } = useNotifications();
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
      }
    } else if (isNewSection) {
      setTitle('');
      setPhase('post-cps');
      setContent('');
      const phaseSections = guideSections.filter(s => s.phase === 'post-cps');
      setOrder(phaseSections.length > 0 ? Math.max(...phaseSections.map(s => s.order)) + 1 : 1);
      setSelectedResources([]);
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
          resources: selectedResources
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
          resources: selectedResources
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
                  onClick={() => navigate('/admin/content?new=section')}
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
                            onClick={() => navigate(`/admin/content?edit=${section.id}`)}
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
                            onClick={() => navigate(`/admin/content?edit=${section.id}`)}
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
                            onClick={() => navigate(`/admin/content?edit=${section.id}`)}
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
                      onClick={() => navigate('/admin/content?new=faq')}
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
                                  onClick={() => navigate(`/admin/content?edit=${faq.id}`)}
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
    </div>
  );
}

export default AdminContentEditor;