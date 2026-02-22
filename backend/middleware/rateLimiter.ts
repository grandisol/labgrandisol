/**
 * Rate Limiting Middleware
 * Protecção contra brute force e DoS
 */

import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger.js';

const logger = new Logger('RateLimit');

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitRecord>;
  private cleanupInterval: number;
  private intervalId: NodeJS.Timeout | null;

  constructor() {
    this.store = new Map();
    this.cleanupInterval = 60000; // 1 minuto
    this.intervalId = null;
    this.startCleanup();
  }

  /**
   * Cria chave única por IP e endpoint
   */
  // @ts-ignore - Método auxiliar, não usado por enquanto
  private _getKey(_ip: string, _endpoint: string): string {
    return `${_ip}:${_endpoint}`;
  }

  /**
   * Retorna tempo em ms desde época
   */
  private now(): number {
    return Date.now();
  }

  /**
   * Incrementa contador para IP
   */
  public increment(key: string, windowMs: number = 900000): RateLimitRecord {
    const now = this.now();

    if (!this.store.has(key)) {
      this.store.set(key, {
        count: 0,
        resetTime: now + windowMs
      });
    }

    const record = this.store.get(key)!;

    // Se janela expirou, reseta
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    return record;
  }

  /**
   * Limpa registros expirados (a cada 1 minuto)
   */
  private startCleanup(): void {
    this.intervalId = setInterval(() => {
      const now = this.now();
      let cleaned = 0;

      for (const [key, record] of this.store.entries()) {
        if (now > record.resetTime) {
          this.store.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cleaned up ${cleaned} expired rate limit records`);
      }
    }, this.cleanupInterval);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

const limiter = new RateLimiter();

interface RateLimitOptions {
  max?: number;
  windowMs?: number;
  endpoint?: string;
}

/**
 * Middleware para rate limiting
 * Uso: app.use('/api/auth', rateLimit({ max: 5, windowMs: 900000 }))
 */
export function rateLimit(options: RateLimitOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    max = 5, // máximo de requisições
    windowMs = 900000, // 15 minutos
    endpoint = 'api'
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || (req.connection as any).remoteAddress || 'unknown';
    const key = `${ip}:${endpoint}`;
    const record = limiter.increment(key, windowMs);

    // Headers informativos
    res.set('RateLimit-Limit', max.toString());
    res.set('RateLimit-Remaining', Math.max(0, max - record.count).toString());
    res.set('RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

    if (record.count > max) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`, {
        ip,
        endpoint,
        attempts: record.count,
        max
      });

      res.status(429).json({
        error: 'Too many requests. Try again in a few minutes.',
        retryAfter: Math.ceil((record.resetTime - limiter['now']()) / 1000)
      });
      return;
    }

    next();
  };
}

export default rateLimit;
