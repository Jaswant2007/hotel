import Redis from 'ioredis';
import { config } from '../../config';

// In-memory sliding window fallback store
interface WindowEntry {
  timestamps: number[];
}
const inMemoryStore = new Map<string, WindowEntry>();

let redisClient: Redis | null = null;
let redisAvailable = false;

try {
  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => (times > 2 ? null : Math.min(times * 100, 1000)),
    lazyConnect: true,
  });

  redisClient
    .connect()
    .then(() => {
      redisAvailable = true;
      console.log('[RateLimiter] Connected to Redis for sliding window rate limiting.');
    })
    .catch(() => {
      redisAvailable = false;
      console.log('[RateLimiter] Redis not reachable; falling back to in-memory sliding window limiter.');
    });
} catch {
  redisAvailable = false;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Sliding window rate limiter.
 * @param key unique identifier (e.g. `otp:email:user@example.com` or `otp:ip:127.0.0.1`)
 * @param limit maximum allowed attempts in window
 * @param windowSeconds window duration in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const threshold = now - windowMs;

  if (redisAvailable && redisClient) {
    try {
      const multi = redisClient.multi();
      // Remove records older than current window
      multi.zremrangebyscore(key, 0, threshold);
      // Count records in window
      multi.zcard(key);
      // Add current request timestamp
      multi.zadd(key, now, `${now}-${Math.random()}`);
      // Set key expiry
      multi.expire(key, windowSeconds);

      const results = await multi.exec();
      if (results && results[1]) {
        const count = results[1][1] as number;
        if (count >= limit) {
          // Find earliest timestamp in window to compute retryAfter
          const earliest = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
          const earliestTs = earliest && earliest[1] ? parseFloat(earliest[1]) : threshold;
          const retryAfterSeconds = Math.ceil((earliestTs + windowMs - now) / 1000);
          return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.max(1, retryAfterSeconds),
          };
        }
        return {
          allowed: true,
          remaining: limit - (count + 1),
        };
      }
    } catch (err) {
      console.warn('[RateLimiter] Redis operation failed, using in-memory fallback:', err);
    }
  }

  // In-memory sliding window fallback
  const entry = inMemoryStore.get(key) || { timestamps: [] };
  // Filter out timestamps outside window
  entry.timestamps = entry.timestamps.filter((ts) => ts > threshold);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  entry.timestamps.push(now);
  inMemoryStore.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
  };
}

export function resetRateLimit(key: string): void {
  if (redisAvailable && redisClient) {
    redisClient.del(key).catch(() => {});
  }
  inMemoryStore.delete(key);
}
