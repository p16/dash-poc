/**
 * Inngest Function Definitions
 *
 * Background job functions for long-running operations.
 * Story: 4.7 - Add Inngest Infrastructure
 */

import { inngest } from './client';
import { scrapeAndStoreO2Plans } from '../lib/scraping/collectors/o2';
import { scrapeAndStoreVodafonePlans } from '../lib/scraping/collectors/vodafone';
import { scrapeAndStoreSkyPlans } from '../lib/scraping/collectors/sky';
import { scrapeAndStoreTescoPlans } from '../lib/scraping/collectors/tesco';
import { scrapeAndStoreThreePlans } from '../lib/scraping/collectors/three';
import { scrapeAndStoreGiffgaffPlans } from '../lib/scraping/collectors/giffgaff';
import { scrapeAndStoreSmartyPlans } from '../lib/scraping/collectors/smarty';
import { scrapeAndStoreUswitchPlans } from '../lib/scraping/collectors/uswitch';
import { logger } from '../lib/utils/logger';

/**
 * Scraping Function
 *
 * Scrapes plan data from all 8 sources (7 telcos + 1 aggregator).
 * Each collector runs as a separate step for progress tracking.
 *
 * Story: 4.7 Phase 2 - Scraping Inngest Function
 *
 * @event scrape/trigger - Triggered from dashboard or API
 * @returns Summary with total plans collected and execution time
 */
export const scrapeAllPlans = inngest.createFunction(
  {
    id: 'scrape-all-plans',
    name: 'Scrape All Mobile Plans',
    concurrency: {
      limit: 1, // Only one scrape at a time
    },
    retries: 0, // Disable automatic retries
  },
  { event: 'scrape/trigger' },
  async ({ event, step }) => {
    const startTime = Date.now();
    const results: Array<{
      name: string;
      status: 'success' | 'failed';
      plansCollected: number;
      executionTime: number;
      error?: string;
    }> = [];

    logger.info({ triggeredBy: event.data.triggeredBy }, 'Starting scrape job');

    // Step 1: Scrape O2
    const o2Result = await step.run('scrape-o2', async () => {
      const stepStart = Date.now();
      try {
        logger.info('Scraping O2...');
        const plansCollected = await scrapeAndStoreO2Plans();
        const executionTime = Date.now() - stepStart;
        logger.info({ plansCollected, executionTime }, 'O2 scrape completed');
        return {
          name: 'O2',
          status: 'success' as const,
          plansCollected,
          executionTime
        };
      } catch (error) {
        const executionTime = Date.now() - stepStart;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error, executionTime }, 'O2 scrape failed');
        return {
          name: 'O2',
          status: 'failed' as const,
          plansCollected: 0,
          executionTime,
          error: errorMessage
        };
      }
    });
    results.push(o2Result);

    // Step 2: Scrape Vodafone
    const vodafoneResult = await step.run('scrape-vodafone', async () => {
      const stepStart = Date.now();
      try {
        logger.info('Scraping Vodafone...');
        const plansCollected = await scrapeAndStoreVodafonePlans();
        const executionTime = Date.now() - stepStart;
        logger.info({ plansCollected, executionTime }, 'Vodafone scrape completed');
        return {
          name: 'Vodafone',
          status: 'success' as const,
          plansCollected,
          executionTime
        };
      } catch (error) {
        const executionTime = Date.now() - stepStart;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error, executionTime }, 'Vodafone scrape failed');
        return {
          name: 'Vodafone',
          status: 'failed' as const,
          plansCollected: 0,
          executionTime,
          error: errorMessage
        };
      }
    });
    results.push(vodafoneResult);

    // Step 3: Scrape Sky
    const skyResult = await step.run('scrape-sky', async () => {
      const stepStart = Date.now();
      try {
        logger.info('Scraping Sky...');
        const plansCollected = await scrapeAndStoreSkyPlans();
        const executionTime = Date.now() - stepStart;
        logger.info({ plansCollected, executionTime }, 'Sky scrape completed');
        return {
          name: 'Sky',
          status: 'success' as const,
          plansCollected,
          executionTime
        };
      } catch (error) {
        const executionTime = Date.now() - stepStart;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error, executionTime }, 'Sky scrape failed');
        return {
          name: 'Sky',
          status: 'failed' as const,
          plansCollected: 0,
          executionTime,
          error: errorMessage
        };
      }
    });
    results.push(skyResult);

    // Step 4: Scrape Tesco
    const tescoResult = await step.run('scrape-tesco', async () => {
      const stepStart = Date.now();
      try {
        logger.info('Scraping Tesco...');
        const plansCollected = await scrapeAndStoreTescoPlans();
        const executionTime = Date.now() - stepStart;
        logger.info({ plansCollected, executionTime }, 'Tesco scrape completed');
        return {
          name: 'Tesco',
          status: 'success' as const,
          plansCollected,
          executionTime
        };
      } catch (error) {
        const executionTime = Date.now() - stepStart;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error, executionTime }, 'Tesco scrape failed');
        return {
          name: 'Tesco',
          status: 'failed' as const,
          plansCollected: 0,
          executionTime,
          error: errorMessage
        };
      }
    });
    results.push(tescoResult);

    // Step 5: Scrape Three
    const threeResult = await step.run('scrape-three', async () => {
      const stepStart = Date.now();
      try {
        logger.info('Scraping Three...');
        const plansCollected = await scrapeAndStoreThreePlans();
        const executionTime = Date.now() - stepStart;
        logger.info({ plansCollected, executionTime }, 'Three scrape completed');
        return {
          name: 'Three',
          status: 'success' as const,
          plansCollected,
          executionTime
        };
      } catch (error) {
        const executionTime = Date.now() - stepStart;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error, executionTime }, 'Three scrape failed');
        return {
          name: 'Three',
          status: 'failed' as const,
          plansCollected: 0,
          executionTime,
          error: errorMessage
        };
      }
    });
    results.push(threeResult);

    // Step 6: Scrape Giffgaff
    const giffgaffResult = await step.run('scrape-giffgaff', async () => {
      const stepStart = Date.now();
      try {
        logger.info('Scraping Giffgaff...');
        const plansCollected = await scrapeAndStoreGiffgaffPlans();
        const executionTime = Date.now() - stepStart;
        logger.info({ plansCollected, executionTime }, 'Giffgaff scrape completed');
        return {
          name: 'Giffgaff',
          status: 'success' as const,
          plansCollected,
          executionTime
        };
      } catch (error) {
        const executionTime = Date.now() - stepStart;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error, executionTime }, 'Giffgaff scrape failed');
        return {
          name: 'Giffgaff',
          status: 'failed' as const,
          plansCollected: 0,
          executionTime,
          error: errorMessage
        };
      }
    });
    results.push(giffgaffResult);

    // Step 7: Scrape Smarty
    const smartyResult = await step.run('scrape-smarty', async () => {
      const stepStart = Date.now();
      try {
        logger.info('Scraping Smarty...');
        const plansCollected = await scrapeAndStoreSmartyPlans();
        const executionTime = Date.now() - stepStart;
        logger.info({ plansCollected, executionTime }, 'Smarty scrape completed');
        return {
          name: 'Smarty',
          status: 'success' as const,
          plansCollected,
          executionTime
        };
      } catch (error) {
        const executionTime = Date.now() - stepStart;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error, executionTime }, 'Smarty scrape failed');
        return {
          name: 'Smarty',
          status: 'failed' as const,
          plansCollected: 0,
          executionTime,
          error: errorMessage
        };
      }
    });
    results.push(smartyResult);

    // Step 8: Scrape Uswitch
    const uswitchResult = await step.run('scrape-uswitch', async () => {
      const stepStart = Date.now();
      try {
        logger.info('Scraping Uswitch...');
        const plansCollected = await scrapeAndStoreUswitchPlans();
        const executionTime = Date.now() - stepStart;
        logger.info({ plansCollected, executionTime }, 'Uswitch scrape completed');
        return {
          name: 'Uswitch',
          status: 'success' as const,
          plansCollected,
          executionTime
        };
      } catch (error) {
        const executionTime = Date.now() - stepStart;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ error, executionTime }, 'Uswitch scrape failed');
        return {
          name: 'Uswitch',
          status: 'failed' as const,
          plansCollected: 0,
          executionTime,
          error: errorMessage
        };
      }
    });
    results.push(uswitchResult);

    // Calculate summary
    const totalExecutionTime = Date.now() - startTime;
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    const totalPlans = successful.reduce((sum, r) => sum + r.plansCollected, 0);
    const successRate = (successful.length / results.length) * 100;

    const summary = {
      success: true,
      totalPlans,
      successfulCollectors: successful.length,
      failedCollectors: failed.length,
      successRate,
      totalExecutionTime,
      results,
    };

    logger.info(summary, 'Scrape job completed');

    return summary;
  }
);

/**
 * Full Analysis Function
 *
 * Generates comprehensive competitive analysis comparing O2 against all competitors.
 * Fetches latest plan data from database and calls Gemini API for analysis.
 *
 * Story: 4.7 Phase 2 - Full Analysis Inngest Function
 *
 * @event analysis/full - Triggered from dashboard or API
 * @returns Analysis results with metadata
 */
export const runFullAnalysis = inngest.createFunction(
  {
    id: 'run-full-analysis',
    name: 'Run Full Competitive Analysis',
    concurrency: {
      limit: 2, // Allow 2 concurrent analyses
    },
    retries: 0, // Disable automatic retries to avoid hitting rate limits
  },
  { event: 'analysis/full' },
  async ({ event, step }) => {
    const startTime = Date.now();

    logger.info({ triggeredBy: event.data.triggeredBy }, 'Starting full analysis job');

    // Step 1: Fetch plan data from database
    const planData = await step.run('fetch-plan-data', async () => {
      const { getPool } = await import('../lib/db/connection');
      const pool = getPool();

      const planQuery = `
        SELECT DISTINCT ON (source, plan_key)
          id,
          source,
          plan_data,
          scrape_timestamp
        FROM plans
        WHERE scrape_timestamp > NOW() - INTERVAL '7 days'
        ORDER BY source, plan_key, scrape_timestamp DESC
      `;

      const result = await pool.query(planQuery);

      if (result.rows.length === 0) {
        throw new Error('No plan data found in database');
      }

      logger.info({ planCount: result.rows.length }, 'Fetched plan data for analysis');

      return {
        plans: result.rows,
        planCount: result.rows.length,
      };
    });

    // Step 2: Extract brands
    const brands = await step.run('extract-brands', async () => {
      const uniqueBrands = [...new Set(planData.plans.map((plan: any) => plan.source))].sort();

      logger.info({ brands: uniqueBrands, brandCount: uniqueBrands.length }, 'Extracted brands');

      return uniqueBrands;
    });

    // Step 3: Generate analysis using Gemini API
    const analysisResult = await step.run('generate-analysis', async () => {
      const { generateAnalysis } = await import('../lib/llm/analysis');

      const result = await generateAnalysis({
        comparisonType: 'full',
        brands,
        planData: planData.plans,
      });

      logger.info(
        {
          cached: result.cached,
          analysisId: result.analysisId
        },
        'Analysis generated'
      );

      return result;
    });

    // Calculate summary
    const totalExecutionTime = Date.now() - startTime;

    const summary = {
      success: true,
      cached: analysisResult.cached,
      analysisId: analysisResult.analysisId,
      createdAt: analysisResult.createdAt,
      data: analysisResult.data,
      metadata: {
        totalExecutionTime,
        planCount: planData.planCount,
        brandCount: brands.length,
        brands,
      },
    };

    logger.info(
      {
        analysisId: analysisResult.analysisId,
        totalExecutionTime,
        cached: analysisResult.cached
      },
      'Full analysis job completed'
    );

    return summary;
  }
);

/**
 * Custom Comparison Function
 *
 * Generates custom competitive analysis comparing two specific brands.
 * Fetches latest plan data for specified brands and calls Gemini API for analysis.
 *
 * Story: 4.7 Phase 2 - Custom Comparison Inngest Function
 *
 * @event analysis/custom - Triggered from dashboard or API
 * @data { brandA: string, brandB: string }
 * @returns Analysis results with metadata
 */
export const runCustomComparison = inngest.createFunction(
  {
    id: 'run-custom-comparison',
    name: 'Run Custom Brand Comparison',
    concurrency: {
      limit: 3, // Allow 3 concurrent custom comparisons
    },
    retries: 0, // Disable automatic retries to avoid hitting rate limits
  },
  { event: 'analysis/custom' },
  async ({ event, step }) => {
    const startTime = Date.now();
    const { brandA, brandB } = event.data;

    if (!brandA || !brandB) {
      throw new Error('brandA and brandB are required in event data');
    }

    logger.info({ brandA, brandB, triggeredBy: event.data.triggeredBy }, 'Starting custom comparison job');

    // Step 1: Validate brands
    await step.run('validate-brands', async () => {
      if (typeof brandA !== 'string' || typeof brandB !== 'string') {
        throw new Error('brandA and brandB must be strings');
      }

      logger.info({ brandA, brandB }, 'Validated brand parameters');

      return { brandA, brandB };
    });

    // Step 2: Fetch plan data for specified brands
    const planData = await step.run('fetch-plan-data', async () => {
      const { getPool } = await import('../lib/db/connection');
      const pool = getPool();

      const planQuery = `
        SELECT DISTINCT ON (source, plan_key)
          id,
          source,
          plan_data,
          scrape_timestamp
        FROM plans
        WHERE scrape_timestamp > NOW() - INTERVAL '7 days'
          AND (source = $1 OR source = $2)
        ORDER BY source, plan_key, scrape_timestamp DESC
      `;

      const result = await pool.query(planQuery, [brandA, brandB]);

      if (result.rows.length === 0) {
        throw new Error(`No plan data found for brands: ${brandA}, ${brandB}`);
      }

      // Check if both brands have data
      const foundBrands = [...new Set(result.rows.map((plan: any) => plan.source))];
      const missingBrands = [brandA, brandB].filter(
        (brand) => !foundBrands.includes(brand)
      );

      if (missingBrands.length > 0) {
        throw new Error(
          `No plans found for: ${missingBrands.join(', ')}. Found data for: ${foundBrands.join(', ')}`
        );
      }

      logger.info(
        { planCount: result.rows.length, foundBrands },
        'Fetched plan data for custom comparison'
      );

      return {
        plans: result.rows,
        planCount: result.rows.length,
      };
    });

    // Step 3: Generate analysis using Gemini API
    const analysisResult = await step.run('generate-analysis', async () => {
      const { generateAnalysis } = await import('../lib/llm/analysis');

      const result = await generateAnalysis({
        comparisonType: 'custom',
        brands: [brandA, brandB],
        planData: planData.plans,
      });

      logger.info(
        {
          cached: result.cached,
          analysisId: result.analysisId,
          brandA,
          brandB
        },
        'Custom analysis generated'
      );

      return result;
    });

    // Calculate summary
    const totalExecutionTime = Date.now() - startTime;

    const summary = {
      success: true,
      cached: analysisResult.cached,
      analysisId: analysisResult.analysisId,
      createdAt: analysisResult.createdAt,
      analysis: analysisResult.data,
      brands: [brandA, brandB],
      metadata: {
        totalExecutionTime,
        planCount: planData.planCount,
      },
    };

    logger.info(
      {
        analysisId: analysisResult.analysisId,
        totalExecutionTime,
        cached: analysisResult.cached,
        brandA,
        brandB
      },
      'Custom comparison job completed'
    );

    return summary;
  }
);
