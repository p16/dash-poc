/**
 * Smarty Mobile Plan Collector (API-based)
 *
 * Collects plan data from Smarty's public API endpoint.
 * Unlike other collectors, this uses direct API calls instead of Playwright.
 *
 * Story: 2.2 - Data Collectors for Telco Sources
 */

import { insertPlans } from '../../db/plans';
import { normalizePlans } from '../normalize';
import { logger } from '../../utils/logger';
import type { PlanData } from '../../../types/database';

interface SmartyPlanResponse {
  data: {
    attributes: {
      plans: SmartyPlan[];
    };
  };
}

interface SmartyPlan {
  id: string;
  name: string;
  description: string;
  categoryName: string;
  categoryType: string;
  finalPrice: {
    value: number;
    currency: string;
  };
  dataAllowanceGB: number;
  voiceAllowance: number;
  smsAllowance: number;
  planIsDataOnly: boolean;
  slug: string;
  [key: string]: any; // Allow other fields from API
}

/**
 * Fetch plans from Smarty's public API
 */
async function fetchSmartyPlans(): Promise<SmartyPlanResponse> {
  const url = 'https://smarty.co.uk/api/v3/plans';

  const headers = {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en-GB,en;q=0.5',
    referer: 'https://smarty.co.uk/all-plans',
    'sec-ch-ua':
      '"Brave";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'sec-gpc': '1',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  };

  try {
    logger.debug({ url }, 'Fetching Smarty plans from API');

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    logger.debug(
      { planCount: data?.data?.attributes?.plans?.length || 0 },
      'Received Smarty API response'
    );

    return data;
  } catch (error) {
    logger.error({ error, url }, 'Failed to fetch Smarty plans from API');
    throw error;
  }
}

/**
 * Extract and normalize plan information from API response
 */
function extractPlansInfoFromAPI(
  response: SmartyPlanResponse
): PlanData[] {
  const plans = response?.data?.attributes?.plans || [];

  return plans.map((plan) => {
    // Standard includes for all Smarty plans
    // Note: These may need manual review or dynamic loading in future
    const standardIncludes = [
      'Cancel or change anytime',
      'No annual price rises',
      'No credit check',
      'Plan benefits',
      'Unlimited call and texts, WIFI calling',
      'Fast 5G and 4G data',
      'EU Roaming: 12GB fair use limit',
    ];

    // Format data allowance
    const dataAllowance =
      plan.dataAllowanceGB === 0
        ? 'Unlimited'
        : `${plan.dataAllowanceGB}GB`;

    // Format contract term (Smarty is rolling monthly)
    const contractTerm = '1 month';

    // Extract only the extra fields we want to preserve (exclude main fields)
    const {
      id,
      name,
      finalPrice,
      dataAllowanceGB: _dataAllowanceGB, // Extracted but not used directly in transformation
      description,
      categoryName,
      categoryType,
      slug,
      ...otherFields
    } = plan;

    return {
      name: name,
      price: `£${finalPrice.value}/month`,
      data_allowance: dataAllowance,
      contract_term: contractTerm,
      extras: standardIncludes,
      // Preserve ID and category info
      plan_id: id,
      category: categoryName,
      category_type: categoryType,
      description: description,
      slug: slug,
      ...otherFields, // All other fields from API preserved
    };
  });
}

/**
 * Scrape and store Smarty Mobile plans using API
 *
 * @returns Number of plans inserted into database
 */
export async function scrapeAndStoreSmartyPlans(scrapeId?: string): Promise<number> {
  logger.info('Starting Smarty plan collection (API)');

  try {
    // Fetch from API
    const response = await fetchSmartyPlans();

    // Extract and normalize
    const plans = extractPlansInfoFromAPI(response);

    if (plans.length === 0) {
      logger.warn('No plans found in Smarty API response');
      return 0;
    }

    logger.debug({ planCount: plans.length }, 'Extracted Smarty plans');

    // Normalize plans before database insertion
    const normalizedPlans = normalizePlans(plans, 'Smarty');

    // Insert normalized data into database
    await insertPlans('Smarty', normalizedPlans, scrapeId);

    logger.info(
      { planCount: plans.length, scrapeId },
      'Successfully scraped and stored Smarty plans'
    );

    return plans.length;
  } catch (error) {
    logger.error({ error }, 'Failed to scrape Smarty plans');
    throw error;
  }
}
