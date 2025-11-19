/**
 * Clear All Scraped Plans
 * 
 * Deletes all plan data from the database.
 * Run this to start fresh with new scraping data.
 */

import dotenv from 'dotenv';
import { getPool } from '../lib/db/connection';

dotenv.config({ path: '.env.local' });

async function clearAllPlans() {
  const pool = getPool();

  try {
    console.warn('Clearing all scraped plan data...');
    
    const result = await pool.query('DELETE FROM plans');
    
    console.warn(`✓ Deleted ${result.rowCount} plans`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to clear plans:', error);
    await pool.end();
    process.exit(1);
  }
}

clearAllPlans();
