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

    console.log('\n=== Plans by Source ===');
    console.table(sourceCount.rows);

    // Check plan_key values
    const keyCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_plans,
        COUNT(plan_key) as plans_with_key,
        COUNT(*) - COUNT(plan_key) as plans_without_key
      FROM plans
    `);

    console.log('\n=== Plan Key Status ===');
    console.table(keyCheck.rows);

    // Sample plan data
    const sample = await pool.query(`
      SELECT id, source, plan_key, plan_data, scrape_timestamp
      FROM plans
      ORDER BY scrape_timestamp DESC
      LIMIT 3
    `);

    console.log('\n=== Sample Plans (3 most recent) ===');
    sample.rows.forEach((row, idx) => {
      console.log(`\nPlan ${idx + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Source: ${row.source}`);
      console.log(`  Plan Key: ${row.plan_key || 'NULL (not normalized)'}`);
      console.log(`  Data: ${JSON.stringify(row.plan_data, null, 2)}`);
      console.log(`  Scraped: ${row.scrape_timestamp}`);
    });

  } catch (error) {
    console.error('Error verifying plans:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyPlans();
