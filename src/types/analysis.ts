/**
 * Type definitions for competitive analysis data structures
 * Based on Story 3.2 - Prompt Engineering
 */

/**
 * Competitive sentiment insight
 */
export interface CompetitiveSentiment {
  /** Score indicating importance/severity (0-100) */
  score: number;
  /** Specific sentiment description (avoid single words) */
  sentiment: string;
  /** Description and suggestions for improvement */
  rationale: string;
}

/**
 * Product in the competitive dataset
 */
export interface CompetitivePlan {
  /** Brand name (e.g., 'O2', 'Vodafone', 'Three uswitch') */
  brand: string;
  /** Contract length (e.g., '30-day', '12-month') */
  contract: string;
  /** Data allowance (e.g., '10GB', 'Unlimited') */
  data: string;
  /** Roaming tier (None/EU/Global) */
  roaming: string;
  /** Monthly price in GBP */
  price_per_month_GBP: number;
  /** Extras (comma-separated) */
  extras: string;
  /** Connection speed info */
  speed?: string;
  /** Additional notes */
  notes?: string;
  /** Competitiveness score (0-100) */
  competitiveness_score: number;
  /** Source URL for the plan */
  source_URL?: string;
  /** Source file (o2, vodafone, three, etc.) */
  source: string;
}

/**
 * Price suggestion for O2 product
 */
export interface PriceSuggestion {
  /** Motivation for price change */
  motivation: string;
  /** Suggested price */
  price: string;
}

/**
 * O2 product breakdown details
 */
export interface O2ProductBreakdown {
  /** Product name */
  product_name: string;
  /** Contract length */
  contract: string;
  /** Data allowance */
  data: string;
  /** Roaming tier */
  roaming: string;
  /** Monthly price */
  price_per_month_GBP: number;
  /** Extras */
  extras: string;
  /** Connection speed */
  speed?: string;
  /** Competitiveness score */
  competitiveness_score: number;
  /** Source URL */
  source_URL?: string;
}

/**
 * O2 product analysis with competitive context
 */
export interface O2ProductAnalysis {
  /** Product name */
  product_name: string;
  /** Data tier (Low/Medium/Unlimited) */
  data_tier: string;
  /** Roaming tier (None/EU/Global) */
  roaming_tier: string;
  /** O2 plan details and score */
  product_breakdown: O2ProductBreakdown;
  /** Direct competitor plans */
  comparable_products: CompetitivePlan[];
  /** Strategy notes for this O2 product */
  o2_product_sentiments: string[];
  /** Suggested changes for competitiveness */
  o2_product_changes: string[];
  /** Price adjustment suggestions */
  price_suggestions: PriceSuggestion[];
  /** Source file */
  source: string;
}

/**
 * Product not considered in analysis
 */
export interface ProductNotConsidered {
  /** Product identifier (company + plan name) */
  product: string;
  /** Reason for exclusion */
  details: string;
}

/**
 * Complete analysis data structure
 */
export interface AnalysisData {
  /** Timestamp of analysis generation */
  analysis_timestamp: string;
  /** Currency used (GBP) */
  currency: string;
  /** High-level competitive insights (5-10 items) */
  overall_competitive_sentiments: CompetitiveSentiment[];
  /** O2 products analysis (at least 5 products) */
  o2_products_analysis: O2ProductAnalysis[];
  /** Complete dataset of all plans considered */
  full_competitive_dataset_all_plans: CompetitivePlan[];
  /** Plans excluded from analysis */
  products_not_considered?: ProductNotConsidered[];
}
