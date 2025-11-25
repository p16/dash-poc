'use client';

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function RunFullAnalysisCard() {
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
          description: `Job ID: ${data.jobId}. Takes 4-5 minutes. Track progress on the monitor page.`,
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">Run Full Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          Analyze all brands and generate comprehensive competitive insights
        </p>

        {/* Action Button */}
        <Button
          onClick={handleRunFullAnalysis}
          disabled={isRunning}
          className="w-full"
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
              Run Analysis
            </>
          )}
        </Button>

        {/* Hint */}
        <p className="text-xs text-muted-foreground text-center">
          💡 Runs in background (4-5 minutes)
        </p>
      </CardContent>
    </Card>
  );
}
