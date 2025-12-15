/**
 * Analysis Generation & Caching Engine
 *
 * Generates LLM-powered competitive intelligence analyses with smart caching
 * to avoid redundant API calls. Integrates with Gemini API and database storage.
 *
 * Story: 3.3 - Analysis Generation & Caching Logic
 */

import { logger } from '../utils/logger';
import { getPool } from '../db/connection';
import { queryGeminiJson } from './gemini';
import {
  validateAnalysisResponse,
  validateCustomComparisonResponse,
  ValidationError,
} from './validation';

// Declare webpack global for type checking
declare const __webpack_require__: unknown;

// Load prompt templates
// In Next.js webpack builds, these are bundled as strings
// In tsx/node scripts, fs.readFileSync is used via try/catch
let promptFullAnalysis: string;
let promptCustomComparison: string;

// Check if we're in a webpack/Next.js context
if (typeof __webpack_require__ !== 'undefined') {
  // Next.js webpack build - use require
  promptFullAnalysis = require('./prompts/prompt-full-analysis.txt');
  promptCustomComparison = require('./prompts/prompt-custom-comparison.txt');
} else {
  // Node/tsx runtime - use fs
  const { readFileSync } = require('fs');
  const { join } = require('path');
  promptFullAnalysis = readFileSync(
    join(__dirname, 'prompts', 'prompt-full-analysis.txt'),
    'utf-8'
  );
  promptCustomComparison = readFileSync(
    join(__dirname, 'prompts', 'prompt-custom-comparison.txt'),
    'utf-8'
  );
}

/**
 * Type of competitive analysis comparison
 */
export type ComparisonType = 'full' | 'custom';

/**
 * Request parameters for generating an analysis
 */
export interface AnalysisRequest {
  /** Type of comparison: 'full' (all brands) or 'custom' (user-selected brands) */
  comparisonType: ComparisonType;

  /** Array of brand names to include in analysis (e.g., ['O2', 'Vodafone', 'Sky']) */
  brands: string[];

  /** Array of plan data objects to analyze */
  planData: PlanDataForAnalysis[];
}

/**
 * Plan data structure for analysis input
 */
export interface PlanDataForAnalysis {
  /** UUID of the plan from the database */
  id: string;

  /** Telco/brand name (e.g., 'O2', 'Vodafone') */
  source: string;

  /** Full plan details as stored in database */
  plan_data: Record<string, any>;

  /** When the plan was scraped */
  scrape_timestamp: Date;
}

/**
 * Response from analysis generation
 */
export interface AnalysisResponse {
  /** Whether this result came from cache (true) or was freshly generated (false) */
  cached: boolean;

  /** UUID of the analysis record in database */
  analysisId: string;

  /** When the analysis was created */
  createdAt: Date;

  /** The actual analysis data (validated JSON from LLM or cache) */
  data: Record<string, any>;
}

/**
 * Error types for analysis generation failures
 */
export enum AnalysisErrorCode {
  /** Gemini API call failed */
  API_FAILURE = 'API_FAILURE',

  /** API rate limit exceeded */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  /** Response validation failed after retries */
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  /** Database operation failed */
  DATABASE_ERROR = 'DATABASE_ERROR',

  /** Prompt template file not found or unreadable */
  PROMPT_ERROR = 'PROMPT_ERROR',

  /** Invalid request parameters */
  INVALID_REQUEST = 'INVALID_REQUEST',
}

/**
 * Custom error for analysis generation failures
 */
export class AnalysisError extends Error {
  constructor(
    message: string,
    public code: AnalysisErrorCode,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

/**
 * Database record structure for cached analysis
 */
interface CachedAnalysis {
  id: string;
  comparison_type: string;
  brands: string[];
  analysis_result: Record<string, any>;
  plan_ids: string[];
  created_at: Date;
}

/**
 * Load prompt template from file
 *
 * @param comparisonType - Type of comparison to load prompt for
 * @returns Prompt template string
 * @throws {AnalysisError} If prompt file cannot be read
 */
async function loadPromptTemplate(
  comparisonType: ComparisonType
): Promise<string> {
  try {
    const template =
      comparisonType === 'full' ? promptFullAnalysis : promptCustomComparison;

    logger.debug(
      { comparisonType, templateLength: template.length },
      'Loaded prompt template'
    );
    return template;
  } catch (error) {
    const promptFilename =
      comparisonType === 'full'
        ? 'prompt-full-analysis.txt'
        : 'prompt-custom-comparison.txt';
    const errorMessage = `Failed to load prompt template: ${promptFilename}`;
    logger.error({ error }, errorMessage);
    throw new AnalysisError(errorMessage, AnalysisErrorCode.PROMPT_ERROR, {
      comparisonType,
      error,
    });
  }
}

/**
 * Format prompt with plan data and brand placeholders
 *
 * Replaces:
 * - {{BRAND_A}} and {{BRAND_B}} with actual brand names (custom comparison only)
 * - Appends plan data grouped by brand for LLM context
 *
 * @param template - Prompt template string
 * @param brands - Array of brand names
 * @param planData - Plan data to include in prompt
 * @param comparisonType - Type of comparison
 * @returns Formatted prompt ready for LLM
 */
function formatPromptWithData(
  template: string,
  brands: string[],
  planData: PlanDataForAnalysis[],
  comparisonType: ComparisonType
): string {
  let formatted = template;

  // Replace brand placeholders for custom comparisons
  if (comparisonType === 'custom') {
    if (brands.length >= 2) {
      formatted = formatted.replace(/\{\{BRAND_A\}\}/g, brands[0]);
      formatted = formatted.replace(/\{\{BRAND_B\}\}/g, brands[1]);
    }
  }

  // Group plans by brand/source
  const plansByBrand: Record<string, any[]> = {};

  planData.forEach((plan) => {
    const brand = plan.source;
    if (!plansByBrand[brand]) {
      plansByBrand[brand] = [];
    }

    // Simplify plan structure for LLM
    plansByBrand[brand].push({
      id: plan.id,
      ...plan.plan_data,
      scrape_timestamp: plan.scrape_timestamp,
    });
  });

  // Format data by brand
  formatted += '\n\n';

  // Sort brands alphabetically for consistent output
  const sortedBrands = Object.keys(plansByBrand).sort();

  sortedBrands.forEach((brand) => {
    const plans = plansByBrand[brand];
    formatted += `${brand} data:\n`;
    formatted += JSON.stringify(plans, null, 2);
    formatted += '\n\n';
  });

  logger.debug(
    {
      comparisonType,
      brands,
      planCount: planData.length,
      brandsFound: sortedBrands,
      promptLength: formatted.length,
    },
    'Formatted prompt with plan data grouped by brand'
  );

  return formatted;
}

/**
 * Check if a matching analysis exists in cache
 *
 * Looks for an existing analysis that matches:
 * - Same comparison type ('full' or 'custom')
 * - Same set of brands (order-agnostic)
 * - Same set of plan IDs (order-agnostic)
 * - Created within last 24 hours
 *
 * @param comparisonType - Type of comparison
 * @param brands - Array of brand names
 * @param planIds - Array of plan UUIDs
 * @returns Cached analysis if found, null otherwise
 */
async function checkAnalysisCache(
  comparisonType: ComparisonType,
  brands: string[],
  planIds: string[]
): Promise<CachedAnalysis | null> {
  const pool = getPool();

  try {
    // Query for matching analysis created in last 24 hours
    // Array comparison: @> means "contains" and <@ means "is contained by"
    // Together they ensure exact match regardless of order
    const result = await pool.query<CachedAnalysis>(
      `SELECT id, comparison_type, brands, analysis_result, plan_ids, created_at
       FROM analyses
       WHERE comparison_type = $1
         AND brands @> $2 AND brands <@ $2
         AND plan_ids @> $3 AND plan_ids <@ $3
         AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC
       LIMIT 1`,
      [comparisonType, brands, planIds]
    );

    if (result.rows.length === 0) {
      logger.debug(
        { comparisonType, brands, planCount: planIds.length },
        'Cache miss: No matching analysis found'
      );
      return null;
    }

    const cached = result.rows[0];
    logger.info(
      {
        analysisId: cached.id,
        comparisonType: cached.comparison_type,
        brands: cached.brands,
        createdAt: cached.created_at,
        ageMinutes: Math.round(
          (Date.now() - cached.created_at.getTime()) / 1000 / 60
        ),
      },
      'Cache hit: Found matching analysis'
    );

    return cached;
  } catch (error) {
    logger.error(
      { error, comparisonType, brands },
      'Error checking analysis cache'
    );
    // Don't throw - cache failure shouldn't block generation
    return null;
  }
}

/**
 * Configuration for retry logic
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 2000, // 2 seconds
  maxDelay: 10000, // 10 seconds
};

/**
 * Generate new analysis using Gemini API
 *
 * Calls LLM with formatted prompt and validates response.
 * Implements retry logic with exponential backoff for validation failures.
 *
 * @param comparisonType - Type of comparison
 * @param brands - Array of brand names
 * @param planData - Plan data to analyze
 * @returns Validated analysis result
 * @throws {AnalysisError} If generation fails after all retries
 */
async function generateNewAnalysis(
  comparisonType: ComparisonType,
  brands: string[],
  planData: PlanDataForAnalysis[]
): Promise<Record<string, any>> {
  // Load and format prompt
  const template = await loadPromptTemplate(comparisonType);
  const prompt = formatPromptWithData(template, brands, planData, comparisonType);

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      logger.info(
        { attempt, maxAttempts: RETRY_CONFIG.maxAttempts, comparisonType, brands },
        'Calling Gemini API for analysis'
      );

      // Call Gemini API with JSON mode
      const rawResponse = await queryGeminiJson(prompt);

      // Validate response based on comparison type
      const validationFn =
        comparisonType === 'full'
          ? validateAnalysisResponse
          : validateCustomComparisonResponse;

      const validatedResponse = validationFn(rawResponse);

      logger.info(
        { attempt, comparisonType, brands },
        'Analysis generated and validated successfully'
      );

      return validatedResponse;
    } catch (error) {
      lastError = error as Error;

      // Handle validation errors with retry
      if (error instanceof ValidationError) {
        logger.warn(
          {
            attempt,
            maxAttempts: RETRY_CONFIG.maxAttempts,
            error: error.message,
            field: error.field,
          },
          'Validation failed, will retry'
        );

        // If not last attempt, apply exponential backoff delay
        if (attempt < RETRY_CONFIG.maxAttempts) {
          const delay = Math.min(
            RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
            RETRY_CONFIG.maxDelay
          );
          logger.debug({ delayMs: delay }, 'Waiting before retry');
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Non-validation errors: don't retry
        logger.error(
          { error, attempt, comparisonType, brands },
          'API call failed with non-validation error'
        );
        throw new AnalysisError(
          `Gemini API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          AnalysisErrorCode.API_FAILURE,
          { comparisonType, brands, error }
        );
      }
    }
  }

  // All retries exhausted
  const errorMessage = `Analysis validation failed after ${RETRY_CONFIG.maxAttempts} attempts`;
  logger.error(
    { lastError, comparisonType, brands, attempts: RETRY_CONFIG.maxAttempts },
    errorMessage
  );

  throw new AnalysisError(errorMessage, AnalysisErrorCode.VALIDATION_FAILED, {
    comparisonType,
    brands,
    lastError: lastError?.message,
    attempts: RETRY_CONFIG.maxAttempts,
  });
}

/**
 * Save analysis result to database
 *
 * Inserts the validated analysis into the analyses table with all required fields.
 *
 * @param comparisonType - Type of comparison
 * @param brands - Array of brand names
 * @param planIds - Array of plan UUIDs used in analysis
 * @param analysisResult - Validated analysis data from LLM
 * @returns UUID of the inserted analysis record
 * @throws {AnalysisError} If database insert fails
 */
async function saveAnalysis(
  comparisonType: ComparisonType,
  brands: string[],
  planIds: string[],
  analysisResult: Record<string, any>
): Promise<string> {
  const pool = getPool();

  try {
    logger.debug(
      { comparisonType, brands, planCount: planIds.length },
      'Saving analysis to database'
    );

    const result = await pool.query<{ id: string }>(
      `INSERT INTO analyses (comparison_type, brands, plan_ids, analysis_result)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [comparisonType, brands, planIds, JSON.stringify(analysisResult)]
    );

    const analysisId = result.rows[0].id;

    logger.info(
      { analysisId, comparisonType, brands },
      'Analysis saved to database successfully'
    );

    return analysisId;
  } catch (error) {
    const errorMessage = 'Failed to save analysis to database';
    logger.error(
      { error, comparisonType, brands },
      errorMessage
    );

    throw new AnalysisError(errorMessage, AnalysisErrorCode.DATABASE_ERROR, {
      comparisonType,
      brands,
      error,
    });
  }
}

/**
 * Generate competitive analysis with caching
 *
 * This is the main entry point for analysis generation. It:
 * 1. Checks cache for existing analysis (< 24 hours old)
 * 2. Returns cached result if found
 * 3. Otherwise generates new analysis via Gemini API
 * 4. Validates and stores the result
 * 5. Returns formatted response
 *
 * @param request - Analysis request parameters
 * @returns Analysis response with data and metadata
 * @throws {AnalysisError} If generation fails after retries
 *
 * @example
 * ```typescript
 * const result = await generateAnalysis({
 *   comparisonType: 'full',
 *   brands: ['O2', 'Vodafone', 'Sky', 'Tesco', 'Three'],
 *   planData: [...] // Array of plan objects from database
 * });
 *
 * if (result.cached) {
 *   console.log('Using cached analysis from', result.createdAt);
 * }
 *
 * console.log('Analysis:', result.data);
 * ```
 */
export async function generateAnalysis(
  request: AnalysisRequest
): Promise<AnalysisResponse> {
  logger.info(
    {
      comparisonType: request.comparisonType,
      brands: request.brands,
      planCount: request.planData.length,
    },
    'Starting analysis generation'
  );

  // Validate request
  if (!request.brands || request.brands.length === 0) {
    throw new AnalysisError(
      'At least one brand must be specified',
      AnalysisErrorCode.INVALID_REQUEST,
      { request }
    );
  }

  if (!request.planData || request.planData.length === 0) {
    throw new AnalysisError(
      'At least one plan must be provided for analysis',
      AnalysisErrorCode.INVALID_REQUEST,
      { request }
    );
  }

  // Extract plan IDs for cache lookup and storage
  const planIds = request.planData.map((plan) => plan.id);

  try {
    // Step 1: Check cache for existing analysis
    const cachedAnalysis = await checkAnalysisCache(
      request.comparisonType,
      request.brands,
      planIds
    );

    if (cachedAnalysis) {
      // Cache hit - return cached result with validation applied
      const { validateAnalysisResponse, validateCustomComparisonResponse } = await import('./validation');
      const validateFn = request.comparisonType === 'full'
        ? validateAnalysisResponse
        : validateCustomComparisonResponse;

      return {
        cached: true,
        analysisId: cachedAnalysis.id,
        createdAt: cachedAnalysis.created_at,
        data: validateFn(cachedAnalysis.analysis_result),
      };
    }

    // Step 2: Cache miss - generate new analysis
    logger.info(
      { comparisonType: request.comparisonType, brands: request.brands },
      'No cached analysis found, generating new analysis'
    );

    const analysisResult = await generateNewAnalysis(
      request.comparisonType,
      request.brands,
      request.planData
    );

    // Step 3: Save to database
    const analysisId = await saveAnalysis(
      request.comparisonType,
      request.brands,
      planIds,
      analysisResult
    );

    // Step 4: Return formatted response
    return {
      cached: false,
      analysisId,
      createdAt: new Date(),
      data: analysisResult,
    };
  } catch (error) {
    // Re-throw AnalysisError as-is
    if (error instanceof AnalysisError) {
      throw error;
    }

    // Wrap unexpected errors
    logger.error(
      { error, comparisonType: request.comparisonType, brands: request.brands },
      'Unexpected error during analysis generation'
    );

    throw new AnalysisError(
      `Unexpected error during analysis generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      AnalysisErrorCode.API_FAILURE,
      { request, error }
    );
  }
}
