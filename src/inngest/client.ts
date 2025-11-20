/**
 * Inngest Client Configuration
 *
 * Used to send events and create functions for background job processing.
 * Story: 4.7 - Add Inngest Infrastructure
 */

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'bmad-scraper-compare',
  name: 'BMAD Scraper Compare',
});
