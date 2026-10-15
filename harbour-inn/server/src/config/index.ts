import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  db: {
    connectionString:
      process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/harbour_inn_db',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_min_32_characters_long_12345',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_min_32_characters_long_12345',
    accessExpiry: '15m',
    refreshExpiryDays: 30,
  },

  otp: {
    hmacSecret: process.env.OTP_HMAC_SECRET || 'dev_otp_hmac_secret_min_32_characters_long_12345',
    expiryMinutes: 10,
    maxAttempts: 5,
    cooldownSeconds: 30,
    rateLimit: {
      perEmail: { limit: 3, windowSeconds: 900 }, // 3 per 15 min
      perIp: { limit: 10, windowSeconds: 3600 },  // 10 per 1 hour
    },
  },

  csrf: {
    secret: process.env.CSRF_SECRET || 'dev_csrf_secret_min_32_characters_long_12345',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Harbour Inn <reservations@harbourinn-hotel.com>',
  },

  cookie: {
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    domain: process.env.COOKIE_DOMAIN || undefined,
    sameSite: (process.env.COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict' | 'none',
  },
};
