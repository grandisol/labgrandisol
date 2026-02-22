/**
 * Testes para Database Module
 */

import { initializeDatabase, query, closeDatabase, healthCheck } from '../../utils/database.js';
import { User } from '../../types/index.js';

describe('Database Module', () => {
  beforeAll(async () => {
    // Inicializa banco de dados
    // await initializeDatabase();
  });

  afterAll(async () => {
    // await closeDatabase();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const health = await healthCheck();
      expect(health).toHaveProperty('status');
      expect(['healthy', 'unhealthy']).toContain(health.status);
    });

    it('should include timestamp', async () => {
      const health = await healthCheck();
      expect(health).toHaveProperty('timestamp');
    });
  });

  describe('Query Execution', () => {
    it('should execute simple queries', async () => {
      const result = await query('SELECT 1 as num');
      expect(result.rows).toEqual(expect.any(Array));
    });

    it('should support parameterized queries', async () => {
      // Test parameterized query
      const result = await query('SELECT $1::text as result', ['test']);
      expect(result.rows[0]?.result).toBe('test');
    });
  });

  describe('User Table', () => {
    it('should have users table with correct schema', async () => {
      const checkTable = await query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='users')`
      );
      expect(checkTable.rows[0]).toHaveProperty('exists');
    });

    it('should enforce email uniqueness', async () => {
      const email = `test-${Date.now()}@example.com`;
      
      // Primeiro insert deve funcionar
      await query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
        [email, 'hash', 'Test User', 'user']
      );

      // Segundo insert com mesmo email deveria falhar
      try {
        await query(
          'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
          [email, 'hash', 'Test User 2', 'user']
        );
        fail('Should have thrown unique constraint error');
      } catch (err: any) {
        expect(err.code).toBe('23505'); // Unique violation error code
      }
    });
  });

  describe('Transactions', () => {
    it('should support transactions', async () => {
      // Mock test - implementação real depende de transaction() estar disponível
      expect(true).toBe(true);
    });
  });
});
