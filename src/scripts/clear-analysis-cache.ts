/**
 * Clear Analysis Cache
 * 
 * Deletes all cached analyses from the database.
 * Run this after updating prompts or analysis logic to force regeneration.
 */

import dotenv from 'dotenv';
import { getPool } from '../lib/db/connection';

dotenv.config({ path: '.env.local' });

async function clearAnalysisCache() {
  const pool = getPool();

  try {
    console.warn('Clearing analysis cache...');
    
    const result = await pool.query('DELETE FROM analyses');
    
    console.warn(`✓ Deleted ${result.rowCount} cached analyses`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to clear cache:', error);
    await pool.end();
    process.exit(1);
  }
}

clearAnalysisCache();
