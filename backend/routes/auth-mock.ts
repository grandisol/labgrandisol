/**
 * Auth Routes - versão simplificada para Mock Database
 */

import { Router, Request, Response } from 'express';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import Logger from '../utils/logger.js';
import { mockDB } from '../utils/mockDatabase.js';

const router = Router();
const logger = new Logger('AuthRoutes');

/**
 * POST /api/auth/login-mock
 * Login simplificado para testes (sem verificação de senha)
 */
router.post('/login-mock', (req: Request, res: Response): void => {
  try {
    const { email }: { email: string } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    const user = mockDB.getUserByEmail(email);

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info('Login mock bem-sucedido', { email });

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expiresIn: 86400,
    });
  } catch (error) {
    logger.error('Erro ao fazer login', error as Error);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
});

/**
 * POST /api/auth/login
 * Login com validação (funciona com mock data também)
 */
router.post('/login', (req: Request, res: Response): void => {
  try {
    const { email, password }: { email: string; password: string } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios' });
      return;
    }

    // Para testes com mock database, aceitar senhas simples
    const user = mockDB.getUserByEmail(email);

    if (!user) {
      logger.warn('Tentativa de login com usuário não encontrado', { email });
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // MOCK: Aceitar qualquer senha que comece com a primeira letra do nome
    // Em produção, usar bcrypt.compare(password, user.password_hash)
    const isPasswordValid = password === 'admin123' || password === 'user123' || password === 'test123';

    if (!isPasswordValid) {
      logger.warn('Tentativa de login com senha incorreta', { email });
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info('Login bem-sucedido', { email });

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expiresIn: 86400,
    });
  } catch (error) {
    logger.error('Erro ao processar login', error as Error);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
});

/**
 * POST /api/auth/register
 * Registro simplificado
 */
router.post('/register', (req: Request, res: Response): void => {
  try {
    const { email, password, name }: { email: string; password: string; name: string } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
      return;
    }

    const existingUser = mockDB.getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'Usuário já existe' });
      return;
    }

    // Criar novo usuário em mock DB
    const newUser = {
      id: Math.max(...mockDB.users.map(u => u.id), 0) + 1,
      email,
      password_hash: password,
      name,
      role: 'user' as const,
      status: 'active' as const,
      created_at: new Date(),
    };

    mockDB.users.push(newUser);

    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    logger.info('Novo usuário registrado', { email, name });

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      token,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      expiresIn: 86400,
    });
  } catch (error) {
    logger.error('Erro ao registrar usuário', error as Error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

export default router;
