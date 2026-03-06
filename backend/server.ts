import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

// Rotas
import authMockRoutes from './routes/auth-mock.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import libraryMockRoutes from './routes/library-mock.js';
import advancedLibraryRoutes from './routes/advanced-library.js';
import notificationsRoutes from './routes/notifications.js';
import searchRoutes from './routes/search.js';
import socialRoutes from './routes/social.js';
import reportsRoutes from './routes/reports.js';
import museumRoutes from './routes/museum.js';
import readingRoutes from './routes/reading.js';

// Middleware
import { verifyToken, verifyAdmin } from './middleware/auth.js';
import { rateLimit, authRateLimit, multiLevelRateLimit } from './middleware/advancedRateLimiter.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, notFoundHandler, setupUncaughtExceptionHandlers } from './middleware/errorHandler.js';
import { metricsMiddleware } from './utils/metrics.js';
import { alertManager } from './utils/alerts.js';

// Utils
import Logger from './utils/logger.js';
import { initializeDatabase, healthCheck } from './utils/database.js';
import wsManager from './utils/websocket.js';
import notificationService from './utils/notificationService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const logger = new Logger('Server');

// ==================== PATHS ====================
const publicPath = path.join(__dirname, './public');

// ==================== SETUP ERROR HANDLERS ====================
setupUncaughtExceptionHandlers();

// ==================== MIDDLEWARE GLOBAL ====================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request ID para rastreamento
app.use(requestIdMiddleware);

// Middleware de coleta de métricas
app.use(metricsMiddleware);

// Logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => logger.logRequest(req.method, req.path, res.statusCode, Date.now() - start));
  next();
});

// ==================== ARQUIVOS ESTÁTICOS (SEM AUTH) ====================
app.use(express.static(publicPath));

// ==================== ROTAS PÚBLICAS (SEM AUTH) ====================

// Health check
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime(), database: await healthCheck() });
  } catch { res.status(503).json({ status: 'unhealthy' }); }
});

// Auth routes
app.use('/api/auth', authMockRoutes);

// Rate limiting global
app.use('/api/', multiLevelRateLimit);

// ==================== ROTAS PROTEGIDAS ====================

// API geral
app.use('/api', verifyToken, apiRoutes);

// Biblioteca (rotas públicas para leitura)
app.use('/api/library', libraryMockRoutes);

// Advanced Library (requer autenticação)
app.use('/api/advanced', verifyToken, advancedLibraryRoutes);

// Notificações
app.use('/api/notifications', verifyToken, notificationsRoutes);

// Busca
app.use('/api/search', verifyToken, searchRoutes);

// Social
app.use('/api/social', verifyToken, socialRoutes);

// Relatórios
app.use('/api/reports', verifyToken, reportsRoutes);

// Almanaque Botânico (público para leitura)
app.use('/api/museum', museumRoutes);

// Leitura
app.use('/api/reading', verifyToken, readingRoutes);

// Admin
app.use('/api/admin', verifyToken, verifyAdmin, adminRoutes);

// ==================== SPA FALLBACK ====================
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ==================== ERROR HANDLER ====================
app.use(notFoundHandler);
app.use(errorHandler);

// ==================== INICIALIZAÇÃO ====================
async function start() {
  try {
    // Inicializar banco de dados
    try {
      await initializeDatabase();
      logger.info('✅ PostgreSQL conectado');
    } catch { logger.warn('⚠️ Usando Mock Database'); }

    // Criar servidor HTTP
    const server = createServer(app);

    // Inicializar WebSocket
    wsManager.initialize(server);
    logger.info('✅ WebSocket inicializado');

    // Iniciar monitoramento de alertas
    alertManager.startMonitoring(30000); // Verifica alertas a cada 30 segundos
    logger.info('✅ Monitoramento de alertas iniciado');

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('🔄 Iniciando graceful shutdown...');
      
      wsManager.close();
      notificationService.stop();
      
      server.close(() => {
        logger.info('✅ Servidor encerrado');
        process.exit(0);
      });

      // Force close após 10 segundos
      setTimeout(() => {
        logger.error('⚠️ Forçando encerramento');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Iniciar servidor
    server.listen(PORT, () => {
      logger.info('╔════════════════════════════════════════════════════════╗');
      logger.info('║       LabGrandisol - Almanaque Botânico               ║');
      logger.info('╚════════════════════════════════════════════════════════╝');
      logger.info(`Servidor: http://localhost:${PORT}`);
      logger.info(`WebSocket: ws://localhost:${PORT}/ws`);
      logger.info(`Ambiente: ${NODE_ENV}`);
    });

  } catch (error) {
    logger.critical('Falha ao iniciar', error as Error);
    process.exit(1);
  }
}

void start();
export default app;