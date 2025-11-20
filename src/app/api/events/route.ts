// API route to save Inngest events to database
import { NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

export async function POST(request: Request) {
  try {
    const { eventId, eventName, metadata } = await request.json();

    if (!eventId || !eventName) {
      return NextResponse.json(
        { error: 'eventId and eventName are required' },
        { status: 400 }
      );
    }

    // Insert event into database (ignore if duplicate)
    const result = await query(
      `INSERT INTO inngest_events (event_id, event_name, metadata)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING *`,
      [eventId, eventName, metadata || null]
    );

    return NextResponse.json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error('Error saving event:', error);
    return NextResponse.json(
      { error: 'Failed to save event' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get recent events (last 100)
    const result = await query(
      `SELECT event_id, event_name, metadata, created_at
       FROM inngest_events
       ORDER BY created_at DESC
       LIMIT 100`
    );

    return NextResponse.json({ events: result.rows });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
