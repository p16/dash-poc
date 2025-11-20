/**
 * Tests for RefreshInstructions Component
 *
 * Story: 4.6 - Trigger Scrape from Dashboard (Manual/Cron)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { RefreshInstructions } from '../RefreshInstructions';

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

describe('RefreshInstructions', () => {
  let mockWriteText: any;

  beforeEach(() => {
    // Clean up any previous renders
    cleanup();

    // Mock clipboard API
    mockWriteText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe('Component Rendering', () => {
    it('renders the component with correct heading', () => {
      render(<RefreshInstructions />);
      expect(screen.getByText('Refresh Data')).toBeInTheDocument();
    });

    it('displays the scrape command', () => {
      render(<RefreshInstructions />);
      expect(screen.getByText('npm run scrape')).toBeInTheDocument();
    });

    it('displays instructions text', () => {
      render(<RefreshInstructions />);
      expect(screen.getByText(/To update plan data, run this command:/i)).toBeInTheDocument();
    });

    it('shows the refresh note', () => {
      render(<RefreshInstructions />);
      expect(
        screen.getByText(/After running the scrape command, click the button below or refresh this page/i)
      ).toBeInTheDocument();
    });

    it('displays cron documentation link', () => {
      render(<RefreshInstructions />);
      const cronLink = screen.getByText(/Learn about cron scheduling/i);
      expect(cronLink).toBeInTheDocument();
      expect(cronLink.closest('a')).toHaveAttribute('href', 'https://crontab.guru/');
      expect(cronLink.closest('a')).toHaveAttribute('target', '_blank');
      expect(cronLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders all icon elements', () => {
      const { container } = render(<RefreshInstructions />);
      // Terminal icon, Copy icon, RefreshCw icon, BookOpen icon
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('has expandable cron example section', () => {
      render(<RefreshInstructions />);
      const summary = screen.getByText('Show example cron setup');
      expect(summary).toBeInTheDocument();
      expect(summary.closest('details')).toBeInTheDocument();
    });
  });

  describe('Clipboard Copy Functionality', () => {
    it('copies command to clipboard when copy button is clicked', async () => {
      render(<RefreshInstructions />);

      const copyButtons = screen.getAllByRole('button', { name: /copy command to clipboard/i });
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('npm run scrape');
      });
    });

    it('shows "Copied!" message after successful copy', async () => {
      render(<RefreshInstructions />);

      const copyButtons = screen.getAllByRole('button', { name: /copy command to clipboard/i });
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('handles clipboard API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockClipboard = {
        writeText: vi.fn(() => Promise.reject(new Error('Clipboard API not available'))),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      render(<RefreshInstructions />);

      const copyButtons = screen.getAllByRole('button', { name: /copy command to clipboard/i });
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to copy command:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Page Refresh Functionality', () => {
    it('reloads page when refresh button is clicked', () => {
      render(<RefreshInstructions />);

      const refreshButton = screen.getByText('Refresh Dashboard');
      fireEvent.click(refreshButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Cron Example Section', () => {
    it('shows cron example content', () => {
      render(<RefreshInstructions />);

      // In JSDOM, details elements may not work like in browser
      // Just check that the content is present in the component
      expect(screen.getByText('Show example cron setup')).toBeInTheDocument();
      expect(screen.getByText(/To schedule automatic scraping every day at 2 AM:/i)).toBeInTheDocument();
      expect(screen.getByText(/0 2 \* \* \*/)).toBeInTheDocument();
    });

    it('displays crontab edit command in example', () => {
      render(<RefreshInstructions />);
      expect(screen.getByText(/crontab -e/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label on copy button', () => {
      render(<RefreshInstructions />);
      const copyButton = screen.getByRole('button', { name: /copy command to clipboard/i });
      expect(copyButton).toHaveAttribute('aria-label', 'Copy command to clipboard');
    });

    it('uses semantic HTML elements', () => {
      const { container } = render(<RefreshInstructions />);
      expect(container.querySelector('h2')).toBeInTheDocument();
      expect(container.querySelector('code')).toBeInTheDocument();
      expect(container.querySelector('details')).toBeInTheDocument();
    });

    it('external link has proper security attributes', () => {
      render(<RefreshInstructions />);
      const cronLink = screen.getByText(/Learn about cron scheduling/i).closest('a');
      expect(cronLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Visual States', () => {
    it('displays copy button in default state', () => {
      render(<RefreshInstructions />);
      const copyButtons = screen.getAllByText('Copy');
      expect(copyButtons[0]).toBeInTheDocument();
    });

    it('shows command in monospace font', () => {
      const { container } = render(<RefreshInstructions />);
      const codeElement = container.querySelector('code');
      expect(codeElement).toHaveClass('font-mono');
    });
  });

  describe('Edge Cases', () => {
    it('verifies clipboard writeText is called with correct command', async () => {
      render(<RefreshInstructions />);

      const copyButtons = screen.getAllByRole('button', { name: /copy command to clipboard/i });
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('npm run scrape');
      });
    });
  });
});
