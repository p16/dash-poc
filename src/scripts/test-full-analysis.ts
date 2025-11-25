/**
 * Test Script: Full Analysis
 *
 * This script runs a full competitive analysis (all brands) locally
 * to inspect the data structure and validate the response format.
 *
 * Usage:
 *   npm run test:full-analysis
 */

import { generateAnalysis } from '@/lib/llm/analysis';
import { getPool } from '@/lib/db/connection';
import type { PlanDataForAnalysis } from '@/lib/llm/analysis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testFullAnalysis() {
  const startTime = Date.now();

  console.warn('\n=== Full Competitive Analysis Test ===');
  console.warn('Analyzing ALL brands in database');
  console.warn('=====================================\n');

  try {
    // Step 1: Fetch latest plan data from database
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
      ORDER BY source, plan_key, scrape_timestamp DESC
    `;

    const result = await pool.query<PlanDataForAnalysis>(planQuery);

    if (result.rows.length === 0) {
      console.error('❌ No plan data found in database');
      console.warn('\nPlease run scrapers first:');
      console.warn('  npm run scrape\n');
      process.exit(1);
    }

    // Extract unique brands
    const brands = [...new Set(result.rows.map((plan) => plan.source))].sort();
    const planCountByBrand = result.rows.reduce((acc, plan) => {
      acc[plan.source] = (acc[plan.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.warn(`✓ Found ${result.rows.length} plans from ${brands.length} brands\n`);
    console.warn('📊 Plans per brand:');
    brands.forEach(brand => {
      console.warn(`  ${brand}: ${planCountByBrand[brand]} plans`);
    });
    console.warn();

    // Step 2: Run the analysis
    console.warn('⏳ Running full analysis (this may take a minute)...');
    const analysisStartTime = Date.now();

    const analysisResult = await generateAnalysis({
      comparisonType: 'full',
      brands,
      planData: result.rows,
    });

    const analysisDuration = Date.now() - analysisStartTime;
    console.warn(`✅ Analysis completed in ${(analysisDuration / 1000).toFixed(2)}s`);
    console.warn(`   Cached: ${analysisResult.cached ? 'Yes (from database)' : 'No (freshly generated)'}`);
    console.warn(`   Analysis ID: ${analysisResult.analysisId}`);
    console.warn(`   Database: ${analysisResult.cached ? 'Retrieved from' : 'Saved to'} analyses table\n`);

    const data = analysisResult.data;

    // Step 3: Display structure summary
    console.warn('📊 Response Structure Summary:');
    console.warn('─────────────────────────────');
    console.warn(`✓ analysis_timestamp: ${data.analysis_timestamp || 'N/A'}`);
    console.warn(`✓ currency: ${data.currency || 'N/A'}`);
    console.warn(`✓ overall_competitive_sentiments: ${data.overall_competitive_sentiments?.length || 0} items`);
    console.warn(`✓ brand_a_products_analysis: ${data.brand_a_products_analysis?.length || 0} products`);
    console.warn(`✓ full_competitive_dataset_all_plans: ${data.full_competitive_dataset_all_plans?.length || 0} plans`);
    console.warn(`✓ products_not_considered: ${data.products_not_considered?.length || 0} products\n`);

    // Step 4: Display sample sentiment
    if (data.overall_competitive_sentiments && data.overall_competitive_sentiments.length > 0) {
      console.warn('📋 Sample Overall Sentiment:');
      console.warn('───────────────────────────');
      const sentiment = data.overall_competitive_sentiments[0];
      console.warn(`  Score: ${sentiment.score}`);
      console.warn(`  Sentiment: ${sentiment.sentiment}`);
      console.warn(`  Rationale: ${sentiment.rationale?.substring(0, 150)}...\n`);
    }

    // Step 5: Display sample product analysis
    if (data.brand_a_products_analysis && data.brand_a_products_analysis.length > 0) {
      const product = data.brand_a_products_analysis[0];
      console.warn('📦 Sample Product Analysis:');
      console.warn('──────────────────────────');
      console.warn('  Name: ' + product.product_name);
      console.warn('  Data Tier: ' + product.data_tier);
      console.warn('  Roaming Tier: ' + product.roaming_tier);
      const price = product.product_breakdown?.price_per_month_GBP ?? 'Unknown';
      console.warn('  Price: £' + price + '/mo');
      console.warn('  Contract: ' + product.product_breakdown?.contract);
      console.warn('  Data: ' + product.product_breakdown?.data);
      console.warn('  Competitiveness: ' + product.product_breakdown?.competitiveness_score);
      console.warn('  Comparable Products: ' + (product.comparable_products?.length || 0));

      // Show contract terms in comparable products
      if (product.comparable_products && product.comparable_products.length > 0) {
        const contractTerms = [...new Set(product.comparable_products.map((p: any) => p.contract))];
        console.warn('  Contract Terms Found: ' + contractTerms.join(', '));
      }
      console.warn();
    }

    // Step 6: Contract term analysis
    console.warn('📅 Contract Term Analysis:');
    console.warn('─────────────────────────');
    if (data.full_competitive_dataset_all_plans) {
      const contractTerms = data.full_competitive_dataset_all_plans.reduce((acc: any, plan: any) => {
        const term = plan.contract || 'Unknown';
        acc[term] = (acc[term] || 0) + 1;
        return acc;
      }, {});

      Object.entries(contractTerms).forEach(([term, count]) => {
        console.warn(`  ${term}: ${count} plans`);
      });
    }
    console.warn();

    // Step 7: Data quality checks
    console.warn('🔍 Data Quality Checks:');
    console.warn('───────────────────────');

    let hasIssues = false;

    // Check for null prices
    const productsWithNullPrice = data.brand_a_products_analysis?.filter(
      (p: any) => p.product_breakdown?.price_per_month_GBP === null
    ) || [];
    if (productsWithNullPrice.length > 0) {
      console.warn('⚠️  ' + productsWithNullPrice.length + ' products with null prices');
      hasIssues = true;
    }

    // Check contract term diversity in comparable products
    if (data.brand_a_products_analysis) {
      let allContractTerms = new Set<string>();
      data.brand_a_products_analysis.forEach((product: any) => {
        if (product.comparable_products) {
          product.comparable_products.forEach((p: any) => {
            if (p.contract) allContractTerms.add(p.contract);
          });
        }
      });

      console.warn(`✓ Found ${allContractTerms.size} unique contract terms in comparable products`);
      console.warn(`  Terms: ${Array.from(allContractTerms).join(', ')}`);

      if (allContractTerms.size < 3) {
        console.warn('⚠️  Expected at least 3 contract terms (1-month, 12-month, 24-month)');
        hasIssues = true;
      }
    }

    if (!hasIssues) {
      console.warn('✓ No data quality issues detected');
    }
    console.warn();

    // Step 8: Save to file
    const outputDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `full-analysis-${timestamp}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify({
      analysisId: analysisResult.analysisId,
      createdAt: analysisResult.createdAt,
      cached: analysisResult.cached,
      brands,
      planCount: result.rows.length,
      data: analysisResult.data,
    }, null, 2));

    console.warn('💾 Results saved to file: ' + filepath);
    console.warn(`💾 Analysis saved to database with ID: ${analysisResult.analysisId}`);

    // Cleanup
    await pool.end();

    const totalDuration = Date.now() - startTime;
    console.warn(`\n✅ Test completed in ${(totalDuration / 1000).toFixed(2)}s\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    const pool = getPool();
    await pool.end();
    process.exit(1);
  }
}

testFullAnalysis();
