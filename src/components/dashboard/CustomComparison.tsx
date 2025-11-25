/**
 * Custom Brand Comparison Component
 *
 * Client component with split-panel layout (30/70 on desktop).
 * Left panel: Brand selector and recent analyses (sticky).
 * Right panel: Comparison results (scrollable).
 *
 * Story: 5.3 - Comparison Page Redesign
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, ExternalLink, Clock } from 'lucide-react';
import { CustomComparisonResults } from '@/components/analysis/CustomComparisonResults';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { CustomComparisonAnalysis } from '@/types/analysis';
import { formatDistanceToNow } from 'date-fns';

interface Analysis {
  id: string;
  comparisonType: 'full' | 'custom';
  brands: string[];
  createdAt: string;
  analysisResult: {
    overall_competitive_sentiments?: Array<{
      score: number;
      sentiment: string;
      rationale: string;
    }>;
    [key: string]: any;
  };
}

type Props = {
  brands: string[];
};

type ComparisonState =
  | { status: 'idle' }
  | { status: 'loading'; jobId?: string }
  | { status: 'success'; data: CustomComparisonAnalysis; brands: string[]; cached: boolean; timestamp: Date }
  | { status: 'error'; message: string };

export function CustomComparison({ brands }: Props) {
  const { toast } = useToast();
  const [brandA, setBrandA] = useState('');
  const [brandB, setBrandB] = useState('');
  const [state, setState] = useState<ComparisonState>({ status: 'idle' });
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [showAllAnalyses, setShowAllAnalyses] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const response = await fetch('/api/analysis?limit=10&comparisonType=custom');
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
    }
  };

  const isFormValid = brandA && brandB && brandA !== brandB;

  const handleCompare = async () => {
    if (!isFormValid) return;

    setState({ status: 'loading' });

    try {
      const response = await fetch('/api/analysis/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandA, brandB }),
      });

      if (!response.ok) {
        const error = await response.json();
        setState({
          status: 'error',
          message: error.error || `Analysis failed with status ${response.status}`,
        });
        return;
      }

      const result = await response.json();

      // If it's a job ID response (202), show job started message
      if (result.jobId) {
        // Save event ID to database for tracking
        try {
          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: result.jobId,
              eventName: 'analysis/custom',
              metadata: { brandA, brandB },
            }),
          });
        } catch (saveError) {
          console.error('Failed to save event to database:', saveError);
        }

        setState({
          status: 'loading',
          jobId: result.jobId,
        });

        // Show toast notification
        toast({
          title: 'Comparison job started!',
          description: `Comparing ${brandA} vs ${brandB}. This will take 4-5 minutes. Analyzes the most recent plans from the last 180 days.`,
        });

        return;
      }

      // Otherwise it's the actual analysis result (cached)
      setState({
        status: 'success',
        data: result.analysis,
        brands: result.brands,
        cached: result.cached || false,
        timestamp: new Date(),
      });

      // Reload analyses to show the new one
      await loadAnalyses();
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate analysis',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Brand Selector & Recent Analyses (30% on desktop, sticky) */}
      <div className="lg:col-span-1 lg:sticky lg:top-20 lg:self-start space-y-6">
        {/* Brand Selector Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Select Brands</h2>
          <p className="text-xs text-gray-500 mb-4">
            Compares the most recent plans from the last 180 days
          </p>

          {/* Brand A Dropdown */}
          <div className="mb-4">
            <label htmlFor="brandA" className="block text-sm font-medium text-gray-700 mb-2">
              Brand A
            </label>
            <Select value={brandA} onValueChange={setBrandA} disabled={state.status === 'loading'}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select brand..." />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand.charAt(0).toUpperCase() + brand.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visual Separator */}
          <div className="flex justify-center my-4">
            <span className="text-2xl text-gray-400">↕</span>
          </div>

          {/* Brand B Dropdown */}
          <div className="mb-6">
            <label htmlFor="brandB" className="block text-sm font-medium text-gray-700 mb-2">
              Brand B
            </label>
            <Select value={brandB} onValueChange={setBrandB} disabled={state.status === 'loading'}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select brand..." />
              </SelectTrigger>
              <SelectContent>
                {brands
                  .filter((brand) => brand !== brandA)
                  .map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand.charAt(0).toUpperCase() + brand.slice(1)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Validation Error */}
          {brandA && brandB && brandA === brandB && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Please select two different brands to compare.
              </p>
            </div>
          )}

          {/* Compare Button */}
          <button
            onClick={handleCompare}
            disabled={!isFormValid || state.status === 'loading'}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {state.status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Compare Brands'
            )}
          </button>

          {state.status === 'loading' && !state.jobId && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              This may take 4-5 minutes...
            </p>
          )}
        </div>

        {/* Recent Analyses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Analyses</h2>

          {analyses.length === 0 ? (
            <p className="text-sm text-gray-500">No recent comparisons</p>
          ) : (
            <>
              <div className="space-y-3">
                {analyses.slice(0, showAllAnalyses ? 10 : 3).map((analysis) => (
                  <div key={analysis.id} className="border-b border-gray-200 pb-3 last:border-0">
                    <Link
                      href={`/dashboard/analysis/${analysis.id}`}
                      className="group block hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                            {analysis.brands.join(' vs ')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 group-hover:underline ml-2">
                          View
                        </span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {analyses.length > 3 && (
                <button
                  onClick={() => setShowAllAnalyses(!showAllAnalyses)}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 hover:underline w-full text-center"
                >
                  {showAllAnalyses ? 'Show less' : `Show more (${analyses.length - 3})`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Results Display (70% on desktop, scrollable) */}
      <div className="lg:col-span-2">
        {/* Loading State */}
        {state.status === 'loading' && state.jobId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Processing comparison...</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Comparing <strong>{brandA}</strong> vs <strong>{brandB}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Job ID: <code className="bg-blue-100 px-1 rounded">{state.jobId}</code>
                </p>
                <p className="text-sm text-blue-700 mt-3">
                  Track progress on the{' '}
                  <Link href="/monitor" className="underline font-medium hover:text-blue-800">
                    monitor page <ExternalLink className="inline h-3 w-3" />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Analysis failed</h3>
                <p className="text-sm text-red-700 mt-1">{state.message}</p>
                <button
                  onClick={() => setState({ status: 'idle' })}
                  className="mt-3 text-sm text-red-700 underline hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {state.status === 'loading' && !state.jobId && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing data...</h3>
            <p className="text-sm text-gray-600">This may take 4-5 minutes</p>
          </div>
        )}

        {/* Results Display */}
        {state.status === 'success' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {state.brands[0]} vs {state.brands[1]}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDistanceToNow(state.timestamp, { addSuffix: true })}
                  </p>
                </div>
                {state.cached && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Cached Result
                  </span>
                )}
              </div>
            </div>
            <div className="p-6 prose max-w-none">
              <CustomComparisonResults
                data={state.data}
                timestamp={state.timestamp}
                brandA={state.brands[0] || 'Brand A'}
                brandB={state.brands[1] || 'Brand B'}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {state.status === 'idle' && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No comparison selected</h3>
            <p className="text-sm text-gray-600">
              Select two brands and click Compare to see insights
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
