import { collection, query, where, orderBy, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ForumCategory, ForumThread, ForumPost } from '../types/forum';

// Collections
const CATEGORIES_COLLECTION = 'forumCategories';
const THREADS_COLLECTION = 'forumThreads';
const POSTS_COLLECTION = 'forumPosts';

// Catégories
export const getForumCategories = async (): Promise<ForumCategory[]> => {
  try {
    const categoriesQuery = query(collection(db, CATEGORIES_COLLECTION), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(categoriesQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<ForumCategory, 'id'>
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories du forum:', error);
    throw error;
  }
};

export const addForumCategory = async (category: Omit<ForumCategory, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), category);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création d\'une catégorie:', error);
    throw error;
  }
};

// Discussions (threads)
export const getForumThreads = async (categoryId?: string): Promise<ForumThread[]> => {
  try {
    let querySnapshot;
    
    if (categoryId) {
      // Version sans index - simplifiée au maximum
      // Récupérer tous les threads de la catégorie sans ordre
      const simpleQuery = query(
        collection(db, THREADS_COLLECTION),
        where('categoryId', '==', categoryId)
      );
      querySnapshot = await getDocs(simpleQuery);
    } else {
      // Récupérer tous les threads
      querySnapshot = await getDocs(collection(db, THREADS_COLLECTION));
    }
    
    // Convertir les données
    const threads = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data as Omit<ForumThread, 'id'>,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : Date.now(),
        lastReplyAt: data.lastReplyAt instanceof Timestamp ? data.lastReplyAt.toMillis() : undefined
      };
    });
    
    // Trier manuellement 
    return threads.sort((a, b) => {
      // D'abord par épinglage (desc)
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Ensuite par date de mise à jour (desc)
      return b.updatedAt - a.updatedAt;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des discussions:', error);
    throw error;
  }
};

export const getForumThread = async (threadId: string): Promise<ForumThread | null> => {
  try {
    const threadDoc = await getDoc(doc(db, THREADS_COLLECTION, threadId));
    
    if (!threadDoc.exists()) {
      return null;
    }
    
    const data = threadDoc.data();
    return {
      id: threadDoc.id,
      ...data as Omit<ForumThread, 'id'>,
      createdAt: (data.createdAt as Timestamp).toMillis(),
      updatedAt: (data.updatedAt as Timestamp).toMillis(),
      lastReplyAt: data.lastReplyAt ? (data.lastReplyAt as Timestamp).toMillis() : undefined
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de la discussion:', error);
    throw error;
  }
};

export const addForumThread = async (thread: Omit<ForumThread, 'id' | 'createdAt' | 'updatedAt' | 'repliesCount'>): Promise<string> => {
  try {
    const timestamp = serverTimestamp();
    const newThread = {
      ...thread,
      createdAt: timestamp,
      updatedAt: timestamp,
      repliesCount: 0
    };
    
    const docRef = await addDoc(collection(db, THREADS_COLLECTION), newThread);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création d\'une discussion:', error);
    throw error;
  }
};

// Messages (posts)
export const getForumPosts = async (threadId: string): Promise<ForumPost[]> => {
  try {
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(postsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<ForumPost, 'id'>,
      createdAt: (doc.data().createdAt as Timestamp).toMillis(),
      updatedAt: doc.data().updatedAt ? (doc.data().updatedAt as Timestamp).toMillis() : undefined
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    throw error;
  }
};

export const addForumPost = async (post: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'isEdited'>): Promise<string> => {
  try {
    const timestamp = serverTimestamp();
    const newPost = {
      ...post,
      createdAt: timestamp,
      isEdited: false
    };
    
    // Ajouter le message
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), newPost);
    
    // Mettre à jour le thread avec le nombre de réponses et la dernière réponse
    const threadRef = doc(db, THREADS_COLLECTION, post.threadId);
    const threadDoc = await getDoc(threadRef);
    
    if (threadDoc.exists()) {
      await updateDoc(threadRef, {
        repliesCount: (threadDoc.data().repliesCount || 0) + 1,
        lastReplyAt: timestamp,
        lastReplyAuthor: post.authorName,
        updatedAt: timestamp
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un message:', error);
    throw error;
  }
};

export const updateForumPost = async (postId: string, content: string): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      content,
      updatedAt: serverTimestamp(),
      isEdited: true
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message:', error);
    throw error;
  }
};

// Supprimer un message/réponse du forum
export const deleteForumPost = async (postId: string, threadId: string): Promise<void> => {
  try {
    // Supprimer le message
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await deleteDoc(postRef);
    
    // Mettre à jour le nombre de réponses dans la discussion
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    const threadDoc = await getDoc(threadRef);
    
    if (threadDoc.exists()) {
      const currentRepliesCount = threadDoc.data().repliesCount || 0;
      
      // Ne pas permettre un nombre négatif de réponses
      const newRepliesCount = Math.max(0, currentRepliesCount - 1);
      
      await updateDoc(threadRef, {
        repliesCount: newRepliesCount,
        updatedAt: serverTimestamp()
      });
      
      // Si c'était la dernière réponse, on peut mettre à jour lastReplyAt et lastReplyAuthor
      // mais il faudrait une requête supplémentaire pour trouver la réponse la plus récente
      // Cela pourrait être implémenté si nécessaire
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    throw error;
  }
};

// Supprimer une discussion du forum (et tous ses messages)
export const deleteForumThread = async (threadId: string): Promise<void> => {
  try {
    // D'abord, supprimer tous les messages associés à cette discussion
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where('threadId', '==', threadId)
    );
    
    const querySnapshot = await getDocs(postsQuery);
    
    // Supprimer tous les messages un par un
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    // Attendre que tous les messages soient supprimés
    await Promise.all(deletePromises);
    
    // Ensuite, supprimer la discussion elle-même
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    await deleteDoc(threadRef);
  } catch (error) {
    console.error('Erreur lors de la suppression de la discussion:', error);
    throw error;
  }
};

// Mettre à jour le compteur de réponses d'une discussion avec le nombre réel de messages
export const updateThreadRepliesCount = async (threadId: string): Promise<number> => {
  try {
    // Compter le nombre réel de messages dans la discussion
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where('threadId', '==', threadId)
    );
    
    const querySnapshot = await getDocs(postsQuery);
    const actualCount = querySnapshot.size;
    
    // Mettre à jour le compteur dans la discussion
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    await updateDoc(threadRef, {
      repliesCount: actualCount,
      updatedAt: serverTimestamp()
    });
    
    return actualCount;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compteur de réponses:', error);
    throw error;
  }
};

// Obtenir le nombre de discussions par catégorie
export const getThreadsCountByCategory = async (): Promise<Record<string, number>> => {
  try {
    // Récupérer tous les threads
    const threadsSnapshot = await getDocs(collection(db, THREADS_COLLECTION));
    
    // Compter les threads par catégorie
    const counts: Record<string, number> = {};
    
    threadsSnapshot.forEach((doc) => {
      const thread = doc.data() as ForumThread;
      const categoryId = thread.categoryId;
      
      if (categoryId) {
        counts[categoryId] = (counts[categoryId] || 0) + 1;
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Erreur lors du comptage des discussions par catégorie:', error);
    return {};
  }
};

// Initialisation des catégories par défaut (à utiliser lors de la première configuration)
export const initializeDefaultCategories = async (): Promise<void> => {
  const defaultCategories: Omit<ForumCategory, 'id'>[] = [
    {
      name: 'Général',
      description: 'Discussions générales sur l\'ESIG, les études et la vie à Genève',
      order: 1
    },
    {
      name: 'Logement',
      description: 'Recherche de logement, colocation, conseils pour s\'installer',
      order: 2
    },
    {
      name: 'Cours et Études',
      description: 'Questions sur les cours, examens, projets et formation à l\'ESIG',
      order: 3
    },
    {
      name: 'Vie Étudiante',
      description: 'Événements, activités, associations et vie sociale',
      order: 4
    },
    {
      name: 'Administratif',
      description: 'Démarches administratives, visa, assurances, finances',
      order: 5
    }
  ];
  
  try {
    // Vérifier si des catégories existent déjà
    const existingCategories = await getForumCategories();
    
    // Filtrer les catégories par défaut pour ne pas ajouter des doublons
    const categoriesToAdd = defaultCategories.filter(defaultCat => 
      !existingCategories.some(existingCat => existingCat.name === defaultCat.name)
    );
    
    // N'ajouter que les nouvelles catégories
    if (categoriesToAdd.length > 0) {
      for (const category of categoriesToAdd) {
        await addForumCategory(category);
      }
      console.log(`${categoriesToAdd.length} catégorie(s) ajoutée(s) avec succès`);
    } else {
      console.log('Aucune nouvelle catégorie à ajouter');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des catégories par défaut:', error);
    throw error;
  }
};
