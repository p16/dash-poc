/**
 * Analysis Metadata Component
 *
 * Shared component for displaying analysis metadata (timestamp, brands, currency).
 * Used by both AnalysisResults and CustomComparisonResults.
 */

type Props = {
  timestamp: Date;
  brands?: string[];
  brandA?: string;
  brandB?: string;
  currency: string;
};

export function AnalysisMetadata({ timestamp, brands, brandA, brandB, currency }: Props) {
  const brandsDisplay = brands
    ? brands.join(', ')
    : brandA && brandB
    ? `${brandA} vs ${brandB}`
    : 'N/A';

  return (
    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
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
          <strong>{brands ? 'Brands' : 'Comparison'}:</strong> {brandsDisplay}
        </span>
        <span>
          <strong>Currency:</strong> {currency}
        </span>
      </div>
    </div>
  );
}
