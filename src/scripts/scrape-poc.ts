/**
 * Proof-of-concept scraper script
 * Scrapes a single telco source (O2) to validate the scraping approach
 * 
 * Run with: npm run scrape:poc
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { scrapeO2 } from '../lib/scraping/collectors/o2';
import { logger } from '../lib/utils/logger';

async function main() {
  try {
    logger.info('Starting O2 scraper POC');
    const plans = await scrapeO2();
    
    logger.info({ planCount: plans.length }, 'Successfully scraped plans');
    logger.debug({ plans }, 'Scraped plans data');
    
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Scraping failed');
    process.exit(1);
  }
}

main();

