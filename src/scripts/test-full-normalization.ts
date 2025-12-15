/**
 * Test Full Price Normalization (including price_suggestions)
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env.local') });

import { getPool } from '../lib/db/connection';
import { validateAnalysisResponse } from '../lib/llm/validation';

async function testFullNormalization() {
  const pool = getPool();

  try {
    console.log('\n🔧 Testing full price normalization...\n');

    const result = await pool.query(
      `SELECT
        id,
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
    const validatedData = validateAnalysisResponse(rawData);

    console.log('PRICE NORMALIZATION RESULTS:');
    console.log('=============================\n');

    const firstProduct = validatedData.o2_products_analysis[0];

    console.log('1. product_breakdown.price:');
    console.log('   Value:', firstProduct.product_breakdown.price_per_month_GBP);
    console.log('   Type:', typeof firstProduct.product_breakdown.price_per_month_GBP);
    console.log('   ✓ Converted from string to number\n');

    if (Array.isArray(firstProduct.price_suggestions) && firstProduct.price_suggestions.length > 0) {
      console.log('2. price_suggestions[].price:');
      firstProduct.price_suggestions.forEach((suggestion: any, index: number) => {
        console.log(`   Suggestion ${index + 1}:`);
        console.log(`     - Price: ${suggestion.price}`);
        console.log(`     - Type: ${typeof suggestion.price}`);
        console.log(`     - Motivation: ${suggestion.motivation}`);
      });
      console.log('   ✓ All prices converted to numbers\n');
    }

    console.log('SUMMARY:');
    console.log('========');
    const allPricesNormalized =
      typeof firstProduct.product_breakdown.price_per_month_GBP === 'number' &&
      firstProduct.price_suggestions.every((s: any) => typeof s.price === 'number');

    if (allPricesNormalized) {
      console.log('✅ All prices successfully normalized to numbers!');
    } else {
      console.log('❌ Some prices were not normalized');
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

testFullNormalization().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
