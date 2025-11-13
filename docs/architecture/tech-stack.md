# Technology Stack

## Overview

This document defines the technology stack for the Scrape and Compare application, a Next.js-based competitive intelligence platform for telecom pricing analysis.

## Frontend

### Core Framework
- **Next.js** (App Router) - Full-stack React framework
- **TypeScript** - Type-safe JavaScript
- **React** - UI library (via Next.js)

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Data Visualization
- **Chart.js** or **Recharts** - For plan comparison visualizations

## Backend

### API Layer
- **Next.js API Routes** - Serverless API endpoints
- **TypeScript** - Type-safe backend code

### Database
- **PostgreSQL** (Neon) - Serverless PostgreSQL database
- **node-postgres (`pg`)** - PostgreSQL client library
- **JSONB** - For storing flexible plan data structures

## Data Collection

### Web Scraping
- **Playwright** - Browser automation for JavaScript-heavy sites
  - Headless browser execution (webkit or chromium)
  - Cookie consent handling
  - Modal interactions
  - Screenshot capture for debugging

### API Integration
- **fetch** - Native HTTP client for API calls
- **GraphQL** - For Uswitch aggregator integration

## LLM Integration

- **Google Gemini 2.5 Pro API** - For competitive analysis generation
- Structured JSON output with prompt engineering

## Testing

- **Jest** - Test framework
- **React Testing Library** - Component testing
- Coverage target: 60%+ for critical business logic

## Code Quality

- **ESLint** - Linting with rules for:
  - Missing imports detection
  - Unused variables and imports detection
  - TypeScript best practices
  - React best practices
  - Next.js specific linting rules

## Deployment & Infrastructure

### Hosting
- **Vercel** - Next.js optimized hosting (free tier)
  - Automatic deployments on Git push
  - Preview deployments for pull requests

### Database Hosting
- **Neon** - Serverless PostgreSQL (free tier)

### Future Automation
- **GCP Cloud Scheduler** - For scheduled scraping (post-MVP)

## Environment Variables

Required environment variables:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `DASHBOARD_PASSWORD` - Simple password authentication

## Package Management

- **npm** - Node package manager

## Development Tools

- **TypeScript** - Type checking
- **ESLint** - Code linting
- **Git** - Version control

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- Desktop primary (1920x1080, 1366x768)
- Tablet usable but not optimized
- Mobile not supported for MVP

