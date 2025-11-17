/**
 * Tests for plan database operations
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { config } from 'dotenv';
import { insertPlan, insertPlans } from '../plans';
import { getPool } from '../connection';
import type { PlanData } from '../../../types/database';

// Load test environment
config({ path: '.env.local' });

describe('Plan Database Operations', () => {
  const pool = getPool();

  // Cleanup after all tests
  afterAll(async () => {
    try {
      await pool.query(`DELETE FROM plans WHERE source LIKE 'TEST%'`);
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      await pool.end();
    }
  });

  // Cleanup before each test with timeout protection
  beforeEach(async () => {
    try {
      await pool.query(`DELETE FROM plans WHERE source LIKE 'TEST%'`);
    } catch (error) {
      console.error('Before each cleanup failed:', error);
      // Don't fail the test, just log the error
    }
  }, 10000); // 10 second timeout

  describe('insertPlan', () => {
    it('should insert a single plan with raw data', async () => {
      const planData: PlanData = {
        name: 'Test Plan',
        price: '£10/month',
        data_allowance: '10GB',
        contract_term: '12 months',
      };

      const result = await insertPlan('TEST_SOURCE', planData);

      expect(result.id).toBeDefined();
      expect(result.source).toBe('TEST_SOURCE');
      expect(result.plan_data).toEqual(planData);
      expect(result.scrape_timestamp).toBeInstanceOf(Date);
    });

    it('should store plan_key as NULL (no normalization)', async () => {
      const planData: PlanData = {
        name: 'Test Plan',
        price: '£15',
        data_allowance: 'Unlimited',
      };

      const result = await insertPlan('TEST_O2', planData);

      // Verify plan_key is NULL
      const query = await pool.query(
        `SELECT plan_key FROM plans WHERE id = $1`,
        [result.id]
      );

      expect(query.rows[0].plan_key).toBeNull();
    });

    it('should handle extra fields in plan_data', async () => {
      const planData: PlanData = {
        name: 'Test Plan',
        price: '£20',
        data_allowance: '50GB',
        contract_term: '24 months',
        extras: ['Free calls', 'EU roaming'],
        url: 'https://example.com/plan',
        custom_field: 'custom value',
      };

      const result = await insertPlan('TEST_VODAFONE', planData);

      expect(result.plan_data).toEqual(planData);
      expect(result.plan_data.extras).toEqual(['Free calls', 'EU roaming']);
      expect(result.plan_data.custom_field).toBe('custom value');
    });
  });

  describe('insertPlans', () => {
    it('should insert multiple plans in a transaction', async () => {
      const plans: PlanData[] = [
        { name: 'Plan 1', price: '£10', data_allowance: '10GB' },
        { name: 'Plan 2', price: '£15', data_allowance: '20GB' },
        { name: 'Plan 3', price: '£20', data_allowance: '30GB' },
      ];

      const results = await insertPlans('TEST_THREE', plans);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.id).toBeDefined();
        expect(result.source).toBe('TEST_THREE');
        expect(result.plan_data).toEqual(plans[index]);
      });
    });

    it('should return empty array for zero plans', async () => {
      const results = await insertPlans('TEST_SKY', []);

      expect(results).toEqual([]);
    });

  it('should handle large batch insertion', async () => {
      const plans: PlanData[] = Array.from({ length: 50 }, (_, i) => ({
        name: `Plan ${i + 1}`,
        price: `£${10 + i}`,
        data_allowance: `${(i + 1) * 5}GB`,
        contract_term: '12 months',
      }));

      const results = await insertPlans('TEST_GIFFGAFF', plans);

      expect(results).toHaveLength(50);
    });
  });

  describe('data integrity', () => {
    it('should preserve JSONB structure exactly', async () => {
      const planData: PlanData = {
        name: 'Complex Plan',
        price: '£10.99/month',
        data_allowance: '100 GB',
        contract_term: '12-month contract',
        extras: [
          'Unlimited calls',
          'Unlimited texts',
          'EU roaming included',
        ],
        metadata: {
          promotional: true,
          discount_percentage: 20,
          valid_until: '2025-12-31',
        },
      };

      const result = await insertPlan('TEST_SMARTY', planData);

      // Verify exact structure preservation
      expect(result.plan_data).toEqual(planData);
      expect(result.plan_data.metadata).toEqual(planData.metadata);
    });

    it('should handle Unicode characters in plan data', async () => {
      const planData: PlanData = {
        name: 'Plan with £ and € symbols',
        price: '£10.00',
        data_allowance: '∞ (Unlimited)',
        contract_term: '12 months',
      };

      const result = await insertPlan('TEST_UNICODE', planData);

      expect(result.plan_data.price).toBe('£10.00');
      expect(result.plan_data.data_allowance).toBe('∞ (Unlimited)');
    });
  });
});
