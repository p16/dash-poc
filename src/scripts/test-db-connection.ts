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

async function main() {
  try {
    // Use console.warn for info messages (allowed by ESLint)
    console.warn('Testing database connection...');
    await testConnection();
    console.warn('✅ Database connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();

