# Coding Standards

## Overview

This document defines coding standards and best practices for the Scrape and Compare project to ensure consistency, maintainability, and quality across the codebase.

## TypeScript Standards

### Type Safety
- **Always use TypeScript** - No `any` types unless absolutely necessary
- **Explicit types** - Prefer explicit type annotations for function parameters and return types
- **Interface over type** - Use `interface` for object shapes, `type` for unions/intersections
- **Strict mode** - TypeScript strict mode enabled

### Naming Conventions
- **PascalCase** - Classes, interfaces, types, components
- **camelCase** - Variables, functions, methods
- **UPPER_SNAKE_CASE** - Constants
- **kebab-case** - File names (except React components which use PascalCase)

### Example
```typescript
// Good
interface PlanData {
  price: number;
  dataAllowance: string;
}

const MAX_RETRIES = 3;

function normalizePrice(price: string): number {
  // implementation
}

// Bad
const planData: any = {};
function normalizePrice(price) { }
```

## React/Next.js Standards

### Component Structure
- **Functional components only** - Use function components with hooks
- **Server Components by default** - Use Server Components unless client-side interactivity needed
- **`"use client"` directive** - Only add when necessary (state, event handlers, browser APIs)
- **Component organization** - One component per file, export as default

### Hooks
- **Custom hooks** - Extract reusable logic into custom hooks (prefix with `use`)
- **Hook dependencies** - Always include all dependencies in dependency arrays
- **Hook rules** - Follow React hooks rules (only call at top level, only in React functions)

### Example
```typescript
// Good - Server Component
export default function PlanDataTable({ plans }: { plans: Plan[] }) {
  return (
    <table>
      {/* table content */}
    </table>
  );
}

// Good - Client Component
"use client";

export function PlansContent({ initialPlans }: { initialPlans: Plan[] }) {
  const [filter, setFilter] = useState("");
  // ...
}
```

## File Organization

### Directory Structure
- **Co-location** - Keep related files together
- **Feature-based** - Organize by feature when possible
- **Barrel exports** - Use `index.ts` for clean imports

### File Naming
- **Components** - PascalCase: `PlansContent.tsx`, `PlanFilterBar.tsx`
- **Utilities** - camelCase: `normalizePrice.ts`
- **API routes** - kebab-case: `api/analysis/full.ts`
- **Types** - PascalCase: `types.ts` or co-located with usage

## Code Style

### Formatting
- **Consistent indentation** - 2 spaces
- **Trailing commas** - Use in multi-line objects/arrays
- **Semicolons** - Use semicolons consistently
- **Quotes** - Single quotes for strings (or double, but be consistent)

### Imports
- **Order imports** - External → Internal → Relative
- **Remove unused imports** - ESLint will catch these
- **Named vs default** - Prefer named exports for utilities, default for components

### Example
```typescript
// Good import order
import { useState } from 'react';
import { normalizePrice } from '@/lib/utils';
import { PlansContent } from './PlansContent';
```

## Error Handling

### Principles
- **Explicit error handling** - Don't silently fail
- **Error boundaries** - Use React error boundaries for component errors
- **Try-catch** - Use for async operations
- **Meaningful messages** - Provide clear error messages

### Example
```typescript
// Good
async function fetchPlans() {
  try {
    const response = await fetch('/api/plans');
    if (!response.ok) {
      throw new Error(`Failed to fetch plans: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
}
```

## Database Standards

### Query Patterns
- **Parameterized queries** - Always use parameterized queries to prevent SQL injection
- **Connection pooling** - Use connection pooling for efficiency
- **Error handling** - Handle database errors gracefully
- **Transactions** - Use transactions for multi-step operations

### Example
```typescript
// Good
const result = await db.query(
  'SELECT * FROM plans WHERE source = $1 AND scrape_timestamp > $2',
  [source, timestamp]
);
```

## API Route Standards

### Structure
- **Type safety** - Use TypeScript for request/response types
- **Error responses** - Consistent error response format
- **Status codes** - Use appropriate HTTP status codes
- **Validation** - Validate input data

### Example
```typescript
// Good
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate body
    const result = await processAnalysis(body);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: 'Failed to process analysis' },
      { status: 500 }
    );
  }
}
```

## Testing Standards

### Test Organization
- **Test files** - Co-locate with source files: `normalizePrice.test.ts`
- **Test structure** - Use `describe` and `it` blocks
- **Test names** - Descriptive test names explaining what is being tested

### Coverage
- **Target coverage** - 60%+ for critical business logic
- **Focus areas** - Data normalization, API routes, utility functions
- **Mock external dependencies** - Mock API calls, database queries

### Example
```typescript
// Good
describe('normalizePrice', () => {
  it('should convert "£10/mo" to 10', () => {
    expect(normalizePrice('£10/mo')).toBe(10);
  });

  it('should handle "10 GBP per month" format', () => {
    expect(normalizePrice('10 GBP per month')).toBe(10);
  });
});
```

## Scraping Standards

### Playwright Best Practices
- **Wait for elements** - Always wait for elements to be visible/ready
- **Error handling** - Implement retry logic for failed scrapes
- **Screenshots** - Capture screenshots on failures for debugging
- **Respectful scraping** - Add delays, respect robots.txt

### Example
```typescript
// Good
async function scrapePlan(page: Page) {
  try {
    await page.waitForSelector('.plan-card', { timeout: 10000 });
    const plans = await page.$$eval('.plan-card', (cards) => {
      // extraction logic
    });
    return plans;
  } catch (error) {
    await page.screenshot({ path: 'error-screenshot.png' });
    throw error;
  }
}
```

## Comments & Documentation

### Code Comments
- **Why, not what** - Comment the reasoning, not the obvious
- **JSDoc** - Use JSDoc for public functions
- **TODO comments** - Use TODO comments for future improvements

### Example
```typescript
/**
 * Normalizes pricing strings from various formats into a number.
 * Handles formats like "£10/mo", "10 GBP per month", etc.
 *
 * @param price - Raw price string from scraped data
 * @returns Normalized price as number in GBP
 */
function normalizePrice(price: string): number {
  // implementation
}
```

## ESLint Rules

The project uses ESLint with the following key rules:
- Missing imports detection
- Unused variables and imports detection
- TypeScript best practices
- React best practices
- Next.js specific linting rules

Run `npm run lint` to check code quality.

## Git Standards

### Commit Messages
- **Clear messages** - Descriptive commit messages
- **Conventional commits** - Use conventional commit format when possible

### Branching
- **Feature branches** - Create feature branches for new work
- **Main branch** - Keep main branch deployable

## Performance Considerations

### Next.js
- **Server Components** - Use Server Components by default
- **Image optimization** - Use Next.js Image component
- **Code splitting** - Leverage automatic code splitting

### Database
- **Indexes** - Use indexes on frequently queried columns
- **Query optimization** - Avoid N+1 queries
- **Connection pooling** - Use connection pooling

## Security

### Best Practices
- **Environment variables** - Never commit secrets
- **Input validation** - Validate all user inputs
- **SQL injection** - Use parameterized queries
- **XSS prevention** - React automatically escapes, but be mindful
- **HTTPS** - Always use HTTPS (automatic with Vercel)

