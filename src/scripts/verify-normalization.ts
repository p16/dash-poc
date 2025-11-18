/**
 * Verify Normalization Integration
 *
 * Checks that plan_key and normalized fields are properly populated
 */

import * as dotenv from 'dotenv';
import { getPool } from '../lib/db/connection';

dotenv.config({ path: '.env.local' });

const pool = getPool();

async function verifyNormalization() {
  console.log('\n🔍 Verifying Normalization Integration\n');
  console.log('='.repeat(80));

  const sources = ['O2', 'Vodafone', 'Sky', 'Tesco', 'Three', 'Giffgaff', 'Smarty', 'Uswitch'];

  for (const source of sources) {
    console.log(`\n📊 ${source}:`);

    try {
      const result = await pool.query(
        `SELECT
          plan_key,
          plan_data->>'data_allowance' as data_allowance,
          plan_data->>'price' as price,
          plan_data->>'contract_term' as contract_term
         FROM plans
         WHERE source = $1
         LIMIT 3`,
        [source]
      );

      if (result.rows.length === 0) {
        console.log('   ⚠️  No plans found');
        continue;
      }

      result.rows.forEach((row, index) => {
        console.log(`   Plan ${index + 1}:`);
        console.log(`     plan_key: ${row.plan_key || 'NULL'}`);
        console.log(`     data_allowance: ${row.data_allowance}`);
        console.log(`     price: ${row.price}`);
        console.log(`     contract_term: ${row.contract_term}`);
      });

    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Verification complete\n');

  await pool.end();
}

verifyNormalization().catch(console.error);
