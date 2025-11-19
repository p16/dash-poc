import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getScrapeStatus } from '../scrape-status';
import * as dbConnection from '@/lib/db/connection';

// Mock the database connection
vi.mock('@/lib/db/connection', () => ({
  query: vi.fn(),
}));

describe('getScrapeStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return no-data status when no scrapes exist', async () => {
    vi.mocked(dbConnection.query).mockResolvedValue({
      rows: [{ latest_scrape: null }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: [],
    });

    const result = await getScrapeStatus();

    expect(result).toEqual({
      timestamp: null,
      hoursAgo: null,
      status: 'no-data',
      statusColor: 'gray',
    });
  });

  it('should return fresh status for data less than 24 hours old', async () => {
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);

    vi.mocked(dbConnection.query).mockResolvedValue({
      rows: [{ latest_scrape: twentyHoursAgo.toISOString() }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: [],
    });

    const result = await getScrapeStatus();

    expect(result.status).toBe('fresh');
    expect(result.statusColor).toBe('green');
    expect(result.hoursAgo).toBe(20);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should return stale status for data between 24-48 hours old', async () => {
    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);

    vi.mocked(dbConnection.query).mockResolvedValue({
      rows: [{ latest_scrape: thirtyHoursAgo.toISOString() }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: [],
    });

    const result = await getScrapeStatus();

    expect(result.status).toBe('stale');
    expect(result.statusColor).toBe('yellow');
    expect(result.hoursAgo).toBe(30);
  });

  it('should return very-stale status for data more than 48 hours old', async () => {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    vi.mocked(dbConnection.query).mockResolvedValue({
      rows: [{ latest_scrape: seventyTwoHoursAgo.toISOString() }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: [],
    });

    const result = await getScrapeStatus();

    expect(result.status).toBe('very-stale');
    expect(result.statusColor).toBe('red');
    expect(result.hoursAgo).toBe(72);
  });

  it('should throw error when database query fails', async () => {
    vi.mocked(dbConnection.query).mockRejectedValue(new Error('Database error'));

    await expect(getScrapeStatus()).rejects.toThrow('Failed to fetch scrape status');
  });
});
