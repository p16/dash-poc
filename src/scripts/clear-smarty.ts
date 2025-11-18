/**
 * Clear Smarty plans for testing
 */

import * as dotenv from 'dotenv';
import { getPool } from '../lib/db/connection';

dotenv.config({ path: '.env.local' });

const pool = getPool();

async function clearSmarty() {
  console.log('Deleting Smarty plans...');
  await pool.query('DELETE FROM plans WHERE source = $1', ['Smarty']);
  console.log('✅ Deleted Smarty plans');
  await pool.end();
}

clearSmarty().catch(console.error);
