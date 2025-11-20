/**
 * Test endpoint to trigger custom comparison Inngest function
 *
 * For testing purposes only - not for production use
 *
 * Story: 4.7 Phase 2 - Testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export async function POST(request: NextRequest) {
  try {
    // Parse request body for brand selection
    let body: { brandA?: string; brandB?: string } = {};

    try {
      body = await request.json();
    } catch {
      // Use default brands if no body provided
    }

    const brandA = body.brandA || 'O2';
    const brandB = body.brandB || 'Vodafone';

    // Trigger custom comparison job
    const { ids } = await inngest.send({
      name: 'analysis/custom',
      data: {
        brandA,
        brandB,
        triggeredBy: 'test-endpoint',
        timestamp: new Date().toISOString(),
      },
    });

    const jobId = ids[0];

    return NextResponse.json({
      success: true,
      message: 'Custom comparison job triggered successfully',
      brandA,
      brandB,
      jobId,
      statusUrl: `/api/jobs/${jobId}`,
      inngestDashboard: 'http://localhost:8288',
    }, { status: 202 });

  } catch (error) {
    console.error('Test trigger error:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger custom comparison job',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
