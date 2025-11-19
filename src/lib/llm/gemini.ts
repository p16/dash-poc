/**
 * Google Gemini API Integration
 *
 * Provides utilities for connecting to and querying Google Gemini 2.5 Pro API
 * for LLM-powered competitive analysis.
 *
 * Story: 3.1 - Google Gemini API Integration
 */

import { logger } from '../utils/logger';

/**
 * Gemini API configuration
 */
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-pro:streamGenerateContent';

/**
 * Gemini API request/response types
 */
export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiRequest {
  contents: Array<{
    role: string;
    parts: Array<GeminiPart>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
      role?: string;
    };
    finishReason?: string;
    index?: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  };
  [key: string]: unknown;
}

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
 * Call Gemini API via HTTP fetch
 *
 * @param prompt - The prompt text to send
 * @param config - Optional generation configuration
 * @returns {Promise<GeminiResponse>} API response
 * @throws {Error} If API call fails
 */
export async function callGeminiAPI(
  prompt: string,
  config?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  }
): Promise<GeminiResponse> {
  const apiKey = validateApiKey();

  const requestBody: GeminiRequest = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  if (config) {
    requestBody.generationConfig = config;
  }

  try {
    logger.info(
      { promptLength: prompt.length, hasConfig: !!config },
      'Calling Gemini API via fetch'
    );

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        { status: response.status, statusText: response.statusText, errorText },
        'Gemini API HTTP error'
      );
      throw new Error(
        `Gemini API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: GeminiResponse = await response.json();

    logger.info(
      { data },
      'Received response from Gemini API'
    );

    return data;
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ error: error.message }, 'Failed to call Gemini API');
      throw new Error(`Failed to call Gemini API: ${error.message}`);
    }
    throw new Error('Unknown error occurred while calling Gemini API');
  }
}

/**
 * Extract text from Gemini API response
 *
 * Handles both single and streaming responses (array of chunks).
 * Gemini streaming returns an array of response objects, each with candidates.
 *
 * @param response - Gemini API response (single object or array of chunks)
 * @returns {string} Extracted and concatenated text
 * @throws {Error} If response is invalid
 */
export function extractTextFromResponse(response: GeminiResponse | GeminiResponse[]): string {
  // Handle streaming response (array of chunks)
  if (Array.isArray(response)) {
    logger.debug({ chunkCount: response.length }, 'Processing streaming response');

    const textChunks: string[] = [];

    for (const chunk of response) {
      if (!chunk.candidates || chunk.candidates.length === 0) {
        continue; // Skip empty chunks
      }

      const candidate = chunk.candidates[0];
      if (!candidate.content?.parts?.[0]?.text) {
        continue; // Skip chunks without text
      }

      textChunks.push(candidate.content.parts[0].text);
    }

    if (textChunks.length === 0) {
      throw new Error('No text content in streaming response');
    }

    const fullText = textChunks.join('');
    logger.debug({ chunkCount: textChunks.length, totalLength: fullText.length }, 'Concatenated streaming chunks');

    return fullText;
  }

  // Handle single response object
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No candidates in Gemini API response');
  }

  const firstCandidate = response.candidates[0];
  if (!firstCandidate.content || !firstCandidate.content.parts || firstCandidate.content.parts.length === 0) {
    throw new Error('No content in Gemini API response');
  }

  const text = firstCandidate.content.parts[0].text;
  if (!text) {
    throw new Error('No text in Gemini API response');
  }

  return text;
}

/**
 * Query Gemini API with a prompt
 *
 * @param prompt - The prompt text to send to Gemini
 * @returns {Promise<string>} Generated response text
 * @throws {Error} If API call fails
 */
export async function queryGemini(
  prompt: string
): Promise<string> {
  try {
    logger.info(
      { promptLength: prompt.length },
      'Sending query to Gemini API'
    );

    const response = await callGeminiAPI(prompt);
    const text = extractTextFromResponse(response);

    logger.info(
      { responseLength: text.length },
      'Received response from Gemini API'
    );

    return text;
  } catch (error) {
    logger.error(
      { error, promptLength: prompt.length },
      'Gemini API query failed'
    );

    // Provide user-friendly error messages
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('api key') || errorMessage.includes('unauthorized') || errorMessage.includes('credentials')) {
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
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} If API call fails or JSON parsing fails
 */
export async function queryGeminiJson(
  prompt: string
): Promise<any> {
  try {
    logger.info(
      { promptLength: prompt.length, mode: 'JSON' },
      'Sending JSON query to Gemini API'
    );

    const response = await callGeminiAPI(prompt, {
      responseMimeType: 'application/json',
    });

    const text = extractTextFromResponse(response);

    logger.debug(
      { responseLength: text.length },
      'Received JSON response from Gemini API'
    );

    // Parse JSON response
    const jsonData = JSON.parse(text);

    logger.info(
      { responseKeys: Object.keys(jsonData).length },
      'Successfully parsed JSON response'
    );

    return jsonData;
  } catch (error) {
    logger.error(
      { error, promptLength: prompt.length },
      'Gemini JSON API query failed'
    );

    // Provide user-friendly error messages
    if (error instanceof SyntaxError) {
      throw new Error('Gemini API returned invalid JSON. Response could not be parsed.');
    }

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('api key') || errorMessage.includes('unauthorized') || errorMessage.includes('credentials')) {
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
  } catch {
    // Not JSON, return as plain text
    logger.debug('Response is plain text, not JSON');
    return responseText;
  }
}
