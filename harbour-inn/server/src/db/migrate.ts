import fs from 'fs';
import path from 'path';
import { pool } from './index';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('[Migrations] Starting database migrations...');
    await client.query('BEGIN');

    // Create schema_migrations tracker table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows: appliedRows } = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(appliedRows.map((r) => r.version));

    for (const file of files) {
      if (!appliedVersions.has(file)) {
        console.log(`[Migrations] Applying ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        console.log(`[Migrations] Successfully applied ${file}`);
      } else {
        console.log(`[Migrations] Skipping already applied: ${file}`);
      }
    }

    await client.query('COMMIT');
    console.log('[Migrations] All migrations completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Migrations Error] Failed to apply migrations:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
