import { chromium } from 'playwright';
import { logger } from '../../utils/logger';
import { insertPlans } from '../../db/plans';
import { normalizePlans } from '../normalize';
import type { PlanData } from '../../../types/database';

/**
 * Three SIM-only plan scraper with interactive filter navigation
 *
 * Scrapes https://www.three.co.uk/shop/sim-only/pay-monthly
 * Iterates through all combinations of:
 * - Contract length (24M, 12M, 1M)
 * - Data allowance (Unlimited, 250GB, 120GB, 40GB, 25GB, 12GB, 1GB)
 * - Plan type (Lite, Value, Complete)
 */

interface ThreePlanRaw {
  dataAllowance: string;
  contractTerm: string;
  planType: string;
  currentPrice: string;
  wasPrice: string;
  features: string;
  offerText: string;
}

/**
 * Extract plan details from the dynamic plan card
 */
async function extractPlanDetails(
  page: any,
  selectedContractLength?: string
): Promise<ThreePlanRaw | null> {
  try {
    // Wait for the dynamic plan details section to be visible
    await page.waitForSelector('.plan-details-section', { timeout: 5000 });

    // Small delay to ensure content is updated after filter click
    await page.waitForTimeout(500);

    const planDetails = await page.evaluate(() => {
      const planSection = document.querySelector('.plan-details-section');
      if (!planSection) return null;

      // Extract data allowance from "plan-data-text"
      const dataElement = planSection.querySelector('.plan-data-text span');
      const dataAllowance = dataElement?.textContent?.trim() || '';

      // Extract contract term from "plan-cost-monthly-text" (e.g., "24 month plan")
      const termElement = planSection.querySelector('.plan-cost-monthly .plan-cost-monthly-text');
      const contractInfo = termElement?.textContent?.trim() || '';

      // Extract current monthly price
      const priceContainer = planSection.querySelector('.plan-cost-monthly .plan-cost-monthly-number');
      let currentPrice = '';
      if (priceContainer) {
        const priceBig = priceContainer.querySelector('span:first-child');
        const priceSmall = priceContainer.querySelector('.plan-cost-monthly-number-decimal');
        if (priceBig && priceSmall) {
          currentPrice = `${priceBig.textContent?.replace('£', '')}${priceSmall.textContent}`.trim();
        }
      }

      // Extract was price (original price before discount)
      let wasPrice = '';
      const wasPriceContainer = planSection.querySelector('.was-price:not(.was-price-placeholder)');
      if (wasPriceContainer) {
        const wasPriceBig = wasPriceContainer.querySelector('.price-big-digits');
        const wasPriceSmall = wasPriceContainer.querySelector('.price-small-digits');
        if (wasPriceBig && wasPriceSmall) {
          wasPrice = `${wasPriceBig.textContent?.replace('£', '')}${wasPriceSmall.textContent}`.trim();
        }
      }

      // Extract plan type from "aem-plan-features-txt" (e.g., "Value plan features:" -> "Value")
      let planType = '';
      const planTypeElement = planSection.querySelector('.aem-plan-features-txt');
      if (planTypeElement) {
        const text = planTypeElement.textContent?.trim() || '';
        const match = text.match(/^(\w+)\s+plan\s+features/i);
        planType = match ? match[1] : '';
      }

      // Extract features
      const featuresList: string[] = [];

      // Get elevated tiered features (special features like roaming, Paramount+)
      const elevatedFeatures = planSection.querySelectorAll('.elevated-tiered-feature .elevalted-tiered-txt');
      elevatedFeatures.forEach((element) => {
        const text = element.textContent?.trim();
        if (text) featuresList.push(text);
      });

      // Get standard features (5G, Three+ Rewards, etc.)
      const standardFeatures = planSection.querySelectorAll('.standard-aem-feature .plan-parameter-item');
      standardFeatures.forEach((element) => {
        const text = element.textContent?.trim();
        if (text) featuresList.push(text);
      });

      // Join features into a single string
      const features = featuresList.join(', ');

      // Extract offer text (from price increase info)
      let offerText = '';
      const offerElement = planSection.querySelector('.ofcom-text-container .increasing-to');
      if (offerElement) {
        offerText = offerElement.textContent?.trim() || '';
      }

      return {
        dataAllowance,
        contractInfo,
        currentPrice,
        wasPrice,
        planType,
        features,
        offerText,
      };
    });

    if (!planDetails || !planDetails.dataAllowance) {
      return null;
    }

    // Use the selected contract length if provided, otherwise parse from text
    let contractTerm: string;
    if (selectedContractLength) {
      // Convert "24 Months" -> "24 months"
      const match = selectedContractLength.match(/(\d+)\s+Month/i);
      contractTerm = match ? `${match[1]} months` : selectedContractLength.toLowerCase();
    } else {
      // Parse from contractInfo (e.g., "24 month plan" -> "24 months")
      const contractMatch = planDetails.contractInfo.match(/(\d+)\s+month/i);
      contractTerm = contractMatch ? `${contractMatch[1]} months` : planDetails.contractInfo;
    }

    const planType = planDetails.planType || '';

    return {
      dataAllowance: planDetails.dataAllowance,
      contractTerm,
      planType,
      currentPrice: planDetails.currentPrice,
      wasPrice: planDetails.wasPrice,
      features: planDetails.features,
      offerText: planDetails.offerText,
    };
  } catch (error) {
    logger.warn({ error }, 'Failed to extract plan details');
    return null;
  }
}

/**
 * Click a filter option by its text content
 */
async function clickFilter(page: any, filterCategory: string, optionText: string): Promise<boolean> {
  try {
    // Find the filter wrapper with the matching category
    const clicked = await page.evaluate(
      ({ category, option }: { category: string; option: string }) => {
        // Find all filter wrappers
        const filterWrappers = Array.from(document.querySelectorAll('.filter-wrapper'));

        // Find the one with matching category
        const targetWrapper = filterWrappers.find((wrapper) => {
          const categoryElement = wrapper.querySelector('.plan-categories');
          return categoryElement?.textContent?.trim() === category;
        });

        if (!targetWrapper) return false;

        // Find the choice card with matching text
        const choiceCards = Array.from(
          targetWrapper.querySelectorAll('.choice-card-single-container')
        );

        const targetCard = choiceCards.find((card) => {
          const contentElement = card.querySelector('.choice-card-content');
          return contentElement?.textContent?.trim() === option;
        });

        if (!targetCard) return false;

        // Check if disabled
        if (targetCard.classList.contains('disabled')) return false;

        // Click the card
        const clickableElement = targetCard as HTMLElement;
        clickableElement.click();
        return true;
      },
      { category: filterCategory, option: optionText }
    );

    if (clicked) {
      // Wait for the plan card to update
      await page.waitForTimeout(800);
    }

    return clicked;
  } catch (error) {
    logger.warn({ error, filterCategory, optionText }, 'Failed to click filter');
    return false;
  }
}

/**
 * Transform raw plan data to PlanData format
 */
function transformThreePlan(rawPlan: ThreePlanRaw): PlanData {
  // Clean and format the price (e.g., "£20.00" -> "20.00")
  const price = rawPlan.currentPrice.replace('£', '').trim();

  // Format data allowance
  let dataAllowance = rawPlan.dataAllowance.replace(' data', '').trim();
  if (dataAllowance.toLowerCase() === 'unlimited') {
    dataAllowance = 'Unlimited';
  }

  // Create plan name
  const planName = `${dataAllowance} ${rawPlan.planType} ${rawPlan.contractTerm}`;

  return {
    name: planName,
    price,
    data_allowance: dataAllowance,
    contract_term: rawPlan.contractTerm,
    source: 'Three',
    url: 'https://www.three.co.uk/shop/sim-only/pay-monthly',
    plan_key: null,
  };
}

/**
 * Scrape Three plans and store in database
 *
 * @returns Count of plans inserted
 */
export async function scrapeAndStoreThreePlans(): Promise<number> {
  logger.info('Starting Three plan collection');

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    // Navigate to Three SIM only page
    logger.info('Navigating to Three SIM only page');
    await page.goto('https://www.three.co.uk/shop/sim-only/pay-monthly', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for the page to load
    logger.info('Waiting for plan selection section');
    await page.waitForSelector('.plan-selection-section', { timeout: 20000 });

    // First, extract the "most popular plans" shown at the top
    logger.info('Extracting most popular plans');
    const popularPlans = await page.evaluate(() => {
      const planCards = Array.from(document.querySelectorAll('.simo-top-ranking-plans .plan-card-redesign-content-wrapper'));
      return planCards.map(card => {
        const dataElement = card.querySelector('.plan-card-plan-data p');
        const dataAllowance = dataElement?.textContent?.trim() || '';

        const termElement = card.querySelector('.pb-\\[15px\\] p');
        const contractInfo = termElement?.textContent?.trim() || '';

        const priceBig = card.querySelector('.price-big-digits')?.textContent?.trim() || '';
        const priceSmall = card.querySelector('.price-small-digits')?.textContent?.trim() || '';
        const currentPrice = `${priceBig}${priceSmall}`;

        const wasPriceElement = card.querySelector('.grey-lower-text');
        const wasPrice = wasPriceElement?.textContent?.replace('Was ', '').trim() || '';

        const featuresElement = card.querySelector('.plan-standard-features-redesign p');
        const features = featuresElement?.textContent?.replace('Your plan includes:', '').trim() || '';

        const offerElement = card.closest('.plans-card-root-redesign')?.querySelector('.offer-indicator');
        const offerText = offerElement?.textContent?.trim() || '';

        return {
          dataAllowance,
          contractInfo,
          currentPrice,
          wasPrice,
          features,
          offerText,
        };
      });
    });

    const allPlans: ThreePlanRaw[] = [];
    const seenPlans = new Set<string>();

    // Process popular plans
    for (const rawPlan of popularPlans) {
      if (rawPlan.dataAllowance) {
        const contractMatch = rawPlan.contractInfo.match(/(\d+)\s+month\s+(\w+)\s+plan/i);
        const contractTerm = contractMatch ? `${contractMatch[1]} months` : rawPlan.contractInfo;
        const planType = contractMatch ? contractMatch[2] : '';

        const plan: ThreePlanRaw = {
          dataAllowance: rawPlan.dataAllowance,
          contractTerm,
          planType,
          currentPrice: rawPlan.currentPrice,
          wasPrice: rawPlan.wasPrice,
          features: rawPlan.features,
          offerText: rawPlan.offerText,
        };

        const planKey = `${plan.dataAllowance}-${plan.contractTerm}-${plan.planType}`;
        if (!seenPlans.has(planKey)) {
          seenPlans.add(planKey);
          allPlans.push(plan);
          logger.info({ planKey, price: plan.currentPrice }, 'Collected popular plan');
        }
      }
    }

    logger.info({ popularPlanCount: allPlans.length }, 'Collected popular plans');

    // Define filter options
    const contractLengths = ['24 Months', '12 Months', '1 Month'];
    const dataOptions = ['Unlimited', '250GB', '120GB', '40GB', '25GB', '12GB', '1GB'];
    const planTypes = ['Lite', 'Value', 'Complete'];

    // Iterate through all combinations
    for (const contractLength of contractLengths) {
      logger.info({ contractLength }, 'Selecting contract length');

      const contractClicked = await clickFilter(page, 'Contract length', contractLength);
      if (!contractClicked) {
        logger.warn({ contractLength }, 'Failed to click contract length');
        continue;
      }

      for (const dataOption of dataOptions) {
        logger.info({ contractLength, dataOption }, 'Selecting data option');

        const dataClicked = await clickFilter(page, 'Data', dataOption);
        if (!dataClicked) {
          logger.debug({ dataOption }, 'Data option not available or disabled');
          continue;
        }

        for (const planType of planTypes) {
          logger.info({ contractLength, dataOption, planType }, 'Selecting plan type');

          const planTypeClicked = await clickFilter(page, 'Plan type', planType);
          if (!planTypeClicked) {
            logger.debug({ planType }, 'Plan type not available');
            continue;
          }

          // Extract the plan details (pass the selected contract length)
          const planDetails = await extractPlanDetails(page, contractLength);

          if (planDetails) {
            // Create a unique key to avoid duplicates
            const planKey = `${planDetails.dataAllowance}-${planDetails.contractTerm}-${planDetails.planType}`;

            if (!seenPlans.has(planKey)) {
              seenPlans.add(planKey);
              allPlans.push(planDetails);
              logger.info({ planKey, price: planDetails.currentPrice }, 'Collected plan');
            } else {
              logger.debug({ planKey }, 'Duplicate plan, skipping');
            }
          } else {
            logger.warn({ contractLength, dataOption, planType }, 'No plan details extracted');
          }
        }
      }
    }

    logger.info({ planCount: allPlans.length }, 'Found raw plans');

    if (allPlans.length === 0) {
      logger.warn('No plans found');
      return 0;
    }

    // Transform to PlanData format
    const planData: PlanData[] = allPlans.map(transformThreePlan);

    // Normalize plans before database insertion
    const normalizedPlans = normalizePlans(planData, 'Three');

    // Insert normalized data into database
    const results = await insertPlans('Three', normalizedPlans);
    logger.info({ source: 'Three', planCount: results.length }, 'Successfully inserted plans');

    logger.info({ planCount: results.length }, 'Three plan collection complete');
    return results.length;
  } catch (error) {
    logger.error({ error }, 'Error collecting Three plans');
    throw error;
  } finally {
    await browser.close();
  }
}

