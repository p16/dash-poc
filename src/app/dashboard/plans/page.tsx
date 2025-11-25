/**
 * Plan Data Table Page
 *
 * Displays all scraped plan data in a filterable, sortable table.
 * Server component that fetches latest plans and passes to client components.
 *
 * Story: 5.4 - Plan Data Table Redesign
 */

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PlansContent } from '@/components/dashboard/PlansContent';
import { requireAuth } from '@/lib/auth/session';
import { getLatestPlans } from '@/lib/dashboard/plans';
import { Suspense } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter bar skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-10 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function PlansPage() {
  // Ensure user is authenticated
  await requireAuth();

  // Fetch latest plans
  const plans = await getLatestPlans();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Plan Data</span>
        </nav>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Plan Data</h1>
          <p className="mt-2 text-gray-600">
            Browse and filter all scraped mobile plan offerings
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <PlansContent initialPlans={plans} />
        </Suspense>
      </main>
    </div>
  );
}
