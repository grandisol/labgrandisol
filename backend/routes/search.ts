/**
 * Search Routes - LabGrandisol
 * Busca avançada com múltiplos filtros e sugestões
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import Logger from '../utils/logger.js';
import { mockDB } from '../utils/mockDatabase.js';

const logger = new Logger('Search');

const router = Router();

// Tipo para resultado de busca
interface SearchResult {
  id: number;
  type: string;
  title: string;
  author: string;
  genre: string;
  rating: number;
  cover_url: string;
  description?: string;
  relevance_score?: number;
}

/**
 * GET /api/search
 * Busca avançada com múltiplos filtros
 */
router.get('/', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const {
      q,
      filter_type = 'all',
      genre,
      author,
      min_rating = 0,
      max_rating = 5,
      sort_by = 'relevance',
      limit = 10,
      offset = 0,
    } = req.query;

    if (!q) {
      res.status(400).json({ error: 'Query parameter "q" é obrigatório' });
      return;
    }

    const searchTerm = String(q).toLowerCase();
    const results: SearchResult[] = [];

    // Search books
    if (filter_type === 'all' || filter_type === 'books') {
      const books = mockDB
        .getAllBooks()
        .rows.filter(
          (book: any) =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            (book.description && book.description.toLowerCase().includes(searchTerm))
        )
        .filter((book: any) => {
          if (genre && book.genre !== genre) return false;
          if (author && !book.author.toLowerCase().includes(String(author).toLowerCase())) return false;
          if (book.rating < Number(min_rating) || book.rating > Number(max_rating)) return false;
          return true;
        });

      results.push(
        ...books.map((book: any) => ({
          id: book.id,
          type: 'book',
          title: book.title,
          author: book.author,
          genre: book.genre,
          rating: book.rating,
          cover_url: book.cover_url || 'https://via.placeholder.com/150x200?text=' + book.title.replace(/\s/g, '+'),
          description: book.description?.substring(0, 100) + '...',
        }))
      );
    }

    // Sort results
    if (sort_by === 'rating') {
      results.sort((a: SearchResult, b: SearchResult) => (b.rating || 0) - (a.rating || 0));
    } else if (sort_by === 'date') {
      results.sort((a: SearchResult, b: SearchResult) => b.id - a.id);
    }
    // 'relevance' is default (search order)

    // Pagination
    const paginatedResults = results.slice(Number(offset), Number(offset) + Number(limit));

    logger.info(`Busca realizada: "${q}" - ${results.length} resultados encontrados`);

    res.status(200).json({
      query: q,
      filter_type,
      results: paginatedResults,
      total: results.length,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      per_page: Number(limit),
      facets: {
        genres: [...new Set(mockDB.getAllBooks().rows.map((b: any) => b.genre))],
        rating_distribution: {
          '5_stars': mockDB.getAllBooks().rows.filter((b: any) => b.rating === 5).length,
          '4_stars': mockDB.getAllBooks().rows.filter((b: any) => b.rating === 4).length,
          '3_stars': mockDB.getAllBooks().rows.filter((b: any) => b.rating === 3).length,
          '2_stars': mockDB.getAllBooks().rows.filter((b: any) => b.rating === 2).length,
          '1_star': mockDB.getAllBooks().rows.filter((b: any) => b.rating === 1).length,
        },
      },
    });
  } catch (error) {
    logger.error('Erro ao realizar busca');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/search/advanced
 * Busca com sintaxe avançada
 */
router.get('/advanced', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { query, limit = '10', offset = '0' } = req.query;

    if (!query) {
      res.status(400).json({ error: 'Query parameter "query" é obrigatório' });
      return;
    }

    // Mock advanced search with complex filters
    let results = mockDB.getAllBooks().rows;

    const searchTerm = String(query).toLowerCase();
    results = results.filter(
      (book: any) =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm)
    );

    const paginatedResults = results.slice(Number(offset), Number(offset) + Number(limit));

    logger.info(`Busca avançada realizada: "${query}"`);

    res.status(200).json({
      query,
      results: paginatedResults.map((book: any) => ({
        id: book.id,
        type: 'book',
        title: book.title,
        author: book.author,
        genre: book.genre,
        rating: book.rating,
        cover_url: book.cover_url,
        relevance_score: 0.95,
      })),
      total: results.length,
      execution_time_ms: 15,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
    });
  } catch (error) {
    logger.error('Erro ao realizar busca avançada');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/search/suggestions
 * Sugestões de busca (autocomplete)
 */
router.get('/suggestions', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { q, type = 'all', limit = 5 } = req.query;

    if (!q) {
      res.status(400).json({ error: 'Query parameter "q" é obrigatório' });
      return;
    }

    const searchTerm = String(q).toLowerCase();
    const suggestions: { text: string; type: string; icon: string }[] = [];

    if (type === 'all' || type === 'books') {
      const bookSuggestions = mockDB
        .getAllBooks()
        .rows.filter((book: any) => book.title.toLowerCase().includes(searchTerm))
        .slice(0, Number(limit))
        .map((book: any) => ({
          text: book.title,
          type: 'book',
          icon: '📚',
        }));
      suggestions.push(...bookSuggestions);
    }

    if (type === 'all' || type === 'authors') {
      const uniqueAuthors = [
        ...new Set(
          mockDB
            .getAllBooks()
            .rows.map((b: any) => b.author)
            .filter((author: string) => author.toLowerCase().includes(searchTerm))
        ),
      ] as string[];

      const authorSuggestions = uniqueAuthors.slice(0, Number(limit)).map((author: string) => ({
        text: author,
        type: 'author',
        icon: '✍️',
      }));
      suggestions.push(...authorSuggestions);
    }

    logger.info(`Sugestões geradas para: "${q}"`);

    res.status(200).json({
      query: q,
      suggestions: suggestions.slice(0, Number(limit)),
      count: suggestions.length,
    });
  } catch (error) {
    logger.error('Erro ao gerar sugestões');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/search/trending
 * Buscar tendências (livros mais procurados)
 */
router.get('/trending', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const allBooks = mockDB.getAllBooks().rows;

    // Mock trending: just return top rated books
    const trending = allBooks
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
      .map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        rating: book.rating,
        trend_score: Math.random() * 100,
        search_volume_today: Math.floor(Math.random() * 500),
        position: (book.id % 5) + 1,
      }));

    logger.info('Tendências de busca recuperadas');

    res.status(200).json({
      period: 'last_24h',
      trending_books: trending,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erro ao recuperar tendências');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;