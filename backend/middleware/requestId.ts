/**
 * Request ID Middleware - LabGrandisol
 * Gera IDs únicos para rastreamento de requisições
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Gera um ID único para a requisição
 */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Middleware que adiciona ID único à requisição
 * Útil para rastreamento e debug
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Verificar se já existe um ID no header
  const existingId = req.headers['x-request-id'] as string;
  
  // Usar ID existente ou gerar novo
  const requestId = existingId || generateRequestId();
  
  // Adicionar ao objeto de requisição
  (req as any).requestId = requestId;
  
  // Adicionar ao header de resposta
  res.setHeader('X-Request-Id', requestId);
  
  next();
}

/**
 * Extrai o request ID de uma requisição
 */
export function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}

export default requestIdMiddleware;