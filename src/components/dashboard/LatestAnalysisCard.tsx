import Link from 'next/link';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { RunFullAnalysisButton } from './RunFullAnalysisButton';

interface LatestAnalysisCardProps {
  analysis: {
    id: string;
    brands: string[];
    created_at: string;
    is_cached?: boolean;
    analysis_result: any;
    comparison_type?: string;
  } | null;
}

export function LatestAnalysisCard({ analysis }: LatestAnalysisCardProps) {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Full Analysis</CardTitle>
          <CardDescription>No full comparison analyses have been run yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Sparkles className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-600 mb-4">
              Run a full analysis to see O2 vs all competitors here
            </p>
            <p className="text-xs text-neutral-500 mb-4">
              💡 For brand-specific comparisons, use the{' '}
              <Link href="/dashboard/comparison" className="text-primary underline hover:text-primary/80">
                Compare Brands
              </Link>
              {' '}page
            </p>
            {/* Inline full analysis trigger */}
            <RunFullAnalysisButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract title - for full comparison, show "O2 vs All Competitors"
  const title = analysis.comparison_type === 'full'
    ? 'O2 vs All Competitors'
    : analysis.brands.length > 1
    ? `${analysis.brands[0]} vs ${analysis.brands.slice(1).join(', ')}`
    : analysis.brands[0] || 'Analysis';

  // Extract top 3 insights from analysis result
  const insights: string[] = [];
  if (typeof analysis.analysis_result === 'object' && analysis.analysis_result !== null) {
    // Try to extract insights from different possible structures
    const result = analysis.analysis_result as any;

    if (result.key_insights) {
      insights.push(...(Array.isArray(result.key_insights) ? result.key_insights.slice(0, 3) : []));
    } else if (result.insights) {
      insights.push(...(Array.isArray(result.insights) ? result.insights.slice(0, 3) : []));
    } else if (result.overall_competitive_sentiments && Array.isArray(result.overall_competitive_sentiments)) {
      // Extract the sentiment text from the objects
      insights.push(...result.overall_competitive_sentiments.slice(0, 3).map((item: any) => {
        if (typeof item === 'string') return item;
        // For objects, use the sentiment field or rationale field
        return item.sentiment || item.rationale || JSON.stringify(item);
      }));
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          {analysis.is_cached && (
            <Badge variant="secondary">Cached Result</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {insights.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-neutral-700">Key Insights Preview:</p>
            <ul className="space-y-1">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm text-neutral-600 line-clamp-1">
                  • {typeof insight === 'string' ? insight : JSON.stringify(insight)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button asChild className="w-full">
          <Link href={`/dashboard/analysis/${analysis.id}`}>
            View Full Analysis
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
