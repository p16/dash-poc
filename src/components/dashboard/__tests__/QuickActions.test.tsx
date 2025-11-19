/**
 * Tests for QuickActions Component
 * Story: 4.2 - Dashboard Home Screen
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickActions } from '../QuickActions';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

describe('QuickActions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    (global.fetch as any).mockReset();
  });

  it('should render quick action buttons', () => {
    render(<QuickActions />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Run Full Analysis')).toBeInTheDocument();
    expect(screen.getByText('Custom Comparison')).toBeInTheDocument();
    expect(
      screen.getByText(/Note: Full analysis may take 2-5 minutes to complete/)
    ).toBeInTheDocument();
  });

  it('should have correct link for Custom Comparison', () => {
    render(<QuickActions />);

    const customComparisonLink = screen.getByText('Custom Comparison').closest('a');
    expect(customComparisonLink).toHaveAttribute('href', '/dashboard/comparison');
  });

  it('should call API when Run Full Analysis is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<QuickActions />);

    const runButton = screen.getByText('Run Full Analysis');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analysis/full', {
        method: 'POST',
      });
    });
  });

  it('should show loading state during analysis', async () => {
    (global.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ ok: true, json: async () => ({ success: true }) }),
            100
          )
        )
    );

    render(<QuickActions />);

    const runButton = screen.getByText('Run Full Analysis');
    fireEvent.click(runButton);

    // Should show loading text
    expect(screen.getByText('Running Analysis...')).toBeInTheDocument();

    // Button should be disabled
    expect(runButton).toBeDisabled();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should display success message and reload page on success', async () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    vi.useFakeTimers();

    render(<QuickActions />);

    const runButton = screen.getByText('Run Full Analysis');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(
        screen.getByText('Analysis completed successfully! Refreshing...')
      ).toBeInTheDocument();
    });

    // Fast-forward timer for page reload
    vi.advanceTimersByTime(1500);

    expect(reloadSpy).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should display error message on API failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Analysis failed' }),
    });

    render(<QuickActions />);

    const runButton = screen.getByText('Run Full Analysis');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Analysis failed')).toBeInTheDocument();
    });

    // Button should be enabled again
    expect(runButton).not.toBeDisabled();
  });

  it('should display generic error message on network error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<QuickActions />);

    const runButton = screen.getByText('Run Full Analysis');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to run analysis')).toBeInTheDocument();
    });
  });

  it('should clear error when running analysis again', async () => {
    // First call fails
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'First error' }),
    });

    render(<QuickActions />);

    const runButton = screen.getByText('Run Full Analysis');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    // Second call succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    fireEvent.click(runButton);

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });

  it('should have correct styling for buttons', () => {
    render(<QuickActions />);

    const runButton = screen.getByText('Run Full Analysis');
    expect(runButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700');

    const customButton = screen.getByText('Custom Comparison');
    expect(customButton).toHaveClass('bg-slate-600', 'hover:bg-slate-700');
  });
});
