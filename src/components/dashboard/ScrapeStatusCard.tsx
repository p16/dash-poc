'use client';

import { useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ScrapeStatusCardProps {
  planCount: number;
  lastScrapedAt: Date | null;
}

export function ScrapeStatusCard({ planCount, lastScrapedAt }: ScrapeStatusCardProps) {
  const [isScraping, setIsScraping] = useState(false);
  const { toast } = useToast();

  const handleScrape = async () => {
    setIsScraping(true);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start scraping job');
      }

      const data = await response.json();
      const jobId = data.jobId || data.ids?.[0];

      toast({
        title: 'Scrape Started',
        description: `Job ID: ${jobId}. This may take several minutes.`,
      });

      // Show success toast after 3 seconds
      setTimeout(() => {
        setIsScraping(false);
        toast({
          title: 'Scrape in Progress',
          description: 'The scraping job is running in the background. Refresh the page in a few minutes to see updated data.',
        });
      }, 3000);
    } catch (error) {
      setIsScraping(false);
      toast({
        title: 'Scrape Failed',
        description: error instanceof Error ? error.message : 'Failed to start scraping job',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Plan Data</CardTitle>
          </div>
        </div>
        <CardDescription>
          {lastScrapedAt
            ? `Last updated ${formatDistanceToNow(new Date(lastScrapedAt), { addSuffix: true })}`
            : 'No data available'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold text-foreground">{planCount.toLocaleString()}</p>
            <p className="text-sm text-neutral-600">Total Plans</p>
          </div>
          <Button
            onClick={handleScrape}
            disabled={isScraping}
            className="w-full"
            size="lg"
          >
            {isScraping ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Scrape Data
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
