/**
 * Debug normalization to see if plan_key is being generated
 */

import { normalizePlanData } from '../lib/scraping/normalize';

const testData = {
  name: 'Unlimited',
  price: '£0/month',
  contract_term: '1 month',
  data_allowance: 'Unlimited',
};

const normalized = normalizePlanData(testData, 'Smarty');

console.log('Original data:', JSON.stringify(testData, null, 2));
console.log('\nNormalized data:', JSON.stringify(normalized, null, 2));
console.log('\nplan_key:', normalized.plan_key);
