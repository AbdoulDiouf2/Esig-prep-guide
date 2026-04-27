export type NewsArticleType = 'annonce' | 'success_story' | 'evenement' | 'nouveaute';
export type NewsStatus = 'published' | 'draft';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: NewsArticleType;
  tags: string[];
  status: NewsStatus;
  authorId: string;
  authorName: string;
  coverImageUrl?: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

export const NEWS_TYPE_LABELS: Record<NewsArticleType, string> = {
  annonce: 'Annonce',
  success_story: 'Success story',
  evenement: 'Événement',
  nouveaute: 'Nouveauté',
};
