/**
 * Advanced Rate Limiter - LabGrandisol
 * Sistema avançado de limitação de taxa com múltiplas estratégias
 */

import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger.js';

const logger = new Logger('RateLimiter');

// ==================== TIPOS ====================

interface RateLimitConfig {
  max: number;
  windowMs: number;
  strategy: 'fixed' | 'sliding' | 'token_bucket';
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request, res: Response) => void;
  onLimitReached?: (req: Request) => void;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
  tokens?: number;
  lastRefill?: number;
}

interface IPRule {
  type: 'whitelist' | 'blacklist';
  reason?: string;
  expiresAt?: number;
}

interface UserLimits {
  daily: number;
  hourly: number;
  perMinute: number;
}

// ==================== CONFIGURAÇÕES POR ENDPOINT ====================

const ENDPOINT_LIMITS: Record<string, UserLimits> = {
  '/api/auth/login': { daily: 20, hourly: 10, perMinute: 3 },
  '/api/auth/register': { daily: 5, hourly: 3, perMinute: 1 },
  '/api/auth/refresh': { daily: 100, hourly: 30, perMinute: 10 },
  '/api/library': { daily: 10000, hourly: 1000, perMinute: 100 },
  '/api/search': { daily: 5000, hourly: 500, perMinute: 50 },
  '/api/admin': { daily: 50000, hourly: 5000, perMinute: 500 },
  'default': { daily: 10000, hourly: 1000, perMinute: 100 }
};

// ==================== ARMAZENAMENTO ====================

class RateLimitStore {
  private records: Map<string, RateLimitRecord> = new Map();
  private ipRules: Map<string, IPRule> = new Map();
  private suspiciousIPs: Map<string, number> = new Map(); // IP -> violation count
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
    this.loadIPRules();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      // Limpar registros expirados
      for (const [key, record] of this.records.entries()) {
        if (now > record.resetTime) {
          this.records.delete(key);
          cleaned++;
        }
      }

      // Limpar IPs suspeitos antigos
      for (const [ip, _] of this.suspiciousIPs.entries()) {
        // Reset após 24 horas
        this.suspiciousIPs.delete(ip);
      }

      // Limpar regras de IP expiradas
      for (const [ip, rule] of this.ipRules.entries()) {
        if (rule.expiresAt && now > rule.expiresAt) {
          this.ipRules.delete(ip);
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cleaned ${cleaned} rate limit records`);
      }
    }, 60000);
  }

  private loadIPRules(): void {
    // IPs de whitelist (localhost, etc)
    this.ipRules.set('127.0.0.1', { type: 'whitelist', reason: 'localhost' });
    this.ipRules.set('::1', { type: 'whitelist', reason: 'localhost' });
    this.ipRules.set('::ffff:127.0.0.1', { type: 'whitelist', reason: 'localhost' });
  }

  // Operações de registro
  get(key: string): RateLimitRecord | undefined {
    return this.records.get(key);
  }

  set(key: string, record: RateLimitRecord): void {
    this.records.set(key, record);
  }

  increment(key: string, windowMs: number): RateLimitRecord {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }

    record.count++;
    this.records.set(key, record);
    return record;
  }

  // Token bucket
  refillTokens(key: string, maxTokens: number, refillRate: number): number {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record) {
      record = { 
        count: 0, 
        resetTime: now + 60000, 
        tokens: maxTokens, 
        lastRefill: now 
      };
    }

    const timePassed = now - (record.lastRefill || now);
    const tokensToAdd = Math.floor(timePassed / refillRate);
    
    if (tokensToAdd > 0) {
      record.tokens = Math.min(maxTokens, (record.tokens || 0) + tokensToAdd);
      record.lastRefill = now;
    }

    this.records.set(key, record);
    return record.tokens || 0;
  }

  consumeToken(key: string): boolean {
    const record = this.records.get(key);
    if (!record || !record.tokens) return false;

    if (record.tokens > 0) {
      record.tokens--;
      this.records.set(key, record);
      return true;
    }
    return false;
  }

  // Sliding window
  getSlidingCount(key: string, windowMs: number): number {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now > record.resetTime) {
      return 0;
    }

    // Calcular peso baseado na posição na janela
    const windowStart = record.resetTime - windowMs;
    const positionInWindow = now - windowStart;
    const weight = positionInWindow / windowMs;

    return Math.ceil(record.count * weight);
  }

  // Regras de IP
  getIPRule(ip: string): IPRule | undefined {
    return this.ipRules.get(ip);
  }

  addIPRule(ip: string, rule: IPRule): void {
    this.ipRules.set(ip, rule);
    logger.info(`IP rule added: ${ip} - ${rule.type}`, { reason: rule.reason });
  }

  removeIPRule(ip: string): boolean {
    return this.ipRules.delete(ip);
  }

  isWhitelisted(ip: string): boolean {
    const rule = this.ipRules.get(ip);
    return rule?.type === 'whitelist';
  }

  isBlacklisted(ip: string): boolean {
    const rule = this.ipRules.get(ip);
    return rule?.type === 'blacklist';
  }

  // IPs suspeitos
  markSuspicious(ip: string): void {
    const count = (this.suspiciousIPs.get(ip) || 0) + 1;
    this.suspiciousIPs.set(ip, count);

    if (count >= 5) {
      // Auto-ban após 5 violações
      this.addIPRule(ip, {
        type: 'blacklist',
        reason: 'Multiple rate limit violations',
        expiresAt: Date.now() + 3600000 // 1 hora
      });
      logger.warn(`IP auto-banned: ${ip}`, { violations: count });
    }
  }

  getSuspicionLevel(ip: string): number {
    return this.suspiciousIPs.get(ip) || 0;
  }

  // Estatísticas
  getStats(): {
    totalRecords: number;
    blacklistedIPs: number;
    suspiciousIPs: number;
  } {
    let blacklisted = 0;
    for (const [_, rule] of this.ipRules.entries()) {
      if (rule.type === 'blacklist') blacklisted++;
    }

    return {
      totalRecords: this.records.size,
      blacklistedIPs: blacklisted,
      suspiciousIPs: this.suspiciousIPs.size
    };
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Instância global do store
const store = new RateLimitStore();

// ==================== FUNÇÕES AUXILIARES ====================

function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function getEndpoint(path: string): string {
  // Normalizar endpoint para matching
  const parts = path.split('/').filter(Boolean);
  if (parts.length < 2) return 'default';
  
  // Para rotas como /api/library/123, usar /api/library
  return `/${parts[0]}/${parts[1]}`;
}

function generateKey(prefix: string, identifier: string, endpoint: string): string {
  return `${prefix}:${identifier}:${endpoint}`;
}

// ==================== MIDDLEWARES ====================

/**
 * Rate limiter com janela fixa
 */
export function fixedWindowRateLimit(config: Partial<RateLimitConfig> = {}) {
  const {
    max = 100,
    windowMs = 60000,
    keyGenerator = (req) => getClientIP(req),
    skip,
    handler
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skip?.(req)) {
      next();
      return;
    }

    const ip = getClientIP(req);
    
    // Verificar blacklist
    if (store.isBlacklisted(ip)) {
      logger.warn(`Blocked request from blacklisted IP: ${ip}`);
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Pular whitelist
    if (store.isWhitelisted(ip)) {
      next();
      return;
    }

    const key = generateKey('fixed', keyGenerator(req), getEndpoint(req.path));
    const record = store.increment(key, windowMs);

    const remaining = Math.max(0, max - record.count);
    const resetTime = Math.ceil(record.resetTime / 1000);

    res.set('X-RateLimit-Limit', max.toString());
    res.set('X-RateLimit-Remaining', remaining.toString());
    res.set('X-RateLimit-Reset', resetTime.toString());

    if (record.count > max) {
      store.markSuspicious(ip);
      config.onLimitReached?.(req);

      if (handler) {
        handler(req, res);
        return;
      }

      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - Date.now()) / 1000)
      });
      return;
    }

    next();
  };
}

/**
 * Rate limiter com sliding window
 */
export function slidingWindowRateLimit(config: Partial<RateLimitConfig> = {}) {
  const {
    max = 100,
    windowMs = 60000,
    keyGenerator = (req) => getClientIP(req),
    skip
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skip?.(req)) {
      next();
      return;
    }

    const ip = getClientIP(req);
    
    if (store.isBlacklisted(ip)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (store.isWhitelisted(ip)) {
      next();
      return;
    }

    const key = generateKey('sliding', keyGenerator(req), getEndpoint(req.path));
    const count = store.getSlidingCount(key, windowMs);

    if (count >= max) {
      store.markSuspicious(ip);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
      return;
    }

    store.increment(key, windowMs);
    next();
  };
}

/**
 * Rate limiter com token bucket
 */
export function tokenBucketRateLimit(config: {
  maxTokens?: number;
  refillRate?: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
} = {}) {
  const {
    maxTokens = 100,
    refillRate = 1000, // 1 token por segundo
    keyGenerator = (req) => getClientIP(req),
    skip
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skip?.(req)) {
      next();
      return;
    }

    const ip = getClientIP(req);

    if (store.isBlacklisted(ip)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (store.isWhitelisted(ip)) {
      next();
      return;
    }

    const key = generateKey('bucket', keyGenerator(req), getEndpoint(req.path));
    const tokens = store.refillTokens(key, maxTokens, refillRate);

    res.set('X-RateLimit-Tokens', tokens.toString());

    if (tokens <= 0 || !store.consumeToken(key)) {
      store.markSuspicious(ip);
      res.status(429).json({
        error: 'Rate limit exceeded',
        tokensAvailable: tokens
      });
      return;
    }

    next();
  };
}

/**
 * Rate limiter multinível (por minuto, hora e dia)
 */
export function multiLevelRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIP(req);
  const endpoint = getEndpoint(req.path);
  const limits = ENDPOINT_LIMITS[endpoint] || ENDPOINT_LIMITS['default'];

  // Verificar blacklist
  if (store.isBlacklisted(ip)) {
    logger.warn(`Blocked request from blacklisted IP: ${ip}`);
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Pular whitelist
  if (store.isWhitelisted(ip)) {
    next();
    return;
  }

  const now = Date.now();
  const userId = (req as any).user?.id || 'anonymous';
  const identifier = userId !== 'anonymous' ? `user:${userId}` : `ip:${ip}`;

  // Verificar limites por minuto
  const minuteKey = generateKey('minute', identifier, endpoint);
  const minuteRecord = store.increment(minuteKey, 60000);
  if (minuteRecord.count > limits.perMinute) {
    store.markSuspicious(ip);
    res.status(429).json({
      error: 'Rate limit exceeded (per minute)',
      limit: limits.perMinute,
      current: minuteRecord.count,
      retryAfter: Math.ceil((minuteRecord.resetTime - now) / 1000)
    });
    return;
  }

  // Verificar limite por hora
  const hourKey = generateKey('hour', identifier, endpoint);
  const hourRecord = store.increment(hourKey, 3600000);
  if (hourRecord.count > limits.hourly) {
    res.status(429).json({
      error: 'Rate limit exceeded (hourly)',
      limit: limits.hourly,
      current: hourRecord.count,
      retryAfter: Math.ceil((hourRecord.resetTime - now) / 1000)
    });
    return;
  }

  // Verificar limite por dia
  const dayKey = generateKey('day', identifier, endpoint);
  const dayRecord = store.increment(dayKey, 86400000);
  if (dayRecord.count > limits.daily) {
    res.status(429).json({
      error: 'Rate limit exceeded (daily)',
      limit: limits.daily,
      current: dayRecord.count,
      retryAfter: Math.ceil((dayRecord.resetTime - now) / 1000)
    });
    return;
  }

  // Headers informativos
  res.set('X-RateLimit-Limit-Minute', limits.perMinute.toString());
  res.set('X-RateLimit-Remaining-Minute', Math.max(0, limits.perMinute - minuteRecord.count).toString());
  res.set('X-RateLimit-Limit-Hour', limits.hourly.toString());
  res.set('X-RateLimit-Remaining-Hour', Math.max(0, limits.hourly - hourRecord.count).toString());

  next();
}

/**
 * Rate limiter específico para autenticação
 */
export function authRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIP(req);
  const email = req.body?.email || 'unknown';
  
  // Verificar blacklist
  if (store.isBlacklisted(ip)) {
    logger.warn(`Blocked auth attempt from blacklisted IP: ${ip}`);
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Limite por IP
  const ipKey = generateKey('auth', `ip:${ip}`, 'login');
  const ipRecord = store.increment(ipKey, 900000); // 15 minutos

  if (ipRecord.count > 10) {
    store.markSuspicious(ip);
    logger.warn(`Auth rate limit exceeded for IP: ${ip}`, { attempts: ipRecord.count });
    res.status(429).json({
      error: 'Too many login attempts from this IP',
      retryAfter: Math.ceil((ipRecord.resetTime - Date.now()) / 1000)
    });
    return;
  }

  // Limite por email
  const emailKey = generateKey('auth', `email:${email}`, 'login');
  const emailRecord = store.increment(emailKey, 900000);

  if (emailRecord.count > 5) {
    logger.warn(`Auth rate limit exceeded for email: ${email}`, { attempts: emailRecord.count });
    res.status(429).json({
      error: 'Too many login attempts for this account',
      retryAfter: Math.ceil((emailRecord.resetTime - Date.now()) / 1000)
    });
    return;
  }

  next();
}

/**
 * Middleware para adicionar IP à blacklist
 */
export function addToBlacklist(ip: string, reason: string, duration?: number): void {
  store.addIPRule(ip, {
    type: 'blacklist',
    reason,
    expiresAt: duration ? Date.now() + duration : undefined
  });
}

/**
 * Middleware para remover IP da blacklist
 */
export function removeFromBlacklist(ip: string): boolean {
  return store.removeIPRule(ip);
}

/**
 * Obter estatísticas do rate limiter
 */
export function getRateLimitStats() {
  return store.getStats();
}

// Exportar middleware padrão (compatibilidade)
const rateLimit = fixedWindowRateLimit;

export { rateLimit, store };
export default rateLimit;