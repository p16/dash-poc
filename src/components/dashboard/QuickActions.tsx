'use client';

import { useState } from 'react';
import { Sparkles, GitCompare } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRunFullAnalysis = async () => {
    setIsRunning(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/analysis/full', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run analysis');
      }

      setSuccess(true);
      // Reload the page to show the new analysis
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error running analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to run analysis');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">Analysis completed successfully! Refreshing...</p>
        </div>
      )}

      <div className="flex gap-4">
        {/* Run Full Analysis Button */}
        <button
          onClick={handleRunFullAnalysis}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <Sparkles className="h-5 w-5" />
          {isRunning ? 'Running Analysis...' : 'Run Full Analysis'}
        </button>

        {/* Custom Comparison Link */}
        <Link
          href="/dashboard/comparison"
          className="flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <GitCompare className="h-5 w-5" />
          Custom Comparison
        </Link>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Note: Full analysis may take 2-5 minutes to complete
      </p>
    </div>
  );
}
