/**
 * Data Normalization Utility
 *
 * Normalizes raw scraped data from all sources (7 telcos + Uswitch API)
 * into a consistent format before database storage.
 *
 * Story: 2.5 - Data Normalization Before Storage
 */

import { logger } from '../utils/logger';

/**
 * Normalized plan data structure
 */
export interface NormalizedPlan {
  name: string;
  data_allowance: string;  // Normalized: "Unlimited", "10GB", "500MB"
  price: string;            // Normalized: "£10.00"
  contract_term: string;    // Normalized: "12 months", "1 month", "PAYG"
  plan_key: string;         // Generated: "{source}-{data}-{contract}"
  extras?: string[];
  [key: string]: any;       // Preserve original fields
}

/**
 * Normalize data allowance to standard format
 *
 * Input formats discovered:
 * - "20GB", "250GB" (O2, Vodafone, Tesco, Three, Giffgaff)
 * - "Unlimited" (all sources)
 * - "50000", "80000" (Uswitch - in MB)
 * - "0.5GB" (Smarty)
 *
 * Output format: "Unlimited", "10GB", "500MB"
 */
export function normalizeDataAllowance(input: any): string {
  if (!input) {
    logger.warn({ input }, 'Missing data allowance field');
    return 'Unknown';
  }

  const str = String(input).trim();

  // Handle "Unlimited" variations
  if (/unlimited/i.test(str)) {
    return 'Unlimited';
  }

  // Handle numeric values (Uswitch format - MB)
  if (/^\d+$/.test(str)) {
    const mb = parseInt(str, 10);
    if (mb >= 1000) {
      const gb = mb / 1000;
      // Round to 1 decimal if needed, otherwise integer
      return gb % 1 === 0 ? `${gb}GB` : `${gb.toFixed(1)}GB`;
    }
    return `${mb}MB`;
  }

  // Handle "20GB", "250GB", "0.5GB" format
  const gbMatch = str.match(/^(\d+(?:\.\d+)?)\s*GB$/i);
  if (gbMatch) {
    const value = parseFloat(gbMatch[1]);
    // Convert to MB if less than 1GB
    if (value < 1) {
      return `${Math.round(value * 1000)}MB`;
    }
    // Return as GB, remove unnecessary decimals
    return value % 1 === 0 ? `${value}GB` : `${value.toFixed(1)}GB`;
  }

  // Handle "500MB" format
  const mbMatch = str.match(/^(\d+)\s*MB$/i);
  if (mbMatch) {
    return `${mbMatch[1]}MB`;
  }

  // Handle "20 GB" (with space)
  const gbSpaceMatch = str.match(/^(\d+(?:\.\d+)?)\s+GB$/i);
  if (gbSpaceMatch) {
    const value = parseFloat(gbSpaceMatch[1]);
    return value % 1 === 0 ? `${value}GB` : `${value.toFixed(1)}GB`;
  }

  // Handle "20G" (without B)
  const gMatch = str.match(/^(\d+(?:\.\d+)?)\s*G$/i);
  if (gMatch) {
    const value = parseFloat(gMatch[1]);
    return value % 1 === 0 ? `${value}GB` : `${value.toFixed(1)}GB`;
  }

  logger.warn({ input: str }, 'Unexpected data allowance format');
  return str; // Return as-is if format unknown
}

/**
 * Normalize price to standard format
 *
 * Input formats discovered:
 * - "£20.00/month" (O2, Smarty, Uswitch)
 * - "£10" (Tesco)
 * - "Unknown" (Vodafone)
 * - "1300", "1800" (Three - pence as integer)
 * - "£8.00" (Giffgaff)
 * - "£0/month" (Smarty - free plans)
 *
 * Output format: "£10.00"
 */
export function normalizePrice(input: any): string {
  if (!input) {
    logger.warn({ input }, 'Missing price field');
    return 'Unknown';
  }

  const str = String(input).trim();

  // Handle "Unknown" explicitly
  if (str === 'Unknown' || str === '') {
    return 'Unknown';
  }

  // Handle "1300", "1800" (pence as integer - Three format)
  if (/^\d{3,}$/.test(str)) {
    const pence = parseInt(str, 10);
    const pounds = (pence / 100).toFixed(2);
    return `£${pounds}`;
  }

  // Handle "£20.00/month", "£10/month", "£0/month"
  const monthMatch = str.match(/£(\d+(?:\.\d+)?)\s*\/\s*month/i);
  if (monthMatch) {
    const value = parseFloat(monthMatch[1]);
    return `£${value.toFixed(2)}`;
  }

  // Handle "£10", "£8.00"
  const poundMatch = str.match(/£(\d+(?:\.\d+)?)/);
  if (poundMatch) {
    const value = parseFloat(poundMatch[1]);
    return `£${value.toFixed(2)}`;
  }

  // Handle "10.00", "8.00" (number without symbol)
  const numMatch = str.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) {
    const value = parseFloat(numMatch[1]);
    return `£${value.toFixed(2)}`;
  }

  // Handle "10 GBP per month", "£10 a month"
  const gbpMatch = str.match(/(\d+(?:\.\d+)?)\s*GBP/i);
  if (gbpMatch) {
    const value = parseFloat(gbpMatch[1]);
    return `£${value.toFixed(2)}`;
  }

  logger.warn({ input: str }, 'Unexpected price format');
  return str; // Return as-is if format unknown
}

/**
 * Normalize contract term to standard format
 *
 * Input formats discovered:
 * - "24 months", "12 months", "1 month" (most sources)
 * - "18 months" (Giffgaff)
 * - "1 months" (Uswitch - typo in their data)
 * - undefined (needs contract_term field)
 *
 * Output format: "12 months", "1 month", "PAYG"
 */
export function normalizeContractTerm(input: any): string {
  if (input === null || input === undefined || input === '') {
    logger.warn({ input }, 'Missing contract term field');
    return 'Unknown';
  }

  const str = String(input).trim();

  // Handle "24 months", "12 months", "1 month"
  const monthsMatch = str.match(/^(\d+)\s*months?$/i);
  if (monthsMatch) {
    const value = parseInt(monthsMatch[1], 10);
    return value === 1 ? '1 month' : `${value} months`;
  }

  // Handle "1 year", "2 years"
  const yearsMatch = str.match(/^(\d+)\s*years?$/i);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1], 10);
    const months = years * 12;
    return `${months} months`;
  }

  // Handle "12m", "24m"
  const mMatch = str.match(/^(\d+)m$/i);
  if (mMatch) {
    const value = parseInt(mMatch[1], 10);
    return value === 1 ? '1 month' : `${value} months`;
  }

  // Handle "12-month", "24-month"
  const dashMatch = str.match(/^(\d+)-months?$/i);
  if (dashMatch) {
    const value = parseInt(dashMatch[1], 10);
    return value === 1 ? '1 month' : `${value} months`;
  }

  // Handle PAYG/Pay as you go
  if (/pay\s*as\s*you\s*go|payg/i.test(str)) {
    return 'PAYG';
  }

  // Handle numeric-only contract length (Uswitch format)
  if (/^\d+$/.test(str)) {
    const value = parseInt(str, 10);
    if (value === 0) {
      return 'PAYG';
    }
    return value === 1 ? '1 month' : `${value} months`;
  }

  logger.warn({ input: str }, 'Unexpected contract term format');
  return str; // Return as-is if format unknown
}

/**
 * Generate plan_key for historical tracking
 *
 * Format: "{source}-{data_allowance}-{contract_term}"
 * Examples:
 * - "O2-10GB-12months"
 * - "Vodafone-Unlimited-24months"
 * - "Three-50GB-1month"
 * - "Sky-100GB-PAYG"
 */
export function generatePlanKey(
  source: string,
  dataAllowance: string,
  contractTerm: string
): string {
  // Normalize source name (capitalize first letter)
  const normalizedSource = source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();

  // Create safe versions of data and contract for key
  // Remove spaces and special characters
  const safeData = dataAllowance.replace(/\s+/g, '');
  const safeContract = contractTerm.replace(/\s+/g, '').toLowerCase();

  return `${normalizedSource}-${safeData}-${safeContract}`;
}

/**
 * Main normalization function
 *
 * Processes raw scraped data from any source and returns normalized format
 * Handles multiple input formats (HTML text, objects, API JSON)
 */
export function normalizePlanData(rawData: any, source: string): NormalizedPlan {
  try {
    // Extract fields from various possible locations
    const dataAllowance = rawData.data_allowance || rawData.dataAllowance || rawData.data || rawData.allowance;
    const price = rawData.price || rawData.monthlyPrice || rawData.monthly_cost || rawData.cost;
    // Handle contract_term or contract_length (Uswitch uses contract_length as number)
    const contractTerm = rawData.contract_term || rawData.contractTerm || rawData.contract || rawData.contract_length;
    const name = rawData.name || 'Unnamed Plan';

    // Normalize each field
    const normalizedData = normalizeDataAllowance(dataAllowance);
    const normalizedPrice = normalizePrice(price);
    const normalizedContract = normalizeContractTerm(contractTerm);

    // Generate plan key
    const planKey = generatePlanKey(source, normalizedData, normalizedContract);

    // Create normalized plan object
    const normalized: NormalizedPlan = {
      ...rawData, // Preserve all original fields
      name,
      data_allowance: normalizedData,
      price: normalizedPrice,
      contract_term: normalizedContract,
      plan_key: planKey,
    };

    logger.debug(
      {
        source,
        plan_key: planKey,
        data: normalizedData,
        price: normalizedPrice,
        contract: normalizedContract,
      },
      'Plan data normalized'
    );

    return normalized;
  } catch (error) {
    logger.error(
      {
        error,
        source,
        rawData,
      },
      'Error normalizing plan data'
    );

    // Return raw data with error flag on failure
    return {
      ...rawData,
      name: rawData.name || 'Error',
      data_allowance: 'Unknown',
      price: 'Unknown',
      contract_term: 'Unknown',
      plan_key: `${source}-Error-${Date.now()}`,
      normalization_error: true,
    };
  }
}

/**
 * Normalize an array of plans
 */
export function normalizePlans(plans: any[], source: string): NormalizedPlan[] {
  return plans.map((plan) => normalizePlanData(plan, source));
}
