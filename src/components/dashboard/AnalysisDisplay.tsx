import { FileText, Calendar, Building2 } from 'lucide-react';
import type { Analysis } from '@/lib/dashboard/latest-analysis';
import { AnalysisResults } from '@/components/analysis/AnalysisResults';
import type { AnalysisData } from '@/types/analysis';

type Props = {
  analysis: Analysis | null;
};

export function AnalysisDisplay({ analysis }: Props) {
  if (!analysis) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No Analysis Yet</h2>
        <p className="text-slate-600 mb-4">
          Click "Run Full Analysis" above to generate your first competitive intelligence report.
        </p>
      </div>
    );
  }

  const { brands, analysis_result, created_at } = analysis;

  // Check if analysis_result matches AnalysisData structure
  const isStructuredAnalysis =
    typeof analysis_result === 'object' &&
    analysis_result !== null &&
    'overall_competitive_sentiments' in analysis_result;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Latest Full Analysis</h2>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(created_at).toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {brands.length} brands compared
            </div>
          </div>
        </div>
      </div>

      {/* Use AnalysisResults component for structured data */}
      {isStructuredAnalysis ? (
        <AnalysisResults
          data={analysis_result as unknown as AnalysisData}
          timestamp={new Date(created_at)}
          brands={brands}
        />
      ) : (
        /* Fallback for non-structured data */
        <div className="prose prose-slate max-w-none">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Analysis Summary:</h3>
          <div className="bg-slate-50 rounded-lg p-4 text-sm">
            <pre className="whitespace-pre-wrap font-sans text-slate-700">
              {JSON.stringify(analysis_result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
