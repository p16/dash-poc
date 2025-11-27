/**
 * Custom Comparison Results Display Component
 *
 * Displays the results of a custom brand-vs-brand comparison.
 * Handles graceful degradation for null/undefined values.
 */

import { Package, AlertCircle } from 'lucide-react';
import type { CustomComparisonAnalysis } from '@/types/analysis';
import { CompetitiveInsightsSection } from './CompetitiveInsightsSection';
import { AnalysisMetadata } from './AnalysisMetadata';

type Props = {
  data: CustomComparisonAnalysis;
  timestamp: Date;
  brandA: string;
  brandB: string;
};

export function CustomComparisonResults({ data, timestamp, brandA, brandB }: Props) {
  return (
    <div className="space-y-6">
      {/* Metadata */}
      <AnalysisMetadata
        timestamp={timestamp}
        brandA={brandA}
        brandB={brandB}
        currency={data.currency || 'GBP'}
      />

      {/* Competitive Sentiments */}
      <CompetitiveInsightsSection sentiments={data?.overall_competitive_sentiments} />

      {/* Brand A Products Analysis */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-600" />
          {brandA} Product Analysis
        </h2>

        {data.brand_a_products_analysis?.map((product: any, idx: number) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-lg p-6"
          >
            {/* Product Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {product?.product_name || 'Unknown Product'}
              </h3>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  {product?.data_tier || 'Unknown'} Data
                </span>
                <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                  {product?.roaming_tier || 'Unknown'} Roaming
                </span>
                {product?.product_breakdown?.price_per_month_GBP !== null &&
                 product?.product_breakdown?.price_per_month_GBP !== undefined ? (
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium">
                    £{product.product_breakdown.price_per_month_GBP}/mo
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded">
                    Price Unknown
                  </span>
                )}
                <span className="px-2 py-1 rounded font-medium text-foreground bg-muted border">
                  Competitiveness: {product?.product_breakdown?.competitiveness_score ?? 'N/A'}
                </span>
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="font-medium text-slate-700">Data:</span>{' '}
                {product?.product_breakdown?.data || 'Unknown'}
              </div>
              <div>
                <span className="font-medium text-slate-700">Contract:</span>{' '}
                {product?.product_breakdown?.contract || 'Unknown'}
              </div>
              <div>
                <span className="font-medium text-slate-700">Roaming:</span>{' '}
                {product?.product_breakdown?.roaming || 'Unknown'}
              </div>
              <div>
                <span className="font-medium text-slate-700">Extras:</span>{' '}
                {product?.product_breakdown?.extras || 'None'}
              </div>
            </div>

            {/* Product Sentiments */}
            {product?.brand_a_product_sentiments && product.brand_a_product_sentiments.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 mb-2">Analysis</h4>
                <ul className="space-y-1">
                  {product.brand_a_product_sentiments.map((sentiment: any, sidx: number) => (
                    <li key={sidx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{sentiment || 'N/A'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Changes */}
            {product?.brand_a_product_changes && product.brand_a_product_changes.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 mb-2">Suggested Changes</h4>
                <ul className="space-y-1">
                  {product.brand_a_product_changes.map((change: any, cidx: number) => (
                    <li key={cidx} className="text-sm text-amber-700 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{change || 'N/A'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price Suggestions */}
            {product?.price_suggestions && product.price_suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Price Recommendations</h4>
                <div className="space-y-2">
                  {product.price_suggestions.map((suggestion: any, pidx: number) => (
                    <div key={pidx} className="bg-primary/5 border-2 border-primary/30 rounded-lg p-3 text-sm">
                      <div className="font-medium text-foreground">
                        Suggested Price: £{suggestion?.price ?? 'Unknown'}/mo
                      </div>
                      <div className="text-muted-foreground mt-1">
                        {suggestion?.motivation || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparable Products */}
            {product?.comparable_products && product.comparable_products.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2">
                  Comparable {brandB} Products ({product.comparable_products.length})
                </h4>
                <div className="space-y-2">
                  {product.comparable_products.map((comp: any, compIdx: number) => (
                    <div key={compIdx} className="bg-slate-50 rounded p-3 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-slate-900">
                            {comp?.data || 'Unknown'} • {comp?.contract || 'Unknown'}
                          </div>
                          <div className="text-slate-600 text-xs mt-1">
                            {comp?.roaming || 'Unknown'} Roaming • {comp?.extras || 'No extras'}
                          </div>
                        </div>
                        <div className="text-right">
                          {comp?.price_per_month_GBP !== null && comp?.price_per_month_GBP !== undefined ? (
                            <div className="font-semibold text-slate-900">
                              £{comp.price_per_month_GBP}/mo
                            </div>
                          ) : (
                            <div className="text-slate-500 text-sm">Unknown</div>
                          )}
                          <div className="text-xs mt-1 px-2 py-0.5 rounded text-foreground bg-muted border">
                            Score: {comp?.competitiveness_score ?? 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )) || (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500">
            No {brandA} product analysis available
          </div>
        )}
      </div>

      {/* Products Not Considered */}
      {data.products_not_considered && data.products_not_considered.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Products Not Considered
          </h2>
          <div className="space-y-2">
            {data.products_not_considered.map((item: any, idx: number) => (
              <div key={idx} className="text-sm bg-slate-50 rounded p-3">
                <div className="font-medium text-slate-900">
                  {item?.product || 'Unknown Product'}
                </div>
                <div className="text-slate-600">{item?.details || 'No details provided'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
