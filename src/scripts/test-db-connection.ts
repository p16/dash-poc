/**
 * Test script for database connectivity
 * Run with: npx tsx src/scripts/test-db-connection.ts
 * Or: npm run test:db
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { testConnection, closePool } from '../lib/db/connection';
import { logger } from '../lib/utils/logger';

async function main() {
  try {
    logger.info('Testing database connection');
    await testConnection();
    logger.info('Database connection test passed');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Database connection test failed');
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();

