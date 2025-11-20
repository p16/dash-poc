/**
 * Test Inngest Endpoint
 *
 * Simple endpoint to test Inngest integration.
 * Visit: http://localhost:3000/api/test-inngest
 *
 * Story: 4.7 - Add Inngest Infrastructure
 */

import { inngest } from '@/inngest/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Send a test event to trigger the hello-world function
    await inngest.send({
      name: 'test/hello',
      data: {
        message: 'Testing Inngest integration!',
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test event sent to Inngest!',
      instructions: [
        '1. Check the Inngest Dev Server at http://localhost:8288',
        '2. You should see the "hello-world" function running',
        '3. Click on the run to see the execution details'
      ]
    });
  } catch (error) {
    console.error('Inngest test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
