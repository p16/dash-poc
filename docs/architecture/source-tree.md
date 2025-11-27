# Source Tree Structure

## Overview

This document defines the expected directory structure for the Scrape and Compare monorepo. The project follows a Next.js App Router structure with co-located scraping scripts and shared utilities.

## Root Directory

```
bmad-scraparer-compare/
├── .bmad-core/              # BMAD framework configuration
├── .ai/                     # AI debug logs
├── .env.local               # Local environment variables (gitignored)
├── .gitignore               # Git ignore rules
├── docs/                    # Project documentation
│   ├── architecture/        # Architecture documentation
│   │   ├── coding-standards.md
│   │   ├── tech-stack.md
│   │   └── source-tree.md
│   ├── brief.md            # Project brief
│   ├── prd.md              # Product Requirements Document
│   ├── stories/            # User stories (created during development)
│   └── qa/                 # QA documentation
├── public/                  # Static assets
├── src/                     # Source code (or root if using Next.js default)
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Auth routes (login)
│   │   │   └── login/
│   │   ├── api/            # API routes
│   │   │   ├── analysis/   # Analysis endpoints
│   │   │   │   ├── full/   # POST /api/analysis/full
│   │   │   │   └── custom/ # POST /api/analysis/custom
│   │   │   ├── plans/      # Plan data endpoints
│   │   │   └── scrape/     # Scraping trigger endpoint
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   │   ├── PlansContent.tsx    # Plan filtering wrapper
│   │   │   ├── PlanFilterBar.tsx   # Filter controls
│   │   │   └── PlanDataTable.tsx   # Plan data table
│   │   └── analysis/       # Analysis display components
│   ├── lib/                # Shared utilities
│   │   ├── db/             # Database utilities
│   │   │   ├── connection.ts
│   │   │   └── queries.ts
│   │   ├── scraping/       # Scraping utilities
│   │   │   ├── collectors/ # Individual scrapers
│   │   │   │   ├── o2.ts
│   │   │   │   ├── vodafone.ts
│   │   │   │   ├── sky.ts
│   │   │   │   ├── tesco.ts
│   │   │   │   ├── smarty.ts
│   │   │   │   ├── three.ts
│   │   │   │   ├── giffgaff.ts
│   │   │   │   └── uswitch.ts
│   │   │   ├── normalize.ts # Data normalization
│   │   │   └── index.ts     # Main scraping entry point
│   │   ├── llm/            # LLM integration
│   │   │   ├── gemini.ts   # Gemini API client
│   │   │   ├── prompts/    # Prompt templates
│   │   │   │   ├── prompt-full-analysis.txt
│   │   │   │   └── prompt-custom-comparison.txt
│   │   │   └── analysis.ts # Analysis engine
│   │   └── utils/          # General utilities
│   ├── types/              # TypeScript type definitions
│   │   ├── plan.ts         # Plan data types
│   │   ├── analysis.ts     # Analysis result types
│   │   └── database.ts     # Database schema types
│   └── scripts/            # Standalone scripts
│       └── scrape.ts       # Main scraping script (executable)
├── results/                # Local scraping results (gitignored)
├── migrations/             # Database migration SQL files
├── tests/                  # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── __mocks__/          # Mock data
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── next.config.js          # Next.js configuration
├── jest.config.js          # Jest configuration
├── .eslintrc.json          # ESLint configuration
└── README.md               # Project README
```

## Key Directories Explained

### `/src/app/`
Next.js App Router directory containing:
- **Pages** - Route components (dashboard, login, etc.)
- **API Routes** - Serverless API endpoints
- **Layouts** - Shared layout components

### `/src/components/`
React components organized by feature:
- **ui/** - Reusable UI primitives (buttons, cards, tables)
- **dashboard/** - Dashboard-specific components
  - `PlansContent.tsx` - Client wrapper for plan filtering/sorting/export
  - `PlanFilterBar.tsx` - Filter controls and export button
  - `PlanDataTable.tsx` - Sortable plan data table
- **analysis/** - Analysis display components

### `/src/lib/`
Shared library code:
- **db/** - Database connection and query utilities
- **scraping/** - All scraping-related code
  - **collectors/** - Individual scraper implementations
  - **normalize.ts** - Data normalization utilities
- **llm/** - LLM integration and analysis engine
- **utils/** - General utility functions

### `/src/lib/scraping/collectors/`
Individual scraper modules for each data source:
- Playwright scrapers: `o2.ts`, `vodafone.ts`, `sky.ts`, `tesco.ts`, `three.ts`, `giffgaff.ts`
- API integrations: `smarty.ts`, `uswitch.ts`

### `/src/lib/llm/prompts/`
Prompt template files for LLM analysis:
- `prompt-full-analysis.txt` - O2 vs all competitors
- `prompt-custom-comparison.txt` - Brand A vs Brand B

### `/src/scripts/`
Standalone executable scripts:
- `scrape.ts` - Main scraping entry point (runs all collectors)

### `/migrations/`
SQL migration files for database schema changes:
- Manual migrations (no automatic migration on deploy for MVP)

### `/tests/`
Test files organized by type:
- **unit/** - Unit tests for utilities, functions
- **integration/** - Integration tests for API routes, scrapers
- **__mocks__/** - Mock data and functions

### `/results/`
Local scraping results (gitignored):
- JSON files with scrape results for debugging
- Format: `{source}-{timestamp}.json`

## File Naming Conventions

### Components
- **PascalCase** - `PlanTable.tsx`, `AnalysisCard.tsx`
- **Co-located styles** - If needed, use CSS modules: `PlanTable.module.css`

### Utilities
- **camelCase** - `normalizePrice.ts`, `dbConnection.ts`
- **Barrel exports** - Use `index.ts` for clean imports

### API Routes
- **kebab-case directories** - `api/analysis/full/route.ts`
- **route.ts** - Next.js App Router convention

### Types
- **PascalCase** - `Plan.ts`, `AnalysisResult.ts`
- **Co-locate or centralize** - Based on usage scope

## Import Paths

### Absolute Imports (Recommended)
Configure TypeScript/Next.js to support `@/` alias:
```typescript
import { normalizePrice } from '@/lib/utils';
import { PlansContent } from '@/components/dashboard/PlansContent';
import { PlanFilterBar } from '@/components/dashboard/PlanFilterBar';
```

### Relative Imports
Use for closely related files:
```typescript
import { PlanCard } from './PlanCard';
```

## Environment Files

### `.env.local` (Development)
```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
DASHBOARD_PASSWORD=...
```

### Vercel Environment Variables (Production)
Set via Vercel dashboard, same variable names.

## Database Schema Location

Database schema is defined in:
- **Migration files** - `/migrations/` directory
- **Type definitions** - `/src/types/database.ts` (TypeScript types matching schema)

## Documentation Location

- **Architecture docs** - `/docs/architecture/`
- **PRD** - `/docs/prd.md`
- **Stories** - `/docs/stories/` (created during development)
- **QA docs** - `/docs/qa/`

## Build Output

- **`.next/`** - Next.js build output (gitignored)
- **`node_modules/`** - Dependencies (gitignored)
- **`.vercel/`** - Vercel deployment config (gitignored)

## Notes

- This is a **monorepo** - All code in single repository
- **No separate packages** - Everything is part of the Next.js app
- **Scraping scripts** - Can be run standalone or via API endpoint
- **Future-proof** - Structure allows for easy extension (e.g., separate scraping service)

