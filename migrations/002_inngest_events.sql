-- Migration: 002_inngest_events.sql
-- Description: Add table for tracking Inngest event IDs and job runs
-- Created: 2025-11-19

-- ============================================================================
-- Table: inngest_events
-- Purpose: Store Inngest event IDs for tracking job runs across page refreshes
-- ============================================================================

CREATE TABLE IF NOT EXISTS inngest_events (
  -- Primary key (UUID for globally unique identifiers)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The event ID returned from inngest.send()
  event_id TEXT NOT NULL UNIQUE,

  -- Human-readable event name/type (e.g., 'scrape/trigger', 'analysis/full')
  event_name TEXT NOT NULL,

  -- Timestamp when the event was created
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Optional metadata about the event
  metadata JSONB
);

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Index on event_id for quick lookup
CREATE INDEX IF NOT EXISTS idx_inngest_events_event_id
  ON inngest_events(event_id);

-- Index on created_at for recent events
CREATE INDEX IF NOT EXISTS idx_inngest_events_created_at
  ON inngest_events(created_at DESC);

-- Index on event_name for filtering by type
CREATE INDEX IF NOT EXISTS idx_inngest_events_event_name
  ON inngest_events(event_name);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE inngest_events IS 'Stores Inngest event IDs for tracking job runs. Persists across page refreshes.';
COMMENT ON COLUMN inngest_events.event_id IS 'Event ID returned from inngest.send() - used to query runs via /v1/events/{eventId}/runs';
COMMENT ON COLUMN inngest_events.event_name IS 'Human-readable event type (e.g., scrape/trigger, analysis/full, analysis/custom)';
COMMENT ON COLUMN inngest_events.metadata IS 'Optional JSONB metadata about the event (e.g., brands for custom comparison)';
