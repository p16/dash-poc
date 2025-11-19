/**
 * Response Validation Utility for LLM Analysis
 *
 * Validates JSON responses from Gemini API to ensure they match
 * the required structure for competitive analysis.
 *
 * Strategy: Log validation issues but continue processing.
 * Components must handle null/undefined values gracefully.
 *
 * Story: 3.2 - Prompt Engineering (AC8)
 */

import { logger } from '../utils/logger';

/**
 * Validation issue tracking (non-fatal)
 */
interface ValidationIssue {
  field: string;
  message: string;
  severity: 'warning' | 'info';
  actualValue?: any;
}

/**
 * Collection of validation issues found during processing
 */
const validationIssues: ValidationIssue[] = [];

/**
 * Log a validation issue without throwing
 */
function logValidationIssue(
  field: string,
  message: string,
  severity: 'warning' | 'info' = 'warning',
  actualValue?: any
): void {
  const issue: ValidationIssue = { field, message, severity, actualValue };
  validationIssues.push(issue);

  if (severity === 'warning') {
    logger.warn({ field, actualValue }, message);
  } else {
    logger.info({ field, actualValue }, message);
  }
}

/**
 * Validation error with specific details about what failed
 * (Only used for critical structural failures)
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public expectedType?: string,
    public actualValue?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Required top-level fields for analysis response
 */
const REQUIRED_TOP_LEVEL_FIELDS = [
  'analysis_timestamp',
  'currency',
  'overall_competitive_sentiments',
  'o2_products_analysis',
  'full_competitive_dataset_all_plans',
];

/**
 * Required fields for overall_competitive_sentiments objects
 */
const REQUIRED_SENTIMENT_FIELDS = ['score', 'sentiment', 'rationale'];

/**
 * Required fields for o2_products_analysis objects
 */
const REQUIRED_PRODUCT_ANALYSIS_FIELDS = [
  'product_name',
  'data_tier',
  'roaming_tier',
  'product_breakdown',
  'comparable_products',
  'o2_product_sentiments',
  'o2_product_changes',
  'price_suggestions',
  'source',
];

/**
 * Required fields for plan objects (product_breakdown and comparable_products)
 */
const REQUIRED_PLAN_FIELDS = [
  'brand',
  'contract',
  'data',
  'roaming',
  'competitiveness_score',
  'source',
];

/**
 * Optional fields that can be null (e.g., unpublished prices)
 */
const OPTIONAL_PLAN_FIELDS = [
  'price_per_month_GBP',
];

/**
 * Required fields for full_competitive_dataset_all_plans objects
 */
const REQUIRED_DATASET_FIELDS = [
  'brand',
  'contract',
  'data',
  'roaming',
  'extras',
  'speed',
  'notes',
  'competitiveness_score',
  'source',
];

/**
 * Optional dataset fields that can be null
 */
const OPTIONAL_DATASET_FIELDS = [
  'price_per_month_GBP',
];

/**
 * Validate that a value is a number within the specified range
 * Logs issues but doesn't throw - returns true if valid
 */
function validateNumberInRange(
  value: any,
  min: number,
  max: number,
  fieldName: string
): boolean {
  if (value === null || value === undefined) {
    logValidationIssue(fieldName, `${fieldName} is null/undefined`, 'info', value);
    return false;
  }

  if (typeof value !== 'number') {
    logValidationIssue(
      fieldName,
      `${fieldName} must be a number, got ${typeof value}`,
      'warning',
      value
    );
    return false;
  }

  if (isNaN(value)) {
    logValidationIssue(fieldName, `${fieldName} is NaN`, 'warning', value);
    return false;
  }

  if (value < min || value > max) {
    logValidationIssue(
      fieldName,
      `${fieldName} must be between ${min} and ${max}, got ${value}`,
      'warning',
      value
    );
    return false;
  }

  return true;
}

/**
 * Validate that required fields exist in an object
 * Logs issues for missing fields but doesn't throw
 * Optional fields can be missing, undefined, or null
 */
function validateRequiredFields(
  obj: any,
  requiredFields: string[],
  context: string,
  optionalFields: string[] = []
): void {
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      logValidationIssue(
        `${context}.${field}`,
        `Missing or null required field "${field}" in ${context}`,
        'warning',
        obj[field]
      );
    }
  }

  // Check optional fields are present (can be null)
  for (const field of optionalFields) {
    if (!(field in obj)) {
      logValidationIssue(
        `${context}.${field}`,
        `Missing optional field "${field}" in ${context} (should be present, can be null)`,
        'info',
        undefined
      );
    }
  }
}

/**
 * Validate overall_competitive_sentiments array
 * Logs issues but continues processing
 */
function validateSentiments(sentiments: any[]): void {
  if (!Array.isArray(sentiments)) {
    logValidationIssue(
      'overall_competitive_sentiments',
      'overall_competitive_sentiments must be an array',
      'warning',
      typeof sentiments
    );
    return;
  }

  if (sentiments.length < 5 || sentiments.length > 10) {
    logValidationIssue(
      'overall_competitive_sentiments',
      `overall_competitive_sentiments should contain 5-10 insights, got ${sentiments.length}`,
      'info',
      sentiments.length
    );
  }

  sentiments.forEach((sentiment, index) => {
    const context = `overall_competitive_sentiments[${index}]`;

    validateRequiredFields(
      sentiment,
      REQUIRED_SENTIMENT_FIELDS,
      context
    );

    validateNumberInRange(
      sentiment?.score,
      0,
      100,
      `${context}.score`
    );

    if (typeof sentiment?.sentiment !== 'string' || sentiment.sentiment.trim().length === 0) {
      logValidationIssue(
        `${context}.sentiment`,
        `sentiment must be a non-empty string at ${context}`,
        'warning',
        sentiment?.sentiment
      );
    }

    if (typeof sentiment?.rationale !== 'string' || sentiment.rationale.trim().length === 0) {
      logValidationIssue(
        `${context}.rationale`,
        `rationale must be a non-empty string at ${context}`,
        'warning',
        sentiment?.rationale
      );
    }
  });
}

/**
 * Validate a plan object (product_breakdown or comparable_product)
 */
function validatePlan(plan: any, context: string): void {
  validateRequiredFields(plan, REQUIRED_PLAN_FIELDS, context, OPTIONAL_PLAN_FIELDS);

  // Only validate price if it's not null
  if (plan.price_per_month_GBP !== null) {
    validateNumberInRange(
      plan.price_per_month_GBP,
      0,
      1000,
      `${context}.price_per_month_GBP`
    );
  }

  validateNumberInRange(
    plan.competitiveness_score,
    0,
    100,
    `${context}.competitiveness_score`
  );
}

/**
 * Validate o2_products_analysis array
 * Logs issues but continues processing
 */
function validateProductAnalysis(products: any[]): void {
  if (!Array.isArray(products)) {
    logValidationIssue(
      'o2_products_analysis',
      'o2_products_analysis must be an array',
      'warning',
      typeof products
    );
    return;
  }

  if (products.length < 5) {
    logValidationIssue(
      'o2_products_analysis',
      `o2_products_analysis should contain at least 5 products, got ${products.length}`,
      'info',
      products.length
    );
  }

  products.forEach((product, index) => {
    const context = `o2_products_analysis[${index}]`;
    validateRequiredFields(product, REQUIRED_PRODUCT_ANALYSIS_FIELDS, context);

    // If source is missing from product_breakdown but exists at parent level, copy it
    if (product?.product_breakdown && !product.product_breakdown.source && product.source) {
      product.product_breakdown.source = product.source;
      logger.debug(
        { context, source: product.source },
        'Copied source from parent to product_breakdown'
      );
    }

    // Validate product_breakdown
    if (product?.product_breakdown) {
      validatePlan(product.product_breakdown, `${context}.product_breakdown`);
    }

    // Validate comparable_products array
    if (!Array.isArray(product?.comparable_products)) {
      logValidationIssue(
        `${context}.comparable_products`,
        `comparable_products must be an array at ${context}`,
        'warning',
        typeof product?.comparable_products
      );
    } else {
      product.comparable_products.forEach((comparablePlan: any, cpIndex: number) => {
        validatePlan(
          comparablePlan,
          `${context}.comparable_products[${cpIndex}]`
        );
      });
    }

    // Validate o2_product_sentiments
    if (!Array.isArray(product?.o2_product_sentiments)) {
      logValidationIssue(
        `${context}.o2_product_sentiments`,
        `o2_product_sentiments must be an array at ${context}`,
        'warning',
        typeof product?.o2_product_sentiments
      );
    }

    // Validate o2_product_changes
    if (!Array.isArray(product?.o2_product_changes)) {
      logValidationIssue(
        `${context}.o2_product_changes`,
        `o2_product_changes must be an array at ${context}`,
        'warning',
        typeof product?.o2_product_changes
      );
    }

    // Validate price_suggestions
    if (!Array.isArray(product?.price_suggestions)) {
      logValidationIssue(
        `${context}.price_suggestions`,
        `price_suggestions must be an array at ${context}`,
        'warning',
        typeof product?.price_suggestions
      );
    } else {
      product.price_suggestions.forEach((suggestion: any, psIndex: number) => {
        if (!suggestion?.motivation || !suggestion?.price) {
          logValidationIssue(
            `${context}.price_suggestions[${psIndex}]`,
            `price_suggestions[${psIndex}] must have motivation and price fields at ${context}`,
            'warning',
            suggestion
          );
        }

        if (suggestion?.price && typeof suggestion.price !== 'number') {
          logValidationIssue(
            `${context}.price_suggestions[${psIndex}].price`,
            `price must be a number at ${context}.price_suggestions[${psIndex}]`,
            'warning',
            suggestion.price
          );
        }
      });
    }
  });
}

/**
 * Validate full_competitive_dataset_all_plans array
 * Logs issues but continues processing
 */
function validateDataset(dataset: any[]): void {
  if (!Array.isArray(dataset)) {
    logValidationIssue(
      'full_competitive_dataset_all_plans',
      'full_competitive_dataset_all_plans must be an array',
      'warning',
      typeof dataset
    );
    return;
  }

  dataset.forEach((plan, index) => {
    const context = `full_competitive_dataset_all_plans[${index}]`;

    validateRequiredFields(
      plan,
      REQUIRED_DATASET_FIELDS,
      context,
      OPTIONAL_DATASET_FIELDS
    );

    // Only validate price if it's not null
    if (plan?.price_per_month_GBP !== null && plan?.price_per_month_GBP !== undefined) {
      validateNumberInRange(
        plan.price_per_month_GBP,
        0,
        1000,
        `${context}.price_per_month_GBP`
      );
    }

    if (plan?.competitiveness_score !== null && plan?.competitiveness_score !== undefined) {
      validateNumberInRange(
        plan.competitiveness_score,
        0,
        100,
        `${context}.competitiveness_score`
      );
    }
  });
}

/**
 * Validate analysis response structure and data types
 *
 * @param response - Raw response string from Gemini API
 * @returns Parsed and validated analysis object
 * @throws ValidationError only for critical structural failures (invalid JSON)
 */
export function validateAnalysisResponse(response: string | any): any {
  // Clear previous validation issues
  validationIssues.length = 0;

  logger.debug('Validating analysis response');

  let parsed: any;

  // Step 1: Parse JSON (critical - must throw if fails)
  try {
    parsed = typeof response === 'string' ? JSON.parse(response) : response;
  } catch (error) {
    logger.error({ error }, 'Failed to parse JSON response');
    throw new ValidationError(
      'Response is not valid JSON',
      undefined,
      'JSON',
      typeof response === 'string' ? response.substring(0, 100) : response
    );
  }

  // Step 2: Validate top-level fields (log issues, don't throw)
  validateRequiredFields(parsed, REQUIRED_TOP_LEVEL_FIELDS, 'top-level response');

  // Step 3: Validate currency is GBP (log if not, don't throw)
  if (parsed.currency !== 'GBP') {
    logValidationIssue(
      'currency',
      'currency should be "GBP"',
      'info',
      parsed.currency
    );
  }

  // Step 4: Validate timestamp is a string (log if not, don't throw)
  if (typeof parsed?.analysis_timestamp !== 'string') {
    logValidationIssue(
      'analysis_timestamp',
      'analysis_timestamp should be a string',
      'warning',
      typeof parsed?.analysis_timestamp
    );
  }

  // Step 5: Validate overall_competitive_sentiments
  if (parsed?.overall_competitive_sentiments) {
    validateSentiments(parsed.overall_competitive_sentiments);
  }

  // Step 6: Validate o2_products_analysis
  if (parsed?.o2_products_analysis) {
    validateProductAnalysis(parsed.o2_products_analysis);
  }

  // Step 7: Validate full_competitive_dataset_all_plans
  if (parsed?.full_competitive_dataset_all_plans) {
    validateDataset(parsed.full_competitive_dataset_all_plans);
  }

  // Step 8: Validate products_not_considered (optional field)
  if (parsed?.products_not_considered) {
    if (!Array.isArray(parsed.products_not_considered)) {
      logValidationIssue(
        'products_not_considered',
        'products_not_considered must be an array if present',
        'warning',
        typeof parsed.products_not_considered
      );
    } else {
      parsed.products_not_considered.forEach((item: any, index: number) => {
        if (!item?.product || !item?.details) {
          logValidationIssue(
            `products_not_considered[${index}]`,
            `products_not_considered[${index}] must have product and details fields`,
            'warning',
            item
          );
        }
      });
    }
  }

  // Log summary of validation issues
  if (validationIssues.length > 0) {
    const warnings = validationIssues.filter(i => i.severity === 'warning').length;
    const infos = validationIssues.filter(i => i.severity === 'info').length;
    logger.warn(
      { warnings, infos, issues: validationIssues },
      `Validation completed with ${warnings} warnings and ${infos} info messages`
    );
  } else {
    logger.info('Analysis response validation passed with no issues');
  }

  return parsed;
}

/**
 * Validate custom comparison response (Brand A vs Brand B)
 * Similar to validateAnalysisResponse but with brand_a_* fields
 */
export function validateCustomComparisonResponse(response: string | any): any {
  // Clear previous validation issues
  validationIssues.length = 0;

  logger.debug('Validating custom comparison response');

  let parsed: any;

  // Parse JSON (critical - must throw if fails)
  try {
    parsed = typeof response === 'string' ? JSON.parse(response) : response;
  } catch (error) {
    logger.error({ error }, 'Failed to parse JSON response');
    throw new ValidationError('Response is not valid JSON');
  }

  // Validate top-level fields (different from full analysis)
  const requiredFields = [
    'analysis_timestamp',
    'currency',
    'overall_competitive_sentiments',
    'brand_a_products_analysis',
    'full_competitive_dataset_all_plans',
  ];

  validateRequiredFields(parsed, requiredFields, 'top-level response');

  // Validate currency (log if not GBP, don't throw)
  if (parsed?.currency !== 'GBP') {
    logValidationIssue('currency', 'currency should be "GBP"', 'info', parsed?.currency);
  }

  // Validate sentiments
  if (parsed?.overall_competitive_sentiments) {
    validateSentiments(parsed.overall_competitive_sentiments);
  }

  // Validate brand_a_products_analysis (same structure as o2_products_analysis)
  if (!Array.isArray(parsed?.brand_a_products_analysis)) {
    logValidationIssue(
      'brand_a_products_analysis',
      'brand_a_products_analysis must be an array',
      'warning',
      typeof parsed?.brand_a_products_analysis
    );
  } else {
    // Similar validation to o2_products_analysis
    parsed.brand_a_products_analysis.forEach((product: any, index: number) => {
      const context = `brand_a_products_analysis[${index}]`;
      const requiredProductFields = [
        'product_name',
        'data_tier',
        'roaming_tier',
        'product_breakdown',
        'comparable_products',
        'brand_a_product_sentiments',
        'brand_a_product_changes',
        'price_suggestions',
        'source',
      ];

      validateRequiredFields(product, requiredProductFields, context);

      // If source is missing from product_breakdown but exists at parent level, copy it
      if (product?.product_breakdown && !product.product_breakdown.source && product.source) {
        product.product_breakdown.source = product.source;
        logger.debug(
          { context, source: product.source },
          'Copied source from parent to product_breakdown'
        );
      }

      if (product?.product_breakdown) {
        validatePlan(product.product_breakdown, `${context}.product_breakdown`);
      }

      if (!Array.isArray(product?.comparable_products)) {
        logValidationIssue(
          `${context}.comparable_products`,
          `comparable_products must be an array at ${context}`,
          'warning',
          typeof product?.comparable_products
        );
      } else {
        product.comparable_products.forEach((cp: any, cpIndex: number) => {
          validatePlan(cp, `${context}.comparable_products[${cpIndex}]`);
        });
      }
    });
  }

  // Validate dataset
  if (parsed?.full_competitive_dataset_all_plans) {
    validateDataset(parsed.full_competitive_dataset_all_plans);
  }

  // Log summary of validation issues
  if (validationIssues.length > 0) {
    const warnings = validationIssues.filter(i => i.severity === 'warning').length;
    const infos = validationIssues.filter(i => i.severity === 'info').length;
    logger.warn(
      { warnings, infos, issues: validationIssues },
      `Custom comparison validation completed with ${warnings} warnings and ${infos} info messages`
    );
  } else {
    logger.info('Custom comparison response validation passed with no issues');
  }

  return parsed;
}
