/**
 * Inspect Prices in Analysis Results
 *
 * Loads actual analysis data from database to see what Gemini
 * is returning for prices and verify the normalization fix works
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

import { getPool } from '../lib/db/connection';

async function inspectPrices() {
  const pool = getPool();

  try {
    console.log('\n📊 Inspecting prices in analysis results...\n');

    const result = await pool.query(
      `SELECT
        id,
        comparison_type,
        brands,
        created_at,
        analysis_result
      FROM analyses
      ORDER BY created_at DESC
      LIMIT 5`
    );

    if (result.rows.length === 0) {
      console.log('❌ No analyses found in database.');
      return;
    }

    console.log(`✅ Found ${result.rows.length} recent analyses\n`);
    console.log('='.repeat(100));

    result.rows.forEach((analysis, index) => {
      console.log(`\n📋 Analysis ${index + 1}:`);
      console.log(`   ID: ${analysis.id}`);
      console.log(`   Type: ${analysis.comparison_type}`);
      console.log(`   Brands: ${analysis.brands.join(', ')}`);
      console.log(`   Created: ${new Date(analysis.created_at).toLocaleString()}`);

      const data = analysis.analysis_result;

      // Check o2_products_analysis prices
      if (Array.isArray(data?.o2_products_analysis)) {
        console.log(`\n   O2 Products Analysis (${data.o2_products_analysis.length} products):`);

        data.o2_products_analysis.forEach((product: any, pIndex: number) => {
          console.log(`\n      Product ${pIndex + 1}: ${product.product_name}`);

          // Check product_breakdown price
          const pbPrice = product.product_breakdown?.price_per_month_GBP;
          console.log(`      - Product Breakdown Price: ${JSON.stringify(pbPrice)}`);
          console.log(`        Type: ${typeof pbPrice}, Is number: ${typeof pbPrice === 'number'}`);

          // Check comparable products prices
          if (Array.isArray(product.comparable_products)) {
            console.log(`      - Comparable Products (${product.comparable_products.length}):`);
            product.comparable_products.slice(0, 2).forEach((comp: any, cIndex: number) => {
              const compPrice = comp.price_per_month_GBP;
              console.log(`        ${cIndex + 1}. ${comp.brand}: ${JSON.stringify(compPrice)} (type: ${typeof compPrice})`);
            });
            if (product.comparable_products.length > 2) {
              console.log(`        ... and ${product.comparable_products.length - 2} more`);
            }
          }
        });
      }

      // Check full_competitive_dataset prices
      if (Array.isArray(data?.full_competitive_dataset_all_plans)) {
        const dataset = data.full_competitive_dataset_all_plans;
        console.log(`\n   Full Competitive Dataset (${dataset.length} plans):`);

        // Sample a few
        const samples = dataset.slice(0, 3);
        samples.forEach((plan: any, dIndex: number) => {
          const price = plan.price_per_month_GBP;
          console.log(`      ${dIndex + 1}. ${plan.brand} (${plan.contract}): ${JSON.stringify(price)} (type: ${typeof price})`);
        });

        if (dataset.length > 3) {
          console.log(`      ... and ${dataset.length - 3} more plans`);
        }

        // Analyze price format
        const priceExamples = dataset
          .map((p: any) => p.price_per_month_GBP)
          .filter((p: any) => p !== null && p !== undefined)
          .slice(0, 10);

        const hasStrings = priceExamples.some((p: any) => typeof p === 'string');
        const hasNumbers = priceExamples.some((p: any) => typeof p === 'number');
        const hasNulls = dataset.some((p: any) => p.price_per_month_GBP === null);

        console.log(`\n   Price Format Analysis:`);
        console.log(`      - Contains strings: ${hasStrings}`);
        console.log(`      - Contains numbers: ${hasNumbers}`);
        console.log(`      - Contains nulls: ${hasNulls}`);
        console.log(`      - Total plans: ${dataset.length}`);
      }

      console.log('\n' + '='.repeat(100));
    });

  } catch (error) {
    console.error('❌ Error inspecting prices:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
inspectPrices().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
