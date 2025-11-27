/**
 * Plan Data Table Component
 *
 * Interactive table for browsing and filtering scraped plan data.
 * Features sorting, filtering by source and price, and pagination.
 *
 * Story: 4.5 - Plan Data Table & Filtering
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { Plan } from '@/types/database';

type Props = {
  plans: Plan[];
};

type SortColumn = 'source' | 'price' | 'data' | 'contract' | null;
type SortDirection = 'asc' | 'desc';

const PLANS_PER_PAGE = 100;

export function PlanTable({ plans }: Props) {
  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filtering state
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique sources for filter
  const uniqueSources = useMemo(() => {
    const sources = new Set(plans.map((p) => p.source));
    return Array.from(sources).sort();
  }, [plans]);

  // Handle column sort
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle source filter toggle
  const toggleSource = (source: string) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(source)) {
      newSelected.delete(source);
    } else {
      newSelected.add(source);
    }
    setSelectedSources(newSelected);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Get normalized price from plan_data
  const getPlanPrice = (plan: Plan): number => {
    const price = plan.plan_data.price;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const match = price.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }
    return 0;
  };

  // Get data allowance from plan_data
  const getPlanData = (plan: Plan): string => {
    return plan.plan_data.data_allowance?.toString() || '-';
  };

  // Get contract term from plan_data
  const getPlanContract = (plan: Plan): string => {
    return plan.plan_data.contract_term?.toString() || '-';
  };

  // Get extras from plan_data
  const getPlanExtras = (plan: Plan): string => {
    const extras = plan.plan_data.extras;
    if (Array.isArray(extras)) {
      return extras.join(', ');
    }
    if (extras) {
      return String(extras);
    }
    return '-';
  };

  // Filter and sort plans
  const filteredAndSortedPlans = useMemo(() => {
    let filtered = [...plans];

    // Filter by source
    if (selectedSources.size > 0) {
      filtered = filtered.filter((p) => selectedSources.has(p.source));
    }

    // Filter by price range
    const min = minPrice ? parseFloat(minPrice) : null;
    const max = maxPrice ? parseFloat(maxPrice) : null;
    if (min !== null || max !== null) {
      filtered = filtered.filter((p) => {
        const price = getPlanPrice(p);
        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;
        return true;
      });
    }

    // Sort
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortColumn) {
          case 'source':
            aVal = a.source;
            bVal = b.source;
            break;
          case 'price':
            aVal = getPlanPrice(a);
            bVal = getPlanPrice(b);
            break;
          case 'data':
            aVal = getPlanData(a);
            bVal = getPlanData(b);
            break;
          case 'contract':
            aVal = getPlanContract(a);
            bVal = getPlanContract(b);
            break;
          default:
            return 0;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal);
          return sortDirection === 'asc' ? comparison : -comparison;
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return filtered;
  }, [plans, selectedSources, minPrice, maxPrice, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPlans.length / PLANS_PER_PAGE);
  const paginatedPlans = filteredAndSortedPlans.slice(
    (currentPage - 1) * PLANS_PER_PAGE,
    currentPage * PLANS_PER_PAGE
  );

  // Sort indicator component
  const SortIndicator = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Filter by Source
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {uniqueSources.map((source) => (
                <label key={source} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSources.has(source)}
                    onChange={() => toggleSource(source)}
                    className="rounded border-input text-primary focus:ring-ring"
                  />
                  <span className="text-sm capitalize">{source}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Filter by Price Range (£/month)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedSources.size > 0 || minPrice || maxPrice) && (
          <button
            onClick={() => {
              setSelectedSources(new Set());
              setMinPrice('');
              setMaxPrice('');
              setCurrentPage(1);
            }}
            className="mt-4 text-sm text-primary hover:text-primary/80 underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedPlans.length} of {filteredAndSortedPlans.length} plans
        {filteredAndSortedPlans.length !== plans.length && ` (filtered from ${plans.length} total)`}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th
                  onClick={() => handleSort('source')}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    Source
                    <SortIndicator column="source" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    Price
                    <SortIndicator column="price" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('data')}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    Data Allowance
                    <SortIndicator column="data" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('contract')}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    Contract Term
                    <SortIndicator column="contract" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Extras
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No plans found matching your filters
                  </td>
                </tr>
              ) : (
                paginatedPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground capitalize">
                      {plan.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      £{getPlanPrice(plan).toFixed(2)}/mo
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {getPlanData(plan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {getPlanContract(plan)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="max-w-[200px] truncate" title={getPlanExtras(plan)}>
                        {getPlanExtras(plan)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-card rounded-lg shadow px-6 py-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
