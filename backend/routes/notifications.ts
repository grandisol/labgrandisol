/**
 * Notifications Routes - LabGrandisol
 * Sistema de notificações do usuário
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import Logger from '../utils/logger.js';

const logger = new Logger('Notifications');

const router = Router();

// Tipo para notificação
interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
  icon: string;
}

// Mock notification data
const notificationsDB: Record<number, Notification[]> = {
  1: [
    {
      id: 1,
      type: 'achievement',
      title: 'Nova Conquista 🏆',
      message: 'Você conquistou o badge "Leitor Voraz"',
      read: false,
      action_url: '/achievements',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      icon: '📚',
    },
    {
      id: 2,
      type: 'recommendation',
      title: 'Nova Recomendação 🎯',
      message: 'Temos uma recomendação especial para você: "Duna"',
      read: false,
      action_url: '/recommendations',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      icon: '💡',
    },
    {
      id: 3,
      type: 'social',
      title: 'Novo Seguidor 👥',
      message: 'usuario@library.local começou a seguir você',
      read: true,
      action_url: '/followers',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      icon: '👤',
    },
    {
      id: 4,
      type: 'update',
      title: 'Atualização de Plano 💎',
      message: 'Seu upgrade para Pro foi confirmado',
      read: true,
      action_url: '/subscription',
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      icon: '⭐',
    },
  ],
  2: [
    {
      id: 101,
      type: 'update',
      title: 'Bem-vindo! 👋',
      message: 'Bem-vindo ao LabGrandisol. Comece adicionando seus primeiros livros.',
      read: false,
      action_url: '/library',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      icon: '📖',
    },
    {
      id: 102,
      type: 'achievement',
      title: 'Primeiro Livro! 📚',
      message: 'Você adicionou seu primeiro livro à lista de leitura.',
      read: false,
      action_url: '/reading-list',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      icon: '🎉',
    },
    {
      id: 103,
      type: 'loan',
      title: 'Livro Emprestada 📖',
      message: 'O livro "1984" foi emprestado com sucesso.',
      read: true,
      action_url: '/my-loans',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      icon: '📕',
    },
  ],
  3: [
    {
      id: 201,
      type: 'update',
      title: 'Bem-vindo! 👋',
      message: 'Bem-vindo ao LabGrandisol. Explore nosso acervo de livros.',
      read: false,
      action_url: '/library',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      icon: '📖',
    },
    {
      id: 202,
      type: 'social',
      title: 'Novo Seguidor 👥',
      message: 'João Silva começou a seguir você',
      read: false,
      action_url: '/social',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      icon: '👤',
    },
  ],
};

/**
 * GET /api/notifications
 * Listar todas as notificações do usuário
 */
router.get('/', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { unread_only, type, limit = 20, offset = 0 } = req.query;

    let notifications = notificationsDB[userId] || [];

    // Filter by read status
    if (unread_only === 'true') {
      notifications = notifications.filter((n: Notification) => !n.read);
    }

    // Filter by type
    if (type && typeof type === 'string') {
      notifications = notifications.filter((n: Notification) => n.type === type);
    }

    // Sort by date desc
    notifications.sort(
      (a: Notification, b: Notification) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Pagination
    const paginatedNotifications = notifications.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );

    logger.info(`Notificações recuperadas para usuário ${userId}`);

    res.status(200).json({
      notifications: paginatedNotifications,
      total: notifications.length,
      unread_count: notifications.filter((n: Notification) => !n.read).length,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      per_page: Number(limit),
    });
  } catch (error) {
    logger.error('Erro ao recuperar notificações');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/notifications/:id
 * Obter notificação específica
 */
router.get('/:id', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { id } = req.params;

    const notifications = notificationsDB[userId] || [];
    const notification = notifications.find((n: Notification) => n.id === Number(id));

    if (!notification) {
      res.status(404).json({ error: 'Notificação não encontrada' });
      return;
    }

    logger.info(`Notificação ${id} recuperada para usuário ${userId}`);

    res.status(200).json({ notification });
  } catch (error) {
    logger.error('Erro ao recuperar notificação');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marcar notificação como lida
 */
router.put('/:id/read', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { id } = req.params;

    const notifications = notificationsDB[userId] || [];
    const notification = notifications.find((n: Notification) => n.id === Number(id));

    if (!notification) {
      res.status(404).json({ error: 'Notificação não encontrada' });
      return;
    }

    notification.read = true;

    logger.info(`Notificação ${id} marcada como lida para usuário ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Notificação marcada como lida',
      notification,
    });
  } catch (error) {
    logger.error('Erro ao marcar notificação como lida');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/notifications/mark-all/read
 * Marcar todas as notificações como lidas
 */
router.put('/mark-all/read', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const notifications = notificationsDB[userId] || [];
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;

    notifications.forEach((n: Notification) => (n.read = true));

    logger.info(`${unreadCount} notificações marcadas como lidas para usuário ${userId}`);

    res.status(200).json({
      success: true,
      message: `${unreadCount} notificações marcadas como lidas`,
      notifications_updated: unreadCount,
    });
  } catch (error) {
    logger.error('Erro ao marcar notificações como lidas');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Deletar notificação
 */
router.delete('/:id', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { id } = req.params;

    if (!notificationsDB[userId]) {
      res.status(404).json({ error: 'Notificação não encontrada' });
      return;
    }

    const index = notificationsDB[userId].findIndex((n: Notification) => n.id === Number(id));
    if (index === -1) {
      res.status(404).json({ error: 'Notificação não encontrada' });
      return;
    }

    const deleted = notificationsDB[userId].splice(index, 1)[0];

    logger.info(`Notificação ${id} deletada para usuário ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Notificação deletada',
      notification: deleted,
    });
  } catch (error) {
    logger.error('Erro ao deletar notificação');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/notifications/delete-old/all
 * Deletar notificações antigas (>30 dias)
 */
router.delete('/delete-old/all', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const notifications = notificationsDB[userId] || [];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const before = notifications.length;

    notificationsDB[userId] = notifications.filter(
      (n: Notification) => new Date(n.created_at) > thirtyDaysAgo
    );

    const deleted = before - notificationsDB[userId].length;

    logger.info(`${deleted} notificações antigas deletadas para usuário ${userId}`);

    res.status(200).json({
      success: true,
      message: `${deleted} notificações antigas deletadas`,
      notifications_deleted: deleted,
    });
  } catch (error) {
    logger.error('Erro ao deletar notificações antigas');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;