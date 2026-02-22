import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import Logger from '../utils/logger.js';

const logger = new Logger('Social');

const router = Router();

// Mock social data
const socialDB = {
  followers: {
    1: [
      { id: 2, name: 'João Silva', email: 'usuario@library.local', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', followed_at: '2026-01-15T00:00:00Z' },
    ],
    2: [
      { id: 1, name: 'Admin', email: 'admin@library.local', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', followed_at: '2026-01-10T00:00:00Z' },
    ],
  },
  following: {
    1: [
      { id: 2, name: 'João Silva', email: 'usuario@library.local', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', followed_at: '2026-01-10T00:00:00Z' },
    ],
    2: [
      { id: 1, name: 'Admin', email: 'admin@library.local', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', followed_at: '2026-01-15T00:00:00Z' },
    ],
  },
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
  },
};

/**
 * GET /api/social/followers
 * Listar seguidores
 */
router.get('/followers', verifyToken, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 20, offset = 0 } = req.query;

    const followers = (socialDB.followers as any)[userId] || [];
    const paginated = followers.slice(Number(offset), Number(offset) + Number(limit));

    logger.info(
      `Seguidores recuperados para usuário ${userId}`
    );

    return res.status(200).json({
      followers: paginated,
      total: followers.length,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      per_page: Number(limit),
    });
  } catch (error) {
    logger.error('Erro ao recuperar seguidores');
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/social/following
 * Listar quem está seguindo
 */
router.get('/following', verifyToken, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 20, offset = 0 } = req.query;

    const following = (socialDB.following as any)[userId] || [];
    const paginated = following.slice(Number(offset), Number(offset) + Number(limit));

    logger.info(
      `Seguidos recuperados para usuário ${userId}`
    );

    return res.status(200).json({
      following: paginated,
      total: following.length,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      per_page: Number(limit),
    });
  } catch (error) {
    logger.error('Erro ao recuperar seguidos');
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/social/follow/:userId
 * Seguir usuário
 */
router.post('/follow/:userId', verifyToken, (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const targetUserId = Number(req.params.userId);

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Não pode seguir a si mesmo' });
    }

    // Add to following
    if (!(socialDB.following as any)[currentUserId]) {
      (socialDB.following as any)[currentUserId] = [];
    }
    if (!(socialDB.followers as any)[targetUserId]) {
      (socialDB.followers as any)[targetUserId] = [];
    }

    const alreadyFollowing = (socialDB.following as any)[currentUserId].some(
      (u: any) => u.id === targetUserId
    );

    if (!alreadyFollowing) {
      (socialDB.following as any)[currentUserId].push({
        id: targetUserId,
        name: 'Usuário ' + targetUserId,
        email: `user${targetUserId}@library.local`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${targetUserId}`,
        followed_at: new Date().toISOString(),
      });

      (socialDB.followers as any)[targetUserId].push({
        id: currentUserId,
        name: 'Usuário ' + currentUserId,
        email: `user${currentUserId}@library.local`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${currentUserId}`,
        followed_at: new Date().toISOString(),
      });
    }

    logger.info(
      `Usuário ${currentUserId} passou a seguir ${targetUserId}`
    );

    return res.status(201).json({
      success: true,
      message: `Agora você segue usuário ${targetUserId}`,
      following_count: (socialDB.following as any)[currentUserId].length,
    });
  } catch (error) {
    logger.error('Erro ao seguir usuário');
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/social/unfollow/:userId
 * Deixar de seguir usuário
 */
router.delete('/unfollow/:userId', verifyToken, (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).userId;
    const targetUserId = Number(req.params.userId);

    // Remove from following
    if ((socialDB.following as any)[currentUserId]) {
      (socialDB.following as any)[currentUserId] = (socialDB.following as any)[
        currentUserId
      ].filter((u: any) => u.id !== targetUserId);
    }

    // Remove from followers of target
    if ((socialDB.followers as any)[targetUserId]) {
      (socialDB.followers as any)[targetUserId] = (socialDB.followers as any)[
        targetUserId
      ].filter((u: any) => u.id !== currentUserId);
    }

    logger.info(
      `Usuário ${currentUserId} deixou de seguir ${targetUserId}`
    );

    return res.status(200).json({
      success: true,
      message: `Você deixou de seguir usuário ${targetUserId}`,
      following_count: (socialDB.following as any)[currentUserId]?.length || 0,
    });
  } catch (error) {
    logger.error('Erro ao deixar de seguir usuário');
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/social/feed
 * Feed de atividade social
 */
router.get('/feed', verifyToken, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 10, offset = 0, filter } = req.query;

    const following = (socialDB.following as any)[userId] || [];
    const followingIds = following.map((f: any) => f.id);

    // Collect activity from followed users
    let feed: any[] = [];
    followingIds.forEach((followedId: number) => {
      const userActivity = (socialDB.activity as any)[followedId] || [];
      feed.push(...userActivity);
    });

    // Also add own activity
    const ownActivity = (socialDB.activity as any)[userId] || [];
    feed.push(...ownActivity);

    // Sort by date
    feed.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Filter if provided
    if (filter) {
      feed = feed.filter((item) => item.type === filter);
    }

    // Paginate
    const paginated = feed.slice(Number(offset), Number(offset) + Number(limit));

    logger.info(`Feed social recuperado para usuário ${userId}`);

    return res.status(200).json({
      feed: paginated.map((item) => ({
        ...item,
        actor_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`,
      })),
      total: feed.length,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      per_page: Number(limit),
    });
  } catch (error) {
    logger.error('Erro ao recuperar feed social');
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/social/feed/trending
 * Atividades em tendência
 */
router.get('/feed/trending', verifyToken, (_req: Request, res: Response) => {
  try {
    // Get all activities and sort by type frequency + recency
    const allActivities: any[] = [];
    Object.values(socialDB.activity).forEach((activities: any) => {
      allActivities.push(...activities);
    });

    const trending = allActivities
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10);

    logger.info('Atividades em tendência recuperadas');

    return res.status(200).json({
      trending_activities: trending.map((item) => ({
        ...item,
        engagement_score: Math.floor(Math.random() * 100),
      })),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erro ao recuperar atividades em tendência');
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/social/stats
 * Estatísticas sociais do usuário
 */
router.get('/stats', verifyToken, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const followers = (socialDB.followers as any)[userId] || [];
    const following = (socialDB.following as any)[userId] || [];
    const activity = (socialDB.activity as any)[userId] || [];

    logger.info(
      `Estatísticas sociais recuperadas para usuário ${userId}`
    );

    return res.status(200).json({
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
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
