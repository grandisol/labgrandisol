import Logger from './logger.js';
import { notificationService } from './notificationService.js';
import { metricsCollector } from './metrics.js';

const logger = new Logger('AlertManager');

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // Cooldown em milissegundos
  lastTriggered: number;
  enabled: boolean;
}

class AlertManager {
  private rules: AlertRule[] = [];
  private alertHistory: Array<{
    ruleId: string;
    timestamp: number;
    severity: string;
    message: string;
  }> = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Regra de memória alta
    this.addRule({
      id: 'high-memory-usage',
      name: 'Uso de Memória Alto',
      description: 'Alerta quando o uso de memória do heap ultrapassa 80%',
      condition: (metrics) => {
        const memoryUsage = (metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal) * 100;
        return memoryUsage > 80;
      },
      severity: 'high',
      cooldown: 300000, // 5 minutos
      enabled: true
    });

    // Regra de taxa de falhas alta
    this.addRule({
      id: 'high-failure-rate',
      name: 'Taxa de Falhas Alta',
      description: 'Alerta quando a taxa de falhas de requisições ultrapassa 10%',
      condition: (metrics) => {
        const total = metrics.requests.total;
        const failed = metrics.requests.failed;
        return total > 0 && (failed / total) > 0.1;
      },
      severity: 'high',
      cooldown: 180000, // 3 minutos
      enabled: true
    });

    // Regra de tempo de resposta alto
    this.addRule({
      id: 'high-response-time',
      name: 'Tempo de Resposta Alto',
      description: 'Alerta quando o tempo médio de resposta ultrapassa 1 segundo',
      condition: (metrics) => {
        const responseTimes = metrics.requests.responseTime;
        if (responseTimes.length === 0) return false;
        
        const avgTime = responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length;
        return avgTime > 1000;
      },
      severity: 'medium',
      cooldown: 120000, // 2 minutos
      enabled: true
    });

    // Regra de cache hit rate baixo
    this.addRule({
      id: 'low-cache-hit-rate',
      name: 'Taxa de Cache Baixa',
      description: 'Alerta quando a taxa de acerto do cache está abaixo de 30%',
      condition: (metrics) => {
        return metrics.cache.hitRate < 30;
      },
      severity: 'medium',
      cooldown: 600000, // 10 minutos
      enabled: true
    });

    // Regra de consultas lentas
    this.addRule({
      id: 'too-many-slow-queries',
      name: 'Muitas Consultas Lentas',
      description: 'Alerta quando há mais de 20 consultas lentas no banco de dados',
      condition: (metrics) => {
        return metrics.database.slowQueries > 20;
      },
      severity: 'high',
      cooldown: 300000, // 5 minutos
      enabled: true
    });

    // Regra de consultas muito lentas
    this.addRule({
      id: 'very-slow-queries',
      name: 'Consultas Muito Lentas',
      description: 'Alerta quando o tempo médio de consultas ultrapassa 5 segundos',
      condition: (metrics) => {
        return metrics.database.avgQueryTime > 5000;
      },
      severity: 'critical',
      cooldown: 180000, // 3 minutos
      enabled: true
    });
  }

  addRule(rule: Omit<AlertRule, 'lastTriggered'>) {
    const newRule: AlertRule = {
      ...rule,
      lastTriggered: 0
    };
    this.rules.push(newRule);
    logger.info(`Regra de alerta adicionada: ${rule.name}`);
  }

  removeRule(ruleId: string) {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    logger.info(`Regra de alerta removida: ${ruleId}`);
  }

  enableRule(ruleId: string) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = true;
      logger.info(`Regra de alerta habilitada: ${rule.name}`);
    }
  }

  disableRule(ruleId: string) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = false;
      logger.info(`Regra de alerta desabilitada: ${rule.name}`);
    }
  }

  checkAlerts() {
    const metrics = metricsCollector.getMetrics();
    const now = Date.now();

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Verifica cooldown
      if (now - rule.lastTriggered < rule.cooldown) continue;

      try {
        if (rule.condition(metrics)) {
          this.triggerAlert(rule, metrics);
          rule.lastTriggered = now;
        }
      } catch (error) {
        logger.error(`Erro ao avaliar regra de alerta: ${rule.name}`, error as Error);
      }
    }
  }

  private async triggerAlert(rule: AlertRule, metrics: any) {
    const message = this.generateAlertMessage(rule, metrics);
    
    // Registra no histórico
    this.alertHistory.push({
      ruleId: rule.id,
      timestamp: Date.now(),
      severity: rule.severity,
      message
    });

    // Limita histórico a 1000 entradas
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    // Envia notificação
    try {
      await notificationService.create({
        type: 'achievement' as const,
        title: `🚨 Alerta: ${rule.name}`,
        message,
        recipientId: 'admins',
        data: {
          ruleId: rule.id,
          ruleName: rule.name,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação de alerta', error as Error);
    }

    // Log do alerta
    logger.warn(`ALERTA ${rule.severity.toUpperCase()}: ${rule.name} - ${message}`);
  }

  private generateAlertMessage(rule: AlertRule, metrics: any): string {
    switch (rule.id) {
      case 'high-memory-usage':
        const memoryUsage = (metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal) * 100;
        return `Uso de memória: ${memoryUsage.toFixed(1)}% (acima de 80%)`;

      case 'high-failure-rate':
        const failureRate = (metrics.requests.failed / metrics.requests.total) * 100;
        return `Taxa de falhas: ${failureRate.toFixed(1)}% (acima de 10%)`;

      case 'high-response-time':
        const avgTime = metrics.requests.responseTime.reduce((sum: number, time: number) => sum + time, 0) / metrics.requests.responseTime.length;
        return `Tempo médio de resposta: ${avgTime.toFixed(0)}ms (acima de 1000ms)`;

      case 'low-cache-hit-rate':
        return `Taxa de acerto do cache: ${metrics.cache.hitRate.toFixed(1)}% (abaixo de 30%)`;

      case 'too-many-slow-queries':
        return `Consultas lentas: ${metrics.database.slowQueries} (acima de 20)`;

      case 'very-slow-queries':
        return `Tempo médio de consultas: ${metrics.database.avgQueryTime.toFixed(0)}ms (acima de 5000ms)`;

      default:
        return rule.description;
    }
  }

  getAlertHistory(limit: number = 100): Array<{
    ruleId: string;
    timestamp: number;
    severity: string;
    message: string;
  }> {
    return this.alertHistory.slice(-limit).reverse();
  }

  getActiveRules(): AlertRule[] {
    return this.rules.filter(rule => rule.enabled);
  }

  getRuleStatus(ruleId: string): {
    rule: AlertRule | null;
    lastTriggered: Date | null;
    nextPossibleTrigger: Date | null;
  } {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      return { rule: null, lastTriggered: null, nextPossibleTrigger: null };
    }

    const lastTriggered = rule.lastTriggered > 0 ? new Date(rule.lastTriggered) : null;
    const nextPossibleTrigger = rule.lastTriggered > 0 
      ? new Date(rule.lastTriggered + rule.cooldown)
      : null;

    return {
      rule,
      lastTriggered,
      nextPossibleTrigger
    };
  }

  clearHistory() {
    this.alertHistory = [];
    logger.info('Histórico de alertas limpo');
  }

  // Método para iniciar monitoramento automático
  startMonitoring(interval: number = 30000) {
    logger.info(`Iniciando monitoramento de alertas (intervalo: ${interval}ms)`);
    
    setInterval(() => {
      this.checkAlerts();
    }, interval);
  }
}

export const alertManager = new AlertManager();