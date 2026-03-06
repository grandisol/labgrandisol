/**
 * Testes para Authentication
 */

import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

describe('Authentication Module', () => {
  describe('Token Generation', () => {
    it('should generate valid JWT token', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const
      };

      const token = generateToken(user);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
    });

    it('should generate valid refresh token', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const
      };

      const refreshToken = generateRefreshToken(user);
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.').length).toBe(3);
    });

    it('should generate different tokens for different users', () => {
      const user1 = {
        id: 1,
        email: 'user1@example.com',
        name: 'User 1',
        role: 'user' as const
      };

      const user2 = {
        id: 2,
        email: 'user2@example.com',
        name: 'User 2',
        role: 'user' as const
      };

      const token1 = generateToken(user1);
      const token2 = generateToken(user2);

      expect(token1).not.toBe(token2);
    });

    it('should generate admin tokens with admin role', () => {
      const admin = {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const
      };

      const token = generateToken(admin);
      expect(token).toBeDefined();
    });
  });

  describe('Password Hashing', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'TestPassword123!@#';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(30); // bcrypt hash is long
    });

    it('should verify correct passwords', async () => {
      const password = 'TestPassword123!@#';
      const hashedPassword = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('should not verify incorrect passwords', async () => {
      const password = 'TestPassword123!@#';
      const wrongPassword = 'WrongPassword456!@#';
      const hashedPassword = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should use 10 salt rounds for consistency', async () => {
      const password = 'TestPassword123!@#';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      // Different hashes but both valid for same password
      expect(hash1).not.toBe(hash2);
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('Authentication Flow', () => {
    it('should handle complete login flow', async () => {
      const user = {
        id: 1,
        email: 'user@example.com',
        password_hash: await bcrypt.hash('SecurePassword123!', 10),
        name: 'Test User',
        role: 'user' as const
      };

      // Simulate password verification
      const loginPassword = 'SecurePassword123!';
      const isPasswordValid = await bcrypt.compare(loginPassword, user.password_hash);
      expect(isPasswordValid).toBe(true);

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      expect(token).toBeDefined();
      expect(refreshToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      const isValid = await bcrypt.compare('WrongPassword123!', hashedPassword);

      expect(isValid).toBe(false);
    });
  });

  describe('Token Payload', () => {
    it('should include user ID in token', () => {
      const user = {
        id: 42,
        email: 'user@example.com',
        name: 'Test User',
        role: 'user' as const
      };

      const token = generateToken(user);
      // Decode token payload (middle part)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      expect(payload.id).toBe(42);
    });

    it('should include user email in token', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const
      };

      const token = generateToken(user);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      expect(payload.email).toBe('test@example.com');
    });

    it('should include user role in token', () => {
      const user = {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const
      };

      const token = generateToken(user);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      expect(payload.role).toBe('admin');
    });
  });
});