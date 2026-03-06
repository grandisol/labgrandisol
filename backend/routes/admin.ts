/**
 * Admin Routes - LabGrandisol
 * Gerenciamento completo de sistema, usuários e biblioteca
 * Suporte completo a Mock Database para desenvolvimento
 */

import { Router, Request, Response, NextFunction } from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import { mockDB } from '../utils/mockDatabase.js';
import Logger from '../utils/logger.js';
import adminAlertsRoutes from './admin-alerts.js';

const router = Router();
const logger = new Logger('AdminRoutes');

// Configurações do sistema em memória (em produção usaria banco de dados)
const systemSettings: Record<string, any> = {
  siteName: 'LabGrandisol',
  siteDescription: 'Sistema de Biblioteca Virtual',
  contactEmail: 'contato@labgrandisol.com',
  loanDuration: 14,
  maxRenewals: 3,
  maxLoansPerUser: 5,
  lateFeePerDay: 0.50,
  notificationsEnabled: true,
  backupEnabled: true,
  maintenanceMode: false,
  allowRegistration: true,
  theme: 'vintage',
  primaryColor: '#b8860b',
  itemsPerPage: 20,
  sessionTimeout: 24,
  passwordMinLength: 6,
  requireEmailVerification: false,
};

// Middleware para verificar admin
router.use(verifyAdmin);

// ==================== DASHBOARD ====================

/**
 * GET /api/admin/stats
 * Estatísticas resumidas para o dashboard
 */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = {
      users: mockDB.users.length,
      books: mockDB.books.length,
      loans: mockDB.loans.filter(l => l.status === 'active').length,
      pending: mockDB.loans.filter(l => l.status === 'active' && new Date(l.due_date) < new Date()).length,
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats', error as Error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

/**
 * GET /api/admin/dashboard
 * Dashboard completo com estatísticas e atividade recente
 */
router.get('/dashboard', async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    // Sempre usar mock database para desenvolvimento
    const stats = {
      total_users: mockDB.users.length,
      total_books: mockDB.books.length,
      active_loans: mockDB.loans.filter(l => l.status === 'active').length,
      total_authors: mockDB.authors.length,
      total_categories: mockDB.categories.length,
      avg_available_copies: mockDB.books.reduce((sum, b) => sum + b.available_copies, 0) / mockDB.books.length,
      pending_returns: mockDB.loans.filter(l => l.status === 'active' && new Date(l.due_date) < new Date()).length,
      total_ratings: mockDB.ratings.length,
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
          time: new Date(loan.borrow_date).toLocaleDateString('pt-BR'),
          due_date: loan.due_date ? new Date(loan.due_date).toLocaleDateString('pt-BR') : null,
          status: loan.status,
        };
      });

    const healthChecks = {
      database: 'healthy',
      cache: 'healthy',
      api: 'healthy',
      storage: 'healthy',
    };

    // Estatísticas de usuários por role
    const userStats = {
      admins: mockDB.users.filter(u => u.role === 'admin').length,
      regular_users: mockDB.users.filter(u => u.role === 'user').length,
      active: mockDB.users.filter(u => u.status === 'active').length,
    };

    // Estatísticas de livros por categoria
    const booksByCategory = mockDB.categories.map(cat => ({
      name: cat.name,
      count: mockDB.books.filter(b => b.category_id === cat.id).length,
      icon: cat.icon,
    }));

    res.json({
      stats,
      recentActivity,
      systemHealth: healthChecks,
      userStats,
      booksByCategory,
    });
  } catch (error) {
    logger.error('Error fetching dashboard', error as Error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== USERS MANAGEMENT ====================

/**
 * GET /api/admin/users
 * Listar todos os usuários
 */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0, search = '', role = '', status = '' } = req.query;

    let filteredUsers = [...mockDB.users];

    // Filtro por busca
    if (search) {
      const searchLower = String(search).toLowerCase();
      filteredUsers = filteredUsers.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por role
    if (role) {
      filteredUsers = filteredUsers.filter(u => u.role === role);
    }

    // Filtro por status
    if (status) {
      filteredUsers = filteredUsers.filter(u => u.status === status);
    }

    // Paginação
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedUsers = filteredUsers.slice(offsetNum, offsetNum + limitNum);

    // Adicionar estatísticas de cada usuário
    const usersWithStats = paginatedUsers.map(user => ({
      ...user,
      active_loans: mockDB.loans.filter(l => l.user_id === user.id && l.status === 'active').length,
      total_loans: mockDB.loans.filter(l => l.user_id === user.id).length,
      reading_list_count: mockDB.readingLists.filter(rl => rl.user_id === user.id).length,
    }));

    res.json({
      users: usersWithStats,
      total: filteredUsers.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    logger.error('Error fetching users', error as Error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

/**
 * GET /api/admin/users/:id
 * Obter detalhes de um usuário específico
 */
router.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const user = mockDB.users.find(u => u.id === parseInt(id));

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const userLoans = mockDB.loans.filter(l => l.user_id === user.id);
    const userReadingList = mockDB.readingLists.filter(rl => rl.user_id === user.id);
    const userRatings = mockDB.ratings.filter(r => r.user_id === user.id);

    res.json({
      user: {
        ...user,
        stats: {
          active_loans: userLoans.filter(l => l.status === 'active').length,
          total_loans: userLoans.length,
          reading_list_count: userReadingList.length,
          ratings_count: userRatings.length,
        },
        loans: userLoans.map(l => ({
          ...l,
          book: mockDB.books.find(b => b.id === l.book_id),
        })),
        reading_list: userReadingList.map(rl => ({
          ...rl,
          book: mockDB.books.find(b => b.id === rl.book_id),
        })),
      },
    });
  } catch (error) {
    logger.error('Error fetching user details', error as Error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do usuário' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Atualizar usuário
 */
router.put('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, email, role, status } = req.body;

    const userIndex = mockDB.users.findIndex(u => u.id === parseInt(id));

    if (userIndex === -1) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Atualizar campos permitidos
    if (name) mockDB.users[userIndex].name = name;
    if (email) mockDB.users[userIndex].email = email;
    if (role && ['admin', 'user'].includes(role)) mockDB.users[userIndex].role = role;
    if (status && ['active', 'inactive'].includes(status)) mockDB.users[userIndex].status = status;

    logger.info('User updated', { userId: id, updates: { name, email, role, status } });

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: mockDB.users[userIndex],
    });
  } catch (error) {
    logger.error('Error updating user', error as Error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Desativar usuário (soft delete)
 */
router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userIndex = mockDB.users.findIndex(u => u.id === parseInt(id));

    if (userIndex === -1) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Soft delete - apenas marca como inativo
    mockDB.users[userIndex].status = 'inactive';

    logger.info('User deactivated', { userId: id });

    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (error) {
    logger.error('Error deleting user', error as Error);
    res.status(500).json({ error: 'Erro ao desativar usuário' });
  }
});

// ==================== BOOKS MANAGEMENT ====================

/**
 * GET /api/admin/books
 * Listar todos os livros com filtros
 */
router.get('/books', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20, offset = 0, search = '', category = '', status = '' } = req.query;

    let filteredBooks = [...mockDB.books];

    // Filtro por busca
    if (search) {
      const searchLower = String(search).toLowerCase();
      filteredBooks = filteredBooks.filter(b =>
        b.title.toLowerCase().includes(searchLower) ||
        b.isbn?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por categoria
    if (category) {
      const cat = mockDB.categories.find(c => c.name === category);
      if (cat) {
        filteredBooks = filteredBooks.filter(b => b.category_id === cat.id);
      }
    }

    // Filtro por disponibilidade
    if (status === 'available') {
      filteredBooks = filteredBooks.filter(b => b.available_copies > 0);
    } else if (status === 'unavailable') {
      filteredBooks = filteredBooks.filter(b => b.available_copies === 0);
    }

    // Paginação
    const limitNum = parseInt(limit as string) || 20;
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedBooks = filteredBooks.slice(offsetNum, offsetNum + limitNum);

    // Enriquecer com dados de autor e categoria
    const enrichedBooks = paginatedBooks.map(book => {
      const author = mockDB.authors.find(a => a.id === book.author_id);
      const category = mockDB.categories.find(c => c.id === book.category_id);
      const bookRatings = mockDB.ratings.filter(r => r.book_id === book.id);
      const avgRating = bookRatings.length > 0
        ? bookRatings.reduce((sum, r) => sum + r.rating, 0) / bookRatings.length
        : 0;

      return {
        ...book,
        author: author?.name || 'Desconhecido',
        category: category?.name || 'Geral',
        category_icon: category?.icon,
        average_rating: avgRating.toFixed(1),
        ratings_count: bookRatings.length,
        active_loans: mockDB.loans.filter(l => l.book_id === book.id && l.status === 'active').length,
      };
    });

    res.json({
      books: enrichedBooks,
      total: filteredBooks.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    logger.error('Error fetching books', error as Error);
    res.status(500).json({ error: 'Erro ao buscar livros' });
  }
});

/**
 * POST /api/admin/books
 * Criar novo livro
 */
router.post('/books', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      title, author_id, category_id, isbn, 
      published_year, pages, description,
      total_copies = 1, cover_url 
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Título é obrigatório' });
      return;
    }

    const newBook = {
      id: Math.max(...mockDB.books.map(b => b.id), 0) + 1,
      title,
      author_id: author_id || 1,
      category_id: category_id || 1,
      isbn: isbn || '',
      description: description || '',
      cover_url: cover_url || '',
      pages: pages || 0,
      published_year: published_year || new Date().getFullYear(),
      available_copies: total_copies,
      total_copies: total_copies,
      created_at: new Date(),
    };

    mockDB.books.push(newBook as any);

    logger.info('Book created', { bookId: newBook.id, title });

    res.status(201).json({
      message: 'Livro criado com sucesso',
      book: newBook,
    });
  } catch (error) {
    logger.error('Error creating book', error as Error);
    res.status(500).json({ error: 'Erro ao criar livro' });
  }
});

/**
 * PUT /api/admin/books/:id
 * Atualizar livro
 */
router.put('/books/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const updates = req.body;

    const bookIndex = mockDB.books.findIndex(b => b.id === parseInt(id));

    if (bookIndex === -1) {
      res.status(404).json({ error: 'Livro não encontrado' });
      return;
    }

    // Campos permitidos para atualização
    const allowedFields = ['title', 'author_id', 'category_id', 'isbn', 'published_year', 
                          'publisher', 'pages', 'description', 'total_copies', 'available_copies', 'cover_url'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        (mockDB.books[bookIndex] as any)[field] = updates[field];
      }
    });

    logger.info('Book updated', { bookId: id });

    res.json({
      message: 'Livro atualizado com sucesso',
      book: mockDB.books[bookIndex],
    });
  } catch (error) {
    logger.error('Error updating book', error as Error);
    res.status(500).json({ error: 'Erro ao atualizar livro' });
  }
});

/**
 * DELETE /api/admin/books/:id
 * Remover livro
 */
router.delete('/books/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const bookIndex = mockDB.books.findIndex(b => b.id === parseInt(id));

    if (bookIndex === -1) {
      res.status(404).json({ error: 'Livro não encontrado' });
      return;
    }

    // Verificar se há empréstimos ativos
    const activeLoans = mockDB.loans.filter(l => l.book_id === parseInt(id) && l.status === 'active');
    if (activeLoans.length > 0) {
      res.status(400).json({ 
        error: 'Não é possível remover. Existem empréstimos ativos para este livro.',
        active_loans: activeLoans.length 
      });
      return;
    }

    mockDB.books.splice(bookIndex, 1);

    logger.info('Book deleted', { bookId: id });

    res.json({ message: 'Livro removido com sucesso' });
  } catch (error) {
    logger.error('Error deleting book', error as Error);
    res.status(500).json({ error: 'Erro ao remover livro' });
  }
});

// ==================== LOANS MANAGEMENT ====================

/**
 * GET /api/admin/loans
 * Listar empréstimos com filtros
 */
router.get('/loans', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = '', user_id = '', book_id = '', limit = 50, offset = 0 } = req.query;

    let filteredLoans = [...mockDB.loans];

    // Filtro por status
    if (status) {
      filteredLoans = filteredLoans.filter(l => l.status === status);
    }

    // Filtro por usuário
    if (user_id) {
      filteredLoans = filteredLoans.filter(l => l.user_id === parseInt(user_id as string));
    }

    // Filtro por livro
    if (book_id) {
      filteredLoans = filteredLoans.filter(l => l.book_id === parseInt(book_id as string));
    }

    // Ordenar por data
    filteredLoans.sort((a, b) => new Date(b.borrow_date).getTime() - new Date(a.borrow_date).getTime());

    // Paginação
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedLoans = filteredLoans.slice(offsetNum, offsetNum + limitNum);

    // Enriquecer com dados
    const enrichedLoans = paginatedLoans.map(loan => {
      const user = mockDB.users.find(u => u.id === loan.user_id);
      const book = mockDB.books.find(b => b.id === loan.book_id);
      const isOverdue = loan.status === 'active' && new Date(loan.due_date) < new Date();

      return {
        ...loan,
        user: user ? { id: user.id, name: user.name, email: user.email } : null,
        book: book ? { id: book.id, title: book.title } : null,
        is_overdue: isOverdue,
        days_overdue: isOverdue 
          ? Math.floor((new Date().getTime() - new Date(loan.due_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      };
    });

    res.json({
      loans: enrichedLoans,
      total: filteredLoans.length,
      limit: limitNum,
      offset: offsetNum,
      stats: {
        active: mockDB.loans.filter(l => l.status === 'active').length,
        returned: mockDB.loans.filter(l => l.status === 'returned').length,
        overdue: mockDB.loans.filter(l => l.status === 'active' && new Date(l.due_date) < new Date()).length,
      },
    });
  } catch (error) {
    logger.error('Error fetching loans', error as Error);
    res.status(500).json({ error: 'Erro ao buscar empréstimos' });
  }
});

/**
 * POST /api/admin/loans/:id/return
 * Registrar devolução de livro
 */
router.post('/loans/:id/return', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const loanIndex = mockDB.loans.findIndex(l => l.id === parseInt(id));

    if (loanIndex === -1) {
      res.status(404).json({ error: 'Empréstimo não encontrado' });
      return;
    }

    const loan = mockDB.loans[loanIndex];

    if (loan.status !== 'active') {
      res.status(400).json({ error: 'Este empréstimo já foi finalizado' });
      return;
    }

    // Atualizar empréstimo
    mockDB.loans[loanIndex].status = 'returned';
    mockDB.loans[loanIndex].return_date = new Date();

    // Incrementar cópias disponíveis
    const bookIndex = mockDB.books.findIndex(b => b.id === loan.book_id);
    if (bookIndex !== -1) {
      mockDB.books[bookIndex].available_copies++;
    }

    logger.info('Loan returned', { loanId: id });

    res.json({ 
      message: 'Devolução registrada com sucesso',
      loan: mockDB.loans[loanIndex],
    });
  } catch (error) {
    logger.error('Error returning loan', error as Error);
    res.status(500).json({ error: 'Erro ao registrar devolução' });
  }
});

/**
 * POST /api/admin/loans/:id/renew
 * Renovar empréstimo
 */
router.post('/loans/:id/renew', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const loanIndex = mockDB.loans.findIndex(l => l.id === parseInt(id));

    if (loanIndex === -1) {
      res.status(404).json({ error: 'Empréstimo não encontrado' });
      return;
    }

    const loan = mockDB.loans[loanIndex];

    if (loan.status !== 'active') {
      res.status(400).json({ error: 'Este empréstimo não pode ser renovado' });
      return;
    }

    // Estender data de devolução
    const currentDueDate = new Date(loan.due_date);
    const newDueDate = new Date(currentDueDate);
    newDueDate.setDate(newDueDate.getDate() + (systemSettings.loanDuration || 14));

    mockDB.loans[loanIndex].due_date = newDueDate;

    logger.info('Loan renewed', { loanId: id, newDueDate });

    res.json({ 
      message: 'Empréstimo renovado com sucesso',
      loan: mockDB.loans[loanIndex],
    });
  } catch (error) {
    logger.error('Error renewing loan', error as Error);
    res.status(500).json({ error: 'Erro ao renovar empréstimo' });
  }
});

// ==================== CATEGORIES MANAGEMENT ====================

/**
 * GET /api/admin/categories
 * Listar categorias
 */
router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = mockDB.categories.map(cat => ({
      ...cat,
      book_count: mockDB.books.filter(b => b.category_id === cat.id).length,
    }));

    res.json({ categories });
  } catch (error) {
    logger.error('Error fetching categories', error as Error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

/**
 * POST /api/admin/categories
 * Criar nova categoria
 */
router.post('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, icon, color } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Nome é obrigatório' });
      return;
    }

    const newCategory = {
      id: Math.max(...mockDB.categories.map(c => c.id), 0) + 1,
      name,
      icon: icon || '📚',
      color: color || '#6b4423',
      created_at: new Date(),
    };

    mockDB.categories.push(newCategory);

    logger.info('Category created', { name });

    res.status(201).json({
      message: 'Categoria criada com sucesso',
      category: newCategory,
    });
  } catch (error) {
    logger.error('Error creating category', error as Error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// ==================== AUTHORS MANAGEMENT ====================

/**
 * GET /api/admin/authors
 * Listar autores
 */
router.get('/authors', async (_req: Request, res: Response): Promise<void> => {
  try {
    const authors = mockDB.authors.map(author => ({
      ...author,
      book_count: mockDB.books.filter(b => b.author_id === author.id).length,
    }));

    res.json({ authors });
  } catch (error) {
    logger.error('Error fetching authors', error as Error);
    res.status(500).json({ error: 'Erro ao buscar autores' });
  }
});

/**
 * POST /api/admin/authors
 * Criar novo autor
 */
router.post('/authors', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, biography } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Nome é obrigatório' });
      return;
    }

    const newAuthor = {
      id: Math.max(...mockDB.authors.map(a => a.id), 0) + 1,
      name,
      biography: biography || '',
      created_at: new Date(),
    };

    mockDB.authors.push(newAuthor);

    logger.info('Author created', { name });

    res.status(201).json({
      message: 'Autor criado com sucesso',
      author: newAuthor,
    });
  } catch (error) {
    logger.error('Error creating author', error as Error);
    res.status(500).json({ error: 'Erro ao criar autor' });
  }
});

// ==================== SETTINGS ====================

/**
 * GET /api/admin/settings
 * Obter configurações do sistema
 */
router.get('/settings', (_req: Request, res: Response): void => {
  res.json({
    settings: systemSettings,
  });
});

/**
 * PUT /api/admin/settings
 * Atualizar configurações
 */
router.put('/settings', (req: Request, res: Response): void => {
  const updates = req.body;

  // Atualizar apenas campos permitidos
  const allowedSettings = [
    'siteName', 'siteDescription', 'contactEmail',
    'loanDuration', 'maxRenewals', 'maxLoansPerUser', 'lateFeePerDay',
    'notificationsEnabled', 'backupEnabled', 'maintenanceMode',
    'allowRegistration', 'theme', 'primaryColor', 'itemsPerPage',
    'sessionTimeout', 'passwordMinLength', 'requireEmailVerification'
  ];

  let updatedCount = 0;
  allowedSettings.forEach(key => {
    if (updates[key] !== undefined) {
      systemSettings[key] = updates[key];
      updatedCount++;
    }
  });

  logger.info('Settings updated', { count: updatedCount });

  res.json({
    message: 'Configurações atualizadas com sucesso',
    settings: systemSettings,
    updated_count: updatedCount,
  });
});

// ==================== NOTES ====================

// Armazenamento de notas admin
const adminNotes: Array<{ id: number; title: string; content: string; created_at: Date; updated_at: Date }> = [];

/**
 * GET /api/admin/notes
 * Listar notas do admin
 */
router.get('/notes', (_req: Request, res: Response): void => {
  res.json({
    notes: adminNotes.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime()),
  });
});

/**
 * POST /api/admin/notes
 * Criar nota
 */
router.post('/notes', (req: Request, res: Response): void => {
  const { title, content } = req.body;

  const note = {
    id: adminNotes.length + 1,
    title: title || 'Sem título',
    content: content || '',
    created_at: new Date(),
    updated_at: new Date(),
  };

  adminNotes.push(note);

  res.status(201).json({
    message: 'Nota criada com sucesso',
    note,
  });
});

/**
 * DELETE /api/admin/notes/:id
 * Deletar nota
 */
router.delete('/notes/:id', (req: Request, res: Response): void => {
  const id = String(req.params.id);
  const index = adminNotes.findIndex(n => n.id === parseInt(id));

  if (index === -1) {
    res.status(404).json({ error: 'Nota não encontrada' });
    return;
  }

  adminNotes.splice(index, 1);

  res.json({ message: 'Nota removida com sucesso' });
});

// ==================== ALERTS ====================

// Alertas
router.use('/alerts', adminAlertsRoutes);

export default router;