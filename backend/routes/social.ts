/**
 * Social Routes - LabGrandisol
 * Funcionalidades sociais: seguidores, feed, atividades
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import Logger from '../utils/logger.js';

const logger = new Logger('Social');

const router = Router();

// Tipos
interface SocialUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
  followed_at: string;
}

interface Activity {
  id: number;
  type: string;
  user_id: number;
  user_name: string;
  action: string;
  target: string;
  rating?: number;
  created_at: string;
  icon: string;
}

// Mock social data
const socialDB = {
  followers: {
    1: [
      { id: 2, name: 'João Silva', email: 'usuario@library.local', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', followed_at: '2026-01-15T00:00:00Z' },
    ],
    2: [
      { id: 1, name: 'Admin', email: 'admin@library.local', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', followed_at: '2026-01-10T00:00:00Z' },
    ],
  } as Record<number, SocialUser[]>,
  following: {
    1: [
      { id: 2, name: 'João Silva', email: 'usuario@library.local', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', followed_at: '2026-01-10T00:00:00Z' },
    ],
    2: [
      { id: 1, name: 'Admin', email: 'admin@library.local', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', followed_at: '2026-01-15T00:00:00Z' },
    ],
  } as Record<number, SocialUser[]>,
  activity: {
    1: [
      {
        id: 1,
        type: 'review',
        user_id: 1,
        user_name: 'Admin',
        action: 'escreveu uma review para',
        target: '1984',
        rating: 5,
        created_at: '2026-02-20T10:30:00Z',
        icon: '⭐',
      },
      {
        id: 2,
        type: 'achievement',
        user_id: 1,
        user_name: 'Admin',
        action: 'conquistou o badge',
        target: 'Leitor Voraz',
        created_at: '2026-02-18T14:45:00Z',
        icon: '🏆',
      },
      {
        id: 3,
        type: 'collection',
        user_id: 1,
        user_name: 'Admin',
        action: 'criou a coleção',
        target: 'Ficção Científica Favorita',
        created_at: '2026-02-15T09:00:00Z',
        icon: '📚',
      },
    ],
    2: [
      {
        id: 101,
        type: 'shelf',
        user_id: 2,
        user_name: 'João Silva',
        action: 'marcou como lido',
        target: 'O Hobbit',
        created_at: '2026-02-19T16:20:00Z',
        icon: '✅',
      },
    ],
  } as Record<number, Activity[]>,
};

/**
 * GET /api/social/followers
 * Listar seguidores
 */
router.get('/followers', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { limit = 20, offset = 0 } = req.query;

    const followers = socialDB.followers[userId] || [];
    const paginated = followers.slice(Number(offset), Number(offset) + Number(limit));

    logger.info(`Seguidores recuperados para usuário ${userId}`);

    res.status(200).json({
      followers: paginated,
      total: followers.length,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      per_page: Number(limit),
    });
  } catch (error) {
    logger.error('Erro ao recuperar seguidores');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/social/following
 * Listar quem está seguindo
 */
router.get('/following', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { limit = 20, offset = 0 } = req.query;

    const following = socialDB.following[userId] || [];
    const paginated = following.slice(Number(offset), Number(offset) + Number(limit));

    logger.info(`Seguidos recuperados para usuário ${userId}`);

    res.status(200).json({
      following: paginated,
      total: following.length,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      per_page: Number(limit),
    });
  } catch (error) {
    logger.error('Erro ao recuperar seguidos');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/social/follow/:userId
 * Seguir usuário
 */
router.post('/follow/:userId', verifyToken, (req: Request, res: Response): void => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const targetUserId = Number(req.params.userId);

    if (currentUserId === targetUserId) {
      res.status(400).json({ error: 'Não pode seguir a si mesmo' });
      return;
    }

    // Add to following
    if (!socialDB.following[currentUserId]) {
      socialDB.following[currentUserId] = [];
    }
    if (!socialDB.followers[targetUserId]) {
      socialDB.followers[targetUserId] = [];
    }

    const alreadyFollowing = socialDB.following[currentUserId].some(
      (u: SocialUser) => u.id === targetUserId
    );

    if (!alreadyFollowing) {
      socialDB.following[currentUserId].push({
        id: targetUserId,
        name: 'Usuário ' + targetUserId,
        email: `user${targetUserId}@library.local`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${targetUserId}`,
        followed_at: new Date().toISOString(),
      });

      socialDB.followers[targetUserId].push({
        id: currentUserId,
        name: 'Usuário ' + currentUserId,
        email: `user${currentUserId}@library.local`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${currentUserId}`,
        followed_at: new Date().toISOString(),
      });
    }

    logger.info(`Usuário ${currentUserId} passou a seguir ${targetUserId}`);

    res.status(201).json({
      success: true,
      message: `Agora você segue usuário ${targetUserId}`,
      following_count: socialDB.following[currentUserId].length,
    });
  } catch (error) {
    logger.error('Erro ao seguir usuário');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/social/unfollow/:userId
 * Deixar de seguir usuário
 */
router.delete('/unfollow/:userId', verifyToken, (req: Request, res: Response): void => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const targetUserId = Number(req.params.userId);

    // Remove from following
    if (socialDB.following[currentUserId]) {
      socialDB.following[currentUserId] = socialDB.following[currentUserId].filter(
        (u: SocialUser) => u.id !== targetUserId
      );
    }

    // Remove from followers of target
    if (socialDB.followers[targetUserId]) {
      socialDB.followers[targetUserId] = socialDB.followers[targetUserId].filter(
        (u: SocialUser) => u.id !== currentUserId
      );
    }

    logger.info(`Usuário ${currentUserId} deixou de seguir ${targetUserId}`);

    res.status(200).json({
      success: true,
      message: `Você deixou de seguir usuário ${targetUserId}`,
      following_count: socialDB.following[currentUserId]?.length || 0,
    });
  } catch (error) {
    logger.error('Erro ao deixar de seguir usuário');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/social/feed
 * Feed de atividade social
 */
router.get('/feed', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { limit = 10, offset = 0, filter } = req.query;

    const following = socialDB.following[userId] || [];
    const followingIds = following.map((f: SocialUser) => f.id);

    // Collect activity from followed users
    let feed: Activity[] = [];
    followingIds.forEach((followedId: number) => {
      const userActivity = socialDB.activity[followedId] || [];
      feed.push(...userActivity);
    });

    // Also add own activity
    const ownActivity = socialDB.activity[userId] || [];
    feed.push(...ownActivity);

    // Sort by date
    feed.sort(
      (a: Activity, b: Activity) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Filter if provided
    if (filter) {
      feed = feed.filter((item: Activity) => item.type === filter);
    }

    // Paginate
    const paginated = feed.slice(Number(offset), Number(offset) + Number(limit));

    logger.info(`Feed social recuperado para usuário ${userId}`);

    res.status(200).json({
      feed: paginated.map((item: Activity) => ({
        ...item,
        actor_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`,
      })),
      total: feed.length,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      per_page: Number(limit),
    });
  } catch (error) {
    logger.error('Erro ao recuperar feed social');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/social/feed/trending
 * Atividades em tendência
 */
router.get('/feed/trending', verifyToken, (_req: Request, res: Response): void => {
  try {
    // Get all activities and sort by type frequency + recency
    const allActivities: Activity[] = [];
    Object.values(socialDB.activity).forEach((activities: Activity[]) => {
      allActivities.push(...activities);
    });

    const trending = allActivities
      .sort(
        (a: Activity, b: Activity) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10);

    logger.info('Atividades em tendência recuperadas');

    res.status(200).json({
      trending_activities: trending.map((item: Activity) => ({
        ...item,
        engagement_score: Math.floor(Math.random() * 100),
      })),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erro ao recuperar atividades em tendência');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/social/stats
 * Estatísticas sociais do usuário
 */
router.get('/stats', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const followers = socialDB.followers[userId] || [];
    const following = socialDB.following[userId] || [];
    const activity = socialDB.activity[userId] || [];

    logger.info(`Estatísticas sociais recuperadas para usuário ${userId}`);

    res.status(200).json({
      followers_count: followers.length,
      following_count: following.length,
      posts_count: activity.length,
      engagement_score: 85,
      monthly_views: 245,
      monthly_interactions: 42,
      trending_badge: Math.random() > 0.5 ? '🔥' : null,
    });
  } catch (error) {
    logger.error('Erro ao recuperar estatísticas sociais');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;