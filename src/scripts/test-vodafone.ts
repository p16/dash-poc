/**
 * Test script for Vodafone collector
 *
 * Run with: npx tsx src/scripts/test-vodafone.ts
 */

import * as dotenv from 'dotenv';
import { scrapeAndStoreVodafonePlans } from '../lib/scraping/collectors/vodafone';
import { logger } from '../lib/utils/logger';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    logger.info('Testing Vodafone collector...');
    const planCount = await scrapeAndStoreVodafonePlans();
    logger.info({ planCount }, 'Vodafone test complete');
    process.exit(0);
  } catch (error) {
    console.error('Vodafone test failed:', error);
    logger.error({ error: String(error) }, 'Vodafone test failed');
    process.exit(1);
  }
}

main();
