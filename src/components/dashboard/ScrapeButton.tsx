/**
 * Scrape Button Component
 *
 * Triggers the Inngest scraper job and displays real-time progress.
 * Uses job polling to track scraping progress across all providers.
 *
 * Story: 4.6 - Trigger Scrape from Dashboard (Button)
 * Story: 4.7 - Inngest Integration
 */

'use client';

import { useState } from 'react';
import { Database, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export function ScrapeButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleScrape = async () => {
    setIsRunning(true);
    setError(null);
    setSuccess(false);

    try {
      // Trigger the Inngest scraper job
      const response = await fetch('/api/scrape', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start scraping job');
      }

      const data = await response.json();
      const jobId = data.jobId || data.ids?.[0];

      if (!jobId) {
        throw new Error('No job ID returned');
      }

      // Save event ID to database for tracking
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: jobId,
            eventName: 'scrape/trigger',
          }),
        });
      } catch (saveError) {
        console.error('Failed to save event to database:', saveError);
        // Don't fail the whole operation if event saving fails
      }

      // Poll for job status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/jobs/${jobId}`);

          if (!statusResponse.ok) {
            // Job status endpoint might not be working, but job still runs
            // Just show generic progress
            return;
          }

          const statusData = await statusResponse.json();

          // Update progress based on status
          if (statusData.status === 'Completed') {
            setSuccess(true);
            setIsRunning(false);
            clearInterval(pollInterval);

            // Refresh the page after 2 seconds to show new data
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else if (statusData.status === 'Failed') {
            setError(statusData.error || 'Scraping job failed');
            setIsRunning(false);
            clearInterval(pollInterval);
          }
        } catch (pollError) {
          console.error('Error polling job status:', pollError);
        }
      }, 3000); // Poll every 3 seconds

      // Set timeout after 15 minutes (scraping typically takes 10+ minutes)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isRunning) {
          setIsRunning(false);
          setSuccess(true);
          // Refresh anyway - job likely completed
          window.location.reload();
        }
      }, 15 * 60 * 1000);

    } catch (err) {
      console.error('Error triggering scraper:', err);
      setError(err instanceof Error ? err.message : 'Failed to start scraping');
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <Database className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Refresh Data</h2>

          <p className="text-sm text-gray-600 mb-4">
            Click the button below to scrape the latest plan data from all providers.
            This process typically takes 10-15 minutes.
          </p>

          {/* Scrape Button */}
          <button
            onClick={handleScrape}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Scraping in progress...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Scraping completed!</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Scrape All Providers</span>
              </>
            )}
          </button>

          {/* Progress Indicator */}
          {isRunning && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Loader2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium">
                    Scraping providers...
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This may take 10-15 minutes. The page will automatically refresh when complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && !isRunning && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-green-900 font-medium">
                    Scraping completed successfully!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Page will refresh automatically...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-900 font-medium">
                    Failed to start scraping
                  </p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="mt-4 text-xs text-gray-500">
            <p>
              💡 Scraping runs in the background using Inngest. You can close this page and come back later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
