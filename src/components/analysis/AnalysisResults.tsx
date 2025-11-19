'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Package,
  Target,
} from 'lucide-react';
import type { AnalysisData } from '@/types/analysis';

type Props = {
  data: AnalysisData;
  timestamp: Date;
  brands: string[];
};

export function AnalysisResults({ data, timestamp, brands }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['sentiments'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Helper to get color based on score (higher score = more important to address)
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-700 bg-red-50 border-red-200';
    if (score >= 40) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-green-700 bg-green-50 border-green-200';
  };

  // Helper for competitiveness score (higher is better)
  const getCompetitivenessColor = (score: number) => {
    if (score >= 70) return 'text-green-700 bg-green-50';
    if (score >= 40) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
        <div className="flex items-center gap-4">
          <span>
            <strong>Generated:</strong> {timestamp.toLocaleString()}
          </span>
          <span>
            <strong>Brands:</strong> {brands.join(', ')}
          </span>
          <span>
            <strong>Currency:</strong> {data.currency}
          </span>
        </div>
      </div>

      {/* Overall Competitive Sentiments */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('sentiments')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Competitive Insights & Recommendations
            </h2>
            <span className="text-sm text-slate-500">
              ({data.overall_competitive_sentiments.length} insights)
            </span>
          </div>
          {expandedSections.has('sentiments') ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {expandedSections.has('sentiments') && (
          <div className="p-4 pt-0 space-y-3">
            {data.overall_competitive_sentiments.map((sentiment, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 ${getScoreColor(sentiment.score)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{sentiment.sentiment}</h3>
                  <span className="text-sm font-medium px-2 py-1 rounded bg-white/50">
                    Score: {sentiment.score}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{sentiment.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* O2 Products Analysis */}
      {data.o2_products_analysis.map((product, idx) => {
        const sectionKey = `product-${idx}`;
        const isExpanded = expandedSections.has(sectionKey);

        return (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleSection(sectionKey)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {product.product_name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {product.data_tier} | {product.roaming_tier} | £
                    {product.product_breakdown.price_per_month_GBP}/mo
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="p-4 pt-0 space-y-4">
                {/* O2 Product Breakdown */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    O2 Product Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Data:</span>{' '}
                      {product.product_breakdown.data}
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Contract:</span>{' '}
                      {product.product_breakdown.contract}
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Roaming:</span>{' '}
                      {product.product_breakdown.roaming}
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Extras:</span>{' '}
                      {product.product_breakdown.extras || 'None'}
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-700 font-medium">
                        Competitiveness Score:
                      </span>{' '}
                      <span
                        className={`font-bold px-2 py-1 rounded ${getCompetitivenessColor(
                          product.product_breakdown.competitiveness_score
                        )}`}
                      >
                        {product.product_breakdown.competitiveness_score}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strategic Insights */}
                {product.o2_product_sentiments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">
                      Strategic Insights
                    </h3>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {product.o2_product_sentiments.map((sentiment, sidx) => (
                        <li key={sidx} className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{sentiment}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Changes */}
                {product.o2_product_changes.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">
                      Recommended Changes
                    </h3>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {product.o2_product_changes.map((change, cidx) => (
                        <li key={cidx} className="flex items-start gap-2">
                          <TrendingDown className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price Suggestions */}
                {product.price_suggestions.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Price Recommendations
                    </h3>
                    <div className="space-y-2">
                      {product.price_suggestions.map((suggestion, pidx) => (
                        <div key={pidx} className="text-sm">
                          <div className="font-medium text-green-900">
                            Suggested Price: {suggestion.price}
                          </div>
                          <div className="text-green-700">{suggestion.motivation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comparable Products */}
                {product.comparable_products.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">
                      Comparable Products ({product.comparable_products.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-700">
                              Brand
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-slate-700">
                              Data
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-slate-700">
                              Contract
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-slate-700">
                              Price
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-slate-700">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {product.comparable_products.map((comp, cpidx) => (
                            <tr key={cpidx} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-medium">{comp.brand}</td>
                              <td className="px-3 py-2">{comp.data}</td>
                              <td className="px-3 py-2">{comp.contract}</td>
                              <td className="px-3 py-2">£{comp.price_per_month_GBP}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${getCompetitivenessColor(
                                    comp.competitiveness_score
                                  )}`}
                                >
                                  {comp.competitiveness_score}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Products Not Considered (if any) */}
      {data.products_not_considered && data.products_not_considered.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Products Not Considered
          </h2>
          <div className="space-y-2">
            {data.products_not_considered.map((product, idx) => (
              <div key={idx} className="text-sm bg-slate-50 rounded p-3">
                <div className="font-medium text-slate-900">{product.product}</div>
                <div className="text-slate-600">{product.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
