import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { authService } from './auth.service';
import { RequestOtpSchema, VerifyOtpSchema, ResendOtpSchema } from './auth.validator';
import { config } from '../../config';

function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
) {
  // 1. Short-lived Access Token (15m) in HttpOnly Cookie
  res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    maxAge: 15 * 60 * 1000,
  });

  // 2. Rotating Refresh Token (30d) in HttpOnly Cookie scoped to /api/v1/auth
  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    path: '/api/v1/auth',
    maxAge: config.jwt.refreshExpiryDays * 24 * 60 * 60 * 1000,
  });

  // 3. CSRF token in client-readable cookie
  const csrf = crypto.randomBytes(24).toString('hex');
  res.cookie('csrf_token', csrf, {
    httpOnly: false,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    path: '/api/v1/auth',
  });
  res.clearCookie('csrf_token', {
    httpOnly: false,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
  });
}

export class AuthController {
  public async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = RequestOtpSchema.parse(req.body);
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await authService.requestOtp({
        ...validated,
        ip,
        userAgent,
      });

      return res.status(200).json({
        code: 'OTP_SENT',
        message: result.message,
        emailMasked: result.emailMasked,
        expiresAt: result.expiresAt,
        cooldownSeconds: result.cooldownSeconds,
      });
    } catch (err) {
      next(err);
    }
  }

  public async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = VerifyOtpSchema.parse(req.body);
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await authService.verifyOtp({
        ...validated,
        ip,
        userAgent,
      });

      setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      return res.status(200).json({
        code: 'AUTH_SUCCESS',
        message: 'Successfully authenticated.',
        user: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  public async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = ResendOtpSchema.parse(req.body);
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await authService.requestOtp({
        ...validated,
        ip,
        userAgent,
      });

      return res.status(200).json({
        code: 'OTP_RESENT',
        message: result.message,
        emailMasked: result.emailMasked,
        expiresAt: result.expiresAt,
        cooldownSeconds: result.cooldownSeconds,
      });
    } catch (err) {
      next(err);
    }
  }

  public async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies?.refresh_token;
      if (!rawRefreshToken) {
        clearAuthCookies(res);
        return res.status(401).json({
          code: 'REFRESH_TOKEN_REQUIRED',
          message: 'No refresh token provided in secure cookie.',
        });
      }

      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const tokens = await authService.refreshSession({
        rawRefreshToken,
        ip,
        userAgent,
      });

      setAuthCookies(res, tokens);

      return res.status(200).json({
        code: 'SESSION_REFRESHED',
        message: 'Session refreshed successfully.',
      });
    } catch (err) {
      clearAuthCookies(res);
      next(err);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies?.refresh_token;
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await authService.logout(rawRefreshToken, req.user?.id, ip, userAgent);
      clearAuthCookies(res);

      return res.status(200).json({
        code: 'LOGGED_OUT',
        message: 'Current session logged out successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  public async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required.' });
      }

      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await authService.logoutAll(req.user.id, ip, userAgent);
      clearAuthCookies(res);

      return res.status(200).json({
        code: 'LOGGED_OUT_ALL',
        message: 'All devices and sessions revoked successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
