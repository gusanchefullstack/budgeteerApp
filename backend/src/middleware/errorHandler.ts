import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from './AppError';

/**
 * Global error handler — must be the last middleware registered on the app.
 * Maps AppError, Prisma errors, and unexpected errors to consistent JSON responses.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // Known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined && { details: err.details }),
    });
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({ success: false, message: 'A record with that value already exists' });
        return;
      case 'P2025':
        res.status(404).json({ success: false, message: 'Record not found' });
        return;
      default:
        res.status(400).json({ success: false, message: 'Database request error', code: err.code });
        return;
    }
  }

  // Prisma validation errors (schema mismatch)
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, message: 'Invalid data supplied to the database' });
    return;
  }

  // Unexpected errors — do not leak internals in production
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
}
