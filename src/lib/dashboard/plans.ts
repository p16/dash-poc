/**
 * Plan Data Fetching Utilities
 *
 * Utilities for fetching and querying plan data from the database.
 * Uses DISTINCT ON pattern to get only latest plans per source/plan_key.
 *
 * Story: 4.5 - Plan Data Table & Filtering
 */

import { getPool } from '@/lib/db/connection';
import type { Plan } from '@/types/database';

/**
 * Fetches the latest version of all plans using DISTINCT ON pattern.
 * Only returns the most recent scrape for each unique plan (source + plan_key).
 *
 * @returns Array of latest plans
 * @throws Error if database query fails
 */
export async function getLatestPlans(): Promise<Plan[]> {
  const pool = getPool();

  const result = await pool.query<Plan>(`
    SELECT DISTINCT ON (source, plan_key)
      id,
      source,
      plan_key,
      plan_data,
      scrape_timestamp
    FROM plans
    ORDER BY source, plan_key, scrape_timestamp DESC
  `);

  return result.rows;
}
