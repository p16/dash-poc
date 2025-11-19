import { query } from '@/lib/db/connection';

export type ScrapeStatus = {
  timestamp: Date | null;
  hoursAgo: number | null;
  status: 'fresh' | 'stale' | 'very-stale' | 'no-data';
  statusColor: 'green' | 'yellow' | 'red' | 'gray';
};

/**
 * Get the latest scrape timestamp and calculate data freshness
 * Status indicators:
 * - Green (fresh): data <24 hours old
 * - Yellow (stale): data 24-48 hours old
 * - Red (very-stale): data >48 hours old
 * - Gray (no-data): no scrapes found
 */
export async function getScrapeStatus(): Promise<ScrapeStatus> {
  try {
    const result = await query(`
      SELECT MAX(scrape_timestamp) as latest_scrape
      FROM plans
    `);

    const latestScrape = result.rows[0]?.latest_scrape;

    if (!latestScrape) {
      return {
        timestamp: null,
        hoursAgo: null,
        status: 'no-data',
        statusColor: 'gray',
      };
    }

    const timestamp = new Date(latestScrape);
    const now = new Date();
    const hoursAgo = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));

    let status: ScrapeStatus['status'];
    let statusColor: ScrapeStatus['statusColor'];

    if (hoursAgo < 24) {
      status = 'fresh';
      statusColor = 'green';
    } else if (hoursAgo < 48) {
      status = 'stale';
      statusColor = 'yellow';
    } else {
      status = 'very-stale';
      statusColor = 'red';
    }

    return {
      timestamp,
      hoursAgo,
      status,
      statusColor,
    };
  } catch (error) {
    console.error('Error fetching scrape status:', error);
    throw new Error('Failed to fetch scrape status');
  }
}
