import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type GuidePhase = 'post-cps' | 'during-process' | 'pre-arrival';

export interface ResourceDocument {
  id: string;
  title: string;
  description: string;
  phase: GuidePhase;
  category: string;
  fileUrl: string;
  fileType: 'pdf' | 'doc' | 'image' | 'link';
  uploadDate: string;
  updatedDate: string;
}

export interface GuideSection {
  id: string;
  title: string;
  phase: GuidePhase;
  content: string;
  order: number;
  resources: string[]; // Resource IDs
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  phase: GuidePhase;
  isApproved: boolean;
  createdDate: string;
  updatedDate: string;
}

type ContentContextType = {
  resources: ResourceDocument[];
  guideSections: GuideSection[];
  faqItems: FAQItem[];
  addResource: (resource: Omit<ResourceDocument, 'id'>) => void;
  updateResource: (id: string, resource: Partial<ResourceDocument>) => void;
  deleteResource: (id: string) => void;
  addGuideSection: (section: Omit<GuideSection, 'id'>) => void;
  updateGuideSection: (id: string, section: Partial<GuideSection>) => void;
  deleteGuideSection: (id: string) => void;
  addFAQItem: (item: Omit<FAQItem, 'id'>) => void;
  updateFAQItem: (id: string, item: Partial<FAQItem>) => void;
  deleteFAQItem: (id: string) => void;
  getResourcesByPhase: (phase: GuidePhase) => ResourceDocument[];
  getGuideSectionsByPhase: (phase: GuidePhase) => GuideSection[];
  getFAQItemsByPhase: (phase: GuidePhase) => FAQItem[];
  searchResources: (query: string) => ResourceDocument[];
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

// Sample data
const initialResources: ResourceDocument[] = [
  {
    id: '1',
    title: 'Guide Campus France',
    description: 'Guide complet pour la procédure Campus France',
    phase: 'post-cps',
    category: 'administratif',
    fileUrl: 'https://example.com/campus-france.pdf',
    fileType: 'pdf',
    uploadDate: '2024-01-15',
    updatedDate: '2024-01-15'
  },
  {
    id: '2',
    title: 'Demande de Visa étudiant',
    description: 'Documents et démarches pour le visa étudiant',
    phase: 'during-process',
    category: 'visa',
    fileUrl: 'https://example.com/visa.pdf',
    fileType: 'pdf',
    uploadDate: '2024-01-20',
    updatedDate: '2024-02-01'
  },
  {
    id: '3',
    title: 'Guide de la vie à Rouen',
    description: 'Tout savoir pour bien s\'installer à Rouen',
    phase: 'pre-arrival',
    category: 'logement',
    fileUrl: 'https://example.com/rouen.pdf',
    fileType: 'pdf',
    uploadDate: '2024-02-10',
    updatedDate: '2024-02-10'
  }
];

const initialGuideSections: GuideSection[] = [
  {
    id: '1',
    title: 'Préparation du dossier Campus France',
    phase: 'post-cps',
    content: 'Après la fin de vos CPS, la première étape est la création de votre dossier Campus France. Voici les étapes à suivre...',
    order: 1,
    resources: ['1']
  },
  {
    id: '2',
    title: 'Demande de Visa',
    phase: 'during-process',
    content: 'Une fois votre acceptation à l\'ESIGELEC confirmée, vous devez démarrer la procédure de visa...',
    order: 1,
    resources: ['2']
  },
  {
    id: '3',
    title: 'Trouver un logement',
    phase: 'pre-arrival',
    content: 'Avant votre arrivée en France, la recherche d\'un logement est essentielle...',
    order: 1,
    resources: ['3']
  }
];

const initialFAQItems: FAQItem[] = [
  {
    id: '1',
    question: 'Quel est le délai pour obtenir son visa étudiant ?',
    answer: 'Le délai moyen est de 2 à 3 semaines après l\'entretien Campus France.',
    category: 'visa',
    phase: 'during-process',
    isApproved: true,
    createdDate: '2024-01-15',
    updatedDate: '2024-01-15'
  },
  {
    id: '2',
    question: 'Comment fonctionne le système CROUS pour le logement ?',
    answer: 'Le CROUS est un organisme qui propose des logements étudiants à prix modérés...',
    category: 'logement',
    phase: 'pre-arrival',
    isApproved: true,
    createdDate: '2024-01-20',
    updatedDate: '2024-01-20'
  }
];

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resources, setResources] = useState<ResourceDocument[]>([]);
  const [guideSections, setGuideSections] = useState<GuideSection[]>([]);
  const [faqItems, setFAQItems] = useState<FAQItem[]>([]);

  useEffect(() => {
    // Load from localStorage or initialize with sample data
    const storedResources = localStorage.getItem('resources');
    const storedGuideSections = localStorage.getItem('guideSections');
    const storedFAQItems = localStorage.getItem('faqItems');

    setResources(storedResources ? JSON.parse(storedResources) : initialResources);
    setGuideSections(storedGuideSections ? JSON.parse(storedGuideSections) : initialGuideSections);
    setFAQItems(storedFAQItems ? JSON.parse(storedFAQItems) : initialFAQItems);
  }, []);

  useEffect(() => {
    // Save to localStorage when changes occur
    localStorage.setItem('resources', JSON.stringify(resources));
    localStorage.setItem('guideSections', JSON.stringify(guideSections));
    localStorage.setItem('faqItems', JSON.stringify(faqItems));
  }, [resources, guideSections, faqItems]);

  // Resource methods
  const addResource = (resource: Omit<ResourceDocument, 'id'>) => {
    const newResource = {
      ...resource,
      id: Date.now().toString(),
      uploadDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    };
    setResources([...resources, newResource]);
  };

  const updateResource = (id: string, resource: Partial<ResourceDocument>) => {
    setResources(resources.map(r => 
      r.id === id 
        ? { ...r, ...resource, updatedDate: new Date().toISOString().split('T')[0] } 
        : r
    ));
  };

  const deleteResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  // Guide section methods
  const addGuideSection = (section: Omit<GuideSection, 'id'>) => {
    const newSection = {
      ...section,
      id: Date.now().toString()
    };
    setGuideSections([...guideSections, newSection]);
  };

  const updateGuideSection = (id: string, section: Partial<GuideSection>) => {
    setGuideSections(guideSections.map(s => 
      s.id === id 
        ? { ...s, ...section } 
        : s
    ));
  };

  const deleteGuideSection = (id: string) => {
    setGuideSections(guideSections.filter(s => s.id !== id));
  };

  // FAQ item methods
  const addFAQItem = (item: Omit<FAQItem, 'id'>) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    };
    setFAQItems([...faqItems, newItem]);
  };

  const updateFAQItem = (id: string, item: Partial<FAQItem>) => {
    setFAQItems(faqItems.map(f => 
      f.id === id 
        ? { ...f, ...item, updatedDate: new Date().toISOString().split('T')[0] } 
        : f
    ));
  };

  const deleteFAQItem = (id: string) => {
    setFAQItems(faqItems.filter(f => f.id !== id));
  };

  // Filter methods
  const getResourcesByPhase = (phase: GuidePhase) => {
    return resources.filter(resource => resource.phase === phase);
  };

  const getGuideSectionsByPhase = (phase: GuidePhase) => {
    return guideSections
      .filter(section => section.phase === phase)
      .sort((a, b) => a.order - b.order);
  };

  const getFAQItemsByPhase = (phase: GuidePhase) => {
    return faqItems.filter(item => item.phase === phase);
  };

  // Search method
  const searchResources = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return resources.filter(
      resource => 
        resource.title.toLowerCase().includes(lowerQuery) || 
        resource.description.toLowerCase().includes(lowerQuery) ||
        resource.category.toLowerCase().includes(lowerQuery)
    );
  };

  const value = {
    resources,
    guideSections,
    faqItems,
    addResource,
    updateResource,
    deleteResource,
    addGuideSection,
    updateGuideSection,
    deleteGuideSection,
    addFAQItem,
    updateFAQItem,
    deleteFAQItem,
    getResourcesByPhase,
    getGuideSectionsByPhase,
    getFAQItemsByPhase,
    searchResources
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};