/**
 * Test script to investigate Inngest Production API response format
 *
 * Purpose: Query real Inngest Cloud API to understand the data structure
 * for runs, especially step-level progress tracking.
 *
 * Usage:
 *   1. Ensure INNGEST_SIGNING_KEY is set in .env.local (production key)
 *   2. Trigger a job and get the event ID (or script will auto-load latest)
 *   3. Run: npm run test:inngest-api [event-id]
 *      - With event ID: Uses provided ID
 *      - Without event ID: Auto-loads most recent from database
 *
 * Output: Logs full JSON response to console and saves to docs/INNGEST_API_FORMAT.md
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { query } from '../lib/db/connection';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testInnggestAPI(eventId: string) {
  const signingKey = process.env.INNGEST_SIGNING_KEY;

  if (!signingKey) {
    console.error('❌ Error: INNGEST_SIGNING_KEY not found in environment');
    console.warn('\nTo fix:');
    console.warn('1. Get your signing key from https://app.inngest.com/settings/keys');
    console.warn('2. Add to .env.local: INNGEST_SIGNING_KEY=signkey-prod-...');
    process.exit(1);
  }

  console.warn('🔍 Testing Inngest API...');
  console.warn(`Event ID: ${eventId}`);
  console.warn(`API Endpoint: https://api.inngest.com/v1/events/${eventId}/runs\n`);

  try {
    const response = await fetch(
      `https://api.inngest.com/v1/events/${eventId}/runs`,
      {
        headers: {
          'Authorization': `Bearer ${signingKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.warn('✅ API Response received!\n');
    console.warn('='.repeat(80));
    console.warn('FULL RESPONSE STRUCTURE:');
    console.warn('='.repeat(80));
    console.warn(JSON.stringify(data, null, 2));
    console.warn('='.repeat(80));

    // Analyze structure
    console.warn('\n📊 ANALYSIS:');
    console.warn('='.repeat(80));

    if (data.data && Array.isArray(data.data)) {
      console.warn(`Total runs: ${data.data.length}`);

      if (data.data.length > 0) {
        const firstRun = data.data[0];
        console.warn('\nFields available in first run:');
        Object.keys(firstRun).forEach(key => {
          console.warn(`  - ${key}: ${typeof firstRun[key]} = ${JSON.stringify(firstRun[key]).substring(0, 100)}`);
        });

        // Check for progress-related fields
        console.warn('\n🔍 Progress Tracking Analysis:');
        if (firstRun.steps) {
          console.warn(`  ✓ Steps field found: ${typeof firstRun.steps}`);
          console.warn(`  ✓ Steps data:`, JSON.stringify(firstRun.steps, null, 2));
        } else {
          console.warn('  ✗ No "steps" field found');
        }

        if (firstRun.progress) {
          console.warn(`  ✓ Progress field found: ${firstRun.progress}`);
        } else {
          console.warn('  ✗ No "progress" field found');
        }

        if (firstRun.completed_steps !== undefined) {
          console.warn(`  ✓ Completed steps: ${firstRun.completed_steps}`);
        }

        if (firstRun.total_steps !== undefined) {
          console.warn(`  ✓ Total steps: ${firstRun.total_steps}`);
        }
      }
    }

    // Save to documentation
    const docPath = path.join(process.cwd(), 'docs', 'INNGEST_API_FORMAT.md');
    const docContent = `# Inngest API Response Format

Generated: ${new Date().toISOString()}
Event ID: ${eventId}

## Full Response

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

## Available Fields

${data.data && data.data.length > 0
  ? Object.keys(data.data[0]).map(key => `- \`${key}\`: ${typeof data.data[0][key]}`).join('\n')
  : 'No runs found'
}

## Progress Tracking

${data.data && data.data.length > 0 && data.data[0].steps
  ? `✓ Steps field is available\n\n\`\`\`json\n${JSON.stringify(data.data[0].steps, null, 2)}\n\`\`\``
  : '✗ No step-level progress data found'
}

## Notes

- Add your observations here
- Document any patterns discovered
- Note fields useful for UI progress tracking
`;

    fs.writeFileSync(docPath, docContent, 'utf-8');
    console.warn(`\n✅ Documentation saved to: ${docPath}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function getFirstEventFromDB(): Promise<string | null> {
  try {
    const result = await query(
      'SELECT event_id FROM inngest_events ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].event_id;
  } catch (error) {
    console.error('❌ Error fetching event from database:', error);
    return null;
  }
}

// Get event ID from command line or database
async function main() {
  const eventIdArg = process.argv[2];
  let eventId: string | null = eventIdArg || null;

  if (!eventId) {
    console.warn('No event ID provided, fetching most recent from database...\n');
    eventId = await getFirstEventFromDB();

    if (!eventId) {
      console.error('❌ Error: No events found in database');
      console.warn('\nOptions:');
      console.warn('1. Trigger a job first: http://localhost:3000/monitor');
      console.warn('2. Or provide an event ID: npm run test:inngest-api <event-id>');
      process.exit(1);
    }

    console.warn(`✓ Using most recent event: ${eventId}\n`);
  }

  // Run the test
  await testInnggestAPI(eventId);
}

// Run main
main().catch(console.error);
