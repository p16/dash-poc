/**
 * Available Brands Utility
 *
 * Fetches the list of available telco brands from scraped plan data.
 * Used for populating brand selection dropdowns in custom comparison.
 *
 * Story: 4.4 - Custom Brand Comparison Tool
 */

import { getPool } from '@/lib/db/connection';

/**
 * Fetches list of unique brands that have plan data available.
 * Brands are sorted alphabetically.
 *
 * @returns Array of brand names (e.g., ['giffgaff', 'o2', 'sky', ...])
 * @throws Error if database query fails
 */
export async function getAvailableBrands(): Promise<string[]> {
  const pool = getPool();

  const result = await pool.query<{ source: string }>(
    'SELECT DISTINCT source FROM plans ORDER BY source'
  );

  return result.rows.map((row) => row.source);
}
