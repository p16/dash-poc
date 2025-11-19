import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { ScrapeStatus as ScrapeStatusType } from '@/lib/dashboard/scrape-status';

type Props = {
  status: ScrapeStatusType;
};

export function ScrapeStatus({ status }: Props) {
  const { timestamp, hoursAgo, status: dataStatus, statusColor } = status;

  // Status icon mapping
  const StatusIcon = {
    fresh: CheckCircle,
    stale: AlertCircle,
    'very-stale': XCircle,
    'no-data': Clock,
  }[dataStatus];

  // Color classes mapping
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
  }[statusColor];

  const iconColorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
  }[statusColor];

  // Status message
  let statusMessage: string;
  if (dataStatus === 'no-data') {
    statusMessage = 'No data available. Run a scrape to get started.';
  } else if (dataStatus === 'fresh') {
    statusMessage = `Data is fresh (scraped ${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago)`;
  } else if (dataStatus === 'stale') {
    statusMessage = `Data is getting stale (scraped ${hoursAgo} hours ago)`;
  } else {
    statusMessage = `Data is very stale (scraped ${hoursAgo} hours ago)`;
  }

  return (
    <div className={`border rounded-lg p-6 ${colorClasses}`}>
      <div className="flex items-start gap-4">
        <StatusIcon className={`h-6 w-6 mt-0.5 ${iconColorClasses}`} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-1">Data Freshness</h2>
          <p className="text-sm mb-2">{statusMessage}</p>
          {timestamp && (
            <p className="text-xs opacity-75">
              Last scraped: {timestamp.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
