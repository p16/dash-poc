import { chromium, Browser, Page } from 'playwright';
import { logger } from '../../utils/logger';
import { insertPlans } from '../../db/plans';
import type { PlanData } from '../../../types/database';

/**
 * O2 SIM-only plan scraper
 *
 * This scraper extracts SIM-only plan data from O2's website.
 * It handles cookie consent, waits for dynamic content, and extracts:
 * - Pricing
 * - Data allowance
 * - Contract term
 */

interface O2Plan {
  name: string;
  price: string;
  dataAllowance: string;
  contractTerm: string;
  url?: string;
}

const O2_URLS = [
  'https://www.o2.co.uk/shop/sim-cards/sim-only-deals?contractMonths=24',
  'https://www.o2.co.uk/shop/sim-cards/sim-only-deals?contractMonths=12',
  'https://www.o2.co.uk/shop/sim-cards/sim-only-deals?contractMonths=1',
];

const PRODUCT_SELECTOR = '[data-role="card"]:not([data-role="card"] [data-role="card"])';

/**
 * Scrape O2 SIM-only plans
 * @returns Array of plan data
 */
export async function scrapeO2(): Promise<O2Plan[]> {
  let browser: Browser | null = null;
  const allPlans: O2Plan[] = [];

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-GB',
      timezoneId: 'Europe/London',
    });

    // Add cookie before loading pages
    await context.addCookies([{
      name: 'optimizely_vmo2_upper',
      value: 'dfe',
      domain: 'www.o2.co.uk',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      expires: Math.floor(Date.now() / 1000) + 36000,
    }]);

    // Process each URL (different contract months)
    for (const url of O2_URLS) {
      const page = await context.newPage();

      // Remove webdriver property to avoid detection
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      try {
        logger.info({ url }, 'Loading page');
        // Use 'load' instead of 'networkidle' for more reliable loading
        // 'networkidle' can timeout on pages with continuous network activity
        await page.goto(url, { waitUntil: 'load' });
        await page.waitForTimeout(5000);

        // Handle cookie consent if present
        logger.info('Handling cookie consent');
        await handleCookieConsent(page);
        await page.waitForTimeout(2000);

        // Wait for page to be interactive
        await page.waitForLoadState('domcontentloaded').catch(() => {
          logger.debug('DOM content loaded wait timed out, continuing');
        });

        // Extract plan data from this page
        logger.info('Extracting plan data');
        const plans = await extractPlanData(page);
        logger.info({ url, planCount: plans.length }, 'Loaded plans from page');
        allPlans.push(...plans);
      } catch (error) {
        logger.error({ url, error }, 'Error processing URL');
      } finally {
        await page.close();
      }
    }

    await context.close();
    await browser.close();

    if (allPlans.length > 0) {
      logger.info({ totalPlans: allPlans.length }, 'Successfully scraped plans from O2');
      return allPlans;
    }

    throw new Error('No plans found on any page');
  } catch (error) {
    logger.error({ error }, 'Scraping failed');

    if (browser) {
      await browser.close().catch(() => {});
    }

    throw error;
  }
}

/**
 * Handle cookie consent modal
 */
async function handleCookieConsent(page: Page): Promise<void> {
  try {
    logger.debug('Clicking accept cookies if present');
    const acceptCookiesButtons = await page.locator('[id="pref_optin"]').all();
    if (acceptCookiesButtons.length === 0) {
      logger.debug('Cookie consent button not found');
      return;
    }

    const isVisible = await acceptCookiesButtons[0].isVisible();
    if (!isVisible) {
      logger.debug('Cookie consent button not visible');
      return;
    }

    await acceptCookiesButtons[0].click();
    await page.waitForTimeout(2000);
    logger.debug('Cookie consent accepted');
  } catch {
    logger.debug('Cookie consent modal not found or already accepted');
  }
}

async function clickViewAllResultsButton(page: Page): Promise<void> {
  const viewAllButtons = await page.locator('button:has-text("View all results")').all();
  logger.debug({ buttonCount: viewAllButtons.length }, 'Found "View all results" buttons');

  if (viewAllButtons.length <= 0) {
    logger.debug('No "View all results" button found, proceeding with current content');
    return
  }

  const button = viewAllButtons[0];
  const isVisible = await button.isVisible();
  logger.debug({ isVisible }, 'Button visibility check');

  if (!isVisible) {
    logger.debug('View all results button found but not visible');
    return;
  }

  await button.scrollIntoViewIfNeeded();
  await button.click();
  logger.debug('Button clicked, waiting for content to load');
  await page.waitForTimeout(2000);
}

/**
 * Extract plan data from the page
 */
async function extractPlanData(page: Page): Promise<O2Plan[]> {
  const plans: O2Plan[] = [];

  try {
    // Click "View all results" button if present
    logger.debug('Looking for "View all results" button');
    try {
      // Wait for button to be visible (with timeout)
      await page.waitForSelector('button:has-text("View all results")', {
        timeout: 2000,
        state: 'visible'
      });
    } catch {
      logger.debug('View all results button not found within timeout');
    }

    await clickViewAllResultsButton(page);

    const cards = await page.locator(PRODUCT_SELECTOR).all();
    logger.info({ cardCount: cards.length }, 'Found plan cards');
    for (const card of cards) {
      logger.debug('Processing card');
      const cardContent = await card.innerText();
      if (cardContent.includes('Are you a Virgin Media broadband customer')) continue;

      logger.debug({ cardContent }, 'Card content');
      const plan = await extractPlanFromLocator(card);
      logger.debug({ plan }, 'plan extracted');

      if (!plan) {
        logger.debug('Plan extraction returned null, skipping');
        continue;
      }// const plan = cardContent.split('\n').map(line => line.trim()).filter(line => line.length > 0)

      // console.log('plan', plan[0]);
      plans.push(plan)
    }
  } catch (error) {
    logger.error({ error }, 'Error extracting plan data');
    // Take a screenshot for debugging
    await page.screenshot({ path: 'o2-scrape-error.png' }).catch(() => {});
    throw error;
  }

  return plans;
}

/**
 * Extract plan data from a single locator
 * Exported for testing
 */
export async function extractPlanFromLocator(card: any): Promise<O2Plan | null> {
  try {
    // Get card content using innerText (like the working implementation)
    const cardContent = await card.innerText();
    if (!cardContent) {
      return null;
    }

    // Skip cards that are promotional/advertising (e.g., Virgin Media broadband customer offers)
    if (cardContent.includes('Are you a Virgin Media broadband customer')) {
      logger.debug('Skipping promotional card: Virgin Media broadband customer offer');
      return null;
    }

    // Split by newlines and filter empty lines (like the working implementation)
    const planLines = cardContent.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);

    // Try to find price - O2 format: "MONTHLY\n\n£30.00" or "£30.00" near "MONTHLY"
    // Look for £ followed by digits and decimals, often after "MONTHLY"
    const priceMatch = cardContent.match(/MONTHLY[\s\n]+£\s*(\d+(?:\.\d{2})?)/i) ||
                       cardContent.match(/£\s*(\d+(?:\.\d{2})?)\s*(?:per\s*month|\/mo|pcm|Total monthly)/i) ||
                       cardContent.match(/£\s*(\d+(?:\.\d{2})?)/);
    const price = priceMatch ? `£${priceMatch[1]}/month` : 'Price not found';

    // Try to find data allowance (GB, Unlimited, etc.)
    const dataMatch = cardContent.match(/(\d+)\s*GB/i) ||
                     cardContent.match(/Unlimited/i) ||
                     cardContent.match(/(\d+)\s*MB/i);
    const dataAllowance = dataMatch
      ? (dataMatch[0].toLowerCase().includes('unlimited') ? 'Unlimited' : dataMatch[0])
      : 'Data not found';

    // Try to find contract term (1 month, 12 months, 24 months, etc.)
    const contractMatch = cardContent.match(/(\d+)\s*(?:month|mth)/i) ||
                         cardContent.match(/(\d+)\s*month\s*contract/i);
    const contractTerm = contractMatch
      ? `${contractMatch[1]} months`
      : 'Contract term not found';

    // Try to find plan name (use first line if available, otherwise try title elements)
    let name = planLines[0] || 'O2 SIM Plan';
    if (name === 'O2 SIM Plan') {
      try {
        const titleLocator = card.locator('h2, h3, [class*="title"], [class*="name"]').first();
        const titleText = await titleLocator.textContent().catch(() => null);
        if (titleText) {
          name = titleText;
        }
      } catch {
        // Ignore errors
      }
    }

    return {
      name: typeof name === 'string' ? name.trim() : 'O2 SIM Plan',
      price: price.trim(),
      dataAllowance: dataAllowance.trim(),
      contractTerm: contractTerm.trim(),
    };
  } catch (error) {
    logger.error({ error }, 'Error extracting plan from locator');
    return null;
  }
}

/**
 * Scrape O2 plans and store in database
 *
 * Main entry point for O2 data collection.
 * Scrapes all O2 SIM-only plans and stores raw data in the database.
 *
 * @returns Count of plans inserted
 *
 * @example
 * ```typescript
 * const count = await scrapeAndStoreO2Plans();
 * console.log(`Stored ${count} O2 plans`);
 * ```
 */
export async function scrapeAndStoreO2Plans(): Promise<number> {
  logger.info('Starting O2 plan collection');

  try {
    // Scrape plans
    const plans = await scrapeO2();

    // Convert to PlanData format (raw, no normalization)
    const planData: PlanData[] = plans.map(plan => ({
      name: plan.name,
      price: plan.price,
      data_allowance: plan.dataAllowance,
      contract_term: plan.contractTerm,
      url: plan.url,
    }));

    // Insert into database
    const results = await insertPlans('O2', planData);

    logger.info({ planCount: results.length }, 'O2 plan collection complete');
    return results.length;
  } catch (error) {
    logger.error({ error }, 'O2 plan collection failed');
    throw error;
  }
}
