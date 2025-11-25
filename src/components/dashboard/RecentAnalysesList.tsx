/**
 * Recent Analyses List Component
 *
 * Displays the most recent analyses with expandable "Show more" functionality.
 * Story: 5.3 - Redesign Custom Comparison Page
 */

'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface Analysis {
  id: string;
  comparisonType: 'full' | 'custom';
  brands: string[];
  createdAt: string;
}

interface RecentAnalysesListProps {
  analyses: Analysis[];
}

export function RecentAnalysesList({ analyses }: RecentAnalysesListProps) {
  const [showAll, setShowAll] = useState(false);

  if (analyses.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">No recent comparisons</p>
      </div>
    );
  }

  const visibleAnalyses = showAll ? analyses : analyses.slice(0, 3);
  const hasMore = analyses.length > 3;

  return (
    <div className="bg-card rounded-lg border">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-foreground">Recent Analyses</h2>
      </div>

      <div className="divide-y">
        {visibleAnalyses.map((analysis) => {
          const title = analysis.comparisonType === 'full'
            ? 'O2 vs All Competitors'
            : analysis.brands.join(' vs ');

          return (
            <div key={analysis.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/analysis/${analysis.id}`}
                    className="font-medium text-sm text-foreground hover:text-primary transition-colors flex-1"
                  >
                    {title}
                  </Link>
                  <Link
                    href={`/dashboard/analysis/${analysis.id}`}
                    className="text-xs text-primary hover:underline whitespace-nowrap"
                  >
                    View
                  </Link>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="p-3 border-t">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1"
          >
            {showAll ? (
              <>
                Show less
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show more ({analyses.length - 3})
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
