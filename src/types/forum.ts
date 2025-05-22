export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  createdAt: number;
  updatedAt: number;
  repliesCount: number;
  isPinned?: boolean;
  isLocked?: boolean;
  lastReplyAt?: number;
  lastReplyAuthor?: string;
}

export interface ForumPost {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  createdAt: number;
  updatedAt?: number;
  isEdited?: boolean;
}

export interface ForumState {
  categories: ForumCategory[];
  threads: ForumThread[];
  posts: ForumPost[];
  loading: boolean;
  error: string | null;
  currentCategoryId: string | null;
  currentThreadId: string | null;
}
