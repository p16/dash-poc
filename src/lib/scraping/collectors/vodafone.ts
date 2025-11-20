/**
 * Vodafone Plan Collector (Playwright)
 *
 * Collects plan data from Vodafone website.
 *
 * Story: 2.2 - Data Collectors for Telco Sources
 */

import { logger } from '../../utils/logger';
import { insertPlans } from '../../db/plans';
import { normalizePlans } from '../normalize';
import { launchBrowser } from '../browser';
import type { PlanData } from '../../../types/database';
import type { Page, Locator } from 'playwright';

const VODAFONE_CONFIG = {
  url: 'https://www.vodafone.co.uk/sim-only/best-sim-only-deals',
  nameSelector: {
    name: 'h2',
    description: 'div:has(h2)',
  },
  cardSelectors: {
    list: '[data-testid="plan-list-content"]',
    item: '[data-testid="plan-card-item"]',
  },
  priceSelectors: {
    price: '[data-testid="price-wrapper"]',
    rise: '[data-testid="price-rise-text"]',
  },
  detailSelectors: {
    list: '[data-testid="common-benefit-item"]',
  },
  cookieButtonText: 'Accept all cookies',
  contractLengths: ['1 Months', '12 Months', '24 Months'],
};

interface VodafoneRawPlan {
  name: string;
  description: string;
  details: string[];
  extendedDetails?: Array<{
    title: string;
    content: string;
  }>;
  contractLength?: string;
}

/**
 * Extract card information
 */
async function extractCardInfo(card: Locator): Promise<VodafoneRawPlan> {
  const planInfo: VodafoneRawPlan = {
    name: '',
    description: '',
    details: [],
  };

  // Extract name
  const name = await card.locator(VODAFONE_CONFIG.nameSelector.name).all();
  if (name.length > 0) {
    planInfo.name = (await name[0].innerText()).trim().replace(/\s+/g, ' ');
  }

  // Extract description
  const description = await card
    .locator(VODAFONE_CONFIG.nameSelector.description)
    .all();
  if (description.length > 0) {
    planInfo.description = (await description[0].innerText())
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Extract prices and details
  const prices = await card.locator(VODAFONE_CONFIG.priceSelectors.price).all();
  const priceRises = await card.locator(VODAFONE_CONFIG.priceSelectors.rise).all();
  const details = await card.locator(VODAFONE_CONFIG.detailSelectors.list).all();

  const elements = [...prices, ...priceRises, ...details];
  for (const element of elements) {
    const result = (await element.innerText()).trim().replace(/\s+/g, ' ');
    planInfo.details.push(result);
  }

  return planInfo;
}

/**
 * Load plan details from modal
 */
async function loadPlanDetails(
  modal: Locator,
  planInfo: VodafoneRawPlan,
  page: Page
): Promise<VodafoneRawPlan> {
  const tabsButtons = await modal.locator('button[role="tab"]').all();
  planInfo.extendedDetails = [];

  for (const tabButton of tabsButtons) {
    await tabButton.click();
    await page.waitForTimeout(200);
    const tabContent = await modal
      .locator('div[role="tabpanel"][aria-hidden="false"]')
      .all();
    if (tabContent.length > 0) {
      const contextText = await tabContent[0].innerText();
      const title = contextText.split('\n')[0];

      planInfo.extendedDetails.push({
        title,
        content: contextText.trim(),
      });
    }
  }

  const closeButton = await modal.locator('header button').all();
  if (closeButton.length > 0) {
    await closeButton[0].click();
  }

  return planInfo;
}

/**
 * Extract plans info from page
 */
async function extractPlansInfo(
  page: Page,
  contractLength: string
): Promise<VodafoneRawPlan[]> {
  const plans: VodafoneRawPlan[] = [];
  const cards = await page.locator(VODAFONE_CONFIG.cardSelectors.item).all();

  logger.debug({ cardCount: cards.length }, 'Found Vodafone plan cards');

  for (const card of cards) {
    try {
      let planInfo = await extractCardInfo(card);
      planInfo.contractLength = contractLength;

      logger.debug({ planName: planInfo.name }, 'Processing card');

      const seeDetailsButton = await card.getByText('See plan details');
      if ((await seeDetailsButton.count()) <= 0) continue;

      await seeDetailsButton.click();
      await page.waitForTimeout(500);
      const modal = await page
        .locator('[data-testid="plan_card_details_modal"]')
        .all();

      if (modal.length > 0) {
        logger.debug(
          { planName: planInfo.name },
          'Loading data from modal'
        );
        planInfo = await loadPlanDetails(modal[0], planInfo, page);
      }

      logger.debug({
        planInfo
      }, 'Successfully scraped plan');
      plans.push(planInfo);
    } catch (error) {
      logger.warn({ error }, 'Failed to extract Vodafone plan from card');
      continue;
    }
  }

  return plans;
}

/**
 * Transform raw plan data to PlanData format
 */
function transformVodafonePlan(rawPlan: VodafoneRawPlan): PlanData {
  // Extract data allowance from name or description
  const combinedText = `${rawPlan.name} ${rawPlan.description}`;
  const dataMatch = combinedText.match(/(\d+GB|Unlimited)/i);
  const dataAllowance = dataMatch ? dataMatch[1] : 'Unknown';

  // Extract price from details
  let price = 'Unknown';
  const priceDetail = rawPlan.details.find((d) => d.includes('£'));
  if (priceDetail) {
    const priceMatch = priceDetail.match(/£\s*[\d.]+/);
    if (priceMatch) {
      // Remove any spaces between £ and the number for clean formatting
      price = `${priceMatch[0].replace(/\s+/g, '')}/month`;
    }
  }

  // Parse contract term
  let contractTerm = '12 months'; // Default
  if (rawPlan.contractLength) {
    const match = rawPlan.contractLength.match(/(\d+)\s*Month/i);
    if (match) {
      contractTerm = `${match[1]} ${match[1] === '1' ? 'month' : 'months'}`;
    }
  }

  // Combine details and extended details for extras
  const extras = [...rawPlan.details];
  if (rawPlan.extendedDetails) {
    extras.push(...rawPlan.extendedDetails.map((ed) => ed.title));
  }

  return {
    name: rawPlan.name,
    price,
    data_allowance: dataAllowance,
    contract_term: contractTerm,
    extras: extras.filter((e) => e.length > 0 && !e.includes('£')),
  };
}

/**
 * Scrape and store Vodafone plans using Playwright
 *
 * @returns Number of plans inserted into database
 */
export async function scrapeAndStoreVodafonePlans(): Promise<number> {
  logger.info('Starting Vodafone plan collection');

  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    // Navigate to Vodafone plans page
    logger.debug({ url: VODAFONE_CONFIG.url }, 'Loading Vodafone page');
    await page.goto(VODAFONE_CONFIG.url, { waitUntil: 'networkidle' });

    // Handle cookie consent
    logger.debug('Checking for cookie consent');
    try {
      await page
        .getByRole('button', { name: VODAFONE_CONFIG.cookieButtonText })
        .click();
      await page.waitForTimeout(1000);
      logger.debug('Accepted cookies');
    } catch {
      logger.debug('No cookie consent button found or already accepted');
    }

    // Wait for plans to load
    await page.waitForSelector(VODAFONE_CONFIG.cardSelectors.list);

    const allPlans: VodafoneRawPlan[] = [];

    // Iterate through contract lengths
    for (const contractLength of VODAFONE_CONFIG.contractLengths) {
      logger.debug({ contractLength }, 'Loading data for contract length');

      // Select contract length
      const contractLengthsSelectList = await page
        .locator('#contractLength')
        .all();
      if (contractLengthsSelectList.length > 0) {
        await contractLengthsSelectList[0].click();
        const selectedOption = await page
          .locator(`li[id='${contractLength}']`)
          .all();
        if (selectedOption.length > 0) {
          await selectedOption[0].click();
        }
      }

      await page.waitForTimeout(2000);

      logger.debug('Plans loaded, extracting data');
      const newPlans = await extractPlansInfo(page, contractLength);

      logger.info(
        { planCount: newPlans.length, contractLength },
        'Extracted plans for contract length'
      );
      allPlans.push(...newPlans);
    }

    if (allPlans.length === 0) {
      logger.warn('No plans found on Vodafone page');
      await browser.close();
      return 0;
    }

    // Transform to PlanData format
    const plans = allPlans.map(transformVodafonePlan);

    logger.debug({ planCount: plans.length }, 'Transformed Vodafone plans');

    // Normalize plans before database insertion
    const normalizedPlans = normalizePlans(plans, 'Vodafone');

    // Insert normalized data into database
    await insertPlans('Vodafone', normalizedPlans);

    logger.info(
      { planCount: plans.length },
      'Successfully scraped and stored Vodafone plans'
    );

    await browser.close();
    return plans.length;
  } catch (error) {
    logger.error({ error }, 'Failed to scrape Vodafone plans');
    await browser.close();
    throw error;
  }
}
