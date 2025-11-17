import { describe, it, expect, vi } from 'vitest';
import { extractPlanFromLocator } from '../o2';

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

describe('O2 Scraper - extractPlanFromLocator', () => {
  const createMockCard = (content: string) => {
    return {
      innerText: vi.fn().mockResolvedValue(content),
      locator: vi.fn().mockReturnValue({
        first: vi.fn().mockReturnValue({
          textContent: vi.fn().mockResolvedValue(null),
        }),
      }),
    };
  };

  describe('Price extraction', () => {
    it('should extract price from MONTHLY format', async () => {
      const cardContent = 'CLASSIC\n\n100GB\n\nData\n\nMONTHLY\n\n£30.00\n\nTotal monthly cost';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan).not.toBeNull();
      expect(plan?.price).toBe('£30.00/month');
    });

    it('should extract price with decimal', async () => {
      const cardContent = 'PLUS\n\n40GB\n\nMONTHLY\n\n£24.99\n\nTotal monthly';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.price).toBe('£24.99/month');
    });

    it('should extract price from "per month" format', async () => {
      const cardContent = 'CLASSIC\n\n20GB\n\n£20.00 per month';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.price).toBe('£20.00/month');
    });

    it('should return "Price not found" if no price found', async () => {
      const cardContent = 'CLASSIC\n\n100GB\n\nData';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.price).toBe('Price not found');
    });
  });

  describe('Data allowance extraction', () => {
    it('should extract GB data allowance', async () => {
      const cardContent = 'CLASSIC\n\n100GB\n\nData\n\nMONTHLY\n\n£30.00';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.dataAllowance).toBe('100GB');
    });

    it('should extract Unlimited data', async () => {
      const cardContent = 'PLUS\n\nUnlimited\n\nData\n\nMONTHLY\n\n£38.00';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.dataAllowance).toBe('Unlimited');
    });

    it('should extract MB data allowance', async () => {
      const cardContent = 'CLASSIC\n\n500MB\n\nData\n\nMONTHLY\n\n£10.00';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.dataAllowance).toBe('500MB');
    });

    it('should return "Data not found" if no data found', async () => {
      const cardContent = 'CLASSIC\n\nMONTHLY\n\n£30.00';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.dataAllowance).toBe('Data not found');
    });
  });

  describe('Contract term extraction', () => {
    it('should extract 24 month contract', async () => {
      const cardContent = 'CLASSIC\n\n100GB\n\n24 Month Airtime Plan\n\nMONTHLY\n\n£30.00';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.contractTerm).toBe('24 months');
    });

    it('should extract 12 month contract', async () => {
      const cardContent = 'PLUS\n\n40GB\n\n12 Month Airtime Plan\n\nMONTHLY\n\n£24.99';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.contractTerm).toBe('12 months');
    });

    it('should extract 1 month contract', async () => {
      const cardContent = 'CLASSIC\n\n20GB\n\n1 month contract\n\nMONTHLY\n\n£20.00';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.contractTerm).toBe('1 months');
    });

    it('should return "Contract term not found" if no term found', async () => {
      const cardContent = 'CLASSIC\n\n100GB\n\nMONTHLY\n\n£30.00';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.contractTerm).toBe('Contract term not found');
    });
  });

  describe('Plan name extraction', () => {
    it('should use first line as plan name', async () => {
      const cardContent = 'CLASSIC\n\n100GB\n\nData\n\nMONTHLY\n\n£30.00';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.name).toBe('CLASSIC');
    });

    it('should use title element if first line is not available', async () => {
      // Card with no text content - only empty lines
      // This simulates a card where planLines[0] would be undefined
      const cardContent = '\n\n\n';
      const card = createMockCard(cardContent);
      // Mock locator to return title when first line is empty
      const mockTitleLocator = {
        first: vi.fn().mockReturnValue({
          textContent: vi.fn().mockResolvedValue('O2 Classic Plan'),
        }),
      };
      card.locator = vi.fn().mockReturnValue(mockTitleLocator);

      const plan = await extractPlanFromLocator(card);

      expect(plan?.name).toBe('O2 Classic Plan');
    });

    it('should default to "O2 SIM Plan" if no name found', async () => {
      // Card with no text content and no title element
      const cardContent = '\n\n\n';
      const card = createMockCard(cardContent);
      // Mock locator to return null for title (no title found)
      const mockTitleLocator = {
        first: vi.fn().mockReturnValue({
          textContent: vi.fn().mockResolvedValue(null),
        }),
      };
      card.locator = vi.fn().mockReturnValue(mockTitleLocator);
      const plan = await extractPlanFromLocator(card);

      expect(plan?.name).toBe('O2 SIM Plan');
    });
  });

  describe('Virgin Media filter', () => {
    it('should skip cards with Virgin Media promotional text', async () => {
      const cardContent = 'Are you a Virgin Media broadband customer\n\nSpecial offer';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan).toBeNull();
    });

    it('should process cards without Virgin Media text', async () => {
      const cardContent = 'CLASSIC\n\n100GB\n\nMONTHLY\n\n£30.00';
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan).not.toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should return null for empty card content', async () => {
      const card = createMockCard('');
      const plan = await extractPlanFromLocator(card);

      expect(plan).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const card = {
        innerText: vi.fn().mockRejectedValue(new Error('Failed to get text')),
      };
      const plan = await extractPlanFromLocator(card);

      expect(plan).toBeNull();
    });

    it('should extract complete plan data from real-world format', async () => {
      const cardContent = `CLASSIC

100GB

Data

24 Month Airtime Plan

Unlimited UK Minutes & Texts

MONTHLY

£24.00

Total monthly cost increasing to:

£26.50 from

Apr 2026 bill`;
      const card = createMockCard(cardContent);
      const plan = await extractPlanFromLocator(card);

      expect(plan).toEqual({
        name: 'CLASSIC',
        price: '£24.00/month',
        dataAllowance: '100GB',
        contractTerm: '24 months',
      });
    });
  });
});

