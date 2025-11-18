/**
 * Unified Data Collection Script
 *
 * Executes all 8 data collectors (7 telcos + 1 aggregator) sequentially
 * with comprehensive error reporting, success tracking, and result persistence.
 *
 * Story: 2.4 - Unified Data Collection Command & Error Reporting
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { scrapeAndStoreO2Plans } from '../lib/scraping/collectors/o2';
import { scrapeAndStoreVodafonePlans } from '../lib/scraping/collectors/vodafone';
import { scrapeAndStoreSkyPlans } from '../lib/scraping/collectors/sky';
import { scrapeAndStoreTescoPlans } from '../lib/scraping/collectors/tesco';
import { scrapeAndStoreThreePlans } from '../lib/scraping/collectors/three';
import { scrapeAndStoreGiffgaffPlans } from '../lib/scraping/collectors/giffgaff';
import { scrapeAndStoreSmartyPlans } from '../lib/scraping/collectors/smarty';
import { scrapeAndStoreUswitchPlans } from '../lib/scraping/collectors/uswitch';
import { logger } from '../lib/utils/logger';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Define collector configuration
interface CollectorConfig {
  name: string;
  scraper: () => Promise<number>;
  type: 'playwright' | 'api';
}

const COLLECTORS: CollectorConfig[] = [
  { name: 'O2', scraper: scrapeAndStoreO2Plans, type: 'playwright' },
  { name: 'Vodafone', scraper: scrapeAndStoreVodafonePlans, type: 'playwright' },
  { name: 'Sky', scraper: scrapeAndStoreSkyPlans, type: 'playwright' },
  { name: 'Tesco', scraper: scrapeAndStoreTescoPlans, type: 'playwright' },
  { name: 'Three', scraper: scrapeAndStoreThreePlans, type: 'playwright' },
  { name: 'Giffgaff', scraper: scrapeAndStoreGiffgaffPlans, type: 'playwright' },
  { name: 'Smarty', scraper: scrapeAndStoreSmartyPlans, type: 'api' },
  { name: 'Uswitch', scraper: scrapeAndStoreUswitchPlans, type: 'api' },
];

// Track results for each collector
interface CollectorResult {
  name: string;
  type: string;
  status: 'success' | 'failed';
  plansCollected: number;
  executionTime: number;
  error?: string;
}

/**
 * Save results to local JSON file for debugging
 */
async function saveResultsToFile(
  source: string,
  data: { plansCollected: number; timestamp: string; status: string; error?: string }
): Promise<void> {
  const resultsDir = path.join(process.cwd(), 'results');

  // Create results directory if it doesn't exist
  try {
    await fs.mkdir(resultsDir, { recursive: true });
  } catch (error) {
    logger.warn({ error, resultsDir }, 'Failed to create results directory');
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const filename = `${source.toLowerCase()}-${timestamp}.json`;
  const filepath = path.join(resultsDir, filename);

  // Save results
  try {
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
    logger.debug({ filepath }, 'Saved results to file');
  } catch (error) {
    logger.warn({ error, filepath }, 'Failed to save results to file');
  }
}

/**
 * Execute a single collector with error handling and timing
 */
async function executeCollector(config: CollectorConfig): Promise<CollectorResult> {
  const startTime = Date.now();

  logger.info({ source: config.name, type: config.type }, `▶️  Starting ${config.name} collector...`);

  try {
    const plansCollected = await config.scraper();
    const executionTime = Date.now() - startTime;

    logger.info(
      { source: config.name, plansCollected, executionTime },
      `✅ ${config.name}: Collected ${plansCollected} plans in ${(executionTime / 1000).toFixed(2)}s`
    );

    // Save successful results to file
    await saveResultsToFile(config.name, {
      plansCollected,
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    return {
      name: config.name,
      type: config.type,
      status: 'success',
      plansCollected,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(
      { source: config.name, error, executionTime },
      `❌ ${config.name}: Failed after ${(executionTime / 1000).toFixed(2)}s - ${errorMessage}`
    );

    // Save failed results to file
    await saveResultsToFile(config.name, {
      plansCollected: 0,
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: errorMessage,
    });

    return {
      name: config.name,
      type: config.type,
      status: 'failed',
      plansCollected: 0,
      executionTime,
      error: errorMessage,
    };
  }
}

/**
 * Generate and display summary report
 */
function displaySummary(results: CollectorResult[], totalExecutionTime: number): void {
  const successful = results.filter((r) => r.status === 'success');
  const failed = results.filter((r) => r.status === 'failed');
  const totalPlans = successful.reduce((sum, r) => sum + r.plansCollected, 0);
  const successRate = (successful.length / results.length) * 100;

  console.log('\n' + '='.repeat(80));
  console.log('📊 COLLECTION SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`📦 Total Plans Collected: ${totalPlans}`);
  console.log(`⏱️  Total Execution Time: ${(totalExecutionTime / 1000).toFixed(2)}s`);

  if (successful.length > 0) {
    console.log('\n✅ Successful Collectors:');
    successful.forEach((r) => {
      console.log(
        `   - ${r.name.padEnd(12)} | ${r.plansCollected.toString().padStart(3)} plans | ${(r.executionTime / 1000).toFixed(2)}s`
      );
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Collectors:');
    failed.forEach((r) => {
      console.log(`   - ${r.name.padEnd(12)} | ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  // Log structured summary
  logger.info(
    {
      successful: successful.length,
      failed: failed.length,
      successRate,
      totalPlans,
      totalExecutionTime,
    },
    'Collection summary'
  );

  // Check if success rate meets target (95%+)
  if (successRate < 95) {
    logger.warn(
      { successRate, target: 95 },
      'Success rate below 95% target'
    );
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('\n🚀 Starting unified data collection...\n');
  logger.info('Starting unified data collection for all sources');

  const overallStartTime = Date.now();
  const results: CollectorResult[] = [];

  // Execute all collectors sequentially (fail-safe execution)
  for (const collector of COLLECTORS) {
    const result = await executeCollector(collector);
    results.push(result);

    // Small delay between collectors to avoid overwhelming resources
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const totalExecutionTime = Date.now() - overallStartTime;

  // Display summary report
  displaySummary(results, totalExecutionTime);

  // Determine exit code based on success rate
  const successRate = (results.filter((r) => r.status === 'success').length / results.length) * 100;

  if (successRate >= 95) {
    console.log('\n✅ Collection completed successfully!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Collection completed with failures (below 95% success rate)\n');
    process.exit(1);
  }
}

// Execute main function
main().catch((error) => {
  logger.error({ error }, 'Unexpected error in unified collection script');
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
