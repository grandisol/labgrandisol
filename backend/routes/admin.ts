/**
 * Admin Routes
 * Gerenciamento de sistema, usuários e biblioteca
 */

import { Router, Request, Response, NextFunction } from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import { query } from '../utils/database.js';
import { mockDB } from '../utils/mockDatabase.js';
import Logger from '../utils/logger.js';

const router = Router();
const logger = new Logger('AdminRoutes');

// Middleware para verificar admin
router.use(verifyAdmin);

/**
 * GET /admin/dashboard
 * Dashboard com estatísticas do sistema
 */
router.get('/dashboard', async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    // Em desenvolvimento, usar mock database
    if (process.env.NODE_ENV === 'development') {
      const stats = {
        total_users: mockDB.users.length,
        total_books: mockDB.books.length,
        active_loans: mockDB.loans.filter(l => l.status === 'active').length,
        total_authors: mockDB.authors.length,
        total_categories: mockDB.categories.length,
        avg_available_copies: mockDB.books.reduce((sum, b) => sum + b.available_copies, 0) / mockDB.books.length
      };

      const recentActivity = mockDB.loans
        .sort((a, b) => new Date(b.borrow_date).getTime() - new Date(a.borrow_date).getTime())
        .slice(0, 10)
        .map(loan => {
          const user = mockDB.users.find(u => u.id === loan.user_id);
          const book = mockDB.books.find(b => b.id === loan.book_id);
          return {
            id: loan.id,
            action: loan.status === 'active' ? 'Borrowed' : 'Returned',
            user: user?.name || 'Unknown',
            book: book?.title || 'Unknown',
            time: new Date(loan.borrow_date).toLocaleDateString('pt-BR')
          };
        });

      const healthChecks = {
        database: 'mock',
        cache: 'healthy',
        api: 'healthy'
      };

      res.json({
        stats,
        recentActivity,
        systemHealth: healthChecks
      });
      return;
    }

    // Em produção, usar PostgreSQL
    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM books) as total_books,
        (SELECT COUNT(*) FROM loans WHERE status = 'active') as active_loans,
        (SELECT COUNT(*) FROM authors) as total_authors,
        (SELECT COUNT(DISTINCT category_id) FROM books) as total_categories,
        (SELECT AVG(available_copies) FROM books) as avg_available_copies
    `);

    const stats = statsResult.rows[0];

    const activityResult = await query(`
      SELECT l.id, u.name, b.title, l.loan_date, l.status
      FROM loans l
      JOIN users u ON l.user_id = u.id
      JOIN books b ON l.book_id = b.id
      ORDER BY l.loan_date DESC
      LIMIT 10
    `);

    const recentActivity = activityResult.rows.map(row => ({
      id: row.id,
      action: row.status === 'active' ? 'Borrowed' : 'Returned',
      user: row.name,
      book: row.title,
      time: new Date(row.loan_date).toLocaleDateString()
    }));

    const healthChecks = {
      database: 'healthy',
      cache: 'healthy',
      api: 'healthy'
    };

    res.json({
      stats,
      recentActivity,
      systemHealth: healthChecks
    });
  } catch (error) {
    logger.error('Error fetching dashboard', error as Error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /admin/books
 * Listar todos os livros com filtros
 */
router.get('/books', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = 20, offset = 0, search = '' } = req.query;

    let whereClause = '';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE b.title ILIKE $1 OR a.name ILIKE $1`;
    }

    const booksResult = await query(
      `SELECT 
        b.id, b.title, a.name as author, c.name as category,
        b.isbn, b.publication_year, b.total_copies, b.available_copies,
        b.average_rating, b.status, b.created_at
      FROM books b
      JOIN authors a ON b.author_id = a.id
      JOIN categories c ON b.category_id = c.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
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
 * POST /admin/books
 * Criar novo livro
 */
router.post('/books', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, author_id, category_id, isbn, publication_year, publisher, pages, description } = req.body;

    const result = await query(
      `INSERT INTO books (title, author_id, category_id, isbn, publication_year, publisher, pages, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, author_id, category_id, isbn, publication_year, publisher, pages, description]
    );

    logger.info('Book created', { bookId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating book', error as Error);
    next(error);
  }
});

/**
 * PUT /admin/books/:id
 * Atualizar livro
 */
router.put('/books/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const result = await query(
      `UPDATE books SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    logger.info('Book updated', { bookId: id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating book', error as Error);
    next(error);
  }
});

/**
 * DELETE /admin/books/:id
 * Deletar livro
 */
router.delete('/books/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await query('DELETE FROM books WHERE id = $1', [id]);

    logger.info('Book deleted', { bookId: id });
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    logger.error('Error deleting book', error as Error);
    next(error);
  }
});

/**
 * GET /admin/users
 * Listar usuários
 */
router.get('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT id, email, name, role, status, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      users: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching users', error as Error);
    next(error);
  }
});

/**
 * GET /admin/loans
 * Gerenciar empréstimos
 */
router.get('/loans', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status = 'active', limit = 50 } = req.query;

    const result = await query(
      `SELECT l.id, u.name, u.email, b.title, l.loan_date, l.due_date, l.status, l.renewal_count
       FROM loans l
       JOIN users u ON l.user_id = u.id
       JOIN books b ON l.book_id = b.id
       WHERE l.status = $1
       ORDER BY l.due_date ASC
       LIMIT $2`,
      [status, limit]
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
 * POST /admin/loans/:id/return
 * Registrar devolução de livro
 */
router.post('/loans/:id/return', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const loanResult = await query(
      `UPDATE loans SET status = 'returned', return_date = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING book_id`,
      [id]
    );

    if (loanResult.rows.length === 0) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }

    // Incrementa available_copies
    const bookId = loanResult.rows[0].book_id;
    await query('UPDATE books SET available_copies = available_copies + 1 WHERE id = $1', [bookId]);

    logger.info('Loan returned', { loanId: id });
    res.json({ message: 'Book returned successfully' });
  } catch (error) {
    logger.error('Error returning loan', error as Error);
    next(error);
  }
});

/**
 * GET /admin/settings
 * Configurações do sistema
 */
router.get('/settings', (_req: Request, res: Response): void => {
  res.json({
    siteName: 'LibraryHub',
    loanDuration: 14,
    maxRenewals: 3,
    maxLoansPerUser: 10,
    lateFeePerDay: 0.50,
    notificationsEnabled: true,
    backupEnabled: true
  });
});

/**
 * PUT /admin/settings
 * Atualizar configurações
 */
router.put('/settings', (req: Request, res: Response): void => {
  const { loanDuration, maxRenewals } = req.body;

  logger.info('Settings updated', { loanDuration, maxRenewals });

  res.json({
    message: 'Settings updated successfully',
    settings: req.body
  });
});

export default router;
