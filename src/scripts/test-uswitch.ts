/**
 * Test Uswitch Collector
 * Quick script to test the Uswitch GraphQL API collector
 */

import * as dotenv from 'dotenv';
import { scrapeAndStoreUswitchPlans } from '../lib/scraping/collectors/uswitch';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testUswitchCollector() {
  console.log('🚀 Testing Uswitch GraphQL API collector...\n');

  try {
    const count = await scrapeAndStoreUswitchPlans();

    console.log(`\n✅ Success! Inserted ${count} Uswitch deals into database`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testUswitchCollector();
