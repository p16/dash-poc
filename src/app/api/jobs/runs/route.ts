/**
 * API endpoint to fetch runs for a specific event ID
 *
 * Uses Inngest API to query runs triggered by an event
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const signingKey = process.env.INNGEST_SIGNING_KEY;

    if (!signingKey) {
      // In development, signing key may not be configured
      // Return empty runs with a note to check Inngest dev server
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          runs: [],
          eventId,
          note: 'Development mode: Check http://localhost:8288 for actual run status',
        });
      }

      return NextResponse.json(
        { error: 'Inngest signing key not configured' },
        { status: 500 }
      );
    }

    // Query Inngest API for runs triggered by this event
    const response = await fetch(
      `https://api.inngest.com/v1/events/${eventId}/runs`,
      {
        headers: {
          'Authorization': `Bearer ${signingKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Inngest API error:', errorText);
      return NextResponse.json(
        {
          error: 'Failed to fetch runs from Inngest',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      runs: data.data || [],
      eventId,
    });

  } catch (error) {
    console.error('Error fetching runs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch runs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
