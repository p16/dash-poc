/**
 * Tests for AnalysisDisplay Component
 * Story: 4.2 - Dashboard Home Screen
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisDisplay } from '../AnalysisDisplay';
import type { Analysis } from '@/lib/dashboard/latest-analysis';

describe('AnalysisDisplay Component', () => {
  it('should display empty state when no analysis exists', () => {
    render(<AnalysisDisplay analysis={null} />);

    expect(screen.getByText('No Analysis Yet')).toBeInTheDocument();
    expect(
      screen.getByText(/Click "Run Full Analysis" above to generate your first/)
    ).toBeInTheDocument();
  });

  it('should display analysis with unstructured content', () => {
    const analysis: Analysis = {
      id: '1',
      comparison_type: 'full',
      brands: ['O2', 'Vodafone'],
      analysis_result: { text: 'This is a plain text analysis result.' },
      plan_ids: ['1', '2'],
      created_at: new Date('2025-11-19T12:00:00Z'),
    };

    render(<AnalysisDisplay analysis={analysis} />);

    expect(screen.getByText('Latest Full Analysis')).toBeInTheDocument();
    expect(screen.getByText(/2 brands compared/)).toBeInTheDocument();
  });

  it('should detect and display structured analysis data', () => {
    const structuredResult = {
      currency: 'GBP',
      overall_competitive_sentiments: [
        {
          score: 75,
          sentiment: 'Price competitiveness needs work',
          rationale: 'O2 prices are higher than competitors',
        },
      ],
      o2_products_analysis: [
        {
          product_name: 'O2 10GB Plan',
          data_tier: 'Low',
          roaming_tier: 'EU',
          product_breakdown: {
            product_name: 'O2 10GB Plan',
            contract: '30-day',
            data: '10GB',
            roaming: 'EU',
            price_per_month_GBP: 10,
            extras: 'Free calls',
            competitiveness_score: 65,
          },
          comparable_products: [],
          o2_product_sentiments: [],
          o2_product_changes: [],
          price_suggestions: [],
          source: 'o2',
        },
      ],
      full_competitive_dataset_all_plans: [],
      products_not_considered: [],
    };

    const analysis: Analysis = {
      id: '1',
      comparison_type: 'full',
      brands: ['O2', 'Vodafone'],
      analysis_result: structuredResult,
      plan_ids: ['1', '2'],
      created_at: new Date('2025-11-19T12:00:00Z'),
    };

    render(<AnalysisDisplay analysis={analysis} />);

    expect(screen.getByText('Latest Full Analysis')).toBeInTheDocument();
    // AnalysisResults component should be rendered with structured data
    expect(screen.getByText(/Competitive Insights & Recommendations/)).toBeInTheDocument();
  });

  it('should format timestamp correctly', () => {
    const timestamp = new Date('2025-11-19T12:00:00Z');
    const analysis: Analysis = {
      id: '1',
      comparison_type: 'full',
      brands: ['O2'],
      analysis_result: { text: 'Test analysis' },
      plan_ids: ['1'],
      created_at: timestamp,
    };

    render(<AnalysisDisplay analysis={analysis} />);

    const formattedDate = timestamp.toLocaleString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('should display number of brands compared', () => {
    const analysis: Analysis = {
      id: '1',
      comparison_type: 'full',
      brands: ['O2', 'Vodafone', 'Three'],
      analysis_result: { text: 'Test' },
      plan_ids: ['1', '2', '3'],
      created_at: new Date('2025-11-19T12:00:00Z'),
    };

    render(<AnalysisDisplay analysis={analysis} />);

    expect(screen.getByText(/3 brands compared/)).toBeInTheDocument();
  });

  it('should apply correct styling for empty state', () => {
    render(<AnalysisDisplay analysis={null} />);

    const emptyState = screen
      .getByText(/Click "Run Full Analysis" above to generate/)
      .closest('.border');

    expect(emptyState).toHaveClass('bg-white', 'border-slate-200');
  });

  it('should apply correct styling for analysis content', () => {
    const analysis: Analysis = {
      id: '1',
      comparison_type: 'full',
      brands: ['O2'],
      analysis_result: { text: 'Test analysis' },
      plan_ids: ['1'],
      created_at: new Date('2025-11-19T12:00:00Z'),
    };

    render(<AnalysisDisplay analysis={analysis} />);

    const container = screen.getByText('Latest Full Analysis').closest('.border');
    expect(container).toHaveClass('bg-white', 'border-slate-200');
  });
});
