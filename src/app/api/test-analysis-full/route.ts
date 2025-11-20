/**
 * Test endpoint to trigger full analysis Inngest function
 *
 * For testing purposes only - not for production use
 *
 * Story: 4.7 Phase 2 - Testing
 */

import { NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export async function POST() {
  try {
    // Trigger full analysis job
    const { ids } = await inngest.send({
      name: 'analysis/full',
      data: {
        triggeredBy: 'test-endpoint',
        timestamp: new Date().toISOString(),
      },
    });

    const jobId = ids[0];

    return NextResponse.json({
      success: true,
      message: 'Full analysis job triggered successfully',
      jobId,
      statusUrl: `/api/jobs/${jobId}`,
      inngestDashboard: 'http://localhost:8288',
    }, { status: 202 });

  } catch (error) {
    console.error('Test trigger error:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger full analysis job',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
