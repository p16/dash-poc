# Local Database Setup

## Docker PostgreSQL Instance

This project uses a local PostgreSQL database running in Docker.

### Starting the Database

```bash
docker run -d \
  --name scraping-compare-postgres \
  -e POSTGRES_DB=scraping_compare \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -v $(pwd)/init.sql:/docker-entrypoint-initdb.d/init.sql \
  postgres:15-alpine
```

### Database Connection

The connection string is configured in `.env.local`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scraping_compare
```

### Running Migrations

After starting the Docker container, run the database migrations:

```bash
npm run migrate
```

### Verifying Connection

Test the database connection:

```bash
npm run test:db
```

### Managing the Docker Container

**Stop the database:**
```bash
docker stop scraping-compare-postgres
```

**Start the database:**
```bash
docker start scraping-compare-postgres
```

**Remove the database:**
```bash
docker rm -f scraping-compare-postgres
```

**View logs:**
```bash
docker logs scraping-compare-postgres
```

### Database Schema

The database schema is defined in `migrations/001_initial_schema.sql` and includes:

- `plans` table - Stores scraped plan data
- `analyses` table - Stores LLM-generated analysis results

See the migration file for full schema details.
