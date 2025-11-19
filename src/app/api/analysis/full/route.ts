/**
 * Full Analysis API Endpoint
 *
 * POST /api/analysis/full
 * Triggers comprehensive analysis of O2 vs all competitors
 *
 * Story: 3.4 - Analysis API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { generateAnalysis, AnalysisError } from '@/lib/llm/analysis';
import { getPool } from '@/lib/db/connection';
import type { PlanDataForAnalysis } from '@/lib/llm/analysis';

/**
 * POST /api/analysis/full
 *
 * Generates a comprehensive competitive analysis comparing O2 against all competitors.
 * Fetches latest plan data from database and calls analysis engine.
 *
 * @returns Analysis results with metadata (cached status, analysis data, timestamps)
 *
 * Response format:
 * {
 *   "success": true,
 *   "cached": boolean,
 *   "analysisId": "uuid",
 *   "createdAt": "ISO-8601 timestamp",
 *   "data": { ...analysis results... }
 * }
 *
 * Error responses:
 * - 404: No plan data found in database
 * - 500: Analysis generation failed
 * - 503: Service temporarily unavailable (API rate limit, etc.)
 */
export async function POST(_request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('POST /api/analysis/full - Starting full analysis request');

    // Step 1: Fetch latest plan data from database
    const pool = getPool();

    // Get latest plans from all sources (last 7 days to ensure fresh data)
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

    const result = await pool.query<PlanDataForAnalysis>(planQuery);

    if (result.rows.length === 0) {
      logger.warn('No plan data found in database for full analysis');
      return NextResponse.json(
        {
          success: false,
          error: 'No plan data available',
          message: 'No plans found in database. Please run data collection first.',
        },
        { status: 404 }
      );
    }

    logger.info(
      { planCount: result.rows.length },
      'Fetched plan data for full analysis'
    );

    // Step 2: Extract unique brand list and count plans per brand
    const brands = [...new Set(result.rows.map((plan) => plan.source))].sort();
    const planCountByBrand = result.rows.reduce((acc, plan) => {
      acc[plan.source] = (acc[plan.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    logger.info(
      {
        brands,
        brandCount: brands.length,
        planCountByBrand,
        totalPlans: result.rows.length,
      },
      'Identified brands for analysis'
    );

    // Step 3: Call analysis engine
    const analysisResult = await generateAnalysis({
      comparisonType: 'full',
      brands,
      planData: result.rows,
    });

    const duration = Date.now() - startTime;

    logger.info(
      {
        cached: analysisResult.cached,
        analysisId: analysisResult.analysisId,
        durationMs: duration,
      },
      'Full analysis completed successfully'
    );

    // Step 4: Return success response
    return NextResponse.json(
      {
        success: true,
        cached: analysisResult.cached,
        analysisId: analysisResult.analysisId,
        createdAt: analysisResult.createdAt,
        data: analysisResult.data,
        metadata: {
          durationMs: duration,
          planCount: result.rows.length,
          brandCount: brands.length,
          brands,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    // Handle AnalysisError with specific error codes
    if (error instanceof AnalysisError) {
      logger.error(
        {
          error: error.message,
          code: error.code,
          context: error.context,
          durationMs: duration,
        },
        'Analysis generation failed with AnalysisError'
      );

      // Map error codes to HTTP status codes
      const statusCode =
        error.code === 'INVALID_REQUEST'
          ? 400
          : error.code === 'RATE_LIMIT_EXCEEDED'
          ? 503
          : 500;

      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        { status: statusCode }
      );
    }

    // Handle unexpected errors
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: duration,
      },
      'Unexpected error during full analysis'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during analysis generation',
      },
      { status: 500 }
    );
  }
}
