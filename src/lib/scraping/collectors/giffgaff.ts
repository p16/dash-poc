import { logger } from '../../utils/logger';
import { insertPlans } from '../../db/plans';
import { normalizePlans } from '../normalize';
import { launchBrowser } from '../browser';
import type { PlanData } from '../../../types/database';

/**
 * Giffgaff SIM-only plan scraper
 *
 * Target URL: https://www.giffgaff.com/sim-only-deals
 *
 * Giffgaff embeds plan data in JSON within a script tag.
 * We parse the JSON to extract all plan types: contract, monthly rolling, and PAYG.
 */

interface GiffgaffPlanAllowance {
  type: string;
  allocation: number; // -1 means unlimited
}

interface GiffgaffPlanRaw {
  id: string;
  name: string;
  priceInPence: number;
  description: string;
  allowance: GiffgaffPlanAllowance[];
  tags: string[];
}

// Interface for the plans data structure (not currently used but kept for documentation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface GiffgaffPlansData {
  plans: Record<string, GiffgaffPlanRaw>;
}

/**
 * Extract plans data from embedded JSON in page
 */
async function extractPlansInfo(page: any): Promise<GiffgaffPlanRaw[]> {
  const plansData = await page.evaluate(() => {
    // Find the script tag containing RangePage data
    const scripts = Array.from(document.querySelectorAll('script[type="application/json"]'));
    const rangePageScript = scripts.find(script =>
      script.getAttribute('data-hypernova-key') === 'RangePage'
    );

    if (!rangePageScript || !rangePageScript.textContent) {
      return null;
    }

    try {
      // Extract JSON from HTML comments
      const jsonText = rangePageScript.textContent
        .replace(/^<!--/, '')
        .replace(/-->$/, '')
        .trim();

      const data = JSON.parse(jsonText);
      return data.plans || {};
    } catch (e) {
      console.error('Failed to parse plans JSON:', e);
      return null;
    }
  });

  if (!plansData) {
    logger.warn('No plans data found in JSON');
    return [];
  }

  // Convert object to array
  return Object.values(plansData) as GiffgaffPlanRaw[];
}

/**
 * Convert Giffgaff plan data to standardized format
 */
function transformGiffgaffPlan(plan: GiffgaffPlanRaw): PlanData {
  // Extract data allowance
  const dataAllowance = plan.allowance.find(a => a.type === 'DATA');
  let dataText = 'Unknown';

  if (dataAllowance) {
    if (dataAllowance.allocation === -1) {
      dataText = 'Unlimited';
    } else {
      // Convert bytes to GB
      const gb = dataAllowance.allocation / (1024 * 1024);
      dataText = gb >= 1 ? `${gb}GB` : `${dataAllowance.allocation / 1024}MB`;
    }
  }

  // Determine contract type from tags and description
  let contractTerm = 'Unknown';
  if (plan.tags.includes('contract_18')) {
    contractTerm = '18 months';
  } else if (plan.tags.includes('golden') && plan.description.includes('Monthly rolling')) {
    contractTerm = 'Monthly rolling';
  } else if (plan.description.includes('Pay as you go')) {
    contractTerm = 'Pay as you go';
  }

  // Convert pence to pounds
  const priceText = `£${(plan.priceInPence / 100).toFixed(2)}`;

  return {
    name: `${dataText} - ${plan.description.split(' ')[0]} ${plan.description.split(' ')[1] || ''}`.trim(),
    price: priceText,
    data_allowance: dataText,
    contract_term: contractTerm,
    source_url: 'https://www.giffgaff.com/sim-only-deals',
    source_name: 'Giffgaff',
    plan_key: null
  };
}

/**
 * Scrape Giffgaff plans and store in database
 *
 * @returns Count of plans inserted
 */
export async function scrapeAndStoreGiffgaffPlans(): Promise<number> {
  logger.info('Starting Giffgaff plan collection');

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();

    logger.info('Navigating to Giffgaff SIM only deals page');
    await page.goto('https://www.giffgaff.com/sim-only-deals', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Extract plans from JSON
    const rawPlans = await extractPlansInfo(page);
    logger.info(`Found ${rawPlans.length} raw plans`);

    if (rawPlans.length === 0) {
      logger.warn('No plans found');
      return 0;
    }

    // Convert to PlanData format
    const planData: PlanData[] = rawPlans.map(transformGiffgaffPlan);

    // Normalize plans before database insertion
    const normalizedPlans = normalizePlans(planData, 'Giffgaff');

    // Insert normalized data into database
    const results = await insertPlans('Giffgaff', normalizedPlans);

    logger.info({ planCount: results.length }, 'Giffgaff plan collection complete');
    return results.length;
  } catch (error) {
    logger.error({ error }, 'Giffgaff plan collection failed');
    throw error;
  } finally {
    await browser.close();
  }
}
