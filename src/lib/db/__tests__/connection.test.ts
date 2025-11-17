import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';

// Mock pg module
const mockPoolInstance = {
  query: vi.fn(),
  end: vi.fn(),
  on: vi.fn(),
};

vi.mock('pg', () => ({
  Pool: vi.fn(() => mockPoolInstance),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Database Connection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('getPool', () => {
    it('should throw error if DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL;
      const { getPool } = await import('../connection');
      expect(() => getPool()).toThrow('DATABASE_URL environment variable is not set');
    });

    it('should create a new pool when DATABASE_URL is set', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
      const { getPool } = await import('../connection');
      const pool = getPool();
      expect(Pool).toHaveBeenCalled();
      expect(pool).toBeDefined();
    });

    it('should return the same pool instance on subsequent calls', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
      const { getPool } = await import('../connection');
      const pool1 = getPool();
      const pool2 = getPool();
      expect(pool1).toBe(pool2);
      expect(Pool).toHaveBeenCalledTimes(1);
    });

    it('should configure pool with correct settings', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
      const { getPool } = await import('../connection');
      getPool();
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: 'postgresql://test:test@localhost/test',
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        })
      );
    });
  });

  describe('query', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
    });

    it('should execute query and return result', async () => {
      const mockResult = {
        rows: [{ id: 1, name: 'test' }],
        rowCount: 1,
      };
      mockPoolInstance.query.mockResolvedValue(mockResult);

      const { query } = await import('../connection');
      const result = await query('SELECT * FROM test');
      expect(mockPoolInstance.query).toHaveBeenCalledWith('SELECT * FROM test', undefined);
      expect(result).toEqual(mockResult);
    });

    it('should pass parameters to query', async () => {
      const mockResult = { rows: [], rowCount: 0 };
      mockPoolInstance.query.mockResolvedValue(mockResult);

      const { query } = await import('../connection');
      await query('SELECT * FROM test WHERE id = $1', [1]);
      expect(mockPoolInstance.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [1]);
    });

    it('should log query in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const mockResult = { rows: [], rowCount: 0 };
      mockPoolInstance.query.mockResolvedValue(mockResult);

      const { query } = await import('../connection');
      await query('SELECT * FROM test');
      const { logger } = await import('../../utils/logger');
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle query errors', async () => {
      const mockError = new Error('Query failed');
      mockPoolInstance.query.mockRejectedValue(mockError);

      const { query } = await import('../connection');
      await expect(query('SELECT * FROM test')).rejects.toThrow('Query failed');
      const { logger } = await import('../../utils/logger');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('closePool', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
    });

    it('should close the pool if it exists', async () => {
      const { getPool, closePool } = await import('../connection');
      getPool();
      await closePool();
      expect(mockPoolInstance.end).toHaveBeenCalled();
    });

    it('should not throw if pool does not exist', async () => {
      const { closePool } = await import('../connection');
      await expect(closePool()).resolves.not.toThrow();
    });
  });

  describe('testConnection', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
    });

    it('should return true on successful connection', async () => {
      mockPoolInstance.query.mockResolvedValue({
        rows: [{ current_time: new Date() }],
        rowCount: 1,
      });

      const { testConnection } = await import('../connection');
      const result = await testConnection();
      expect(result).toBe(true);
      expect(mockPoolInstance.query).toHaveBeenCalledWith('SELECT NOW() as current_time', undefined);
    });

    it('should throw error if query returns no rows', async () => {
      mockPoolInstance.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const { testConnection } = await import('../connection');
      await expect(testConnection()).rejects.toThrow('Database connection test returned no rows');
    });

    it('should throw error if query fails', async () => {
      mockPoolInstance.query.mockRejectedValue(new Error('Connection failed'));

      const { testConnection } = await import('../connection');
      await expect(testConnection()).rejects.toThrow('Connection failed');
    });
  });
});

