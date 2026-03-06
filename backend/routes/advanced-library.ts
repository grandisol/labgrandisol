/**
 * Advanced Library Routes - LabGrandisol
 * Features avançadas: estatísticas, recomendações, coleções, etc
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import Logger from '../utils/logger.js';
import { advancedMockDB } from '../utils/advancedMockDatabase.js';
import { mockDB } from '../utils/mockDatabase.js';

const router = Router();
const logger = new Logger('AdvancedLibraryRoutes');

// Auth já é aplicada no server.ts

// ==================== COLLECTIONS ====================

/**
 * GET /api/advanced/collections
 * Listar coleções do usuário
 */
router.get('/collections', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const collections = advancedMockDB.getCollections(req.user.id);

    logger.info(`Collections retrieved for user ${req.user.id}`, {
      count: collections.length,
    });

    res.json({
      collections,
      count: collections.length,
    });
  } catch (error) {
    logger.error('Error fetching collections', error as Error);
    res.status(500).json({ error: 'Erro ao buscar coleções' });
  }
});

/**
 * POST /api/advanced/collections
 * Criar nova coleção
 */
router.post('/collections', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { name, description, color, icon, is_public } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Nome é obrigatório' });
      return;
    }

    const collection = advancedMockDB.createCollection(req.user.id, {
      name,
      description,
      color,
      icon,
      is_public,
    });

    logger.info(`Collection created by ${req.user.email}`, {
      collectionId: collection.id,
      name,
    });

    res.status(201).json({
      message: 'Coleção criada com sucesso',
      collection,
    });
  } catch (error) {
    logger.error('Error creating collection', error as Error);
    res.status(500).json({ error: 'Erro ao criar coleção' });
  }
});

// ==================== READING STATISTICS ====================

/**
 * GET /api/advanced/statistics
 * Obter estatísticas de leitura do usuário
 */
router.get('/statistics', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const stats = advancedMockDB.getUserStatistics(req.user.id) || {
      total_books_read: 0,
      total_pages_read: 0,
      current_reading_streak: 0,
      average_rating_given: 0,
      books_this_year: 0,
      reading_goal_annual: 12,
      reading_goal_progress: 0,
    };

    const progressPercentage = (
      (stats.reading_goal_progress / stats.reading_goal_annual) *
      100
    ).toFixed(1);

    logger.debug(`Statistics retrieved for ${req.user.email}`);

    res.json({
      statistics: {
        ...stats,
        progress_percentage: parseFloat(progressPercentage),
      },
      insights: {
        is_on_track: stats.reading_goal_progress >= stats.reading_goal_annual / 2,
        streak_milestone: stats.current_reading_streak >= 30,
        favorite_genre: 'favorite_genre' in stats ? (stats as any).favorite_genre : 'Ficção',
      },
    });
  } catch (error) {
    logger.error('Error fetching statistics', error as Error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

/**
 * PUT /api/advanced/statistics
 * Atualizar estatísticas de leitura
 */
router.put('/statistics', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { pages_read, book_completed } = req.body;

    const stats = advancedMockDB.updateUserStatistics(req.user.id, {
      pages_this_month: (pages_read || 0),
      books_this_year: (book_completed ? 1 : 0),
    });

    logger.info(`Statistics updated for ${req.user.email}`, {
      pagesRead: pages_read,
      bookCompleted: book_completed,
    });

    res.json({
      message: 'Estatísticas atualizadas',
      statistics: stats,
    });
  } catch (error) {
    logger.error('Error updating statistics', error as Error);
    res.status(500).json({ error: 'Erro ao atualizar estatísticas' });
  }
});

// ==================== ACHIEVEMENTS/BADGES ====================

/**
 * GET /api/advanced/achievements
 * Listar conquistas do usuário
 */
router.get('/achievements', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const achievements = advancedMockDB.getUserAchievements(req.user.id);

    logger.debug(`Achievements retrieved for ${req.user.email}`);

    res.json({
      achievements,
      count: achievements.length,
      categories: {
        reader: achievements.filter(a => a.badge_type === 'reader').length,
        reviewer: achievements.filter(a => a.badge_type === 'reviewer').length,
        milestone: achievements.filter(a => a.badge_type === 'milestone').length,
      },
    });
  } catch (error) {
    logger.error('Error fetching achievements', error as Error);
    res.status(500).json({ error: 'Erro ao buscar conquistas' });
  }
});

// ==================== RECOMMENDATIONS ====================

/**
 * GET /api/advanced/recommendations
 * Obter recomendações personalizadas
 */
router.get('/recommendations', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { limit = 5 } = req.query;
    const recommendations = advancedMockDB.getUserRecommendations(
      req.user.id,
      parseInt(limit as string)
    );

    // Enriquecer com dados dos livros
    const enriched = recommendations.map(rec => {
      const book = mockDB.getBookById(rec.book_id);
      return {
        ...rec,
        book: book ? { id: book.id, title: book.title, author_id: book.author_id } : null,
      };
    });

    logger.debug(`Recommendations retrieved for ${req.user.email}`, {
      count: recommendations.length,
    });

    res.json({
      recommendations: enriched,
      count: recommendations.length,
    });
  } catch (error) {
    logger.error('Error fetching recommendations', error as Error);
    res.status(500).json({ error: 'Erro ao buscar recomendações' });
  }
});

// ==================== REVIEWS ====================

/**
 * GET /api/advanced/reviews
 * Listar reviews do usuário
 */
router.get('/reviews', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const reviews = advancedMockDB.getUserReviews(req.user.id);

    logger.debug(`Reviews retrieved for ${req.user.email}`, {
      count: reviews.length,
    });

    res.json({
      reviews,
      count: reviews.length,
      average_rating: reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0,
    });
  } catch (error) {
    logger.error('Error fetching reviews', error as Error);
    res.status(500).json({ error: 'Erro ao buscar reviews' });
  }
});

/**
 * POST /api/advanced/reviews
 * Criar nova review de um livro
 */
router.post('/reviews', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { book_id, rating, title, content, reading_status, spoiler_warning } = req.body;

    if (!book_id || !rating || !content) {
      res.status(400).json({ error: 'book_id, rating e content são obrigatórios' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating deve estar entre 1 e 5' });
      return;
    }

    const book = mockDB.getBookById(book_id);
    if (!book) {
      res.status(404).json({ error: 'Livro não encontrado' });
      return;
    }

    const review = advancedMockDB.createReview(req.user.id, book_id, {
      rating,
      title,
      content,
      reading_status,
      spoiler_warning,
    });

    logger.info(`Review created by ${req.user.email}`, {
      bookId: book_id,
      rating,
      spoiler: spoiler_warning,
    });

    res.status(201).json({
      message: 'Review criada com sucesso',
      review,
    });
  } catch (error) {
    logger.error('Error creating review', error as Error);
    res.status(500).json({ error: 'Erro ao criar review' });
  }
});

// ==================== SHELVES ====================

/**
 * GET /api/advanced/shelves
 * Listar shelves do usuário
 */
router.get('/shelves', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const shelves = advancedMockDB.getUserShelves(req.user.id);

    logger.debug(`Shelves retrieved for ${req.user.email}`, {
      count: shelves.length,
    });

    res.json({
      shelves: shelves.map(s => ({
        ...s,
        displayName: {
          want_to_read: 'Quero Ler',
          currently_reading: 'Lendo Agora',
          read: 'Já Leram',
          favorites: 'Favoritos',
        }[s.name] || s.name,
      })),
      count: shelves.length,
    });
  } catch (error) {
    logger.error('Error fetching shelves', error as Error);
    res.status(500).json({ error: 'Erro ao buscar prateleiras' });
  }
});

/**
 * GET /api/advanced/shelves/:name/books
 * Listar livros em uma prateleira
 */
router.get('/shelves/:name/books', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const name = String(req.params.name);
    const { limit = 20, offset = 0 } = req.query;

    const result = advancedMockDB.getShelfBooks(req.user.id, name);
    const books = result.rows.map((id: number) => mockDB.getBookById(id)).filter(Boolean);

    logger.debug(`Shelf books retrieved for ${req.user.email}`, {
      shelfName: name,
      count: books.length,
    });

    res.json({
      shelf: name,
      books,
      pagination: {
        limit: parseInt(limit as string) || 20,
        offset: parseInt(offset as string) || 0,
        total: books.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching shelf books', error as Error);
    res.status(500).json({ error: 'Erro ao buscar livros da prateleira' });
  }
});

// ==================== TAGS ====================

/**
 * GET /api/advanced/tags
 * Listar todas as tags disponíveis
 */
router.get('/tags', (_req: Request, res: Response): void => {
  try {
    const tags = advancedMockDB.getAllTags();

    logger.debug('Tags retrieved');

    res.json({
      tags: tags.sort((a, b) => b.usage_count - a.usage_count),
      count: tags.length,
    });
  } catch (error) {
    logger.error('Error fetching tags', error as Error);
    res.status(500).json({ error: 'Erro ao buscar tags' });
  }
});

/**
 * GET /api/advanced/books/:id/tags
 * Listar tags de um livro
 */
router.get('/books/:id/tags', (req: Request, res: Response): void => {
  try {
    const id = String(req.params.id);
    const bookId = parseInt(id);

    const tags = advancedMockDB.getTagsByBook(bookId);

    logger.debug(`Tags retrieved for book ${bookId}`, {
      count: tags.length,
    });

    res.json({
      book_id: bookId,
      tags,
      count: tags.length,
    });
  } catch (error) {
    logger.error('Error fetching book tags', error as Error);
    res.status(500).json({ error: 'Erro ao buscar tags do livro' });
  }
});

export default router;
