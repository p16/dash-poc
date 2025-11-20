/**
 * Hook for triggering Inngest jobs and tracking event IDs
 *
 * Centralizes the logic for:
 * - Triggering Inngest jobs via API
 * - Saving event IDs to database for tracking
 * - Handling loading states and errors
 */

import { useState } from 'react';

interface TriggerJobOptions {
  apiEndpoint: string;
  eventName: string;
  body?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface UseInngestJobReturn {
  trigger: (options: TriggerJobOptions) => Promise<string | null>;
  loading: boolean;
  error: string | null;
  jobId: string | null;
}

export function useInngestJob(): UseInngestJobReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const trigger = async ({
    apiEndpoint,
    eventName,
    body,
    metadata,
  }: TriggerJobOptions): Promise<string | null> => {
    setLoading(true);
    setError(null);
    setJobId(null);

    try {
      // Trigger the Inngest job
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const eventId = data.jobId || data.ids?.[0];

      if (!eventId) {
        throw new Error('No event ID returned from API');
      }

      setJobId(eventId);

      // Save event ID to database for tracking
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            eventName,
            metadata,
          }),
        });
      } catch (saveError) {
        console.error('Failed to save event to database:', saveError);
        // Don't fail the whole operation if event saving fails
      }

      return eventId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger job';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    trigger,
    loading,
    error,
    jobId,
  };
}
