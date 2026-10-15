import crypto from 'crypto';
import { query } from '../../db';
import { config } from '../../config';
import { checkRateLimit } from './rate-limiter';
import { normalizeEmail } from './disposable-email';

export interface OtpRecord {
  id: string;
  email: string;
  purpose: string;
  code_hash: string;
  expires_at: Date;
  attempts: number;
  consumed_at: Date | null;
  ip: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface VerifyOtpResult {
  success: boolean;
  code?: 'INVALID_CODE' | 'EXPIRED' | 'MAX_ATTEMPTS' | 'NOT_FOUND';
  message: string;
  remainingAttempts?: number;
}

export class OtpService {
  /**
   * Cryptographically secure 6-digit OTP generator
   */
  public generateOtpCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * HMAC-SHA256 hash using server secret
   */
  public hashOtpCode(code: string): string {
    return crypto
      .createHmac('sha256', config.otp.hmacSecret)
      .update(code.trim())
      .digest('hex');
  }

  /**
   * Constant-time comparison to prevent timing side-channel attacks
   */
  public compareHash(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Issue a new OTP with rate limiting & automatic invalidation of prior codes
   */
  public async createOtp(params: {
    email: string;
    purpose: 'signup' | 'login';
    ip: string;
    userAgent: string;
  }): Promise<{ code: string; expiresAt: Date; rateLimitRemaining: number }> {
    const email = normalizeEmail(params.email);

    // 1. Sliding window rate limit check (email)
    const emailLimit = await checkRateLimit(
      `otp:email:${email}`,
      config.otp.rateLimit.perEmail.limit,
      config.otp.rateLimit.perEmail.windowSeconds
    );
    if (!emailLimit.allowed) {
      const err = new Error(
        `Too many verification requests for this email. Please wait ${emailLimit.retryAfterSeconds} seconds before requesting another code.`
      );
      (err as any).statusCode = 429;
      (err as any).code = 'RATE_LIMITED';
      (err as any).retryAfter = emailLimit.retryAfterSeconds;
      throw err;
    }

    // 2. Sliding window rate limit check (IP)
    const ipLimit = await checkRateLimit(
      `otp:ip:${params.ip}`,
      config.otp.rateLimit.perIp.limit,
      config.otp.rateLimit.perIp.windowSeconds
    );
    if (!ipLimit.allowed) {
      const err = new Error(
        `Too many verification requests from your network. Please wait ${ipLimit.retryAfterSeconds} seconds.`
      );
      (err as any).statusCode = 429;
      (err as any).code = 'RATE_LIMITED';
      (err as any).retryAfter = ipLimit.retryAfterSeconds;
      throw err;
    }

    // 3. Invalidate any existing active OTPs for this email and purpose
    await query(
      `UPDATE otp_codes 
       SET consumed_at = NOW() 
       WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL`,
      [email, params.purpose]
    );

    // 4. Generate fresh 6-digit code and HMAC hash
    const plainOtp = this.generateOtpCode();
    const codeHash = this.hashOtpCode(plainOtp);
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

    // 5. Store hash in database (NEVER store plain code)
    await query(
      `INSERT INTO otp_codes (email, purpose, code_hash, expires_at, attempts, ip, user_agent)
       VALUES ($1, $2, $3, $4, 0, $5, $6)`,
      [email, params.purpose, codeHash, expiresAt, params.ip, params.userAgent]
    );

    return {
      code: plainOtp,
      expiresAt,
      rateLimitRemaining: emailLimit.remaining,
    };
  }

  /**
   * Verify candidate OTP using constant-time comparison and max-attempt thresholding
   */
  public async verifyOtp(params: {
    email: string;
    code: string;
    purpose: 'signup' | 'login';
  }): Promise<VerifyOtpResult> {
    const email = normalizeEmail(params.email);
    const candidateCode = params.code.trim();

    // 1. Fetch the latest active OTP record
    const { rows } = await query<OtpRecord>(
      `SELECT * FROM otp_codes 
       WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email, params.purpose]
    );

    if (rows.length === 0) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: 'No active verification code found. Please request a new code.',
      };
    }

    const record = rows[0];

    // 2. Check expiration
    if (new Date() > new Date(record.expires_at)) {
      await query(`UPDATE otp_codes SET consumed_at = NOW() WHERE id = $1`, [record.id]);
      return {
        success: false,
        code: 'EXPIRED',
        message: 'This verification code has expired. Please request a fresh code.',
      };
    }

    // 3. Check attempt limit
    if (record.attempts >= config.otp.maxAttempts) {
      await query(`UPDATE otp_codes SET consumed_at = NOW() WHERE id = $1`, [record.id]);
      return {
        success: false,
        code: 'MAX_ATTEMPTS',
        message: 'Too many incorrect attempts. For security, this code is now invalid. Please request a new code.',
      };
    }

    // 4. Increment attempts counter
    await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [record.id]);
    const currentAttempts = record.attempts + 1;

    // 5. Compute candidate HMAC and run constant-time comparison
    const candidateHash = this.hashOtpCode(candidateCode);
    const isMatch = this.compareHash(candidateHash, record.code_hash);

    if (!isMatch) {
      const remainingAttempts = Math.max(0, config.otp.maxAttempts - currentAttempts);
      if (remainingAttempts === 0) {
        await query(`UPDATE otp_codes SET consumed_at = NOW() WHERE id = $1`, [record.id]);
        return {
          success: false,
          code: 'MAX_ATTEMPTS',
          message: 'Too many incorrect attempts. This code is now invalid. Please request a new one.',
          remainingAttempts: 0,
        };
      }

      return {
        success: false,
        code: 'INVALID_CODE',
        message: `Incorrect 6-digit code. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`,
        remainingAttempts,
      };
    }

    // 6. Success: single-use invalidation
    await query(`UPDATE otp_codes SET consumed_at = NOW() WHERE id = $1`, [record.id]);

    return {
      success: true,
      message: 'Verification successful.',
    };
  }
}

export const otpService = new OtpService();
