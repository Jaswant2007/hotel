import { app } from './app';
import { config } from './config';
import { pool, query } from './db';

const server = app.listen(config.port, () => {
  console.log(`\n========================================================`);
  console.log(`🏨 Harbour Inn Authentication API running on port ${config.port}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🔒 Security: Helmet, HSTS, CSRF, Rate Limiting & HMAC-SHA256`);
  console.log(`🌐 Base URL: http://localhost:${config.port}/api/v1`);
  console.log(`========================================================\n`);
});

// Scheduled hourly purge of expired records
const PURGE_INTERVAL_MS = 60 * 60 * 1000;
setInterval(async () => {
  try {
    await query('SELECT purge_expired_auth_records()');
    console.log('[PurgeJob] Successfully cleaned up expired OTP and token records.');
  } catch (err: any) {
    // If function doesn't exist yet, run manual delete queries
    try {
      await query(`DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '24 hours'`);
      await query(`DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '30 days'`);
    } catch {
      // safe fallback
    }
  }
}, PURGE_INTERVAL_MS);

// Graceful Shutdown
function shutdown(signal: string) {
  console.log(`\n[Shutdown] Received ${signal}. Closing HTTP server and database pool...`);
  server.close(() => {
    pool.end(() => {
      console.log('[Shutdown] Closed all database connections. Process terminating.');
      process.exit(0);
    });
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
