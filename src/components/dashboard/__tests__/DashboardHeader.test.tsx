/**
 * Tests for DashboardHeader Component
 * Story: 4.2 - Dashboard Home Screen
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DashboardHeader } from '../DashboardHeader';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

// Mock fetch for logout
global.fetch = vi.fn();

describe('DashboardHeader Component', () => {
  afterEach(() => {
    cleanup();
  });
  it('should render header with title and logout button', () => {
    render(<DashboardHeader />);

    expect(screen.getByText('Scrape & Compare')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should call logout API when logout button is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    render(<DashboardHeader />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
    });
  });

  it('should have correct styling', () => {
    render(<DashboardHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white', 'shadow-sm');
  });

  it('should have logout button styled correctly', () => {
    render(<DashboardHeader />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toHaveClass('bg-neutral-900', 'hover:bg-neutral-700');
  });
});
