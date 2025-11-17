/**
 * Sky Mobile Plan Collector (Playwright)
 *
 * Collects plan data from Sky Mobile website.
 *
 * Story: 2.2 - Data Collectors for Telco Sources
 */

import { chromium } from 'playwright';
import { insertPlans } from '../../db/plans';
import { logger } from '../../utils/logger';
import type { PlanData } from '../../../types/database';
import type { Page } from 'playwright';

const SKY_CONFIG = {
  url: 'https://www.sky.com/shop/mobile/plans',
  productSelector: '[id="data-plan"]',
  benefitsSelector: '[data-testid="data-plan-benefits"]',
  cookieButtonSelector: 'button[title="Accept all"]',
};

/**
 * Extract plan benefits from the page
 */
async function extractPlanBenefits(page: Page): Promise<string[]> {
  const allBenefits = await page
    .locator(SKY_CONFIG.benefitsSelector)
    .all();

  const benefits: string[] = [];

  for (const benefit of allBenefits) {
    const text = await benefit.innerText();
    const formatted = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
      .join(' ');

    if (formatted) {
      benefits.push(formatted);
    }
  }

  logger.debug({ benefitCount: benefits.length }, 'Extracted Sky plan benefits');
  return benefits;
}

/**
 * Extract plan information from the page
 */
async function extractPlansInfo(page: Page): Promise<string[][]> {
  const plans: string[][] = [];

  // Get global benefits that apply to all plans
  const planBenefits = await extractPlanBenefits(page);

  // Get individual plan cards
  const cards = await page.locator(SKY_CONFIG.productSelector).all();

  logger.debug({ cardCount: cards.length }, 'Found Sky plan cards');

  for (const card of cards) {
    const text = await card.innerText();
    const planLines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && line !== 'Choose a SIM type');

    // Skip invalid cards
    if (planLines.length === 0 || planLines[0] === 'Choose a SIM type') {
      continue;
    }

    // Combine plan details with benefits
    plans.push([...planLines, ...planBenefits]);
  }

  logger.debug({ planCount: plans.length }, 'Extracted Sky plans');
  return plans;
}

/**
 * Transform raw plan data to PlanData format
 */
function transformSkyPlan(rawPlan: string[]): PlanData {
  // Sky plan format (example):
  // ["100 MB", "data plan", "£5 a month", "£5", "a month", "benefits..."]

  const [dataAllowance, ...rest] = rawPlan;

  // Find price - look for pattern like "£X a month" or "£X/month"
  let price = 'Price not available';
  const pricePattern = /£\d+(?:\.\d{2})?\s*(?:a\s+month|\/month)/i;

  for (const line of rest) {
    if (pricePattern.test(line)) {
      price = line.replace(/\s*a\s+month/i, '/month');
      break;
    }
  }

  // Extract contract term if present, default to 12 months (Sky's typical)
  const contractMatch = rest.join(' ').match(/(\d+)\s*month(?:s)?\s+contract/i);
  const contractTerm = contractMatch ? `${contractMatch[1]} months` : '12 months';

  // Everything else goes to extras, excluding the price line and "data plan" text
  const extras = rest.filter(
    (item) =>
      item &&
      item !== 'data plan' &&
      !pricePattern.test(item) &&
      !item.match(/^£\d+$/) && // Exclude standalone price numbers
      !item.match(/^a\s+month$/i) && // Exclude "a month"
      !item.match(/(\d+)\s*month(?:s)?\s+contract/i)
  );

  return {
    name: `Sky Mobile - ${dataAllowance}`,
    price,
    data_allowance: dataAllowance || 'Unknown',
    contract_term: contractTerm,
    extras,
  };
}

/**
 * Scrape and store Sky Mobile plans using Playwright
 *
 * @returns Number of plans inserted into database
 */
export async function scrapeAndStoreSkyPlans(): Promise<number> {
  logger.info('Starting Sky Mobile plan collection');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to Sky Mobile plans page
    logger.debug({ url: SKY_CONFIG.url }, 'Loading Sky Mobile page');
    await page.goto(SKY_CONFIG.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // Handle cookie consent
    logger.debug('Checking for cookie consent');
    const cookieButtons = await page
      .locator(SKY_CONFIG.cookieButtonSelector)
      .all();

    if (cookieButtons.length > 0) {
      logger.debug('Accepting cookies');
      await cookieButtons[0].click();
      await page.waitForTimeout(2000);
    }

    // Extract plans
    logger.debug('Extracting plan data');
    const rawPlans = await extractPlansInfo(page);

    if (rawPlans.length === 0) {
      logger.warn('No plans found on Sky Mobile page');
      await browser.close();
      return 0;
    }

    // Transform to PlanData format
    const plans = rawPlans.map(transformSkyPlan);

    logger.debug({ planCount: plans.length }, 'Transformed Sky plans');

    // Insert into database
    await insertPlans('Sky', plans);

    logger.info(
      { planCount: plans.length },
      'Successfully scraped and stored Sky Mobile plans'
    );

    await browser.close();
    return plans.length;
  } catch (error) {
    logger.error({ error }, 'Failed to scrape Sky Mobile plans');
    await browser.close();
    throw error;
  }
}
