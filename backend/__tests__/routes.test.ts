/**
 * Routes Integration Tests
 * Tests for API endpoints and their behavior
 */

import { generateToken, generateRefreshToken } from '../middleware/auth.js';

describe('API Routes (Integration Tests)', () => {
  let authToken: string;
  let refreshToken: string;
  const testUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
  };

  beforeAll(() => {
    // Gera tokens para testes
    authToken = generateToken(testUser);
    refreshToken = generateRefreshToken(testUser);
  });

  // ==================== AUTENTICAÇÃO ====================

  describe('Authentication', () => {
    it('should generate valid auth token', () => {
      expect(authToken).toBeDefined();
      expect(typeof authToken).toBe('string');
      expect(authToken.split('.').length).toBe(3);
    });

    it('should generate valid refresh token', () => {
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.').length).toBe(3);
    });

    it('should include user data in token', () => {
      const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
      expect(payload.id).toBe(testUser.id);
      expect(payload.email).toBe(testUser.email);
      expect(payload.role).toBe(testUser.role);
    });
  });

  // ==================== AUTORIZAÇÃO ====================

  describe('Authorization', () => {
    it('should generate admin token with admin role', () => {
      const adminUser = {
        id: 2,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const,
      };
      const adminToken = generateToken(adminUser);
      const payload = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString());
      expect(payload.role).toBe('admin');
    });

    it('should generate user token with user role', () => {
      const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
      expect(payload.role).toBe('user');
    });
  });

  // ==================== VALIDAÇÃO DE TOKEN ====================

  describe('Token Validation', () => {
    it('should create token with required fields', () => {
      const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
      expect(payload).toHaveProperty('id');
      expect(payload).toHaveProperty('email');
      expect(payload).toHaveProperty('name');
      expect(payload).toHaveProperty('role');
    });

    it('should have issuer set', () => {
      const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
      expect(payload.iss).toBe('labgrandisol');
    });

    it('should have audience set', () => {
      const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
      expect(payload.aud).toBe('labgrandisol-users');
    });
  });

  // ==================== REFRESH TOKEN ====================

  describe('Refresh Token', () => {
    it('should have type refresh in payload', () => {
      const payload = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
      expect(payload.type).toBe('refresh');
    });

    it('should have different audience than auth token', () => {
      const authPayload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
      const refreshPayload = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
      expect(refreshPayload.aud).toBe('labgrandisol-refresh');
      expect(authPayload.aud).not.toBe(refreshPayload.aud);
    });
  });

  // ==================== DIFERENTES USUÁRIOS ====================

  describe('Different Users', () => {
    it('should generate different tokens for different users', () => {
      const user1 = { id: 1, email: 'user1@example.com', name: 'User 1', role: 'user' as const };
      const user2 = { id: 2, email: 'user2@example.com', name: 'User 2', role: 'user' as const };

      const token1 = generateToken(user1);
      const token2 = generateToken(user2);

      expect(token1).not.toBe(token2);
    });

    it('should include correct user ID in token', () => {
      const user = { id: 42, email: 'user@example.com', name: 'User', role: 'user' as const };
      const token = generateToken(user);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      expect(payload.id).toBe(42);
    });
  });
});