/**
 * Analysis Detail Page
 *
 * Displays full analysis results with breadcrumbs and action buttons
 * Story: 5.3 - Dedicated Analysis Detail Page
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/session';
import { getPool } from '@/lib/db/connection';
import { AnalysisResults } from '@/components/analysis/AnalysisResults';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <span>›</span>
          <span className="text-foreground">Analysis</span>
          <span>›</span>
          <span className="text-foreground">{formattedDate}</span>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                </span>
                {isCached && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    Cached Result
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Analysis Content */}
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <AnalysisResults
            data={analysis.analysis_result}
            timestamp={new Date(analysis.created_at)}
            brands={analysis.brands}
          />
        </div>

        {/* Print-friendly hint */}
        <div className="mt-6 text-center text-sm text-muted-foreground print:hidden">
          💡 Tip: Use your browser's print function (Cmd/Ctrl + P) to save or print this analysis
        </div>
      </main>
    </div>
  );
}
