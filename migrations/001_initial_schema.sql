-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for BMAD Scraper Compare
-- Created: 2025-11-17
-- Story: 2.1 - Database Schema Design & Implementation

-- ============================================================================
-- Table: plans
-- Purpose: Store plan data from telco websites and aggregators
-- ============================================================================

CREATE TABLE IF NOT EXISTS plans (
  -- Primary key (UUID for globally unique identifiers)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source identifier (e.g., 'O2', 'Vodafone', 'Uswitch')
  source TEXT NOT NULL,

  -- Composite key for tracking plan history over time
  -- Format: source-dataAllowance-contractTerm (e.g., 'O2-10GB-12months')
  -- Generated programmatically after normalization in Story 1.4
  plan_key TEXT,

  -- Flexible JSONB storage for plan details
  -- Structure will be refined in Story 1.4 after collecting real data
  -- Expected fields: name, price, data_allowance, contract_term, extras, etc.
  -- Plans are identified by their characteristics (source + data attributes)
  plan_data JSONB NOT NULL,

  -- Timestamp when the plan was scraped
  scrape_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Table: analyses
-- Purpose: Store LLM-generated comparison analyses
-- ============================================================================

CREATE TABLE IF NOT EXISTS analyses (
  -- Primary key (UUID for globally unique identifiers)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type of comparison: 'full' (all brands) or 'custom' (user-selected brands)
  comparison_type TEXT NOT NULL,

  -- Array of brand names being compared
  brands TEXT[] NOT NULL,

  -- Flexible JSONB storage for LLM analysis results
  -- Structure determined by LLM prompt engineering (Story 3.2)
  analysis_result JSONB NOT NULL,

  -- Array of plan IDs that were used in this analysis
  -- References the UUID ids from plans table
  plan_ids UUID[] NOT NULL,

  -- Timestamp when the analysis was created
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Index on plans.scrape_timestamp for time-based queries
-- Use case: "Get latest plans", "Get plans from last 24 hours"
CREATE INDEX IF NOT EXISTS idx_plans_scrape_timestamp
  ON plans(scrape_timestamp DESC);

-- Index on plans.source for filtering by telco/aggregator
-- Use case: "Get all O2 plans", "Compare plans from Vodafone"
CREATE INDEX IF NOT EXISTS idx_plans_source
  ON plans(source);

-- Index on plans.plan_key for historical tracking
-- Use case: "Get price history for a specific plan", "Track plan changes over time"
CREATE INDEX IF NOT EXISTS idx_plans_plan_key_timestamp
  ON plans(plan_key, scrape_timestamp DESC);

-- Index on analyses.created_at for recent analysis queries
-- Use case: "Get latest analyses", "Get analysis history"
CREATE INDEX IF NOT EXISTS idx_analyses_created_at
  ON analyses(created_at DESC);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE plans IS 'Stores plan data scraped from telco websites and aggregators. Plans identified by characteristics (source + plan_data attributes), not external IDs.';
COMMENT ON COLUMN plans.plan_key IS 'Composite identifier for tracking plan history across scrapes. Format: {source}-{data_allowance}-{contract_term} (e.g., O2-10GB-12months, Vodafone-Unlimited-24months, Three-50GB-1month). Populated in Story 1.4 after data normalization. Nullable until then.';
COMMENT ON COLUMN plans.plan_data IS 'JSONB structure - flexible until Story 1.4 normalization. Contains name, price, data_allowance, contract_term, etc. Example: {"name": "Big Value Bundle", "price": "£10/month", "data_allowance": "10GB", "contract_term": "12 months", "extras": ["Free calls", "EU roaming"]}.';

COMMENT ON TABLE analyses IS 'Stores LLM-generated comparison analyses';
COMMENT ON COLUMN analyses.plan_ids IS 'References to UUID ids from plans table used in this analysis';

