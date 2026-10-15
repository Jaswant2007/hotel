import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit } from '../../src/modules/otp/rate-limiter';

describe('Sliding Window Rate Limiter (Unit Tests)', () => {
  const testKey = 'test:rate:limit:guest@example.com';

  beforeEach(() => {
    resetRateLimit(testKey);
  });

  it('should allow requests within limit and track remaining capacity', async () => {
    const res1 = await checkRateLimit(testKey, 3, 60);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await checkRateLimit(testKey, 3, 60);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await checkRateLimit(testKey, 3, 60);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it('should block requests that exceed limit and return retryAfterSeconds', async () => {
    await checkRateLimit(testKey, 2, 60);
    await checkRateLimit(testKey, 2, 60);

    const resBlocked = await checkRateLimit(testKey, 2, 60);
    expect(resBlocked.allowed).toBe(false);
    expect(resBlocked.remaining).toBe(0);
    expect(resBlocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(resBlocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });
});
