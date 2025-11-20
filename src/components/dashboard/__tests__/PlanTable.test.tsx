/**
 * PlanTable Component Tests
 *
 * Tests for the plan data table with sorting, filtering, and pagination.
 *
 * Story: 4.5 - Plan Data Table & Filtering
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanTable } from '../PlanTable';
import type { Plan } from '@/types/database';

const mockPlans: Plan[] = [
  {
    id: '1',
    source: 'o2',
    plan_key: 'o2-10gb-12month',
    plan_data: {
      price: '10.99',
      data_allowance: '10GB',
      contract_term: '12 months',
      extras: ['Free calls', 'EU roaming'],
    },
    scrape_timestamp: new Date('2025-11-19'),
  },
  {
    id: '2',
    source: 'vodafone',
    plan_key: 'vodafone-unlimited-24month',
    plan_data: {
      price: '25.00',
      data_allowance: 'Unlimited',
      contract_term: '24 months',
      extras: ['5G', 'Entertainment'],
    },
    scrape_timestamp: new Date('2025-11-19'),
  },
  {
    id: '3',
    source: 'three',
    plan_key: 'three-50gb-30day',
    plan_data: {
      price: '15.50',
      data_allowance: '50GB',
      contract_term: '30-day rolling',
      extras: [],
    },
    scrape_timestamp: new Date('2025-11-19'),
  },
  {
    id: '4',
    source: 'o2',
    plan_key: 'o2-unlimited-24month',
    plan_data: {
      price: '30.00',
      data_allowance: 'Unlimited',
      contract_term: '24 months',
      extras: ['Priority', 'Roaming'],
    },
    scrape_timestamp: new Date('2025-11-19'),
  },
];

describe('PlanTable', () => {
  beforeEach(() => {
    // Clear any previous state
  });

  afterEach(() => {
    cleanup();
  });

  it('renders table with all plans', () => {
    render(<PlanTable plans={mockPlans} />);

    expect(screen.getByText(/showing 4 of 4 plans/i)).toBeInTheDocument();
    // Sources appear in both filter checkboxes and table cells
    expect(screen.getAllByText('o2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('vodafone').length).toBeGreaterThan(0);
    expect(screen.getAllByText('three').length).toBeGreaterThan(0);
  });

  it('displays correct columns', () => {
    render(<PlanTable plans={mockPlans} />);

    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Data Allowance')).toBeInTheDocument();
    expect(screen.getByText('Contract Term')).toBeInTheDocument();
    expect(screen.getByText('Extras')).toBeInTheDocument();
  });

  it('displays plan data correctly', () => {
    render(<PlanTable plans={mockPlans} />);

    expect(screen.getByText('£10.99/mo')).toBeInTheDocument();
    expect(screen.getByText('10GB')).toBeInTheDocument();
    expect(screen.getByText('12 months')).toBeInTheDocument();
    expect(screen.getByText('Free calls, EU roaming')).toBeInTheDocument();
  });

  it('sorts by source ascending when clicked', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const sourceHeader = screen.getByText('Source').closest('th');
    await user.click(sourceHeader!);

    const rows = screen.getAllByRole('row');
    // First row is header, second should be first alphabetically (o2)
    expect(rows[1]).toHaveTextContent('o2');
  });

  it('sorts by source descending when clicked twice', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const sourceHeader = screen.getByText('Source').closest('th');
    await user.click(sourceHeader!);
    await user.click(sourceHeader!);

    const rows = screen.getAllByRole('row');
    // Should be reversed - vodafone should be first
    expect(rows[1]).toHaveTextContent('vodafone');
  });

  it('sorts by price ascending', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const priceHeader = screen.getByText('Price').closest('th');
    await user.click(priceHeader!);

    const rows = screen.getAllByRole('row');
    // Cheapest plan (£10.99) should be first
    expect(rows[1]).toHaveTextContent('£10.99/mo');
  });

  it('sorts by price descending', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const priceHeader = screen.getByText('Price').closest('th');
    await user.click(priceHeader!);
    await user.click(priceHeader!);

    const rows = screen.getAllByRole('row');
    // Most expensive plan (£30.00) should be first
    expect(rows[1]).toHaveTextContent('£30.00/mo');
  });

  it('filters by single source', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const o2Checkbox = screen.getByLabelText('o2');
    await user.click(o2Checkbox);

    expect(screen.getByText(/showing 2 of 2 plans.*filtered from 4 total/i)).toBeInTheDocument();
  });

  it('filters by multiple sources', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const o2Checkbox = screen.getByLabelText('o2');
    const vodafoneCheckbox = screen.getByLabelText('vodafone');

    await user.click(o2Checkbox);
    await user.click(vodafoneCheckbox);

    expect(screen.getByText(/showing 3 of 3 plans.*filtered from 4 total/i)).toBeInTheDocument();
  });

  it('filters by minimum price', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const minPriceInput = screen.getByPlaceholderText('Min');
    await user.type(minPriceInput, '20');

    expect(screen.getByText(/showing 2 of 2 plans.*filtered from 4 total/i)).toBeInTheDocument();
    expect(screen.getByText('£25.00/mo')).toBeInTheDocument();
    expect(screen.getByText('£30.00/mo')).toBeInTheDocument();
  });

  it('filters by maximum price', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const maxPriceInput = screen.getByPlaceholderText('Max');
    await user.type(maxPriceInput, '20');

    expect(screen.getByText(/showing 2 of 2 plans.*filtered from 4 total/i)).toBeInTheDocument();
    expect(screen.getByText('£10.99/mo')).toBeInTheDocument();
    expect(screen.getByText('£15.50/mo')).toBeInTheDocument();
  });

  it('filters by price range (min and max)', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const minPriceInput = screen.getByPlaceholderText('Min');
    const maxPriceInput = screen.getByPlaceholderText('Max');

    await user.type(minPriceInput, '15');
    await user.type(maxPriceInput, '26');

    expect(screen.getByText(/showing 2 of 2 plans.*filtered from 4 total/i)).toBeInTheDocument();
    expect(screen.getByText('£15.50/mo')).toBeInTheDocument();
    expect(screen.getByText('£25.00/mo')).toBeInTheDocument();
  });

  it('shows clear filters button when filters are active', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const o2Checkbox = screen.getByLabelText('o2');
    await user.click(o2Checkbox);

    expect(screen.getByText('Clear all filters')).toBeInTheDocument();
  });

  it('clears all filters when clear button clicked', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const o2Checkbox = screen.getByLabelText('o2');
    const minPriceInput = screen.getByPlaceholderText('Min');

    await user.click(o2Checkbox);
    await user.type(minPriceInput, '20');

    const clearButton = screen.getByText('Clear all filters');
    await user.click(clearButton);

    expect(screen.getByText(/showing 4 of 4 plans/i)).toBeInTheDocument();
    expect(o2Checkbox).not.toBeChecked();
    expect(minPriceInput).toHaveValue(null);
  });

  it('shows empty state when no plans match filters', async () => {
    const user = userEvent.setup();
    render(<PlanTable plans={mockPlans} />);

    const minPriceInput = screen.getByPlaceholderText('Min');
    await user.type(minPriceInput, '100');

    expect(screen.getByText('No plans found matching your filters')).toBeInTheDocument();
  });

  it('shows pagination when more than 100 plans', () => {
    // Create 150 mock plans
    const manyPlans: Plan[] = Array.from({ length: 150 }, (_, i) => ({
      id: `plan-${i}`,
      source: `source-${i % 5}`,
      plan_key: `key-${i}`,
      plan_data: {
        price: `${10 + i}`,
        data_allowance: '10GB',
        contract_term: '12 months',
        extras: [],
      },
      scrape_timestamp: new Date(),
    }));

    render(<PlanTable plans={manyPlans} />);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('navigates to next page', async () => {
    const user = userEvent.setup();
    const manyPlans: Plan[] = Array.from({ length: 150 }, (_, i) => ({
      id: `plan-${i}`,
      source: `source-${i % 5}`,
      plan_key: `key-${i}`,
      plan_data: {
        price: `${10 + i}`,
        data_allowance: '10GB',
        contract_term: '12 months',
        extras: [],
      },
      scrape_timestamp: new Date(),
    }));

    render(<PlanTable plans={manyPlans} />);

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    const manyPlans: Plan[] = Array.from({ length: 150 }, (_, i) => ({
      id: `plan-${i}`,
      source: `source-${i % 5}`,
      plan_key: `key-${i}`,
      plan_data: {
        price: `${10 + i}`,
        data_allowance: '10GB',
        contract_term: '12 months',
        extras: [],
      },
      scrape_timestamp: new Date(),
    }));

    render(<PlanTable plans={manyPlans} />);

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last page', async () => {
    const user = userEvent.setup();
    const manyPlans: Plan[] = Array.from({ length: 150 }, (_, i) => ({
      id: `plan-${i}`,
      source: `source-${i % 5}`,
      plan_key: `key-${i}`,
      plan_data: {
        price: `${10 + i}`,
        data_allowance: '10GB',
        contract_term: '12 months',
        extras: [],
      },
      scrape_timestamp: new Date(),
    }));

    render(<PlanTable plans={manyPlans} />);

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    expect(nextButton).toBeDisabled();
  });

  it('handles plans with string prices', () => {
    const plansWithStringPrices: Plan[] = [
      {
        id: '1',
        source: 'test',
        plan_key: 'test-1',
        plan_data: {
          price: '£19.99',
          data_allowance: '10GB',
          contract_term: '12 months',
          extras: [],
        },
        scrape_timestamp: new Date(),
      },
    ];

    render(<PlanTable plans={plansWithStringPrices} />);

    expect(screen.getByText('£19.99/mo')).toBeInTheDocument();
  });

  it('handles missing plan data fields gracefully', () => {
    const incompletePlans: Plan[] = [
      {
        id: '1',
        source: 'test',
        plan_key: 'test-1',
        plan_data: {},
        scrape_timestamp: new Date(),
      },
    ];

    render(<PlanTable plans={incompletePlans} />);

    // Should render with dashes for missing data
    const cells = screen.getAllByText('-');
    expect(cells.length).toBeGreaterThan(0);
  });
});
