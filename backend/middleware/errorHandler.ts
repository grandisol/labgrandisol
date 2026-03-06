/**
 * Error Handler Middleware - LabGrandisol
 * Sistema avançado de tratamento de erros
 */

import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger.js';

const logger = new Logger('ErrorHandler');

/**
 * Tipos de erro conhecidos
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

/**
 * Classe de erro estendida com mais contexto
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.code = code || type;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      type: this.type,
      timestamp: this.timestamp,
      ...(this.details && { details: this.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

/**
 * Erros específicos da aplicação
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorType.VALIDATION, message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autenticado') {
    super(ErrorType.AUTHENTICATION, message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(ErrorType.AUTHORIZATION, message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(ErrorType.NOT_FOUND, `${resource} não encontrado`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorType.CONFLICT, message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(
      ErrorType.RATE_LIMIT,
      'Muitas requisições. Por favor, tente novamente mais tarde.',
      429,
      'RATE_LIMIT_EXCEEDED',
      { retryAfter }
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorType.DATABASE, message, 503, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, details?: Record<string, any>) {
    super(
      ErrorType.EXTERNAL_SERVICE,
      `Erro ao conectar com ${service}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      details
    );
  }
}

/**
 * Interface para resposta de erro padronizada
 */
interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  type?: string;
  timestamp: string;
  requestId?: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * Converte erros conhecidos para AppError
 */
function normalizeError(error: any): AppError {
  // Já é um AppError
  if (error instanceof AppError) {
    return error;
  }

  // Erros do Express Validator
  if (error.name === 'ValidationError' && error.errors) {
    return new ValidationError('Dados inválidos', {
      fields: Object.keys(error.errors),
      messages: Object.values(error.errors).map((e: any) => e.message)
    });
  }

  // Erros de JWT
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Token inválido');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expirado');
  }

  // Erros de sintaxe JSON
  if (error.type === 'entity.parse.failed') {
    return new AppError(
      ErrorType.VALIDATION,
      'JSON malformado no corpo da requisição',
      400,
      'INVALID_JSON'
    );
  }

  // Erros de banco de dados
  if (error.code === '23505') { // PostgreSQL unique violation
    return new ConflictError('Este registro já existe');
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return new AppError(
      ErrorType.VALIDATION,
      'Registro referenciado não encontrado',
      400,
      'FOREIGN_KEY_VIOLATION'
    );
  }

  if (error.code === '23502') { // PostgreSQL not null violation
    return new ValidationError('Campo obrigatório não informado', { field: error.column });
  }

  if (error.code === 'ECONNREFUSED') {
    return new DatabaseError('Não foi possível conectar ao banco de dados');
  }

  // Erros de arquivo
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('Arquivo muito grande');
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Tipo de arquivo não permitido');
  }

  // Erro genérico
  return new AppError(
    ErrorType.INTERNAL,
    process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : error.message,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'development' ? { originalError: error.message } : undefined,
    false // Não é operacional
  );
}

/**
 * Middleware principal de tratamento de erros
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const normalizedError = normalizeError(error);
  const requestId = (req as any).requestId || 'unknown';

  // Log do erro
  if (normalizedError.statusCode >= 500) {
    logger.error('Server error', null, {
      requestId,
      errorMessage: normalizedError.message,
      type: normalizedError.type,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id,
      ip: req.ip
    });
  } else if (normalizedError.statusCode >= 400) {
    logger.warn('Client error', {
      requestId,
      errorMessage: normalizedError.message,
      type: normalizedError.type,
      path: req.path,
      method: req.method
    });
  }

  // Construir resposta
  const response: ErrorResponse = {
    success: false,
    error: normalizedError.message,
    code: normalizedError.code,
    type: normalizedError.type,
    timestamp: normalizedError.timestamp,
    requestId
  };

  // Adicionar detalhes se existirem
  if (normalizedError.details) {
    response.details = normalizedError.details;
  }

  // Adicionar stack trace em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    response.stack = normalizedError.stack;
  }

  // Enviar resposta
  res.status(normalizedError.statusCode).json(response);
}

/**
 * Wrapper para capturar erros em handlers async
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handler para rotas não encontradas (404)
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Rota ${req.method} ${req.path}`);
  next(error);
}

/**
 * Cria um middleware de validação customizado
 */
export function createValidator(
  rules: Record<string, (value: any) => boolean | string>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string> = {};

    for (const [field, validator] of Object.entries(rules)) {
      const value = req.body[field];
      const result = validator(value);
      
      if (result !== true) {
        errors[field] = typeof result === 'string' ? result : `Campo ${field} inválido`;
      }
    }

    if (Object.keys(errors).length > 0) {
      next(new ValidationError('Dados inválidos', { fields: errors }));
      return;
    }

    next();
  };
}

/**
 * Middleware para lidar com erros não capturados
 */
export function setupUncaughtExceptionHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.critical('Uncaught Exception', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any) => {
    logger.critical('Unhandled Rejection', new Error(
      reason instanceof Error ? reason.message : String(reason)
    ));
  });
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  createValidator,
  setupUncaughtExceptionHandlers
};