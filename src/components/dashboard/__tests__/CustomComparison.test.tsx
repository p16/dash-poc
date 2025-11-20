/**
 * CustomComparison Component Tests
 *
 * Tests for the custom brand comparison form and results display.
 *
 * Story: 4.4 - Custom Brand Comparison Tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { CustomComparison } from '../CustomComparison';

// Mock fetch globally
global.fetch = vi.fn();

const mockBrands = ['giffgaff', 'o2', 'sky', 'vodafone'];

const mockAnalysisResponse = {
  analysis: {
    overall_competitive_sentiments: [
      {
        priority: 'high',
        insight: 'Price competitiveness needs improvement',
        impact_score: 85,
        explanation: 'O2 prices are 15% higher than competitors.',
      },
    ],
    market_positioning_opportunities: [],
    strategic_actions: [],
    sentiment_analysis: {
      overall_market_sentiment: 'positive',
      key_themes: [],
      competitive_strengths: [],
      improvement_areas: [],
    },
    competitor_product_analysis: [],
    comparable_products: [],
    products_not_considered: [],
  },
  brands: ['o2', 'vodafone'],
  cached: false,
};

describe('CustomComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the comparison form with brand dropdowns', () => {
    render(<CustomComparison brands={mockBrands} />);

    expect(screen.getByText('Custom Brand Comparison')).toBeInTheDocument();
    expect(screen.getByLabelText('Brand A')).toBeInTheDocument();
    expect(screen.getByLabelText('Brand B')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compare brands/i })).toBeInTheDocument();
  });

  it('populates dropdowns with available brands', () => {
    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A') as HTMLSelectElement;
    const options = Array.from(brandASelect.options).map((opt) => opt.value);

    expect(options).toContain('');
    expect(options).toContain('giffgaff');
    expect(options).toContain('o2');
  });

  it('capitalizes brand names in dropdown options', () => {
    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A') as HTMLSelectElement;
    const giffgaffOption = Array.from(brandASelect.options).find((opt) => opt.value === 'giffgaff');

    expect(giffgaffOption?.textContent).toBe('Giffgaff');
  });

  it('disables compare button when no brands selected', () => {
    render(<CustomComparison brands={mockBrands} />);

    const compareButton = screen.getByRole('button', { name: /compare brands/i });
    expect(compareButton).toBeDisabled();
  });

  it('enables compare button when two different brands selected', () => {
    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A');
    const brandBSelect = screen.getByLabelText('Brand B');
    const compareButton = screen.getByRole('button', { name: /compare brands/i });

    fireEvent.change(brandASelect, { target: { value: 'o2' } });
    fireEvent.change(brandBSelect, { target: { value: 'vodafone' } });

    expect(compareButton).toBeEnabled();
  });

  it('shows validation error when same brand selected twice', () => {
    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A');
    const brandBSelect = screen.getByLabelText('Brand B');

    fireEvent.change(brandASelect, { target: { value: 'o2' } });
    fireEvent.change(brandBSelect, { target: { value: 'o2' } });

    expect(screen.getByText(/please select two different brands/i)).toBeInTheDocument();
  });

  it('keeps compare button disabled when same brand selected', () => {
    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A');
    const brandBSelect = screen.getByLabelText('Brand B');
    const compareButton = screen.getByRole('button', { name: /compare brands/i });

    fireEvent.change(brandASelect, { target: { value: 'o2' } });
    fireEvent.change(brandBSelect, { target: { value: 'o2' } });

    expect(compareButton).toBeDisabled();
  });

  it('calls API with correct parameters when compare button clicked', async () => {
    // Mock error response to avoid rendering AnalysisResults with incomplete data
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Test error' }),
    });

    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A');
    const brandBSelect = screen.getByLabelText('Brand B');
    const compareButton = screen.getByRole('button', { name: /compare brands/i });

    fireEvent.change(brandASelect, { target: { value: 'o2' } });
    fireEvent.change(brandBSelect, { target: { value: 'vodafone' } });
    fireEvent.click(compareButton);

    // Wait for async state update to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analysis/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandA: 'o2', brandB: 'vodafone' }),
      });
    });
  });

  it('shows loading state during analysis', async () => {
    (global.fetch as any).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockAnalysisResponse,
              }),
            100
          )
        )
    );

    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A');
    const brandBSelect = screen.getByLabelText('Brand B');
    const compareButton = screen.getByRole('button', { name: /compare brands/i });

    fireEvent.change(brandASelect, { target: { value: 'o2' } });
    fireEvent.change(brandBSelect, { target: { value: 'vodafone' } });
    fireEvent.click(compareButton);

    expect(screen.getByText(/starting analysis\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/this may take 4-5 minutes\.\.\./i)).toBeInTheDocument();
  });

  it('disables form inputs during loading', async () => {
    (global.fetch as any).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockAnalysisResponse,
              }),
            100
          )
        )
    );

    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A');
    const brandBSelect = screen.getByLabelText('Brand B');
    const compareButton = screen.getByRole('button', { name: /compare brands/i });

    fireEvent.change(brandASelect, { target: { value: 'o2' } });
    fireEvent.change(brandBSelect, { target: { value: 'vodafone' } });
    fireEvent.click(compareButton);

    expect(brandASelect).toBeDisabled();
    expect(brandBSelect).toBeDisabled();
    expect(compareButton).toBeDisabled();
  });

  // Note: Testing full AnalysisResults rendering is covered in Story 4.3 tests
  // These tests focus on the CustomComparison component's integration

  it('displays error message on API failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'No plans found for one or both brands' }),
    });

    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A');
    const brandBSelect = screen.getByLabelText('Brand B');
    const compareButton = screen.getByRole('button', { name: /compare brands/i });

    fireEvent.change(brandASelect, { target: { value: 'o2' } });
    fireEvent.change(brandBSelect, { target: { value: 'vodafone' } });
    fireEvent.click(compareButton);

    await waitFor(() => {
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument();
      expect(screen.getByText(/no plans found/i)).toBeInTheDocument();
    });
  });

  it('shows generic error message when API returns non-JSON error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A');
    const brandBSelect = screen.getByLabelText('Brand B');
    const compareButton = screen.getByRole('button', { name: /compare brands/i });

    fireEvent.change(brandASelect, { target: { value: 'o2' } });
    fireEvent.change(brandBSelect, { target: { value: 'vodafone' } });
    fireEvent.click(compareButton);

    await waitFor(() => {
      expect(screen.getByText(/analysis failed with status 500/i)).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A');
    const brandBSelect = screen.getByLabelText('Brand B');
    const compareButton = screen.getByRole('button', { name: /compare brands/i });

    fireEvent.change(brandASelect, { target: { value: 'o2' } });
    fireEvent.change(brandBSelect, { target: { value: 'vodafone' } });
    fireEvent.click(compareButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('allows retry after error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    render(<CustomComparison brands={mockBrands} />);

    const brandASelect = screen.getByLabelText('Brand A');
    const brandBSelect = screen.getByLabelText('Brand B');
    const compareButton = screen.getByRole('button', { name: /compare brands/i });

    fireEvent.change(brandASelect, { target: { value: 'o2' } });
    fireEvent.change(brandBSelect, { target: { value: 'vodafone' } });
    fireEvent.click(compareButton);

    await waitFor(() => {
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    expect(screen.queryByText(/analysis failed/i)).not.toBeInTheDocument();
  });
});
