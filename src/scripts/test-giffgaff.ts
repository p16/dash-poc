import * as dotenv from 'dotenv';
import { scrapeAndStoreGiffgaffPlans } from '../lib/scraping/collectors/giffgaff';
import { logger } from '../lib/utils/logger';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    logger.info('Starting Giffgaff test scraper');
    const count = await scrapeAndStoreGiffgaffPlans();
    logger.info(`Successfully collected ${count} Giffgaff plans`);
  } catch (error) {
    logger.error({ error }, 'Test scraper failed');
    process.exit(1);
  }
}

main();
