/**
 * Custom Brand Comparison Page
 *
 * Allows users to select and compare two telco brands with AI-powered analysis.
 * Server component that fetches available brands and passes to client component.
 *
 * Story: 5.3 - Comparison Page Redesign
 */

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CustomComparison } from '@/components/dashboard/CustomComparison';
import { getAvailableBrands } from '@/lib/dashboard/available-brands';
import { requireAuth } from '@/lib/auth/session';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ComparisonPage() {
  // Ensure user is authenticated
  await requireAuth();

  // Fetch available brands for comparison
  const brands = await getAvailableBrands();

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
          <span className="text-foreground font-medium">Brand Comparison</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Brand Comparison</h1>
          <p className="mt-2 text-muted-foreground">
            Compare two mobile network brands side-by-side with AI-powered competitive analysis
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Analysis uses the most recent plans scraped in the last 180 days
          </p>
        </div>

        <CustomComparison brands={brands} />
      </main>
    </div>
  );
}
