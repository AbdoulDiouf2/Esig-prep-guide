import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import { NewsArticle, NewsArticleType, NewsStatus } from '../types/news';

const NEWS_COLLECTION = 'newsArticles';

function docToArticle(docSnap: { id: string; data: () => Record<string, unknown> }): NewsArticle {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: (data.title as string) || '',
    summary: (data.summary as string) || '',
    content: (data.content as string) || '',
    type: (data.type as NewsArticleType) || 'annonce',
    tags: (data.tags as string[]) || [],
    status: (data.status as NewsStatus) || 'draft',
    authorId: (data.authorId as string) || '',
    authorName: (data.authorName as string) || '',
    coverImageUrl: data.coverImageUrl as string | undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : Date.now(),
    publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toMillis() : undefined,
    likesCount: (data.likesCount as number) || 0,
    likedBy: (data.likedBy as string[]) || [],
    viewsCount: (data.viewsCount as number) || 0,
    viewedBy: (data.viewedBy as string[]) || [],
  };
}

export interface NewsFilters {
  status?: NewsStatus;
  type?: NewsArticleType;
}

export const getNewsArticles = async (filters?: NewsFilters): Promise<NewsArticle[]> => {
  let q;
  if (filters?.status) {
    q = query(collection(db, NEWS_COLLECTION), where('status', '==', filters.status));
  } else {
    q = query(collection(db, NEWS_COLLECTION));
  }

  const snapshot = await getDocs(q);
  let articles = snapshot.docs.map(docToArticle);

  if (filters?.type) {
    articles = articles.filter((a) => a.type === filters.type);
  }

  return articles.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
};

export const getNewsArticle = async (id: string): Promise<NewsArticle | null> => {
  const docSnap = await getDoc(doc(db, NEWS_COLLECTION, id));
  if (!docSnap.exists()) return null;
  return docToArticle(docSnap);
};

export const addNewsArticle = async (
  data: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const now = serverTimestamp();
  const docRef = await addDoc(collection(db, NEWS_COLLECTION), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const updateNewsArticle = async (
  id: string,
  data: Partial<Omit<NewsArticle, 'id' | 'createdAt'>>
): Promise<void> => {
  await updateDoc(doc(db, NEWS_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const publishNewsArticle = async (id: string): Promise<void> => {
  await updateDoc(doc(db, NEWS_COLLECTION, id), {
    status: 'published',
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const unpublishNewsArticle = async (id: string): Promise<void> => {
  await updateDoc(doc(db, NEWS_COLLECTION, id), {
    status: 'draft',
    updatedAt: serverTimestamp(),
  });
};

export const deleteNewsArticle = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, NEWS_COLLECTION, id));
};

export const toggleLike = async (id: string, uid: string, currentlyLiked: boolean): Promise<void> => {
  await updateDoc(doc(db, NEWS_COLLECTION, id), {
    likedBy: currentlyLiked ? arrayRemove(uid) : arrayUnion(uid),
    likesCount: increment(currentlyLiked ? -1 : 1),
  });
};

export const recordView = async (id: string, uid: string): Promise<void> => {
  await updateDoc(doc(db, NEWS_COLLECTION, id), {
    viewedBy: arrayUnion(uid),
    viewsCount: increment(1),
  });
};
