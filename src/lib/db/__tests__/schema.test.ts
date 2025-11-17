/**
 * Database Schema Tests
 *
 * Tests for database schema creation, constraints, indexes, and JSONB operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { config } from 'dotenv';
import type { Plan, Analysis, PlanData, AnalysisResult } from '../../../types/database';

// Load environment variables
config({ path: '.env.local' });

const { Pool } = pg;

describe('Database Schema', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM analyses WHERE comparison_type = $1', ['test']);
    await pool.query('DELETE FROM plans WHERE source = $1', ['TEST']);
    await pool.end();
  });

  describe('plans table', () => {
    it('should exist with correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'plans'
        ORDER BY ordinal_position;
      `);

      expect(result.rows).toHaveLength(5);

      const columns = result.rows.map((row) => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable,
      }));

      expect(columns).toContainEqual({ name: 'id', type: 'uuid', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'source', type: 'text', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'plan_key', type: 'text', nullable: 'YES' });
      expect(columns).toContainEqual({ name: 'plan_data', type: 'jsonb', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'scrape_timestamp', type: 'timestamp with time zone', nullable: 'NO' });
    });

    it('should have indexes on scrape_timestamp and source', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'plans';
      `);

      const indexNames = result.rows.map(row => row.indexname);
      expect(indexNames).toContain('idx_plans_scrape_timestamp');
      expect(indexNames).toContain('idx_plans_source');
      expect(indexNames).toContain('idx_plans_plan_key_timestamp');
    });

    it('should insert plan data with JSONB', async () => {
      const planData: PlanData = {
        name: 'Test Plan',
        price: '£10/month',
        data_allowance: '10GB',
        contract_term: '12 months',
        extras: ['Free calls', 'EU roaming'],
      };

      const result = await pool.query<Plan>(
        `INSERT INTO plans (source, plan_data)
         VALUES ($1, $2)
         RETURNING *`,
        ['TEST', JSON.stringify(planData)]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].source).toBe('TEST');
      expect(result.rows[0].plan_data).toEqual(planData);
      expect(result.rows[0].scrape_timestamp).toBeInstanceOf(Date);
      expect(result.rows[0].id).toBeDefined();
    });

    it('should query JSONB fields', async () => {
      const result = await pool.query(
        `SELECT * FROM plans
         WHERE plan_data->>'name' = $1`,
        ['Test Plan']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].plan_data.name).toBe('Test Plan');
    });

    it('should allow multiple plans with same characteristics (time-series data)', async () => {
      const planData: PlanData = { name: 'Duplicate Plan', price: '£10/month' };

      // First insert
      const result1 = await pool.query<Plan>(
        `INSERT INTO plans (source, plan_data)
         VALUES ($1, $2)
         RETURNING *`,
        ['TEST', JSON.stringify(planData)]
      );

      // Second insert with same data should succeed (time-series)
      const result2 = await pool.query<Plan>(
        `INSERT INTO plans (source, plan_data)
         VALUES ($1, $2)
         RETURNING *`,
        ['TEST', JSON.stringify(planData)]
      );

      expect(result1.rows[0].id).not.toBe(result2.rows[0].id);
      expect(result1.rows[0].plan_data).toEqual(result2.rows[0].plan_data);
    });

    it('should track plan history using plan_key', async () => {
      const planKey = 'TEST-10GB-12months';

      // Insert same plan at different times with different prices
      await pool.query(
        `INSERT INTO plans (source, plan_key, plan_data)
         VALUES ($1, $2, $3)`,
        ['TEST', planKey, JSON.stringify({ price: '£10' })]
      );

      await pool.query(
        `INSERT INTO plans (source, plan_key, plan_data)
         VALUES ($1, $2, $3)`,
        ['TEST', planKey, JSON.stringify({ price: '£9' })]
      );

      // Query plan history
      const result = await pool.query(
        `SELECT * FROM plans
         WHERE plan_key = $1
         ORDER BY scrape_timestamp DESC`,
        [planKey]
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].plan_data.price).toBe('£9'); // Most recent
      expect(result.rows[1].plan_data.price).toBe('£10'); // Older
    });
  });

  describe('analyses table', () => {
    it('should exist with correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'analyses'
        ORDER BY ordinal_position;
      `);

      expect(result.rows).toHaveLength(6);

      const columns = result.rows.map((row) => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable,
      }));

      expect(columns).toContainEqual({ name: 'id', type: 'uuid', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'comparison_type', type: 'text', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'brands', type: 'ARRAY', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'analysis_result', type: 'jsonb', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'plan_ids', type: 'ARRAY', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'created_at', type: 'timestamp with time zone', nullable: 'NO' });
    });

    it('should have index on created_at', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'analyses';
      `);

      const indexNames = result.rows.map(row => row.indexname);
      expect(indexNames).toContain('idx_analyses_created_at');
    });

    it('should insert analysis data with JSONB and arrays', async () => {
      // First create some test plans to reference
      const plan1 = await pool.query<Plan>(
        `INSERT INTO plans (source, plan_data)
         VALUES ($1, $2)
         RETURNING id`,
        ['TEST', JSON.stringify({ name: 'Plan 1' })]
      );

      const plan2 = await pool.query<Plan>(
        `INSERT INTO plans (source, plan_data)
         VALUES ($1, $2)
         RETURNING id`,
        ['TEST', JSON.stringify({ name: 'Plan 2' })]
      );

      const analysisResult: AnalysisResult = {
        summary: 'Test analysis summary',
        recommendations: ['Recommendation 1', 'Recommendation 2'],
        insights: {
          best_value: 'O2',
          best_data: 'Vodafone',
        },
      };

      const result = await pool.query<Analysis>(
        `INSERT INTO analyses (comparison_type, brands, analysis_result, plan_ids)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          'test',
          ['O2', 'Vodafone', 'Sky'],
          JSON.stringify(analysisResult),
          [plan1.rows[0].id, plan2.rows[0].id],
        ]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].comparison_type).toBe('test');
      expect(result.rows[0].brands).toEqual(['O2', 'Vodafone', 'Sky']);
      expect(result.rows[0].analysis_result).toEqual(analysisResult);
      expect(result.rows[0].plan_ids).toEqual([plan1.rows[0].id, plan2.rows[0].id]);
      expect(result.rows[0].created_at).toBeInstanceOf(Date);
    });

    it('should query by comparison_type', async () => {
      const result = await pool.query(
        `SELECT * FROM analyses WHERE comparison_type = $1`,
        ['test']
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].comparison_type).toBe('test');
    });

    it('should query JSONB fields in analyses', async () => {
      const result = await pool.query(
        `SELECT * FROM analyses
         WHERE analysis_result->>'summary' = $1`,
        ['Test analysis summary']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].analysis_result.summary).toBe('Test analysis summary');
    });
  });

  describe('connection pooling', () => {
    it('should handle concurrent queries', async () => {
      const queries = Array.from({ length: 10 }, (_, i) =>
        pool.query('SELECT $1::text as value', [`query-${i}`])
      );

      const results = await Promise.all(queries);

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.rows[0].value).toBe(`query-${i}`);
      });
    });

    it('should maintain pool settings from Story 1.2', async () => {
      // Verify pool is working (from Story 1.2 connection.ts)
      const result = await pool.query('SELECT NOW()');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].now).toBeInstanceOf(Date);
    });
  });

  describe('constraint validation (negative tests)', () => {
    it('should reject NULL source in plans table', async () => {
      await expect(
        pool.query(
          `INSERT INTO plans (source, plan_data) VALUES (NULL, $1)`,
          [JSON.stringify({ name: 'Test' })]
        )
      ).rejects.toThrow();
    });

    it('should reject NULL plan_data in plans table', async () => {
      await expect(
        pool.query(
          `INSERT INTO plans (source, plan_data) VALUES ($1, NULL)`,
          ['TEST']
        )
      ).rejects.toThrow();
    });

    it('should reject invalid JSONB in plans table', async () => {
      await expect(
        pool.query(
          `INSERT INTO plans (source, plan_data) VALUES ($1, $2)`,
          ['TEST', 'not-valid-json']
        )
      ).rejects.toThrow();
    });

    it('should reject NULL comparison_type in analyses table', async () => {
      await expect(
        pool.query(
          `INSERT INTO analyses (comparison_type, brands, analysis_result, plan_ids)
           VALUES (NULL, $1, $2, $3)`,
          [['brand1'], JSON.stringify({ summary: 'test' }), []]
        )
      ).rejects.toThrow();
    });

    it('should reject NULL analysis_result in analyses table', async () => {
      await expect(
        pool.query(
          `INSERT INTO analyses (comparison_type, brands, analysis_result, plan_ids)
           VALUES ($1, $2, NULL, $3)`,
          ['test', ['brand1'], []]
        )
      ).rejects.toThrow();
    });

    it('should handle concurrent writes without conflicts', async () => {
      const planData = { name: 'Concurrent Plan', price: '£10' };

      // Insert 5 plans concurrently with same data
      const inserts = Array.from({ length: 5 }, () =>
        pool.query(
          `INSERT INTO plans (source, plan_data) VALUES ($1, $2) RETURNING id`,
          ['TEST', JSON.stringify(planData)]
        )
      );

      const results = await Promise.all(inserts);

      // All should succeed with unique IDs
      expect(results).toHaveLength(5);
      const ids = results.map(r => r.rows[0].id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5); // All IDs are unique
    });
  });
});
