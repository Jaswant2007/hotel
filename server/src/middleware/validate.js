import { validationResult } from 'express-validator';

/** Collects express-validator errors into a 400 response. */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({
    message: errors.array()[0]?.msg || 'Validation failed',
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
}

/** 404 for unknown API routes. */
export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Central error handler — keeps stack traces out of production responses. */
export function errorHandler(err, req, res, _next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format' });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already registered` });
  }
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ message: first?.message || 'Validation failed' });
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.expose || status < 500 ? err.message : 'Something went wrong on our side',
  });
}
