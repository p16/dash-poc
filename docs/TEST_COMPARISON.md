# Custom Comparison Test Script

## Overview

This script runs a custom brand-vs-brand comparison locally to inspect the data structure and validate responses for the Next.js frontend.

## Usage

### Basic Usage (O2 vs Vodafone)
```bash
npm run test:comparison
```

### Custom Brands
```bash
npm run test:comparison -- --brandA=Three --brandB=Sky
```

### Additional Options
```bash
npm run test:comparison -- --brandA=O2 --brandB=Vodafone --saveToFile=true --outputDir=./my-results
```

## Options

- `--brandA`: First brand to compare (default: "O2")
- `--brandB`: Second brand to compare (default: "Vodafone")
- `--saveToFile`: Save full JSON response to file (default: true)
- `--outputDir`: Directory for output files (default: "./test-results")

## Output

The script provides:

1. **Structure Summary**: Overview of response fields and counts
2. **Sample Data**: Examples of sentiments and products
3. **Data Quality Checks**:
   - Products with null prices
   - Missing required fields
   - Sentiment count validation (should be 5-10)
4. **TypeScript Guidance**: Type hints for handling the response
5. **JSON File**: Full response saved to file (if enabled)

## Example Output

```
=== Custom Comparison Test ===
Brand A: O2
Brand B: Vodafone
==============================

⏳ Running comparison...
✅ Comparison completed in 93.56s

📊 Response Structure Summary:
─────────────────────────────
✓ analysis_timestamp: 2024-05-21T10:00:00Z
✓ currency: GBP
✓ overall_competitive_sentiments: 6 items
✓ brand_a_products_analysis: 5 products
✓ brand_b_products_analysis: 0 products
✓ full_competitive_dataset_all_plans: 17 plans
✓ products_not_considered: 16 products

📋 Sample Sentiment:
─────────────────────
  Score: 90
  Sentiment: O2 dominates contract flexibility
  Rationale: Based on the available data, O2's entire portfolio consists of 3-month and 12-month plans...

📦 Sample O2 Product:
─────────────────────────
  Name: O2 20GB 3 months CLASSIC
  Data Tier: Low
  Roaming Tier: EU
  Price: £26/mo
  Contract: 3 months
  Data: 20GB
  Competitiveness: 60
  Comparable Products: 0
  Sentiments: 3
  Changes Suggested: 2
  Price Suggestions: 1

🔍 Data Quality Checks:
───────────────────────
✅ No data quality issues detected

💾 Full response saved to: ./test-results/comparison-O2-vs-Vodafone-2025-11-19T11-11-52-534Z.json

📝 TypeScript Interface Guidance:
──────────────────────────────
Based on this response, verify your types handle:
  • price_per_month_GBP: number | null
  • Optional arrays with ?.length checks
  • Optional chaining for nested objects
  • Fallback values for display (e.g., "Unknown")

✅ Test completed successfully
```

## Using the Results

### Inspecting Response Structure

The saved JSON file contains the full LLM response. Use it to:

1. **Verify field presence**: Check all expected fields are returned
2. **Validate data types**: Ensure null handling works correctly
3. **Test edge cases**: Find products with missing/null values
4. **Update UI components**: Adapt display logic for actual data

### Component Integration

Use the `CustomComparisonResults` component to display the data:

```tsx
import { CustomComparisonResults } from '@/components/analysis/CustomComparisonResults';

// In your page/component
<CustomComparisonResults
  data={analysisData}
  timestamp={new Date(analysisData.analysis_timestamp)}
  brandA="O2"
  brandB="Vodafone"
/>
```

## Troubleshooting

### Validation Warnings

The validation system now logs issues instead of throwing errors. Check the logs for:

- Missing fields: Logged as warnings but don't stop processing
- Null prices: Common for Vodafone plans without published pricing
- Score ranges: Should be 0-100 but logged if outside range

### Common Issues

**Issue**: "No products returned"
- **Cause**: No scraped data for the specified brands
- **Fix**: Run scraper first: `npm run scrape`

**Issue**: "Comparison takes too long"
- **Cause**: LLM processing time (normal: 60-120s)
- **Solution**: This is expected; Gemini streaming can take 1-2 minutes

**Issue**: "Products with null prices"
- **Cause**: Vodafone doesn't publish all prices on their website
- **Solution**: UI displays "Unknown" - this is correct behavior

## Related Files

- **Test Script**: `src/scripts/test-custom-comparison.ts`
- **Component**: `src/components/analysis/CustomComparisonResults.tsx`
- **Types**: `src/types/analysis.ts` (CustomComparisonAnalysis interface)
- **API Route**: `src/app/api/analysis/custom/route.ts`
- **LLM Logic**: `src/lib/llm/analysis.ts` (customComparison function)
- **Validation**: `src/lib/llm/validation.ts` (validateCustomComparisonResponse)
