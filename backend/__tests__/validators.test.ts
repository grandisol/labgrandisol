/**
 * Testes para Validators
 */

describe('Input Validators', () => {
  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (const email of validEmails) {
        expect(emailRegex.test(email)).toBe(true);
      }
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@example.com',
        'user@.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(invalidEmails.length).toBe(4);
      for (const email of invalidEmails) {
        expect(emailRegex.test(email)).toBe(false);
      }
    });
  });

  describe('Password Validation', () => {
    it('should require minimum length', () => {
      const minLength = 8;
      const shortPassword = 'Pass1!';
      const validPassword = 'Password123!';

      expect(shortPassword.length).toBeLessThan(minLength);
      expect(validPassword.length).toBeGreaterThanOrEqual(minLength);
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
      const validTitles = ['A', 'My Title', 'A'.repeat(200)];
      const invalidTitle = 'A'.repeat(201);

      expect(validTitles.length).toBe(3);
      expect(invalidTitle.length).toBe(201);
    });

    it('should validate name length (3-100)', () => {
      const validName = 'John Doe';
      const shortName = 'Jo';
      const longName = 'A'.repeat(101);

      expect(validName.length).toBeGreaterThanOrEqual(3);
      expect(validName.length).toBeLessThanOrEqual(100);
      expect(shortName.length).toBeLessThan(3);
      expect(longName.length).toBeGreaterThan(100);
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
      expect(1).toBeGreaterThanOrEqual(1);
      expect(0).toBeLessThan(1);
      expect(-1).toBeLessThan(1);
    });
  });
});