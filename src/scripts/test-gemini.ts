/**
 * Gemini API Full Analysis Workflow Test Script
 *
 * Replicates the full analysis workflow: fetch plans, call Gemini, parse response, save to DB
 * Run manually with: npx tsx src/scripts/test-gemini.ts
 *
 * Requires: GEMINI_API_KEY environment variable
 */

import dotenv from 'dotenv';
import { getPool } from '../lib/db/connection';
import { queryGeminiJson } from '../lib/llm/gemini';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface PlanData {
  id: string;
  source: string;
  plan_data: Record<string, any>;
  scrape_timestamp: Date;
}

async function testFullAnalysisWorkflow() {
  console.warn('=== Gemini Full Analysis Workflow Test ===\n');

  const pool = getPool();

  try {
    // Step 1: Fetch plan data from database (same as API)
    console.warn('Step 1: Fetching plan data from database...');
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

    const result = await pool.query<PlanData>(planQuery);
    console.warn(`✓ Fetched ${result.rows.length} plans`);

    if (result.rows.length === 0) {
      throw new Error('No plan data available in database');
    }

    // Step 2: Prepare brands and plan count
    const brands = [...new Set(result.rows.map((plan) => plan.source))].sort();
    const planCountByBrand = result.rows.reduce((acc, plan) => {
      acc[plan.source] = (acc[plan.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.warn(`✓ Brands: ${brands.join(', ')}`);
    console.warn('✓ Plan distribution:', planCountByBrand);
    console.warn();

    // Step 3: Load prompt template
    console.warn('Step 2: Loading prompt template...');
    const promptPath = path.join(
      process.cwd(),
      'src',
      'lib',
      'llm',
      'prompts',
      'prompt-full-analysis.txt'
    );
    const promptTemplate = await fs.readFile(promptPath, 'utf-8');
    console.warn(`✓ Loaded template (${promptTemplate.length} chars)\n`);

    // Step 4: Build analysis data (serialize plans)
    console.warn('Step 3: Building analysis data...');
    const analysisData = result.rows.map((plan) => ({
      brand: plan.source,
      plan: plan.plan_data,
    }));

    const prompt = promptTemplate
      .replace('{{BRAND_LIST}}', brands.join(', '))
      .replace('{{PLAN_DATA}}', JSON.stringify(analysisData, null, 2));

    console.warn(`✓ Prompt length: ${prompt.length} characters`);
    console.warn(`✓ Sending to Gemini with ${result.rows.length} plans\n`);

    // Step 5: Call Gemini API (JSON mode)
    console.warn('Step 4: Calling Gemini API...');
    const startTime = Date.now();

    const analysisResult = await queryGeminiJson(prompt);

    const duration = Date.now() - startTime;
    console.warn(`✓ Gemini API responded in ${(duration / 1000).toFixed(1)}s\n`);

    // Step 6: Validate response structure
    console.warn('Step 5: Validating response...');
    if (!analysisResult || typeof analysisResult !== 'object') {
      throw new Error('Invalid response: not an object');
    }

    const requiredFields = [
      'analysis_timestamp',
      'currency',
      'overall_competitive_sentiments',
      'o2_products_analysis',
    ];

    for (const field of requiredFields) {
      if (!(field in analysisResult)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    console.warn('✓ Response has required fields');
    console.warn(
      `✓ Sentiments: ${(analysisResult as any).overall_competitive_sentiments?.length || 0}`
    );
    console.warn(
      `✓ O2 products analyzed: ${(analysisResult as any).o2_products_analysis?.length || 0}`
    );
    console.warn();

    // Step 7: Save to database
    console.warn('Step 6: Saving analysis to database...');
    const planIds = result.rows.map((p) => p.id);

    const insertQuery = `
      INSERT INTO analyses (comparison_type, brands, analysis_result, plan_ids)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
    `;

    const insertResult = await pool.query(insertQuery, [
      'full',
      brands,
      analysisResult,
      planIds,
    ]);

    const { id: analysisId, created_at } = insertResult.rows[0];
    console.warn(`✓ Saved analysis with ID: ${analysisId}`);
    console.warn(`✓ Created at: ${created_at}\n`);

    // Step 8: Summary
    console.warn('=== Test Complete ===');
    console.warn(`✓ Full workflow executed successfully`);
    console.warn(`✓ Analysis ID: ${analysisId}`);
    console.warn(`✓ Total duration: ${(duration / 1000).toFixed(1)}s`);
    console.warn();
    console.warn('Analysis preview:');
    console.warn(JSON.stringify(analysisResult, null, 2).substring(0, 500) + '...');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    await pool.end();
    process.exit(1);
  }
}

// Run test
testFullAnalysisWorkflow();
