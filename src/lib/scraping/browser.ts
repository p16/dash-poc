/**
 * Browser Connection Utility
 *
 * Handles browser launch for both local development and production (Vercel).
 * In production, connects to Browserless cloud service.
 * In development, uses local Playwright installation.
 */

import { chromium, type Browser } from 'playwright';
import { logger } from '../utils/logger';

/**
 * Launch browser with environment-aware configuration
 *
 * @returns Playwright Browser instance
 */
export async function launchBrowser(): Promise<Browser> {
  const browserlessToken = process.env.BROWSERLESS_TOKEN;
  const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';

  if (isProduction && !browserlessToken) {
    throw new Error('BROWSERLESS_TOKEN environment variable is required in production');
  }

  // Use Browserless cloud service if token is provided
  // if (isProduction && browserlessToken) {
  if (isProduction && browserlessToken) {
    logger.info('Connecting to Browserless cloud browser');

    // Use Playwright-specific endpoint
    const wsEndpoint = `wss://production-lon.browserless.io/chromium/playwright?token=${browserlessToken}&timeout=60000`;

    try {
      const browser = await chromium.connect(wsEndpoint, {
        timeout: 15000, // 15 second timeout
      });
      logger.info('Successfully connected to Browserless');
      return browser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({
        error,
        errorMessage,
        endpoint: 'wss://production-sfo.browserless.io/chromium/playwright',
      }, 'Failed to connect to Browserless, falling back to local');

      throw error;
    }
  }

  // Development: Use local Playwright
  logger.info('Launching local Playwright browser');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ],
  });

  return browser;
}

/**
 * Standard browser context configuration
 */
export const DEFAULT_CONTEXT_OPTIONS = {
  viewport: { width: 1920, height: 1080 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'en-GB',
  timezoneId: 'Europe/London',
} as const;
