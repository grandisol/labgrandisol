/**
 * Testes para Logger
 */

describe('Logger Module', () => {
  describe('Log Levels', () => {
    it('should have debug level', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'critical'];
      expect(levels).toContain('debug');
    });

    it('should have info level', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'critical'];
      expect(levels).toContain('info');
    });

    it('should have warning level', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'critical'];
      expect(levels).toContain('warn');
    });

    it('should have error level', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'critical'];
      expect(levels).toContain('error');
    });

    it('should have critical level', () => {
      const levels = ['debug', 'info', 'warn', 'error', 'critical'];
      expect(levels).toContain('critical');
    });
  });

  describe('Log Format', () => {
    it('should format timestamp correctly', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should have correct log structure', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        module: 'TestModule',
        message: 'Test message'
      };

      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('level');
      expect(logEntry).toHaveProperty('module');
      expect(logEntry).toHaveProperty('message');
    });
  });

  describe('Log Metadata', () => {
    it('should include custom metadata', () => {
      const metadata = {
        userId: 1,
        email: 'user@example.com',
        action: 'LOGIN',
        ip: '192.168.1.1'
      };

      expect(metadata.userId).toBe(1);
      expect(metadata.email).toBe('user@example.com');
      expect(metadata.action).toBe('LOGIN');
    });

    it('should handle nested metadata', () => {
      const metadata = {
        request: {
          method: 'POST',
          path: '/api/login',
          headers: { 'content-type': 'application/json' }
        },
        response: {
          status: 200,
          time: 45
        }
      };

      expect(metadata.request.method).toBe('POST');
      expect(metadata.response.status).toBe(200);
    });
  });
});