import { query } from '../../db';
import { otpService } from '../otp/otp.service';
import { mailService } from '../mail/mail.service';
import { tokenService } from './token.service';
import { auditService } from '../audit/audit.service';
import { normalizeEmail } from '../otp/disposable-email';

export interface RequestOtpInput {
  email: string;
  purpose: 'signup' | 'login';
  name?: string;
  phone?: string;
  consent?: boolean;
  ip: string;
  userAgent: string;
}

export interface VerifyOtpInput {
  email: string;
  code: string;
  purpose: 'signup' | 'login';
  ip: string;
  userAgent: string;
}

export class AuthService {
  /**
   * Request a single-use 6-digit OTP code sent via email
   */
  public async requestOtp(input: RequestOtpInput) {
    const email = normalizeEmail(input.email);

    // Look up existing user (without leaking presence to the public response)
    const { rows: existingUsers } = await query(
      `SELECT id, name, email FROM users WHERE email = $1`,
      [email]
    );
    const existingUser = existingUsers[0];

    // Create OTP in DB (enforces rate limits per email & IP)
    const { code, expiresAt } = await otpService.createOtp({
      email,
      purpose: input.purpose,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    // Send email asynchronously
    const recipientName = input.name || existingUser?.name;
    mailService.sendOtpEmail({
      to: email,
      name: recipientName,
      code,
      expiryMinutes: 10,
      ip: input.ip,
      userAgent: input.userAgent,
    }).catch((err) => console.error('[Mail Worker Error]', err));

    // Audit log
    await auditService.log({
      userId: existingUser?.id || null,
      event: 'AUTH_OTP_REQUEST',
      ip: input.ip,
      userAgent: input.userAgent,
      metadata: { email, purpose: input.purpose },
    });

    // Generic response preventing user enumeration
    return {
      message: 'If the email provided is valid, a 6-digit verification code has been dispatched.',
      emailMasked: this.maskEmail(email),
      expiresAt,
      cooldownSeconds: 30,
    };
  }

  /**
   * Verify candidate OTP and initiate authenticated session
   */
  public async verifyOtp(input: VerifyOtpInput) {
    const email = normalizeEmail(input.email);

    // 1. Verify OTP code against HMAC hash
    const verification = await otpService.verifyOtp({
      email,
      code: input.code,
      purpose: input.purpose,
    });

    if (!verification.success) {
      await auditService.log({
        event: 'AUTH_OTP_VERIFY_FAIL',
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: { email, purpose: input.purpose, reason: verification.code },
      });

      const err = new Error(verification.message);
      (err as any).statusCode = 400;
      (err as any).code = verification.code;
      (err as any).remainingAttempts = verification.remainingAttempts;
      throw err;
    }

    // 2. Fetch or create user record
    let user: any;
    const { rows: existingUsers } = await query(
      `SELECT id, email, name, phone, email_verified_at, status FROM users WHERE email = $1`,
      [email]
    );

    if (existingUsers.length > 0) {
      user = existingUsers[0];
      // Mark verified if not already set
      if (!user.email_verified_at) {
        const updateRes = await query(
          `UPDATE users SET email_verified_at = NOW() WHERE id = $1 RETURNING *`,
          [user.id]
        );
        user = updateRes.rows[0];
      }
    } else {
      // Create fresh user account (sign up or seamless guest login)
      const defaultName = email.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);

      const insertRes = await query(
        `INSERT INTO users (email, name, email_verified_at, status)
         VALUES ($1, $2, NOW(), 'active')
         RETURNING id, email, name, phone, email_verified_at, status`,
        [email, formattedName]
      );
      user = insertRes.rows[0];
    }

    // 3. Issue short-lived JWT Access Token (15 min)
    const accessToken = tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
    });

    // 4. Issue Rotating Refresh Token (30 days)
    const { rawToken: refreshToken } = await tokenService.createRefreshToken({
      userId: user.id,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    // 5. Audit Log
    await auditService.log({
      userId: user.id,
      event: input.purpose === 'signup' ? 'AUTH_SIGNUP_COMPLETE' : 'AUTH_LOGIN_COMPLETE',
      ip: input.ip,
      userAgent: input.userAgent,
      metadata: { email: user.email },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        emailVerifiedAt: user.email_verified_at,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotate session tokens with reuse detection
   */
  public async refreshSession(params: {
    rawRefreshToken: string;
    ip: string;
    userAgent: string;
  }) {
    const result = await tokenService.rotateRefreshToken({
      rawToken: params.rawRefreshToken,
      ip: params.ip,
      userAgent: params.userAgent,
    });

    if (!result.success) {
      if (result.reuseDetected) {
        await auditService.log({
          userId: result.userId,
          event: 'AUTH_REFRESH_REUSE_DETECTED',
          ip: params.ip,
          userAgent: params.userAgent,
          metadata: { familyId: result.familyId },
        });
      }
      const err = new Error('Invalid or revoked session. Please log in again.');
      (err as any).statusCode = 401;
      (err as any).code = 'SESSION_REVOKED';
      throw err;
    }

    // Generate new Access Token
    const accessToken = tokenService.generateAccessToken({
      sub: result.userId!,
      email: result.email!,
    });

    await auditService.log({
      userId: result.userId!,
      event: 'AUTH_REFRESH_SUCCESS',
      ip: params.ip,
      userAgent: params.userAgent,
      metadata: { familyId: result.familyId },
    });

    return {
      accessToken,
      refreshToken: result.newRawToken!,
    };
  }

  /**
   * Log out current session
   */
  public async logout(rawRefreshToken: string, userId?: string, ip?: string, ua?: string) {
    if (rawRefreshToken) {
      await tokenService.revokeToken(rawRefreshToken);
    }
    if (userId) {
      await auditService.log({
        userId,
        event: 'AUTH_LOGOUT',
        ip: ip || 'unknown',
        userAgent: ua || 'unknown',
      });
    }
  }

  /**
   * Log out all devices (revoke all active tokens for user)
   */
  public async logoutAll(userId: string, ip?: string, ua?: string) {
    await tokenService.revokeAllUserTokens(userId);
    await auditService.log({
      userId,
      event: 'AUTH_LOGOUT_ALL',
      ip: ip || 'unknown',
      userAgent: ua || 'unknown',
    });
  }

  /**
   * Helper to mask email address: e.g. e***@example.com
   */
  public maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return email;
    if (user.length <= 2) return `${user.charAt(0)}***@${domain}`;
    return `${user.charAt(0)}***${user.charAt(user.length - 1)}@${domain}`;
  }
}

export const authService = new AuthService();
