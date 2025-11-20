/**
 * Inngest API Route
 *
 * Webhook endpoint for Inngest to invoke background functions.
 * This route is called by Inngest when events are triggered.
 *
 * Story: 4.7 - Add Inngest Infrastructure
 */

import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import {
  scrapeAllPlans,
  runFullAnalysis,
  runCustomComparison
} from '@/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scrapeAllPlans,
    runFullAnalysis,
    runCustomComparison,
  ],
});
