import { pool } from './index';

export async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('[Seed] Seeding database with demo Harbour Inn guests...');
    await client.query('BEGIN');

    // Create demo verified guest
    const res = await client.query(`
      INSERT INTO users (email, name, phone, email_verified_at, status)
      VALUES 
        ('guest@harbourinn-hotel.com', 'Eleanor Vance', '+1 (555) 234-5678', NOW(), 'active'),
        ('alex.rivers@example.com', 'Alex Rivers', '+1 (555) 876-5432', NOW(), 'active')
      ON CONFLICT (email) DO UPDATE 
      SET name = EXCLUDED.name, email_verified_at = EXCLUDED.email_verified_at
      RETURNING id, email, name;
    `);

    console.log('[Seed] Seeded users:', res.rows);

    await client.query('COMMIT');
    console.log('[Seed] Database seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed Error] Failed to seed database:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
