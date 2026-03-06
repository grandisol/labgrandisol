/**
 * Setup para testes com Jest
 * Inicializa ambiente de teste
 */

// Setup antes de executar testes
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/labgrandisol_test';
  process.env.JWT_SECRET = 'test_secret_key_for_testing_only_' + Math.random().toString(36);
  process.env.LOG_LEVEL = 'error'; // Silencia logs durante testes
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';
});

// Cleanup após testes
afterAll(async () => {
  // Cleanup se necessário
});

// Teste dummy para satisfazer requisito do Jest
describe('Test Setup', () => {
  it('should set up test environment correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});