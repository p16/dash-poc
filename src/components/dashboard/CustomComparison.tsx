/**
 * Custom Brand Comparison Component
 *
 * Client component that allows users to select two brands and trigger
 * custom competitive analysis. Displays results using AnalysisResults component.
 *
 * Story: 4.4 - Custom Brand Comparison Tool
 */

'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { CustomComparisonResults } from '@/components/analysis/CustomComparisonResults';
import type { CustomComparisonAnalysis } from '@/types/analysis';

type Props = {
  brands: string[];
};

type ComparisonState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: CustomComparisonAnalysis; brands: string[]; cached: boolean; timestamp: Date }
  | { status: 'error'; message: string };

export function CustomComparison({ brands }: Props) {
  const [brandA, setBrandA] = useState('');
  const [brandB, setBrandB] = useState('');
  const [state, setState] = useState<ComparisonState>({ status: 'idle' });

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
      setState({
        status: 'success',
        data: result.analysis,
        brands: result.brands,
        cached: result.cached || false,
        timestamp: new Date(),
      });
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
              Analyzing... (may take up to 5 minutes)
            </>
          ) : (
            'Compare Brands'
          )}
        </button>
      </div>

      {/* Loading State */}
      {state.status === 'loading' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Analysis in progress</h3>
              <p className="text-sm text-blue-700 mt-1">
                Generating competitive analysis for {brandA} vs {brandB}. This may take up to 5
                minutes while we analyze the data and generate insights.
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
