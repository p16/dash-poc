/**
 * Show Vodafone plans summary
 */

import dotenv from 'dotenv';
import { getPool } from '../lib/db/connection';

dotenv.config({ path: '.env.local' });

async function showVodafoneSummary() {
  const pool = getPool();

  try {
    console.warn('📱 Vodafone Plans Summary\n');
    console.warn('='.repeat(120));

    // Get latest unique plans
    const result = await pool.query(`
      SELECT DISTINCT ON (plan_key)
        plan_key,
        plan_data,
        scrape_timestamp
      FROM plans
      WHERE LOWER(source) = 'vodafone'
      ORDER BY plan_key, scrape_timestamp DESC
    `);

    console.warn(`\n✅ Found ${result.rows.length} unique Vodafone plan types\n`);

    // Group by price status
    const pricedPlans = result.rows.filter(r => r.plan_data.price && r.plan_data.price !== 'Unknown');
    const unknownPricePlans = result.rows.filter(r => !r.plan_data.price || r.plan_data.price === 'Unknown');

    console.warn(`📊 Pricing breakdown:`);
    console.warn(`  ✅ With price: ${pricedPlans.length} plans`);
    console.warn(`  ❌ Unknown price: ${unknownPricePlans.length} plans\n`);

    console.warn('='.repeat(120));
    console.warn('\n💰 PLANS WITH PRICING:\n');

    pricedPlans.forEach((row, index) => {
      const plan = row.plan_data;
      const price = plan.price || 'Unknown';
      const name = plan.name || 'N/A';
      const data = extractData(plan);
      const contract = extractContract(plan);
      const roaming = extractRoaming(plan);

      console.warn(`${index + 1}. ${name}`);
      console.warn(`   Price: ${price} | Data: ${data} | Contract: ${contract} | Roaming: ${roaming}`);
    });

    console.warn('\n' + '='.repeat(120));
    console.warn('\n❓ PLANS WITHOUT PRICING:\n');

    unknownPricePlans.forEach((row, index) => {
      const plan = row.plan_data;
      const name = plan.name || 'N/A';
      const data = extractData(plan);
      const contract = extractContract(plan);
      const roaming = extractRoaming(plan);

      console.warn(`${index + 1}. ${name}`);
      console.warn(`   Data: ${data} | Contract: ${contract} | Roaming: ${roaming}`);
    });

    console.warn('\n' + '='.repeat(120));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function extractData(plan: any): string {
  if (plan.data) return plan.data;

  // Try to extract from extras
  if (plan.extras && typeof plan.extras === 'string') {
    const dataMatch = plan.extras.match(/Data (\d+GB|Unlimited)/i);
    if (dataMatch) return dataMatch[1];
  }

  // Try from name
  if (plan.name) {
    if (plan.name.includes('Unlimited')) return 'Unlimited';
    const nameMatch = plan.name.match(/(\d+GB)/i);
    if (nameMatch) return nameMatch[1];
  }

  return 'N/A';
}

function extractContract(plan: any): string {
  if (plan.contract) return plan.contract;

  // Try to extract from key
  const key = plan.plan_key || '';
  if (key.includes('1month')) return '1 month';
  if (key.includes('12months')) return '12 months';
  if (key.includes('24months')) return '24 months';

  return 'N/A';
}

function extractRoaming(plan: any): string {
  if (plan.roaming) return plan.roaming;

  // Try to extract from extras or name
  if (plan.name) {
    if (plan.name.includes('Global Roam')) return 'Global';
    if (plan.name.includes('Euro Roam')) return 'EU';
    if (plan.name.includes('Xtra')) return 'EU/Global (Xtra)';
  }

  if (plan.extras && typeof plan.extras === 'string') {
    if (plan.extras.includes('83 worldwide destinations')) return 'Global';
    if (plan.extras.includes('47 European destinations')) return 'EU';
  }

  return 'None';
}

showVodafoneSummary();
