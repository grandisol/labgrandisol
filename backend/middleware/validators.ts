/**
 * Validadores de Entrada
 * Implementa validação seguindo padrões acadêmicos de sanitização
 */

import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import Logger from '../utils/logger.js';

const logger = new Logger('Validator');

/**
 * Middleware para tratar erros de validação
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Validation error', {
      type: 'VALIDATION_ERROR',
      endpoint: req.path,
      errors: errors.array()
    });

    res.status(400).json({
      error: 'Invalid data',
      details: errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
    return;
  }

  next();
}

/**
 * Validators para Authentication
 */
export const authValidators = {
  login: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email'),
    body('password')
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be 6-128 characters'),
    handleValidationErrors
  ] as ValidationChain[],

  register: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain: uppercase, lowercase, number, special char (@$!%*?&)'),
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      .withMessage('Name must be 3-100 characters (letters, space, hyphen)'),
    handleValidationErrors
  ] as ValidationChain[],

  refresh: [
    body('refreshToken')
      .isLength({ min: 10 })
      .withMessage('Invalid refresh token'),
    handleValidationErrors
  ] as ValidationChain[]
};

/**
 * Validators para operações de biblioteca
 */
export const libraryValidators = {
  createBook: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be 1-255 characters'),
    body('author')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Author must be 1-100 characters'),
    body('category')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be 1-50 characters'),
    body('isbn')
      .optional()
      .trim()
      .matches(/^[0-9\-X]+$/)
      .withMessage('Invalid ISBN format'),
    body('publicationYear')
      .optional()
      .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid publication year'),
    handleValidationErrors
  ] as ValidationChain[],

  createLoan: [
    body('bookId')
      .isInt({ min: 1 })
      .withMessage('Invalid book ID'),
    body('dueDate')
      .isISO8601()
      .withMessage('Invalid due date format'),
    handleValidationErrors
  ] as ValidationChain[],

  addRating: [
    body('bookId')
      .isInt({ min: 1 })
      .withMessage('Invalid book ID'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be 1-5'),
    body('review')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Review must be max 1000 characters'),
    handleValidationErrors
  ] as ValidationChain[]
};

/**
 * Validators para API
 */
export const apiValidators = {
  createNote: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be 1-200 characters'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 100000 })
      .withMessage('Content must be 1-100000 characters'),
    handleValidationErrors
  ] as ValidationChain[],

  updateNote: [
    body('id')
      .isInt({ min: 1 })
      .withMessage('Invalid ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be 1-200 characters'),
    body('content')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100000 })
      .withMessage('Content must be 1-100000 characters'),
    handleValidationErrors
  ] as ValidationChain[]
};

/**
 * Validators para Admin
 */
export const adminValidators = {
  updateUser: [
    body('userId')
      .isInt({ min: 1 })
      .withMessage('Invalid user ID'),
    body('role')
      .optional()
      .isIn(['user', 'librarian', 'admin'])
      .withMessage('Invalid role'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'banned'])
      .withMessage('Invalid status'),
    handleValidationErrors
  ] as ValidationChain[],

  createApiKey: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be 3-100 characters'),
    body('expiresIn')
      .optional()
      .isInt({ min: 3600 })
      .withMessage('Expiration must be positive (seconds)'),
    handleValidationErrors
  ] as ValidationChain[]
};

/**
 * Função auxiliar para validar query params
 */
export function validateQueryParams(req: Request, res: Response, next: NextFunction): void {
  const { limit, offset, sort } = req.query;

  // Validar limit
  if (limit) {
    const parsedLimit = parseInt(limit as string, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      res.status(400).json({
        error: 'Invalid limit parameter (1-1000)'
      });
      return;
    }
    (req as any).pagination = { ...(req as any).pagination, limit: parsedLimit };
  }

  // Validar offset
  if (offset) {
    const parsedOffset = parseInt(offset as string, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      res.status(400).json({
        error: 'Invalid offset parameter (>= 0)'
      });
      return;
    }
    (req as any).pagination = { ...(req as any).pagination, offset: parsedOffset };
  }

  // Validar sort
  if (sort) {
    const validSortFields = ['created_at', 'updated_at', 'name', 'email', 'title', 'author'];
    if (!validSortFields.includes(sort as string)) {
      res.status(400).json({
        error: `Invalid sort. Valid fields: ${validSortFields.join(', ')}`
      });
      return;
    }
    (req as any).pagination = { ...(req as any).pagination, sort };
  }

  next();
}

export default {
  authValidators,
  apiValidators,
  libraryValidators,
  adminValidators,
  handleValidationErrors,
  validateQueryParams
};
