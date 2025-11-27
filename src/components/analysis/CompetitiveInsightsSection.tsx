/**
 * Competitive Insights Section Component
 *
 * Shared component for displaying competitive insights with icons and scores.
 * Used by both AnalysisResults and CustomComparisonResults.
 */

import { TrendingUp, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

type Sentiment = {
  sentiment?: string;
  score?: number | null;
  rationale?: string;
};

type Props = {
  sentiments: Sentiment[] | null | undefined;
};

export function getCompetitivenessIcon(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
  }
  if (score >= 80) {
    return <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />;
  }
  if (score >= 50) {
    return <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />;
  }
  return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />;
}

export function CompetitiveInsightsSection({ sentiments }: Props) {
  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        Competitive Insights
      </h2>
      {sentiments && sentiments.length > 0 ? (
        <div className="space-y-4">
          {sentiments.map((sentiment, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg text-foreground bg-muted border"
            >
              <div className="flex items-start gap-3 mb-2">
                {getCompetitivenessIcon(sentiment?.score)}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{sentiment?.sentiment || 'N/A'}</h3>
                    <span className="text-sm font-medium px-2 py-1 rounded bg-background/50">
                      Score: {sentiment?.score ?? 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mt-2">{sentiment?.rationale || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground italic">No competitive insights available</p>
      )}
    </div>
  );
}
