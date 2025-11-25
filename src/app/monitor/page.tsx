'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, RefreshCw, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface Run {
  id: string;
  status: string;
  started_at: string;
  ended_at?: string;
  function_id: string;
}

interface EventRuns {
  eventId: string;
  eventName: string;
  runs: Run[];
  metadata?: Record<string, any>;
  loadingStatus?: 'loading' | 'success' | 'error' | 'timeout';
}

export default function JobMonitorPage() {
  const [eventRuns, setEventRuns] = useState<EventRuns[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEventsFromDatabase();
  }, []);

  const loadEventsFromDatabase = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();

        // First, add all events with empty runs immediately so they show up
        setEventRuns(
          data.events.map((event: any) => ({
            eventId: event.event_id,
            eventName: event.event_name,
            runs: [],
            metadata: event.metadata,
            loadingStatus: 'loading' as const,
          }))
        );

        // Then load runs asynchronously in the background
        data.events.forEach((event: any) => {
          addEventRuns(event.event_id, event.event_name, event.metadata);
        });
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addEventRuns = async (eventId: string, eventName: string, metadata?: Record<string, any>) => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`/api/jobs/runs?eventId=${eventId}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setEventRuns(prev => {
          const filtered = prev.filter(e => e.eventId !== eventId);
          return [...filtered, { eventId, eventName, runs: data.runs || [], metadata, loadingStatus: 'success' as const }];
        });
      } else {
        console.warn(`Failed to fetch runs for event ${eventId}:`, response.status);
        // Still add the event with empty runs so it shows up
        setEventRuns(prev => {
          const filtered = prev.filter(e => e.eventId !== eventId);
          return [...filtered, { eventId, eventName, runs: [], metadata, loadingStatus: 'error' as const }];
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`Timeout fetching runs for event ${eventId}`);
        // Mark as timeout
        setEventRuns(prev => {
          const filtered = prev.filter(e => e.eventId !== eventId);
          return [...filtered, { eventId, eventName, runs: [], metadata, loadingStatus: 'timeout' as const }];
        });
      } else {
        console.error('Error fetching runs:', error);
        // Add event with empty runs even on error
        setEventRuns(prev => {
          const filtered = prev.filter(e => e.eventId !== eventId);
          return [...filtered, { eventId, eventName, runs: [], metadata, loadingStatus: 'error' as const }];
        });
      }
    }
  };

  const refreshAllRuns = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all(
        eventRuns.map(event =>
          addEventRuns(event.eventId, event.eventName, event.metadata)
        )
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getEventTypeLabel = (eventName: string, metadata?: Record<string, any>) => {
    switch (eventName) {
      case 'scrape/trigger':
        return '🕷️ Data Scrape';
      case 'analysis/full':
        return '📈 Full Analysis';
      case 'analysis/custom':
        if (metadata?.brandA && metadata?.brandB) {
          return `⚖️ ${metadata.brandA} vs ${metadata.brandB}`;
        }
        return '⚖️ Custom Comparison';
      default:
        return eventName;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/dashboard" className="hover:text-gray-900">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Job Monitor</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Job Monitor</h1>
          <p className="mt-2 text-gray-600">
            Track the status of all background jobs including scrapes and analyses
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <Button
            onClick={refreshAllRuns}
            disabled={isRefreshing || isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
          </Button>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">Loading jobs...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && eventRuns.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Jobs will appear here after you run scrapes or analyses
                </p>
                <Link href="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && eventRuns.length > 0 && (
          <div className="space-y-4">
            {eventRuns.map((event) => (
              <Card key={event.eventId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {getEventTypeLabel(event.eventName, event.metadata)}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Event ID: {event.eventId}
                      </CardDescription>
                    </div>
                    {event.runs.length > 0 && (
                      <Badge variant={getStatusBadgeVariant(event.runs[0].status)} className="ml-4">
                        {getStatusIcon(event.runs[0].status)}
                        <span className="ml-1.5">{event.runs[0].status}</span>
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {event.runs.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm">
                      {event.loadingStatus === 'loading' && (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                          <span className="text-gray-500 italic">Loading status...</span>
                        </>
                      )}
                      {event.loadingStatus === 'timeout' && (
                        <>
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span className="text-orange-600">Request timed out - status unavailable</span>
                        </>
                      )}
                      {event.loadingStatus === 'error' && (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Failed to load status</span>
                        </>
                      )}
                      {event.loadingStatus === 'success' && (
                        <>
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-500 italic">No run information available</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {event.runs.map((run) => (
                        <div
                          key={run.id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-mono text-xs text-gray-700 mb-1">
                                {run.function_id}
                              </div>
                              <div className="text-xs text-gray-500">
                                Run ID: {run.id}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(run.status)}
                              <span className="text-sm font-medium text-gray-900">
                                {run.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600 mt-3">
                            {run.started_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Started {(() => {
                                    try {
                                      return formatDistanceToNow(new Date(run.started_at), { addSuffix: true });
                                    } catch {
                                      return run.started_at;
                                    }
                                  })()}
                                </span>
                              </div>
                            )}
                            {run.ended_at && (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>
                                  Ended {(() => {
                                    try {
                                      return formatDistanceToNow(new Date(run.ended_at), { addSuffix: true });
                                    } catch {
                                      return run.ended_at;
                                    }
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
