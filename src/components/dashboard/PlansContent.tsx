/**
 * Plans Content Component
 *
 * Client-side wrapper for plan filtering, sorting, and CSV export.
 * Receives plan data as props from server component.
 *
 * Story: 5.4 - Plan Data Table Redesign
 */

'use client';

import { useState, useMemo } from 'react';
import { PlanFilterBar } from './PlanFilterBar';
import { PlanDataTable } from './PlanDataTable';
import type { Plan } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

type Props = {
  initialPlans: Plan[];
};

export function PlansContent({ initialPlans }: Props) {
  const { toast } = useToast();
  const [brandFilter, setBrandFilter] = useState('all');
  const [dataFilter, setDataFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Extract unique brands
  const brands = useMemo(() => {
    const brandSet = new Set(initialPlans.map((p) => p.source));
    return Array.from(brandSet).sort();
  }, [initialPlans]);

  // Helper functions to extract data from plan_data JSONB
  const getPlanPrice = (plan: Plan): number => {
    const price = plan.plan_data.price;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const match = price.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }
    return 0;
  };

  const getPlanDataAllowance = (plan: Plan): string => {
    return plan.plan_data.data_allowance?.toString() || '';
  };

  const getPlanContract = (plan: Plan): string => {
    return plan.plan_data.contract_term?.toString() || '';
  };

  // Data range matching function
  const matchesDataRange = (dataAllowance: string, range: string): boolean => {
    if (range === 'all') return true;

    const dataLower = dataAllowance.toLowerCase();

    if (range === 'unlimited') {
      return dataLower.includes('unlimited') || dataLower.includes('unltd');
    }

    // Extract numeric value from data allowance
    const match = dataAllowance.match(/(\d+(\.\d+)?)/);
    if (!match) return false;

    let dataGB = parseFloat(match[1]);

    // Convert MB to GB if needed
    if (dataLower.includes('mb')) {
      dataGB = dataGB / 1024;
    }

    const [min, max] = range.split('-').map((v) => (v === '+' ? Infinity : parseFloat(v)));

    if (max === undefined) {
      // Range like "50+"
      return dataGB >= min;
    }

    return dataGB >= min && dataGB < max;
  };

  // Price range matching function
  const matchesPriceRange = (price: number, range: string): boolean => {
    if (range === 'all') return true;

    const [min, max] = range.split('-').map((v) => (v === '+' ? Infinity : parseFloat(v)));

    if (max === undefined) {
      // Range like "30+"
      return price >= min;
    }

    return price >= min && price < max;
  };

  // Filter and sort plans
  const filteredAndSortedPlans = useMemo(() => {
    let filtered = [...initialPlans];

    // Apply filters
    if (brandFilter !== 'all') {
      filtered = filtered.filter((p) => p.source === brandFilter);
    }

    if (dataFilter !== 'all') {
      filtered = filtered.filter((p) => matchesDataRange(getPlanDataAllowance(p), dataFilter));
    }

    if (priceFilter !== 'all') {
      filtered = filtered.filter((p) => matchesPriceRange(getPlanPrice(p), priceFilter));
    }

    // Apply sorting
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
            aVal = getPlanDataAllowance(a);
            bVal = getPlanDataAllowance(b);
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
  }, [initialPlans, brandFilter, dataFilter, priceFilter, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleClearFilters = () => {
    setBrandFilter('all');
    setDataFilter('all');
    setPriceFilter('all');
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Brand', 'Plan Name', 'Data', 'Price', 'Contract', 'Features', 'Source'];
      const rows = filteredAndSortedPlans.map((plan) => {
        const extras = Array.isArray(plan.plan_data.extras)
          ? plan.plan_data.extras.join('; ')
          : '';

        return [
          plan.source,
          plan.plan_data.name || '',
          getPlanDataAllowance(plan),
          getPlanPrice(plan).toFixed(2),
          getPlanContract(plan),
          extras,
          plan.source,
        ];
      });

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `plans-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Exported ${filteredAndSortedPlans.length} plans to CSV`,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export CSV file',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PlanFilterBar
        brands={brands}
        brandFilter={brandFilter}
        dataFilter={dataFilter}
        priceFilter={priceFilter}
        onBrandChange={setBrandFilter}
        onDataChange={setDataFilter}
        onPriceChange={setPriceFilter}
        onClearFilters={handleClearFilters}
        onExportCSV={handleExportCSV}
        filteredCount={filteredAndSortedPlans.length}
        totalCount={initialPlans.length}
      />

      <PlanDataTable
        plans={filteredAndSortedPlans}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </div>
  );
}
