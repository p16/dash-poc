/**
 * Refresh Instructions Component
 *
 * Displays instructions for manually triggering scraping via npm command.
 * Includes copy-to-clipboard functionality for user convenience.
 *
 * Story: 4.6 - Trigger Scrape from Dashboard (Manual/Cron)
 */

'use client';

import { useState } from 'react';
import { Terminal, Copy, Check, RefreshCw, BookOpen } from 'lucide-react';

const SCRAPE_COMMAND = 'npm run scrape';

export function RefreshInstructions() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SCRAPE_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy command:', error);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <Terminal className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Refresh Data</h2>

          {/* Command Section */}
          <p className="text-sm text-gray-600 mb-3">
            To update plan data, run this command:
          </p>

          <div className="bg-gray-50 border border-gray-300 rounded-md p-3 mb-4">
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm font-mono text-gray-900 flex-1">
                {SCRAPE_COMMAND}
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Copy command to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Manual Refresh Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-900">
                  After running the scrape command, click the button below or refresh this page to see updated data.
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-sm font-medium text-blue-700 hover:text-blue-800 underline"
                >
                  Refresh Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Cron Documentation Link */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen className="h-4 w-4" />
            <span>
              Want to automate scraping?{' '}
              <a
                href="https://crontab.guru/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Learn about cron scheduling
              </a>
            </span>
          </div>

          {/* Optional: Cron Example */}
          <details className="mt-4">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
              Show example cron setup
            </summary>
            <div className="mt-2 bg-gray-50 border border-gray-300 rounded-md p-3">
              <p className="text-xs text-gray-600 mb-2">
                To schedule automatic scraping every day at 2 AM:
              </p>
              <code className="block text-xs font-mono text-gray-900 whitespace-pre-wrap break-all">
                0 2 * * * cd /path/to/project && npm run scrape
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Edit your crontab with <code className="text-gray-700">crontab -e</code>
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
