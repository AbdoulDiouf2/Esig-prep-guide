import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useContent, GuidePhase, GuideSection } from '../../contexts/ContentContext';
import { Trash2, Save, ArrowLeft, MoveVertical, Plus } from 'lucide-react';

const AdminContentEditor: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    guideSections, 
    addGuideSection, 
    updateGuideSection, 
    deleteGuideSection,
    resources
  } = useContent();
  
  const isNewSection = searchParams.get('new') === 'section';
  const editSectionId = searchParams.get('edit');
  
  // Form state
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<GuidePhase>('post-cps');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState(1);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  
  // Initialize form with existing data if editing
  useEffect(() => {
    if (editSectionId) {
      const section = guideSections.find(s => s.id === editSectionId);
      if (section) {
        setTitle(section.title);
        setPhase(section.phase);
        setContent(section.content);
        setOrder(section.order);
        setSelectedResources(section.resources);
      }
    } else if (isNewSection) {
      // For a new section, initialize with default values
      setTitle('');
      setPhase('post-cps');
      setContent('');
      // Set order to be after the last section in the selected phase
      const phaseSections = guideSections.filter(s => s.phase === 'post-cps');
      setOrder(phaseSections.length > 0 ? Math.max(...phaseSections.map(s => s.order)) + 1 : 1);
      setSelectedResources([]);
    }
  }, [editSectionId, isNewSection, guideSections]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editSectionId) {
      // Update existing section
      updateGuideSection(editSectionId, {
        title,
        phase,
        content,
        order,
        resources: selectedResources
      });
    } else {
      // Add new section
      addGuideSection({
        title,
        phase,
        content,
        order,
        resources: selectedResources
      });
    }
    
    // Navigate back to content list
    navigate('/admin');
  };
  
  // Handle delete
  const handleDelete = () => {
    if (editSectionId && window.confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) {
      deleteGuideSection(editSectionId);
      navigate('/admin');
    }
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
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">
            {isNewSection ? 'Ajouter une nouvelle section' : 'Modifier la section'}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Titre de la section
                    </label>
                    <input
                      type="text"
                      id="title"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ressources associées
                    </label>
                    
                    {phaseResources.length > 0 ? (
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
                  
                  <div className="flex justify-between">
                    <div>
                      {editSectionId && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </button>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Annuler
                      </button>
                      
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isNewSection ? 'Ajouter' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          {/* Sections overview */}
          <div className="space-y-6">
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
                  {sectionsByPhase['post-cps'].length > 0 ? (
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
                  {sectionsByPhase['during-process'].length > 0 ? (
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
                  {sectionsByPhase['pre-arrival'].length > 0 ? (
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContentEditor;