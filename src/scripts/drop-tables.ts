import { Pool } from 'pg';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sql = readFileSync('drop-tables.sql', 'utf-8');

pool.query(sql)
  .then(() => {
    console.log('Tables dropped successfully');
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
