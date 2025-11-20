/**
 * Unit Tests for Scrape Trigger API Endpoint
 *
 * Tests POST /api/scrape with mocked Inngest client (Story 4.6)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';

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

describe('POST /api/scrape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Path', () => {
    it('should trigger scraping job and return 202 with job ID', async () => {
      // Mock Inngest send to return job IDs
      vi.mocked(inngest.send).mockResolvedValue({
        ids: ['scrape-job-id-123'],
      });

      // Call endpoint
      const response = await POST();
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(202);
      expect(data.success).toBe(true);
      expect(data.jobId).toBe('scrape-job-id-123');
      expect(data.message).toBe('Scraping job started');
      expect(data.statusUrl).toBe('/api/jobs/scrape-job-id-123');

      // Verify Inngest send was called correctly
      expect(inngest.send).toHaveBeenCalledWith({
        name: 'scrape/trigger',
        data: {
          triggeredBy: 'dashboard',
          timestamp: expect.any(String),
        },
      });
    });

    it('should handle Inngest returning multiple job IDs', async () => {
      // Mock Inngest send to return multiple job IDs (use first one)
      vi.mocked(inngest.send).mockResolvedValue({
        ids: ['job-1', 'job-2'],
      });

      // Call endpoint
      const response = await POST();
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(202);
      expect(data.success).toBe(true);
      expect(data.jobId).toBe('job-1');
      expect(data.statusUrl).toBe('/api/jobs/job-1');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when Inngest send fails', async () => {
      // Mock Inngest send throwing error
      vi.mocked(inngest.send).mockRejectedValue(new Error('Inngest service unavailable'));

      // Call endpoint
      const response = await POST();
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INTERNAL_SERVER_ERROR');
      expect(data.message).toContain('Failed to trigger');
    });

    it('should return 202 when Inngest returns no job IDs', async () => {
      // Mock Inngest send returning empty IDs array
      // Note: The route doesn't validate this edge case currently
      vi.mocked(inngest.send).mockResolvedValue({
        ids: [],
      });

      // Call endpoint
      const response = await POST();
      const data = await response.json();

      // Assertions - route returns 202 but jobId will be undefined
      expect(response.status).toBe(202);
      expect(data.success).toBe(true);
      expect(data.jobId).toBeUndefined();
    });

    it('should return 500 when Inngest returns undefined', async () => {
      // Mock Inngest send returning undefined
      vi.mocked(inngest.send).mockResolvedValue(undefined as any);

      // Call endpoint
      const response = await POST();

      // This will throw when trying to destructure { ids }
      // In real scenario, should catch and return 500
      expect(response.status).toBe(500);
    });

    it('should return 500 for unexpected errors', async () => {
      // Mock Inngest send throwing unexpected error
      vi.mocked(inngest.send).mockRejectedValue(new Error('Network timeout'));

      // Call endpoint
      const response = await POST();
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INTERNAL_SERVER_ERROR');
      expect(data.message).toContain('Failed to trigger');
    });
  });
});
