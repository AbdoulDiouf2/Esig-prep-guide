import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Types
export type GuidePhase = 'post-cps' | 'during-process' | 'pre-arrival';

export interface ResourceDocument {
  id: string;
  title: string;
  description: string;
  phase: GuidePhase;
  category: string;
  fileUrl: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt' | 'image' | 'video' | 'audio' | 'zip' | 'link';
  uploadDate: string;
  updatedDate: string;
}

// Types de sous-sections disponibles
export type SubSectionType = 'bulletList' | 'checkList' | 'inputField';

// Interface pour les éléments de sous-section
export interface SubSectionItem {
  id: string;
  content: string;
  checked?: boolean; // Pour les listes à cocher
  value?: string; // Pour les champs à remplir
}

// Interface pour les sous-sections
export interface SubSection {
  id: string;
  title: string;
  type: SubSectionType;
  items: SubSectionItem[];
}

export interface GuideSection {
  id: string;
  title: string;
  phase: GuidePhase;
  content: string;
  order: number;
  resources: string[]; // Resource IDs
  subSections?: SubSection[]; // Sous-sections optionnelles
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  phase?: GuidePhase;
  questionType: 'phase' | 'site' | 'general';
  isApproved: boolean;
  isAnswered: boolean; // Indique si la question a été répondue par un admin
  createdDate: string;
  updatedDate: string;
  userId?: string; // ID de l'utilisateur qui a posé la question
  userEmail?: string; // Email de l'utilisateur qui a posé la question
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

const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resources, setResources] = useState<ResourceDocument[]>([]);
  const [guideSections, setGuideSections] = useState<GuideSection[]>([]);
  const [faqItems, setFAQItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Chargement initial Firestore
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      // guideSections
      const guideSnap = await getDocs(collection(db, 'guideSections'));
      setGuideSections(guideSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as GuideSection));
      // resources
      const resSnap = await getDocs(collection(db, 'resources'));
      setResources(resSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as ResourceDocument));
      // faq
      const faqSnap = await getDocs(collection(db, 'faq'));
      setFAQItems(faqSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as FAQItem));
      setLoading(false);
    };
    fetchAll();
  }, []);

  // CRUD Firestore
  const reloadAll = async () => {
    // Recharge toutes les collections (après un ajout/supp/sync)
    const guideSnap = await getDocs(collection(db, 'guideSections'));
    setGuideSections(guideSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as GuideSection));
    const resSnap = await getDocs(collection(db, 'resources'));
    setResources(resSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as ResourceDocument));
    const faqSnap = await getDocs(collection(db, 'faq'));
    setFAQItems(faqSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as FAQItem));
  };

  // Resource methods
  const addResource = async (resource: Omit<ResourceDocument, 'id'>) => {
    await addDoc(collection(db, 'resources'), resource);
    await reloadAll();
  };
  const updateResource = async (id: string, resource: Partial<ResourceDocument>) => {
    await updateDoc(doc(db, 'resources', id), resource);
    await reloadAll();
  };
  const deleteResource = async (id: string) => {
    await deleteDoc(doc(db, 'resources', id));
    await reloadAll();
  };

  // Guide section methods
  const addGuideSection = async (section: Omit<GuideSection, 'id'>) => {
    // Ne pas envoyer subSections si vide
    const dataToSend = { ...section };
    if (!section.subSections || section.subSections.length === 0) {
      delete dataToSend.subSections;
    }
    await addDoc(collection(db, 'guideSections'), dataToSend);
    await reloadAll();
  };
  const updateGuideSection = async (id: string, section: Partial<GuideSection>) => {
    // Ne pas inclure subSections si vide ou undefined
    const dataToUpdate = { ...section };
    if ('subSections' in dataToUpdate) {
      if (!dataToUpdate.subSections || dataToUpdate.subSections.length === 0) {
        delete dataToUpdate.subSections;
      }
    }
    await updateDoc(doc(db, 'guideSections', id), dataToUpdate);
    await reloadAll();
  };
  const deleteGuideSection = async (id: string) => {
    await deleteDoc(doc(db, 'guideSections', id));
    await reloadAll();
  };

  // FAQ item methods
  const addFAQItem = async (item: Omit<FAQItem, 'id'>) => {
    await addDoc(collection(db, 'faq'), item);
    await reloadAll();
  };
  const updateFAQItem = async (id: string, item: Partial<FAQItem>) => {
    await updateDoc(doc(db, 'faq', id), item);
    await reloadAll();
  };
  const deleteFAQItem = async (id: string) => {
    await deleteDoc(doc(db, 'faq', id));
    await reloadAll();
  };

  // Filter methods
  const getResourcesByPhase = (phase: GuidePhase) => {
    return resources.filter(resource => resource.phase === phase);
  };
  const getGuideSectionsByPhase = (phase: GuidePhase) => {
    return guideSections.filter(section => section.phase === phase).sort((a, b) => a.order - b.order);
  };
  const getFAQItemsByPhase = (phase: GuidePhase) => {
    return faqItems.filter(item => item.phase === phase);
  };
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

  if (loading) return <div className="p-8 text-center">Chargement du contenu...</div>;

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
}

export { ContentProvider };

