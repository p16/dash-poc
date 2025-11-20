/**
 * Full Analysis API Endpoint
 *
 * POST /api/analysis/full
 * Triggers comprehensive analysis of O2 vs all competitors via Inngest
 *
 * Story: 3.4 - Analysis API Endpoints (Updated for Story 4.7)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { inngest } from '@/inngest/client';

/**
 * POST /api/analysis/full
 *
 * Triggers a comprehensive competitive analysis comparing O2 against all competitors.
 * Uses Inngest for background job processing to avoid timeout issues.
 *
 * @returns Job information for status polling
 *
 * Response format:
 * {
 *   "success": true,
 *   "jobId": "inngest-job-id",
 *   "message": "Analysis job started",
 *   "statusUrl": "/api/jobs/[jobId]"
 * }
 *
 * Error responses:
 * - 500: Failed to trigger analysis job
 */
export async function POST(_request: NextRequest) {
  const startTime = Date.now();

  try {
    logger.info('POST /api/analysis/full - Triggering full analysis job');

    // Trigger Inngest job for full analysis
    const { ids } = await inngest.send({
      name: 'analysis/full',
      data: {
        triggeredBy: 'api',
        timestamp: new Date().toISOString(),
      },
    });

    const jobId = ids[0];
    const duration = Date.now() - startTime;

    logger.info(
      { jobId, durationMs: duration },
      'Full analysis job triggered successfully'
    );

    return NextResponse.json(
      {
        success: true,
        jobId,
        message: 'Analysis job started',
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
      'Failed to trigger full analysis job'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to trigger analysis job',
      },
      { status: 500 }
    );
  }
}
