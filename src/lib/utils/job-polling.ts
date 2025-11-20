/**
 * Job Polling Utility
 *
 * Polls job status with exponential backoff and progress tracking.
 * Used by frontend components to monitor long-running Inngest jobs.
 *
 * Story: 4.7 Phase 2 - Job Polling Utility
 */

export interface JobStatus {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress?: {
    percentage: number;
    currentStep?: string;
    completedSteps: number;
    totalSteps: number;
  };
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

export interface PollOptions {
  /**
   * Callback invoked on each progress update
   */
  onProgress?: (status: JobStatus) => void;

  /**
   * Callback invoked when job completes successfully
   */
  onComplete?: (result: any) => void;

  /**
   * Callback invoked when job fails
   */
  onError?: (error: string) => void;

  /**
   * Initial polling interval in milliseconds
   * @default 2000 (2 seconds)
   */
  initialInterval?: number;

  /**
   * Maximum polling interval in milliseconds
   * @default 10000 (10 seconds)
   */
  maxInterval?: number;

  /**
   * Maximum total polling time in milliseconds
   * @default 600000 (10 minutes)
   */
  maxDuration?: number;

  /**
   * Exponential backoff multiplier
   * @default 1.5
   */
  backoffMultiplier?: number;
}

/**
 * Poll job status until completion or timeout
 *
 * Uses exponential backoff:
 * - Starts at 2s interval
 * - Increases to max 10s interval
 * - Stops after 10 minutes max
 *
 * @param jobId - Inngest job ID to poll
 * @param options - Polling configuration and callbacks
 * @returns Promise that resolves when job completes or fails
 *
 * @example
 * ```typescript
 * pollJobStatus('job-123', {
 *   onProgress: (status) => {
 *     console.log(`Progress: ${status.progress?.percentage}%`);
 *   },
 *   onComplete: (result) => {
 *     console.log('Job completed!', result);
 *   },
 *   onError: (error) => {
 *     console.error('Job failed:', error);
 *   }
 * });
 * ```
 */
export async function pollJobStatus(
  jobId: string,
  options: PollOptions = {}
): Promise<JobStatus> {
  const {
    onProgress,
    onComplete,
    onError,
    initialInterval = 2000,
    maxInterval = 10000,
    maxDuration = 600000, // 10 minutes
    backoffMultiplier = 1.5,
  } = options;

  const startTime = Date.now();
  let currentInterval = initialInterval;
  let aborted = false;

  // Create abort controller for cleanup
  const abortController = new AbortController();

  // Cleanup function
  const cleanup = () => {
    aborted = true;
    abortController.abort();
  };

  // Allow external abortion
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

  try {
    while (!aborted) {
      // Check timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > maxDuration) {
        const timeoutError = 'Job polling timeout exceeded (10 minutes)';
        onError?.(timeoutError);
        throw new Error(timeoutError);
      }

      // Fetch job status
      let status: JobStatus;
      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Job not found');
          }
          throw new Error(`Failed to fetch job status: ${response.statusText}`);
        }

        status = await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Polling was aborted, exit gracefully
          break;
        }
        throw error;
      }

      // Invoke progress callback
      if (status.progress) {
        onProgress?.(status);
      }

      // Check if job is complete
      if (status.status === 'completed') {
        onComplete?.(status.result);
        return status;
      }

      // Check if job failed
      if (status.status === 'failed') {
        const errorMessage = status.error || 'Job failed with unknown error';
        onError?.(errorMessage);
        throw new Error(errorMessage);
      }

      // Wait before next poll with exponential backoff
      await sleep(currentInterval);
      currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
    }

    throw new Error('Polling aborted');

  } finally {
    // Cleanup
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', cleanup);
    }
  }
}

/**
 * Sleep utility for async/await
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format progress message for display
 *
 * @example
 * ```typescript
 * formatProgressMessage(status)
 * // Returns: "Scraping O2... 3/8 collectors complete (37%)"
 * ```
 */
export function formatProgressMessage(status: JobStatus): string {
  if (!status.progress) {
    return 'Processing...';
  }

  const { percentage, currentStep, completedSteps, totalSteps } = status.progress;

  if (currentStep) {
    return `${currentStep}... ${completedSteps}/${totalSteps} steps complete (${percentage}%)`;
  }

  return `${completedSteps}/${totalSteps} steps complete (${percentage}%)`;
}

/**
 * Hook for React components (optional)
 *
 * @example
 * ```typescript
 * const { status, progress, error } = useJobPolling(jobId);
 * ```
 */
export function useJobPolling(_jobId: string | null) {
  // This would be implemented with React hooks
  // For now, just export the function for manual use
  return {
    pollJobStatus,
    formatProgressMessage,
  };
}
