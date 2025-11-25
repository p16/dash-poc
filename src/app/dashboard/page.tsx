/**
 * Dashboard Home Page - Redesigned with shadcn/ui
 *
 * Protected route - requires authentication to access.
 * Story: 5.2 - Redesign Dashboard Home Page
 */

import { requireAuth } from '@/lib/auth/session';
import { getPool } from '@/lib/db/connection';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DataFreshnessBanner } from '@/components/dashboard/DataFreshnessBanner';
import { ScrapeStatusCard } from '@/components/dashboard/ScrapeStatusCard';
import { LatestAnalysisCard } from '@/components/dashboard/LatestAnalysisCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { BarChart3, Table2 } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDashboardData() {
  const pool = getPool();

  try {
    // Get the latest scrape_id
    const scrapeIdResult = await pool.query(
      'SELECT scrape_id, MAX(scrape_timestamp) as last_scrape FROM plans WHERE scrape_id IS NOT NULL GROUP BY scrape_id ORDER BY last_scrape DESC LIMIT 1'
    );

    const latestScrapeId = scrapeIdResult.rows[0]?.scrape_id;
    const lastScrapedAt = scrapeIdResult.rows[0]?.last_scrape;

    // Plan count from the latest scrape_id
    let planCount = 0;
    if (latestScrapeId) {
      const planResult = await pool.query(
        'SELECT COUNT(*) as count FROM plans WHERE scrape_id = $1',
        [latestScrapeId]
      );
      planCount = parseInt(planResult.rows[0].count);
    } else {
      // Fallback: if no scrape_id, count all plans
      const planResult = await pool.query('SELECT COUNT(*) as count FROM plans');
      planCount = parseInt(planResult.rows[0].count);
    }

    // Latest full comparison analysis only
    const analysisResult = await pool.query(
      "SELECT id, brands, created_at, analysis_result, comparison_type FROM analyses WHERE comparison_type = 'full' ORDER BY created_at DESC LIMIT 1"
    );
    const latestAnalysis = analysisResult.rows[0] || null;

    return { planCount, lastScrapedAt, latestAnalysis };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  await requireAuth();
  const { planCount, lastScrapedAt, latestAnalysis } = await getDashboardData();

  return (
    <>
      {/* Data Freshness Banner */}
      <DataFreshnessBanner lastScrapedAt={lastScrapedAt} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scrape Status Card */}
        <ScrapeStatusCard planCount={planCount} lastScrapedAt={lastScrapedAt} />

        {/* Latest Analysis Card */}
        <div className="lg:col-span-2">
          <LatestAnalysisCard analysis={latestAnalysis} />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickActionCard title="Compare Brands" icon={BarChart3} href="/dashboard/comparison" />
          <QuickActionCard title="Browse Plans" icon={Table2} href="/dashboard/plans" />
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container-custom py-8">
        <div className="space-y-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
