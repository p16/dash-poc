/**
 * Test script for Tesco Mobile collector
 *
 * Run with: npx tsx src/scripts/test-tesco.ts
 */

import * as dotenv from 'dotenv';
import { scrapeAndStoreTescoPlans } from '../lib/scraping/collectors/tesco';
import { logger } from '../lib/utils/logger';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    logger.info('Testing Tesco Mobile collector...');
    const planCount = await scrapeAndStoreTescoPlans();
    logger.info({ planCount }, 'Tesco Mobile test complete');
    process.exit(0);
  } catch (error) {
    console.error('Tesco Mobile test failed:', error);
    logger.error({ error: String(error) }, 'Tesco Mobile test failed');
    process.exit(1);
  }
}

main();
