/**
 * Unit Tests for Gemini API Integration
 *
 * Tests with mocked fetch responses - no real API calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  validateApiKey,
  callGeminiAPI,
  extractTextFromResponse,
  queryGemini,
  queryGeminiJson,
  parseResponse,
  type GeminiResponse,
} from '../gemini';

global.fetch = vi.fn();

describe('Gemini API Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateApiKey', () => {
    it('should return API key when set', () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      const apiKey = validateApiKey();
      expect(apiKey).toBe('test-api-key');
    });

    it('should throw error when API key is not set', () => {
      delete process.env.GEMINI_API_KEY;
      expect(() => validateApiKey()).toThrow('GEMINI_API_KEY environment variable is not set');
    });

    it('should throw error when API key is empty string', () => {
      process.env.GEMINI_API_KEY = '   ';
      expect(() => validateApiKey()).toThrow('GEMINI_API_KEY is invalid');
    });
  });

  describe('callGeminiAPI', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should make successful API call', async () => {
      const mockResponse: GeminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Test response' }],
              role: 'model',
            },
            finishReason: 'STOP',
            index: 0,
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await callGeminiAPI('Test prompt');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?key=test-api-key'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(response).toEqual(mockResponse);
    });
  });

  describe('extractTextFromResponse', () => {
    it('should extract text from valid response', () => {
      const response: GeminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Extracted text' }],
            },
          },
        ],
      };

      const text = extractTextFromResponse(response);
      expect(text).toBe('Extracted text');
    });

    it('should throw error when no candidates', () => {
      const response: GeminiResponse = {
        candidates: [],
      };

      expect(() => extractTextFromResponse(response)).toThrow('No candidates in Gemini API response');
    });
  });

  describe('queryGemini', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should query Gemini and return text response', async () => {
      const mockResponse: GeminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Analysis result' }],
            },
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await queryGemini('Analyze this data');

      expect(result).toBe('Analysis result');
    });
  });

  describe('queryGeminiJson', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should query Gemini with JSON mode and parse response', async () => {
      const jsonResult = { analysis: 'result', score: 85 };
      const mockResponse: GeminiResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(jsonResult) }],
            },
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await queryGeminiJson('Analyze this data');

      expect(result).toEqual(jsonResult);
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON', () => {
      const jsonString = '{"key": "value", "number": 42}';
      const result = parseResponse(jsonString);
      expect(result).toEqual({ key: 'value', number: 42 });
    });

    it('should return plain text when not JSON', () => {
      const plainText = 'This is not JSON';
      const result = parseResponse(plainText);
      expect(result).toBe(plainText);
    });
  });
});
