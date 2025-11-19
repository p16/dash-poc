/**
 * Data Format Analysis Script
 *
 * Analyzes actual data formats from all 8 collectors to inform
 * normalization rules for Story 2.5.
 */

import * as dotenv from 'dotenv';
import { getPool } from '../lib/db/connection';

dotenv.config({ path: '.env.local' });

const pool = getPool();

interface PlanSample {
  source: string;
  plan_data: any;
  plan_key: string | null;
}

async function analyzeSampleData() {
  console.warn('\n📊 Data Format Analysis for Story 2.5\n');
  console.warn('='.repeat(80));

  const sources = ['O2', 'Vodafone', 'Sky', 'Tesco', 'Three', 'Giffgaff', 'Smarty', 'Uswitch'];

  for (const source of sources) {
    console.warn(`\n🔍 Analyzing ${source} data formats...\n`);

    try {
      const result = await pool.query<PlanSample>(
        'SELECT source, plan_data, plan_key FROM plans WHERE source = $1 LIMIT 3',
        [source]
      );

      if (result.rows.length === 0) {
        console.warn(`   ⚠️  No plans found for ${source}`);
        continue;
      }

      result.rows.forEach((row: PlanSample, index: number) => {
        console.warn(`   Sample ${index + 1}:`);
        console.warn(`   plan_key: ${row.plan_key || 'NULL'}`);

        const data = row.plan_data;

        // Analyze data allowance format
        const dataField = data.data || data.dataAllowance || data.allowance || data.data_allowance;
        console.warn(`   Data Allowance: ${JSON.stringify(dataField)}`);

        // Analyze pricing format
        const priceField = data.price || data.monthlyPrice || data.cost || data.monthly_price;
        console.warn(`   Price: ${JSON.stringify(priceField)}`);

        // Analyze contract term format
        const contractField = data.contract || data.contractLength || data.term || data.contract_length;
        console.warn(`   Contract: ${JSON.stringify(contractField)}`);

        // Show full data structure for first sample
        if (index === 0) {
          console.warn(`   Full structure: ${JSON.stringify(data, null, 2)}`);
        }
        console.warn('');
      });

    } catch (error) {
      console.error(`   ❌ Error analyzing ${source}:`, error);
    }
  }

  console.warn('='.repeat(80));
  console.warn('\n✅ Analysis complete\n');

  await pool.end();
}

analyzeSampleData().catch(console.error);
