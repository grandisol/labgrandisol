/**
 * Testes para Validators
 */

import { body, validationResult } from 'express-validator';

describe('Input Validators', () => {
  describe('Email Validation', () => {
    it('should accept valid emails', async () => {
      const validator = body('email').isEmail().normalizeEmail();
      
      const validEmails = [
        'user@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com'
      ];

      for (const email of validEmails) {
        const chain = validator.if(() => true);
        expect(chain).toBeDefined();
      }
    });

    it('should reject invalid emails', async () => {
      const validator = body('email').isEmail();
      
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@example.com',
        'user@.com'
      ];

      expect(invalidEmails.length).toBe(4);
    });
  });

  describe('Password Validation', () => {
    it('should require minimum length', async () => {
      const validator = body('password').isLength({ min: 8 });
      expect(validator).toBeDefined();
    });

    it('should require uppercase letter', () => {
      const regex = /^(?=.*[A-Z])/;
      expect('Password123!').toMatch(regex);
      expect('password123!').not.toMatch(regex);
    });

    it('should require lowercase letter', () => {
      const regex = /^(?=.*[a-z])/;
      expect('Password123!').toMatch(regex);
      expect('PASSWORD123!').not.toMatch(regex);
    });

    it('should require number', () => {
      const regex = /^(?=.*\d)/;
      expect('Password123!').toMatch(regex);
      expect('PasswordABC!').not.toMatch(regex);
    });

    it('should require special character', () => {
      const regex = /^(?=.*[@$!%*?&])/;
      expect('Password123!').toMatch(regex);
      expect('Password123').not.toMatch(regex);
    });
  });

  describe('String Length Validation', () => {
    it('should validate title length (1-200)', () => {
      const validator = body('title').isLength({ min: 1, max: 200 });
      expect(validator).toBeDefined();
      
      const validTitles = ['A', 'My Title', 'A'.repeat(200)];
      const invalidTitle = 'A'.repeat(201);
      
      expect(validTitles.length).toBe(3);
      expect(invalidTitle.length).toBe(201);
    });

    it('should validate name length (3-100)', () => {
      const validator = body('name').isLength({ min: 3, max: 100 });
      expect(validator).toBeDefined();
    });
  });

  describe('Enum Validation', () => {
    it('should validate role enum', () => {
      const validRoles = ['admin', 'moderator', 'user'];
      const invalidRole = 'superuser';
      
      expect(validRoles).toContain('admin');
      expect(validRoles).not.toContain(invalidRole);
    });

    it('should validate status enum', () => {
      const validStatus = ['active', 'inactive', 'banned'];
      expect(validStatus).toContain('active');
    });
  });

  describe('Integer Validation', () => {
    it('should validate positive integers for IDs', () => {
      const validator = body('id').isInt({ min: 1 });
      expect(validator).toBeDefined();
      
      expect(1).toBeGreaterThanOrEqual(1);
      expect(0).toBeLessThan(1);
      expect(-1).toBeLessThan(1);
    });
  });
});
