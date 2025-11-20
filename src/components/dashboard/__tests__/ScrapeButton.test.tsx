/**
 * Unit Tests for ScrapeButton Component
 *
 * Tests the scrape button functionality including triggering jobs,
 * polling status, and handling success/error states.
 *
 * Story: 4.6 - Trigger Scrape from Dashboard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScrapeButton } from '../ScrapeButton';

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

// Mock fetch globally
global.fetch = vi.fn();

describe('ScrapeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReload.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial Render', () => {
    it('should render the scrape button', () => {
      render(<ScrapeButton />);

      expect(screen.getByRole('button', { name: /scrape all providers/i })).toBeInTheDocument();
      expect(screen.getByText(/click the button below to scrape/i)).toBeInTheDocument();
    });

    it('should display the database icon', () => {
      render(<ScrapeButton />);

      const heading = screen.getByRole('heading', { name: /refresh data/i });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Triggering Scrape', () => {
    it('should trigger scrape job when button is clicked', async () => {
      const user = userEvent.setup();

      // Mock successful API responses
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, jobId: 'test-job-123' }),
      } as Response);

      // Mock event save
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<ScrapeButton />);

      const button = screen.getByRole('button', { name: /scrape all providers/i });
      await user.click(button);

      // Verify API was called
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/scrape', {
          method: 'POST',
        });
      });
    });

    it('should save event ID to database after triggering job', async () => {
      const user = userEvent.setup();

      // Mock API responses
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, jobId: 'test-job-123' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      render(<ScrapeButton />);

      const button = screen.getByRole('button', { name: /scrape all providers/i });
      await user.click(button);

      await waitFor(() => {
        const calls = vi.mocked(fetch).mock.calls;
        const eventCall = calls.find(call => call[0] === '/api/events');
        expect(eventCall).toBeDefined();
        expect(eventCall![1]).toMatchObject({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      }, { timeout: 2000 });
    });

    it('should show loading state while scraping', async () => {
      const user = userEvent.setup();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, jobId: 'test-job-123' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      render(<ScrapeButton />);

      const button = screen.getByRole('button', { name: /scrape all providers/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/scraping in progress/i)).toBeInTheDocument();
        expect(screen.getByText(/this may take 10-15 minutes/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should disable button while scraping', async () => {
      const user = userEvent.setup();

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, jobId: 'test-job-123' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      render(<ScrapeButton />);

      const button = screen.getByRole('button', { name: /scrape all providers/i });
      await user.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('should show error when trigger API fails', async () => {
      const user = userEvent.setup();

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API Error' }),
      } as Response);

      render(<ScrapeButton />);

      const button = screen.getByRole('button', { name: /scrape all providers/i });
      await user.click(button);

      await waitFor(() => {
        // Check for the specific error detail message (not the generic title)
        const errorText = screen.getByText('Failed to start scraping job');
        expect(errorText).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show error when no job ID is returned', async () => {
      const user = userEvent.setup();

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, jobId: null }),
      } as Response);

      render(<ScrapeButton />);

      const button = screen.getByRole('button', { name: /scrape all providers/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/no job id returned/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should continue scraping even if event save fails', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock trigger response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, jobId: 'test-job-123' }),
      } as Response);

      // Mock failed event save
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Database error'));

      render(<ScrapeButton />);

      const button = screen.getByRole('button', { name: /scrape all providers/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/scraping in progress/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to save event to database:',
          expect.any(Error)
        );
      }, { timeout: 2000 });

      consoleErrorSpy.mockRestore();
    });
  });
});
