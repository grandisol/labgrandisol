import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Rotas
import authMockRoutes from './routes/auth-mock.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import libraryMockRoutes from './routes/library-mock.js';
import advancedLibraryRoutes from './routes/advanced-library.js';
import saasRoutes from './routes/saas.js';
import notificationsRoutes from './routes/notifications.js';
import searchRoutes from './routes/search.js';
import socialRoutes from './routes/social.js';
import reportsRoutes from './routes/reports.js';

// Middleware
import { verifyToken, verifyAdmin } from './middleware/auth.js';
import rateLimit from './middleware/rateLimiter.js';

// Utils
import Logger from './utils/logger.js';
import { initializeDatabase, healthCheck } from './utils/database.js';

dotenv.config();

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const app: Express = express();
const PORT: string | number = process.env.PORT || 3001;
const NODE_ENV: string = process.env.NODE_ENV || 'production';

const logger = new Logger('Server');

// ==================== VALIDAÇÃO DE AMBIENTE ====================

if (NODE_ENV === 'production') {
  const requiredEnvVars: string[] = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'JWT_SECRET'];
  const missing: string[] = requiredEnvVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    logger.critical(`Variáveis de ambiente obrigatórias faltando: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// ==================== MIDDLEWARE GLOBAL ====================

// Segurança
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://wiki.local'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging HTTP
app.use((req: Request, res: Response, next: NextFunction): void => {
  const start: number = Date.now();

  res.on('finish', (): void => {
    const duration: number = Date.now() - start;
    logger.logRequest(req.method, req.path, res.statusCode, duration);
  });

  next();
});

// Compressão
app.use(compression());

// Body parser com limite
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================== SERVIR FRONTEND ====================

const publicPath: string = path.join(__dirname, './public');
app.use(express.static(publicPath));

// SPA fallback para raiz
app.get('/', (_req: Request, res: Response): void => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ==================== ROTAS PÚBLICAS ====================

/**
 * GET /api/health
 * Health check para monitoring
 */
app.get('/api/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbHealth = await healthCheck();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      database: dbHealth,
    });
  } catch (err) {
    logger.error('Health check failed', err as Error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
    });
  }
});

// Rate limiting global (100 requisições por 60 segundos)
const globalLimiter = rateLimit({ max: 100, windowMs: 60000, endpoint: 'global' });
app.use('/api/', globalLimiter);

// Rotas de autenticação
logger.info('Registrando rotas de autenticação (Mock)');
app.use('/api/auth', authMockRoutes);

// ==================== MIDDLEWARE DE AUTENTICAÇÃO ====================

app.use(verifyToken);

// ==================== ROTAS PROTEGIDAS ====================

// API geral (protegida)
logger.info('Registrando rotas de API protegidas');
app.use('/api', apiRoutes);

// Biblioteca (usando Mock Database para desenvolvimento)
logger.info('Registrando rotas de biblioteca (Mock Database)');
app.use('/api/library', libraryMockRoutes);

// Rotas avançadas (recursos premium)
logger.info('Registrando rotas de biblioteca avançada');
app.use('/api/advanced', advancedLibraryRoutes);

// SaaS (workspace, assinatura, etc)
logger.info('Registrando rotas SaaS');
app.use('/api/saas', saasRoutes);

// Notificações
logger.info('Registrando rotas de notificações');
app.use('/api/notifications', notificationsRoutes);

// Busca avançada
logger.info('Registrando rotas de busca avançada');
app.use('/api/search', searchRoutes);

// Social features
logger.info('Registrando rotas de social');
app.use('/api/social', socialRoutes);

// Relatórios
logger.info('Registrando rotas de relatórios');
app.use('/api/reports', reportsRoutes);

// Admin (requer admin)
logger.info('Registrando rotas de admin');
app.use('/api/admin', verifyAdmin, adminRoutes);

// ==================== FALLBACK PARA SPA ====================

app.get('*', (_req: Request, res: Response): void => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ==================== TRATAMENTO DE ERROS ====================

/**
 * 404 Handler
 */
app.use((req: Request, res: Response): void => {
  logger.warn('Rota não encontrada', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
  });
});

/**
 * Error Handler Global
 */
const errorHandler: ErrorRequestHandler = (err, req, res, _next): void => {
  logger.error('Erro não tratado', err as Error, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  const status: number = (err as any).status || 500;
  const message: string =
    NODE_ENV === 'production' ? 'Erro interno do servidor' : (err as Error).message;

  res.status(status).json({
    error: message,
    ...(NODE_ENV === 'development' && { stack: (err as Error).stack }),
  });
};

app.use(errorHandler);

// ==================== INICIALIZAR SERVIDOR ====================

/**
 * Função para iniciar o servidor
 */
async function start(): Promise<void> {
  try {
    // Conecta ao banco de dados (opcional para desenvolvimento)
    logger.info('Inicializando conexão com banco de dados...');
    try {
      await initializeDatabase();
      logger.info('✅ PostgreSQL conectado com sucesso');
    } catch (dbError) {
      logger.warn('⚠️ PostgreSQL não disponível. Usando Mock Database para desenvolvimento...', {
        error: (dbError as Error).message
      });
      // Mock Database será usado via fallback nas rotas
    }

    // Inicia servidor HTTP
    const server = app.listen(PORT, (): void => {
      logger.info('╔════════════════════════════════════════════════════════╗');
      logger.info('║       LabGrandisol - Sistema Interno Privado          ║');
      logger.info('╚════════════════════════════════════════════════════════╝');
      logger.info(`Servidor iniciado com sucesso`, {
        port: PORT,
        environment: NODE_ENV,
        timestamp: new Date().toLocaleString('pt-BR'),
      });
      logger.info(`🔗 https://wiki.local`);
      logger.info(`📡 https://wiki.local/api`);
      logger.info(`🛠️  https://wiki.local/admin`);
    });

    // Graceful shutdown
    process.on('SIGINT', (): void => {
      logger.info('Recebido SIGINT, encerrando gracefully...');
      server.close((): void => {
        logger.info('Servidor encerrado');
        process.exit(0);
      });
    });

    process.on('SIGTERM', (): void => {
      logger.info('Recebido SIGTERM, encerrando gracefully...');
      server.close((): void => {
        logger.info('Servidor encerrado');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.critical('Falha ao iniciar servidor', error as Error);
    process.exit(1);
  }
}

// Inicia aplicação
void start();

export default app;
