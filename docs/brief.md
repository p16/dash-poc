# Project Brief: Scrape and Compare

## Executive Summary

**Scrape and Compare** is a competitive intelligence platform designed to help telecom providers (initially O2) make data-driven pricing and product decisions. The application automatically scrapes SIM-only plan data daily from major UK telco websites (Vodafone, O2, Sky, Giffgaff, Three, etc.) and aggregator sites (Uswitch), then leverages LLM-powered analysis to identify competitive gaps and opportunities.

Users across product management, pricing, and marketing teams can access an interactive dashboard to view AI-generated comparative analyses between O2 and competitors, receiving actionable recommendations on pricing strategies, data bundle configurations, and value-added extras to enhance market competitiveness.

The platform solves the time-consuming manual research problem by automating competitive monitoring and transforming raw market data into strategic insights, enabling faster, more informed decision-making in the dynamic telecom pricing landscape.

## Problem Statement

**Current State & Pain Points:**

Telecom pricing teams currently spend significant hours manually visiting competitor websites, aggregator platforms, and comparing SIM-only plan offerings. This manual research involves:
- Visiting 5-10+ different websites regularly
- Copying data into spreadsheets
- Attempting to normalize different presentation formats
- Identifying trends and competitive positioning manually
- Repeating this process whenever market conditions change

**Impact of the Problem:**

This inefficiency results in:
- **Delayed decision-making**: By the time manual analysis is complete, market conditions may have shifted
- **Incomplete competitive view**: Manual processes often miss plan updates or new competitor offerings
- **Resource waste**: Analysts spend 40-60% of their time on data gathering rather than strategic thinking
- **Reactive positioning**: Without real-time insights, pricing decisions lag behind market movements

**Why Existing Solutions Fall Short:**

Current approaches have limitations:
- **Manual research**: Time-consuming, error-prone, not scalable
- **Aggregator sites**: Show consumer view but lack deep competitive analysis or strategic recommendations
- **Generic BI tools**: Require manual data input and don't provide AI-powered insights
- **One-off consultancy reports**: Expensive, quickly outdated, not actionable in real-time

**Urgency & Importance:**

The UK telecom market is highly competitive with frequent pricing changes and promotional offers. Scrape and Compare addresses the critical need for continuous, automated competitive intelligence that enables proactive rather than reactive market positioning.

## Proposed Solution

**Core Concept:**

Scrape and Compare automates competitive intelligence by combining three key capabilities:

1. **Automated Data Collection**: Intelligent web scrapers run daily (and on-demand) to extract SIM-only plan details from telco websites and aggregator platforms, capturing pricing, data allowances, contract terms, and promotional extras.

2. **LLM-Powered Analysis**: Large Language Model technology processes the scraped data to perform sophisticated comparative analysis, identifying pricing gaps, feature parity issues, and competitive opportunities that would be difficult to spot manually.

3. **Interactive Dashboard**: A centralized visualization platform presents analysis results, allows users to trigger specific brand-vs-brand comparisons (e.g., "O2 vs Three"), and displays AI-generated strategic recommendations.

**Key Differentiators:**

- **Automation + Intelligence**: Unlike aggregator sites (consumer-focused) or manual research (slow), we combine automated collection with AI-driven strategic insights
- **Actionable Recommendations**: Not just data visualization—the LLM suggests specific pricing adjustments, bundle optimizations, and competitive moves
- **Flexible Analysis**: Users can run custom comparisons on-demand rather than waiting for scheduled reports
- **Continuous Monitoring**: Daily scraping ensures insights are always current, not based on outdated snapshots

**Why This Will Succeed:**

Traditional solutions separate data gathering (manual or basic scraping) from analysis (human analysts). Scrape and Compare integrates the entire workflow, leveraging LLM capabilities to surface insights that humans would miss or take weeks to identify. The platform transforms reactive competitive monitoring into proactive strategic advantage.

## Target Users

### Primary User Segment: Pricing & Product Managers

**Profile:**
- Mid-to-senior level professionals in telecom product/pricing teams
- Responsible for SIM-only plan strategy and competitive positioning
- Tech-savvy but not necessarily technical; comfortable with dashboards and analytics tools
- Work in fast-paced environments requiring quick decision-making

**Current Behaviors & Workflows:**
- Manually research competitor pricing weekly or bi-weekly
- Create comparison spreadsheets and presentations for stakeholders
- Attend competitive review meetings with limited data freshness
- React to market changes after they've already impacted customer acquisition

**Specific Needs & Pain Points:**
- Need current competitive data without manual website visits
- Want to understand "why" behind competitor pricing moves, not just "what"
- Require quick answers to ad-hoc questions ("How does our £10/month plan compare to Three?")
- Struggle to justify pricing recommendations without comprehensive competitive context

**Goals:**
- Make data-driven pricing decisions with confidence
- Respond to competitive threats within hours, not weeks
- Present compelling cases to leadership backed by AI-powered insights
- Focus time on strategy rather than data collection

### Secondary User Segment: Marketing & Sales Teams

**Profile:**
- Marketing strategists and sales enablement professionals
- Need competitive intelligence to craft campaigns and sales materials
- Less focused on pricing mechanics, more on value proposition and positioning

**Current Behaviors & Workflows:**
- Rely on product team summaries or outdated competitive battle cards
- Manually check competitor websites before major campaigns
- Create messaging based on incomplete competitive understanding

**Specific Needs & Pain Points:**
- Need simple competitive comparisons to support campaign messaging
- Want to identify O2's strengths vs specific competitors
- Require up-to-date information for sales teams in the field

**Goals:**
- Quickly access competitive talking points
- Validate campaign angles against current market reality
- Equip sales teams with confident, accurate competitive positioning

## Goals & Success Metrics

### Business Objectives

- **Reduce competitive research time by 80%**: From ~8 hours/week manual work to <2 hours using the platform
- **Increase pricing decision velocity by 3x**: Enable pricing changes within 48 hours of competitive moves vs current 1-2 weeks
- **Improve competitive coverage**: Monitor 100% of major UK telcos and top 3 aggregators daily vs current sporadic manual checks
- **Enable data-driven decisions**: 90% of pricing decisions backed by platform insights within 6 months of launch

### User Success Metrics

- **Daily Active Users (DAU)**: 70%+ of pricing/product team members use platform at least 3x/week
- **Time to Insight**: Users can answer competitive questions in <5 minutes vs 30-60 minutes manually
- **Analysis Utilization**: 80% of generated LLM analyses are acted upon or shared with stakeholders
- **User Satisfaction**: NPS score of 50+ among primary users within 3 months

### Key Performance Indicators (KPIs)

- **Data Freshness**: 95%+ scraping success rate with data <24 hours old
- **Analysis Accuracy**: LLM recommendations validated as "valuable" or "highly valuable" by users 85%+ of the time
- **Platform Engagement**: Average 5+ custom comparisons run per user per week
- **Business Impact**: At least 2 documented pricing decisions influenced by platform insights within first quarter
- **System Reliability**: 99%+ uptime for dashboard and scraping infrastructure

## MVP Scope

### Core Features (Must Have)

- **Web Scraping Engine:** Automated daily scraping of SIM-only plans from 5 major UK telcos (O2, Vodafone, Three, Sky, Giffgaff) and 1 aggregator site (Uswitch). Captures pricing, data allowances, contract terms, and promotional extras. Includes on-demand refresh capability.

- **Data Storage & Normalization:** Structured database to store scraped plan data with historical tracking. Normalizes varying formats (e.g., "Unlimited" vs "100GB") for meaningful comparison.

- **LLM-Powered Analysis Engine:** Integration with Google Gemini API to process scraped data and generate comparative analyses. Produces insights on pricing gaps, feature parity, and strategic recommendations for O2 vs each competitor.

- **Interactive Dashboard:** Web-based UI displaying:
  - Latest scrape status and data freshness indicators
  - Pre-generated daily analysis comparing O2 to all competitors
  - Custom comparison tool allowing users to select "Brand A vs Brand B" analysis on-demand
  - AI-generated recommendations displayed prominently
  - Basic filtering/sorting of plan data

- **Dashboard Access Control:** Simple password-protected access to secure the dashboard (single shared password for MVP simplicity).

### Out of Scope for MVP

- Multi-user authentication system with individual accounts
- Multi-tenant architecture (supporting multiple telco clients)
- Historical trend analysis and time-series visualizations
- Automated alerting/notifications when competitors change pricing
- Advanced dashboard customization or saved views
- Mobile app or responsive mobile optimization
- Integration with existing pricing/CRM systems
- Detailed plan feature comparison (roaming, add-ons beyond basics)
- Scraping of handset/contract plans (SIM-only focus only)
- API access for third-party tools
- White-label or customizable branding

### MVP Success Criteria

The MVP is considered successful when:
1. **Scraping works reliably**: 95%+ success rate for all 6 target sources over 2 consecutive weeks
2. **LLM provides value**: Users rate at least 70% of AI analyses as "useful" or better in initial feedback
3. **Adoption achieved**: 5+ users actively use the platform 3+ times per week within 4 weeks of launch
4. **Speed validated**: Users confirm they can get competitive insights in <5 minutes vs previous manual methods
5. **Business value demonstrated**: At least 1 concrete pricing decision influenced by platform insights within 8 weeks

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Web application (desktop browsers primary; tablet acceptable, mobile not optimized for MVP)
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- **Performance Requirements:**
  - Dashboard loads in <3 seconds
  - Custom LLM analysis can take a few minutes (acceptable for quality insights)
  - Scraping operations run in background without blocking UI

### Technology Preferences

**Frontend:**
- Next.js for full-stack application (frontend + backend API routes)
- Tailwind CSS for styling
- Lucide React for icons
- Data visualization library for plan comparisons (Chart.js, Recharts, or similar)

**Backend:**
- Next.js API routes for backend logic
- Scraping task designed as single executable command for GCP Cloud Scheduler or similar cron services
- Scheduled automation via GCP Cloud Tasks/Cloud Scheduler for daily scraping

**Database:**
- PostgreSQL hosted on Neon
- Store scraped data as JSON (not raw HTML)
- Schema optimized for plan comparison queries and historical tracking

**LLM Integration:**
- Google Gemini API integration
- Prompt engineering for consistent, high-quality analysis output
- Rate limiting and cost management for API calls

**Hosting/Infrastructure:**
- Frontend/Backend: Vercel (Next.js optimized hosting)
- Database: Neon (serverless Postgres)
- Scraping automation: GCP Cloud Scheduler/Tasks
- Environment variable management for API keys and passwords

### Architecture Considerations

**Repository Structure:**
- Monorepo - single repository containing all code (Next.js app + scraping scripts)

**Service Architecture:**
- Monolith approach for MVP
- Main components: Next.js web app (frontend + API), standalone scraper script, Postgres database

**Integration Requirements:**
- GCP Cloud Scheduler for triggering daily scraping tasks
- Neon Postgres connection from both Next.js app and scraper script
- Google Gemini API integration

**Security/Compliance:**
- HTTPS enforced (automatic with Vercel)
- Environment variable management for API keys, database credentials, and dashboard password
- Basic rate limiting on API routes to prevent abuse
- Ethical web scraping practices (robots.txt compliance, reasonable request intervals)
- Data privacy: No PII collection, competitive data only

## Constraints & Assumptions

### Constraints

**Budget:**
- **Free tier only**: Vercel free tier and Neon free tier (no paid plans)
- Gemini API costs must stay within free/minimal tier limits (prompt optimization critical)
- No budget for additional paid services

**Timeline:**
- Target MVP delivery: 8-12 weeks from project start
- Initial user testing available by week 10
- Assumes single developer or small team (1-2 people)

**Resources:**
- Development: 1-2 developers (full-stack Next.js experience preferred)
- No dedicated DevOps (leveraging Vercel/Neon managed services)
- Limited design resources (using Tailwind + Lucide for clean, functional UI)
- **Testing users: 1-2 people only** (minimal user base for MVP validation)
- No dedicated QA team (developer testing + minimal user feedback)

**Technical:**
- Vercel free tier limits: Serverless function execution time, bandwidth, build minutes
- Neon free tier limits: Storage capacity, compute hours
- **Manual scraping trigger initially** (GCP Cloud Scheduler not required for MVP - run scraping command locally as needed)
- Scraping dependent on target websites maintaining stable structure
- Rate limits from target websites may restrict scraping frequency
- Gemini API rate limits and quotas
- No access to private/authenticated competitor data (public websites only)

### Key Assumptions

- Target telco websites are scrapable without legal violations (publicly available pricing data)
- Website structures won't change drastically during MVP development
- Gemini API can provide valuable strategic insights (not just data summarization)
- **1-2 test users are sufficient** for initial MVP validation and feedback
- Manual scraping trigger is acceptable for MVP (daily automation can be added later if needed)
- Simple password protection is acceptable security for MVP
- Vercel + Neon free tiers can handle expected minimal load (1-2 concurrent users max)
- Scraped data accuracy of 90%+ achievable with reasonable effort
- Single-command scraper executable works reliably when triggered manually

## Risks & Open Questions

### Key Risks

- **Website Structure Changes**: Target websites may redesign or restructure, breaking scrapers. *Impact: High - core functionality fails.* Mitigation: Build flexible scrapers with error handling; plan for maintenance time.

- **Scraping Detection/Blocking**: Websites may detect automated scraping and block requests. *Impact: High - no data collection.* Mitigation: Implement polite scraping (delays, user agents); respect robots.txt; consider fallback sources.

- **Free Tier Limitations**: Vercel/Neon free tiers may be insufficient as data grows. *Impact: Medium - forced upgrade or performance degradation.* Mitigation: Monitor usage closely; optimize queries and storage; delete old analysis records as needed to manage storage.

- **LLM Quality Inconsistency**: Gemini may provide inconsistent or low-quality analysis. *Impact: Medium - users lose trust in recommendations.* Mitigation: Extensive prompt engineering; validation testing; human review initially.

- **Legal/ToS Violations**: Scraping may violate website Terms of Service. *Impact: High - legal exposure, forced shutdown.* Mitigation: Legal review recommended; focus on publicly available data; consider data partnerships.

- **Low User Adoption**: With only 1-2 test users, feedback may be insufficient or biased. *Impact: Medium - build wrong features.* Mitigation: Conduct structured testing sessions; seek diverse feedback sources.

### Open Questions

- What is the legal status of scraping these specific telco websites? (Recommend legal consultation)
- How frequently do target websites update their plan data? (Affects scraping cadence needs)
- What specific LLM prompt patterns produce the most valuable competitive insights?
- Will manual scraping be sustainable long-term or is automation critical?
- Are there existing data partnerships or APIs that could supplement/replace scraping?
- What is the actual user workflow once they have the analysis? (Influences dashboard UX)
- What retention policy for historical data? (Initially run scraping/analysis sparingly; can delete old records to stay within free tier limits)

### Areas Needing Further Research

- **Scraping Technical Feasibility**: Proof-of-concept scraping for each target website to validate structure and success rate
- **Gemini Prompt Engineering**: Experimentation to determine optimal prompts for competitive analysis quality
- **Free Tier Capacity Planning**: Calculate expected data volumes and validate against Vercel/Neon limits with data cleanup strategy
- **Competitive Landscape**: Research if similar tools exist (pricing intelligence platforms) and how they handle scraping
- **User Workflow Analysis**: Shadow 1-2 target users through current manual process to identify key pain points

## Next Steps

### Immediate Actions

1. **Legal Review**: Consult legal counsel or research ToS for target websites to validate scraping legality
2. **Scraping PoC**: Build proof-of-concept scrapers for 2-3 target websites to validate technical feasibility and data structure
3. **Gemini API Setup**: Create Google Cloud account, enable Gemini API, test basic prompt/response flow
4. **Tech Stack Setup**: Initialize Next.js project with Tailwind CSS, Lucide React, and Neon database connection
5. **User Interview**: Conduct structured interview with 1-2 target users to validate problem statement and gather workflow insights

### PM Handoff

This Project Brief provides the complete context for **Scrape and Compare**. The next step is to create a detailed Product Requirements Document (PRD) that will:

- Define specific functional and non-functional requirements
- Map out user interface design goals and core screens
- Break down the MVP into epics and user stories with acceptance criteria
- Provide technical assumptions and guidance for the Architecture team
- Include a validation checklist to ensure readiness for development

**Recommended next action**: Start PRD creation using the `prd-tmpl.yaml` template, referencing this brief as the foundational input.

