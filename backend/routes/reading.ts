/**
 * Reading Tracker Routes - LabGrandisol
 * Sistema de acompanhamento de leitura e progresso
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import Logger from '../utils/logger.js';

const logger = new Logger('ReadingTracker');

const router = Router();

// Tipo para progresso de leitura
interface ReadingProgress {
  id: number;
  user_id: number;
  book_id: number;
  current_page: number;
  total_pages: number;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
  notes: string;
}

// Tipo para sessão de leitura
interface ReadingSession {
  id: number;
  user_id: number;
  book_id: number;
  start_page: number;
  end_page: number;
  duration_minutes: number;
  date: string;
  notes: string;
}

// Mock data store
const readingProgress: ReadingProgress[] = [
  {
    id: 1,
    user_id: 2,
    book_id: 3,
    current_page: 120,
    total_pages: 256,
    started_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    notes: 'Livro fascinante sobre física cosmology',
  },
];

const readingSessions: ReadingSession[] = [
  {
    id: 1,
    user_id: 2,
    book_id: 3,
    start_page: 100,
    end_page: 120,
    duration_minutes: 45,
    date: new Date().toISOString(),
    notes: 'Capítulo sobre buracos negros',
  },
  {
    id: 2,
    user_id: 2,
    book_id: 3,
    start_page: 80,
    end_page: 100,
    duration_minutes: 30,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Teoria do Big Bang',
  },
];

const readingGoals: Record<number, {
  daily_pages: number;
  weekly_books: number;
  monthly_books: number;
  streak_days: number;
  longest_streak: number;
}> = {
  1: { daily_pages: 30, weekly_books: 1, monthly_books: 4, streak_days: 15, longest_streak: 45 },
  2: { daily_pages: 20, weekly_books: 1, monthly_books: 3, streak_days: 8, longest_streak: 12 },
  3: { daily_pages: 25, weekly_books: 1, monthly_books: 4, streak_days: 23, longest_streak: 30 },
};

/**
 * GET /api/reading/progress
 * Obter progresso de leitura do usuário
 */
router.get('/progress', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const progress = readingProgress.filter(p => p.user_id === userId);
    
    // Enrich with book data
    const { mockDB } = require('../utils/mockDatabase.js');
    const enrichedProgress = progress.map(p => {
      const book = mockDB.books.find((b: any) => b.id === p.book_id);
      return {
        ...p,
        book_title: book?.title || 'Livro Desconhecido',
        book_author: book?.author_id ? mockDB.authors.find((a: any) => a.id === book.author_id)?.name : 'Desconhecido',
        percentage: Math.round((p.current_page / p.total_pages) * 100),
      };
    });

    logger.info(`Progress retrieved for user ${userId}`);

    res.status(200).json({
      progress: enrichedProgress,
      total_books_reading: enrichedProgress.length,
      average_progress: enrichedProgress.length > 0 
        ? Math.round(enrichedProgress.reduce((sum, p) => sum + p.percentage, 0) / enrichedProgress.length)
        : 0,
    });
  } catch (error) {
    logger.error('Error fetching reading progress');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/reading/progress
 * Iniciar acompanhamento de um livro
 */
router.post('/progress', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { book_id, current_page, total_pages, notes } = req.body;

    if (!book_id || !total_pages) {
      res.status(400).json({ error: 'book_id e total_pages são obrigatórios' });
      return;
    }

    // Check if already tracking
    const existing = readingProgress.find(p => p.user_id === userId && p.book_id === book_id);
    if (existing) {
      res.status(409).json({ error: 'Livro já está sendo acompanhado' });
      return;
    }

    const newProgress: ReadingProgress = {
      id: readingProgress.length + 1,
      user_id: userId,
      book_id,
      current_page: current_page || 0,
      total_pages,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      notes: notes || '',
    };

    readingProgress.push(newProgress);

    logger.info(`Reading tracking started for user ${userId}, book ${book_id}`);

    res.status(201).json({
      message: 'Acompanhamento iniciado',
      progress: newProgress,
    });
  } catch (error) {
    logger.error('Error starting reading progress');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/reading/progress/:bookId
 * Atualizar progresso de leitura
 */
router.put('/progress/:bookId', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { bookId } = req.params;
    const { current_page, notes, completed } = req.body;

    const progress = readingProgress.find(p => p.user_id === userId && p.book_id === Number(bookId));
    
    if (!progress) {
      res.status(404).json({ error: 'Progresso não encontrado' });
      return;
    }

    if (current_page !== undefined) {
      progress.current_page = current_page;
    }
    
    if (notes !== undefined) {
      progress.notes = notes;
    }
    
    if (completed) {
      progress.completed_at = new Date().toISOString();
      progress.current_page = progress.total_pages;
    }

    progress.updated_at = new Date().toISOString();

    logger.info(`Reading progress updated for user ${userId}, book ${bookId}`);

    res.status(200).json({
      message: 'Progresso atualizado',
      progress,
    });
  } catch (error) {
    logger.error('Error updating reading progress');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/reading/sessions
 * Obter sessões de leitura
 */
router.get('/sessions', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const sessions = readingSessions
      .filter(s => s.user_id === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate stats
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    const totalPages = sessions.reduce((sum, s) => sum + (s.end_page - s.start_page), 0);

    logger.info(`Sessions retrieved for user ${userId}`);

    res.status(200).json({
      sessions,
      stats: {
        total_sessions: sessions.length,
        total_minutes: totalMinutes,
        total_pages: totalPages,
        average_session_minutes: sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching reading sessions');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/reading/sessions
 * Registrar sessão de leitura
 */
router.post('/sessions', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { book_id, start_page, end_page, duration_minutes, notes } = req.body;

    if (!book_id || start_page === undefined || end_page === undefined || !duration_minutes) {
      res.status(400).json({ error: 'Dados incompletos' });
      return;
    }

    const newSession: ReadingSession = {
      id: readingSessions.length + 1,
      user_id: userId,
      book_id,
      start_page,
      end_page,
      duration_minutes,
      date: new Date().toISOString(),
      notes: notes || '',
    };

    readingSessions.push(newSession);

    // Update progress if exists
    const progress = readingProgress.find(p => p.user_id === userId && p.book_id === book_id);
    if (progress) {
      progress.current_page = Math.max(progress.current_page, end_page);
      progress.updated_at = new Date().toISOString();
    }

    logger.info(`Reading session logged for user ${userId}`);

    res.status(201).json({
      message: 'Sessão registrada',
      session: newSession,
    });
  } catch (error) {
    logger.error('Error logging reading session');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/reading/goals
 * Obter metas de leitura
 */
router.get('/goals', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const goals = readingGoals[userId] || {
      daily_pages: 20,
      weekly_books: 1,
      monthly_books: 4,
      streak_days: 0,
      longest_streak: 0,
    };

    // Calculate today's progress
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = readingSessions.filter(
      s => s.user_id === userId && s.date.split('T')[0] === today
    );
    const todayPages = todaySessions.reduce((sum, s) => sum + (s.end_page - s.start_page), 0);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    logger.info(`Goals retrieved for user ${userId}`);

    res.status(200).json({
      goals,
      today: {
        pages_read: todayPages,
        minutes_read: todayMinutes,
        sessions: todaySessions.length,
        goal_progress: Math.min(100, Math.round((todayPages / goals.daily_pages) * 100)),
      },
    });
  } catch (error) {
    logger.error('Error fetching reading goals');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/reading/goals
 * Atualizar metas de leitura
 */
router.put('/goals', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { daily_pages, weekly_books, monthly_books } = req.body;

    if (!readingGoals[userId]) {
      readingGoals[userId] = {
        daily_pages: 20,
        weekly_books: 1,
        monthly_books: 4,
        streak_days: 0,
        longest_streak: 0,
      };
    }

    if (daily_pages !== undefined) readingGoals[userId].daily_pages = daily_pages;
    if (weekly_books !== undefined) readingGoals[userId].weekly_books = weekly_books;
    if (monthly_books !== undefined) readingGoals[userId].monthly_books = monthly_books;

    logger.info(`Goals updated for user ${userId}`);

    res.status(200).json({
      message: 'Metas atualizadas',
      goals: readingGoals[userId],
    });
  } catch (error) {
    logger.error('Error updating reading goals');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/reading/stats
 * Estatísticas detalhadas de leitura
 */
router.get('/stats', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const userSessions = readingSessions.filter(s => s.user_id === userId);
    const userProgress = readingProgress.filter(p => p.user_id === userId);
    const completedBooks = userProgress.filter(p => p.completed_at !== null);

    // Calculate by time period
    const now = new Date();
    const thisWeek = userSessions.filter(s => {
      const sessionDate = new Date(s.date);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return sessionDate >= weekAgo;
    });

    const thisMonth = userSessions.filter(s => {
      const sessionDate = new Date(s.date);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return sessionDate >= monthAgo;
    });

    // Genre breakdown (mock)
    const genreBreakdown = [
      { genre: 'Ficção', percentage: 45, books: 5 },
      { genre: 'Ciência', percentage: 25, books: 3 },
      { genre: 'História', percentage: 20, books: 2 },
      { genre: 'Outros', percentage: 10, books: 1 },
    ];

    // Monthly trend
    const monthlyTrend = [
      { month: 'Jan', pages: 450, books: 2 },
      { month: 'Fev', pages: 520, books: 3 },
    ];

    logger.info(`Stats retrieved for user ${userId}`);

    res.status(200).json({
      overview: {
        total_books_completed: completedBooks.length,
        total_pages_read: userSessions.reduce((sum, s) => sum + (s.end_page - s.start_page), 0),
        total_reading_time_minutes: userSessions.reduce((sum, s) => sum + s.duration_minutes, 0),
        average_pages_per_session: userSessions.length > 0 
          ? Math.round(userSessions.reduce((sum, s) => sum + (s.end_page - s.start_page), 0) / userSessions.length)
          : 0,
      },
      weekly: {
        sessions: thisWeek.length,
        pages: thisWeek.reduce((sum, s) => sum + (s.end_page - s.start_page), 0),
        minutes: thisWeek.reduce((sum, s) => sum + s.duration_minutes, 0),
      },
      monthly: {
        sessions: thisMonth.length,
        pages: thisMonth.reduce((sum, s) => sum + (s.end_page - s.start_page), 0),
        minutes: thisMonth.reduce((sum, s) => sum + s.duration_minutes, 0),
      },
      genre_breakdown: genreBreakdown,
      monthly_trend: monthlyTrend,
      reading_streak: readingGoals[userId]?.streak_days || 0,
      longest_streak: readingGoals[userId]?.longest_streak || 0,
    });
  } catch (error) {
    logger.error('Error fetching reading stats');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
