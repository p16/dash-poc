/**
 * Response Validation Utility for LLM Analysis
 *
 * Validates JSON responses from Gemini API to ensure they match
 * the required structure for competitive analysis.
 *
 * Story: 3.2 - Prompt Engineering (AC8)
 */

import { logger } from '../utils/logger';

/**
 * Validation error with specific details about what failed
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
  'price_per_month_GBP',
  'competitiveness_score',
  'source',
];

/**
 * Required fields for full_competitive_dataset_all_plans objects
 */
const REQUIRED_DATASET_FIELDS = [
  'brand',
  'contract',
  'data',
  'roaming',
  'price_per_month_GBP',
  'extras',
  'speed',
  'notes',
  'competitiveness_score',
  'source',
];

/**
 * Validate that a value is a number within the specified range
 */
function validateNumberInRange(
  value: any,
  min: number,
  max: number,
  fieldName: string
): void {
  if (typeof value !== 'number') {
    throw new ValidationError(
      `${fieldName} must be a number, got ${typeof value}`,
      fieldName,
      'number',
      value
    );
  }

  if (isNaN(value)) {
    throw new ValidationError(`${fieldName} is NaN`, fieldName, 'number', value);
  }

  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max}, got ${value}`,
      fieldName,
      `number (${min}-${max})`,
      value
    );
  }
}

/**
 * Validate that required fields exist in an object
 */
function validateRequiredFields(
  obj: any,
  requiredFields: string[],
  context: string
): void {
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      throw new ValidationError(
        `Missing required field "${field}" in ${context}`,
        field,
        'required',
        undefined
      );
    }
  }
}

/**
 * Validate overall_competitive_sentiments array
 */
function validateSentiments(sentiments: any[]): void {
  if (!Array.isArray(sentiments)) {
    throw new ValidationError(
      'overall_competitive_sentiments must be an array',
      'overall_competitive_sentiments',
      'array',
      typeof sentiments
    );
  }

  if (sentiments.length < 5 || sentiments.length > 10) {
    throw new ValidationError(
      `overall_competitive_sentiments must contain 5-10 insights, got ${sentiments.length}`,
      'overall_competitive_sentiments',
      'array (length 5-10)',
      sentiments.length
    );
  }

  sentiments.forEach((sentiment, index) => {
    validateRequiredFields(
      sentiment,
      REQUIRED_SENTIMENT_FIELDS,
      `overall_competitive_sentiments[${index}]`
    );

    validateNumberInRange(
      sentiment.score,
      0,
      100,
      `overall_competitive_sentiments[${index}].score`
    );

    if (typeof sentiment.sentiment !== 'string' || sentiment.sentiment.trim().length === 0) {
      throw new ValidationError(
        `sentiment must be a non-empty string at overall_competitive_sentiments[${index}]`,
        `overall_competitive_sentiments[${index}].sentiment`,
        'string',
        sentiment.sentiment
      );
    }

    if (typeof sentiment.rationale !== 'string' || sentiment.rationale.trim().length === 0) {
      throw new ValidationError(
        `rationale must be a non-empty string at overall_competitive_sentiments[${index}]`,
        `overall_competitive_sentiments[${index}].rationale`,
        'string',
        sentiment.rationale
      );
    }
  });
}

/**
 * Validate a plan object (product_breakdown or comparable_product)
 */
function validatePlan(plan: any, context: string): void {
  validateRequiredFields(plan, REQUIRED_PLAN_FIELDS, context);

  validateNumberInRange(
    plan.price_per_month_GBP,
    0,
    1000,
    `${context}.price_per_month_GBP`
  );

  validateNumberInRange(
    plan.competitiveness_score,
    0,
    100,
    `${context}.competitiveness_score`
  );
}

/**
 * Validate o2_products_analysis array
 */
function validateProductAnalysis(products: any[]): void {
  if (!Array.isArray(products)) {
    throw new ValidationError(
      'o2_products_analysis must be an array',
      'o2_products_analysis',
      'array',
      typeof products
    );
  }

  if (products.length < 5) {
    throw new ValidationError(
      `o2_products_analysis must contain at least 5 products, got ${products.length}`,
      'o2_products_analysis',
      'array (length >= 5)',
      products.length
    );
  }

  products.forEach((product, index) => {
    const context = `o2_products_analysis[${index}]`;
    validateRequiredFields(product, REQUIRED_PRODUCT_ANALYSIS_FIELDS, context);

    // Validate product_breakdown
    validatePlan(product.product_breakdown, `${context}.product_breakdown`);

    // Validate comparable_products array
    if (!Array.isArray(product.comparable_products)) {
      throw new ValidationError(
        `comparable_products must be an array at ${context}`,
        `${context}.comparable_products`,
        'array',
        typeof product.comparable_products
      );
    }

    product.comparable_products.forEach((comparablePlan: any, cpIndex: number) => {
      validatePlan(
        comparablePlan,
        `${context}.comparable_products[${cpIndex}]`
      );
    });

    // Validate o2_product_sentiments
    if (!Array.isArray(product.o2_product_sentiments)) {
      throw new ValidationError(
        `o2_product_sentiments must be an array at ${context}`,
        `${context}.o2_product_sentiments`,
        'array',
        typeof product.o2_product_sentiments
      );
    }

    // Validate o2_product_changes
    if (!Array.isArray(product.o2_product_changes)) {
      throw new ValidationError(
        `o2_product_changes must be an array at ${context}`,
        `${context}.o2_product_changes`,
        'array',
        typeof product.o2_product_changes
      );
    }

    // Validate price_suggestions
    if (!Array.isArray(product.price_suggestions)) {
      throw new ValidationError(
        `price_suggestions must be an array at ${context}`,
        `${context}.price_suggestions`,
        'array',
        typeof product.price_suggestions
      );
    }

    product.price_suggestions.forEach((suggestion: any, psIndex: number) => {
      if (!suggestion.motivation || !suggestion.price) {
        throw new ValidationError(
          `price_suggestions[${psIndex}] must have motivation and price fields at ${context}`,
          `${context}.price_suggestions[${psIndex}]`,
          'object with motivation and price',
          suggestion
        );
      }

      if (typeof suggestion.price !== 'number') {
        throw new ValidationError(
          `price must be a number at ${context}.price_suggestions[${psIndex}]`,
          `${context}.price_suggestions[${psIndex}].price`,
          'number',
          suggestion.price
        );
      }
    });
  });
}

/**
 * Validate full_competitive_dataset_all_plans array
 */
function validateDataset(dataset: any[]): void {
  if (!Array.isArray(dataset)) {
    throw new ValidationError(
      'full_competitive_dataset_all_plans must be an array',
      'full_competitive_dataset_all_plans',
      'array',
      typeof dataset
    );
  }

  dataset.forEach((plan, index) => {
    validateRequiredFields(
      plan,
      REQUIRED_DATASET_FIELDS,
      `full_competitive_dataset_all_plans[${index}]`
    );

    validateNumberInRange(
      plan.price_per_month_GBP,
      0,
      1000,
      `full_competitive_dataset_all_plans[${index}].price_per_month_GBP`
    );

    validateNumberInRange(
      plan.competitiveness_score,
      0,
      100,
      `full_competitive_dataset_all_plans[${index}].competitiveness_score`
    );
  });
}

/**
 * Validate analysis response structure and data types
 *
 * @param response - Raw response string from Gemini API
 * @returns Parsed and validated analysis object
 * @throws ValidationError if response is invalid
 */
export function validateAnalysisResponse(response: string | any): any {
  logger.debug('Validating analysis response');

  let parsed: any;

  // Step 1: Parse JSON
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

  // Step 2: Validate top-level fields
  validateRequiredFields(parsed, REQUIRED_TOP_LEVEL_FIELDS, 'top-level response');

  // Step 3: Validate currency is GBP
  if (parsed.currency !== 'GBP') {
    throw new ValidationError(
      'currency must be "GBP"',
      'currency',
      'GBP',
      parsed.currency
    );
  }

  // Step 4: Validate timestamp is a string
  if (typeof parsed.analysis_timestamp !== 'string') {
    throw new ValidationError(
      'analysis_timestamp must be a string',
      'analysis_timestamp',
      'string',
      typeof parsed.analysis_timestamp
    );
  }

  // Step 5: Validate overall_competitive_sentiments
  validateSentiments(parsed.overall_competitive_sentiments);

  // Step 6: Validate o2_products_analysis
  validateProductAnalysis(parsed.o2_products_analysis);

  // Step 7: Validate full_competitive_dataset_all_plans
  validateDataset(parsed.full_competitive_dataset_all_plans);

  // Step 8: Validate products_not_considered (optional field)
  if (parsed.products_not_considered) {
    if (!Array.isArray(parsed.products_not_considered)) {
      throw new ValidationError(
        'products_not_considered must be an array if present',
        'products_not_considered',
        'array',
        typeof parsed.products_not_considered
      );
    }

    parsed.products_not_considered.forEach((item: any, index: number) => {
      if (!item.product || !item.details) {
        throw new ValidationError(
          `products_not_considered[${index}] must have product and details fields`,
          `products_not_considered[${index}]`,
          'object with product and details',
          item
        );
      }
    });
  }

  logger.info('Analysis response validation passed');
  return parsed;
}

/**
 * Validate custom comparison response (Brand A vs Brand B)
 * Similar to validateAnalysisResponse but with brand_a_* fields
 */
export function validateCustomComparisonResponse(response: string | any): any {
  logger.debug('Validating custom comparison response');

  let parsed: any;

  // Parse JSON
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

  // Validate currency
  if (parsed.currency !== 'GBP') {
    throw new ValidationError('currency must be "GBP"', 'currency', 'GBP', parsed.currency);
  }

  // Validate sentiments
  validateSentiments(parsed.overall_competitive_sentiments);

  // Validate brand_a_products_analysis (same structure as o2_products_analysis)
  if (!Array.isArray(parsed.brand_a_products_analysis)) {
    throw new ValidationError(
      'brand_a_products_analysis must be an array',
      'brand_a_products_analysis',
      'array',
      typeof parsed.brand_a_products_analysis
    );
  }

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
    validatePlan(product.product_breakdown, `${context}.product_breakdown`);

    if (!Array.isArray(product.comparable_products)) {
      throw new ValidationError(
        `comparable_products must be an array at ${context}`,
        `${context}.comparable_products`,
        'array',
        typeof product.comparable_products
      );
    }

    product.comparable_products.forEach((cp: any, cpIndex: number) => {
      validatePlan(cp, `${context}.comparable_products[${cpIndex}]`);
    });
  });

  // Validate dataset
  validateDataset(parsed.full_competitive_dataset_all_plans);

  logger.info('Custom comparison response validation passed');
  return parsed;
}
