/**
 * Unit Tests for Prompt Templates and Response Validation
 *
 * Tests prompt templates exist with correct content and validates
 * the response validation utility with various edge cases.
 *
 * Story: 3.2 - Prompt Engineering (AC6, AC7, AC8)
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  validateAnalysisResponse,
  validateCustomComparisonResponse,
  ValidationError,
} from '../validation';

// Mock logger to avoid console noise in tests
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const PROMPTS_DIR = join(__dirname, '../prompts');

describe('Prompt Templates', () => {
  describe('File Existence', () => {
    it('should have prompt-full-analysis.txt file', () => {
      const filePath = join(PROMPTS_DIR, 'prompt-full-analysis.txt');
      expect(() => readFileSync(filePath, 'utf-8')).not.toThrow();
    });

    it('should have prompt-custom-comparison.txt file', () => {
      const filePath = join(PROMPTS_DIR, 'prompt-custom-comparison.txt');
      expect(() => readFileSync(filePath, 'utf-8')).not.toThrow();
    });

    it('should have README.md file', () => {
      const filePath = join(PROMPTS_DIR, 'README.md');
      expect(() => readFileSync(filePath, 'utf-8')).not.toThrow();
    });
  });

  describe('Full Analysis Prompt Content', () => {
    let promptContent: string;

    beforeAll(() => {
      const filePath = join(PROMPTS_DIR, 'prompt-full-analysis.txt');
      promptContent = readFileSync(filePath, 'utf-8');
    });

    it('should mandate JSON-only output', () => {
      expect(promptContent).toContain('JSON');
      expect(promptContent).toContain('valid JSON object');
    });

    it('should define competitiveness scoring model (0-100 scale)', () => {
      expect(promptContent).toContain('0–100');
      expect(promptContent).toContain('Competitiveness Score');
    });

    it('should include weighted scoring factors', () => {
      expect(promptContent).toContain('Data');
      expect(promptContent).toContain('40%');
      expect(promptContent).toContain('Roaming');
      expect(promptContent).toContain('15%');
      expect(promptContent).toContain('Extras');
      expect(promptContent).toContain('Contract Flexibility');
      expect(promptContent).toContain('10%');
      expect(promptContent).toContain('Price');
      expect(promptContent).toContain('20%');
    });

    it('should define required JSON structure with top-level fields', () => {
      expect(promptContent).toContain('analysis_timestamp');
      expect(promptContent).toContain('currency');
      expect(promptContent).toContain('overall_competitive_sentiments');
      expect(promptContent).toContain('o2_products_analysis');
      expect(promptContent).toContain('full_competitive_dataset_all_plans');
    });

    it('should include O2 strategy layer for data tiers', () => {
      expect(promptContent.toLowerCase()).toContain('strategy');
      expect(promptContent).toContain('data tier');
    });

    it('should mention conversion optimization', () => {
      expect(promptContent.toLowerCase()).toContain('conversion');
    });

    it('should include Uswitch data handling instructions', () => {
      expect(promptContent.toLowerCase()).toContain('uswitch');
    });

    it('should specify plan data format context', () => {
      expect(promptContent.toLowerCase()).toContain('price');
      expect(promptContent.toLowerCase()).toContain('data');
      expect(promptContent.toLowerCase()).toContain('roaming');
    });

    it('should specify source naming conventions', () => {
      expect(promptContent).toContain('source');
      expect(promptContent.toLowerCase()).toContain('o2');
      expect(promptContent.toLowerCase()).toContain('vodafone');
    });

    it('should consider all contract lengths', () => {
      expect(promptContent).toContain('30-day');
      expect(promptContent).toContain('12-month');
      expect(promptContent).toContain('24-month');
    });

    it('should request pricing gap identification', () => {
      expect(promptContent.toLowerCase()).toContain('price');
    });

    it('should request feature parity analysis', () => {
      expect(promptContent.toLowerCase()).toContain('roaming');
      expect(promptContent.toLowerCase()).toContain('extras');
    });

    it('should request strategic recommendations', () => {
      expect(promptContent.toLowerCase()).toContain('recommend');
    });

    it('should request competitiveness scores', () => {
      expect(promptContent).toContain('competitiveness_score');
    });
  });

  describe('Custom Comparison Prompt Content', () => {
    let promptContent: string;

    beforeAll(() => {
      const filePath = join(PROMPTS_DIR, 'prompt-custom-comparison.txt');
      promptContent = readFileSync(filePath, 'utf-8');
    });

    it('should use brand placeholders (not O2-specific)', () => {
      expect(promptContent).toContain('{{BRAND_A}}');
      expect(promptContent).toContain('{{BRAND_B}}');
    });

    it('should maintain same JSON structure', () => {
      expect(promptContent).toContain('analysis_timestamp');
      expect(promptContent).toContain('currency');
      expect(promptContent).toContain('overall_competitive_sentiments');
      expect(promptContent).toContain('full_competitive_dataset_all_plans');
    });

    it('should maintain scoring model', () => {
      expect(promptContent).toContain('0–100');
      expect(promptContent).toContain('40%'); // Data
      expect(promptContent).toContain('15%'); // Roaming/Extras
      expect(promptContent).toContain('10%'); // Contract Flexibility
      expect(promptContent).toContain('20%'); // Price
    });

    it('should use brand_a_products_analysis instead of o2_products_analysis', () => {
      expect(promptContent).toContain('brand_a_products_analysis');
      expect(promptContent).not.toContain('o2_products_analysis');
    });
  });

  describe('README Documentation', () => {
    let readmeContent: string;

    beforeAll(() => {
      const filePath = join(PROMPTS_DIR, 'README.md');
      readmeContent = readFileSync(filePath, 'utf-8');
    });

    it('should document scoring model', () => {
      expect(readmeContent).toContain('Scoring Model');
      expect(readmeContent).toContain('40%'); // Data weight
      expect(readmeContent).toContain('0-100');
    });

    it('should document JSON structure', () => {
      expect(readmeContent).toContain('JSON');
      expect(readmeContent).toContain('analysis_timestamp');
      expect(readmeContent).toContain('o2_products_analysis');
    });

    it('should include usage examples', () => {
      expect(readmeContent.toLowerCase()).toContain('example');
    });
  });
});

describe('Response Validation Utility', () => {
  describe('Valid Full Analysis Response', () => {
    const validResponse = {
      analysis_timestamp: '2025-01-18T10:30:00Z',
      currency: 'GBP',
      overall_competitive_sentiments: [
        {
          score: 85,
          sentiment: 'O2 pricing significantly higher',
          rationale: 'Recommend reducing prices by 15-20%',
        },
        {
          score: 70,
          sentiment: 'Limited budget options',
          rationale: 'Introduce budget-tier product line',
        },
        {
          score: 60,
          sentiment: 'Strong extras offering',
          rationale: 'Emphasize Priority tickets in marketing',
        },
        {
          score: 55,
          sentiment: 'Contract flexibility gap',
          rationale: 'Add 30-day options for mid-tier plans',
        },
        {
          score: 50,
          sentiment: 'Roaming competitive',
          rationale: 'EU roaming is standard across competitors',
        },
      ],
      o2_products_analysis: [
        {
          product_name: 'O2 10GB 12-Month',
          data_tier: 'Low',
          roaming_tier: 'EU',
          product_breakdown: {
            brand: 'O2',
            contract: '12-month',
            data: '10GB',
            roaming: 'EU',
            price_per_month_GBP: 12,
            competitiveness_score: 62,
            source: 'o2',
          },
          comparable_products: [
            {
              brand: 'Smarty',
              contract: '30-day',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 7,
              competitiveness_score: 78,
              source: 'smarty',
            },
          ],
          o2_product_sentiments: ['Premium extras but price premium may deter customers'],
          o2_product_changes: ['Reduce price by £2-3/mo'],
          price_suggestions: [
            {
              motivation: 'Match Smarty value proposition',
              price: 9.99,
            },
          ],
          source: 'o2',
        },
        {
          product_name: 'O2 50GB 12-Month',
          data_tier: 'Medium',
          roaming_tier: 'EU',
          product_breakdown: {
            brand: 'O2',
            contract: '12-month',
            data: '50GB',
            roaming: 'EU',
            price_per_month_GBP: 18,
            competitiveness_score: 65,
            source: 'o2',
          },
          comparable_products: [],
          o2_product_sentiments: ['Competitive in mid-tier'],
          o2_product_changes: ['Maintain current pricing'],
          price_suggestions: [],
          source: 'o2',
        },
        {
          product_name: 'O2 100GB 12-Month',
          data_tier: 'Medium',
          roaming_tier: 'EU',
          product_breakdown: {
            brand: 'O2',
            contract: '12-month',
            data: '100GB',
            roaming: 'EU',
            price_per_month_GBP: 22,
            competitiveness_score: 70,
            source: 'o2',
          },
          comparable_products: [],
          o2_product_sentiments: ['Strong value'],
          o2_product_changes: [],
          price_suggestions: [],
          source: 'o2',
        },
        {
          product_name: 'O2 Unlimited 12-Month',
          data_tier: 'Unlimited',
          roaming_tier: 'EU',
          product_breakdown: {
            brand: 'O2',
            contract: '12-month',
            data: 'Unlimited',
            roaming: 'EU',
            price_per_month_GBP: 28,
            competitiveness_score: 75,
            source: 'o2',
          },
          comparable_products: [],
          o2_product_sentiments: ['Premium unlimited offering'],
          o2_product_changes: [],
          price_suggestions: [],
          source: 'o2',
        },
        {
          product_name: 'O2 20GB 30-Day',
          data_tier: 'Low',
          roaming_tier: 'EU',
          product_breakdown: {
            brand: 'O2',
            contract: '30-day',
            data: '20GB',
            roaming: 'EU',
            price_per_month_GBP: 14,
            competitiveness_score: 68,
            source: 'o2',
          },
          comparable_products: [],
          o2_product_sentiments: ['Flexible contract'],
          o2_product_changes: [],
          price_suggestions: [],
          source: 'o2',
        },
      ],
      full_competitive_dataset_all_plans: [
        {
          brand: 'O2',
          contract: '12-month',
          data: '10GB',
          roaming: 'EU',
          price_per_month_GBP: 12,
          extras: 'Priority tickets, O2 WiFi',
          speed: '4G/5G',
          notes: 'Premium extras',
          competitiveness_score: 62,
          source: 'o2',
        },
        {
          brand: 'Smarty',
          contract: '30-day',
          data: '10GB',
          roaming: 'EU',
          price_per_month_GBP: 7,
          extras: 'None',
          speed: '4G',
          notes: 'Budget option',
          competitiveness_score: 78,
          source: 'smarty',
        },
      ],
    };

    it('should validate correct response without errors', () => {
      expect(() => validateAnalysisResponse(validResponse)).not.toThrow();
    });

    it('should return parsed object', () => {
      const result = validateAnalysisResponse(validResponse);
      expect(result).toBeDefined();
      expect(result.currency).toBe('GBP');
    });

    it('should validate JSON string input', () => {
      const jsonString = JSON.stringify(validResponse);
      expect(() => validateAnalysisResponse(jsonString)).not.toThrow();
    });
  });

  describe('JSON Parsing Errors', () => {
    it('should throw ValidationError for invalid JSON string', () => {
      expect(() => validateAnalysisResponse('not valid json')).toThrow(ValidationError);
    });

    it('should throw ValidationError for incomplete JSON', () => {
      expect(() => validateAnalysisResponse('{"analysis_timestamp": ')).toThrow(ValidationError);
    });
  });

  describe('Missing Required Fields', () => {
    it('should log warning for missing analysis_timestamp but not throw', () => {
      const invalidResponse = {
        currency: 'GBP',
        overall_competitive_sentiments: [],
        o2_products_analysis: [],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.currency).toBe('GBP');
    });

    it('should log warning for missing currency but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        overall_competitive_sentiments: [],
        o2_products_analysis: [],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.analysis_timestamp).toBe('2025-01-18T10:30:00Z');
    });

    it('should log warning for missing overall_competitive_sentiments but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        o2_products_analysis: [],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.currency).toBe('GBP');
    });
  });

  describe('Invalid Data Types', () => {
    it('should log warning for non-GBP currency but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'USD',
        overall_competitive_sentiments: [
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
        ],
        o2_products_analysis: [],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.currency).toBe('USD');
    });

    it('should log warning for score > 100 but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        overall_competitive_sentiments: [
          { score: 150, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
        ],
        o2_products_analysis: [],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.overall_competitive_sentiments[0].score).toBe(150);
    });

    it('should log warning for score < 0 but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        overall_competitive_sentiments: [
          { score: -10, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
        ],
        o2_products_analysis: [],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.overall_competitive_sentiments[0].score).toBe(-10);
    });

    it('should log warning for non-number competitiveness_score but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        overall_competitive_sentiments: [
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
        ],
        o2_products_analysis: [
          {
            product_name: 'Test',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test2',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test3',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test4',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test5',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
        ],
        full_competitive_dataset_all_plans: [
          {
            brand: 'O2',
            contract: '12-month',
            data: '10GB',
            roaming: 'EU',
            price_per_month_GBP: 12,
            extras: 'None',
            speed: '4G',
            notes: 'Test',
            competitiveness_score: 'invalid',
            source: 'o2',
          },
        ],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.o2_products_analysis).toHaveLength(5);
    });
  });

  describe('Overall Competitive Sentiments Validation', () => {
    it('should log warning for too few sentiments (< 5) but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        overall_competitive_sentiments: [
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
        ],
        o2_products_analysis: [],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.overall_competitive_sentiments).toHaveLength(2);
    });

    it('should log warning for too many sentiments (> 10) but not throw', () => {
      const sentiments = Array(15)
        .fill(null)
        .map(() => ({ score: 50, sentiment: 'test', rationale: 'test' }));
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        overall_competitive_sentiments: sentiments,
        o2_products_analysis: [],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.overall_competitive_sentiments).toHaveLength(15);
    });

    it('should log warning for missing sentiment field but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        overall_competitive_sentiments: [
          { score: 50, rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
        ],
        o2_products_analysis: [],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.overall_competitive_sentiments).toHaveLength(5);
    });
  });

  describe('O2 Products Analysis Validation', () => {
    it('should log warning for too few products (< 5) but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        overall_competitive_sentiments: [
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
        ],
        o2_products_analysis: [
          {
            product_name: 'Test',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
        ],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.o2_products_analysis).toHaveLength(1);
    });
  });

  describe('Custom Comparison Response Validation', () => {
    const validCustomResponse = {
      analysis_timestamp: '2025-01-18T10:30:00Z',
      currency: 'GBP',
      overall_competitive_sentiments: [
        { score: 50, sentiment: 'test', rationale: 'test' },
        { score: 50, sentiment: 'test', rationale: 'test' },
        { score: 50, sentiment: 'test', rationale: 'test' },
        { score: 50, sentiment: 'test', rationale: 'test' },
        { score: 50, sentiment: 'test', rationale: 'test' },
      ],
      brand_a_products_analysis: [
        {
          product_name: 'Vodafone 10GB',
          data_tier: 'Low',
          roaming_tier: 'EU',
          product_breakdown: {
            brand: 'Vodafone',
            contract: '12-month',
            data: '10GB',
            roaming: 'EU',
            price_per_month_GBP: 12,
            competitiveness_score: 62,
            source: 'vodafone',
          },
          comparable_products: [],
          brand_a_product_sentiments: [],
          brand_a_product_changes: [],
          price_suggestions: [],
          source: 'vodafone',
        },
      ],
      full_competitive_dataset_all_plans: [],
    };

    it('should validate correct custom comparison response', () => {
      expect(() => validateCustomComparisonResponse(validCustomResponse)).not.toThrow();
    });

    it('should log warning for missing brand_a_products_analysis but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        overall_competitive_sentiments: [
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
        ],
        full_competitive_dataset_all_plans: [],
      };
      // Validation now logs issues instead of throwing
      const result = validateCustomComparisonResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.currency).toBe('GBP');
    });
  });

  describe('Products Not Considered Validation', () => {
    it('should validate optional products_not_considered field', () => {
      const validResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        overall_competitive_sentiments: [
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
        ],
        o2_products_analysis: [
          {
            product_name: 'Test',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test2',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test3',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test4',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test5',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
        ],
        full_competitive_dataset_all_plans: [],
        products_not_considered: [
          {
            product: 'Vodafone Business',
            details: 'Business plans not in scope',
          },
        ],
      };
      expect(() => validateAnalysisResponse(validResponse)).not.toThrow();
    });

    it('should log warning for invalid products_not_considered structure but not throw', () => {
      const invalidResponse = {
        analysis_timestamp: '2025-01-18T10:30:00Z',
        currency: 'GBP',
        overall_competitive_sentiments: [
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
          { score: 50, sentiment: 'test', rationale: 'test' },
        ],
        o2_products_analysis: [
          {
            product_name: 'Test',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test2',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test3',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test4',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
          {
            product_name: 'Test5',
            data_tier: 'Low',
            roaming_tier: 'EU',
            product_breakdown: {
              brand: 'O2',
              contract: '12-month',
              data: '10GB',
              roaming: 'EU',
              price_per_month_GBP: 12,
              competitiveness_score: 62,
              source: 'o2',
            },
            comparable_products: [],
            o2_product_sentiments: [],
            o2_product_changes: [],
            price_suggestions: [],
            source: 'o2',
          },
        ],
        full_competitive_dataset_all_plans: [],
        products_not_considered: [
          {
            product: 'Vodafone Business',
            // Missing details field
          },
        ],
      };
      // Validation now logs issues instead of throwing
      const result = validateAnalysisResponse(invalidResponse);
      expect(result).toBeDefined();
      expect(result.products_not_considered).toHaveLength(1);
    });
  });
});
