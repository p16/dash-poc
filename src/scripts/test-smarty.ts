/**
 * Test Smarty Collector
 * Quick script to test the Smarty API collector
 */

import * as dotenv from 'dotenv';
import { scrapeAndStoreSmartyPlans } from '../lib/scraping/collectors/smarty';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testSmartyCollector() {
  console.warn('🚀 Testing Smarty API collector...\n');

  try {
    const count = await scrapeAndStoreSmartyPlans();

    console.warn(`\n✅ Success! Inserted ${count} Smarty plans into database`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testSmartyCollector();
