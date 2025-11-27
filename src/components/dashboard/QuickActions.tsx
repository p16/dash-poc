'use client';

import { useState } from 'react';
import { Sparkles, GitCompare, ExternalLink, Loader2, CheckCircle2, AlertCircle, Table } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleRunFullAnalysis = async () => {
    setIsRunning(true);
    setError(null);
    setJobId(null);

    try {
      const response = await fetch('/api/analysis/full', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start analysis');
      }

      const data = await response.json();
      setJobId(data.jobId);

      // Save event ID to database for tracking
      if (data.jobId) {
        try {
          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: data.jobId,
              eventName: 'analysis/full',
            }),
          });
        } catch (saveError) {
          console.error('Failed to save event to database:', saveError);
        }
      }

      // Don't reload immediately - let user check job status
      setIsRunning(false);
    } catch (err) {
      console.error('Error running analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>

      {error && (
        <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {jobId && (
        <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">Analysis job started!</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Job ID: <code className="bg-emerald-100 dark:bg-emerald-900 px-1 rounded">{jobId}</code>
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                This will take 4-5 minutes. Check the{' '}
                <Link href="/monitor" className="underline font-medium hover:text-emerald-900 dark:hover:text-emerald-100">
                  monitor page
                </Link>{' '}
                to track progress, or refresh this page in a few minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Run Full Analysis Button */}
        <button
          onClick={handleRunFullAnalysis}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-medium py-3 px-6 rounded-lg transition-colors"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Run Full Analysis
            </>
          )}
        </button>

        {/* Custom Comparison Link */}
        <Link
          href="/dashboard/comparison"
          className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <GitCompare className="h-5 w-5" />
          Custom Comparison
        </Link>

        {/* Browse Plans Link */}
        <Link
          href="/dashboard/plans"
          className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <Table className="h-5 w-5" />
          Browse Plans
        </Link>
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <div className="flex-1">
          <p>💡 Analysis runs in the background (4-5 minutes)</p>
        </div>
        <Link
          href="/monitor"
          className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
        >
          <ExternalLink className="h-3 w-3" />
          Monitor jobs
        </Link>
      </div>
    </div>
  );
}
