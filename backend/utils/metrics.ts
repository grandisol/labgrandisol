import { performance } from 'perf_hooks';
import { Request, Response, NextFunction } from 'express';
import logger from './logger';

interface Metrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    byEndpoint: Record<string, number>;
    byMethod: Record<string, number>;
    responseTime: number[];
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  database: {
    queries: number;
    avgQueryTime: number;
    slowQueries: number;
  };
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  };
}

class MetricsCollector {
  private metrics: Metrics;
  private startTime: number;

  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {},
        byMethod: {},
        responseTime: []
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      database: {
        queries: 0,
        avgQueryTime: 0,
        slowQueries: 0
      },
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
    this.startTime = Date.now();
  }

  recordRequest(method: string, endpoint: string, statusCode: number, responseTime: number) {
    this.metrics.requests.total++;
    this.metrics.requests.responseTime.push(responseTime);
    
    if (statusCode >= 200 && statusCode < 300) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    this.metrics.requests.byEndpoint[endpoint] = (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
  }

  recordCacheHit() {
    this.metrics.cache.hits++;
    this.updateCacheHitRate();
  }

  recordCacheMiss() {
    this.metrics.cache.misses++;
    this.updateCacheHitRate();
  }

  recordDatabaseQuery(queryTime: number) {
    this.metrics.database.queries++;
    this.metrics.database.avgQueryTime = this.calculateAvgQueryTime(queryTime);
    
    if (queryTime > 1000) { // Queries slower than 1 second
      this.metrics.database.slowQueries++;
    }
  }

  private updateCacheHitRate() {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 ? (this.metrics.cache.hits / total) * 100 : 0;
  }

  private calculateAvgQueryTime(currentTime: number): number {
    const times = this.metrics.database.queries > 0 
      ? this.metrics.database.avgQueryTime * (this.metrics.database.queries - 1) + currentTime
      : currentTime;
    return times / this.metrics.database.queries;
  }

  getMetrics(): Metrics {
    this.metrics.system.memoryUsage = process.memoryUsage();
    this.metrics.system.uptime = process.uptime();
    return { ...this.metrics };
  }

  getHealthStatus(): { status: string; checks: any } {
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    const responseTimeAvg = this.metrics.requests.responseTime.length > 0 
      ? this.metrics.requests.responseTime.reduce((a, b) => a + b, 0) / this.metrics.requests.responseTime.length 
      : 0;

    const checks = {
      memory: {
        status: memoryUsagePercent < 80 ? 'healthy' : 'warning',
        usage: `${Math.round(memoryUsagePercent)}%`
      },
      responseTime: {
        status: responseTimeAvg < 500 ? 'healthy' : 'warning',
        avg: `${Math.round(responseTimeAvg)}ms`
      },
      cache: {
        status: this.metrics.cache.hitRate > 50 ? 'healthy' : 'warning',
        hitRate: `${Math.round(this.metrics.cache.hitRate)}%`
      },
      database: {
        status: this.metrics.database.slowQueries < 10 ? 'healthy' : 'warning',
        slowQueries: this.metrics.database.slowQueries
      }
    };

    const overallStatus = Object.values(checks).every(check => check.status === 'healthy') 
      ? 'healthy' 
      : 'warning';

    return { status: overallStatus, checks };
  }
}

export const metricsCollector = new MetricsCollector();

// Middleware para coletar métricas de requisições
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    metricsCollector.recordRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      responseTime
    );
  });
  
  next();
}

// Função para gerar relatórios de métricas
export function generateMetricsReport(): string {
  const metrics = metricsCollector.getMetrics();
  const health = metricsCollector.getHealthStatus();
  
  return `
=== RELATÓRIO DE MÉTRICAS ===
Tempo de execução: ${Math.floor(process.uptime())}s
Status geral: ${health.status}

=== REQUISIÇÕES ===
Total: ${metrics.requests.total}
Sucesso: ${metrics.requests.successful}
Falhas: ${metrics.requests.failed}
Tempo médio de resposta: ${Math.round(metrics.requests.responseTime.reduce((a, b) => a + b, 0) / metrics.requests.responseTime.length || 0)}ms

=== CACHE ===
Taxa de acerto: ${Math.round(metrics.cache.hitRate)}%
Hits: ${metrics.cache.hits}
Misses: ${metrics.cache.misses}

=== BANCO DE DADOS ===
Consultas: ${metrics.database.queries}
Tempo médio: ${Math.round(metrics.database.avgQueryTime)}ms
Consultas lentas: ${metrics.database.slowQueries}

=== SISTEMA ===
Uso de memória: ${Math.round((metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal) * 100)}%
Heap total: ${Math.round(metrics.system.memoryUsage.heapTotal / 1024 / 1024)}MB
Heap usado: ${Math.round(metrics.system.memoryUsage.heapUsed / 1024 / 1024)}MB
`;
}