/**
 * Clear Inngest Events Script
 *
 * Deletes all event IDs from the inngest_events table.
 * Usage: npm run clear:events
 *
 * Environment variables required:
 * - DATABASE_URL: PostgreSQL connection string
 */

import { config } from 'dotenv';
import pg from 'pg';
import { logger } from '../lib/utils/logger';

// Load environment variables
config({ path: '.env.local' });

const { Pool } = pg;

/**
 * Clear all event IDs from the database
 */
async function clearEvents(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

  try {
    logger.info('Clearing all event IDs from inngest_events table...');

    const result = await pool.query('DELETE FROM inngest_events');

    logger.info(
      { deletedCount: result.rowCount },
      'Successfully cleared event IDs'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to clear event IDs');
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
    await clearEvents();
    logger.info('✅ Event IDs cleared successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, '❌ Failed to clear event IDs');
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { clearEvents };
