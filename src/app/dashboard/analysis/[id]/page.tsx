/**
 * Analysis Detail Page
 *
 * Displays full analysis results with breadcrumbs and action buttons
 * Story: 5.3 - Dedicated Analysis Detail Page
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { requireAuth } from '@/lib/auth/session';
import { getPool } from '@/lib/db/connection';
import { AnalysisResults } from '@/components/analysis/AnalysisResults';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RunFullAnalysisButton } from '@/components/dashboard/RunFullAnalysisButton';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAnalysis(id: string) {
  const pool = getPool();

  try {
    const result = await pool.query(
      `SELECT id, comparison_type, brands, analysis_result, created_at
       FROM analyses
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching analysis:', error);
    throw error;
  }
}

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();

  const { id } = await params;
  const analysis = await getAnalysis(id);

  if (!analysis) {
    notFound();
  }

  const title = analysis.comparison_type === 'full'
    ? 'O2 vs All Competitors'
    : analysis.brands.length > 1
    ? `${analysis.brands[0]} vs ${analysis.brands.slice(1).join(', ')}`
    : analysis.brands[0] || 'Analysis';

  const formattedDate = new Date(analysis.created_at).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(analysis.created_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Check if analysis is cached (less than 24 hours old)
  const isCached = Date.now() - new Date(analysis.created_at).getTime() < 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container-custom py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/dashboard/comparison" className="hover:text-foreground">
            Brand Comparison
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">{formattedDate}</span>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          {analysis.comparison_type === 'full' ? (
            <RunFullAnalysisButton />
          ) : (
            <Link
              href="/dashboard/comparison"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
            >
              Run New Comparison
            </Link>
          )}
        </div>

        {/* Analysis Title */}
        <div className="bg-card rounded-lg shadow p-6 mb-6 border">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {analysis.comparison_type === 'full' ? 'Full Analysis' : 'Custom Comparison'} •{' '}
                {formattedDate} at {formattedTime} ({formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on the most recent plans scraped in the last 180 days
              </p>
            </div>
            {isCached && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                Cached Result
              </span>
            )}
          </div>
        </div>

        {/* Analysis Content */}
        <div className="prose max-w-none">
          <AnalysisResults
            data={analysis.analysis_result}
            timestamp={new Date(analysis.created_at)}
            brands={analysis.brands}
          />
        </div>

        {/* Print-friendly hint */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          💡 Tip: Use your browser's print function (Cmd/Ctrl + P) to save or print this analysis
        </div>
      </main>
    </div>
  );
}
