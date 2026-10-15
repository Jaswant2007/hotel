import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: firstIssue.message,
      field: firstIssue.path.join('.'),
      issues: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode === 429 ? 'RATE_LIMITED' : 'INTERNAL_ERROR');
  const message = err.message || 'An unexpected error occurred. Please try again.';

  const response: any = { code, message };

  if (err.field) response.field = err.field;
  if (err.retryAfter) {
    response.retryAfter = err.retryAfter;
    res.setHeader('Retry-After', String(err.retryAfter));
  }

  if (statusCode === 500) {
    console.error('[Unhandled Server Error]', err);
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
  });
}
