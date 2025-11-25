'use client';

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * Inline Run Full Analysis Button Component
 *
 * Client component for triggering full analysis from the LatestAnalysisCard.
 * Simplified version of RunFullAnalysisCard for inline use.
 */
export function RunFullAnalysisButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRunFullAnalysis = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch('/api/analysis/full', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start analysis');
      }

      const data = await response.json();

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

        // Show success toast
        toast({
          title: "Analysis started!",
          description: `Job ID: ${data.jobId}. Takes 4-5 minutes. Analyzes the most recent plans from the last 180 days.`,
        });
      }

      setIsRunning(false);
    } catch (err) {
      console.error('Error running analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={handleRunFullAnalysis}
        disabled={isRunning}
        size="lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Run Full Analysis
          </>
        )}
      </Button>
    </div>
  );
}
