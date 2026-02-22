/**
 * Setup para testes com Jest
 * Inicializa banco de dados de teste
 */

// Disable linting for jest globals
// @ts-nocheck

// Setup antes de executar testes
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/labgrandisol_test';
  process.env.JWT_SECRET = 'test_secret_key_for_testing_only_' + Math.random().toString(36);
  process.env.LOG_LEVEL = 'ERROR'; // Silencia logs durante testes
});

// Cleanup após testes
afterAll(async () => {
  // Cleanup se necessário
});
