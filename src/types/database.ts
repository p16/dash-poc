/**
 * Database Type Definitions
 *
 * TypeScript types for database tables and JSONB payloads.
 * JSONB structures are flexible until Story 1.4 (data normalization).
 */

/**
 * Plan data from telco websites and aggregators
 * Plans are identified by their UUID and characteristics (source + plan_data)
 * No external plan_id - plans are identified by data attributes
 */
export interface Plan {
  id: string; // UUID
  source: string; // Telco name or aggregator (e.g., 'O2', 'Vodafone', 'Uswitch')
  plan_key: string | null; // Composite identifier for history tracking (e.g., 'O2-10GB-12months')
  plan_data: PlanData; // JSONB - flexible structure
  scrape_timestamp: Date;
}

/**
 * JSONB structure for plan_data
 * Structure is flexible and will be refined in Story 1.4
 * after collecting real data from multiple sources
 */
export interface PlanData {
  name?: string;
  price?: string;
  data_allowance?: string;
  contract_term?: string;
  extras?: string[];
  url?: string;
  // Additional fields may be added as data collection progresses
  [key: string]: unknown;
}

/**
 * LLM-generated comparison analysis
 */
export interface Analysis {
  id: string; // UUID
  comparison_type: 'full' | 'custom'; // Full comparison or custom brand selection
  brands: string[]; // Array of brand names being compared
  analysis_result: AnalysisResult; // JSONB - flexible structure
  plan_ids: string[]; // Array of UUIDs referencing plans table
  created_at: Date;
}

/**
 * JSONB structure for analysis_result
 * Structure is flexible and will be determined by LLM prompt engineering (Story 3.2)
 */
export interface AnalysisResult {
  summary?: string;
  recommendations?: string[];
  insights?: Record<string, unknown>;
  // Additional fields will be defined in Story 3.2
  [key: string]: unknown;
}

/**
 * Input type for creating a new plan
 * No plan_id needed - plans identified by UUID and characteristics
 * plan_key will be populated in Story 1.4 after normalization
 */
export interface CreatePlanInput {
  source: string;
  plan_key?: string | null; // Optional - generated in Story 1.4
  plan_data: PlanData;
  scrape_timestamp?: Date; // Optional, defaults to NOW()
}

/**
 * Input type for creating a new analysis
 */
export interface CreateAnalysisInput {
  comparison_type: 'full' | 'custom';
  brands: string[];
  analysis_result: AnalysisResult;
  plan_ids: string[]; // Array of plan UUIDs
  created_at?: Date; // Optional, defaults to NOW()
}
