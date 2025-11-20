/**
 * Unit Tests for Custom Analysis API Endpoint
 *
 * Tests POST /api/analysis/custom with mocked Inngest client (Story 4.7)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Inngest client
vi.mock('@/inngest/client', () => ({
  inngest: {
    send: vi.fn(),
  },
}));

import { inngest } from '@/inngest/client';

describe('POST /api/analysis/custom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Path', () => {
    it('should trigger background job and return 202 with job ID', async () => {
      // Mock Inngest send to return job IDs
      vi.mocked(inngest.send).mockResolvedValue({
        ids: ['test-job-id-456'],
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/analysis/custom', {
        method: 'POST',
        body: JSON.stringify({
          brandA: 'O2',
          brandB: 'Vodafone',
        }),
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(202);
      expect(data.success).toBe(true);
      expect(data.jobId).toBe('test-job-id-456');
      expect(data.message).toBe('Custom comparison job started');
      expect(data.brandA).toBe('O2');
      expect(data.brandB).toBe('Vodafone');
      expect(data.statusUrl).toBe('/api/jobs/test-job-id-456');

      // Verify Inngest send was called correctly
      expect(inngest.send).toHaveBeenCalledWith({
        name: 'analysis/custom',
        data: {
          brandA: 'O2',
          brandB: 'Vodafone',
          triggeredBy: 'api',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('Validation', () => {
    it('should return 400 when brandA is missing', async () => {
      // Create request without brandA
      const request = new NextRequest('http://localhost:3000/api/analysis/custom', {
        method: 'POST',
        body: JSON.stringify({
          brandB: 'Vodafone',
        }),
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_REQUEST');
      expect(data.message).toContain('brandA');

      // Inngest should not be called
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should return 400 when brandB is missing', async () => {
      // Create request without brandB
      const request = new NextRequest('http://localhost:3000/api/analysis/custom', {
        method: 'POST',
        body: JSON.stringify({
          brandA: 'O2',
        }),
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_REQUEST');
      expect(data.message).toContain('brandB');

      // Inngest should not be called
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it('should return 400 when request body is invalid JSON', async () => {
      // Create request with invalid JSON
      const request = new NextRequest('http://localhost:3000/api/analysis/custom', {
        method: 'POST',
        body: 'invalid json',
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_REQUEST');
      expect(data.message).toContain('valid JSON');

      // Inngest should not be called
      expect(inngest.send).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when Inngest send fails', async () => {
      // Mock Inngest send throwing error
      vi.mocked(inngest.send).mockRejectedValue(new Error('Inngest service unavailable'));

      // Create request
      const request = new NextRequest('http://localhost:3000/api/analysis/custom', {
        method: 'POST',
        body: JSON.stringify({
          brandA: 'O2',
          brandB: 'Vodafone',
        }),
      });

      // Call endpoint
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INTERNAL_SERVER_ERROR');
      expect(data.message).toContain('Failed to trigger');
    });
  });
});
