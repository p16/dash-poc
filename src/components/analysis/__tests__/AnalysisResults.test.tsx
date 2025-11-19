import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisResults } from '../AnalysisResults';
import type { AnalysisData } from '@/types/analysis';

const mockAnalysisData: AnalysisData = {
  analysis_timestamp: '2025-11-18T10:00:00Z',
  currency: 'GBP',
  overall_competitive_sentiments: [
    {
      score: 85,
      sentiment: 'Price competitiveness needs improvement',
      rationale:
        'O2 prices are 15% higher than competitors. Consider reducing prices by £2-3/mo.',
    },
    {
      score: 45,
      sentiment: 'Data allowances are competitive',
      rationale: 'O2 offers good data tiers but could improve unlimited plans.',
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
      comparable_products: [
        {
          brand: 'Vodafone',
          contract: '30-day',
          data: '10GB',
          roaming: 'EU',
          price_per_month_GBP: 8,
          extras: 'Free calls, EU roaming',
          competitiveness_score: 75,
          source: 'vodafone',
        },
      ],
      o2_product_sentiments: ['Good value for 30-day contract'],
      o2_product_changes: ['Consider reducing price to £8'],
      price_suggestions: [
        {
          motivation: 'Match Vodafone pricing',
          price: '£8/mo',
        },
      ],
      source: 'o2',
    },
  ],
  full_competitive_dataset_all_plans: [
    {
      brand: 'O2',
      contract: '30-day',
      data: '10GB',
      roaming: 'EU',
      price_per_month_GBP: 10,
      extras: 'Free calls',
      competitiveness_score: 65,
      source: 'o2',
    },
    {
      brand: 'Vodafone',
      contract: '30-day',
      data: '10GB',
      roaming: 'EU',
      price_per_month_GBP: 8,
      extras: 'Free calls, EU roaming',
      competitiveness_score: 75,
      source: 'vodafone',
    },
  ],
  products_not_considered: [
    {
      product: 'Three - Old Legacy Plan',
      details: 'Plan no longer available for new customers',
    },
  ],
};

describe('AnalysisResults', () => {
  it('should render metadata correctly', () => {
    const timestamp = new Date('2025-11-18T10:00:00Z');
    const brands = ['O2', 'Vodafone', 'Three'];

    render(
      <AnalysisResults data={mockAnalysisData} timestamp={timestamp} brands={brands} />
    );

    expect(screen.getByText(/Generated:/)).toBeInTheDocument();
    expect(screen.getByText(/Brands:/)).toBeInTheDocument();
    expect(screen.getByText('O2, Vodafone, Three')).toBeInTheDocument();
    expect(screen.getByText(/Currency:/)).toBeInTheDocument();
    expect(screen.getByText('GBP')).toBeInTheDocument();
  });

  it('should display competitive sentiments with scores', () => {
    const timestamp = new Date('2025-11-18T10:00:00Z');
    const brands = ['O2'];

    render(
      <AnalysisResults data={mockAnalysisData} timestamp={timestamp} brands={brands} />
    );

    expect(screen.getByText('Price competitiveness needs improvement')).toBeInTheDocument();
    expect(screen.getByText(/Score: 85/)).toBeInTheDocument();
    expect(
      screen.getByText(/O2 prices are 15% higher than competitors/)
    ).toBeInTheDocument();
  });

  it('should apply correct color coding based on scores', () => {
    const timestamp = new Date('2025-11-18T10:00:00Z');
    const brands = ['O2'];

    render(
      <AnalysisResults data={mockAnalysisData} timestamp={timestamp} brands={brands} />
    );

    // High score (85) should have red color - look at the parent card div
    const highScoreElement = screen
      .getByText('Price competitiveness needs improvement')
      .closest('.border');
    expect(highScoreElement).toHaveClass('border-red-200');
    expect(highScoreElement).toHaveClass('bg-red-50');

    // Medium score (45) should have yellow color
    const mediumScoreElement = screen
      .getByText('Data allowances are competitive')
      .closest('.border');
    expect(mediumScoreElement).toHaveClass('border-yellow-200');
    expect(mediumScoreElement).toHaveClass('bg-yellow-50');
  });

  it('should toggle sections on click', () => {
    const timestamp = new Date('2025-11-18T10:00:00Z');
    const brands = ['O2'];

    render(
      <AnalysisResults data={mockAnalysisData} timestamp={timestamp} brands={brands} />
    );

    const sentimentsButton = screen.getByText(/Competitive Insights & Recommendations/);

    // Sentiments section should be expanded by default
    expect(screen.getByText('Price competitiveness needs improvement')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(sentimentsButton);

    // Sentiments should be hidden
    expect(
      screen.queryByText('Price competitiveness needs improvement')
    ).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(sentimentsButton);

    // Sentiments should be visible again
    expect(screen.getByText('Price competitiveness needs improvement')).toBeInTheDocument();
  });

  it('should display O2 product analysis with expandable sections', () => {
    const timestamp = new Date('2025-11-18T10:00:00Z');
    const brands = ['O2'];

    render(
      <AnalysisResults data={mockAnalysisData} timestamp={timestamp} brands={brands} />
    );

    // Product name should be visible
    expect(screen.getByText('O2 10GB Plan')).toBeInTheDocument();

    // Click to expand product section
    const productButton = screen.getByText('O2 10GB Plan');
    fireEvent.click(productButton);

    // Product details should be visible
    expect(screen.getByText('O2 Product Details')).toBeInTheDocument();
    expect(screen.getAllByText('10GB').length).toBeGreaterThan(0);
    expect(screen.getAllByText('30-day').length).toBeGreaterThan(0);
    expect(screen.getByText('Strategic Insights')).toBeInTheDocument();
    expect(screen.getByText('Price Recommendations')).toBeInTheDocument();
  });

  it('should display comparable products in a table', () => {
    const timestamp = new Date('2025-11-18T10:00:00Z');
    const brands = ['O2'];

    render(
      <AnalysisResults data={mockAnalysisData} timestamp={timestamp} brands={brands} />
    );

    // Expand product section
    const productButton = screen.getByText('O2 10GB Plan');
    fireEvent.click(productButton);

    // Check for table headers
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Contract')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();

    // Check for competitor data
    expect(screen.getByText('Vodafone')).toBeInTheDocument();
    expect(screen.getByText('£8')).toBeInTheDocument();
  });

  it('should display products not considered if present', () => {
    const timestamp = new Date('2025-11-18T10:00:00Z');
    const brands = ['O2'];

    render(
      <AnalysisResults data={mockAnalysisData} timestamp={timestamp} brands={brands} />
    );

    expect(screen.getByText('Products Not Considered')).toBeInTheDocument();
    expect(screen.getByText('Three - Old Legacy Plan')).toBeInTheDocument();
    expect(screen.getByText('Plan no longer available for new customers')).toBeInTheDocument();
  });

  it('should not display products not considered section if empty', () => {
    const dataWithoutExclusions = {
      ...mockAnalysisData,
      products_not_considered: undefined,
    };

    const timestamp = new Date('2025-11-18T10:00:00Z');
    const brands = ['O2'];

    render(
      <AnalysisResults data={dataWithoutExclusions} timestamp={timestamp} brands={brands} />
    );

    expect(screen.queryByText('Products Not Considered')).not.toBeInTheDocument();
  });
});
