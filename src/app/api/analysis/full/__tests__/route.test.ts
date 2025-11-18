/**
 * Unit Tests for Full Analysis API Endpoint
 *
 * Tests POST /api/analysis/full with mocked database and analysis engine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import type { Pool } from 'pg';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
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

vi.mock('@/lib/db/connection', () => ({
  getPool: vi.fn(() => mockPool),
}));

// Mock analysis engine
vi.mock('@/lib/llm/analysis', () => ({
  generateAnalysis: vi.fn(),
  AnalysisError: class extends Error {
    constructor(message: string, public code: string, public context?: any) {
      super(message);
      this.name = 'AnalysisError';
    }
  },
  AnalysisErrorCode: {
    INVALID_REQUEST: 'INVALID_REQUEST',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    DATABASE_ERROR: 'DATABASE_ERROR',
    API_FAILURE: 'API_FAILURE',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    PROMPT_ERROR: 'PROMPT_ERROR',
  },
}));

import { generateAnalysis, AnalysisError, AnalysisErrorCode } from '@/lib/llm/analysis';

describe('POST /api/analysis/full', () => {
  const mockPlanData = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      source: 'O2',
      plan_data: { name: 'Plan 1', price: 10 },
      scrape_timestamp: new Date('2025-11-18'),
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      source: 'Vodafone',
      plan_data: { name: 'Plan 2', price: 15 },
      scrape_timestamp: new Date('2025-11-18'),
    },
  ];

  const mockAnalysisResult = {
    cached: false,
    analysisId: '123e4567-e89b-12d3-a456-426614174002',
    createdAt: new Date('2025-11-18'),
    data: {
      analysis_timestamp: '2025-11-18T10:00:00Z',
      overall_competitive_sentiments: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Path', () => {
    it('should return analysis results when plan data exists', async () => {
      // Mock database query
      mockQuery.mockResolvedValue({
        rows: mockPlanData,
      });

      // Mock analysis engine
      vi.mocked(generateAnalysis).mockResolvedValue(mockAnalysisResult);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/analysis/full', {
        method: 'POST',
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cached).toBe(false);
      expect(data.analysisId).toBe(mockAnalysisResult.analysisId);
      expect(data.data).toEqual(mockAnalysisResult.data);
      expect(data.metadata).toHaveProperty('planCount', 2);
      expect(data.metadata).toHaveProperty('brandCount', 2);
      expect(data.metadata.brands).toEqual(['O2', 'Vodafone']);

      // Verify analysis engine was called correctly
      expect(generateAnalysis).toHaveBeenCalledWith({
        comparisonType: 'full',
        brands: ['O2', 'Vodafone'],
        planData: mockPlanData,
      });
    });

    it('should return cached analysis when available', async () => {
      // Mock database query
      mockQuery.mockResolvedValue({
        rows: mockPlanData,
      });

      // Mock cached analysis result
      const cachedResult = {
        ...mockAnalysisResult,
        cached: true,
      };
      vi.mocked(generateAnalysis).mockResolvedValue(cachedResult);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/analysis/full', {
        method: 'POST',
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cached).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when no plan data found', async () => {
      // Mock empty database result
      mockQuery.mockResolvedValue({
        rows: [],
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/analysis/full', {
        method: 'POST',
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No plan data available');
      expect(data.message).toContain('No plans found in database');

      // Analysis should not be called
      expect(generateAnalysis).not.toHaveBeenCalled();
    });

    it('should return 400 for INVALID_REQUEST AnalysisError', async () => {
      // Mock database query
      mockQuery.mockResolvedValue({
        rows: mockPlanData,
      });

      // Mock analysis engine throwing AnalysisError
      vi.mocked(generateAnalysis).mockRejectedValue(
        new AnalysisError('Invalid request', AnalysisErrorCode.INVALID_REQUEST)
      );

      // Create request
      const request = new NextRequest('http://localhost:3000/api/analysis/full', {
        method: 'POST',
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_REQUEST');
    });

    it('should return 503 for RATE_LIMIT_EXCEEDED AnalysisError', async () => {
      // Mock database query
      mockQuery.mockResolvedValue({
        rows: mockPlanData,
      });

      // Mock analysis engine throwing rate limit error
      vi.mocked(generateAnalysis).mockRejectedValue(
        new AnalysisError('Rate limit exceeded', AnalysisErrorCode.RATE_LIMIT_EXCEEDED)
      );

      // Create request
      const request = new NextRequest('http://localhost:3000/api/analysis/full', {
        method: 'POST',
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should return 500 for other AnalysisErrors', async () => {
      // Mock database query
      mockQuery.mockResolvedValue({
        rows: mockPlanData,
      });

      // Mock analysis engine throwing generic error
      vi.mocked(generateAnalysis).mockRejectedValue(
        new AnalysisError('Database error', AnalysisErrorCode.DATABASE_ERROR)
      );

      // Create request
      const request = new NextRequest('http://localhost:3000/api/analysis/full', {
        method: 'POST',
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('DATABASE_ERROR');
    });

    it('should return 500 for unexpected errors', async () => {
      // Mock database query throwing unexpected error
      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      // Create request
      const request = new NextRequest('http://localhost:3000/api/analysis/full', {
        method: 'POST',
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INTERNAL_SERVER_ERROR');
      expect(data.message).toContain('unexpected error');
    });
  });
});
