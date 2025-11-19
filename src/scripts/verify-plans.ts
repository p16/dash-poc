/**
 * Verify Plans in Database
 * Quick script to check scraped plan data
 */

import * as dotenv from 'dotenv';
import { getPool } from '../lib/db/connection';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifyPlans() {
  const pool = getPool();

  try {
    // Count by source
    const sourceCount = await pool.query(`
      SELECT source, COUNT(*) as plan_count,
             MIN(scrape_timestamp) as first_scrape,
             MAX(scrape_timestamp) as last_scrape
      FROM plans
      GROUP BY source
      ORDER BY source
    `);

    console.warn('\n=== Plans by Source ===');
    console.warn(sourceCount.rows);

    // Check plan_key values
    const keyCheck = await pool.query(`
      SELECT
        COUNT(*) as total_plans,
        COUNT(plan_key) as plans_with_key,
        COUNT(*) - COUNT(plan_key) as plans_without_key
      FROM plans
    `);

    console.warn('\n=== Plan Key Status ===');
    console.warn(keyCheck.rows);

    // Sample plan data
    const sample = await pool.query(`
      SELECT id, source, plan_key, plan_data, scrape_timestamp
      FROM plans
      ORDER BY scrape_timestamp DESC
      LIMIT 3
    `);

    console.warn('\n=== Sample Plans (3 most recent) ===');
    sample.rows.forEach((row, idx) => {
      console.warn(`\nPlan ${idx + 1}:`);
      console.warn(`  ID: ${row.id}`);
      console.warn(`  Source: ${row.source}`);
      console.warn(`  Plan Key: ${row.plan_key || 'NULL (not normalized)'}`);
      console.warn(`  Data: ${JSON.stringify(row.plan_data, null, 2)}`);
      console.warn(`  Scraped: ${row.scrape_timestamp}`);
    });

  } catch (error) {
    console.error('Error verifying plans:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyPlans();
