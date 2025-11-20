/**
 * Test Browserless Connection
 *
 * Tries different Browserless endpoints to find the correct one
 */

import { chromium } from 'playwright';
import { config } from 'dotenv';

config({ path: '.env.local' });

const token = process.env.BROWSERLESS_TOKEN;

if (!token) {
  console.error('BROWSERLESS_TOKEN not found in .env.local');
  process.exit(1);
}

const endpoints = [
  'wss://production-sfo.browserless.io',
  'wss://production-lon.browserless.io',
  'wss://chrome.browserless.io',
  'wss://browserless.io',
];

async function testEndpoint(endpoint: string): Promise<boolean> {
  const wsUrl = `${endpoint}?token=${token}`;

  console.warn(`\nTesting: ${endpoint}`);

  try {
    const browser = await chromium.connect(wsUrl, {
      timeout: 10000,
    });

    console.warn(`✅ SUCCESS: ${endpoint} works!`);
    await browser.close();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
    console.warn(`❌ FAILED: ${message}`);
    return false;
  }
}

async function main() {
  console.warn('Testing Browserless endpoints...\n');

  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      console.warn(`\n🎉 Use this endpoint in your code: ${endpoint}`);
      break;
    }
  }
}

main();
