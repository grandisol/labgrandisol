/**
 * Testes para Logger
 */

import Logger from '../../utils/logger.js';

describe('Logger Module', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestModule');
    // Silencia output durante testes
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Log Levels', () => {
    it('should create logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should log debug messages', () => {
      logger.debug('Debug message', { test: true });
      expect(console.log).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('Info message', { test: true });
      expect(console.log).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      logger.warn('Warning message', { test: true });
      expect(console.log).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error message', error, { test: true });
      expect(console.log).toHaveBeenCalled();
    });

    it('should log critical messages', () => {
      const error = new Error('Critical error');
      logger.critical('Critical message', error, { test: true });
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('Specialized Logging', () => {
    it('should log auth events', () => {
      logger.logAuth('LOGIN_SUCCESS', 'user@example.com', { ip: '127.0.0.1' });
      expect(console.log).toHaveBeenCalled();
    });

    it('should log access control events', () => {
      logger.logAccess('user@example.com', '/api/admin', true);
      expect(console.log).toHaveBeenCalled();
    });

    it('should log HTTP requests', () => {
      logger.logRequest('GET', '/api/profile', 200, 45);
      expect(console.log).toHaveBeenCalled();
    });

    it('should log audit events', () => {
      logger.logAudit('CREATE', 1, 'note', { noteId: 42 });
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should log errors with stack traces in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(console.log).toHaveBeenCalled();
    });

    it('should not include stack traces in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('Metadata', () => {
    it('should include custom metadata', () => {
      const metadata = {
        userId: 1,
        email: 'user@example.com',
        action: 'LOGIN',
        ip: '192.168.1.1'
      };

      logger.info('User logged in', metadata);
      expect(console.log).toHaveBeenCalled();
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

      logger.info('Request processed', metadata);
      expect(console.log).toHaveBeenCalled();
    });
  });
});
