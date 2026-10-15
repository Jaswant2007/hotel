import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // If no csrf_token cookie exists, set one
  let token = req.cookies?.csrf_token;
  if (!token) {
    token = crypto.randomBytes(24).toString('hex');
    res.cookie('csrf_token', token, {
      httpOnly: false, // Accessible by front-end to read and send in header
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      domain: config.cookie.domain,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  // Safe read-only methods don't require verification
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Skip CSRF check for initial unauthenticated OTP request/verify where cookies may not be present yet
  const openPaths = ['/api/v1/auth/otp/request', '/api/v1/auth/otp/verify', '/api/v1/auth/otp/resend'];
  if (openPaths.includes(req.path)) {
    return next();
  }

  // Double-submit token validation
  const headerToken = (req.headers['x-csrf-token'] || req.headers['x-xsrf-token']) as string;
  const cookieToken = req.cookies?.csrf_token;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({
      code: 'CSRF_INVALID',
      message: 'Invalid or missing CSRF token. Please reload the page.',
    });
  }

  next();
}
