# Scrape and Compare

Competitive intelligence platform designed to help telecom providers make data-driven pricing and product decisions. The application automatically scrapes SIM-only plan data daily from major UK telco websites and aggregator sites, then leverages LLM-powered analysis to identify competitive gaps and opportunities.

## Features

- **Automated Data Collection**: Daily scraping of SIM-only plans from 7 UK telcos (O2, Vodafone, Sky, Tesco, Smarty, Three, Giffgaff) and 1 aggregator (Uswitch)
- **LLM-Powered Analysis**: Google Gemini 2.5 Pro integration for competitive analysis and strategic recommendations
- **Interactive Dashboard**: Web-based UI for viewing analysis results, triggering custom comparisons, and exploring plan data

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: PostgreSQL (Neon)
- **LLM**: Google Gemini 2.5 Pro API
- **Scraping**: Playwright for browser automation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Neon PostgreSQL database account
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bmad-scraparer-compare
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your configuration:
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `GEMINI_API_KEY`: Your Google Gemini API key
- `DASHBOARD_PASSWORD`: Password for dashboard access

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Shared utilities
│   │   ├── db/          # Database utilities
│   │   ├── scraping/    # Scraping modules
│   │   └── llm/         # LLM integration
│   └── types/           # TypeScript type definitions
├── docs/                 # Project documentation
├── migrations/           # Database migration files
└── tests/                # Test files
```

## Development

This project follows the BMAD (Breakthrough Method of Agile AI-driven Development) framework. Stories are tracked in `docs/stories/` and follow the epic/story structure defined in the PRD.

## License

ISC

