import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../modules/auth/token.service';
import { query } from '../db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  email_verified_at: Date | null;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check HttpOnly cookie first, then Bearer authorization header
    const token = req.cookies?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required to access this resource.',
      });
    }

    const payload = tokenService.verifyAccessToken(token);

    // Fetch user from DB
    const { rows } = await query<AuthenticatedUser>(
      `SELECT id, email, name, phone, email_verified_at, status 
       FROM users 
       WHERE id = $1 AND status = 'active'`,
      [payload.sub]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        code: 'USER_NOT_FOUND',
        message: 'User account not found or deactivated.',
      });
    }

    req.user = rows[0];
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired. Please refresh session.',
      });
    }
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication credentials.',
    });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return next();

    const payload = tokenService.verifyAccessToken(token);
    const { rows } = await query<AuthenticatedUser>(
      `SELECT id, email, name, phone, email_verified_at, status 
       FROM users 
       WHERE id = $1 AND status = 'active'`,
      [payload.sub]
    );

    if (rows.length > 0) req.user = rows[0];
    next();
  } catch {
    next();
  }
}
