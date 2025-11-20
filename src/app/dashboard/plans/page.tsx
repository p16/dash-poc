/**
 * Plan Data Table Page
 *
 * Displays all scraped plan data in a filterable, sortable table.
 * Server component that fetches latest plans and passes to client component.
 *
 * Story: 4.5 - Plan Data Table & Filtering
 */

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PlanTable } from '@/components/dashboard/PlanTable';
import { getLatestPlans } from '@/lib/dashboard/plans';
import { requireAuth } from '@/lib/auth/session';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="ml-3 text-gray-600">Loading plans...</span>
    </div>
  );
}

async function PlansContent() {
  const plans = await getLatestPlans();

  return <PlanTable plans={plans} />;
}

export default async function PlansPage() {
  // Ensure user is authenticated
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Plan Data</h1>
          <p className="mt-2 text-gray-600">
            Browse and filter all scraped mobile plan offerings
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <PlansContent />
        </Suspense>
      </main>
    </div>
  );
}
