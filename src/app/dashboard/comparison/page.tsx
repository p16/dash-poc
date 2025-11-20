/**
 * Custom Brand Comparison Page
 *
 * Allows users to select and compare two telco brands with AI-powered analysis.
 * Server component that fetches available brands and passes to client component.
 *
 * Story: 4.4 - Custom Brand Comparison Tool
 */

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CustomComparison } from '@/components/dashboard/CustomComparison';
import { getAvailableBrands } from '@/lib/dashboard/available-brands';
import { requireAuth } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ComparisonPage() {
  // Ensure user is authenticated
  await requireAuth();

  // Fetch available brands for comparison
  const brands = await getAvailableBrands();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Brand Comparison</h1>
          <p className="mt-2 text-gray-600">
            Compare two mobile network brands side-by-side with AI-powered competitive analysis
          </p>
        </div>

        <CustomComparison brands={brands} />
      </main>
    </div>
  );
}
