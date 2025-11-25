/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import AnalysisDetailPage from '../page';

// Mock dependencies
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}));

const mockQuery = vi.fn();
vi.mock('@/lib/db/connection', () => ({
  getPool: vi.fn(() => ({
    query: mockQuery,
  })),
}));

vi.mock('@/components/dashboard/DashboardHeader', () => ({
  DashboardHeader: () => <div data-testid="dashboard-header">Header</div>,
}));

vi.mock('@/components/analysis/AnalysisResults', () => ({
  AnalysisResults: ({ data, timestamp, brands }: any) => (
    <div data-testid="analysis-results">
      <div data-testid="analysis-data">{JSON.stringify(data)}</div>
      <div data-testid="analysis-timestamp">{timestamp.toISOString()}</div>
      <div data-testid="analysis-brands">{brands.join(', ')}</div>
    </div>
  ),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}));

const mockAnalysis = {
  id: 'analysis-123',
  comparison_type: 'full',
  brands: ['O2', 'Vodafone', 'EE'],
  analysis_result: {
    overall_competitive_sentiments: [
      {
        score: 85,
        sentiment: 'Price competitiveness needs improvement',
        rationale: 'O2 pricing is higher than competitors',
      },
    ],
    o2_products_analysis: [],
    full_competitive_dataset_all_plans: [],
  },
  created_at: '2024-11-19T12:00:00Z',
};

describe('Analysis Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReset();
  });

  it('renders analysis detail page with full comparison', async () => {
    mockQuery.mockResolvedValue({
      rows: [mockAnalysis],
    } as any);

    const params = Promise.resolve({ id: 'analysis-123' });
    const component = await AnalysisDetailPage({ params });
    const { container } = render(component);

    // Check title
    expect(container.textContent).toContain('O2 vs All Competitors');

    // Check AnalysisResults is rendered
    expect(screen.getByTestId('analysis-results')).toBeDefined();
    expect(screen.getByTestId('analysis-brands').textContent).toBe('O2, Vodafone, EE');
  });

  it('renders analysis detail page with custom comparison', async () => {
    const customAnalysis = {
      ...mockAnalysis,
      comparison_type: 'custom',
      brands: ['O2', 'Vodafone'],
    };

    mockQuery.mockResolvedValue({
      rows: [customAnalysis],
    } as any);

    const params = Promise.resolve({ id: 'analysis-456' });
    const component = await AnalysisDetailPage({ params });
    const { container } = render(component);

    // Check title for custom comparison
    expect(container.textContent).toContain('O2 vs Vodafone');
  });

  it('calls notFound() when analysis does not exist', async () => {
    mockQuery.mockResolvedValue({
      rows: [],
    } as any);

    const mockNotFound = vi.mocked(notFound);
    mockNotFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    const params = Promise.resolve({ id: 'non-existent-id' });

    await expect(AnalysisDetailPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('displays breadcrumb navigation', async () => {
    mockQuery.mockResolvedValue({
      rows: [mockAnalysis],
    } as any);

    const params = Promise.resolve({ id: 'analysis-123' });
    const component = await AnalysisDetailPage({ params });
    const { container } = render(component);

    // Check breadcrumbs
    expect(container.textContent).toContain('Dashboard');
    expect(container.textContent).toContain('Analysis');
  });

  it('displays action buttons', async () => {
    mockQuery.mockResolvedValue({
      rows: [mockAnalysis],
    } as any);

    const params = Promise.resolve({ id: 'analysis-123' });
    const component = await AnalysisDetailPage({ params });
    const { container } = render(component);

    // Check action buttons
    expect(container.textContent).toContain('Back to Dashboard');
  });

  it('shows cached badge for recent analysis', async () => {
    const recentAnalysis = {
      ...mockAnalysis,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    };

    mockQuery.mockResolvedValue({
      rows: [recentAnalysis],
    } as any);

    const params = Promise.resolve({ id: 'analysis-123' });
    const component = await AnalysisDetailPage({ params });
    const { container } = render(component);

    // Check cached badge
    expect(container.textContent).toContain('Cached Result');
  });

  it('does not show cached badge for old analysis', async () => {
    const oldAnalysis = {
      ...mockAnalysis,
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
    };

    mockQuery.mockResolvedValue({
      rows: [oldAnalysis],
    } as any);

    const params = Promise.resolve({ id: 'analysis-123' });
    const component = await AnalysisDetailPage({ params });
    const { container } = render(component);

    // Cached badge should not be present
    expect(container.textContent).not.toContain('Cached Result');
  });

  it('passes correct props to AnalysisResults component', async () => {
    mockQuery.mockResolvedValue({
      rows: [mockAnalysis],
    } as any);

    const params = Promise.resolve({ id: 'analysis-123' });
    const component = await AnalysisDetailPage({ params });
    render(component);

    const allResultsData = screen.getAllByTestId('analysis-data');
    const allResultsTimestamp = screen.getAllByTestId('analysis-timestamp');
    const allResultsBrands = screen.getAllByTestId('analysis-brands');

    // Just check the first one (they should all be the same)
    expect(JSON.parse(allResultsData[0].textContent!)).toEqual(mockAnalysis.analysis_result);
    expect(allResultsTimestamp[0].textContent).toBe(new Date(mockAnalysis.created_at).toISOString());
    expect(allResultsBrands[0].textContent).toBe('O2, Vodafone, EE');
  });

  it('handles database errors gracefully', async () => {
    mockQuery.mockRejectedValue(new Error('Database connection failed'));

    const params = Promise.resolve({ id: 'analysis-123' });

    await expect(AnalysisDetailPage({ params })).rejects.toThrow('Database connection failed');
  });
});
