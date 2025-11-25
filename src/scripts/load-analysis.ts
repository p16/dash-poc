/**
 * Load Analysis Script
 *
 * Outputs all rows from the analyses table for debugging and verification
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

import { getPool } from '../lib/db/connection';

async function loadAnalyses() {
  const pool = getPool();

  try {
    console.warn('Fetching all analyses from database...\n');

    const result = await pool.query(`
      SELECT
        id,
        comparison_type,
        brands,
        created_at,
        plan_ids
      FROM analyses
      ORDER BY created_at DESC
    `);    if (result.rows.length === 0) {
      console.warn('No analyses found in database.');
      return;
    }

    console.warn(`Found ${result.rows.length} analyses:\n`);
    console.warn('─'.repeat(120));

    result.rows.forEach((analysis, index) => {
      console.warn(`\n${index + 1}. ID: ${analysis.id}`);
      console.warn(`   Type: ${analysis.comparison_type}`);
      console.warn(`   Brands: ${analysis.brands.join(', ')}`);
      console.warn(`   Created: ${new Date(analysis.created_at).toLocaleString()}`);
      console.warn(`   Plan IDs: ${analysis.plan_ids.length} plans`);
      console.warn('─'.repeat(120));
    });

    console.warn(`\nTotal: ${result.rows.length} analyses`);
  } catch (error) {
    console.error('Error fetching analyses:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
loadAnalyses().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
