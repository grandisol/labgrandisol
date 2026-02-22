/**
 * Redis Cache Module
 * Provides caching functionality with automatic expiration and type-safe operations
 * @module utils/cache
 */

import redis from 'redis';
import Logger from './logger.js';
import { User, Note } from '../types/index.js';

const logger = new Logger('Cache');

/**
 * Cache configuration
 */
interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number; // Default TTL in seconds
}

/**
 * Default TTL values for different cache types
 */
const DEFAULT_TTLS = {
  USER: 3600, // 1 hour
  AUTH_TOKEN: 1800, // 30 minutes
  SESSION: 86400, // 24 hours
  NOTE: 300, // 5 minutes
  API_RESPONSE: 60, // 1 minute
};

type RedisClient = ReturnType<typeof redis.createClient>;

/**
 * Cache Manager class for Redis operations
 */
export class CacheManager {
  private client: RedisClient | null = null;
  private isConnected: boolean = false;
  private config: CacheConfig;

  /**
   * Initialize cache manager
   * @param config Optional cache configuration
   */
  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      ttl: parseInt(process.env.REDIS_TTL || '3600'),
      ...config,
    };
  }

  /**
   * Connect to Redis
   */
  public async connect(): Promise<void> {
    try {
      this.client = redis.createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
        password: this.config.password,
      });

      this.client.on('error', (err) => logger.error('Redis error', err as Error));
      this.client.on('connect', () => logger.info('Redis connected'));
      this.client.on('disconnect', () => logger.warn('Redis disconnected'));

      await this.client.connect();
      this.isConnected = true;
      logger.info('Cache manager connected to Redis');
    } catch (err) {
      logger.error('Failed to connect to Redis', err as Error);
      throw err;
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Cache manager disconnected from Redis');
      }
    } catch (err) {
      logger.error('Failed to disconnect from Redis', err as Error);
    }
  }

  /**
   * Set a cache value with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in seconds
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Cache set: Redis not connected', { key });
        return;
      }

      const serialized = JSON.stringify(value);
      const cacheTtl = ttl || this.config.ttl;

      if (cacheTtl > 0) {
        await this.client.setEx(key, cacheTtl, serialized);
        logger.debug(`Cache set: ${key}`, { ttl: cacheTtl });
      } else {
        await this.client.set(key, serialized);
        logger.debug(`Cache set: ${key} (no expiration)`);
      }
    } catch (err) {
      logger.error(`Cache set error: ${key}`, err as Error);
    }
  }

  /**
   * Get a cache value
   * @param key Cache key
   * @returns Cached value or null
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Cache get: Redis not connected', { key });
        return null;
      }

      const cached = await this.client.get(key);

      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached) as T;
      }

      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (err) {
      logger.error(`Cache get error: ${key}`, err as Error);
      return null;
    }
  }

  /**
   * Delete a cache key
   * @param key Cache key to delete
   */
  public async delete(key: string): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Cache delete: Redis not connected', { key });
        return;
      }

      await this.client.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (err) {
      logger.error(`Cache delete error: ${key}`, err as Error);
    }
  }

  /**
   * Clear all cache keys matching pattern
   * @param pattern Pattern to match (e.g., 'user:*')
   */
  public async deletePattern(pattern: string): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Cache deletePattern: Redis not connected', { pattern });
        return;
      }

      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(keys);
        logger.debug(`Cache deleted pattern: ${pattern}`, { count: keys.length });
      }
    } catch (err) {
      logger.error(`Cache deletePattern error: ${pattern}`, err as Error);
    }
  }

  /**
   * Clear all cache
   */
  public async flushAll(): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Cache flushAll: Redis not connected');
        return;
      }

      await this.client.flushDb();
      logger.warn('Cache flushed: All keys deleted');
    } catch (err) {
      logger.error('Cache flushAll error', err as Error);
    }
  }

  /**
   * Check Redis connection health
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      await this.client.ping();
      logger.debug('Cache health check: OK');
      return true;
    } catch (err) {
      logger.error('Cache health check: FAILED', err as Error);
      return false;
    }
  }

  /**
   * Cache user data
   * @param user User object to cache
   */
  public async cacheUser(user: User): Promise<void> {
    await this.set(`user:${user.id}`, user, DEFAULT_TTLS.USER);
    await this.set(`user:email:${user.email}`, user.id, DEFAULT_TTLS.USER);
  }

  /**
   * Get cached user by ID
   * @param userId User ID
   */
  public async getCachedUser(userId: number): Promise<User | null> {
    return this.get<User>(`user:${userId}`);
  }

  /**
   * Get cached user ID by email
   * @param email User email
   */
  public async getCachedUserIdByEmail(email: string): Promise<number | null> {
    return this.get<number>(`user:email:${email}`);
  }

  /**
   * Invalidate user cache
   * @param userId User ID
   * @param email User email (optional)
   */
  public async invalidateUserCache(userId: number, email?: string): Promise<void> {
    await this.delete(`user:${userId}`);
    if (email) {
      await this.delete(`user:email:${email}`);
    }
    logger.debug(`Cache invalidated: user ${userId}`);
  }

  /**
   * Cache user notes
   * @param userId User ID
   * @param notes Array of notes
   */
  public async cacheUserNotes(userId: number, notes: Note[]): Promise<void> {
    await this.set(`user:${userId}:notes`, notes, DEFAULT_TTLS.NOTE);
  }

  /**
   * Get cached user notes
   * @param userId User ID
   */
  public async getCachedUserNotes(userId: number): Promise<Note[] | null> {
    return this.get<Note[]>(`user:${userId}:notes`);
  }

  /**
   * Invalidate user notes cache
   * @param userId User ID
   */
  public async invalidateUserNotesCache(userId: number): Promise<void> {
    await this.delete(`user:${userId}:notes`);
    logger.debug(`Cache invalidated: user ${userId} notes`);
  }

  /**
   * Cache API response
   * @param endpoint Endpoint path
   * @param response Response data
   * @param ttl Optional TTL (default: 1 minute)
   */
  public async cacheApiResponse<T>(endpoint: string, response: T, ttl?: number): Promise<void> {
    const key = `api:${endpoint}`;
    await this.set(key, response, ttl || DEFAULT_TTLS.API_RESPONSE);
  }

  /**
   * Get cached API response
   * @param endpoint Endpoint path
   */
  public async getCachedApiResponse<T>(endpoint: string): Promise<T | null> {
    return this.get<T>(`api:${endpoint}`);
  }

  /**
   * Invalidate API response cache
   * @param endpoint Endpoint path
   */
  public async invalidateApiResponse(endpoint: string): Promise<void> {
    await this.delete(`api:${endpoint}`);
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<Record<string, unknown> | null> {
    try {
      if (!this.client || !this.isConnected) {
        return null;
      }

      const info = await this.client.info('stats');
      logger.debug('Cache stats retrieved');
      return { info };
    } catch (err) {
      logger.error('Cache getStats error', err as Error);
      return null;
    }
  }
}

/**
 * Global cache instance
 */
let cacheInstance: CacheManager | null = null;

/**
 * Get or create global cache instance
 */
export function getCache(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
}

/**
 * Initialize global cache
 */
export async function initializeCache(): Promise<void> {
  const cache = getCache();
  await cache.connect();
}

/**
 * Shutdown global cache
 */
export async function shutdownCache(): Promise<void> {
  if (cacheInstance) {
    await cacheInstance.disconnect();
    cacheInstance = null;
  }
}

export default CacheManager;
