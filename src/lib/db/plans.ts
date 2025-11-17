/**
 * Database Operations for Plan Data
 *
 * Handles insertion of raw scraped plan data into the database.
 * Data is stored without normalization (plan_key=NULL).
 * Story 2.5 will add normalization layer.
 */

import { getPool } from './connection';
import { logger } from '../utils/logger';
import type { PlanData } from '../../types/database';

export interface InsertPlanResult {
  id: string;
  source: string;
  plan_data: PlanData;
  scrape_timestamp: Date;
}

/**
 * Insert raw plan data into the database
 *
 * @param source - Telco name (e.g., 'O2', 'Vodafone', 'Smarty')
 * @param planData - Raw scraped plan data (not normalized)
 * @returns Inserted plan record
 *
 * @example
 * ```typescript
 * await insertPlan('O2', {
 *   name: 'Big Value Bundle',
 *   price: '£10/month',
 *   dataAllowance: '10GB',
 *   contractTerm: '12 months'
 * });
 * ```
 */
export async function insertPlan(
  source: string,
  planData: PlanData
): Promise<InsertPlanResult> {
  const pool = getPool();

  try {
    const result = await pool.query<InsertPlanResult>(
      `INSERT INTO plans (source, plan_data, plan_key)
       VALUES ($1, $2, NULL)
       RETURNING id, source, plan_data, scrape_timestamp`,
      [source, JSON.stringify(planData)]
    );

    logger.debug({ source, planId: result.rows[0].id }, 'Plan inserted');
    return result.rows[0];
  } catch (error) {
    logger.error({ source, planData, error }, 'Failed to insert plan');
    throw error;
  }
}

/**
 * Insert multiple plans in a single transaction
 *
 * @param source - Telco name
 * @param plans - Array of plan data objects
 * @returns Array of inserted plan records
 *
 * @example
 * ```typescript
 * await insertPlans('Vodafone', [
 *   { name: 'Plan 1', price: '£10' },
 *   { name: 'Plan 2', price: '£15' }
 * ]);
 * ```
 */
export async function insertPlans(
  source: string,
  plans: PlanData[]
): Promise<InsertPlanResult[]> {
  if (plans.length === 0) {
    logger.warn({ source }, 'No plans to insert');
    return [];
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const results: InsertPlanResult[] = [];

    for (const planData of plans) {
      const result = await client.query<InsertPlanResult>(
        `INSERT INTO plans (source, plan_data, plan_key)
         VALUES ($1, $2, NULL)
         RETURNING id, source, plan_data, scrape_timestamp`,
        [source, JSON.stringify(planData)]
      );

      results.push(result.rows[0]);
    }

    await client.query('COMMIT');

    logger.info(
      { source, planCount: plans.length },
      'Successfully inserted plans'
    );

    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ source, planCount: plans.length, error }, 'Failed to insert plans');
    throw error;
  } finally {
    client.release();
  }
}
