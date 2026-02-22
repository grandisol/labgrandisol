import { Router, Request, Response } from 'express';
import Logger from '../utils/logger.js';
import { query as dbQuery, QueryResult } from '../utils/database.js';
import { apiValidators, validateQueryParams } from '../middleware/validators.js';
import { AuthPayload, Note } from '../types/index.js';

const logger = new Logger('APIRoutes');
const router = Router();

/**
 * Estende o tipo Request para incluir o user
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * GET /api/profile
 * Retorna perfil do usuário autenticado
 */
router.get('/profile', validateQueryParams, (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    logger.logAccess(req.user.email, '/api/profile', true);

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Erro ao buscar perfil', err as Error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/status
 * Retorna status do usuário e sistema
 */
router.get('/status', (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    logger.debug(`Status check para: ${req.user.email}`);

    res.json({
      status: 'online',
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        authenticatedAt: new Date().toISOString(),
      },
      server: {
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error('Erro ao buscar status', err as Error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

/**
 * GET /api/notes
 * Busca notas do usuário (com paginação)
 */
router.get('/notes', validateQueryParams, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { limit = 10, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(String(limit)) || 10, 100);
    const parsedOffset = parseInt(String(offset)) || 0;

    logger.debug(`Buscando notas para ${req.user.email}`, { limit: parsedLimit, offset: parsedOffset });

    // Em desenvolvimento, retornar dados mock
    if (process.env.NODE_ENV === 'development') {
      const mockNotes = [
        {
          id: 1,
          title: 'Primeira nota de teste',
          content: 'Este é um exemplo de nota criada no sistema',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Anotações de estudo',
          content: 'Coleção de anotações sobre desenvolvimento de software',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      const total = mockNotes.length;
      const notes = mockNotes.slice(parsedOffset, parsedOffset + parsedLimit);

      res.json({
        notes,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          total,
          hasMore: parsedOffset + parsedLimit < total,
        },
      });
      return;
    }

    // Busca total de notas
    const countResult: QueryResult = await dbQuery('SELECT COUNT(*) as count FROM notes WHERE user_id = $1', [
      req.user.id,
    ]);

    const total = parseInt((countResult.rows[0] as any).count);

    // Busca notas paginadas
    const result: QueryResult = await dbQuery(
      'SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, parsedLimit, parsedOffset]
    );

    res.json({
      notes: result.rows,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total,
        hasMore: parsedOffset + parsedLimit < total,
      },
    });
  } catch (err) {
    logger.error('Erro ao buscar notas', err as Error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

/**
 * POST /api/notes
 * Cria nova nota
 */
router.post('/notes', apiValidators.createNote, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { title, content } = req.body as { title: string; content: string };

    logger.info(`Criando nota para ${req.user.email}`, { title: title.substring(0, 50) });

    const result: QueryResult = await dbQuery(
      'INSERT INTO notes (user_id, title, content, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, title, content, created_at, updated_at',
      [req.user.id, title, content]
    );

    const note = result.rows[0] as Note;

    res.status(201).json({
      message: 'Nota criada com sucesso',
      note,
    });
  } catch (err) {
    logger.error('Erro ao criar nota', err as Error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

/**
 * PUT /api/notes/:id
 * Atualiza nota existente
 */
router.put('/notes/:id', apiValidators.updateNote, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { id } = req.params;
    const { title, content } = req.body as { title?: string; content?: string };
    const noteId = parseInt(id);

    logger.info(`Atualizando nota ${noteId} para ${req.user.email}`);

    // Verifica se nota pertence ao usuário
    const checkResult: QueryResult = await dbQuery('SELECT id FROM notes WHERE id = $1 AND user_id = $2', [
      noteId,
      req.user.id,
    ]);

    if (checkResult.rows.length === 0) {
      logger.warn(`Tentativa de atualizar nota inexistente ou não autorizada`, {
        noteId,
        email: req.user.email,
      });
      res.status(404).json({ error: 'Nota não encontrada' });
      return;
    }

    // Atualiza nota
    const result: QueryResult = await dbQuery(
      'UPDATE notes SET title = COALESCE($1, title), content = COALESCE($2, content), updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING id, title, content, created_at, updated_at',
      [title || null, content || null, noteId, req.user.id]
    );

    res.json({
      message: 'Nota atualizada com sucesso',
      note: result.rows[0] as Note,
    });
  } catch (err) {
    logger.error('Erro ao atualizar nota', err as Error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

/**
 * DELETE /api/notes/:id
 * Deleta nota
 */
router.delete('/notes/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { id } = req.params;
    const noteId = parseInt(id);

    logger.info(`Deletando nota ${noteId} para ${req.user.email}`);

    const result: QueryResult = await dbQuery('DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id', [
      noteId,
      req.user.id,
    ]);

    if (result.rows.length === 0) {
      logger.warn(`Tentativa de deletar nota inexistente`, {
        noteId,
        email: req.user.email,
      });
      res.status(404).json({ error: 'Nota não encontrada' });
      return;
    }

    res.json({
      message: 'Nota deletada com sucesso',
      id: noteId,
    });
  } catch (err) {
    logger.error('Erro ao deletar nota', err as Error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

export default router;
