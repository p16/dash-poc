# LLM Prompts for Competitive Analysis

This directory contains prompt templates for generating AI-powered competitive analysis of UK SIM-only plan data using Google Gemini 2.5 Pro.

## Prompts Overview

### 1. `prompt-full-analysis.txt`
**Purpose:** O2-focused competitive analysis against all competitors
**Use Case:** Full market positioning analysis for O2
**Brands Analyzed:** O2 vs All (Vodafone, Sky, Tesco, Smarty, Three, Giffgaff, Uswitch)

### 2. `prompt-custom-comparison.txt`
**Purpose:** Flexible two-brand comparison
**Use Case:** Ad-hoc brand comparisons (e.g., Vodafone vs Three, Sky vs Tesco)
**Brands Analyzed:** Any Brand A vs Any Brand B (template-based)

## Scoring Model

All analysis uses a **0-100 competitiveness score** calculated as a weighted sum:

| Factor | Weight | Scoring Logic |
|--------|--------|---------------|
| **Data Allowance** | 40% | Unlimited = 100; otherwise linear scale by GB |
| **Roaming** | 15% | None = 0, EU = 50, Global = 100 |
| **Extras** | 15% | None = 0, Basic = 50, Premium = 100 |
| **Contract Flexibility** | 10% | 30-day = 100, 12-month = 50, 24-month = 0 (interpolate others) |
| **Price** | 20% | Lower price = better; based on range (MaxPrice - MinPrice) |

**Example:**
```
Plan: 50GB data, EU roaming, basic extras, 12-month contract, £15/mo
- Data: 50GB = ~50/100 * 40% = 20 points
- Roaming: EU = 50/100 * 15% = 7.5 points
- Extras: Basic = 50/100 * 15% = 7.5 points
- Contract: 12-month = 50/100 * 10% = 5 points
- Price: (depends on range) ~10 points
Total: ~50 competitiveness score
```

## JSON Output Structure

### Full Analysis Prompt Output

```json
{
  "analysis_timestamp": "2025-01-18T10:30:00Z",
  "currency": "GBP",
  "overall_competitive_sentiments": [
    {
      "score": 85,
      "sentiment": "O2 pricing significantly higher than budget competitors",
      "rationale": "O2's 10GB plan at £12/mo is 60% more expensive than Smarty's equivalent at £7/mo. Recommend introducing a budget-tier product line or reducing mid-tier pricing by 15-20%."
    }
  ],
  "o2_products_analysis": [
    {
      "product_name": "O2 10GB 12-Month",
      "data_tier": "Low",
      "roaming_tier": "EU",
      "product_breakdown": {
        "brand": "O2",
        "contract": "12-month",
        "data": "10GB",
        "roaming": "EU",
        "price_per_month_GBP": 12,
        "extras": "Priority tickets, O2 WiFi",
        "speed": "4G/5G",
        "competitiveness_score": 62,
        "source_URL": "https://www.o2.co.uk/shop/sim-cards",
        "source": "o2"
      },
      "comparable_products": [
        {
          "brand": "Smarty",
          "contract": "30-day",
          "data": "10GB",
          "roaming": "EU",
          "price_per_month_GBP": 7,
          "extras": "None",
          "speed": "4G",
          "competitiveness_score": 78,
          "source_URL": "https://smarty.co.uk/plans",
          "source": "smarty"
        }
      ],
      "o2_product_sentiments": [
        "O2 offers premium extras (Priority, WiFi) but price premium may deter price-sensitive customers",
        "12-month commitment reduces flexibility compared to budget MVNOs offering 30-day contracts"
      ],
      "o2_product_changes": [
        "Reduce price by £2-3/mo to £9-10/mo to compete with Smarty while maintaining margin",
        "Consider 30-day option for this tier to match market flexibility",
        "Emphasize value of Priority tickets and WiFi in marketing"
      ],
      "price_suggestions": [
        {
          "motivation": "Match Smarty's value proposition while retaining premium positioning",
          "price": 9.99
        },
        {
          "motivation": "Aggressive pricing to capture budget-conscious segment",
          "price": 8.99
        }
      ],
      "source": "o2"
    }
  ],
  "full_competitive_dataset_all_plans": [
    {
      "brand": "O2",
      "contract": "12-month",
      "data": "10GB",
      "roaming": "EU",
      "price_per_month_GBP": 12,
      "extras": "Priority tickets, O2 WiFi",
      "speed": "4G/5G",
      "notes": "",
      "competitiveness_score": 62,
      "source_URL": "https://www.o2.co.uk/shop/sim-cards",
      "source": "o2"
    },
    {
      "brand": "Smarty",
      "contract": "30-day",
      "data": "10GB",
      "roaming": "EU",
      "price_per_month_GBP": 7,
      "extras": "None",
      "speed": "4G",
      "notes": "",
      "competitiveness_score": 78,
      "source_URL": "https://smarty.co.uk/plans",
      "source": "smarty"
    }
  ],
  "products_not_considered": [
    {
      "product": "Vodafone 5G Data-Only SIM",
      "details": "Data-only plan excluded as analysis focuses on voice+data SIM-only plans"
    }
  ]
}
```

### Custom Comparison Prompt Output

Similar structure but with these changes:
- `o2_products_analysis` → `brand_a_products_analysis`
- `o2_product_sentiments` → `brand_a_product_sentiments`
- `o2_product_changes` → `brand_a_product_changes`

## Data Tiers

Plans are categorized into three data tiers:

| Tier | Data Range | Typical Use Case |
|------|------------|------------------|
| **Low** | ≤ 20 GB | Light users, WiFi-dependent |
| **Medium** | 21-100 GB | Regular mobile data users |
| **Unlimited** | > 100 GB or Unlimited | Heavy users, streaming, tethering |

## Source File Naming Convention

Plan data comes from these JSON files:
- `o2.json` → source: "o2"
- `smarty.json` → source: "smarty"
- `vodafone.json` → source: "vodafone"
- `three.json` → source: "three"
- `giffgaff.json` → source: "giffgaff"
- `sky.json` → source: "sky"
- `tesco.json` → source: "tesco"
- `uswitch.json` → source: "uswitch" (contains plans from multiple brands)

**Special Handling for Uswitch:**
When the source is "uswitch", the brand name should include "uswitch" suffix:
- "o2 uswitch"
- "vodafone uswitch"
- "three uswitch"

This distinguishes Uswitch-sourced plans from direct telco sources.

## Usage Examples

### Example 1: Full Analysis with Gemini API

```typescript
import { queryGeminiJson } from '../gemini';
import fs from 'fs';
import path from 'path';

// Load the prompt template
const promptTemplate = fs.readFileSync(
  path.join(__dirname, 'prompts/prompt-full-analysis.txt'),
  'utf-8'
);

// Load plan data (example: from database or files)
const planData = {
  o2: loadPlans('o2'),
  smarty: loadPlans('smarty'),
  vodafone: loadPlans('vodafone'),
  // ... other sources
};

// Construct the full prompt with plan data
const fullPrompt = `${promptTemplate}\n\nPLAN DATA:\n${JSON.stringify(planData, null, 2)}`;

// Query Gemini API
const analysis = await queryGeminiJson(fullPrompt);

// analysis will be a parsed JSON object matching the structure above
console.log('Overall sentiments:', analysis.overall_competitive_sentiments);
console.log('O2 products analyzed:', analysis.o2_products_analysis.length);
```

### Example 2: Custom Comparison (Vodafone vs Three)

```typescript
import { queryGeminiJson } from '../gemini';
import fs from 'fs';
import path from 'path';

// Load the custom comparison template
const promptTemplate = fs.readFileSync(
  path.join(__dirname, 'prompts/prompt-custom-comparison.txt'),
  'utf-8'
);

// Replace placeholders
const customPrompt = promptTemplate
  .replace(/\{\{BRAND_A\}\}/g, 'Vodafone')
  .replace(/\{\{BRAND_B\}\}/g, 'Three');

// Load plan data for both brands
const planData = {
  vodafone: loadPlans('vodafone'),
  three: loadPlans('three'),
};

// Construct the full prompt
const fullPrompt = `${customPrompt}\n\nPLAN DATA:\n${JSON.stringify(planData, null, 2)}`;

// Query Gemini API
const analysis = await queryGeminiJson(fullPrompt);

// analysis.brand_a_products_analysis will contain Vodafone's analysis vs Three
console.log('Vodafone products analyzed:', analysis.brand_a_products_analysis.length);
```

## Response Validation

All responses should be validated using the validation utility (see `../validation.ts`):

```typescript
import { validateAnalysisResponse } from '../validation';

try {
  const validatedAnalysis = validateAnalysisResponse(rawResponse);
  // Use validatedAnalysis safely
} catch (error) {
  // Handle validation errors (missing fields, invalid scores, etc.)
  console.error('Validation failed:', error.message);
}
```

The validator checks:
- ✅ JSON parsing succeeds
- ✅ All required top-level fields present
- ✅ Competitiveness scores are numbers between 0-100
- ✅ Required nested fields present in arrays
- ✅ Data types match specifications (e.g., price_per_month_GBP is Number)

## Best Practices

1. **Test with Real Data:** Use actual scraped plan data from the database (356+ plans available from Epic 2)
2. **Iterate Prompts:** LLM responses may vary; refine prompts based on output quality
3. **Rate Limiting:** Gemini API has free tier limits (15 RPM); rate limiting is built into `gemini.ts`
4. **Validate Responses:** Always use the validation utility before storing results
5. **Re-prompt on Errors:** If validation fails, the system can re-prompt up to 3 times (max retry limit)

## Troubleshooting

**Issue:** LLM returns markdown instead of pure JSON
**Solution:** The prompt explicitly states "Do not include any text, explanations, or markdown". If this persists, use `queryGeminiJson()` with `responseMimeType: 'application/json'` mode.

**Issue:** Competitiveness scores outside 0-100 range
**Solution:** Prompt includes "IMPORTANT: All competitiveness_score values MUST be numbers between 0 and 100". Validation utility will catch this and trigger re-prompt.

**Issue:** Missing required fields in output
**Solution:** Validation utility checks for required fields. If missing, will trigger re-prompt with error context.

**Issue:** Brand names inconsistent (e.g., "O2" vs "o2" vs "O 2")
**Solution:** Prompt specifies exact brand naming. Validation can normalize if needed.

## Related Files

- `../gemini.ts` - Gemini API client and utilities (Story 3.1)
- `../validation.ts` - Response validation utility (Story 3.2 AC8)
- `../../db/plans.ts` - Database access for plan data (Epic 2)
- `../../../types/database.ts` - TypeScript types for Analysis structure

## Changelog

| Date | Version | Description |
|------|---------|-------------|
| 2025-01-18 | 1.0 | Initial prompts created for Story 3.2 |
