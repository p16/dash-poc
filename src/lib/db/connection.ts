import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

/**
 * Database connection pool configuration
 * Uses connection pooling for efficient database access
 */
let pool: Pool | null = null;

/**
 * Get or create the database connection pool
 * @returns PostgreSQL connection pool
 * @throws Error if DATABASE_URL is not configured
 */
export function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. Please configure it in .env.local'
    );
  }

  const config: PoolConfig = {
    connectionString: databaseUrl,
    // Connection pool settings
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
  };

  pool = new Pool(config);

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error({ error: err }, 'Unexpected error on idle client');
    process.exit(-1);
  });

  return pool;
}

/**
 * Execute a query using the connection pool
 * @param text SQL query text
 * @param params Query parameters (for parameterized queries)
 * @returns Query result
 */
export async function query(text: string, params?: unknown[]) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Log query execution for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      logger.debug({ text, duration, rows: res.rowCount }, 'Executed query');
    }
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error({ text, duration, error }, 'Query error');
    throw error;
  }
}

/**
 * Close the database connection pool
 * Should be called when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Test database connectivity
 * @returns true if connection is successful
 * @throws Error if connection fails
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    if (result.rows && result.rows.length > 0) {
      logger.info({ currentTime: result.rows[0] }, 'Database connection successful');
      return true;
    }
    throw new Error('Database connection test returned no rows');
  } catch (error) {
    logger.error({ error }, 'Database connection test failed');
    throw error;
  }
}

