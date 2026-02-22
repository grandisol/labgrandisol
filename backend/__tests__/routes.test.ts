/**
 * @jest-environment node
 */
/**
 * Routes Integration Tests
 * Tests for API endpoints and their behavior
 */

import request from 'supertest';
import app from '../server';
import { generateToken, generateRefreshToken } from '../middleware/auth';

describe('API Routes(Integration Tests)', () => {
  let authToken: string;
  let refreshToken: string;
  const testUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
  };

  beforeAll(() => {
    // Gera tokens para testes (em produção, novamente seria feito via login)
    authToken = generateToken(testUser);
    refreshToken = generateRefreshToken(testUser);
  });

  // ==================== PÚBLICO ====================

  describe('GET /api/health', () => {
    it('deve retornar status healthy', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('database');
    });

    it('deve incluir timestamp válido', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      const timestamp = new Date(response.body.timestamp as string);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  // ==================== AUTENTICADO ====================

  describe('GET /api/profile', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('name', testUser.name);
      expect(response.body.user).toHaveProperty('role', testUser.role);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('deve retornar 401 sem token', async () => {
      const response = await request(app).get('/api/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar 401 com token inválido', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code');
    });

    it('deve retornar 401 com formato inválido', async () => {
      const response = await request(app).get('/api/profile').set('Authorization', 'invalid_format');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/status', () => {
    it('deve retornar status do servidor e usuário', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'online');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('server');
      expect(response.body.server).toHaveProperty('uptime');
      expect(response.body.server).toHaveProperty('environment');
      expect(response.body.server).toHaveProperty('timestamp');
    });

    it('deve incluir authenticatedAt no user', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('authenticatedAt');
      const authTime = new Date(response.body.user.authenticatedAt as string);
      expect(authTime).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/notes', () => {
    it('deve retornar lista de notas com paginação', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notes');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.notes)).toBe(true);
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('offset');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('hasMore');
    });

    it('deve aceitar query params limit e offset', async () => {
      const response = await request(app)
        .get('/api/notes')
        .query({ limit: 20, offset: 10 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toEqual(20);
      expect(response.body.pagination.offset).toEqual(10);
    });

    it('deve limitar limit máximo a 100', async () => {
      const response = await request(app)
        .get('/api/notes')
        .query({ limit: 1000 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    });

    it('deve retornar 401 sem token', async () => {
      const response = await request(app).get('/api/notes');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/notes', () => {
    it('deve criar nova nota com dados válidos', async () => {
      const noteData = {
        title: 'Nota de Teste',
        content: 'Conteúdo da nota de teste',
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('note');
      expect(response.body.note).toHaveProperty('id');
      expect(response.body.note).toHaveProperty('title', noteData.title);
      expect(response.body.note).toHaveProperty('content', noteData.content);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const noteData = {
        title: 'Nota de Teste',
        content: 'Conteúdo',
      };

      const response = await request(app).post('/api/notes').send(noteData);

      expect(response.status).toBe(401);
    });

    it('deve retornar errode validação para título vazio', async () => {
      const noteData = {
        title: '',
        content: 'Conteúdo',
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('deve atualizar nota existente', async () => {
      const noteId = 1;
      const updateData = {
        title: 'Título Atualizado',
        content: 'Conteúdo atualizado',
      };

      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Pode ser 200 ou 404 dependendo se a nota existe
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('note');
        expect(response.body.note).toHaveProperty('title', updateData.title);
      }
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .put('/api/notes/1')
        .send({ title: 'Test', content: 'Test' });

      expect(response.status).toBe(401);
    });

    it('deve retornar 404 para nota inexistente', async () => {
      const response = await request(app)
        .put('/api/notes/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated', content: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('deve deletar nota existente', async () => {
      const noteId = 1;

      const response = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Pode ser 200 ou 404 dependendo se a nota existe
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('id', noteId);
      }
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).delete('/api/notes/1');

      expect(response.status).toBe(401);
    });

    it('deve retornar 404 para nota inexistente', async () => {
      const response = await request(app)
        .delete('/api/notes/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  // ==================== ERRO 404 ====================

  describe('GET *', () => {
    it('deve retornar 404 para rota inexistente', async () => {
      const response = await request(app).get('/rota/inexistente');

      expect(response.status).toBeGreaterThanOrEqual(404);
    });
  });
});
