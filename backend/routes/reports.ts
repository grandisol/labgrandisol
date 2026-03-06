/**
 * Reports Routes - LabGrandisol
 * Relatórios e análises do usuário
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth.js';
import Logger from '../utils/logger.js';

// Importações para análise de código multi-linguagem
import { analyzeCodeComplexity, analyzeMultipleFiles, generateCodeAnalysisReport } from '../utils/codeAnalyzer.js';
import { calculatePerformanceMetrics, calculateQualityMetrics, calculateSecurityMetrics, calculateDevelopmentMetrics, generateMetricsReport } from '../utils/codeMetrics.js';

const logger = new Logger('Reports');

const router = Router();

/**
 * GET /api/reports/reading
 * Relatório de leitura detalhado
 */
router.get('/reading', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { start_date, end_date } = req.query;

    const now = new Date();
    const startDate = start_date ? new Date(String(start_date)) : new Date(now.getFullYear(), 0, 1);
    const endDate = end_date ? new Date(String(end_date)) : now;

    // Mock reading report data
    const reportData = {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days: Math.floor(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
      summary: {
        total_books_read: 12,
        total_pages_read: 3645,
        average_pages_per_book: 304,
        average_reading_time_days: 30,
        favorite_genre: 'Ficção Científica',
        most_active_month: 'Fevereiro',
        reading_streak_current: 23,
        reading_streak_longest: 67,
      },
      breakdown_by_month: [
        {
          month: 'Janeiro',
          books_read: 4,
          pages_read: 1200,
          average_rating: 4.3,
        },
        {
          month: 'Fevereiro',
          books_read: 8,
          pages_read: 2445,
          average_rating: 4.5,
        },
      ],
      breakdown_by_genre: [
        { genre: 'Ficção Científica', books: 5, pages: 1520, percentage: 41.6 },
        { genre: 'Distopia', books: 3, pages: 900, percentage: 24.7 },
        { genre: 'Aventura', books: 4, pages: 1225, percentage: 33.6 },
      ],
      breakdown_by_author: [
        { author: 'George Orwell', books: 2, pages: 650 },
        { author: 'Isaac Asimov', books: 2, pages: 700 },
        { author: 'Frank Herbert', books: 1, pages: 680 },
        { author: 'Outros', books: 7, pages: 1615 },
      ],
      insights: [
        {
          title: 'Ritmo de Leitura',
          value: 'Você está lendo em ritmo acelerado',
          trend: 'up',
          icon: '📈',
        },
        {
          title: 'Gênero Favorito',
          value: 'Você prefere Ficção Científica',
          trend: 'stable',
          icon: '⭐',
        },
        {
          title: 'Consistência',
          value: 'Você está lendo 23 dias seguidos!',
          trend: 'up',
          icon: '🔥',
        },
      ],
    };

    logger.info(
      `Relatório de leitura gerado para usuário ${userId} - período ${reportData.period.start} até ${reportData.period.end}`
    );

    res.status(200).json(reportData);
  } catch (error) {
    logger.error('Erro ao gerar relatório de leitura');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/reports/collections
 * Relatório de coleções
 */
router.get('/collections', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const reportData = {
      total_collections: 4,
      total_books_in_collections: 15,
      collections: [
        {
          id: 1,
          name: 'Ficção Científica Favorita',
          book_count: 5,
          total_pages: 1520,
          average_rating: 4.6,
          most_recent_added: '2026-02-20T00:00:00Z',
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Clássicos Modernos',
          book_count: 6,
          total_pages: 1850,
          average_rating: 4.4,
          most_recent_added: '2026-02-18T00:00:00Z',
          created_at: '2025-12-15T00:00:00Z',
        },
        {
          id: 3,
          name: 'Para Futuras Leituras',
          book_count: 4,
          total_pages: 1200,
          average_rating: 4.2,
          most_recent_added: '2026-02-22T00:00:00Z',
          created_at: '2025-11-10T00:00:00Z',
        },
      ],
      most_active_collection: {
        name: 'Ficção Científica Favorita',
        percentage: 33,
      },
      insights: [
        { title: 'Coleção Mais Ativa', value: 'Ficção Científica Favorita' },
        { title: 'Books na Maior Coleção', value: '6 books' },
        { title: 'Taxa de Crescimento', value: '+2 livros/mês' },
      ],
    };

    logger.info(`Relatório de coleções gerado para usuário ${userId}`);

    res.status(200).json(reportData);
  } catch (error) {
    logger.error('Erro ao gerar relatório de coleções');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/reports/reviews
 * Relatório de reviews
 */
router.get('/reviews', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const reportData = {
      total_reviews: 24,
      average_rating_given: 4.3,
      total_helpful_votes: 87,
      reviews_by_rating: {
        5: 12,
        4: 8,
        3: 3,
        2: 1,
        1: 0,
      },
      reviews_by_month: [
        { month: 'Janeiro', count: 8, average_rating: 4.2 },
        { month: 'Fevereiro', count: 16, average_rating: 4.4 },
      ],
      top_reviewed_books: [
        {
          book: '1984',
          reviews: 2,
          average_rating: 5,
        },
        {
          book: 'Duna',
          reviews: 2,
          average_rating: 4.5,
        },
      ],
      insights: [
        { title: 'Atividade de Review', value: 'Você está muito ativo!' },
        { title: 'Taxa de Avaliação', value: '2 reviews/mês' },
        { title: 'Engagement', value: '87 votos úteis recebidos' },
      ],
    };

    logger.info(`Relatório de reviews gerado para usuário ${userId}`);

    res.status(200).json(reportData);
  } catch (error) {
    logger.error('Erro ao gerar relatório de reviews');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/reports/achievements
 * Relatório de conquistas e progresso
 */
router.get('/achievements', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const reportData = {
      total_achievements: 3,
      achievement_categories: {
        reader: { earned: 1, total: 5, percentage: 20 },
        reviewer: { earned: 1, total: 3, percentage: 33 },
        collector: { earned: 0, total: 4, percentage: 0 },
        social: { earned: 0, total: 3, percentage: 0 },
        milestone: { earned: 1, total: 10, percentage: 10 },
      },
      earned_achievements: [
        {
          id: 1,
          name: 'Leitor Voraz',
          description: 'Leu 50+ livros',
          earned_at: '2025-11-15T00:00:00Z',
          icon: '📚',
        },
        {
          id: 2,
          name: 'Crítico Perspicaz',
          description: 'Escreveu 30+ reviews',
          earned_at: '2025-12-01T00:00:00Z',
          icon: '✍️',
        },
        {
          id: 3,
          name: 'Dia 30 Seguido',
          description: '30 dias lendo diariamente',
          earned_at: '2026-02-15T00:00:00Z',
          icon: '🔥',
        },
      ],
      next_achievements: [
        {
          name: 'Colecionador Mestre',
          description: 'Crie 5 coleções com 10+ livros',
          progress: 20,
          progress_text: '1/5 coleções',
        },
        {
          name: 'Socializador',
          description: 'Siga 50+ usuários',
          progress: 2,
          progress_text: '1/50 usuários',
        },
      ],
      unlock_rate_percentage: 30,
      next_milestone: {
        name: 'Dia 60 Seguido',
        days_remaining: 37,
      },
    };

    logger.info(`Relatório de conquistas gerado para usuário ${userId}`);

    res.status(200).json(reportData);
  } catch (error) {
    logger.error('Erro ao gerar relatório de conquistas');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/reports/social
 * Relatório de atividade social
 */
router.get('/social', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const reportData = {
      followers_count: 15,
      following_count: 8,
      monthly_views: 245,
      monthly_interactions: 42,
      engagement_rate: 17.1,
      top_posts: [
        {
          type: 'review',
          title: 'Review: 1984',
          rating: 5,
          engagement: 12,
          date: '2026-02-20T00:00:00Z',
        },
        {
          type: 'collection',
          title: 'Ficção Científica Favorita',
          engagement: 8,
          date: '2026-02-15T00:00:00Z',
        },
      ],
      follower_growth: [
        { month: 'Janeiro', followers: 10 },
        { month: 'Fevereiro', followers: 15 },
      ],
      interaction_breakdown: {
        follows: 15,
        comments: 8,
        shares: 12,
        likes: 7,
      },
    };

    logger.info(`Relatório social gerado para usuário ${userId}`);

    res.status(200).json(reportData);
  } catch (error) {
    logger.error('Erro ao gerar relatório social');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/reports/code
 * Relatório de análise de código multi-linguagem
 */
router.get('/code', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    // Mock code analysis data
    const mockFiles = [
      {
        content: `
          function calculateTotal(items) {
            let total = 0;
            for (let i = 0; i < items.length; i++) {
              total += items[i].price;
            }
            return total;
          }
          
          class ShoppingCart {
            constructor() {
              this.items = [];
            }
            
            addItem(item) {
              this.items.push(item);
            }
          }
        `,
        language: 'javascript',
        filename: 'shopping-cart.js'
      },
      {
        content: `
          def calculate_total(items):
              total = 0
              for item in items:
                  total += item['price']
              return total
          
          class ShoppingCart:
              def __init__(self):
                  self.items = []
              
              def add_item(self, item):
                  self.items.append(item)
        `,
        language: 'python',
        filename: 'shopping_cart.py'
      },
      {
        content: `
          public class ShoppingCart {
              private List<Item> items;
              
              public ShoppingCart() {
                  this.items = new ArrayList<>();
              }
              
              public double calculateTotal() {
                  double total = 0;
                  for (Item item : items) {
                      total += item.getPrice();
                  }
                  return total;
              }
              
              public void addItem(Item item) {
                  items.add(item);
              }
          }
        `,
        language: 'java',
        filename: 'ShoppingCart.java'
      },
      {
        content: `
          <div class="container">
            <h1>Meu Carrinho</h1>
            <div id="items-list">
              <!-- Items will be rendered here -->
            </div>
            <div class="total">
              <span>Total: R$ <span id="total-amount">0,00</span></span>
            </div>
          </div>
        `,
        language: 'html',
        filename: 'cart.html'
      },
      {
        content: `
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          
          .total {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
            text-align: right;
            font-size: 1.2em;
            font-weight: bold;
          }
        `,
        language: 'css',
        filename: 'styles.css'
      }
    ];

    // Analyze code complexity
    const codeMetrics = analyzeMultipleFiles(mockFiles);
    const analysisReport = generateCodeAnalysisReport(codeMetrics);

    // Generate detailed metrics
    const detailedMetrics = mockFiles.map(file => {
      const codeMetrics = analyzeCodeComplexity(file.content, file.language);
      
      // Mock performance metrics
      const performanceMetrics = calculatePerformanceMetrics(codeMetrics, Math.random() * 100);
      
      // Mock quality metrics
      const qualityMetrics = calculateQualityMetrics(codeMetrics, {
        passed: Math.floor(Math.random() * 10) + 5,
        failed: Math.floor(Math.random() * 3),
        total: 10
      });
      
      // Mock security metrics
      const securityMetrics = calculateSecurityMetrics(codeMetrics, {
        vulnerabilities: Math.floor(Math.random() * 5),
        critical: Math.floor(Math.random() * 2),
        high: Math.floor(Math.random() * 3),
        medium: Math.floor(Math.random() * 5),
        low: Math.floor(Math.random() * 10)
      });
      
      // Mock development metrics
      const developmentMetrics = calculateDevelopmentMetrics(
        { start: new Date('2026-01-01'), end: new Date() },
        {
          commits: Math.floor(Math.random() * 50) + 10,
          linesAdded: Math.floor(Math.random() * 1000) + 100,
          linesRemoved: Math.floor(Math.random() * 200) + 10,
          featuresCompleted: Math.floor(Math.random() * 5) + 1,
          bugsFixed: Math.floor(Math.random() * 10) + 1
        }
      );

      return generateMetricsReport(
        codeMetrics,
        performanceMetrics,
        qualityMetrics,
        securityMetrics,
        developmentMetrics
      );
    });

    const reportData = {
      summary: analysisReport.summary,
      language_breakdown: analysisReport.languageBreakdown,
      files: detailedMetrics,
      recommendations: analysisReport.recommendations,
      generated_at: new Date().toISOString()
    };

    logger.info(`Relatório de análise de código gerado para usuário ${userId}`);

    res.status(200).json(reportData);
  } catch (error) {
    logger.error('Erro ao gerar relatório de análise de código');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/reports/export/:format
 * Exportar relatório em múltiplos formatos
 */
router.get('/export/:format', verifyToken, (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const { format } = req.params;
    const { report_type = 'reading' } = req.query;

    if (!['pdf', 'csv', 'json'].includes(String(format))) {
      res.status(400).json({ error: 'Formato inválido. Use: pdf, csv, json' });
      return;
    }

    logger.info(`Relatório de ${report_type} exportado em formato ${format} para usuário ${userId}`);

    // Mock export
    const mockData = {
      report_type,
      format,
      export_date: new Date().toISOString(),
      file_size: '250KB',
    };

    res.status(200).json({
      success: true,
      message: `Relatório exportado em ${String(format).toUpperCase()}`,
      download_url: `/api/reports/download/${report_type}_${Date.now()}.${format}`,
      ...mockData,
    });
  } catch (error) {
    logger.error('Erro ao exportar relatório');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;