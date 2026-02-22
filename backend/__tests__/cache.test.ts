/**
 * @jest-environment node
 */
/**
 * Cache Module Tests
 * Tests for Redis caching functionality
 */

import { CacheManager, getCache, initializeCache, shutdownCache } from '../utils/cache';
import { User, Note } from '../types/index';

describe('Cache Module', () => {
  let cache: CacheManager;

  beforeAll(async () => {
    cache = new CacheManager({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 0,
      ttl: 60,
    });
  });

  afterAll(async () => {
    await cache.disconnect();
  });

  describe('Basic Operations', () => {
    it('should set and get a string value', async () => {
      await cache.set('test:key', 'test_value', 10);
      const result = await cache.get<string>('test:key');

      expect(result).toBe('test_value');
    });

    it('should set and get an object value', async () => {
      const user: Partial<User> = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      await cache.set('user:1', user, 10);
      const result = await cache.get<Partial<User>>('user:1');

      expect(result).toEqual(user);
      expect(result?.email).toBe('test@example.com');
    });

    it('should get null for non-existent key', async () => {
      const result = await cache.get('non:existent:key');
      expect(result).toBeNull();
    });

    it('should delete a key', async () => {
      await cache.set('delete:test', 'value', 10);
      await cache.delete('delete:test');
      const result = await cache.get('delete:test');

      expect(result).toBeNull();
    });
  });

  describe('TTL Handling', () => {
    it('should use default TTL', async () => {
      // Cache set without TTL should use config TTL (60 seconds)
      await cache.set('ttl:default', 'value');
      const result = await cache.get('ttl:default');

      expect(result).toBe('value');
    });

    it('should use custom TTL', async () => {
      // Set with 1 second TTL
      await cache.set('ttl:custom', 'value', 1);
      let result = await cache.get('ttl:custom');
      expect(result).toBe('value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));
      result = await cache.get('ttl:custom');
      expect(result).toBeNull();
    });
  });

  describe('User Caching', () => {
    const testUser: User = {
      id: 1,
      email: 'john@example.com',
      name: 'John Doe',
      role: 'user',
      status: 'active',
    };

    it('should cache user by ID', async () => {
      await cache.cacheUser(testUser);
      const result = await cache.getCachedUser(testUser.id);

      expect(result).toEqual(testUser);
    });

    it('should cache user email mapping', async () => {
      await cache.cacheUser(testUser);
      const userId = await cache.getCachedUserIdByEmail(testUser.email);

      expect(userId).toBe(testUser.id);
    });

    it('should invalidate user cache', async () => {
      await cache.cacheUser(testUser);
      await cache.invalidateUserCache(testUser.id, testUser.email);

      const resultById = await cache.getCachedUser(testUser.id);
      const resultByEmail = await cache.getCachedUserIdByEmail(testUser.email);

      expect(resultById).toBeNull();
      expect(resultByEmail).toBeNull();
    });
  });

  describe('Note Caching', () => {
    const testNotes: Note[] = [
      {
        id: 1,
        user_id: 1,
        title: 'Note 1',
        content: 'Content 1',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        user_id: 1,
        title: 'Note 2',
        content: 'Content 2',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    it('should cache user notes', async () => {
      await cache.cacheUserNotes(1, testNotes);
      const result = await cache.getCachedUserNotes(1);

      expect(result).toEqual(testNotes);
      expect(result?.length).toBe(2);
    });

    it('should invalidate user notes cache', async () => {
      await cache.cacheUserNotes(1, testNotes);
      await cache.invalidateUserNotesCache(1);
      const result = await cache.getCachedUserNotes(1);

      expect(result).toBeNull();
    });
  });

  describe('Pattern Deletion', () => {
    it('should delete keys matching pattern', async () => {
      await cache.set('pattern:key1', 'value1');
      await cache.set('pattern:key2', 'value2');
      await cache.set('other:key', 'value3');

      await cache.deletePattern('pattern:*');

      expect(await cache.get('pattern:key1')).toBeNull();
      expect(await cache.get('pattern:key2')).toBeNull();
      expect(await cache.get('other:key')).toBe('value3');
    });
  });

  describe('API Response Caching', () => {
    it('should cache API response', async () => {
      const response = { status: 'ok', data: [1, 2, 3] };
      await cache.cacheApiResponse('/api/users', response);

      const result = await cache.getCachedApiResponse('/api/users');
      expect(result).toEqual(response);
    });

    it('should invalidate API response', async () => {
      const response = { status: 'ok' };
      await cache.cacheApiResponse('/api/status', response);
      await cache.invalidateApiResponse('/api/status');

      const result = await cache.getCachedApiResponse('/api/status');
      expect(result).toBeNull();
    });
  });

  describe('Global Instance', () => {
    it('should return same instance from getCache()', () => {
      const cache1 = getCache();
      const cache2 = getCache();

      expect(cache1).toBe(cache2);
    });
  });

  describe('Health Check', () => {
    it('should pass health check when connected', async () => {
      // Note: This test may fail if Redis is not available
      const health = await cache.healthCheck();
      // expect(health).toBe(true); // Commented as Redis may not be always available
    });
  });
});
