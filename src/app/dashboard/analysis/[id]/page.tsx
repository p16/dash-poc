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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/dashboard" className="hover:text-gray-900">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/dashboard/comparison" className="hover:text-gray-900">
            Brand Comparison
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{formattedDate}</span>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Link
            href="/dashboard/comparison"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Run New Comparison
          </Link>
        </div>

        {/* Analysis Title */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
              <p className="text-sm text-gray-600">
                {analysis.comparison_type === 'full' ? 'Full Analysis' : 'Custom Comparison'} •{' '}
                {formattedDate} at {formattedTime} ({formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })})
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Based on the most recent plans scraped in the last 180 days
              </p>
            </div>
            {isCached && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
        <div className="mt-6 text-center text-sm text-gray-500">
          💡 Tip: Use your browser's print function (Cmd/Ctrl + P) to save or print this analysis
        </div>
      </main>
    </div>
  );
}
