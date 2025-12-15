/**
 * GET /api/analysis/[id]
 *
 * Retrieves a specific analysis by ID from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db/connection';
import { validateAnalysisResponse } from '@/lib/llm/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getPool();

    const result = await pool.query(
      `SELECT
        id,
        comparison_type as "comparisonType",
        brands,
        analysis_result as "analysisResult",
        created_at as "createdAt"
      FROM analyses
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    const analysis = result.rows[0];

    // Apply validation to normalize prices and other fields
    analysis.analysisResult = validateAnalysisResponse(analysis.analysisResult);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
