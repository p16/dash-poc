/**
 * Inngest Job Monitor Page
 *
 * Visual interface to trigger and monitor Inngest jobs.
 * Shows real-time job status, database writes, and flow visualization.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useInngestJob } from '@/hooks/useInngestJob';

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
}

export default function InngestMonitorPage() {
  const [customBrandA, setCustomBrandA] = useState('O2');
  const [customBrandB, setCustomBrandB] = useState('Vodafone');
  const [eventRuns, setEventRuns] = useState<EventRuns[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { trigger, loading: jobLoading } = useInngestJob();

  // Load events from database on mount
  useEffect(() => {
    loadEventsFromDatabase();
  }, []);

  const loadEventsFromDatabase = async () => {
    try {
      console.warn('Loading events from database...');
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        console.warn('Events from database:', data.events);
        // Load runs for each stored event
        for (const event of data.events) {
          console.warn('Fetching runs for event:', event.event_id, event.event_name);
          await addEventRuns(event.event_id, event.event_name);
        }
      } else {
        console.error('Failed to load events:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Determine if we're in development (localhost) or production (Vercel)
  const isDevelopment = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Inngest dashboard URL for reference (dev vs prod)
  const _inngestDashboardUrl = isDevelopment
    ? 'http://localhost:8288'
    : 'https://app.inngest.com';

  const addEventRuns = async (eventId: string, eventName: string) => {
    try {
      console.warn('Fetching runs for:', eventId);
      const response = await fetch(`/api/jobs/runs?eventId=${eventId}`);
      console.warn('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.warn('Runs data:', data);
        setEventRuns(prev => {
          // Remove existing entry for this eventId if any
          const filtered = prev.filter(e => e.eventId !== eventId);
          const newState = [...filtered, { eventId, eventName, runs: data.runs || [] }];
          console.warn('Updated eventRuns state:', newState);
          return newState;
        });
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch runs:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching runs:', error);
    }
  };

  const refreshAllRuns = async () => {
    setIsRefreshing(true);
    try {
      // Refresh runs for all tracked events
      await Promise.all(
        eventRuns.map(event =>
          addEventRuns(event.eventId, event.eventName)
        )
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  async function triggerScrape() {
    const eventId = await trigger({
      apiEndpoint: '/api/test-scrape',
      eventName: 'scrape/trigger',
    });

    if (eventId) {
      await addEventRuns(eventId, 'scrape/trigger');
      alert(`✅ Scrape job started!\nEvent ID: ${eventId}`);
    }
  }

  async function triggerFullAnalysis() {
    const eventId = await trigger({
      apiEndpoint: '/api/analysis/full',
      eventName: 'analysis/full',
    });

    if (eventId) {
      await addEventRuns(eventId, 'analysis/full');
      alert(`✅ Full analysis job started!\nEvent ID: ${eventId}`);
    }
  }

  async function triggerCustomComparison() {
    const eventId = await trigger({
      apiEndpoint: '/api/analysis/custom',
      eventName: 'analysis/custom',
      body: { brandA: customBrandA, brandB: customBrandB },
      metadata: { brandA: customBrandA, brandB: customBrandB },
    });

    if (eventId) {
      await addEventRuns(eventId, 'analysis/custom');
      alert(`✅ Custom comparison job started!\nEvent ID: ${eventId}\nComparing: ${customBrandA} vs ${customBrandB}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/dashboard"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  🔍 Inngest Job Monitor
                </h1>
              </div>
              <p className="text-gray-600">
                Trigger jobs and see how data flows from browser → Inngest → Database
              </p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Main Dashboard
            </Link>
          </div>
        </div>

        {/* Job Triggers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Scrape */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">🕷️ Scrape Plans</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scrapes all 8 providers and saves to database
            </p>
            <button
              onClick={triggerScrape}
              disabled={jobLoading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {jobLoading ? 'Starting...' : 'Trigger Scrape'}
            </button>
            <div className="mt-3 text-xs text-gray-500">
              ⏱️ ~10 minutes<br />
              💾 Writes to: <code>plans</code> table
            </div>
          </div>

          {/* Full Analysis */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">📈 Full Analysis</h3>
            <p className="text-sm text-gray-600 mb-4">
              Analyzes all brands using Gemini AI
            </p>
            <button
              onClick={triggerFullAnalysis}
              disabled={jobLoading}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {jobLoading ? 'Starting...' : 'Trigger Analysis'}
            </button>
            <div className="mt-3 text-xs text-gray-500">
              ⏱️ ~4-5 minutes<br />
              📖 Reads: <code>plans</code> table<br />
              💾 Writes: <code>analyses</code> table
            </div>
          </div>

          {/* Custom Comparison */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2">⚖️ Custom Comparison</h3>
            <div className="space-y-2 mb-4">
              <select
                value={customBrandA}
                onChange={(e) => setCustomBrandA(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="O2">O2</option>
                <option value="Vodafone">Vodafone</option>
                <option value="Sky">Sky</option>
                <option value="Tesco">Tesco</option>
                <option value="Three">Three</option>
                <option value="Giffgaff">Giffgaff</option>
                <option value="Smarty">Smarty</option>
              </select>
              <select
                value={customBrandB}
                onChange={(e) => setCustomBrandB(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="Vodafone">Vodafone</option>
                <option value="O2">O2</option>
                <option value="Sky">Sky</option>
                <option value="Tesco">Tesco</option>
                <option value="Three">Three</option>
                <option value="Giffgaff">Giffgaff</option>
                <option value="Smarty">Smarty</option>
              </select>
            </div>
            <button
              onClick={triggerCustomComparison}
              disabled={jobLoading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {jobLoading ? 'Starting...' : 'Compare Brands'}
            </button>
            <div className="mt-3 text-xs text-gray-500">
              ⏱️ ~4-5 minutes<br />
              📖 Reads: <code>plans</code> table<br />
              💾 Writes: <code>analyses</code> table
            </div>
          </div>
        </div>

        {/* Event Runs List */}
        {eventRuns.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">📋 Tracked Runs</h2>
              <button
                onClick={refreshAllRuns}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="space-y-4">
              {eventRuns.map((event, idx) => (
                <div key={idx} className="border border-gray-200 rounded-md p-4">
                  <div className="mb-3">
                    <span className="font-semibold text-gray-900">
                      {event.eventName === 'scrape/trigger' && '🕷️ Scrape Event'}
                      {event.eventName === 'analysis/full' && '📈 Full Analysis Event'}
                      {event.eventName === 'analysis/custom' && '⚖️ Custom Comparison Event'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Event ID: {event.eventId}</p>
                  </div>

                  {event.runs.length === 0 ? (
                    isDevelopment ? (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          ℹ️ Development Mode
                        </p>
                        <p className="text-xs text-blue-700">
                          Run status tracking requires INNGEST_SIGNING_KEY for production.
                          <br />
                          Check job status at:{' '}
                          <a
                            href="http://localhost:8288/runs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-900"
                          >
                            http://localhost:8288/runs
                          </a>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No runs yet - check back in a moment</p>
                    )
                  ) : (
                    <div className="space-y-2">
                      {event.runs.map((run, runIdx) => (
                        <div key={runIdx} className="bg-gray-50 rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-mono text-gray-700">{run.function_id}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              run.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              run.status === 'Running' ? 'bg-blue-100 text-blue-800' :
                              run.status === 'Failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {run.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Run ID: {run.id}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Started: {new Date(run.started_at).toLocaleString()}
                            {run.ended_at && ` • Ended: ${new Date(run.ended_at).toLocaleString()}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
