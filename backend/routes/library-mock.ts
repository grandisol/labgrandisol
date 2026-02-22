/**
 * Library Routes - Usando Mock Database
 * Rotas para biblioteca (livros, empréstimos, ratings)
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import Logger from '../utils/logger.js';
import { mockDB } from '../utils/mockDatabase.js';

const router = Router();
const logger = new Logger('LibraryRoutes');

// Aplicar autenticação em todas as rotas
router.use(verifyToken);

/**
 * GET /api/library/books
 * Retorna lista de livros com busca e paginação
 */
router.get('/books', (req: Request, res: Response): void => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;
    const limitNum = parseInt(limit as string) || 20;
    const offsetNum = parseInt(offset as string) || 0;

    let result;
    if (q) {
      result = mockDB.searchBooks(q as string, limitNum, offsetNum);
    } else {
      result = mockDB.getAllBooks(limitNum, offsetNum);
    }

    res.json({
      books: result.rows,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: result.rowCount,
        hasMore: offsetNum + limitNum < result.rowCount,
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar livros', error as Error);
    res.status(500).json({ error: 'Erro ao buscar livros' });
  }
});

/**
 * GET /api/library/books/:id
 * Retorna detalhes de um livro específico
 */
router.get('/books/:id', (req: Request, res: Response): void => {
  try {
    const bookId = parseInt(req.params.id);
    const book = mockDB.getBookById(bookId);

    if (!book) {
      res.status(404).json({ error: 'Livro não encontrado' });
      return;
    }

    res.json({ book });
  } catch (error) {
    logger.error('Erro ao buscar detalhes do livro', error as Error);
    res.status(500).json({ error: 'Erro ao buscar livro' });
  }
});

/**
 * GET /api/library/categories
 * Retorna todas as categorias
 */
router.get('/categories', (_req: Request, res: Response): void => {
  try {
    const result = mockDB.getAllCategories();
    res.json({
      categories: result.rows,
    });
  } catch (error) {
    logger.error('Erro ao buscar categorias', error as Error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

/**
 * GET /api/library/loans
 * Retorna empréstimos do usuário
 */
router.get('/loans', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const result = mockDB.getUserLoans(req.user.id);
    const loansWithDetails = result.rows.map((loan: any) => {
      const book = mockDB.books.find(b => b.id === loan.book_id);
      return { ...loan, book };
    });

    res.json({
      loans: loansWithDetails,
      count: result.rowCount,
    });
  } catch (error) {
    logger.error('Erro ao buscar empréstimos', error as Error);
    res.status(500).json({ error: 'Erro ao buscar empréstimos' });
  }
});

/**
 * POST /api/library/loans
 * Cria novo empréstimo
 */
router.post('/loans', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { book_id } = req.body;

    if (!book_id) {
      res.status(400).json({ error: 'book_id é obrigatório' });
      return;
    }

    const book = mockDB.books.find(b => b.id === book_id);
    if (!book) {
      res.status(404).json({ error: 'Livro não encontrado' });
      return;
    }

    if (book.available_copies <= 0) {
      res.status(400).json({ error: 'Nenhuma cópia disponível' });
      return;
    }

    const loan = mockDB.createLoan(req.user.id, book_id);
    book.available_copies--;

    logger.info('Empréstimo criado', { userId: req.user.id, bookId: book_id });
    res.status(201).json({
      message: 'Livro emprestado com sucesso',
      loan,
    });
  } catch (error) {
    logger.error('Erro ao criar empréstimo', error as Error);
    res.status(500).json({ error: 'Erro ao criar empréstimo' });
  }
});

/**
 * POST /api/library/ratings
 * Submete avaliação de um livro
 */
router.post('/ratings', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { book_id, rating, review } = req.body;

    if (!book_id || !rating) {
      res.status(400).json({ error: 'book_id e rating são obrigatórios' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating deve estar entre 1 e 5' });
      return;
    }

    const book = mockDB.books.find(b => b.id === book_id);
    if (!book) {
      res.status(404).json({ error: 'Livro não encontrado' });
      return;
    }

    const newRating = mockDB.createRating(req.user.id, book_id, rating, review);

    logger.info('Avaliação criada', { userId: req.user.id, bookId: book_id, rating });
    res.status(201).json({
      message: 'Avaliação registrada com sucesso',
      rating: newRating,
    });
  } catch (error) {
    logger.error('Erro ao criar avaliação', error as Error);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

/**
 * GET /api/library/reading-list
 * Retorna lista de leitura do usuário
 */
router.get('/reading-list', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const result = mockDB.getUserReadingList(req.user.id);
    const listWithDetails = result.rows.map((item: any) => {
      const book = mockDB.books.find(b => b.id === item.book_id);
      return { ...item, book };
    });

    res.json({
      reading_list: listWithDetails,
      count: result.rowCount,
    });
  } catch (error) {
    logger.error('Erro ao buscar lista de leitura', error as Error);
    res.status(500).json({ error: 'Erro ao buscar lista de leitura' });
  }
});

/**
 * POST /api/library/reading-list
 * Adiciona livro à lista de leitura
 */
router.post('/reading-list', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { book_id, status } = req.body;

    if (!book_id || !status) {
      res.status(400).json({ error: 'book_id e status são obrigatórios' });
      return;
    }

    const validStatuses = ['want_to_read', 'reading', 'finished'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Status inválido' });
      return;
    }

    const book = mockDB.books.find(b => b.id === book_id);
    if (!book) {
      res.status(404).json({ error: 'Livro não encontrado' });
      return;
    }

    const item = mockDB.addToReadingList(req.user.id, book_id, status);

    logger.info('Item adicionado à lista', { userId: req.user.id, bookId: book_id });
    res.status(201).json({
      message: 'Livro adicionado à lista',
      item,
    });
  } catch (error) {
    logger.error('Erro ao adicionar à lista', error as Error);
    res.status(500).json({ error: 'Erro ao adicionar à lista' });
  }
});

/**
 * DELETE /api/library/reading-list/:id
 * Remove livro da lista de leitura
 */
router.delete('/reading-list/:id', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const itemId = parseInt(req.params.id);
    const item = mockDB.readingLists.find(rl => rl.id === itemId);

    if (!item) {
      res.status(404).json({ error: 'Item não encontrado' });
      return;
    }

    if (item.user_id !== req.user.id) {
      res.status(403).json({ error: 'Sem permissão' });
      return;
    }

    mockDB.removeFromReadingList(itemId);

    logger.info('Item removido', { userId: req.user.id, itemId });
    res.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    logger.error('Erro ao remover item', error as Error);
    res.status(500).json({ error: 'Erro ao remover item' });
  }
});

export default router;
