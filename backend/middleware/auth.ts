import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger.js';
import { AuthPayload } from '../types/index.js';

const logger = new Logger('Auth');

// JWT Secret - em produção, usar variável de ambiente segura
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_super_secreta_aqui_mudeme_em_producao';
const JWT_REFRESH_SECRET = JWT_SECRET + '_refresh';

// Declarar o tipo user no Request
declare module 'express' {
  interface Request {
    user?: AuthPayload;
  }
}

/**
 * Middleware para verificar token JWT
 * Valida formato, assinatura e expiração
 */
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  // Verificar se header existe e tem formato correto
  if (!authHeader?.startsWith('Bearer ')) {
    logger.warn('Tentativa de acesso sem token', { 
      path: req.path, 
      ip: req.ip 
    });
    res.status(401).json({ error: 'Token não fornecido', code: 'NO_TOKEN' });
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verificar se token não está vazio
  if (!token || token.trim() === '') {
    logger.warn('Token vazio fornecido', { path: req.path });
    res.status(401).json({ error: 'Token inválido', code: 'EMPTY_TOKEN' });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    
    // Verificar campos obrigatórios no payload
    if (!decoded.id || !decoded.email) {
      logger.warn('Token com payload incompleto', { decoded });
      res.status(401).json({ error: 'Token malformado', code: 'MALFORMED_TOKEN' });
      return;
    }
    
    req.user = decoded;
    logger.debug('Token válido', { userId: decoded.id, email: decoded.email });
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expirado', { expiredAt: error.expiredAt });
      res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Token inválido', { message: error.message });
      res.status(401).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
      return;
    }
    
    logger.error('Erro ao verificar token', error as Error);
    res.status(500).json({ error: 'Erro interno de autenticação', code: 'AUTH_ERROR' });
  }
}

/**
 * Middleware para verificar se usuário é admin
 * Deve ser usado após verifyToken
 */
export function verifyAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    logger.warn('verifyAdmin chamado sem usuário autenticado');
    res.status(401).json({ error: 'Não autenticado', code: 'NOT_AUTHENTICATED' });
    return;
  }
  
  if (req.user.role !== 'admin') {
    logger.warn('Tentativa de acesso admin por não-admin', { 
      userId: req.user.id, 
      role: req.user.role 
    });
    res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários.', code: 'FORBIDDEN' });
    return;
  }
  
  logger.debug('Acesso admin autorizado', { userId: req.user.id });
  next();
}

/**
 * Middleware opcional - verifica token se presente, mas não bloqueia
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    // Ignora erro em auth opcional
  }
  
  next();
}

/**
 * Gera token JWT de acesso (24h)
 */
export const generateToken = (user: { id: number; email: string; name: string; role: string }): string => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h',
    issuer: 'labgrandisol',
    audience: 'labgrandisol-users'
  });
};

/**
 * Gera token de refresh (7 dias)
 */
export const generateRefreshToken = (user: { id: number; email: string }): string => {
  const payload = {
    id: user.id,
    email: user.email,
    type: 'refresh'
  };
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, { 
    expiresIn: '7d',
    issuer: 'labgrandisol',
    audience: 'labgrandisol-refresh'
  });
};

/**
 * Verifica refresh token
 */
export const verifyRefreshToken = (token: string): { id: number; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return {
      id: decoded.id,
      email: decoded.email
    };
  } catch {
    return null;
  }
};

// Alias para compatibilidade
export const verifyAuth = verifyToken;