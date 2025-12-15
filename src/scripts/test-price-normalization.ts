/**
 * Test Price Normalization
 *
 * Loads an analysis from DB and applies validation to see
 * if the price field gets converted to price_per_month_GBP
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env.local') });

import { getPool } from '../lib/db/connection';
import { validateAnalysisResponse } from '../lib/llm/validation';

async function testNormalization() {
  const pool = getPool();

  try {
    console.log('\n🔧 Testing price normalization...\n');

    const result = await pool.query(
      `SELECT
        id,
        created_at,
        analysis_result
      FROM analyses
      WHERE id = '50dba299-878a-4d71-974e-3100685b6311'
      LIMIT 1`
    );

    if (result.rows.length === 0) {
      console.log('Analysis not found.');
      return;
    }

    const analysis = result.rows[0];
    const rawData = analysis.analysis_result;

    console.log('BEFORE VALIDATION:');
    console.log('==================');
    const firstProduct = rawData.o2_products_analysis[0];
    console.log('product_breakdown keys:', Object.keys(firstProduct.product_breakdown));
    console.log('price field:', firstProduct.product_breakdown.price);
    console.log('price_per_month_GBP field:', firstProduct.product_breakdown.price_per_month_GBP);
    console.log('');

    // Apply validation which should normalize prices
    const validatedData = validateAnalysisResponse(rawData);

    console.log('AFTER VALIDATION:');
    console.log('==================');
    const validatedFirstProduct = validatedData.o2_products_analysis[0];
    console.log('product_breakdown keys:', Object.keys(validatedFirstProduct.product_breakdown));
    console.log('price field:', validatedFirstProduct.product_breakdown.price);
    console.log('price_per_month_GBP field:', validatedFirstProduct.product_breakdown.price_per_month_GBP);
    console.log('');

    // Show comparison
    console.log('RESULT:');
    console.log('========');
    if (validatedFirstProduct.product_breakdown.price_per_month_GBP !== undefined) {
      console.log('✅ Price successfully converted from "' +
        validatedFirstProduct.product_breakdown.price +
        '" to ' + validatedFirstProduct.product_breakdown.price_per_month_GBP);
    } else {
      console.log('❌ Price conversion failed');
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

testNormalization().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
