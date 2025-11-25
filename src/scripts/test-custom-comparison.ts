/**
 * Test Script: Custom Comparison
 *
 * This script runs a custom brand comparison locally to inspect the data structure
 * and validate the response format for the Next.js frontend.
 *
 * Usage:
 *   npm run test:comparison -- --brandA=O2 --brandB=Vodafone
 */

import { generateAnalysis } from '@/lib/llm/analysis';
import { getPool } from '@/lib/db/connection';
import type { PlanDataForAnalysis } from '@/lib/llm/analysis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface TestComparisonOptions {
  brandA: string;
  brandB: string;
  saveToFile?: boolean;
  outputDir?: string;
}

async function testCustomComparison(options: TestComparisonOptions) {
  const { brandA, brandB, saveToFile = true, outputDir = './test-results' } = options;

  console.warn('\n=== Custom Comparison Test ===');
  console.warn(`Brand A: ${brandA}`);
  console.warn(`Brand B: ${brandB}`);
  console.warn('==============================\n');

  try {
    // Step 1: Fetch plan data from database
    console.warn('⏳ Fetching plan data from database...');
    const pool = getPool();

    const planQuery = `
      SELECT DISTINCT ON (source, plan_key)
        id,
        source,
        plan_data,
        scrape_timestamp
      FROM plans
      WHERE scrape_timestamp > NOW() - INTERVAL '180 days'
        AND (source = $1 OR source = $2)
      ORDER BY source, plan_key, scrape_timestamp DESC
    `;

    const dbResult = await pool.query<PlanDataForAnalysis>(planQuery, [
      brandA,
      brandB,
    ]);

    if (dbResult.rows.length === 0) {
      console.error(`❌ No plan data found for brands: ${brandA}, ${brandB}`);
      console.warn('\nPlease run scrapers first or check brand names\n');
      await pool.end();
      process.exit(1);
    }

    const foundBrands = [...new Set(dbResult.rows.map((plan) => plan.source))];
    const missingBrands = [brandA, brandB].filter(
      (brand) => !foundBrands.includes(brand)
    );

    if (missingBrands.length > 0) {
      console.error(`❌ Missing data for brands: ${missingBrands.join(', ')}`);
      console.warn(`   Found data for: ${foundBrands.join(', ')}\n`);
      await pool.end();
      process.exit(1);
    }

    const planCountByBrand = dbResult.rows.reduce((acc, plan) => {
      acc[plan.source] = (acc[plan.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.warn(`✓ Found ${dbResult.rows.length} plans`);
    console.warn(`  ${brandA}: ${planCountByBrand[brandA]} plans`);
    console.warn(`  ${brandB}: ${planCountByBrand[brandB]} plans\n`);

    // Step 2: Run the comparison
    console.warn('⏳ Running comparison (this may take a minute)...');
    const startTime = Date.now();

    const analysisResult = await generateAnalysis({
      comparisonType: 'custom',
      brands: [brandA, brandB],
      planData: dbResult.rows,
    });

    const result = analysisResult.data;

    const duration = Date.now() - startTime;
    console.warn(`✅ Comparison completed in ${(duration / 1000).toFixed(2)}s`);
    console.warn(`   Cached: ${analysisResult.cached ? 'Yes (from database)' : 'No (freshly generated)'}`);
    console.warn(`   Analysis ID: ${analysisResult.analysisId}`);
    console.warn(`   Database: ${analysisResult.cached ? 'Retrieved from' : 'Saved to'} analyses table\n`);

    // Display structure summary
    console.warn('📊 Response Structure Summary:');
    console.warn('─────────────────────────────');
    console.warn(`✓ analysis_timestamp: ${result.analysis_timestamp}`);
    console.warn(`✓ currency: ${result.currency}`);
    console.warn(`✓ overall_competitive_sentiments: ${result.overall_competitive_sentiments?.length || 0} items`);
    console.warn(`✓ brand_a_products_analysis: ${result.brand_a_products_analysis?.length || 0} products`);
    console.warn(`✓ brand_b_products_analysis: ${result.brand_b_products_analysis?.length || 0} products`);
    console.warn(`✓ full_competitive_dataset_all_plans: ${result.full_competitive_dataset_all_plans?.length || 0} plans`);
    console.warn(`✓ products_not_considered: ${result.products_not_considered?.length || 0} products\n`);

    // Display sample sentiment
    if (result.overall_competitive_sentiments && result.overall_competitive_sentiments.length > 0) {
      const sentiment = result.overall_competitive_sentiments[0];
      console.warn('📋 Sample Sentiment:');
      console.warn('─────────────────────');
      console.warn(`  Score: ${sentiment.score}`);
      console.warn(`  Sentiment: ${sentiment.sentiment}`);
      console.warn(`  Rationale: ${sentiment.rationale?.substring(0, 100)}...\n`);
    }

    // Display sample product
    if (result.brand_a_products_analysis && result.brand_a_products_analysis.length > 0) {
      const product = result.brand_a_products_analysis[0];
      console.warn('📦 Sample ' + brandA + ' Product:');
      console.warn('─────────────────────────');
      console.warn('  Name: ' + product.product_name);
      console.warn('  Data Tier: ' + product.data_tier);
      console.warn('  Roaming Tier: ' + product.roaming_tier);
      const price = product.product_breakdown?.price_per_month_GBP ?? 'Unknown';
      console.warn('  Price: £' + price + '/mo');
      console.warn('  Contract: ' + product.product_breakdown?.contract);
      console.warn('  Data: ' + product.product_breakdown?.data);
      console.warn('  Competitiveness: ' + product.product_breakdown?.competitiveness_score);
      console.warn('  Comparable Products: ' + (product.comparable_products?.length || 0));
      console.warn('  Sentiments: ' + (product.brand_a_product_sentiments?.length || 0));
      console.warn('  Changes Suggested: ' + (product.brand_a_product_changes?.length || 0));
      console.warn('  Price Suggestions: ' + (product.price_suggestions?.length || 0) + '\n');
    }

    // Check for data quality issues
    console.warn('🔍 Data Quality Checks:');
    console.warn('───────────────────────');

    let hasIssues = false;

    // Check for null prices
    const productsWithNullPrice = result.brand_a_products_analysis?.filter(
      (p: any) => p.product_breakdown?.price_per_month_GBP === null
    ) || [];
    if (productsWithNullPrice.length > 0) {
      console.warn('⚠️  ' + productsWithNullPrice.length + ' products with null prices');
      hasIssues = true;
    }

    // Check for missing required fields
    const productsWithMissingFields = result.brand_a_products_analysis?.filter(
      (p: any) => !p.product_name || !p.data_tier || !p.roaming_tier
    ) || [];
    if (productsWithMissingFields.length > 0) {
      console.warn('⚠️  ' + productsWithMissingFields.length + ' products missing required fields');
      hasIssues = true;
    }

    // Check sentiment count
    if (result.overall_competitive_sentiments &&
        (result.overall_competitive_sentiments.length < 5 || result.overall_competitive_sentiments.length > 10)) {
      console.warn('⚠️  Sentiment count outside expected range (5-10): ' + result.overall_competitive_sentiments.length);
      hasIssues = true;
    }

    if (!hasIssues) {
      console.warn('✅ No data quality issues detected\n');
    } else {
      console.warn('');
    }

    // Save to file if requested
    if (saveToFile) {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = 'comparison-' + brandA + '-vs-' + brandB + '-' + timestamp + '.json';
      const filepath = path.join(outputDir, filename);

      fs.writeFileSync(filepath, JSON.stringify({
        analysisId: analysisResult.analysisId,
        createdAt: analysisResult.createdAt,
        cached: analysisResult.cached,
        brandA,
        brandB,
        data: result,
      }, null, 2));
      console.warn('💾 Results saved to file: ' + filepath);
      console.warn(`💾 Analysis saved to database with ID: ${analysisResult.analysisId}\n`);
    }

    // Display field type information for TypeScript
    console.warn('📝 TypeScript Interface Guidance:');
    console.warn('──────────────────────────────');
    console.warn('Based on this response, verify your types handle:');
    console.warn('  • price_per_month_GBP: number | null');
    console.warn('  • Optional arrays with ?.length checks');
    console.warn('  • Optional chaining for nested objects');
    console.warn('  • Fallback values for display (e.g., "Unknown")\n');

    // Cleanup
    await pool.end();

    return result;

  } catch (error) {
    console.error('❌ Comparison failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    const pool = getPool();
    await pool.end();
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: Partial<TestComparisonOptions> = {};

  args.forEach(arg => {
    const [key, value] = arg.split('=');
    const cleanKey = key.replace(/^--/, '');

    switch (cleanKey) {
      case 'brandA':
        options.brandA = value;
        break;
      case 'brandB':
        options.brandB = value;
        break;
      case 'saveToFile':
        options.saveToFile = value.toLowerCase() === 'true';
        break;
      case 'outputDir':
        options.outputDir = value;
        break;
    }
  });

  return options;
}

// Main execution
async function main() {
  const args = parseArgs();

  // Default to O2 vs Vodafone if not specified
  const brandA = args.brandA || 'O2';
  const brandB = args.brandB || 'Vodafone';

  await testCustomComparison({
    brandA,
    brandB,
    saveToFile: args.saveToFile ?? true,
    outputDir: args.outputDir,
  });
}

// Run if called directly
main()
  .then(() => {
    console.warn('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

export { testCustomComparison };
