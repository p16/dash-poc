/**
 * Google Gemini API Integration
 *
 * Provides utilities for connecting to and querying Google Gemini 2.5 Pro API
 * for LLM-powered competitive analysis.
 *
 * Story: 3.1 - Google Gemini API Integration
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { logger } from '../utils/logger';

/**
 * Rate limiting configuration
 *
 * Gemini API Free Tier Limits (as of 2024):
 * - 15 requests per minute (RPM)
 * - 1,500 requests per day (RPD)
 * - 1 million tokens per minute (TPM)
 */
const RATE_LIMIT = {
  requestsPerMinute: 15,
  minDelayBetweenRequests: 4000, // 4 seconds between requests (conservative)
};

/**
 * Track API call timestamps for rate limiting
 */
let lastRequestTime = 0;

/**
 * Validate Gemini API key from environment
 *
 * @throws {Error} If API key is missing or invalid
 */
export function validateApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey === undefined || apiKey === null) {
    const error = new Error('GEMINI_API_KEY environment variable is not set');
    logger.error(error, 'Gemini API key validation failed');
    throw error;
  }

  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    const error = new Error('GEMINI_API_KEY is invalid (empty or not a string)');
    logger.error({ apiKey: apiKey?.substring(0, 10) + '...' }, 'Invalid API key format');
    throw error;
  }

  logger.debug({ keyPrefix: apiKey.substring(0, 10) + '...' }, 'Gemini API key validated');
  return apiKey;
}

/**
 * Initialize Google Generative AI client
 *
 * @returns {GoogleGenerativeAI} Initialized client
 * @throws {Error} If API key validation fails
 */
export function initializeGeminiClient(): GoogleGenerativeAI {
  const apiKey = validateApiKey();
  const client = new GoogleGenerativeAI(apiKey);
  logger.info('Gemini API client initialized');
  return client;
}

/**
 * Get Gemini model instance
 *
 * @param modelName - Model name (default: 'gemini-2.5-pro')
 * @returns {GenerativeModel} Model instance
 */
export function getGeminiModel(
  modelName: string = 'gemini-2.5-pro'
): GenerativeModel {
  const client = initializeGeminiClient();
  const model = client.getGenerativeModel({ model: modelName });
  logger.debug({ modelName }, 'Gemini model instance created');
  return model;
}

/**
 * Apply rate limiting delay if needed
 *
 * Ensures requests don't exceed free tier limits by enforcing
 * minimum delay between requests.
 *
 * @returns {Promise<void>}
 */
async function applyRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT.minDelayBetweenRequests) {
    const delayNeeded = RATE_LIMIT.minDelayBetweenRequests - timeSinceLastRequest;
    logger.debug(
      { delayMs: delayNeeded, timeSinceLastRequest },
      'Rate limiting: delaying request'
    );
    await new Promise((resolve) => setTimeout(resolve, delayNeeded));
  }

  lastRequestTime = Date.now();
}

/**
 * Query Gemini API with a prompt
 *
 * @param prompt - The prompt text to send to Gemini
 * @param modelName - Model to use (default: 'gemini-2.5-pro')
 * @returns {Promise<string>} Generated response text
 * @throws {Error} If API call fails
 */
export async function queryGemini(
  prompt: string,
  modelName: string = 'gemini-2.5-pro'
): Promise<string> {
  try {
    // Apply rate limiting
    await applyRateLimit();

    const model = getGeminiModel(modelName);

    logger.info(
      { promptLength: prompt.length, modelName },
      'Sending query to Gemini API'
    );

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    logger.info(
      { responseLength: text.length, modelName },
      'Received response from Gemini API'
    );

    return text;
  } catch (error) {
    logger.error(
      { error, promptLength: prompt.length, modelName },
      'Gemini API query failed'
    );

    // Provide user-friendly error messages
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('api key')) {
        throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.');
      }
      if (errorMessage.includes('quota')) {
        throw new Error('Gemini API quota exceeded. Please try again later or upgrade your plan.');
      }
      if (errorMessage.includes('timeout')) {
        throw new Error('Gemini API request timed out. The analysis may be too complex or the service is slow.');
      }
      throw new Error(`Gemini API error: ${error.message}`);
    }

    throw new Error('Unknown error occurred while querying Gemini API');
  }
}

/**
 * Query Gemini API with JSON mode enabled
 *
 * Uses Gemini's JSON mode to ensure response is valid JSON.
 * Automatically parses and validates JSON response.
 *
 * @param prompt - The prompt text to send to Gemini
 * @param modelName - Model to use (default: 'gemini-2.5-pro')
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} If API call fails or JSON parsing fails
 */
export async function queryGeminiJson(
  prompt: string,
  modelName: string = 'gemini-2.5-pro'
): Promise<any> {
  try {
    // Apply rate limiting
    await applyRateLimit();

    const model = getGeminiModel(modelName);

    logger.info(
      { promptLength: prompt.length, modelName, mode: 'JSON' },
      'Sending JSON query to Gemini API'
    );

    // Configure for JSON response
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const response = result.response;
    const text = response.text();

    logger.debug(
      { responseLength: text.length },
      'Received JSON response from Gemini API'
    );

    // Parse JSON response
    const jsonData = JSON.parse(text);

    logger.info(
      { modelName, responseKeys: Object.keys(jsonData).length },
      'Successfully parsed JSON response'
    );

    return jsonData;
  } catch (error) {
    logger.error(
      { error, promptLength: prompt.length, modelName },
      'Gemini JSON API query failed'
    );

    // Provide user-friendly error messages
    if (error instanceof SyntaxError) {
      throw new Error('Gemini API returned invalid JSON. Response could not be parsed.');
    }

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('api key')) {
        throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.');
      }
      if (errorMessage.includes('quota')) {
        throw new Error('Gemini API quota exceeded. Please try again later or upgrade your plan.');
      }
      if (errorMessage.includes('timeout')) {
        throw new Error('Gemini API request timed out. The analysis may be too complex or the service is slow.');
      }
      throw new Error(`Gemini API error: ${error.message}`);
    }

    throw new Error('Unknown error occurred while querying Gemini API');
  }
}

/**
 * Parse response text (handles both JSON and plain text)
 *
 * @param responseText - Raw response text from Gemini
 * @returns {any} Parsed JSON object or original text if not JSON
 */
export function parseResponse(responseText: string): any {
  try {
    // Try to parse as JSON
    const jsonData = JSON.parse(responseText);
    logger.debug('Response parsed as JSON');
    return jsonData;
  } catch (error) {
    // Not JSON, return as plain text
    logger.debug('Response is plain text, not JSON');
    return responseText;
  }
}
