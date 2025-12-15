/**
 * Deep Inspect Analysis Structure
 *
 * Look at the exact structure of the most recent analysis
 * to understand the undefined price issue
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

import { getPool } from '../lib/db/connection';

async function deepInspect() {
  const pool = getPool();

  try {
    console.log('\n🔍 Deep inspecting most recent analysis...\n');

    const result = await pool.query(
      `SELECT
        id,
        created_at,
        analysis_result
      FROM analyses
      ORDER BY created_at DESC
      LIMIT 1`
    );

    if (result.rows.length === 0) {
      console.log('No analyses found.');
      return;
    }

    const analysis = result.rows[0];
    console.log(`Analysis ID: ${analysis.id}`);
    console.log(`Created: ${new Date(analysis.created_at).toLocaleString()}\n`);

    const data = analysis.analysis_result;

    // Look at first O2 product in detail
    if (Array.isArray(data?.o2_products_analysis) && data.o2_products_analysis.length > 0) {
      const firstProduct = data.o2_products_analysis[0];

      console.log('First O2 Product Structure:');
      console.log('==========================\n');

      console.log('product_name:', firstProduct.product_name);
      console.log('data_tier:', firstProduct.data_tier);
      console.log('roaming_tier:', firstProduct.roaming_tier);

      console.log('\nproduct_breakdown object keys:');
      if (firstProduct.product_breakdown) {
        Object.keys(firstProduct.product_breakdown).forEach(key => {
          const value = firstProduct.product_breakdown[key];
          console.log(`  ${key}: ${JSON.stringify(value)} (${typeof value})`);
        });
      }

      console.log('\n\nFirst comparable product:');
      if (Array.isArray(firstProduct.comparable_products) && firstProduct.comparable_products.length > 0) {
        const firstComparable = firstProduct.comparable_products[0];
        console.log('keys:');
        Object.keys(firstComparable).forEach(key => {
          const value = firstComparable[key];
          console.log(`  ${key}: ${JSON.stringify(value)} (${typeof value})`);
        });
      }

      console.log('\n\nFull product_breakdown object:');
      console.log(JSON.stringify(firstProduct.product_breakdown, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

deepInspect().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
