/**
 * Telco Data Collection Orchestration
 * 
 * Runs all 7 telco collectors sequentially and stores raw data in database.
 * No normalization applied - data stored as-is.
 * 
 * Usage: npm run scrape:telcos
 */

import { config } from 'dotenv';
import { logger } from '../lib/utils/logger';
import { scrapeAndStoreO2Plans } from '../lib/scraping/collectors/o2';
import { scrapeAndStoreVodafonePlans } from '../lib/scraping/collectors/vodafone';
import { scrapeAndStoreSkyPlans } from '../lib/scraping/collectors/sky';
import { scrapeAndStoreTescoPlans } from '../lib/scraping/collectors/tesco';
import { scrapeAndStoreThreePlans } from '../lib/scraping/collectors/three';
import { scrapeAndStoreGiffgaffPlans } from '../lib/scraping/collectors/giffgaff';
import { scrapeAndStoreSmartyPlans } from '../lib/scraping/collectors/smarty';

// Load environment variables
config({ path: '.env.local' });

interface CollectorResult {
  source: string;
  planCount: number;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

/**
 * Run all telco collectors sequentially
 */
async function runAllCollectors(): Promise<void> {
  const startTime = Date.now();
  logger.info('Starting telco data collection');
  
  const results: CollectorResult[] = [];
  
  // Define collectors
  const collectors = [
    { name: 'O2', fn: scrapeAndStoreO2Plans },
    { name: 'Vodafone', fn: scrapeAndStoreVodafonePlans },
    { name: 'Sky', fn: scrapeAndStoreSkyPlans },
    { name: 'Tesco', fn: scrapeAndStoreTescoPlans },
    { name: 'Three', fn: scrapeAndStoreThreePlans },
    { name: 'Giffgaff', fn: scrapeAndStoreGiffgaffPlans },
    { name: 'Smarty', fn: scrapeAndStoreSmartyPlans },
  ];
  
  // Run each collector
  for (const collector of collectors) {
    try {
      logger.info({ source: collector.name }, 'Starting collector');
      
      const planCount = await collector.fn();
      
      results.push({
        source: collector.name,
        planCount,
        status: planCount > 0 ? 'success' : 'skipped',
      });
      
      logger.info({ source: collector.name, planCount }, 'Collector complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      results.push({
        source: collector.name,
        planCount: 0,
        status: 'failed',
        error: errorMessage,
      });
      
      logger.error({ source: collector.name, error: errorMessage }, 'Collector failed');
    }
  }
  
  // Summary
  const duration = Date.now() - startTime;
  const totalPlans = results.reduce((sum, r) => sum + r.planCount, 0);
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  
  logger.info(
    {
      duration: `${(duration / 1000).toFixed(2)}s`,
      totalPlans,
      successCount,
      failedCount,
      skippedCount,
      results,
    },
    'Telco data collection complete'
  );
  
  console.log('\n=== Telco Data Collection Summary ===');
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`Total Plans: ${totalPlans}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log('\nDetails:');
  results.forEach(r => {
    const status = r.status === 'success' ? '✓' : r.status === 'failed' ? '✗' : '○';
    console.log(`  ${status} ${r.source}: ${r.planCount} plans ${r.error ? `(${r.error})` : ''}`);
  });
  console.log('=====================================\n');
  
  // Exit with error code if any failed
  if (failedCount > 0) {
    process.exit(1);
  }
}

// Run collectors
runAllCollectors().catch((error) => {
  logger.error({ error }, 'Fatal error in telco data collection');
  console.error('Fatal error:', error);
  process.exit(1);
});
