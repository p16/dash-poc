import { config } from 'dotenv';
import { scrapeAndStoreThreePlans } from '../lib/scraping/collectors/three';
import { logger } from '../lib/utils/logger';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function main() {
  try {
    logger.info('Starting Three test scraper');

    const count = await scrapeAndStoreThreePlans();

    logger.info(`Successfully collected ${count} Three plans`);
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Three test scraper failed');
    process.exit(1);
  }
}

main();
