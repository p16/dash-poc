/**
 * Dashboard Home Page
 *
 * Protected route - requires authentication to access.
 * Story: 4.1 - Password Authentication (logout functionality)
 * Story: 4.2 - Dashboard Home Screen
 * Story: 4.6 - Trigger Scrape from Dashboard (Button)
 * Story: 4.7 - Inngest Integration
 */

import { requireAuth } from '@/lib/auth/session';
import { getScrapeStatus } from '@/lib/dashboard/scrape-status';
import { getLatestFullAnalysis } from '@/lib/dashboard/latest-analysis';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ScrapeStatus } from '@/components/dashboard/ScrapeStatus';
import { ScrapeButton } from '@/components/dashboard/ScrapeButton';
import { AnalysisDisplay } from '@/components/dashboard/AnalysisDisplay';
import { QuickActions } from '@/components/dashboard/QuickActions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  // Ensure user is authenticated
  await requireAuth();

  // Fetch data in parallel
  let scrapeStatus = null;
  let latestAnalysis = null;
  let error = null;

  try {
    [scrapeStatus, latestAnalysis] = await Promise.all([
      getScrapeStatus(),
      getLatestFullAnalysis(),
    ]);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    error = err instanceof Error ? err.message : 'Failed to load dashboard data';
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Scrape Status Section */}
            {scrapeStatus && <ScrapeStatus status={scrapeStatus} />}

            {/* Scrape Button */}
            <ScrapeButton />

            {/* Quick Actions */}
            <QuickActions />

            {/* Latest Analysis Section */}
            <AnalysisDisplay analysis={latestAnalysis} />
          </div>
        )}
      </main>
    </div>
  );
}
