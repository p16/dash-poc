/**
 * Scrape Trigger API Endpoint
 *
 * Triggers the Inngest scraping function for all providers.
 * Returns immediately with job ID for status polling.
 *
 * Story: 4.6 - Trigger Scrape from Dashboard
 */

import { NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';
import { logger } from '@/lib/utils/logger';

export async function POST() {
  const startTime = Date.now();

  try {
    logger.info('POST /api/scrape - Triggering scraping job');

    // Trigger scraping job via Inngest
    const { ids } = await inngest.send({
      name: 'scrape/trigger',
      data: {
        triggeredBy: 'dashboard',
        timestamp: new Date().toISOString(),
      },
    });

    const jobId = ids[0];
    const duration = Date.now() - startTime;

    logger.info(
      { jobId, durationMs: duration },
      'Scraping job triggered successfully'
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Scraping job started',
        jobId,
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
      'Failed to trigger scraping job'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to trigger scraping job',
      },
      { status: 500 }
    );
  }
}
