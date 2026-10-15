import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenService } from '../../src/modules/auth/token.service';
import * as dbModule from '../../src/db';

describe('Token Service & Refresh Token Rotation (Integration Tests)', () => {
  let tokenService: TokenService;
  // Mock DB store for token rotation lifecycle
  let tokensDb: any[] = [];

  beforeEach(() => {
    tokenService = new TokenService();
    tokensDb = [];

    // Mock query
    vi.spyOn(dbModule, 'query').mockImplementation(async (sql: string, params?: any[]) => {
      const lower = sql.toLowerCase().replace(/\s+/g, ' ');

      // INSERT
      if (lower.includes('insert into refresh_tokens')) {
        const id = 'rt-' + Math.random().toString(36).substring(2, 9);
        const record = {
          id,
          user_id: params![0],
          family_id: params![1],
          token_hash: params![2],
          expires_at: params![3],
          ip: params![4],
          user_agent: params![5],
          revoked_at: null,
          replaced_by: null,
          email: 'guest@harbourinn-hotel.com',
        };
        tokensDb.push(record);
        return { rows: [{ id }], rowCount: 1 } as any;
      }

      // SELECT by hash
      if (lower.includes('from refresh_tokens') && lower.includes('token_hash = $1')) {
        const hash = params![0];
        const match = tokensDb.find((t) => t.token_hash === hash);
        return { rows: match ? [match] : [], rowCount: match ? 1 : 0 } as any;
      }

      // UPDATE revoke family
      if (lower.includes('set revoked_at = now() where family_id = $1')) {
        const familyId = params![0];
        tokensDb.forEach((t) => {
          if (t.family_id === familyId) t.revoked_at = new Date();
        });
        return { rows: [], rowCount: 1 } as any;
      }

      // UPDATE replace predecessor
      if (lower.includes('set revoked_at = now(), replaced_by = $1 where id = $2')) {
        const newId = params![0];
        const oldId = params![1];
        const target = tokensDb.find((t) => t.id === oldId);
        if (target) {
          target.revoked_at = new Date();
          target.replaced_by = newId;
        }
        return { rows: [], rowCount: 1 } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });
  });

  it('should issue access tokens and valid refresh token families', async () => {
    const { rawToken, familyId } = await tokenService.createRefreshToken({
      userId: 'user-123',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });

    expect(rawToken).toBeDefined();
    expect(familyId).toBeDefined();
    expect(tokensDb).toHaveLength(1);
    expect(tokensDb[0].family_id).toBe(familyId);
  });

  it('should rotate a refresh token and return successor token', async () => {
    const { rawToken: token1, familyId } = await tokenService.createRefreshToken({
      userId: 'user-123',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });

    const rotateRes = await tokenService.rotateRefreshToken({
      rawToken: token1,
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });

    expect(rotateRes.success).toBe(true);
    expect(rotateRes.newRawToken).toBeDefined();
    expect(rotateRes.newRawToken).not.toBe(token1);
    expect(rotateRes.familyId).toBe(familyId);

    // Old token should be revoked and point to successor
    const oldToken = tokensDb.find((t) => t.token_hash === tokenService.hashRefreshToken(token1));
    expect(oldToken.revoked_at).not.toBeNull();
    expect(oldToken.replaced_by).toBeDefined();
  });

  it('should DETECT REUSE when an old revoked token is presented and revoke all family tokens', async () => {
    // 1. Initial token
    const { rawToken: token1, familyId } = await tokenService.createRefreshToken({
      userId: 'user-123',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });

    // 2. Legitimate rotation: token1 -> token2
    const rotate1 = await tokenService.rotateRefreshToken({
      rawToken: token1,
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });
    expect(rotate1.success).toBe(true);

    // 3. Attacker replays token1 (already used)
    const attackerReplay = await tokenService.rotateRefreshToken({
      rawToken: token1,
      ip: '198.51.100.22', // Suspicious IP
      userAgent: 'BadBot/1.0',
    });

    expect(attackerReplay.success).toBe(false);
    expect(attackerReplay.reuseDetected).toBe(true);
    expect(attackerReplay.familyId).toBe(familyId);

    // Entire token family must now be revoked
    const allInFamily = tokensDb.filter((t) => t.family_id === familyId);
    expect(allInFamily.every((t) => t.revoked_at !== null)).toBe(true);
  });
});
