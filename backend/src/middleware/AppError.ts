/**
 * Custom error class for application-level errors.
 * Controllers pass these (or any Error) to next() — the global error handler
 * maps them to the appropriate HTTP response.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
