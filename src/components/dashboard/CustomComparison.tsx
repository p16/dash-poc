/**
 * Custom Brand Comparison Component
 *
 * Client component that allows users to select two brands and trigger
 * custom competitive analysis using Inngest background jobs.
 * Displays job status and links to monitor page for tracking.
 *
 * Story: 4.4 - Custom Brand Comparison Tool
 * Story: 4.7 - Inngest Integration
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { CustomComparisonResults } from '@/components/analysis/CustomComparisonResults';
import Link from 'next/link';
import type { CustomComparisonAnalysis } from '@/types/analysis';

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
  const [brandA, setBrandA] = useState('');
  const [brandB, setBrandB] = useState('');
  const [state, setState] = useState<ComparisonState>({ status: 'idle' });
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const response = await fetch('/api/analysis?limit=10');
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
    }
  };

  const isFormValid = brandA && brandB && brandA !== brandB;

  const loadSpecificAnalysis = async (analysisId: string, brands: string[]) => {
    setState({ status: 'loading' });

    try {
      // Fetch the specific analysis by ID
      const response = await fetch(`/api/analysis/${analysisId}`);

      if (!response.ok) {
        throw new Error('Failed to load analysis');
      }

      const data = await response.json();

      // Set the brands in the form
      if (brands.length >= 2) {
        setBrandA(brands[0]);
        setBrandB(brands[1]);
      }

      // Display the analysis
      setState({
        status: 'success',
        data: data.analysisResult,
        brands: brands,
        cached: true,
        timestamp: new Date(data.createdAt),
      });

      // Scroll to results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to load analysis',
      });
    }
  };

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
    <div className="space-y-6">
      {/* Comparison Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Custom Brand Comparison</h2>
        <p className="text-gray-600 mb-6">
          Select two brands to compare their offerings and get AI-powered competitive analysis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Brand A Dropdown */}
          <div>
            <label htmlFor="brandA" className="block text-sm font-medium text-gray-700 mb-2">
              Brand A
            </label>
            <select
              id="brandA"
              value={brandA}
              onChange={(e) => setBrandA(e.target.value)}
              disabled={state.status === 'loading'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select brand...</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand.charAt(0).toUpperCase() + brand.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* VS Icon */}
          <div className="hidden md:flex justify-center pb-2">
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>

          {/* Brand B Dropdown */}
          <div>
            <label htmlFor="brandB" className="block text-sm font-medium text-gray-700 mb-2">
              Brand B
            </label>
            <select
              id="brandB"
              value={brandB}
              onChange={(e) => setBrandB(e.target.value)}
              disabled={state.status === 'loading'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select brand...</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand.charAt(0).toUpperCase() + brand.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Validation Error */}
        {brandA && brandB && brandA === brandB && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
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
          className="mt-6 w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {state.status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {state.jobId ? 'Job started...' : 'Starting analysis...'}
            </>
          ) : (
            'Compare Brands'
          )}
        </button>

        {state.status === 'loading' && !state.jobId && (
          <p className="mt-2 text-xs text-gray-500">
            This may take 4-5 minutes...
          </p>
        )}
      </div>

      {/* Recent Analyses */}
      {analyses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">📊 Recent Analyses</h2>
            <Link
              href="/monitor"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all in Monitor
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {analyses.slice(0, 5).map((analysis) => (
              <div key={analysis.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {analysis.comparisonType === 'full' ? '📈 Full Analysis' : '⚖️ Custom Comparison'}
                      </span>
                      <button
                        onClick={() => loadSpecificAnalysis(analysis.id, analysis.brands)}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        View analysis
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {analysis.brands.join(' vs ')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {new Date(analysis.createdAt).toLocaleString()}
                  </span>
                </div>
                {analysis.analysisResult.overall_competitive_sentiments && (
                  <div className="mt-3 text-sm">
                    <p className="font-medium text-gray-700 mb-2">Top Insights:</p>
                    <ul className="space-y-1">
                      {analysis.analysisResult.overall_competitive_sentiments.slice(0, 2).map((insight, idx) => (
                        <li key={idx} className="bg-gray-50 p-2 rounded text-gray-700 text-xs">
                          <span className="font-medium">Score {insight.score}:</span> {insight.sentiment}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          {analyses.length > 5 && (
            <div className="mt-4 text-center">
              <Link
                href="/monitor"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
              >
                View all {analyses.length} analyses in Monitor
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Job Started Message */}
      {state.status === 'loading' && state.jobId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-900">Comparison job started!</h3>
              <p className="text-sm text-green-700 mt-1">
                Comparing <strong>{brandA}</strong> vs <strong>{brandB}</strong>
              </p>
              <p className="text-xs text-green-600 mt-2">
                Job ID: <code className="bg-green-100 px-1 rounded">{state.jobId}</code>
              </p>
              <p className="text-sm text-green-700 mt-3">
                This will take 4-5 minutes. You can:
              </p>
              <ul className="text-sm text-green-700 mt-2 space-y-1 ml-4 list-disc">
                <li>
                  Check the{' '}
                  <Link href="/monitor" className="underline font-medium hover:text-green-800">
                    monitor page <ExternalLink className="inline h-3 w-3" />
                  </Link>{' '}
                  to track progress
                </li>
                <li>Come back to this page in a few minutes and refresh</li>
                <li>Check the dashboard for the latest analysis</li>
              </ul>
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

      {/* Results Display */}
      {state.status === 'success' && (
        <div className="space-y-4">
          {state.cached && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✓ Showing cached results from a recent analysis
              </p>
            </div>
          )}
          <CustomComparisonResults
            data={state.data}
            timestamp={state.timestamp}
            brandA={state.brands[0] || 'Brand A'}
            brandB={state.brands[1] || 'Brand B'}
          />
        </div>
      )}
    </div>
  );
}
