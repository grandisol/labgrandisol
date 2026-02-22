import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger.js';
import { AuthPayload, User } from '../types/index.js';

const logger = new Logger('Auth');

const JWT_SECRET: string = process.env.JWT_SECRET || 'sua_chave_super_secreta_aqui_mudeme_em_producao';
const JWT_EXPIRY: string = process.env.JWT_EXPIRY || '24h';
const REFRESH_TOKEN_EXPIRY: string = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Validação: se estiver em produção, JWT_SECRET não pode ser o padrão
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'sua_chave_super_secreta_aqui_mudeme_em_producao') {
  logger.critical('JWT_SECRET não foi configurado em produção!');
  process.exit(1);
}

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
 * Verifica validade do token JWT
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes: string[] = ['/api/health', '/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

  if (publicRoutes.some((route) => req.path.startsWith(route))) {
    next();
    return;
  }

  const authHeader: string | undefined = req.headers.authorization;

  if (!authHeader) {
    logger.warn(`Requisição sem token para: ${req.path}`, {
      ip: req.ip,
      path: req.path,
    });
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const parts: string[] = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn('Formato de Authorization header inválido', {
      path: req.path,
    });
    res.status(401).json({ error: 'Formato de token inválido' });
    return;
  }

  const token: string = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    logger.debug(`Token verificado para: ${decoded.email}`);
    next();
  } catch (err) {
    logger.warn('Erro ao verificar token', { error: (err as Error).message });
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

/**
 * Verifica se usuário tem role de admin
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
export function verifyAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  if (req.user.role !== 'admin') {
    logger.logAccess(req.user.email, 'admin_resource', false, {
      userRole: req.user.role,
    });
    res.status(403).json({
      error: 'Acesso negado',
      required: 'admin',
      userRole: req.user.role,
    });
    return;
  }

  logger.logAccess(req.user.email, 'admin_resource', true);
  next();
}

/**
 * Verifica role específico
 * @param allowedRoles - Array de roles permitidos
 * @returns Middleware function
 */
export function verifyRole(allowedRoles: string[] = []): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.logAccess(req.user.email, `role_${allowedRoles.join('|')}`, false);
      res.status(403).json({
        error: 'Acesso negado',
        required: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Gera JWT access token
 * @param user - Objeto do usuário
 * @returns Token JWT
 * @throws Erro ao gerar token
 */
export function generateToken(user: Partial<User>): string {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token: string = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as any);

    return token;
  } catch (err) {
    logger.error('Erro ao gerar token', err as Error);
    throw err;
  }
}

/**
 * Gera refresh token
 * @param user - Objeto do usuário
 * @returns Refresh token JWT
 * @throws Erro ao gerar refresh token
 */
export function generateRefreshToken(user: Partial<User>): string {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      type: 'refresh',
    };

    const token: string = jwt.sign(payload, JWT_SECRET + '_refresh', { expiresIn: REFRESH_TOKEN_EXPIRY } as any);

    return token;
  } catch (err) {
    logger.error('Erro ao gerar refresh token', err as Error);
    throw err;
  }
}

// Alias for compatibility
export const verifyAuth = verifyToken;
