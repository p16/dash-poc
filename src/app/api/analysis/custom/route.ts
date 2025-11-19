/**
 * Custom Comparison API Endpoint
 *
 * POST /api/analysis/custom
 * Triggers custom analysis comparing specific brands
 *
 * Story: 3.4 - Analysis API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { generateAnalysis, AnalysisError } from '@/lib/llm/analysis';
import { getPool } from '@/lib/db/connection';
import type { PlanDataForAnalysis } from '@/lib/llm/analysis';

/**
 * Request body schema for custom comparison
 */
interface CustomComparisonRequest {
  brandA: string;
  brandB: string;
}

/**
 * POST /api/analysis/custom
 *
 * Generates a custom competitive analysis comparing two specific brands.
 * Requires brandA and brandB in request body.
 *
 * Request body:
 * {
 *   "brandA": "O2",
 *   "brandB": "Vodafone"
 * }
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
 * - 400: Invalid request body (missing brandA or brandB)
 * - 404: No plan data found for specified brands
 * - 500: Analysis generation failed
 * - 503: Service temporarily unavailable (API rate limit, etc.)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('POST /api/analysis/custom - Starting custom comparison request');

    // Step 1: Parse and validate request body
    let body: CustomComparisonRequest;

    try {
      body = await request.json();
    } catch {
      logger.warn('Invalid JSON in request body');
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.brandA || typeof body.brandA !== 'string') {
      logger.warn({ body }, 'Missing or invalid brandA in request');
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'brandA is required and must be a string',
        },
        { status: 400 }
      );
    }

    if (!body.brandB || typeof body.brandB !== 'string') {
      logger.warn({ body }, 'Missing or invalid brandB in request');
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'brandB is required and must be a string',
        },
        { status: 400 }
      );
    }

    const { brandA, brandB } = body;

    logger.info({ brandA, brandB }, 'Validated custom comparison request');

    // Step 2: Fetch latest plan data from database for specified brands
    const pool = getPool();

    // Get latest plans from specified brands (last 7 days)
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

    const result = await pool.query<PlanDataForAnalysis>(planQuery, [
      brandA,
      brandB,
    ]);

    if (result.rows.length === 0) {
      logger.warn(
        { brandA, brandB },
        'No plan data found for specified brands'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'NO_DATA_FOUND',
          message: `No plans found for brands: ${brandA}, ${brandB}. Please check brand names or run data collection.`,
        },
        { status: 404 }
      );
    }

    // Check if both brands have data
    const foundBrands = [...new Set(result.rows.map((plan) => plan.source))];
    const missingBrands = [brandA, brandB].filter(
      (brand) => !foundBrands.includes(brand)
    );

    if (missingBrands.length > 0) {
      logger.warn(
        { brandA, brandB, foundBrands, missingBrands },
        'Some brands have no plan data'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'INCOMPLETE_DATA',
          message: `No plans found for: ${missingBrands.join(', ')}. Found data for: ${foundBrands.join(', ')}`,
        },
        { status: 404 }
      );
    }

    logger.info(
      { planCount: result.rows.length, foundBrands },
      'Fetched plan data for custom comparison'
    );

    // Count plans per brand
    const planCountByBrand = result.rows.reduce((acc, plan) => {
      acc[plan.source] = (acc[plan.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    logger.info(
      {
        brandA,
        brandB,
        planCountByBrand,
        totalPlans: result.rows.length,
      },
      'Plan distribution for custom comparison'
    );

    // Step 3: Call analysis engine with custom comparison type
    const analysisResult = await generateAnalysis({
      comparisonType: 'custom',
      brands: [brandA, brandB],
      planData: result.rows,
    });

    const duration = Date.now() - startTime;

    logger.info(
      {
        brandA,
        brandB,
        cached: analysisResult.cached,
        analysisId: analysisResult.analysisId,
        durationMs: duration,
      },
      'Custom comparison completed successfully'
    );

    // Step 4: Return success response
    return NextResponse.json(
      {
        success: true,
        cached: analysisResult.cached,
        analysisId: analysisResult.analysisId,
        createdAt: analysisResult.createdAt,
        analysis: analysisResult.data,
        brands: [brandA, brandB],
        metadata: {
          durationMs: duration,
          planCount: result.rows.length,
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
      'Unexpected error during custom comparison'
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
