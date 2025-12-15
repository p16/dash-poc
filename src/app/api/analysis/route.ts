/**
 * Analysis List API Endpoint
 *
 * GET /api/analysis
 * Returns recent analyses from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { getPool } from '@/lib/db/connection';
import { validateAnalysisResponse } from '@/lib/llm/validation';

/**
 * GET /api/analysis
 *
 * Returns recent analyses ordered by creation date
 *
 * Query parameters:
 * - limit: Number of results to return (default: 20, max: 100)
 * - comparisonType: Filter by type ('full' or 'custom')
 *
 * Response format:
 * {
 *   "success": true,
 *   "analyses": [
 *     {
 *       "id": "uuid",
 *       "comparisonType": "custom",
 *       "brands": ["O2", "Vodafone"],
 *       "createdAt": "2025-11-20T...",
 *       "analysisResult": { ... }
 *     }
 *   ],
 *   "count": 5
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const comparisonType = searchParams.get('comparisonType');

    logger.info({ limit, comparisonType }, 'GET /api/analysis - Fetching analyses');

    const pool = getPool();

    let query = `
      SELECT
        id,
        comparison_type,
        brands,
        created_at,
        analysis_result
      FROM analyses
    `;

    const params: (string | number)[] = [];

    if (comparisonType === 'full' || comparisonType === 'custom') {
      query += ' WHERE comparison_type = $1';
      params.push(comparisonType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    logger.info({ count: result.rows.length }, 'Fetched analyses successfully');

    return NextResponse.json({
      success: true,
      analyses: result.rows.map((row) => ({
        id: row.id,
        comparisonType: row.comparison_type,
        brands: row.brands,
        createdAt: row.created_at,
        analysisResult: validateAnalysisResponse(row.analysis_result),
      })),
      count: result.rows.length,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to fetch analyses'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch analyses',
      },
      { status: 500 }
    );
  }
}
