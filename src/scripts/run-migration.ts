/**
 * Database Migration Runner
 *
 * Executes SQL migration files against the Neon database.
 * Usage: npm run migrate
 *
 * Environment variables required:
 * - DATABASE_URL: PostgreSQL connection string
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import pg from 'pg';
import { logger } from '../lib/utils/logger';

// Load environment variables
config({ path: '.env.local' });

const { Pool } = pg;

/**
 * Execute a migration file
 */
async function runMigration(migrationFile: string): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // Single connection for migrations
  });

  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'migrations', migrationFile);
    logger.info({ migrationPath }, 'Reading migration file');

    const sql = readFileSync(migrationPath, 'utf-8');

    // Execute migration
    logger.info({ migrationFile }, 'Executing migration');
    await pool.query(sql);

    logger.info({ migrationFile }, 'Migration completed successfully');
  } catch (error) {
    logger.error({ error, migrationFile }, 'Migration failed');
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  // Validate environment
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Run initial schema migration
    await runMigration('001_initial_schema.sql');

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Migration process failed');
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { runMigration };
