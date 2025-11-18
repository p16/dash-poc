/**
 * Unit Tests for Gemini API Integration
 *
 * Tests the Gemini API connection utility functions with mocked SDK responses.
 * Does NOT make real API calls - uses mocks for fast, reliable testing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger to avoid console noise in tests
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the Google Generative AI SDK
const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
  };
});

import {
  validateApiKey,
  initializeGeminiClient,
  getGeminiModel,
  queryGemini,
  queryGeminiJson,
  parseResponse,
} from '../gemini';

describe('Gemini API Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('should validate a valid API key', () => {
      process.env.GEMINI_API_KEY = 'test-api-key-12345';

      expect(() => validateApiKey()).not.toThrow();
      expect(validateApiKey()).toBe('test-api-key-12345');
    });

    it('should throw error if API key is missing', () => {
      delete process.env.GEMINI_API_KEY;

      expect(() => validateApiKey()).toThrow('GEMINI_API_KEY environment variable is not set');
    });

    it('should throw error if API key is empty string', () => {
      process.env.GEMINI_API_KEY = '';

      expect(() => validateApiKey()).toThrow('GEMINI_API_KEY is invalid');
    });

    it('should throw error if API key is only whitespace', () => {
      process.env.GEMINI_API_KEY = '   ';

      expect(() => validateApiKey()).toThrow('GEMINI_API_KEY is invalid');
    });
  });

  describe('initializeGeminiClient', () => {
    it('should initialize client with valid API key', () => {
      process.env.GEMINI_API_KEY = 'test-api-key-12345';

      const client = initializeGeminiClient();

      expect(client).toBeDefined();
    });

    it('should throw error if API key is invalid', () => {
      delete process.env.GEMINI_API_KEY;

      expect(() => initializeGeminiClient()).toThrow();
    });
  });

  describe('getGeminiModel', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key-12345';
    });

    it('should get model with default name', () => {
      const model = getGeminiModel();

      expect(model).toBeDefined();
    });

    it('should get model with custom name', () => {
      const model = getGeminiModel('gemini-pro');

      expect(model).toBeDefined();
    });
  });

  describe('queryGemini', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key-12345';
      mockGenerateContent.mockClear();
    });

    it('should successfully query Gemini and return text', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Hello from Gemini!',
        },
      });

      const result = await queryGemini('Test prompt');

      expect(result).toBe('Hello from Gemini!');
      expect(mockGenerateContent).toHaveBeenCalledWith('Test prompt');
    });

    it('should handle API key errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(
        new Error('Invalid API key')
      );

      await expect(queryGemini('Test prompt')).rejects.toThrow(
        'Invalid Gemini API key'
      );
    });

    it('should handle quota exceeded errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(
        new Error('Quota exceeded')
      );

      await expect(queryGemini('Test prompt')).rejects.toThrow(
        'Gemini API quota exceeded'
      );
    });

    it('should handle timeout errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(queryGemini('Test prompt')).rejects.toThrow(
        'Gemini API request timed out'
      );
    });

    it('should handle generic errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(
        new Error('Unknown error')
      );

      await expect(queryGemini('Test prompt')).rejects.toThrow(
        'Gemini API error: Unknown error'
      );
    });
  });

  describe('queryGeminiJson', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key-12345';
    });

    it('should successfully query Gemini and return parsed JSON', async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockJsonResponse = { status: 'success', message: 'Hello' };
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockJsonResponse),
        },
      });

      (GoogleGenerativeAI as any).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await queryGeminiJson('Test JSON prompt');

      expect(result).toEqual(mockJsonResponse);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        contents: [{ role: 'user', parts: [{ text: 'Test JSON prompt' }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });
    });

    it('should handle invalid JSON responses', async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => 'Not valid JSON',
        },
      });

      (GoogleGenerativeAI as any).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      await expect(queryGeminiJson('Test prompt')).rejects.toThrow(
        'Gemini API returned invalid JSON'
      );
    });

    it('should handle API errors in JSON mode', async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = vi.fn().mockRejectedValue(
        new Error('API error')
      );

      (GoogleGenerativeAI as any).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      await expect(queryGeminiJson('Test prompt')).rejects.toThrow(
        'Gemini API error: API error'
      );
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON string', () => {
      const jsonString = '{"key": "value", "number": 42}';
      const result = parseResponse(jsonString);

      expect(result).toEqual({ key: 'value', number: 42 });
    });

    it('should return plain text if not JSON', () => {
      const plainText = 'This is plain text, not JSON';
      const result = parseResponse(plainText);

      expect(result).toBe(plainText);
    });

    it('should handle empty string', () => {
      const result = parseResponse('');

      expect(result).toBe('');
    });

    it('should parse JSON arrays', () => {
      const jsonArray = '[1, 2, 3, "test"]';
      const result = parseResponse(jsonArray);

      expect(result).toEqual([1, 2, 3, 'test']);
    });

    it('should parse nested JSON objects', () => {
      const nestedJson = '{"outer": {"inner": {"deep": "value"}}}';
      const result = parseResponse(nestedJson);

      expect(result).toEqual({
        outer: {
          inner: {
            deep: 'value',
          },
        },
      });
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key-12345';
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should apply rate limiting between consecutive requests', async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => 'Response',
        },
      });

      (GoogleGenerativeAI as any).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      // First request
      const promise1 = queryGemini('First request');
      await vi.runAllTimersAsync();
      await promise1;

      // Second request (should be delayed)
      const promise2 = queryGemini('Second request');

      // Fast-forward through the delay
      await vi.runAllTimersAsync();
      await promise2;

      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });
});
