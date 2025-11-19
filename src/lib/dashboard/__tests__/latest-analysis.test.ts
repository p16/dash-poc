import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getLatestFullAnalysis } from '../latest-analysis';
import * as dbConnection from '@/lib/db/connection';

// Mock the database connection
vi.mock('@/lib/db/connection', () => ({
  query: vi.fn(),
}));

describe('getLatestFullAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null when no analysis exists', async () => {
    vi.mocked(dbConnection.query).mockResolvedValue({
      rows: [],
      command: 'SELECT',
      rowCount: 0,
      oid: 0,
      fields: [],
    });

    const result = await getLatestFullAnalysis();

    expect(result).toBeNull();
  });

  it('should return the latest full analysis', async () => {
    const mockAnalysis = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      comparison_type: 'full',
      brands: ['O2', 'Vodafone', 'Three'],
      analysis_result: { summary: 'Test analysis' },
      plan_ids: ['plan1', 'plan2'],
      created_at: new Date().toISOString(),
    };

    vi.mocked(dbConnection.query).mockResolvedValue({
      rows: [mockAnalysis],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: [],
    });

    const result = await getLatestFullAnalysis();

    expect(result).toBeDefined();
    expect(result?.id).toBe(mockAnalysis.id);
    expect(result?.comparison_type).toBe('full');
    expect(result?.brands).toEqual(['O2', 'Vodafone', 'Three']);
    expect(result?.analysis_result).toEqual({ summary: 'Test analysis' });
    expect(result?.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when database query fails', async () => {
    vi.mocked(dbConnection.query).mockRejectedValue(new Error('Database error'));

    await expect(getLatestFullAnalysis()).rejects.toThrow('Failed to fetch latest analysis');
  });
});
