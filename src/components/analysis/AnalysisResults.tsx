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
import { CompetitiveInsightsSection } from './CompetitiveInsightsSection';
import { AnalysisMetadata } from './AnalysisMetadata';

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

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <AnalysisMetadata
        timestamp={timestamp}
        brands={brands}
        currency={data.currency}
      />

      {/* Competitive Sentiments */}
      <CompetitiveInsightsSection sentiments={data?.overall_competitive_sentiments} />

      {/* Products Analysis - handles both O2 and Custom Comparison formats */}
      {'o2_products_analysis' in data && data.o2_products_analysis && data.o2_products_analysis.length > 0 ? (
        data.o2_products_analysis.map((product, idx) => {
          const sectionKey = `product-${idx}`;
          const isExpanded = expandedSections.has(sectionKey);

          return (
            <div
              key={idx}
              className="bg-card border rounded-lg overflow-hidden"
            >
            <button
              onClick={() => toggleSection(sectionKey)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-foreground">
                    {product?.product_name || 'Unknown Product'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {product?.data_tier || 'N/A'} | {product?.roaming_tier || 'N/A'} |{' '}
                    {typeof product?.product_breakdown?.price_per_month_GBP === 'number'
                      ? `£${product.product_breakdown.price_per_month_GBP}/mo`
                      : 'Price not available'}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="p-4 pt-0 space-y-4">
                {/* O2 Product Breakdown */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    O2 Product Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-primary font-medium">Data:</span>{' '}
                      {product.product_breakdown.data}
                    </div>
                    <div>
                      <span className="text-primary font-medium">Contract:</span>{' '}
                      {product.product_breakdown.contract}
                    </div>
                    <div>
                      <span className="text-primary font-medium">Roaming:</span>{' '}
                      {product.product_breakdown.roaming}
                    </div>
                    <div>
                      <span className="text-primary font-medium">Extras:</span>{' '}
                      {product.product_breakdown.extras || 'None'}
                    </div>
                    <div className="col-span-2">
                      <span className="text-primary font-medium">
                        Competitiveness Score:
                      </span>{' '}
                      <span className="font-bold px-2 py-1 rounded text-foreground bg-muted border">
                        {product.product_breakdown.competitiveness_score}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strategic Insights */}
                {product.o2_product_sentiments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Strategic Insights
                    </h3>
                    <ul className="space-y-1 text-sm text-foreground">
                      {product.o2_product_sentiments.map((sentiment, sidx) => (
                        <li key={sidx} className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{sentiment}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Changes */}
                {product.o2_product_changes.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Recommended Changes
                    </h3>
                    <ul className="space-y-1 text-sm text-foreground">
                      {product.o2_product_changes.map((change, cidx) => (
                        <li key={cidx} className="flex items-start gap-2">
                          <TrendingDown className="h-4 w-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price Suggestions */}
                {product.price_suggestions.length > 0 && (
                  <div className="bg-primary/5 border-2 border-primary/30 rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Price Recommendations
                    </h3>
                    <div className="space-y-2">
                      {product.price_suggestions.map((suggestion, pidx) => (
                        <div key={pidx} className="text-sm">
                          <div className="font-medium text-foreground">
                            Suggested Price: {suggestion.price}
                          </div>
                          <div className="text-muted-foreground">{suggestion.motivation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comparable Products */}
                {product.comparable_products.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Comparable Products ({product.comparable_products.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Brand
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Data
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Contract
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Price
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {product.comparable_products.map((comp, cpidx) => (
                            <tr key={cpidx} className="hover:bg-accent">
                              <td className="px-3 py-2 font-medium">{comp.brand}</td>
                              <td className="px-3 py-2">{comp.data}</td>
                              <td className="px-3 py-2">{comp.contract}</td>
                              <td className="px-3 py-2">
                                {comp.price_per_month_GBP !== null
                                  ? `£${comp.price_per_month_GBP}`
                                  : 'Unknown'}
                              </td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-1 rounded text-xs font-medium text-foreground bg-muted border">
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
              className="bg-card border rounded-lg overflow-hidden"
            >
            <button
              onClick={() => toggleSection(sectionKey)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-foreground">
                    {product?.product_name || 'Unknown Product'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {product?.product_breakdown?.data || 'N/A'} • £{product?.product_breakdown?.price_per_month_GBP ?? 'N/A'}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="p-6 pt-2 border-t border-border space-y-6">
                {/* Product Sentiments */}
                {product.brand_a_product_sentiments && product.brand_a_product_sentiments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Competitive Insights
                    </h3>
                    <div className="space-y-2">
                      {product.brand_a_product_sentiments.map((sentiment, sidx) => (
                        <div
                          key={sidx}
                          className="p-3 rounded-lg border-2 bg-muted/50 border-border"
                        >
                          <p className="text-sm leading-relaxed text-foreground">{sentiment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Changes */}
                {product.brand_a_product_changes && product.brand_a_product_changes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Recommended Changes
                    </h3>
                    <div className="space-y-2">
                      {product.brand_a_product_changes.map((change, cidx) => (
                        <div key={cidx} className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                          <p className="text-sm text-foreground">{change}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Suggestions */}
                {product.price_suggestions && product.price_suggestions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Pricing Strategy
                    </h3>
                    <div className="space-y-2">
                      {product.price_suggestions.map((suggestion, pidx) => (
                        <div key={pidx} className="bg-primary/5 border-2 border-primary/30 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-foreground">
                              Suggested Price
                            </span>
                            <span className="text-sm font-bold text-primary">
                              £{suggestion?.price ?? 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion?.motivation || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comparable Products Table */}
                {product.comparable_products && product.comparable_products.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      Comparable Products
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left p-2 font-medium text-muted-foreground">Company</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Plan</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Data</th>
                            <th className="text-right p-2 font-medium text-muted-foreground">Price</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Contract</th>
                            <th className="text-left p-2 font-medium text-muted-foreground">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.comparable_products.map((comp, cpidx) => (
                            <tr key={cpidx} className="border-b border-border">
                              <td className="p-2 font-medium">{comp?.brand || 'N/A'}</td>
                              <td className="p-2">{comp?.brand || 'N/A'}</td>
                              <td className="p-2">{comp?.data || 'N/A'}</td>
                              <td className="p-2 text-right font-medium">£{comp?.price_per_month_GBP ?? 'N/A'}</td>
                              <td className="p-2">{comp?.contract || 'N/A'}</td>
                              <td className="p-2 text-muted-foreground">{comp?.notes || '-'}</td>
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
        <div className="bg-card border rounded-lg p-6">
          <p className="text-muted-foreground italic">No product analysis available</p>
        </div>
      )}

      {/* Products Not Considered (if any) */}
      {data?.products_not_considered && data.products_not_considered.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Products Not Considered
          </h2>
          <div className="space-y-2">
            {data.products_not_considered.map((product, idx) => (
              <div key={idx} className="text-sm bg-muted/50 rounded p-3">
                <div className="font-medium text-foreground">{product.product}</div>
                <div className="text-muted-foreground">{product.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
