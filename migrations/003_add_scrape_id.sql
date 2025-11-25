-- Migration: 003_add_scrape_id.sql
-- Description: Add scrape_id to group plans from the same scrape run
-- Created: 2025-11-21

-- Add scrape_id column to plans table
ALTER TABLE plans
ADD COLUMN scrape_id TEXT;

-- Create index on scrape_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_plans_scrape_id
  ON plans(scrape_id);

-- Add comment
COMMENT ON COLUMN plans.scrape_id IS 'Event ID from Inngest identifying the scrape run that collected this plan. All plans from the same scrape run share the same scrape_id.';
