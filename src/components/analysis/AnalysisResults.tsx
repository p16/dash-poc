'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Target,
} from 'lucide-react';
import type { AnalysisData, CustomComparisonAnalysis } from '@/types/analysis';

type Props = {
  data: AnalysisData | CustomComparisonAnalysis;
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

  // Helper for competitiveness score (higher is worse for the brand being analyzed)
  const getCompetitivenessColor = (score: number) => {
    if (score >= 70) return 'text-red-700 bg-red-50';
    if (score >= 40) return 'text-yellow-700 bg-yellow-50';
    return 'text-green-700 bg-green-50';
  };

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
        <div className="flex items-center gap-4">
          <span>
            <strong>Generated:</strong>{' '}
            {timestamp.toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </span>
          <span>
            <strong>Brands:</strong> {brands?.join(', ') || 'N/A'}
          </span>
          <span>
            <strong>Currency:</strong> {data.currency}
          </span>
        </div>
      </div>

      {/* Overall Competitive Sentiments */}
            {/* Competitive Sentiments */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Competitive Insights
        </h2>
        {data?.overall_competitive_sentiments && data.overall_competitive_sentiments.length > 0 ? (
          <div className="space-y-4">
            {data.overall_competitive_sentiments.map((sentiment, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${getCompetitivenessColor(
                  sentiment?.score || 0
                )}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{sentiment?.sentiment || 'N/A'}</h3>
                  <span className="text-sm font-medium px-2 py-1 rounded bg-white/50">
                    Score: {sentiment?.score ?? 'N/A'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{sentiment?.rationale || 'N/A'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 italic">No competitive insights available</p>
        )}
      </div>

      {/* Products Analysis - handles both O2 and Custom Comparison formats */}
      {'o2_products_analysis' in data && data.o2_products_analysis && data.o2_products_analysis.length > 0 ? (
        data.o2_products_analysis.map((product, idx) => {
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
                    {product?.product_name || 'Unknown Product'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {product?.data_tier || 'N/A'} | {product?.roaming_tier || 'N/A'} |{' '}
                    {product?.product_breakdown?.price_per_month_GBP !== null &&
                    product?.product_breakdown?.price_per_month_GBP !== undefined
                      ? `£${product.product_breakdown.price_per_month_GBP}/mo`
                      : 'Price: Unknown'}
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
                              <td className="px-3 py-2">
                                {comp.price_per_month_GBP !== null
                                  ? `£${comp.price_per_month_GBP}`
                                  : 'Unknown'}
                              </td>
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
      })
      ) : 'brand_a_products_analysis' in data && data.brand_a_products_analysis && data.brand_a_products_analysis.length > 0 ? (
        data.brand_a_products_analysis.map((product, idx) => {
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
                    {product?.product_name || 'Unknown Product'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {product?.product_breakdown?.data || 'N/A'} • £{product?.product_breakdown?.price_per_month_GBP ?? 'N/A'}
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
              <div className="p-6 pt-2 border-t border-slate-100 space-y-6">
                {/* Product Sentiments */}
                {product.brand_a_product_sentiments && product.brand_a_product_sentiments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Competitive Insights
                    </h3>
                    <div className="space-y-2">
                      {product.brand_a_product_sentiments.map((sentiment, sidx) => (
                        <div
                          key={sidx}
                          className="p-3 rounded-lg border-2 bg-slate-50 border-slate-200"
                        >
                          <p className="text-sm leading-relaxed text-slate-700">{sentiment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Changes */}
                {product.brand_a_product_changes && product.brand_a_product_changes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Recommended Changes
                    </h3>
                    <div className="space-y-2">
                      {product.brand_a_product_changes.map((change, cidx) => (
                        <div key={cidx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-900">{change}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Suggestions */}
                {product.price_suggestions && product.price_suggestions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing Strategy
                    </h3>
                    <div className="space-y-2">
                      {product.price_suggestions.map((suggestion, pidx) => (
                        <div key={pidx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-green-900">
                              Suggested Price
                            </span>
                            <span className="text-sm font-bold text-green-900">
                              £{suggestion?.price ?? 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-green-700 mt-1">{suggestion?.motivation || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comparable Products Table */}
                {product.comparable_products && product.comparable_products.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                      Comparable Products
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="text-left p-2 font-medium text-slate-700">Company</th>
                            <th className="text-left p-2 font-medium text-slate-700">Plan</th>
                            <th className="text-left p-2 font-medium text-slate-700">Data</th>
                            <th className="text-right p-2 font-medium text-slate-700">Price</th>
                            <th className="text-left p-2 font-medium text-slate-700">Contract</th>
                            <th className="text-left p-2 font-medium text-slate-700">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.comparable_products.map((comp, cpidx) => (
                            <tr key={cpidx} className="border-b border-slate-100">
                              <td className="p-2 font-medium">{comp?.brand || 'N/A'}</td>
                              <td className="p-2">{comp?.brand || 'N/A'}</td>
                              <td className="p-2">{comp?.data || 'N/A'}</td>
                              <td className="p-2 text-right font-medium">£{comp?.price_per_month_GBP ?? 'N/A'}</td>
                              <td className="p-2">{comp?.contract || 'N/A'}</td>
                              <td className="p-2 text-slate-600">{comp?.notes || '-'}</td>
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
      })
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <p className="text-slate-500 italic">No product analysis available</p>
        </div>
      )}

      {/* Products Not Considered (if any) */}
      {data?.products_not_considered && data.products_not_considered.length > 0 && (
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
