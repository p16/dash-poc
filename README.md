# Scrape and Compare

Competitive intelligence platform for telecom pricing analysis. Automatically scrapes SIM-only plan data from UK telco websites.

## Quick Start

### Prerequisites
- Node.js 22+
- Neon PostgreSQL database
- Google Gemini API key
- Browserless account (for production scraping)
- Inngest account (for background jobs)

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
- `INNGEST_EVENT_KEY` - Inngest event key
- `INNGEST_SIGNING_KEY` - Inngest signing key
- `BROWSERLESS_TOKEN` - Browserless API token (optional for local, required for production)

3. Run database migrations:
```bash
npm run migrate
```

4. Test database connection:
```bash
npm run test:db
```

5. Run development server:
```bash
npm run dev
```

6. Start Inngest dev server (in separate terminal):
```bash
npx inngest-cli@latest dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Production Deployment

### Vercel Setup

1. **Environment Variables**: Add to Vercel project settings:
   - `DATABASE_URL` - Neon production database URL
   - `GEMINI_API_KEY` - Google Gemini API key
   - `DASHBOARD_PASSWORD` - Dashboard access password
   - `INNGEST_EVENT_KEY` - Inngest production event key
   - `INNGEST_SIGNING_KEY` - Inngest production signing key
   - `BROWSERLESS_TOKEN` - Browserless cloud API token

2. **Inngest Configuration**:
   - Get production URL from Vercel (e.g., `https://your-app.vercel.app`)
   - In Inngest Cloud Dashboard, set webhook: `https://your-app.vercel.app/api/inngest`

3. **Deploy**:
   ```bash
   git push origin main
   ```
   Vercel will automatically deploy.

### Architecture Notes

- **Scraping**: Uses Browserless cloud browsers in production (serverless-compatible)
- **Background Jobs**: Inngest handles scraping jobs asynchronously
- **Database**: Neon PostgreSQL with connection pooling
- **LLM Analysis**: Google Gemini for competitive intelligence

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - Run ESLint
- `npm run test` - Run test suite
- `npm run test:coverage` - Generate coverage report
- `npm run migrate` - Run database migrations
- `npm run scrape:poc` - Test O2 scraper
- `npm run scrape:telcos` - Scrape all telcos

## Documentation

- Project requirements: `docs/prd.md`
- Architecture: `docs/architecture/`
- User stories: `docs/stories/`
- Project status: `docs/PROJECT_STATUS.md`

