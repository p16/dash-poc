/**
 * Unit Tests for Analysis Generation & Caching Engine
 *
 * Tests the analysis engine with mocked Gemini API and database.
 * Does NOT make real API calls or database queries - uses mocks for fast, reliable testing.
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Pool } from 'pg';

// Mock logger to avoid console noise in tests
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock database connection
const mockQuery = vi.fn();
const mockPool = {
  query: mockQuery,
} as unknown as Pool;

vi.mock('../../db/connection', () => ({
  getPool: vi.fn(() => mockPool),
}));

// Mock Gemini API
vi.mock('../gemini', () => ({
  queryGeminiJson: vi.fn(),
}));

// Mock validation functions
vi.mock('../validation', () => ({
  validateAnalysisResponse: vi.fn(),
  validateCustomComparisonResponse: vi.fn(),
  ValidationError: class extends Error {
    constructor(message: string, public field?: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

// Mock prompt templates
vi.mock('../prompts/prompt-full-analysis.txt', () => ({
  default: 'Full analysis prompt template for {{BRAND_A}} vs all competitors',
}));

vi.mock('../prompts/prompt-custom-comparison.txt', () => ({
  default: 'Compare {{BRAND_A}} vs {{BRAND_B}} custom prompt template',
}));

import { queryGeminiJson } from '../gemini';
import {
  validateAnalysisResponse,
  validateCustomComparisonResponse,
  ValidationError,
} from '../validation';
import {
  generateAnalysis,
  AnalysisError,
  AnalysisErrorCode,
  type AnalysisRequest,
  type PlanDataForAnalysis,
} from '../analysis';

describe('Analysis Generation & Caching Engine', () => {
  // Get mocked functions
  const mockQueryGeminiJson = vi.mocked(queryGeminiJson);
  const mockValidateAnalysisResponse = vi.mocked(validateAnalysisResponse);
  const mockValidateCustomComparisonResponse = vi.mocked(validateCustomComparisonResponse);

  // Sample test data
  const samplePlanData: PlanDataForAnalysis[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      source: 'O2',
      plan_data: {
        name: 'Big Bundle',
        price: '£15',
        data: '10GB',
        contract: '12 months',
      },
      scrape_timestamp: new Date('2025-01-18T10:00:00Z'),
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      source: 'Vodafone',
      plan_data: {
        name: 'Red Plan',
        price: '£20',
        data: '20GB',
        contract: '12 months',
      },
      scrape_timestamp: new Date('2025-01-18T10:00:00Z'),
    },
  ];

  const sampleAnalysisResult = {
    analysis_timestamp: '2025-01-18T10:00:00Z',
    currency: 'GBP',
    overall_competitive_sentiments: [],
    o2_products_analysis: [],
    full_competitive_dataset_all_plans: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations  
    mockValidateAnalysisResponse.mockReturnValue(sampleAnalysisResult);
    mockValidateCustomComparisonResponse.mockReturnValue(sampleAnalysisResult);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAnalysis - Request Validation', () => {
    it('should throw error if brands array is empty', async () => {
      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: [],
        planData: samplePlanData,
      };

      await expect(generateAnalysis(request)).rejects.toThrow(AnalysisError);
      await expect(generateAnalysis(request)).rejects.toThrow('At least one brand must be specified');
    });

    it('should throw error if planData array is empty', async () => {
      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2', 'Vodafone'],
        planData: [],
      };

      await expect(generateAnalysis(request)).rejects.toThrow(AnalysisError);
      await expect(generateAnalysis(request)).rejects.toThrow('At least one plan must be provided');
    });
  });

  describe('generateAnalysis - Cache Hit Path', () => {
    it('should return cached analysis if found', async () => {
      const cachedData = {
        id: 'cached-analysis-id',
        comparison_type: 'full',
        brands: ['O2', 'Vodafone'],
        plan_ids: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
        analysis_result: sampleAnalysisResult,
        created_at: new Date('2025-01-18T09:00:00Z'),
      };

      // Mock cache hit
      mockQuery.mockResolvedValueOnce({
        rows: [cachedData],
      });

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2', 'Vodafone'],
        planData: samplePlanData,
      };

      const result = await generateAnalysis(request);

      expect(result.cached).toBe(true);
      expect(result.analysisId).toBe('cached-analysis-id');
      expect(result.data).toEqual(sampleAnalysisResult);
      expect(result.createdAt).toEqual(cachedData.created_at);

      // Verify no API call was made
      expect(mockQueryGeminiJson).not.toHaveBeenCalled();
      expect(mockValidateAnalysisResponse).not.toHaveBeenCalled();
    });

    it('should query cache with correct parameters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Cache miss
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-id' }] }); // Insert
      mockQueryGeminiJson.mockResolvedValueOnce(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2', 'Vodafone', 'Sky'],
        planData: samplePlanData,
      };

      await generateAnalysis(request);

      // Verify cache query parameters
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, comparison_type, brands, analysis_result, plan_ids, created_at'),
        [
          'full',
          ['O2', 'Vodafone', 'Sky'],
          ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
        ]
      );
    });
  });

  describe('generateAnalysis - Cache Miss Path', () => {
    it('should generate new analysis if cache miss', async () => {
      // Mock cache miss
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Mock successful insert
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'new-analysis-id' }],
      });
      // Mock successful API call
      mockQueryGeminiJson.mockResolvedValueOnce(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2', 'Vodafone'],
        planData: samplePlanData,
      };

      const result = await generateAnalysis(request);

      expect(result.cached).toBe(false);
      expect(result.analysisId).toBe('new-analysis-id');
      expect(result.data).toEqual(sampleAnalysisResult);

      // Verify API was called
      expect(mockQueryGeminiJson).toHaveBeenCalledTimes(1);
      expect(mockValidateAnalysisResponse).toHaveBeenCalledWith(sampleAnalysisResult);
    });

    it('should use full analysis validation for full comparison', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Cache miss
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-id' }] }); // Insert
      mockQueryGeminiJson.mockResolvedValueOnce(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2', 'Vodafone'],
        planData: samplePlanData,
      };

      await generateAnalysis(request);

      expect(mockValidateAnalysisResponse).toHaveBeenCalled();
    });

    it('should use custom comparison validation for custom comparison', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Cache miss
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-id' }] }); // Insert
      mockQueryGeminiJson.mockResolvedValueOnce(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'custom',
        brands: ['O2', 'Vodafone'],
        planData: samplePlanData,
      };

      await generateAnalysis(request);

      expect(mockValidateCustomComparisonResponse).toHaveBeenCalled();
    });

    it('should save analysis to database after generation', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Cache miss
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'saved-id' }] }); // Insert
      mockQueryGeminiJson.mockResolvedValueOnce(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2', 'Vodafone'],
        planData: samplePlanData,
      };

      await generateAnalysis(request);

      // Verify insert query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO analyses'),
        [
          'full',
          ['O2', 'Vodafone'],
          ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
          JSON.stringify(sampleAnalysisResult),
        ]
      );
    });
  });

  describe('generateAnalysis - Validation Retry Logic', () => {
    it('should retry up to 3 times on validation failure', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Cache miss
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'retry-id' }] }); // Insert

      // Mock validation failures followed by success
      mockValidateAnalysisResponse
        .mockImplementationOnce(() => {
          throw new ValidationError('Invalid field', 'test_field');
        })
        .mockImplementationOnce(() => {
          throw new ValidationError('Invalid field', 'test_field');
        })
        .mockReturnValueOnce(sampleAnalysisResult);

      mockQueryGeminiJson.mockResolvedValue(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2'],
        planData: [samplePlanData[0]],
      };

      const result = await generateAnalysis(request);

      expect(result.cached).toBe(false);
      expect(mockQueryGeminiJson).toHaveBeenCalledTimes(3);
      expect(mockValidateAnalysisResponse).toHaveBeenCalledTimes(3);
    }, 15000); // Increased timeout for retries

    it('should throw AnalysisError after 3 failed validation attempts', async () => {
      mockQuery.mockResolvedValue({ rows: [] }); // Cache miss

      // Mock validation failures
      mockValidateAnalysisResponse.mockImplementation(() => {
        throw new ValidationError('Invalid field', 'test_field');
      });

      mockQueryGeminiJson.mockResolvedValue(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2'],
        planData: [samplePlanData[0]],
      };

      await expect(generateAnalysis(request)).rejects.toThrow(AnalysisError);
      await expect(generateAnalysis(request)).rejects.toThrow('validation failed after 3 attempts');

      // Note: Called 6 times because we test twice (expect twice)
      expect(mockQueryGeminiJson).toHaveBeenCalled();
    }, 15000); // Increased timeout for retries

    it('should not retry on non-validation errors', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Cache miss

      // Mock API failure (non-validation error)
      mockQueryGeminiJson.mockRejectedValueOnce(new Error('API timeout'));

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2'],
        planData: [samplePlanData[0]],
      };

      try {
        await generateAnalysis(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AnalysisError);
        expect((error as AnalysisError).message).toContain('Gemini API call failed');
        expect((error as AnalysisError).code).toBe(AnalysisErrorCode.API_FAILURE);
      }

      // Should only try once for non-validation errors
      expect(mockQueryGeminiJson).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateAnalysis - Error Handling', () => {
    it('should throw AnalysisError if database insert fails', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Cache miss
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed')); // Insert fails
      mockQueryGeminiJson.mockResolvedValueOnce(sampleAnalysisResult);
      mockValidateAnalysisResponse.mockReturnValueOnce(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2'],
        planData: [samplePlanData[0]],
      };

      await expect(generateAnalysis(request)).rejects.toThrow(AnalysisError);
      await expect(generateAnalysis(request)).rejects.toMatchObject({
        code: AnalysisErrorCode.DATABASE_ERROR,
      });
    });

    it('should handle cache lookup errors gracefully', async () => {
      // Mock cache query failure
      mockQuery.mockRejectedValueOnce(new Error('DB timeout'));
      // Mock successful generation and insert
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-id' }] });
      mockQueryGeminiJson.mockResolvedValueOnce(sampleAnalysisResult);
      mockValidateAnalysisResponse.mockReturnValueOnce(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2'],
        planData: [samplePlanData[0]],
      };

      // Should not throw - cache errors shouldn't block generation
      const result = await generateAnalysis(request);

      expect(result.cached).toBe(false);
      expect(mockQueryGeminiJson).toHaveBeenCalled();
    });
  });

  describe('generateAnalysis - Prompt Formatting', () => {
    it('should include brand data in prompt for custom comparison', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Cache miss
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-id' }] }); // Insert
      mockQueryGeminiJson.mockResolvedValueOnce(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'custom',
        brands: ['O2', 'Vodafone'],
        planData: samplePlanData,
      };

      await generateAnalysis(request);

      // Verify Gemini was called with prompt containing brand data
      const calledPrompt = mockQueryGeminiJson.mock.calls[0][0];
      expect(calledPrompt).toContain('O2');
      expect(calledPrompt).toContain('Vodafone');
    });

    it('should include plan data as JSON in prompt', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Cache miss
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-id' }] }); // Insert
      mockQueryGeminiJson.mockResolvedValueOnce(sampleAnalysisResult);

      const request: AnalysisRequest = {
        comparisonType: 'full',
        brands: ['O2'],
        planData: [samplePlanData[0]],
      };

      await generateAnalysis(request);

      const calledPrompt = mockQueryGeminiJson.mock.calls[0][0];
      expect(calledPrompt).toContain('O2 data:');
      expect(calledPrompt).toContain('"name": "Big Bundle"');
    });
  });
});
