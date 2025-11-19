/**
 * Show latest Vodafone plans from database
 */

import dotenv from 'dotenv';
import { getPool } from '../lib/db/connection';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function showVodafonePlans() {
  const pool = getPool();

  try {
    console.warn('📱 Fetching latest Vodafone plans...\n');

    // First, check what sources exist
    const sourcesResult = await pool.query(`
      SELECT DISTINCT source, COUNT(*) as count
      FROM plans
      GROUP BY source
      ORDER BY source
    `);

    console.warn('📊 Plans by source:');
    sourcesResult.rows.forEach(row => {
      console.warn(`  ${row.source}: ${row.count} plans`);
    });
    console.warn('');

    const result = await pool.query(`
      SELECT
        id,
        plan_key,
        plan_data,
        source,
        scrape_timestamp
      FROM plans
      WHERE LOWER(source) = 'vodafone'
      ORDER BY scrape_timestamp DESC
    `);

    console.warn(`✅ Found ${result.rows.length} Vodafone plans\n`);
    console.warn('=' .repeat(100));

    result.rows.forEach((row, index) => {
      const plan = row.plan_data;
      console.warn(`\n📋 Plan ${index + 1}/${result.rows.length}`);
      console.warn('-'.repeat(100));
      console.warn(`ID: ${row.id}`);
      console.warn(`Plan Key: ${row.plan_key}`);
      console.warn(`Scraped: ${row.scrape_timestamp}`);
      console.warn(`\nPlan Details:`);
      console.warn(`  Name: ${plan.name || 'N/A'}`);
      console.warn(`  Data: ${plan.data || 'N/A'}`);
      console.warn(`  Contract: ${plan.contract || 'N/A'}`);
      console.warn(`  Price: ${plan.price || 'Unknown'}`);
      console.warn(`  Roaming: ${plan.roaming || 'N/A'}`);
      console.warn(`  Extras: ${plan.extras || 'None'}`);
      console.warn(`  Speed: ${plan.speed || 'N/A'}`);
      console.warn(`  Notes: ${plan.notes || 'N/A'}`);
      console.warn(`  URL: ${plan.sourceUrl || 'N/A'}`);
    });

    console.warn('\n' + '='.repeat(100));
    console.warn(`\n✅ Total: ${result.rows.length} Vodafone plans`);

  } catch (error) {
    console.error('❌ Error fetching plans:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

showVodafonePlans();
