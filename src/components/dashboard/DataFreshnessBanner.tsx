import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DataFreshnessBannerProps {
  lastScrapedAt: Date | null;
}

export function DataFreshnessBanner({ lastScrapedAt }: DataFreshnessBannerProps) {
  if (!lastScrapedAt) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No data available. Run a scrape to fetch competitive pricing data.
        </AlertDescription>
      </Alert>
    );
  }

  const now = new Date();
  const scrapedDate = new Date(lastScrapedAt);
  const hoursSinceScrape = (now.getTime() - scrapedDate.getTime()) / (1000 * 60 * 60);
  const isStale = hoursSinceScrape > 24;

  const timeAgo = formatDistanceToNow(scrapedDate, { addSuffix: true });

  if (isStale) {
    return (
      <Alert className="border-warning bg-warning/10">
        <Clock className="h-4 w-4 text-warning" />
        <AlertDescription className="text-warning-foreground">
          Data may be stale. Last scraped {timeAgo}. Consider running a fresh scrape.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-success/50 bg-success/10">
      <CheckCircle className="h-4 w-4 text-success" />
      <AlertDescription className="text-foreground">
        Data is fresh. Last scraped {timeAgo}.
      </AlertDescription>
    </Alert>
  );
}
