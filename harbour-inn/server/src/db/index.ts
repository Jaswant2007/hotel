import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';

// Primary PostgreSQL connection pool
export const pool = new Pool({
  connectionString: config.db.connectionString,
  max: config.db.max,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB Pool Error]', err);
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    return res;
  } catch (err: any) {
    console.error(`[DB Query Error] Query: "${text}"`, err?.message);
    throw err;
  }
}

export async function getClient() {
  return await pool.connect();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT 1 as alive');
    return res.rows[0]?.alive === 1;
  } catch {
    return false;
  }
}
