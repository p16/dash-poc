/**
 * Job Status API Endpoint
 *
 * Query Inngest job status for polling from the frontend.
 * Returns progress information, completion status, and results.
 *
 * Story: 4.7 Phase 2 - Job Status API
 *
 * @endpoint GET /api/jobs/[jobId]
 * @returns Job status with progress and result data
 */

import { NextRequest, NextResponse } from 'next/server';

type RouteParams = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }

  try {
    // For local development with Inngest Dev Server
    // Query the dev server's status endpoint
    const isDev = process.env.NODE_ENV === 'development';
    const inngestApiUrl = isDev
      ? 'http://127.0.0.1:8288'
      : (process.env.INNGEST_API_URL || 'https://api.inngest.com');

    // In dev mode, use the dev server's API
    // In production, use Inngest Cloud API with signing key
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (!isDev) {
      const signingKey = process.env.INNGEST_SIGNING_KEY;
      if (!signingKey) {
        throw new Error('INNGEST_SIGNING_KEY not configured');
      }
      headers['Authorization'] = `Bearer ${signingKey}`;
    }

    // Fetch job status from Inngest API
    const apiPath = isDev ? `/api/v1/runs/${jobId}` : `/v1/runs/${jobId}`;
    const response = await fetch(`${inngestApiUrl}${apiPath}`, {
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      // For dev mode, return a mock response if API not available
      if (isDev) {
        return NextResponse.json({
          jobId,
          status: 'running',
          progress: {
            percentage: 50,
            currentStep: 'Processing...',
            completedSteps: 4,
            totalSteps: 8,
          },
          startedAt: new Date().toISOString(),
          note: 'Dev mode: Check http://localhost:8288 for actual status',
        });
      }

      throw new Error(`Inngest API error: ${response.statusText}`);
    }

    const jobData = await response.json();

    // Transform Inngest response to our format
    const status = mapInngestStatus(jobData.status);
    const progress = calculateProgress(jobData);

    return NextResponse.json({
      jobId,
      status,
      progress,
      startedAt: jobData.started_at,
      completedAt: jobData.ended_at,
      result: jobData.output,
      error: jobData.error,
    });

  } catch (error) {
    console.error('Job status error:', error);

    // In dev mode, return helpful error with dashboard link
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        jobId,
        error: 'Could not fetch job status from Inngest dev server',
        details: error instanceof Error ? error.message : String(error),
        dashboard: 'http://localhost:8288',
        note: 'Check the Inngest dev dashboard for job status',
      }, { status: 500 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch job status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Map Inngest status to our status format
 */
function mapInngestStatus(inngestStatus: string): 'queued' | 'running' | 'completed' | 'failed' {
  switch (inngestStatus) {
    case 'QUEUED':
      return 'queued';
    case 'RUNNING':
      return 'running';
    case 'COMPLETED':
      return 'completed';
    case 'FAILED':
    case 'CANCELLED':
      return 'failed';
    default:
      return 'queued';
  }
}

/**
 * Calculate progress based on completed steps
 *
 * For scraping job: 8 steps total (one per collector)
 * Progress = (completed steps / total steps) * 100
 */
function calculateProgress(jobData: any): {
  percentage: number;
  currentStep?: string;
  completedSteps: number;
  totalSteps: number;
} {
  const steps = jobData.steps || [];
  const completedSteps = steps.filter((s: any) => s.status === 'COMPLETED').length;
  const totalSteps = steps.length || 8; // Default to 8 for scraping job
  const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Find current running step
  const runningStep = steps.find((s: any) => s.status === 'RUNNING');
  const currentStep = runningStep ? runningStep.name : undefined;

  return {
    percentage,
    currentStep,
    completedSteps,
    totalSteps,
  };
}
