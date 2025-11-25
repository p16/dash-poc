/**
 * Analysis Not Found Page
 *
 * Displayed when an analysis ID doesn't exist in the database
 */

import Link from 'next/link';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';

export default function AnalysisNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container-custom py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Analysis Not Found
          </h1>

          <p className="text-muted-foreground mb-8">
            The analysis you're looking for doesn't exist or may have been deleted.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/comparison">
                <Home className="h-4 w-4 mr-2" />
                Run New Analysis
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
