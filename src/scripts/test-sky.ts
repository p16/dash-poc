/**
 * Test Sky Collector
 * Quick script to test the Sky Mobile Playwright collector
 */

import * as dotenv from 'dotenv';
import { scrapeAndStoreSkyPlans } from '../lib/scraping/collectors/sky';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testSkyCollector() {
  console.warn('🚀 Testing Sky Mobile Playwright collector...\n');

  try {
    const count = await scrapeAndStoreSkyPlans();

    console.warn(`\n✅ Success! Inserted ${count} Sky Mobile plans into database`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testSkyCollector();
