import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { query } from '../../db';

export interface TokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  family_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: Date;
}

export class TokenService {
  /**
   * Issue short-lived JWT Access Token (15 min)
   */
  public generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
      algorithm: 'HS256',
    });
  }

  /**
   * Verify JWT Access Token
   */
  public verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'] }) as TokenPayload;
  }

  /**
   * Generate cryptographically random refresh token string and hash
   */
  public generateRefreshToken(): { rawToken: string; hash: string } {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, hash };
  }

  /**
   * Hash raw refresh token
   */
  public hashRefreshToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Create new Refresh Token Family
   */
  public async createRefreshToken(params: {
    userId: string;
    familyId?: string;
    ip: string;
    userAgent: string;
  }): Promise<{ rawToken: string; familyId: string }> {
    const { rawToken, hash } = this.generateRefreshToken();
    const familyId = params.familyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + config.jwt.refreshExpiryDays * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [params.userId, familyId, hash, expiresAt, params.ip, params.userAgent]
    );

    return { rawToken, familyId };
  }

  /**
   * Rotate Refresh Token with Automatic Reuse Detection
   */
  public async rotateRefreshToken(params: {
    rawToken: string;
    ip: string;
    userAgent: string;
  }): Promise<{
    success: boolean;
    userId?: string;
    email?: string;
    newRawToken?: string;
    reuseDetected?: boolean;
    familyId?: string;
  }> {
    const tokenHash = this.hashRefreshToken(params.rawToken);

    // Find token record by hash
    const { rows } = await query<RefreshTokenRecord>(
      `SELECT rt.*, u.email 
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return { success: false };
    }

    const currentToken = rows[0];

    // REUSE DETECTION: If token is already revoked or already replaced, revoke ENTIRE family!
    if (currentToken.revoked_at !== null || currentToken.replaced_by !== null) {
      console.warn(
        `🚨 [SECURITY ALERT] Refresh token reuse detected for family ${currentToken.family_id}, user ${currentToken.user_id}! Revoking all sessions in family.`
      );
      await query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE family_id = $1`,
        [currentToken.family_id]
      );
      return {
        success: false,
        reuseDetected: true,
        userId: currentToken.user_id,
        familyId: currentToken.family_id,
      };
    }

    // Check expiration
    if (new Date() > new Date(currentToken.expires_at)) {
      await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`, [currentToken.id]);
      return { success: false };
    }

    // Generate successor token in the same family
    const { rawToken: nextRawToken, hash: nextHash } = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + config.jwt.refreshExpiryDays * 24 * 60 * 60 * 1000);

    // Insert successor
    const insertRes = await query<{ id: string }>(
      `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [currentToken.user_id, currentToken.family_id, nextHash, expiresAt, params.ip, params.userAgent]
    );
    const newId = insertRes.rows[0].id;

    // Invalidate predecessor and link replaced_by
    await query(
      `UPDATE refresh_tokens 
       SET revoked_at = NOW(), replaced_by = $1 
       WHERE id = $2`,
      [newId, currentToken.id]
    );

    return {
      success: true,
      userId: currentToken.user_id,
      email: (currentToken as any).email,
      newRawToken: nextRawToken,
      familyId: currentToken.family_id,
    };
  }

  /**
   * Revoke single session by raw token
   */
  public async revokeToken(rawToken: string): Promise<void> {
    const hash = this.hashRefreshToken(rawToken);
    await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`, [hash]);
  }

  /**
   * Revoke all sessions for a user (Log out all devices)
   */
  public async revokeAllUserTokens(userId: string): Promise<void> {
    await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1`, [userId]);
  }
}

export const tokenService = new TokenService();
