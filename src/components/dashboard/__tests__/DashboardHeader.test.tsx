/**
 * Tests for DashboardHeader Component
 * Story: 4.2 - Dashboard Home Screen
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHeader } from '../DashboardHeader';

// Mock fetch for logout
global.fetch = vi.fn();

describe('DashboardHeader Component', () => {
  it('should render header with title and logout button', () => {
    render(<DashboardHeader />);

    expect(screen.getByText('Competitive Intelligence Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
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

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
    });
  });

  it('should have correct styling', () => {
    render(<DashboardHeader />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white', 'border-b', 'border-slate-200');
  });

  it('should have logout button styled correctly', () => {
    render(<DashboardHeader />);

    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toHaveClass('text-slate-600', 'hover:text-slate-900');
  });
});
