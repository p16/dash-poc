/**
 * Tests for ScrapeStatus Component
 * Story: 4.2 - Dashboard Home Screen
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrapeStatus } from '../ScrapeStatus';
import type { ScrapeStatus as ScrapeStatusType } from '@/lib/dashboard/scrape-status';

describe('ScrapeStatus Component', () => {
  it('should render fresh status with green color', () => {
    const status: ScrapeStatusType = {
      timestamp: new Date('2025-11-19T12:00:00Z'),
      hoursAgo: 2,
      status: 'fresh',
      statusColor: 'green',
    };

    render(<ScrapeStatus status={status} />);

    expect(screen.getByText('Data Freshness')).toBeInTheDocument();
    expect(screen.getByText(/Data is fresh \(scraped 2 hours ago\)/)).toBeInTheDocument();
    expect(screen.getByText(/Last scraped:/)).toBeInTheDocument();

    const container = screen.getByText('Data Freshness').closest('.border');
    expect(container).toHaveClass('bg-green-50', 'border-green-200', 'text-green-900');
  });

  it('should render stale status with yellow color', () => {
    const status: ScrapeStatusType = {
      timestamp: new Date('2025-11-18T12:00:00Z'),
      hoursAgo: 36,
      status: 'stale',
      statusColor: 'yellow',
    };

    render(<ScrapeStatus status={status} />);

    expect(
      screen.getByText(/Data is getting stale \(scraped 36 hours ago\)/)
    ).toBeInTheDocument();

    const container = screen.getByText('Data Freshness').closest('.border');
    expect(container).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-900');
  });

  it('should render very-stale status with red color', () => {
    const status: ScrapeStatusType = {
      timestamp: new Date('2025-11-17T12:00:00Z'),
      hoursAgo: 72,
      status: 'very-stale',
      statusColor: 'red',
    };

    render(<ScrapeStatus status={status} />);

    expect(
      screen.getByText(/Data is very stale \(scraped 72 hours ago\)/)
    ).toBeInTheDocument();

    const container = screen.getByText('Data Freshness').closest('.border');
    expect(container).toHaveClass('bg-red-50', 'border-red-200', 'text-red-900');
  });

  it('should render no-data status with gray color', () => {
    const status: ScrapeStatusType = {
      timestamp: null,
      hoursAgo: null,
      status: 'no-data',
      statusColor: 'gray',
    };

    render(<ScrapeStatus status={status} />);

    expect(
      screen.getByText('No data available. Run a scrape to get started.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Last scraped:/)).not.toBeInTheDocument();

    const container = screen.getByText('Data Freshness').closest('.border');
    expect(container).toHaveClass('bg-gray-50', 'border-gray-200', 'text-gray-900');
  });

  it('should display correct icon for each status', () => {
    const freshStatus: ScrapeStatusType = {
      timestamp: new Date('2025-11-19T12:00:00Z'),
      hoursAgo: 1,
      status: 'fresh',
      statusColor: 'green',
    };

    const { rerender } = render(<ScrapeStatus status={freshStatus} />);

    // Fresh status should have CheckCircle icon
    expect(screen.getByText('Data Freshness').parentElement).toContainHTML('CheckCircle');

    // Test stale status
    const staleStatus: ScrapeStatusType = {
      timestamp: new Date('2025-11-18T12:00:00Z'),
      hoursAgo: 30,
      status: 'stale',
      statusColor: 'yellow',
    };

    rerender(<ScrapeStatus status={staleStatus} />);
    expect(screen.getByText('Data Freshness').parentElement).toContainHTML('AlertCircle');
  });

  it('should handle singular hour correctly', () => {
    const status: ScrapeStatusType = {
      timestamp: new Date('2025-11-19T12:00:00Z'),
      hoursAgo: 1,
      status: 'fresh',
      statusColor: 'green',
    };

    render(<ScrapeStatus status={status} />);

    expect(screen.getByText(/Data is fresh \(scraped 1 hour ago\)/)).toBeInTheDocument();
  });

  it('should format timestamp correctly', () => {
    const timestamp = new Date('2025-11-19T12:00:00Z');
    const status: ScrapeStatusType = {
      timestamp,
      hoursAgo: 2,
      status: 'fresh',
      statusColor: 'green',
    };

    render(<ScrapeStatus status={status} />);

    const formattedDate = timestamp.toLocaleString();
    expect(screen.getByText(`Last scraped: ${formattedDate}`)).toBeInTheDocument();
  });
});
