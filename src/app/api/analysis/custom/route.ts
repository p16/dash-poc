/**
 * Custom Comparison API Endpoint
 *
 * POST /api/analysis/custom
 * Triggers custom analysis comparing specific brands via Inngest
 *
 * Story: 3.4 - Analysis API Endpoints (Updated for Story 4.7)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { inngest } from '@/inngest/client';

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
 * Triggers a custom competitive analysis comparing two specific brands.
 * Uses Inngest for background job processing to avoid timeout issues.
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
 *   "jobId": "inngest-job-id",
 *   "message": "Custom comparison job started",
 *   "brandA": "O2",
 *   "brandB": "Vodafone",
 *   "statusUrl": "/api/jobs/[jobId]"
 * }
 *
 * Error responses:
 * - 400: Invalid request body (missing brandA or brandB)
 * - 500: Failed to trigger comparison job
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('POST /api/analysis/custom - Triggering custom comparison job');

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

    // Step 2: Trigger Inngest job for custom comparison
    const { ids } = await inngest.send({
      name: 'analysis/custom',
      data: {
        brandA,
        brandB,
        triggeredBy: 'api',
        timestamp: new Date().toISOString(),
      },
    });

    const jobId = ids[0];
    const duration = Date.now() - startTime;

    logger.info(
      { jobId, brandA, brandB, durationMs: duration },
      'Custom comparison job triggered successfully'
    );

    return NextResponse.json(
      {
        success: true,
        jobId,
        message: 'Custom comparison job started',
        brandA,
        brandB,
        statusUrl: `/api/jobs/${jobId}`,
      },
      { status: 202 } // 202 Accepted
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: duration,
      },
      'Failed to trigger custom comparison job'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to trigger comparison job',
      },
      { status: 500 }
    );
  }
}
