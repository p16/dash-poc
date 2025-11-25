/**
 * Tesco Mobile Plan Collector (Playwright)
 *
 * Collects plan data from Tesco Mobile website.
 *
 * Story: 2.2 - Data Collectors for Telco Sources
 */

import { insertPlans } from '../../db/plans';
import { normalizePlans } from '../normalize';
import { logger } from '../../utils/logger';
import { launchBrowser } from '../browser';
import type { PlanData } from '../../../types/database';
import type { Page } from 'playwright';

const TESCO_CONFIG = {
  url: 'https://www.tescomobile.com/shop/sim-only-deals/sim-only-contracts',
  productSelector: '.product-item',
  nameSelector: '.result-title',
  priceSelector: '.price-wrapper',
  cookieButtonText: 'Accept all',
};

interface TescoRawPlan {
  name: string;
  pricePerMonth: string;
  details: string[];
}

/**
 * Extract plan information from the page
 */
async function extractPlansInfo(page: Page): Promise<TescoRawPlan[]> {
  const plans: TescoRawPlan[] = [];

  const cards = await page.locator(TESCO_CONFIG.productSelector).all();

  logger.debug({ cardCount: cards.length }, 'Found Tesco plan cards');

  for (const card of cards) {
    try {
      // Extract name
      const nameElements = await card.locator(TESCO_CONFIG.nameSelector).all();
      if (nameElements.length === 0) continue;
      const nameText = await nameElements[0].innerText();

      // Extract price
      const priceElements = await card.locator(TESCO_CONFIG.priceSelector).all();
      if (priceElements.length === 0) continue;
      const priceText = await priceElements[0].innerText();

      // Extract all details
      const fullText = await card.innerText();
      const details = fullText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && line !== 'Add');

      plans.push({
        name: nameText.trim(),
        pricePerMonth: priceText.trim(),
        details,
      });
    } catch (error) {
      logger.warn({ error }, 'Failed to extract Tesco plan from card');
      continue;
    }
  }

  logger.debug({ planCount: plans.length }, 'Extracted Tesco plans');
  return plans;
}

/**
 * Transform raw plan data to PlanData format
 */
function transformTescoPlan(rawPlan: TescoRawPlan): PlanData {
  // Extract data allowance from name (e.g., "5GB SIM Only")
  const dataMatch = rawPlan.name.match(/(\d+GB|Unlimited)/i);
  const dataAllowance = dataMatch ? dataMatch[1] : 'Unknown';

  // Clean up price (e.g., "£7.50 a month" -> "£7.50/month")
  const price = rawPlan.pricePerMonth
    .replace(/\s*a\s+month/i, '/month')
    .replace(/\s*per\s+month/i, '/month');

  // Extract contract term from details
  let contractTerm = '12 months'; // Tesco default
  const contractMatch = rawPlan.details
    .join(' ')
    .match(/(\d+)\s*month\s+contract/i);
  if (contractMatch) {
    contractTerm = `${contractMatch[1]} months`;
  }

  // Filter details to get extras (exclude name, price, and contract info)
  const extras = rawPlan.details.filter(
    (detail) =>
      detail !== rawPlan.name &&
      detail !== rawPlan.pricePerMonth &&
      !detail.match(/^\d+GB/i) &&
      !detail.match(/^Unlimited/i) &&
      !detail.match(/(\d+)\s*month\s+contract/i) &&
      detail.length > 0
  );

  return {
    name: rawPlan.name,
    price,
    data_allowance: dataAllowance,
    contract_term: contractTerm,
    extras,
  };
}

/**
 * Scrape and store Tesco Mobile plans using Playwright
 *
 * @returns Number of plans inserted into database
 */
export async function scrapeAndStoreTescoPlans(scrapeId?: string): Promise<number> {
  logger.info('Starting Tesco Mobile plan collection');

  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    // Navigate to Tesco Mobile plans page
    logger.debug({ url: TESCO_CONFIG.url }, 'Loading Tesco Mobile page');
    await page.goto(TESCO_CONFIG.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Handle cookie consent
    logger.debug('Checking for cookie consent');
    try {
      const acceptButton = page.getByText(TESCO_CONFIG.cookieButtonText);
      await acceptButton.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      logger.debug('Accepted cookies');
    } catch {
      logger.debug('No cookie consent button found or already accepted');
    }

    // Extract plans
    logger.debug('Extracting plan data');
    const rawPlans = await extractPlansInfo(page);

    if (rawPlans.length === 0) {
      logger.warn('No plans found on Tesco Mobile page');
      await browser.close();
      return 0;
    }

    // Transform to PlanData format
    const plans = rawPlans.map(transformTescoPlan);

    logger.debug({ planCount: plans.length }, 'Transformed Tesco plans');

    // Normalize plans before database insertion
    const normalizedPlans = normalizePlans(plans, 'Tesco');

    // Insert normalized data into database
    await insertPlans('Tesco', normalizedPlans, scrapeId);

    logger.info(
      { planCount: plans.length, scrapeId },
      'Successfully scraped and stored Tesco Mobile plans'
    );

    await browser.close();
    return plans.length;
  } catch (error) {
    logger.error({ error }, 'Failed to scrape Tesco Mobile plans');
    await browser.close();
    throw error;
  }
}

// Interface for Tesco plan structure (not currently used but kept for documentation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TescoPlan {
  name: string;
  price: string;
  dataAllowance: string;
  contractTerm: string;
  url?: string;
}
