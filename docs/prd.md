# Scrape and Compare Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Automate competitive intelligence gathering to reduce manual research time by 80%
- Enable data-driven pricing decisions backed by AI-powered comparative analysis
- Provide real-time competitive insights within 5 minutes vs current 30-60 minute manual process
- Deliver actionable recommendations for pricing, data bundles, and promotional strategies
- Establish continuous monitoring of UK telco SIM-only plan market landscape

### Background Context

The UK telecom market is highly competitive with frequent pricing changes and promotional offers. Pricing and product teams currently spend 40-60% of their time manually gathering competitive data from multiple sources, leading to delayed decision-making and reactive market positioning.

Scrape and Compare addresses this inefficiency by automating the collection of SIM-only plan data from 7 major UK telcos (O2, Vodafone, Sky, Tesco, Smarty, Three, Giffgaff) and aggregator sites (Uswitch). The platform leverages Google Gemini LLM to perform sophisticated comparative analysis, surfacing pricing gaps, feature parity issues, and strategic opportunities that would take analysts weeks to identify manually.

This PRD defines the MVP scope to validate the core value proposition: automated data collection + AI-powered insights delivered through an interactive dashboard, enabling pricing teams to shift from reactive monitoring to proactive competitive strategy.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-13 | 1.0 | Initial PRD creation from Project Brief | PM Agent (John) |
| 2025-11-13 | 1.1 | Updated telco list (7 telcos: O2, Vodafone, Sky, Tesco, Smarty, Three, Giffgaff + Uswitch); clarified hybrid approach (Playwright + API); expanded normalization for multiple data formats; updated all stories to reflect actual implementation | PM Agent (John) |

## Requirements

### Functional

**FR1**: The system shall collect SIM-only plan data from 7 UK telco sources (O2, Vodafone, Sky, Tesco, Smarty, Three, Giffgaff) capturing pricing, data allowances, contract terms, and promotional extras using Playwright browser automation or direct API calls depending on source availability.

**FR2**: The system shall collect SIM-only plan data from 1 aggregator source (Uswitch) via GraphQL API to complement direct telco data.

**FR3**: The system shall store scraped plan data in PostgreSQL database as structured JSON for querying and comparison.

**FR4**: The system shall normalize varying data formats (e.g., "Unlimited" vs "100GB", "£10/mo" vs "10 GBP per month") to enable meaningful comparison.

**FR5**: The system shall support on-demand scraping triggered manually via single command execution.

**FR6**: The system shall integrate with Google Gemini API to perform LLM-powered comparative analysis of scraped plan data.

**FR7**: The system shall generate AI-powered analysis comparing O2 plans against each competitor, identifying pricing gaps and competitive opportunities.

**FR8**: The system shall allow users to trigger custom "Brand A vs Brand B" comparative analysis on-demand via dashboard interface.

**FR9**: The system shall allow users to trigger a full analysis (O2 vs all competitors) on-demand via dashboard interface.

**FR10**: The system shall display AI-generated strategic recommendations for pricing adjustments, data bundle optimizations, and value-added extras.

**FR11**: The system shall provide a web-based dashboard showing latest scrape status, data freshness indicators, and analysis results.

**FR12**: The system shall display basic filtering and sorting capabilities for plan data in the dashboard.

**FR13**: The system shall protect dashboard access with a simple password authentication mechanism (single shared password).

**FR14**: The system shall track historical scraped data and analysis results for future use, with the dashboard displaying only the latest analysis by default (historical data retained in database but not prominently displayed in MVP).

### Non Functional

**NFR1**: The dashboard shall load within 3 seconds on modern desktop browsers.

**NFR2**: LLM analysis generation may take up to several minutes (acceptable for quality insights).

**NFR3**: The system shall achieve 95%+ data collection success rate for all 8 target sources.

**NFR4**: The system shall be deployable on Vercel free tier for frontend/backend hosting.

**NFR5**: The system shall operate within Neon PostgreSQL free tier storage and compute limits.

**NFR6**: The scraping component shall be executable as a single command suitable for local manual triggering or future GCP Cloud Scheduler automation.

**NFR7**: The system shall use HTTPS for all communications (automatic with Vercel hosting).

**NFR8**: The system shall implement ethical web scraping practices including robots.txt compliance and reasonable request intervals.

**NFR9**: The system shall support modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions).

**NFR10**: The system shall handle 1-2 concurrent users without performance degradation.

## User Interface Design Goals

### Overall UX Vision

A clean, data-focused dashboard that prioritizes quick access to competitive insights. The interface should feel like a command center for pricing intelligence—minimal friction, maximum clarity. Users should be able to trigger analysis and view results without training or documentation.

### Key Interaction Paradigms

- **One-click analysis**: Primary actions (run full analysis, compare brands) accessible via prominent CTA buttons
- **Status-first design**: Scrape freshness and system status immediately visible upon dashboard load
- **Progressive disclosure**: Show high-level insights prominently; detailed data accessible via expansion/drill-down
- **Visual comparison**: Side-by-side plan comparisons with clear visual differentiation (color coding for pricing gaps)
- **AI insights highlighted**: LLM recommendations displayed in distinct, attention-grabbing cards/sections

### Core Screens and Views

From a product perspective, the critical screens for MVP are:

1. **Dashboard Home**: Main view showing scrape status, data freshness, **latest** full analysis results, and quick-action buttons (Run Full Analysis, Custom Comparison, Trigger Scrape). Historical analysis data is retained in the database but not displayed.
2. **Analysis Results View**: Displays the most recent AI-generated comparative analysis with recommendations, organized by competitor
3. **Custom Comparison Interface**: Simple form to select Brand A vs Brand B, trigger analysis, view latest results
4. **Plan Data Table**: Sortable/filterable table view of all scraped plans for manual exploration (latest data only shown in UI)
5. **Login Screen**: Simple password entry to access dashboard

### Accessibility

**Target: None** (MVP focused on functionality; accessibility to be addressed post-MVP)

### Branding

Minimal branding for MVP. Clean, professional aesthetic using Tailwind CSS default styling with minor customizations:
- Simple color scheme: Primary action color (blue/teal), success (green for fresh data), warning (yellow for stale data), error (red for scrape failures)
- Lucide React icons for consistent iconography
- Clear typography hierarchy for readability

### Target Device and Platforms

**Web Responsive** - Desktop browsers primary (1920x1080 and 1366x768 common resolutions). Tablet usable but not optimized. Mobile not supported for MVP.

## Technical Assumptions

### Repository Structure

**Monorepo** - Single repository containing all code (Next.js application, scraping scripts, database migrations, deployment configurations)

### Service Architecture

**Monolith within Next.js** - The application is structured as a unified Next.js application with three logical components:
1. Frontend (React components with Tailwind CSS + Lucide React icons)
2. Backend API (Next.js API routes handling scraping triggers, LLM integration, database queries)
3. Scraper Module (standalone executable script for data collection, callable from API or command line)

All components deployed together on Vercel, sharing the same codebase and deployment lifecycle.

### Testing Requirements

**Unit + Integration Testing** for critical paths:
- Unit tests for data normalization logic, API route handlers
- Integration tests for scraper functionality (mocked network requests)
- Manual end-to-end testing via dashboard (no automated E2E for MVP)
- LLM integration tested manually with sample datasets

Test framework: Jest + React Testing Library
Coverage target: 60%+ for critical business logic

### Additional Technical Assumptions and Requests

**Data Collection Approach:**
- **Playwright Scraping**: For telco websites (O2, Vodafone, Sky, Tesco, Three, Giffgaff) - modern sites are JavaScript-heavy with dynamic content loading after page render
  - Headless browser execution (webkit or chromium) to wait for elements to load and capture fully-rendered DOM
  - Cookie consent handling (site-specific selectors)
  - Multiple URL support for contract length variations (e.g., O2: 1/12/24 months)
  - Modal interactions for extended plan details (e.g., Vodafone)
  - Retry logic and error handling for failed scrapes
  - Resilient selectors with fallback strategies for HTML structure changes
  - Screenshot capture on scrape failures for debugging
- **Direct API Calls**: For sources with accessible APIs
  - **Smarty**: REST API endpoint for plan data
  - **Uswitch**: GraphQL API with pagination support
  - Standard HTTP client (fetch) with proper headers and authentication

**Database Schema:**
- `plans` table: Stores scraped plan data as JSONB column with metadata (source, scrape_timestamp, plan_id)
- `analyses` table: Stores LLM-generated analysis results with references to source plans
- Indexes on scrape_timestamp and source for query performance

**LLM Integration:**
- Google Gemini 2.5 Pro API with structured prompts for consistent output
- Cache analysis results to avoid redundant API calls (reuse stored analysis if same comparison requested on same dataset)
- Prompt engineering to ensure actionable, strategic recommendations (not just data summarization)
- API key already available for use

**Environment Configuration:**
- Environment variables: `DATABASE_URL` (Neon), `GEMINI_API_KEY`, `DASHBOARD_PASSWORD`
- Separate `.env.local` for development, Vercel environment variables for production

**Data Collection Execution:**
- Single command: `npm run scrape` executes all data collectors (Playwright scrapers + API calls) sequentially
- Individual commands available: `npm run scrape:telcos`, `npm run scrape:uswitch`, `npm run scrape:poc` (for single-source testing)
- Designed for manual local triggering initially
- Future-proof for GCP Cloud Scheduler integration (simple HTTP endpoint to trigger via POST request)

**Deployment & CI/CD:**
- Vercel automatic deployments on Git push (main branch → production)
- Preview deployments for pull requests
- Database migrations run manually via SQL scripts (no automatic migration on deploy for MVP safety)

## Epic List

**Epic 1: Foundation & Web Scraping Infrastructure**
*Goal:* Establish project foundation with Next.js/Tailwind/Neon stack and deliver a working web scraper that can extract plan data from at least one target source, validating the core technical approach.

**Epic 2: Data Storage & Multi-Source Collection**
*Goal:* Implement complete database schema and extend data collection to all 8 target sources (7 telcos + 1 aggregator), ensuring reliable data collection and normalization across Playwright scrapers and API integrations.

**Epic 3: LLM Integration & Analysis Engine**
*Goal:* Integrate Google Gemini 2.5 Pro API and build the analysis engine that transforms scraped plan data into strategic competitive insights and recommendations.

**Epic 4: Interactive Dashboard & User Interface**
*Goal:* Create the web dashboard with authentication, analysis display, custom comparison tools, and plan data exploration features, delivering the complete user experience.

## Epic 1: Foundation & Web Scraping Infrastructure

**Goal:** Establish project foundation with Next.js/Tailwind/Neon stack and deliver a working web scraper that can extract plan data from at least one target source, validating the core technical approach.

### Story 1.1: Project Initialization & Development Environment Setup

**As a** developer,
**I want** a properly configured Next.js project with all required dependencies and code quality tools,
**so that** I can begin building the application on a solid foundation with best practices enforced.

**Acceptance Criteria:**

1. Next.js project initialized with TypeScript support
2. Tailwind CSS configured and functional
3. Lucide React icons package installed
4. ESLint installed and configured with rules for:
   - Missing imports detection
   - Unused variables and imports detection
   - TypeScript best practices
   - React best practices
   - Next.js specific linting rules
5. Project repository created with `.gitignore` for Node.js/Next.js
6. Environment variable setup (`.env.local` template with placeholders for `DATABASE_URL`, `GEMINI_API_KEY`, `DASHBOARD_PASSWORD`)
7. README.md with basic project description and setup instructions
8. Vercel project created and connected to GitHub repository (leveraging existing GitHub-Vercel integration, deployment not yet required)
9. `npm run lint` command executes successfully with configured rules

### Story 1.2: Neon PostgreSQL Database Connection

**As a** developer,
**I want** to establish connection to Neon PostgreSQL database,
**so that** scraped data can be stored and retrieved.

**Acceptance Criteria:**

1. New database created in existing Neon free tier account
2. `pg` (node-postgres) library installed for database connectivity
3. Database connection utility created and tested
4. Connection string (provided) configured via `DATABASE_URL` environment variable
5. Basic database connectivity test passes (can connect, run simple query)
6. Error handling for database connection failures implemented

### Story 1.3: Playwright Scraper POC for Single Telco Source

**As a** developer,
**I want** to build a proof-of-concept scraper for one telco website using Playwright,
**so that** I can validate the scraping approach works for JavaScript-heavy sites.

**Acceptance Criteria:**

1. Playwright installed and configured for headless browser execution (webkit or chromium)
2. Scraper script targets one telco website (recommend O2 or Sky as proven working examples)
3. Script successfully loads target page and waits for dynamic content to render
4. Handles cookie consent modal if present (click accept)
5. Extracts at least 3 SIM-only plan data points: pricing, data allowance, contract term
6. Handles common errors (timeout, element not found) with retry logic
7. Outputs scraped data to console as JSON or structured array
8. Script executable via `npm run scrape:poc` command
9. Basic documentation of selectors and scraping logic

### Story 1.4: Data Normalization Utility

**As a** developer,
**I want** a utility function to normalize varying data formats from different sources,
**so that** plan data (scraped arrays, structured objects, API responses) can be compared consistently.

**Acceptance Criteria:**

1. Utility function normalizes data allowances (e.g., "Unlimited", "100GB", "100 GB" → standardized format)
2. Utility function normalizes pricing (e.g., "£10/mo", "10 GBP per month", "£10 a month" → standardized format)
3. Handles multiple input formats:
   - Scraped text arrays (e.g., O2, Sky format: `["plan name", "£10", "100GB", ...]`)
   - Structured objects (e.g., Vodafone format: `{ name, description, details, extendedDetails }`)
   - API JSON responses (e.g., Smarty, Uswitch format: structured JSON with nested properties)
4. Unit tests cover common format variations across all source types
5. Function handles edge cases (null, undefined, malformed inputs, missing fields) gracefully
6. Documentation of normalization rules and assumptions per source type

## Epic 2: Data Storage & Multi-Source Collection

**Goal:** Implement complete database schema and extend data collection to all 8 target sources (7 telcos + 1 aggregator), ensuring reliable data collection and normalization across Playwright scrapers and API integrations.

### Story 2.1: Database Schema Design & Implementation

**As a** developer,
**I want** a well-designed database schema for storing plan data and analysis results,
**so that** data can be efficiently queried and maintained.

**Acceptance Criteria:**

1. `plans` table created with columns:
   - `id` (primary key)
   - `source` (text: telco name or aggregator)
   - `plan_data` (JSONB: normalized plan details)
   - `scrape_timestamp` (timestamptz: when scraped)
   - `plan_id` (text: unique identifier from source)
2. `analyses` table created with columns:
   - `id` (primary key)
   - `comparison_type` (text: "full" or "custom")
   - `brands` (text array: brands being compared)
   - `analysis_result` (JSONB: LLM-generated analysis)
   - `plan_ids` (text array: references to plan data used)
   - `created_at` (timestamptz)
3. Indexes created on `plans.scrape_timestamp`, `plans.source`, `analyses.created_at`
4. Database migration SQL script created and documented
5. Schema successfully deployed to Neon database
6. Connection pooling configured for efficient database access

### Story 2.2: Data Collectors for Remaining Telco Sources

**As a** developer,
**I want** data collectors for all 7 telco sources (O2, Vodafone, Sky, Tesco, Smarty, Three, Giffgaff),
**so that** complete competitive data can be collected.

**Acceptance Criteria:**

1. Individual collector modules created for each remaining telco (6 new + 1 from POC):
   - **Playwright scrapers**: Vodafone, Sky, Tesco, Three, Giffgaff (+ O2 from POC)
   - **API integration**: Smarty (REST API endpoint)
2. Each collector extracts: pricing, data allowance, contract term, promotional extras
3. Playwright scrapers handle:
   - Cookie consent modals (site-specific selectors)
   - Multiple contract lengths where applicable (e.g., 1/12/24 months)
   - Modal interactions for extended details (e.g., Vodafone tabs)
   - Browser selection (webkit vs chromium based on compatibility)
4. Collected data passes through normalization utility before storage
5. Each collector handles source-specific edge cases and layout variations
6. Retry logic and error handling implemented per collector
7. All collectors write data to `plans` table with proper metadata
8. Unit tests for each collector (mocked page content or API responses)
9. `npm run scrape:telcos` command runs all 7 telco collectors sequentially

### Story 2.3: API Integration for Aggregator Source (Uswitch)

**As a** developer,
**I want** to integrate with Uswitch GraphQL API for aggregator data,
**so that** aggregated market data complements direct telco sources.

**Acceptance Criteria:**

1. Uswitch API client module created using GraphQL endpoint (`https://www.uswitch.com/mobiles/graphql`)
2. Implements proper headers (user-agent, cookies, CSRF token, etc.) for API authentication
3. Fetches SIM-only plan data across multiple telcos from Uswitch listings
4. Handles pagination to retrieve complete dataset (configurable limit/offset)
5. Parses GraphQL response and extracts plan details
6. Normalized data stored in `plans` table with `source='Uswitch'`
7. Deduplication logic to handle plans appearing on both telco sites and Uswitch
8. Error handling for API failures, rate limiting, invalid responses
9. `npm run scrape:uswitch` command executes Uswitch API integration
10. Helper function `fetchAllUswitchDeals()` supports bulk data retrieval with automatic pagination

### Story 2.4: Unified Data Collection Command & Error Reporting

**As a** developer,
**I want** a single command to execute all data collectors with error reporting,
**so that** the complete collection process can be triggered easily.

**Acceptance Criteria:**

1. `npm run scrape` command executes all 8 collectors (7 telcos + 1 aggregator) sequentially:
   - Playwright scrapers: O2, Vodafone, Sky, Tesco, Three, Giffgaff
   - API integrations: Smarty, Uswitch
2. Progress logging shows which collector is running and completion status
3. Error summary report generated after all collectors complete (shows successes/failures per source)
4. Collection continues even if individual source fails (fail-safe execution)
5. Final success rate calculated and displayed (must meet 95%+ for acceptance)
6. Execution time logged for performance monitoring (per source and total)
7. Collector results saved to database with timestamps
8. Results also saved to local JSON files for debugging (e.g., `results/o2-2025-11-13T10:30:00.json`)

## Epic 3: LLM Integration & Analysis Engine

**Goal:** Integrate Google Gemini 2.5 Pro API and build the analysis engine that transforms scraped plan data into strategic competitive insights and recommendations.

### Story 3.1: Google Gemini API Integration

**As a** developer,
**I want** to integrate Google Gemini 2.5 Pro API for LLM-powered analysis,
**so that** scraped plan data can be transformed into insights.

**Acceptance Criteria:**

1. Google Gemini API SDK installed and configured
2. `GEMINI_API_KEY` environment variable loaded and validated
3. API connection utility created with error handling
4. Rate limiting logic implemented to stay within free tier quotas
5. Basic test query to Gemini API succeeds
6. Response parsing utility handles JSON and text responses
7. API errors gracefully handled with fallback messaging

### Story 3.2: Prompt Engineering for Competitive Analysis

**As a** developer,
**I want** well-engineered prompts for generating competitive analysis,
**so that** LLM outputs are actionable, strategic, and consistently formatted as JSON.

**Acceptance Criteria:**

1. **Full Analysis Prompt** (O2 vs All Competitors) created based on proven template with:
   - JSON-only output mandate (strict format, no markdown)
   - Competitiveness scoring model (0-100 scale with weighted factors: Data 40%, Roaming 15%, Extras 15%, Contract Flexibility 10%, Price 20%)
   - Required JSON structure with top-level fields:
     - `analysis_timestamp` (Europe/London timezone)
     - `currency` (GBP)
     - `overall_competitive_sentiments` (5-10 insights with score, sentiment, rationale)
     - `o2_products_analysis` (detailed per-product analysis with comparable plans, sentiments, price suggestions)
     - `full_competitive_dataset_all_plans` (flat dataset of ALL plans analyzed)
     - `products_not_considered` (justification for excluded plans)
   - O2 strategy layer analyzing position across data tiers (Low ≤20GB, Medium 21-100GB, Unlimited >100GB)
   - Conversion optimization focus
   - Instructions for handling Uswitch data (brand naming: "o2 uswitch", "vodafone uswitch", etc.)
2. **Custom Comparison Prompt** (Brand A vs Brand B) created as simplified variant:
   - Same JSON structure but focused on two-brand comparison
   - Adaptable brand placeholders (not O2-specific)
   - Maintains scoring model and competitive insights format
3. Prompts include context instructions:
   - Plan data format (pricing, allowances, contract terms, roaming, extras, speed)
   - Source file naming conventions (o2, smarty, vodafone, uswitch, etc.)
   - All contract lengths considered (30-day, 12-month, 24-month)
4. Prompts request specific outputs:
   - Pricing gap identification with specific price recommendations
   - Feature parity analysis (roaming, extras, speed tiers)
   - Strategic recommendations (pricing adjustments, data bundle changes, extras modifications)
   - Competitiveness scores for all plans
5. Prompts optimized for Gemini 2.5 Pro's JSON mode and response format
6. Test with sample plan data validates prompt effectiveness (returns valid JSON, includes all required fields)
7. Prompt templates stored in `/prompts` directory with documentation:
   - `prompt-full-analysis.txt` (O2 vs all competitors)
   - `prompt-custom-comparison.txt` (Brand A vs Brand B)
   - `README.md` explaining scoring model, JSON structure, usage examples
8. Response validation utility handles:
   - JSON parsing errors
   - Missing required fields
   - Invalid data types (e.g., scores not 0-100)
   - Fallback to re-prompt if structure invalid

### Story 3.3: Analysis Generation & Caching Logic

**As a** developer,
**I want** an analysis engine that generates and caches LLM insights,
**so that** redundant API calls are avoided and results are stored.

**Acceptance Criteria:**

1. Analysis engine function accepts: comparison type, brand(s), plan data
2. Engine checks `analyses` table for existing analysis matching criteria
3. If cached analysis found (same comparison, same plan data), return cached result
4. If no cache hit, call Gemini API with appropriate prompt + plan data
5. Parse and validate LLM response
6. Store analysis result in `analyses` table with metadata
7. Return analysis to caller
8. Error handling for API failures, timeouts, invalid responses
9. Unit tests with mocked Gemini API responses

### Story 3.4: API Endpoints for Triggering Analysis

**As a** developer,
**I want** Next.js API routes for triggering analysis operations,
**so that** the dashboard can request LLM insights on demand.

**Acceptance Criteria:**

1. `POST /api/analysis/full` endpoint created (triggers O2 vs all competitors)
2. `POST /api/analysis/custom` endpoint created (accepts brandA, brandB in request body)
3. Endpoints validate request parameters
4. Endpoints fetch latest plan data from database
5. Endpoints call analysis engine with appropriate data
6. Endpoints return analysis results as JSON
7. Loading states handled (analysis can take minutes)
8. Error responses with meaningful messages for failures
9. Rate limiting applied to prevent abuse

## Epic 4: Interactive Dashboard & User Interface

**Goal:** Create the web dashboard with authentication, analysis display, custom comparison tools, and plan data exploration features, delivering the complete user experience.

### Story 4.1: Simple Password Authentication

**As a** user,
**I want** a password-protected login screen,
**so that** only authorized users can access the dashboard.

**Acceptance Criteria:**

1. Login page created with password input field
2. Password validated against `DASHBOARD_PASSWORD` environment variable
3. Successful login creates session (cookie or JWT)
4. Session persists across page refreshes
5. Unauthorized users redirected to login page
6. Logout functionality clears session
7. Simple, clean UI with Tailwind CSS styling

### Story 4.2: Dashboard Home Screen

**As a** user,
**I want** a dashboard home screen showing scrape status and latest analysis,
**so that** I can quickly see current competitive intelligence.

**Acceptance Criteria:**

1. Dashboard displays latest scrape timestamp and data freshness indicator
2. Status indicators show: green (data <24 hours), yellow (24-48 hours), red (>48 hours)
3. Latest full analysis results displayed prominently
4. Quick-action buttons visible: "Run Full Analysis", "Custom Comparison", "Trigger Scrape"
5. Loading states for async operations
6. Responsive layout using Tailwind CSS
7. Lucide React icons for visual clarity

### Story 4.3: Analysis Results Display

**As a** user,
**I want** to view AI-generated competitive analysis with recommendations,
**so that** I can understand competitive positioning and opportunities.

**Acceptance Criteria:**

1. Analysis results view displays structured LLM output
2. Results organized by competitor with clear sections:
   - Pricing gaps
   - Feature parity
   - Strategic recommendations
3. Recommendations highlighted in distinct card/section
4. Expandable/collapsible sections for detailed data
5. Visual differentiation for positive/negative insights (color coding)
6. Analysis metadata shown: timestamp, brands compared
7. Clean, readable typography with proper hierarchy

### Story 4.4: Custom Brand Comparison Tool

**As a** user,
**I want** to select two brands and trigger custom comparison analysis,
**so that** I can explore specific competitive matchups on demand.

**Acceptance Criteria:**

1. Form with two dropdowns to select Brand A and Brand B
2. Dropdowns populated with available telco brands from scraped data
3. "Compare" button triggers custom analysis API call
4. Loading indicator while analysis generates
5. Results displayed in analysis results view format
6. Error handling for failed analysis requests
7. Form validation prevents selecting same brand twice

### Story 4.5: Plan Data Table & Filtering

**As a** user,
**I want** to browse and filter all scraped plan data,
**so that** I can manually explore competitor offerings.

**Acceptance Criteria:**

1. Table displays all latest scraped plans with columns:
   - Source (telco/aggregator)
   - Price
   - Data Allowance
   - Contract Term
   - Extras
2. Sortable columns (click header to sort)
3. Filter by source (dropdown or checkboxes)
4. Filter by price range (min/max inputs)
5. Only latest scrape data shown (historical data not displayed)
6. Pagination if plan count exceeds reasonable limit (e.g., 50+ plans)
7. Responsive table layout

### Story 4.6: Trigger Scrape from Dashboard

**As a** user,
**I want** to manually trigger scraping from the dashboard,
**so that** I can refresh plan data on demand.

**Acceptance Criteria:**

1. "Trigger Scrape" button visible on dashboard home
2. Button triggers Next.js API endpoint that executes scraping command
3. Loading indicator shows scraping in progress
4. Progress updates (if possible) or estimated completion time shown
5. Success message displays when scraping completes
6. Dashboard data refreshes to show newly scraped plans
7. Error handling for scraping failures with descriptive messages
8. Button disabled while scraping is running (prevent duplicate runs)

## Next Steps

### Immediate Actions

1. **Review and Approve PRD**: Stakeholders review this document and provide final feedback
2. **Set Up Development Environment**: Execute Story 1.1 (project initialization)
3. **Create Database**: Set up new database in Neon account and obtain connection string
4. **Verify API Access**: Confirm Gemini 2.5 Pro API key is functional
5. **Begin Epic 1 Development**: Start with Story 1.1 and proceed sequentially through Epic 1

### Handoff to Development

This PRD provides complete specification for the **Scrape and Compare MVP**. The development team should:

- Follow the epic/story sequence as defined (Epics 1→2→3→4)
- Reference the Technical Assumptions section for architecture decisions
- Validate acceptance criteria for each story before marking complete
- Maintain the Project Brief (`docs/brief.md`) as context for product decisions
- Update this PRD's Change Log for any significant requirement changes

### Success Criteria

The MVP is ready for user testing when:
- All 4 epics completed with acceptance criteria validated
- Data collection achieves 95%+ success rate across all 8 sources (7 telcos + 1 aggregator)
- LLM analysis generates valuable insights (validated by 1-2 test users)
- Dashboard functional with all core features (login, analysis display, custom comparison, plan table)
- Application deployed to Vercel and accessible via HTTPS

---

**🎉 PRD Complete!**

This document is ready for development. For questions or clarifications, contact the PM Agent (John).






