/**
 * Tests for QuickActions Component
 * Story: 4.2 - Dashboard Home Screen
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QuickActions } from '../QuickActions';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: mockRefresh,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('QuickActions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    (global.fetch as any).mockReset();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render quick action buttons', () => {
    render(<QuickActions />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Run Full Analysis')).toBeInTheDocument();
    expect(screen.getByText('Custom Comparison')).toBeInTheDocument();
    expect(screen.getByText('Browse Plans')).toBeInTheDocument();
    expect(
      screen.getByText(/Analysis runs in the background/)
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
    expect(screen.getByText('Starting...')).toBeInTheDocument();

    // Button should be disabled
    expect(runButton).toBeDisabled();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should have correct styling for buttons', () => {
    render(<QuickActions />);

    const runButton = screen.getByText('Run Full Analysis');
    expect(runButton).toHaveClass('bg-primary', 'hover:bg-primary/90');

    // Link is mocked as <a>, so check the anchor element
    const customLink = screen.getByText('Custom Comparison').closest('a');
    expect(customLink).toHaveClass('bg-secondary', 'hover:bg-secondary/80');
  });
});
