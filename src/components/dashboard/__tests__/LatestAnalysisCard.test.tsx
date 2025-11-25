/**
 * Tests for LatestAnalysisCard Component
 *
 * Tests ensure that:
 * 1. Only full comparison analyses are displayed
 * 2. The "Run Full Analysis" button is shown in the empty state
 * 3. The title displays correctly for full comparisons
 */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LatestAnalysisCard } from '../LatestAnalysisCard';

// Mock the RunFullAnalysisButton component
vi.mock('../RunFullAnalysisButton', () => ({
  RunFullAnalysisButton: () => <button>Run Full Analysis</button>,
}));

describe('LatestAnalysisCard', () => {
  afterEach(() => {
    cleanup();
  });
  describe('Empty State', () => {
    it('should display "Latest Full Analysis" title when no analysis exists', () => {
      render(<LatestAnalysisCard analysis={null} />);
      expect(screen.getByText('Latest Full Analysis')).toBeInTheDocument();
    });

    it('should display message about full comparison analyses', () => {
      render(<LatestAnalysisCard analysis={null} />);
      expect(screen.getByText(/No full comparison analyses have been run yet/i)).toBeInTheDocument();
    });

    it('should show "Run Full Analysis" button in empty state', () => {
      const { container } = render(<LatestAnalysisCard analysis={null} />);
      const buttons = container.querySelectorAll('button');
      const runButton = Array.from(buttons).find(btn => btn.textContent === 'Run Full Analysis');
      expect(runButton).toBeDefined();
    });

    it('should NOT show "Compare Brands" button in empty state', () => {
      render(<LatestAnalysisCard analysis={null} />);
      // The Compare Brands should only appear as a link in the hint text
      const buttons = screen.queryAllByRole('button');
      const compareBrandsButton = buttons.find(btn => btn.textContent === 'Compare Brands');
      expect(compareBrandsButton).toBeUndefined();
    });

    it('should display hint about Compare Brands page for brand-specific comparisons', () => {
      render(<LatestAnalysisCard analysis={null} />);
      expect(screen.getByText(/For brand-specific comparisons, use the/i)).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /Compare Brands/i });
      expect(link).toHaveAttribute('href', '/dashboard/comparison');
    });
  });

  describe('With Full Comparison Analysis', () => {
    const mockFullAnalysis = {
      id: 'test-id-123',
      brands: ['O2', 'Vodafone', 'Three', 'Sky', 'Tesco', 'Smarty', 'Giffgaff'],
      created_at: new Date().toISOString(),
      comparison_type: 'full',
      analysis_result: {
        key_insights: [
          'O2 offers competitive pricing for data-heavy users',
          'Vodafone has superior network coverage',
          'Three provides excellent value for unlimited data',
        ],
      },
    };

    it('should display "O2 vs All Competitors" title for full comparison', () => {
      const { container } = render(<LatestAnalysisCard analysis={mockFullAnalysis} />);
      const title = container.querySelector('[class*="font-semibold"]');
      expect(title?.textContent).toBe('O2 vs All Competitors');
    });

    it('should display time since creation', () => {
      render(<LatestAnalysisCard analysis={mockFullAnalysis} />);
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });

    it('should display key insights preview', () => {
      const { container } = render(<LatestAnalysisCard analysis={mockFullAnalysis} />);
      const insightsPreview = Array.from(container.querySelectorAll('p')).find(
        p => p.textContent?.includes('Key Insights Preview')
      );
      expect(insightsPreview).toBeDefined();

      const insightText = Array.from(container.querySelectorAll('li')).find(
        li => li.textContent?.includes('O2 offers competitive pricing')
      );
      expect(insightText).toBeDefined();
    });

    it('should display "View Full Analysis" link', () => {
      const { container } = render(<LatestAnalysisCard analysis={mockFullAnalysis} />);
      const links = container.querySelectorAll('a');
      const viewLink = Array.from(links).find(link =>
        link.textContent?.includes('View Full Analysis')
      );
      expect(viewLink).toBeDefined();
      expect(viewLink?.getAttribute('href')).toBe(`/dashboard/analysis/${mockFullAnalysis.id}`);
    });

    it('should display cached badge when is_cached is true', () => {
      const cachedAnalysis = { ...mockFullAnalysis, is_cached: true };
      const { container } = render(<LatestAnalysisCard analysis={cachedAnalysis} />);
      const badge = Array.from(container.querySelectorAll('div')).find(
        div => div.textContent === 'Cached Result'
      );
      expect(badge).toBeDefined();
    });

    it('should NOT display cached badge when is_cached is false', () => {
      const freshAnalysis = { ...mockFullAnalysis, is_cached: false };
      const { container } = render(<LatestAnalysisCard analysis={freshAnalysis} />);
      const badge = Array.from(container.querySelectorAll('div')).find(
        div => div.textContent === 'Cached Result'
      );
      expect(badge).toBeUndefined();
    });

    it('should correctly display insights from overall_competitive_sentiments objects', () => {
      const analysisWithSentiments = {
        ...mockFullAnalysis,
        analysis_result: {
          overall_competitive_sentiments: [
            { score: 85, sentiment: 'Price competitiveness needs improvement', rationale: 'O2 pricing is higher than competitors' },
            { score: 70, sentiment: 'Data allowances could be more generous', rationale: 'Competitors offer more data at similar price points' },
            { score: 60, sentiment: 'Roaming benefits lag behind rivals', rationale: 'Many competitors include EU roaming by default' },
          ],
        },
      };

      const { container } = render(<LatestAnalysisCard analysis={analysisWithSentiments} />);

      // Should extract the sentiment field from objects
      const insightText = Array.from(container.querySelectorAll('li')).find(
        li => li.textContent?.includes('Price competitiveness needs improvement')
      );
      expect(insightText).toBeDefined();
    });
  });

  describe('Regression Prevention', () => {
    it('CRITICAL: should always show "Run Full Analysis" button when no analysis exists', () => {
      const { container } = render(<LatestAnalysisCard analysis={null} />);
      const buttons = container.querySelectorAll('button');
      const runButton = Array.from(buttons).find(btn => btn.textContent === 'Run Full Analysis');
      expect(runButton).toBeDefined();
      expect(runButton?.tagName).toBe('BUTTON');
    });

    it('CRITICAL: should display full comparison type correctly', () => {
      const fullAnalysis = {
        id: 'test-id',
        brands: ['O2', 'Vodafone', 'Three'],
        created_at: new Date().toISOString(),
        comparison_type: 'full',
        analysis_result: {},
      };
      const { container } = render(<LatestAnalysisCard analysis={fullAnalysis} />);
      const title = container.querySelector('[class*="font-semibold"]');
      expect(title?.textContent).toBe('O2 vs All Competitors');
    });

    it('CRITICAL: should handle custom comparison type gracefully if accidentally passed', () => {
      const customAnalysis = {
        id: 'test-id',
        brands: ['O2', 'Vodafone'],
        created_at: new Date().toISOString(),
        comparison_type: 'custom',
        analysis_result: {},
      };
      const { container } = render(<LatestAnalysisCard analysis={customAnalysis} />);
      const title = container.querySelector('[class*="font-semibold"]');
      // Should display brand names instead of "O2 vs All Competitors"
      expect(title?.textContent).toBe('O2 vs Vodafone');
    });
  });
});
