/**
 * Plan Data Table Component
 *
 * Sortable data table for displaying plan information using shadcn/ui Table.
 * Features sticky header, sortable columns, and responsive design.
 *
 * Story: 5.4 - Plan Data Table Redesign
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Plan } from '@/types/database';

type Props = {
  plans: Plan[];
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
};

const SORTABLE_COLUMNS = ['source', 'data', 'price', 'contract'];

export function PlanDataTable({ plans, sortColumn, sortDirection, onSort }: Props) {
  // Extract data from plan_data JSONB
  const getPlanPrice = (plan: Plan): number => {
    const price = plan.plan_data.price;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const match = price.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }
    return 0;
  };

  const getPlanData = (plan: Plan): string => {
    return plan.plan_data.data_allowance?.toString() || '-';
  };

  const getPlanContract = (plan: Plan): string => {
    return plan.plan_data.contract_term?.toString() || '-';
  };

  const getPlanExtras = (plan: Plan): string[] => {
    const extras = plan.plan_data.extras;
    if (Array.isArray(extras)) {
      return extras;
    }
    return [];
  };

  const renderSortIcon = (column: string) => {
    if (!SORTABLE_COLUMNS.includes(column)) return null;

    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline-block text-gray-400" />;
    }

    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1 inline-block text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 inline-block text-blue-600" />
    );
  };

  const handleHeaderClick = (column: string) => {
    if (SORTABLE_COLUMNS.includes(column)) {
      onSort(column);
    }
  };

  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No plans available</h3>
        <p className="text-sm text-gray-600">
          Run scrape to collect plan data from telco websites
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-gray-50 z-10">
            <TableRow>
              <TableHead
                className={`cursor-pointer hover:bg-gray-100 ${
                  SORTABLE_COLUMNS.includes('source') ? 'select-none' : ''
                }`}
                onClick={() => handleHeaderClick('source')}
              >
                Brand
                {renderSortIcon('source')}
              </TableHead>
              <TableHead>Plan Name</TableHead>
              <TableHead
                className={`cursor-pointer hover:bg-gray-100 ${
                  SORTABLE_COLUMNS.includes('data') ? 'select-none' : ''
                }`}
                onClick={() => handleHeaderClick('data')}
              >
                Data
                {renderSortIcon('data')}
              </TableHead>
              <TableHead
                className={`cursor-pointer hover:bg-gray-100 ${
                  SORTABLE_COLUMNS.includes('price') ? 'select-none' : ''
                }`}
                onClick={() => handleHeaderClick('price')}
              >
                Price
                {renderSortIcon('price')}
              </TableHead>
              <TableHead
                className={`cursor-pointer hover:bg-gray-100 ${
                  SORTABLE_COLUMNS.includes('contract') ? 'select-none' : ''
                }`}
                onClick={() => handleHeaderClick('contract')}
              >
                Contract
                {renderSortIcon('contract')}
              </TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="hidden md:table-cell">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan, index) => (
              <TableRow
                key={plan.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <TableCell className="font-medium">{plan.source}</TableCell>
                <TableCell>{plan.plan_data.name || '-'}</TableCell>
                <TableCell>{getPlanData(plan)}</TableCell>
                <TableCell>£{getPlanPrice(plan).toFixed(2)}</TableCell>
                <TableCell>{getPlanContract(plan)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getPlanExtras(plan)
                      .slice(0, 3)
                      .map((extra, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {extra}
                        </span>
                      ))}
                    {getPlanExtras(plan).length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        +{getPlanExtras(plan).length - 3}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-gray-600 text-sm">
                  {plan.source}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
