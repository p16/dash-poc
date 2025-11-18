/**
 * Tests for Data Normalization Utility
 *
 * Tests cover ACTUAL format variations discovered from all 8 sources
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeDataAllowance,
  normalizePrice,
  normalizeContractTerm,
  generatePlanKey,
  normalizePlanData,
  normalizePlans,
} from '../normalize';

describe('normalizeDataAllowance', () => {
  describe('Standard GB formats', () => {
    it('normalizes "20GB" format (O2, Vodafone, Tesco)', () => {
      expect(normalizeDataAllowance('20GB')).toBe('20GB');
    });

    it('normalizes "250GB" format', () => {
      expect(normalizeDataAllowance('250GB')).toBe('250GB');
    });

    it('normalizes "0.5GB" format (Smarty)', () => {
      expect(normalizeDataAllowance('0.5GB')).toBe('500MB');
    });

    it('normalizes "20 GB" format (with space)', () => {
      expect(normalizeDataAllowance('20 GB')).toBe('20GB');
    });

    it('normalizes "20G" format (without B)', () => {
      expect(normalizeDataAllowance('20G')).toBe('20GB');
    });
  });

  describe('Unlimited format', () => {
    it('normalizes "Unlimited" (all sources)', () => {
      expect(normalizeDataAllowance('Unlimited')).toBe('Unlimited');
    });

    it('normalizes "unlimited" (case insensitive)', () => {
      expect(normalizeDataAllowance('unlimited')).toBe('Unlimited');
    });
  });

  describe('Numeric MB formats (Uswitch)', () => {
    it('normalizes "50000" to "50GB" (Uswitch format)', () => {
      expect(normalizeDataAllowance('50000')).toBe('50GB');
    });

    it('normalizes "80000" to "80GB"', () => {
      expect(normalizeDataAllowance('80000')).toBe('80GB');
    });

    it('normalizes "5000" to "5GB"', () => {
      expect(normalizeDataAllowance('5000')).toBe('5GB');
    });

    it('normalizes "500" to "500MB" (less than 1GB)', () => {
      expect(normalizeDataAllowance('500')).toBe('500MB');
    });

    it('normalizes "1500" to "1.5GB"', () => {
      expect(normalizeDataAllowance('1500')).toBe('1.5GB');
    });
  });

  describe('Edge cases', () => {
    it('handles null input', () => {
      expect(normalizeDataAllowance(null)).toBe('Unknown');
    });

    it('handles undefined input', () => {
      expect(normalizeDataAllowance(undefined)).toBe('Unknown');
    });

    it('handles empty string', () => {
      expect(normalizeDataAllowance('')).toBe('Unknown');
    });

    it('handles unexpected format', () => {
      expect(normalizeDataAllowance('weird format')).toBe('weird format');
    });
  });
});

describe('normalizePrice', () => {
  describe('Standard formats', () => {
    it('normalizes "£20.00/month" format (O2, Smarty, Uswitch)', () => {
      expect(normalizePrice('£20.00/month')).toBe('£20.00');
    });

    it('normalizes "£10" format (Tesco)', () => {
      expect(normalizePrice('£10')).toBe('£10.00');
    });

    it('normalizes "£8.00" format (Giffgaff)', () => {
      expect(normalizePrice('£8.00')).toBe('£8.00');
    });

    it('normalizes "£0/month" format (free plans)', () => {
      expect(normalizePrice('£0/month')).toBe('£0.00');
    });
  });

  describe('Three format (pence as integer)', () => {
    it('normalizes "1300" to "£13.00" (Three format)', () => {
      expect(normalizePrice('1300')).toBe('£13.00');
    });

    it('normalizes "1800" to "£18.00"', () => {
      expect(normalizePrice('1800')).toBe('£18.00');
    });

    it('normalizes "2000" to "£20.00"', () => {
      expect(normalizePrice('2000')).toBe('£20.00');
    });
  });

  describe('Alternative formats', () => {
    it('normalizes "10 GBP per month"', () => {
      expect(normalizePrice('10 GBP per month')).toBe('£10.00');
    });

    it('normalizes "£10 a month"', () => {
      expect(normalizePrice('£10 a month')).toBe('£10.00');
    });

    it('normalizes "10.00" (number without symbol)', () => {
      expect(normalizePrice('10.00')).toBe('£10.00');
    });
  });

  describe('Edge cases', () => {
    it('handles "Unknown" explicitly (Vodafone)', () => {
      expect(normalizePrice('Unknown')).toBe('Unknown');
    });

    it('handles null input', () => {
      expect(normalizePrice(null)).toBe('Unknown');
    });

    it('handles undefined input', () => {
      expect(normalizePrice(undefined)).toBe('Unknown');
    });

    it('handles empty string', () => {
      expect(normalizePrice('')).toBe('Unknown');
    });
  });
});

describe('normalizeContractTerm', () => {
  describe('Standard formats', () => {
    it('normalizes "24 months" format', () => {
      expect(normalizeContractTerm('24 months')).toBe('24 months');
    });

    it('normalizes "12 months" format', () => {
      expect(normalizeContractTerm('12 months')).toBe('12 months');
    });

    it('normalizes "1 month" format (singular)', () => {
      expect(normalizeContractTerm('1 month')).toBe('1 month');
    });

    it('normalizes "18 months" format (Giffgaff)', () => {
      expect(normalizeContractTerm('18 months')).toBe('18 months');
    });
  });

  describe('Uswitch format variations', () => {
    it('normalizes "1 months" (Uswitch typo)', () => {
      expect(normalizeContractTerm('1 months')).toBe('1 month');
    });

    it('normalizes numeric "1" to "1 month"', () => {
      expect(normalizeContractTerm('1')).toBe('1 month');
    });

    it('normalizes numeric "12" to "12 months"', () => {
      expect(normalizeContractTerm('12')).toBe('12 months');
    });

    it('normalizes numeric "0" to "PAYG"', () => {
      expect(normalizeContractTerm('0')).toBe('PAYG');
    });
  });

  describe('Alternative formats', () => {
    it('normalizes "1 year" to "12 months"', () => {
      expect(normalizeContractTerm('1 year')).toBe('12 months');
    });

    it('normalizes "2 years" to "24 months"', () => {
      expect(normalizeContractTerm('2 years')).toBe('24 months');
    });

    it('normalizes "12m" format', () => {
      expect(normalizeContractTerm('12m')).toBe('12 months');
    });

    it('normalizes "24m" format', () => {
      expect(normalizeContractTerm('24m')).toBe('24 months');
    });

    it('normalizes "12-month" format', () => {
      expect(normalizeContractTerm('12-month')).toBe('12 months');
    });

    it('normalizes "24-months" format', () => {
      expect(normalizeContractTerm('24-months')).toBe('24 months');
    });
  });

  describe('PAYG formats', () => {
    it('normalizes "PAYG"', () => {
      expect(normalizeContractTerm('PAYG')).toBe('PAYG');
    });

    it('normalizes "Pay as you go"', () => {
      expect(normalizeContractTerm('Pay as you go')).toBe('PAYG');
    });

    it('normalizes "payg" (case insensitive)', () => {
      expect(normalizeContractTerm('payg')).toBe('PAYG');
    });
  });

  describe('Edge cases', () => {
    it('handles null input', () => {
      expect(normalizeContractTerm(null)).toBe('Unknown');
    });

    it('handles undefined input', () => {
      expect(normalizeContractTerm(undefined)).toBe('Unknown');
    });

    it('handles empty string', () => {
      expect(normalizeContractTerm('')).toBe('Unknown');
    });
  });
});

describe('generatePlanKey', () => {
  it('generates key in correct format', () => {
    expect(generatePlanKey('O2', '10GB', '12 months')).toBe('O2-10GB-12months');
  });

  it('handles Unlimited data', () => {
    expect(generatePlanKey('Vodafone', 'Unlimited', '24 months')).toBe('Vodafone-Unlimited-24months');
  });

  it('handles 1 month contract', () => {
    expect(generatePlanKey('Three', '50GB', '1 month')).toBe('Three-50GB-1month');
  });

  it('handles PAYG contract', () => {
    expect(generatePlanKey('Sky', '100GB', 'PAYG')).toBe('Sky-100GB-payg');
  });

  it('normalizes source name capitalization', () => {
    expect(generatePlanKey('giffgaff', '25GB', '18 months')).toBe('Giffgaff-25GB-18months');
  });

  it('removes spaces from data allowance', () => {
    expect(generatePlanKey('Tesco', '12 GB', '12 months')).toBe('Tesco-12GB-12months');
  });
});

describe('normalizePlanData', () => {
  describe('O2 format', () => {
    it('normalizes O2 plan data', () => {
      const rawData = {
        name: 'CLASSIC',
        price: '£20.00/month',
        contract_term: '24 months',
        data_allowance: '20GB',
      };

      const result = normalizePlanData(rawData, 'O2');

      expect(result.name).toBe('CLASSIC');
      expect(result.data_allowance).toBe('20GB');
      expect(result.price).toBe('£20.00');
      expect(result.contract_term).toBe('24 months');
      expect(result.plan_key).toBe('O2-20GB-24months');
    });
  });

  describe('Vodafone format', () => {
    it('normalizes Vodafone plan data', () => {
      const rawData = {
        name: 'Unlimited Max',
        price: 'Unknown',
        contract_term: '1 month',
        data_allowance: 'Unlimited',
        extras: ['Data Unlimited', '5G at no extra cost'],
      };

      const result = normalizePlanData(rawData, 'Vodafone');

      expect(result.name).toBe('Unlimited Max');
      expect(result.data_allowance).toBe('Unlimited');
      expect(result.price).toBe('Unknown');
      expect(result.contract_term).toBe('1 month');
      expect(result.plan_key).toBe('Vodafone-Unlimited-1month');
      expect(result.extras).toEqual(['Data Unlimited', '5G at no extra cost']);
    });
  });

  describe('Tesco format', () => {
    it('normalizes Tesco plan data', () => {
      const rawData = {
        name: '12GB',
        price: '£10',
        contract_term: '12 months',
        data_allowance: '12GB',
        extras: ['Black Friday deal', 'Works on 4G & 5G'],
      };

      const result = normalizePlanData(rawData, 'Tesco');

      expect(result.data_allowance).toBe('12GB');
      expect(result.price).toBe('£10.00');
      expect(result.contract_term).toBe('12 months');
      expect(result.plan_key).toBe('Tesco-12GB-12months');
    });
  });

  describe('Three format', () => {
    it('normalizes Three plan data with pence pricing', () => {
      const rawData = {
        name: '12GB Lite 24 months',
        price: '1300',
        contract_term: '24 months',
        data_allowance: '12GB',
      };

      const result = normalizePlanData(rawData, 'Three');

      expect(result.data_allowance).toBe('12GB');
      expect(result.price).toBe('£13.00');
      expect(result.contract_term).toBe('24 months');
      expect(result.plan_key).toBe('Three-12GB-24months');
    });
  });

  describe('Giffgaff format', () => {
    it('normalizes Giffgaff plan data', () => {
      const rawData = {
        name: '6GB - 18 month',
        price: '£8.00',
        contract_term: '18 months',
        data_allowance: '6GB',
      };

      const result = normalizePlanData(rawData, 'Giffgaff');

      expect(result.data_allowance).toBe('6GB');
      expect(result.price).toBe('£8.00');
      expect(result.contract_term).toBe('18 months');
      expect(result.plan_key).toBe('Giffgaff-6GB-18months');
    });
  });

  describe('Smarty format', () => {
    it('normalizes Smarty plan data', () => {
      const rawData = {
        name: 'Unlimited',
        price: '£0/month',
        contract_term: '1 month',
        data_allowance: 'Unlimited',
        description: 'Unlimited Data, Unlimited Text, Unlimited Voice',
      };

      const result = normalizePlanData(rawData, 'Smarty');

      expect(result.data_allowance).toBe('Unlimited');
      expect(result.price).toBe('£0.00');
      expect(result.contract_term).toBe('1 month');
      expect(result.plan_key).toBe('Smarty-Unlimited-1month');
    });

    it('normalizes Smarty fractional GB to MB', () => {
      const rawData = {
        name: '0.5GB',
        price: '£5/month',
        contract_term: '1 month',
        data_allowance: '0.5GB',
      };

      const result = normalizePlanData(rawData, 'Smarty');

      expect(result.data_allowance).toBe('500MB');
      expect(result.plan_key).toBe('Smarty-500MB-1month');
    });
  });

  describe('Uswitch format', () => {
    it('normalizes Uswitch plan data with MB numeric format', () => {
      const rawData = {
        name: 'Lebara Mobile - 50000',
        price: '£7.95/month',
        contract_length: 1,
        data_allowance: '50000',
        network_name: 'Lebara Mobile',
      };

      const result = normalizePlanData(rawData, 'Uswitch');

      expect(result.data_allowance).toBe('50GB');
      expect(result.price).toBe('£7.95');
      expect(result.contract_term).toBe('1 month');
      expect(result.plan_key).toBe('Uswitch-50GB-1month');
    });

    it('normalizes Uswitch PAYG plan (contract_length: 0)', () => {
      const rawData = {
        name: 'Test Plan',
        price: '£10/month',
        contract_length: 0,
        data_allowance: '80000',
      };

      const result = normalizePlanData(rawData, 'Uswitch');

      expect(result.contract_term).toBe('PAYG');
      expect(result.plan_key).toBe('Uswitch-80GB-payg');
    });
  });

  describe('Error handling', () => {
    it('handles missing fields gracefully', () => {
      const rawData = {
        name: 'Incomplete Plan',
      };

      const result = normalizePlanData(rawData, 'TestSource');

      expect(result.data_allowance).toBe('Unknown');
      expect(result.price).toBe('Unknown');
      expect(result.contract_term).toBe('Unknown');
      expect(result.plan_key).toContain('Testsource-Unknown-unknown');
    });

    it('preserves original fields', () => {
      const rawData = {
        name: 'Test Plan',
        price: '£10',
        contract_term: '12 months',
        data_allowance: '10GB',
        custom_field: 'custom value',
        extras: ['extra1', 'extra2'],
      };

      const result = normalizePlanData(rawData, 'TestSource');

      expect(result.custom_field).toBe('custom value');
      expect(result.extras).toEqual(['extra1', 'extra2']);
    });
  });
});

describe('normalizePlans', () => {
  it('normalizes an array of plans', () => {
    const plans = [
      {
        name: 'Plan 1',
        price: '£10',
        contract_term: '12 months',
        data_allowance: '10GB',
      },
      {
        name: 'Plan 2',
        price: '£20',
        contract_term: '24 months',
        data_allowance: '20GB',
      },
    ];

    const results = normalizePlans(plans, 'TestSource');

    expect(results).toHaveLength(2);
    expect(results[0].plan_key).toBe('Testsource-10GB-12months');
    expect(results[1].plan_key).toBe('Testsource-20GB-24months');
  });

  it('handles empty array', () => {
    const results = normalizePlans([], 'TestSource');
    expect(results).toEqual([]);
  });
});
