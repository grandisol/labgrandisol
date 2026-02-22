/**
 * Advanced Mock Database - LabGrandisol Library System
 * Estrutura robussa com suporte a multi-tenant e features avançadas
 */

import Logger from './logger.js';

const logger = new Logger('AdvancedMockDB');

// ==================== TIPOS ====================

export interface Collection {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_public: boolean;
  book_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface BookTag {
  id: number;
  name: string;
  color: string;
  usage_count: number;
}

export interface DetailedReview {
  id: number;
  user_id: number;
  book_id: number;
  rating: number; // 1-5
  title?: string;
  content: string;
  reading_status: 'want_to_read' | 'reading' | 'finished';
  helpful_count: number;
  spoiler_warning: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ReadingStatistics {
  id: number;
  user_id: number;
  total_books_read: number;
  total_pages_read: number;
  current_reading_streak: number;
  longest_reading_streak: number;
  average_rating_given: number;
  books_this_year: number;
  pages_this_month: number;
  favorite_genre: string;
  reading_goal_annual: number;
  reading_goal_progress: number;
  last_updated: Date;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  badge_type: 'reader' | 'reviewer' | 'collector' | 'social' | 'milestone';
  name: string;
  description: string;
  icon_url: string;
  earned_at: Date;
}

export interface PersonalizedRecommendation {
  id: number;
  user_id: number;
  book_id: number;
  reason: 'similar_to_favorite' | 'trending' | 'friend_rated' | 'genre_match' | 'author_match';
  confidence_score: number; // 0-100
  created_at: Date;
}

export interface LibraryShelf {
  id: number;
  user_id: number;
  name: 'want_to_read' | 'currently_reading' | 'read' | 'favorites' | string;
  description?: string;
  book_count: number;
  created_at: Date;
  updated_at: Date;
}

// ==================== DATA STORE ====================

const collections: Collection[] = [
  {
    id: 1,
    user_id: 1,
    name: 'Ficção Científica Favorita',
    description: 'Meus livros de ficção científica prediletos',
    color: '#4ECDC4',
    icon: '🚀',
    is_public: true,
    book_count: 2,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  },
  {
    id: 2,
    user_id: 1,
    name: 'Filosofia e Pensamento',
    description: 'Leituras que desafiam minha perspectiva',
    color: '#FFD93D',
    icon: '🧠',
    is_public: false,
    book_count: 1,
    created_at: new Date('2026-01-10'),
    updated_at: new Date('2026-01-10'),
  },
];

const bookTags: BookTag[] = [
  { id: 1, name: 'distópico', color: '#FF6B6B', usage_count: 3 },
  { id: 2, name: 'épico', color: '#4ECDC4', usage_count: 5 },
  { id: 3, name: 'ficção-científica', color: '#45B7D1', usage_count: 4 },
  { id: 4, name: 'pós-apocalíptico', color: '#96CEB4', usage_count: 2 },
  { id: 5, name: 'história-alternativa', color: '#FFEAA7', usage_count: 2 },
  { id: 6, name: 'não-ficção', color: '#DFE6E9', usage_count: 3 },
  { id: 7, name: 'divulgação-científica', color: '#74B9FF', usage_count: 2 },
  { id: 8, name: 'bestseller', color: '#A29BFE', usage_count: 4 },
];

const detailedReviews: DetailedReview[] = [
  {
    id: 1,
    user_id: 1,
    book_id: 1,
    rating: 5,
    title: 'Obra-prima distópica',
    content: 'Absolutamente fascinante. Orwell antecipou tantas coisas sobre o controle total da informação.',
    reading_status: 'finished',
    helpful_count: 42,
    spoiler_warning: false,
    created_at: new Date('2026-01-05'),
    updated_at: new Date('2026-01-05'),
  },
  {
    id: 2,
    user_id: 2,
    book_id: 2,
    rating: 5,
    title: 'Jornada épica impecável',
    content: 'Tolkien criou um mundo completo e imersivo. Os detalhes são incríveis.',
    reading_status: 'finished',
    helpful_count: 128,
    spoiler_warning: false,
    created_at: new Date('2025-12-20'),
    updated_at: new Date('2025-12-20'),
  },
];

const readingStatistics: ReadingStatistics[] = [
  {
    id: 1,
    user_id: 1,
    total_books_read: 47,
    total_pages_read: 12840,
    current_reading_streak: 23,
    longest_reading_streak: 67,
    average_rating_given: 4.2,
    books_this_year: 12,
    pages_this_month: 1240,
    favorite_genre: 'Ficção Científica',
    reading_goal_annual: 24,
    reading_goal_progress: 50,
    last_updated: new Date(),
  },
  {
    id: 2,
    user_id: 2,
    total_books_read: 23,
    total_pages_read: 5670,
    current_reading_streak: 8,
    longest_reading_streak: 15,
    average_rating_given: 4.0,
    books_this_year: 8,
    pages_this_month: 340,
    favorite_genre: 'Fantasia',
    reading_goal_annual: 12,
    reading_goal_progress: 67,
    last_updated: new Date(),
  },
];

const achievements: UserAchievement[] = [
  {
    id: 1,
    user_id: 1,
    badge_type: 'reader',
    name: 'Leitor Voraz',
    description: 'Leu 50+ livros',
    icon_url: '📚',
    earned_at: new Date('2025-11-15'),
  },
  {
    id: 2,
    user_id: 1,
    badge_type: 'reviewer',
    name: 'Crítico Perspicaz',
    description: 'Escreveu 20+ reviews bem avaliadas',
    icon_url: '✍️',
    earned_at: new Date('2025-12-01'),
  },
  {
    id: 3,
    user_id: 1,
    badge_type: 'milestone',
    name: 'Dia 30 Seguido',
    description: 'Leu todos os dias por 30 dias consecutivos',
    icon_url: '🔥',
    earned_at: new Date('2026-01-15'),
  },
];

const recommendations: PersonalizedRecommendation[] = [
  {
    id: 1,
    user_id: 1,
    book_id: 3,
    reason: 'similar_to_favorite',
    confidence_score: 92,
    created_at: new Date(),
  },
  {
    id: 2,
    user_id: 1,
    book_id: 4,
    reason: 'genre_match',
    confidence_score: 78,
    created_at: new Date(),
  },
];

const shelves: LibraryShelf[] = [
  {
    id: 1,
    user_id: 1,
    name: 'want_to_read',
    description: 'Livros que quero ler',
    book_count: 8,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    user_id: 1,
    name: 'currently_reading',
    description: 'Livros que estou lendo agora',
    book_count: 2,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 3,
    user_id: 1,
    name: 'read',
    description: 'Livros que já li',
    book_count: 47,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 4,
    user_id: 1,
    name: 'favorites',
    description: 'Meus livros favoritos de todos os tempos',
    book_count: 12,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// ==================== API ====================

export const advancedMockDB = {
  // Collections
  getCollections(userId: number) {
    return collections.filter(c => c.user_id === userId);
  },

  createCollection(userId: number, data: Partial<Collection>) {
    const collection: Collection = {
      id: Math.max(...collections.map(c => c.id), 0) + 1,
      user_id: userId,
      name: data.name || 'Nova Coleção',
      description: data.description,
      color: data.color || '#' + Math.floor(Math.random() * 16777215).toString(16),
      icon: data.icon || '📚',
      is_public: data.is_public || false,
      book_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    collections.push(collection);
    return collection;
  },

  updateCollection(collectionId: number, data: Partial<Collection>) {
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      Object.assign(collection, data, { updated_at: new Date() });
    }
    return collection;
  },

  deleteCollection(collectionId: number) {
    const index = collections.findIndex(c => c.id === collectionId);
    if (index > -1) collections.splice(index, 1);
  },

  // Tags
  getAllTags() {
    return bookTags;
  },

  getTagsByBook(_bookId: number) {
    // Mock: retorna tags aleatórias para demonstração
    return bookTags.slice(0, 3);
  },

  // Reviews
  getBookReviews(bookId: number) {
    return detailedReviews.filter(r => r.book_id === bookId);
  },

  getUserReviews(userId: number) {
    return detailedReviews.filter(r => r.user_id === userId);
  },

  createReview(userId: number, bookId: number, data: Partial<DetailedReview>) {
    const review: DetailedReview = {
      id: Math.max(...detailedReviews.map(r => r.id), 0) + 1,
      user_id: userId,
      book_id: bookId,
      rating: data.rating || 5,
      title: data.title,
      content: data.content || '',
      reading_status: data.reading_status || 'finished',
      helpful_count: 0,
      spoiler_warning: data.spoiler_warning || false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    detailedReviews.push(review);
    return review;
  },

  // Statistics
  getUserStatistics(userId: number) {
    return readingStatistics.find(s => s.user_id === userId);
  },

  updateUserStatistics(userId: number, data: Partial<ReadingStatistics>) {
    let stats = readingStatistics.find(s => s.user_id === userId);
    if (!stats) {
      stats = {
        id: Math.max(...readingStatistics.map(s => s.id), 0) + 1,
        user_id: userId,
        total_books_read: 0,
        total_pages_read: 0,
        current_reading_streak: 0,
        longest_reading_streak: 0,
        average_rating_given: 0,
        books_this_year: 0,
        pages_this_month: 0,
        favorite_genre: '',
        reading_goal_annual: 12,
        reading_goal_progress: 0,
        last_updated: new Date(),
      };
      readingStatistics.push(stats);
    }
    Object.assign(stats, data, { last_updated: new Date() });
    return stats;
  },

  // Achievements
  getUserAchievements(userId: number) {
    return achievements.filter(a => a.user_id === userId);
  },

  addAchievement(userId: number, badge: Partial<UserAchievement>) {
    const achievement: UserAchievement = {
      id: Math.max(...achievements.map(a => a.id), 0) + 1,
      user_id: userId,
      badge_type: badge.badge_type || 'reader',
      name: badge.name || 'Nova Conquista',
      description: badge.description || '',
      icon_url: badge.icon_url || '⭐',
      earned_at: new Date(),
    };
    achievements.push(achievement);
    return achievement;
  },

  // Recommendations
  getUserRecommendations(userId: number, limit = 10) {
    return recommendations
      .filter(r => r.user_id === userId)
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, limit);
  },

  addRecommendation(userId: number, bookId: number, reason: string, score: number) {
    const rec: PersonalizedRecommendation = {
      id: Math.max(...recommendations.map(r => r.id), 0) + 1,
      user_id: userId,
      book_id: bookId,
      reason: reason as any,
      confidence_score: score,
      created_at: new Date(),
    };
    recommendations.push(rec);
    return rec;
  },

  // Shelves
  getUserShelves(userId: number) {
    return shelves.filter(s => s.user_id === userId);
  },

  getShelfBooks(userId: number, shelfName: string) {
    // Mock: retorna primeiros 4 livros
    const shelf = shelves.find(s => s.user_id === userId && s.name === shelfName);
    if (!shelf) return { rows: [], rowCount: 0 };

    // Retornar livros mock baseado no nome da shelf
    const mockBooks = {
      want_to_read: [3, 4],
      currently_reading: [1, 2],
      read: [1, 2, 3, 4],
      favorites: [1, 3],
    };

    const bookIds = (mockBooks as any)[shelfName] || [];
    return {
      rows: bookIds,
      rowCount: bookIds.length,
    };
  },

  updateShelf(userId: number, shelfName: string, data: Partial<LibraryShelf>) {
    const shelf = shelves.find(s => s.user_id === userId && s.name === shelfName);
    if (shelf) {
      Object.assign(shelf, data, { updated_at: new Date() });
    }
    return shelf;
  },
};

logger.info('Advanced Mock Database initialized');

export default advancedMockDB;
