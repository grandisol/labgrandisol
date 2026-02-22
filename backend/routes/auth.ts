import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { query as dbQuery, QueryResult } from '../utils/database.js';
import Logger from '../utils/logger.js';
import { authValidators } from '../middleware/validators.js';
import rateLimit from '../middleware/rateLimiter.js';
import { User, LoginRequest, AuthPayload } from '../types/index.js';

const logger = new Logger('AuthRoutes');
const router: Router = express.Router();

// Rate limiting para login (5 tentativas a cada 15 minutos)
const loginLimiter = rateLimit({ max: 5, windowMs: 900000, endpoint: 'auth/login' });

/**
 * POST /api/auth/login
 * Autentica usuário com email e senha
 */
router.post('/login', loginLimiter, authValidators.login, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;
    // @ts-ignore - IP coletado para logging de segurança
    const _ip: string = (req.ip || req.socket.remoteAddress) as string;

    logger.logAuth('LOGIN_ATTEMPT', email);

    // Busca usuário no banco
    const result: QueryResult = await dbQuery(
      'SELECT id, email, password_hash, name, role, status FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      logger.logAuth('LOGIN_FAILED_USER_NOT_FOUND', email);
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const user = result.rows[0] as User;

    // Verifica se usuário está ativo
    if (user.status !== 'active') {
      logger.warn(`Login tentado em usuário inativo: ${email}`, { status: user.status });
      res.status(403).json({ error: 'Conta desativada. Contate administrador.' });
      return;
    }

    // Compara senha com hash
    const isPasswordValid: boolean = await bcrypt.compare(password, user.password_hash || '');

    if (!isPasswordValid) {
      logger.logAuth('LOGIN_FAILED_WRONG_PASSWORD', email);
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // Gera tokens
    const token: string = generateToken(user);
    const refreshToken: string = generateRefreshToken(user);

    // Registra login bem-sucedido
    logger.logAuth('LOGIN_SUCCESS', email);

    res.status(200).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expiresIn: 86400, // 24 horas
    });
  } catch (err) {
    logger.error('Erro ao processar login', err as Error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/auth/register
 * Registra novo usuário
 */
router.post('/register', authValidators.register, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    // @ts-ignore - IP coletado para logging de segurança
    const _ip: string = (req.ip || req.socket.remoteAddress) as string;

    logger.logAuth('REGISTER_ATTEMPT', email);

    // Verifica se email já existe
    const existsResult: QueryResult = await dbQuery('SELECT id FROM users WHERE email = $1', [email]);

    if (existsResult.rows.length > 0) {
      logger.warn(`Tentativa de registro com email duplicado: ${email}`);
      res.status(409).json({ error: 'Email já registrado' });
      return;
    }

    // Hash da senha
    const saltRounds: number = 10;
    const passwordHash: string = await bcrypt.hash(password, saltRounds);

    // Insere novo usuário
    const insertResult: QueryResult = await dbQuery(
      'INSERT INTO users (email, password_hash, name, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
      [email, passwordHash, name, 'user', 'active']
    );

    const newUser = insertResult.rows[0] as User;

    // Gera tokens
    const token: string = generateToken(newUser);
    const refreshToken: string = generateRefreshToken(newUser);

    logger.logAuth('REGISTER_SUCCESS', email);

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      message: 'Usuário registrado com sucesso',
    });
  } catch (err) {
    logger.error('Erro ao registrar usuário', err as Error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/auth/refresh
 * Gera novo access token usando refresh token
 */
router.post('/refresh', authValidators.refresh, async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    logger.debug('Token refresh attempt');

    const JWT_SECRET: string = process.env.JWT_SECRET || 'sua_chave_super_secreta_aqui_mudeme_em_producao';

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET + '_refresh') as AuthPayload;

      // Busca usuário
      const result: QueryResult = await dbQuery(
        'SELECT id, email, name, role FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: 'Usuário não encontrado' });
        return;
      }

      const user = result.rows[0] as User;
      const newToken: string = generateToken(user);
      const newRefreshToken: string = generateRefreshToken(user);

      logger.logAuth('TOKEN_REFRESHED', user.email);

      res.json({
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 86400,
      });
    } catch (err) {
      logger.warn('Refresh token inválido ou expirado');
      res.status(401).json({ error: 'Token de refresh inválido' });
    }
  } catch (err) {
    logger.error('Erro ao fazer refresh de token', err as Error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (opcional - para implementação de token blacklist)
 */
router.post('/logout', (req: Request, res: Response): void => {
  const email: string = req.user?.email || 'desconhecido';
  logger.logAuth('LOGOUT', email);

  res.json({
    message: 'Logout realizado com sucesso',
  });
});

export default router;
