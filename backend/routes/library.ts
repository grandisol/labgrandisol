/**
 * Library Routes
 * Operações de biblioteca para usuários
 */

import { Router, Request, Response, NextFunction } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { query, transaction } from '../utils/database.js';
import { libraryValidators } from '../middleware/validators.js';
import Logger from '../utils/logger.js';

const router = Router();
const logger = new Logger('LibraryRoutes');

// Todos os routes requerem autenticação
router.use(verifyAuth);

/**
 * GET /library/books
 * Buscar e listar livros com filtros
 */
router.get('/books', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      search = '', 
      category = '', 
      author = '',
      sortBy = 'title',
      limit = 20, 
      offset = 0 
    } = req.query;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (b.title ILIKE $${params.length} OR b.description ILIKE $${params.length})`;
    }

    if (category) {
      params.push(category);
      where += ` AND c.name = $${params.length}`;
    }

    if (author) {
      params.push(`%${author}%`);
      where += ` AND a.name ILIKE $${params.length}`;
    }

    const validSortFields = ['title', 'publication_year', 'average_rating', 'author'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'title';

    params.push(limit);
    params.push(offset);

    const booksResult = await query(
      `SELECT 
        b.id, b.title, b.description, a.name as author, c.name as category,
        b.isbn, b.publication_year, b.publisher, b.pages, b.language,
        b.total_copies, b.available_copies, b.average_rating, b.cover_url,
        b.created_at
      FROM books b
      JOIN authors a ON b.author_id = a.id
      JOIN categories c ON b.category_id = c.id
      ${where}
      ORDER BY b.${sortField}
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      books: booksResult.rows,
      total: booksResult.rows.length,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Error fetching books', error as Error);
    next(error);
  }
});

/**
 * GET /library/books/:id
 * Detalhes de um livro específico
 */
router.get('/books/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    // Pega detalhes do livro
    const bookResult = await query(
      `SELECT 
        b.id, b.title, b.description, a.name as author, c.name as category,
        b.isbn, b.publication_year, b.publisher, b.pages, b.language,
        b.total_copies, b.available_copies, b.average_rating, b.cover_url,
        b.created_at
      FROM books b
      JOIN authors a ON b.author_id = a.id
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = $1`,
      [id]
    );

    if (bookResult.rows.length === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const book = bookResult.rows[0];

    // Pega avaliações
    const ratingsResult = await query(
      `SELECT r.id, r.rating, r.review, u.name, r.created_at
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.book_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Verifica se usuário emprestou este livro
    const userRatingResult = await query(
      `SELECT rating, review FROM ratings WHERE book_id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({
      book,
      ratings: ratingsResult.rows,
      userRating: userRatingResult.rows[0] || null
    });
  } catch (error) {
    logger.error('Error fetching book details', error as Error);
    next(error);
  }
});

/**
 * GET /library/categories
 * Listar todas as categorias
 */
router.get('/categories', async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, name, description, icon, color,
              (SELECT COUNT(*) FROM books WHERE category_id = categories.id) as book_count
       FROM categories
       ORDER BY name`
    );

    res.json({
      categories: result.rows
    });
  } catch (error) {
    logger.error('Error fetching categories', error as Error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /library/loans
 * Emprestar um livro
 */
router.post('/loans', libraryValidators.createLoan, async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { bookId, dueDate } = req.body;

    // Inicia transação
    const result = await transaction(async (_client) => {
      // Verifica se livro existe e tem cópias disponíveis
      const bookResult = await query(
        `SELECT available_copies FROM books WHERE id = $1`,
        [bookId]
      );

      if (bookResult.rows.length === 0) {
        throw new Error('Book not found');
      }

      const book = bookResult.rows[0];
      if (book.available_copies <= 0) {
        throw new Error('No copies available');
      }

      // Verifica se usuário já emprestou este livro
      const existingLoan = await query(
        `SELECT id FROM loans WHERE user_id = $1 AND book_id = $2 AND status = 'active'`,
        [userId, bookId]
      );

      if (existingLoan.rows.length > 0) {
        throw new Error('User already has this book');
      }

      // Cria empréstimo
      const loanResult = await query(
        `INSERT INTO loans (user_id, book_id, due_date, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING *`,
        [userId, bookId, dueDate]
      );

      // Decrementa available_copies
      await query(
        `UPDATE books SET available_copies = available_copies - 1 WHERE id = $1`,
        [bookId]
      );

      return loanResult.rows[0];
    });

    logger.info('Loan created', { userId, bookId });
    res.status(201).json(result);
  } catch (error: any) {
    logger.error('Error creating loan', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /library/loans
 * Ver empréstimos do usuário
 */
router.get('/loans', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { status = 'all' } = req.query;

    let whereClause = 'WHERE l.user_id = $1';
    const params: any[] = [userId];

    if (status !== 'all') {
      params.push(status);
      whereClause += ` AND l.status = $${params.length}`;
    }

    const result = await query(
      `SELECT l.id, b.title, b.cover_url, l.loan_date, l.due_date, l.return_date, 
              l.status, l.renewal_count, 
              CASE WHEN l.due_date < NOW() AND l.status = 'active' THEN true ELSE false END as is_overdue
       FROM loans l
       JOIN books b ON l.book_id = b.id
       ${whereClause}
       ORDER BY l.due_date ASC`,
      params
    );

    res.json({
      loans: result.rows
    });
  } catch (error) {
    logger.error('Error fetching loans', error as Error);
    next(error);
  }
});

/**
 * POST /library/ratings
 * Avaliar um livro
 */
router.post('/ratings', libraryValidators.addRating, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { bookId, rating, review } = req.body;

    const result = await query(
      `INSERT INTO ratings (user_id, book_id, rating, review)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, book_id) 
       DO UPDATE SET rating = $3, review = $4
       RETURNING *`,
      [userId, bookId, rating, review || null]
    );

    // Atualiza average_rating do livro
    const avgResult = await query(
      `SELECT AVG(rating) as avg_rating FROM ratings WHERE book_id = $1`,
      [bookId]
    );

    await query(
      `UPDATE books SET average_rating = $1 WHERE id = $2`,
      [avgResult.rows[0].avg_rating || 0, bookId]
    );

    logger.info('Rating created', { userId, bookId, rating });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating rating', error as Error);
    next(error);
  }
});

/**
 * POST /library/reading-list
 * Adicionar livro à lista de leitura
 */
router.post('/reading-list', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { bookId, listType = 'want_to_read' } = req.body;

    const result = await query(
      `INSERT INTO reading_lists (user_id, book_id, list_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, book_id) 
       DO UPDATE SET list_type = $3
       RETURNING *`,
      [userId, bookId, listType]
    );

    logger.info('Book added to reading list', { userId, bookId });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error adding to reading list', error as Error);
    next(error);
  }
});

/**
 * GET /library/reading-list
 * Ver lista de leitura do usuário
 */
router.get('/reading-list', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { listType = 'want_to_read' } = req.query;

    const result = await query(
      `SELECT b.id, b.title, b.author_id, a.name as author, 
              b.cover_url, b.average_rating, rl.list_type, rl.added_at
       FROM reading_lists rl
       JOIN books b ON rl.book_id = b.id
       JOIN authors a ON b.author_id = a.id
       WHERE rl.user_id = $1 AND rl.list_type = $2
       ORDER BY rl.added_at DESC`,
      [userId, listType]
    );

    res.json({
      readingList: result.rows
    });
  } catch (error) {
    logger.error('Error fetching reading list', error as Error);
    next(error);
  }
});

/**
 * DELETE /library/reading-list/:bookId
 * Remover livro da lista de leitura
 */
router.delete('/reading-list/:bookId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { bookId } = req.params;

    await query(
      `DELETE FROM reading_lists WHERE user_id = $1 AND book_id = $2`,
      [userId, bookId]
    );

    logger.info('Book removed from reading list', { userId, bookId });
    res.json({ message: 'Book removed from reading list' });
  } catch (error) {
    logger.error('Error removing from reading list', error as Error);
    next(error);
  }
});

export default router;
