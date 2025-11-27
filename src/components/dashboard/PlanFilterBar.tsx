/**
 * Plan Filter Bar Component
 *
 * Filter controls for plan data table with brand, data allowance, and price range filters.
 * Includes clear filters and CSV export functionality.
 *
 * Story: 5.4 - Plan Data Table Redesign
 */

'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

type Props = {
  brands: string[];
  brandFilter: string;
  dataFilter: string;
  priceFilter: string;
  onBrandChange: (value: string) => void;
  onDataChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onClearFilters: () => void;
  onExportCSV: () => void;
  filteredCount: number;
  totalCount: number;
};

const DATA_RANGES = [
  { value: 'all', label: 'All Data Allowances' },
  { value: '0-5', label: '0-5GB' },
  { value: '5-20', label: '5-20GB' },
  { value: '20-50', label: '20-50GB' },
  { value: '50+', label: '50GB+' },
  { value: 'unlimited', label: 'Unlimited' },
];

const PRICE_RANGES = [
  { value: 'all', label: 'All Prices' },
  { value: '0-10', label: '£0-10' },
  { value: '10-20', label: '£10-20' },
  { value: '20-30', label: '£20-30' },
  { value: '30+', label: '£30+' },
];

export function PlanFilterBar({
  brands,
  brandFilter,
  dataFilter,
  priceFilter,
  onBrandChange,
  onDataChange,
  onPriceChange,
  onClearFilters,
  onExportCSV,
  filteredCount,
  totalCount,
}: Props) {
  const hasActiveFilters = brandFilter !== 'all' || dataFilter !== 'all' || priceFilter !== 'all';

  return (
    <div className="bg-card rounded-lg shadow p-6 space-y-4">
      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Brand Filter */}
        <div>
          <label htmlFor="brand-filter" className="block text-sm font-medium text-foreground mb-2">
            Brand
          </label>
          <Select value={brandFilter} onValueChange={onBrandChange}>
            <SelectTrigger id="brand-filter" className="w-full">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Allowance Filter */}
        <div>
          <label htmlFor="data-filter" className="block text-sm font-medium text-foreground mb-2">
            Data Allowance
          </label>
          <Select value={dataFilter} onValueChange={onDataChange}>
            <SelectTrigger id="data-filter" className="w-full">
              <SelectValue placeholder="All Data" />
            </SelectTrigger>
            <SelectContent>
              {DATA_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label htmlFor="price-filter" className="block text-sm font-medium text-foreground mb-2">
            Price Range
          </label>
          <Select value={priceFilter} onValueChange={onPriceChange}>
            <SelectTrigger id="price-filter" className="w-full">
              <SelectValue placeholder="All Prices" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button onClick={onExportCSV} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-semibold">{filteredCount}</span>
        {filteredCount !== totalCount && ` of ${totalCount}`} plan{filteredCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
