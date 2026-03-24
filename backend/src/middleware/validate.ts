import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from './AppError';

type RequestTarget = 'body' | 'query' | 'params';

/**
 * Factory that returns an Express middleware validating req[target] against
 * the given Zod schema. On success, replaces req[target] with the parsed
 * (coerced + defaulted) value. On failure, calls next() with a 400 AppError.
 */
export function validate(schema: ZodSchema, target: RequestTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(new AppError(400, 'Validation failed', result.error.flatten()));
    }
    // Replace with coerced / defaulted value.
    // req.query is a read-only getter in Express 5, so mutate in-place instead
    // of reassigning the reference. body and params are writable, so the cast
    // assignment is fine for those two targets.
    if (target === 'query') {
      const q = req.query as Record<string, unknown>;
      Object.keys(q).forEach(k => delete q[k]);
      Object.assign(q, result.data);
    } else {
      (req as unknown as Record<string, unknown>)[target] = result.data;
    }
    next();
  };
}
