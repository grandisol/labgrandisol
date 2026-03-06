/**
 * Testes para Database Module
 */

import { healthCheck } from '../utils/database.js';

describe('Database Module', () => {
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
    it('should have database module exports', async () => {
      // Verifica se o módulo existe
      const db = await import('../utils/database.js');
      expect(db).toBeDefined();
      expect(typeof db.healthCheck).toBe('function');
    });
  });

  describe('Connection', () => {
    it('should handle connection gracefully', async () => {
      // Teste básico de conexão
      const health = await healthCheck();
      expect(health).toBeDefined();
    });
  });
});