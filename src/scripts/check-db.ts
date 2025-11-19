import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function checkPlans() {
  const result = await pool.query('SELECT source, COUNT(*) as count FROM plans GROUP BY source ORDER BY source');
  console.warn('\n📊 Plans in Local Database:\n');
  result.rows.forEach(row => {
    console.warn(`  ${row.source.padEnd(15)} ${row.count} plans`);
  });
  console.warn('');

  const total = await pool.query('SELECT COUNT(*) as total FROM plans');
  console.warn(`  TOTAL:          ${total.rows[0].total} plans\n`);

  await pool.end();
}

checkPlans();
