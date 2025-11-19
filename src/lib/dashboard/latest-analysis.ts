import { query } from '@/lib/db/connection';

export type Analysis = {
  id: string;
  comparison_type: 'full' | 'custom';
  brands: string[];
  analysis_result: Record<string, unknown>;
  plan_ids: string[];
  created_at: Date;
};

/**
 * Get the latest full analysis from the database
 * Query: SELECT * FROM analyses WHERE comparison_type = 'full' ORDER BY created_at DESC LIMIT 1
 * @returns Latest full analysis or null if none exists
 */
export async function getLatestFullAnalysis(): Promise<Analysis | null> {
  try {
    const result = await query(`
      SELECT
        id,
        comparison_type,
        brands,
        analysis_result,
        plan_ids,
        created_at
      FROM analyses
      WHERE comparison_type = 'full'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      comparison_type: row.comparison_type,
      brands: row.brands,
      analysis_result: row.analysis_result,
      plan_ids: row.plan_ids,
      created_at: new Date(row.created_at),
    };
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    throw new Error('Failed to fetch latest analysis');
  }
}
