# Scrape and Compare

Competitive intelligence platform for telecom pricing analysis. Automatically scrapes SIM-only plan data from UK telco websites.

## Quick Start

### Prerequisites
- Node.js 24
- Neon PostgreSQL database
- Google Gemini API key

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `DASHBOARD_PASSWORD` - Dashboard access password

3. Test database connection:
```bash
npm run test:db
```

4. Run development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - Run ESLint
- `npm run test:db` - Test database connection
- `npm run scrape:poc` - Run O2 scraper POC

## Documentation

- Project requirements: `docs/prd.md`
- Architecture: `docs/architecture/`
- User stories: `docs/stories/`

