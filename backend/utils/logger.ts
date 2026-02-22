/**
 * Logger Estruturado com Type Safety
 * TypeScript Version
 */

import { LogLevel, LogEntry } from '../types/index.js';

const LOG_LEVELS: Record<LogLevel, { level: number; prefix: string }> = {
  DEBUG: { level: 0, prefix: '🔵 DEBUG' },
  INFO: { level: 1, prefix: '📘 INFO' },
  WARN: { level: 2, prefix: '⚠️  WARN' },
  ERROR: { level: 3, prefix: '🔴 ERROR' },
  CRITICAL: { level: 4, prefix: '💥 CRITICAL' }
};

const MIN_LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'INFO';

/**
 * Logger estruturado com type safety
 */
class Logger {
  private moduleName: string;
  private minLevel: number;

  constructor(moduleName: string = 'APP') {
    this.moduleName = moduleName;
    this.minLevel = LOG_LEVELS[MIN_LOG_LEVEL]?.level ?? 1;
  }

  /**
   * Formata log com timestamp e contexto
   */
  private format(level: LogLevel, message: string, metadata: Record<string, any> = {}): LogEntry {
    const timestamp = new Date().toISOString();
    const levelInfo = LOG_LEVELS[level];

    const logEntry: LogEntry = {
      timestamp,
      level,
      module: this.moduleName,
      message,
      ...metadata,
      env: process.env.NODE_ENV || 'development'
    };

    // Output formatado
    const formatted = `${levelInfo.prefix} [${timestamp}] [${this.moduleName}] ${message}`;

    if (Object.keys(metadata).length > 0) {
      console.log(formatted, metadata);
    } else {
      console.log(formatted);
    }

    return logEntry;
  }

  /**
   * Log de debug
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    if (LOG_LEVELS.DEBUG.level >= this.minLevel) {
      this.format('DEBUG', message, metadata);
    }
  }

  /**
   * Log de informação
   */
  public info(message: string, metadata?: Record<string, any>): void {
    if (LOG_LEVELS.INFO.level >= this.minLevel) {
      this.format('INFO', message, metadata);
    }
  }

  /**
   * Log de aviso
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    if (LOG_LEVELS.WARN.level >= this.minLevel) {
      this.format('WARN', message, metadata);
    }
  }

  /**
   * Log de erro
   */
  public error(message: string, error?: Error | null, metadata?: Record<string, any>): void {
    if (LOG_LEVELS.ERROR.level >= this.minLevel) {
      const errorData = error
        ? {
            errorMessage: error.message,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }
        : {};
      this.format('ERROR', message, { ...metadata, ...errorData });
    }
  }

  /**
   * Log crítico
   */
  public critical(message: string, error?: Error | null, metadata?: Record<string, any>): void {
    const errorData = error
      ? {
          errorMessage: error.message,
          errorStack: error.stack
        }
      : {};
    this.format('CRITICAL', message, { ...metadata, ...errorData });
  }

  /**
   * Log de requisição HTTP
   */
  public logRequest(method: string, path: string, statusCode: number, responseTime: number): void {
    const icon = statusCode >= 200 && statusCode < 300 ? '✅' : statusCode >= 400 && statusCode < 500 ? '⚠️' : '🔴';

    this.info(`${icon} ${method} ${path} [${statusCode}] ${responseTime}ms`, {
      type: 'HTTP_REQUEST',
      method,
      path,
      statusCode,
      responseTime
    });
  }

  /**
   * Log de autenticação
   */
  public logAuth(event: string, email: string, metadata?: Record<string, any>): void {
    this.info(`🔐 Auth: ${event} - ${email}`, {
      type: 'AUTH',
      event,
      email,
      ...metadata
    });
  }

  /**
   * Log de acesso (RBAC)
   */
  public logAccess(email: string, resource: string, allowed: boolean = true, metadata?: Record<string, any>): void {
    const icon = allowed ? '✅' : '❌';
    this.info(`${icon} Access: ${email} → ${resource}`, {
      type: 'ACCESS_CONTROL',
      email,
      resource,
      allowed,
      ...metadata
    });
  }

  /**
   * Log de auditoria
   */
  public logAudit(action: string, userId: number | undefined, resource: string, metadata?: Record<string, any>): void {
    this.info(`📋 Audit: ${action} on ${resource}`, {
      type: 'AUDIT',
      action,
      userId,
      resource,
      ...metadata
    });
  }
}

export default Logger;
