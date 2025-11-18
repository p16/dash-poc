# Data Normalization Rules and Format Mappings

**Story**: 2.5 - Data Normalization Before Storage
**Created**: 2025-11-18
**Purpose**: Document normalization rules and format variations discovered across all 8 data sources

---

## Overview

This document describes the normalization rules applied to raw scraped data before database storage. Normalization ensures consistent data format across all sources for analysis and comparison.

## Normalization Output Format

All normalized plans include these standardized fields:

- **data_allowance**: `"Unlimited"`, `"10GB"`, `"500MB"`
- **price**: `"£10.00"` (always 2 decimal places)
- **contract_term**: `"12 months"`, `"1 month"`, `"PAYG"`
- **plan_key**: `"{Source}-{DataAllowance}-{ContractTerm}"` (e.g., `"O2-10GB-12months"`)

---

## Data Allowance Normalization

### Input Formats Discovered

| Source | Format Examples | Notes |
|--------|-----------------|-------|
| O2 | `"20GB"`, `"250GB"`, `"3GB"` | Standard GB format |
| Vodafone | `"Unlimited"`, `"20GB"`, `"1GB"` | Standard format |
| Tesco | `"12GB"`, `"Unlimited"`, `"60GB"` | Standard format |
| Three | `"12GB"`, `"Unlimited"`, `"25GB"` | Standard format |
| Giffgaff | `"6GB"`, `"25GB"`, `"50GB"` | Standard format |
| Smarty | `"Unlimited"`, `"2GB"`, `"0.5GB"` | Includes fractional GB |
| Uswitch | `"50000"`, `"80000"`, `"5000"` | Numeric MB values |

### Normalization Rules

1. **Unlimited Variants**
   - Input: `"unlimited"`, `"Unlimited"`, `"UNLIMITED"`
   - Output: `"Unlimited"`

2. **Standard GB Format**
   - Input: `"20GB"`, `"250GB"`
   - Output: Same (no change)

3. **Fractional GB to MB**
   - Input: `"0.5GB"` (Smarty)
   - Output: `"500MB"`
   - Rule: If < 1GB, convert to MB

4. **Numeric MB Values** (Uswitch)
   - Input: `"50000"` (50,000 MB)
   - Output: `"50GB"`
   - Rule: Divide by 1000, format as GB

5. **Space Variants**
   - Input: `"20 GB"`, `"20G"`
   - Output: `"20GB"`
   - Rule: Remove spaces, add "B" if missing

### Edge Cases

- **Null/Undefined**: Returns `"Unknown"`
- **Unexpected Format**: Returns input as-is with warning log

---

## Price Normalization

### Input Formats Discovered

| Source | Format Examples | Notes |
|--------|-----------------|-------|
| O2 | `"£20.00/month"`, `"£16.00/month"` | With /month suffix |
| Vodafone | `"Unknown"` | Prices not displayed |
| Tesco | `"£10"`, `"£25"` | No decimals |
| Three | `"1300"`, `"1800"`, `"2000"` | Pence as integer |
| Giffgaff | `"£8.00"`, `"£10.00"` | Standard format |
| Smarty | `"£0/month"`, `"£5/month"` | With /month suffix |
| Uswitch | `"£7.95/month"`, `"£10/month"` | With /month suffix |

### Normalization Rules

1. **Standard £ Format**
   - Input: `"£20.00/month"`, `"£10/month"`
   - Output: `"£20.00"`, `"£10.00"`
   - Rule: Remove "/month", ensure 2 decimals

2. **Pence as Integer** (Three)
   - Input: `"1300"` (1300 pence)
   - Output: `"£13.00"`
   - Rule: Divide by 100, format as pounds

3. **Missing Decimals**
   - Input: `"£10"`
   - Output: `"£10.00"`
   - Rule: Add `.00` for consistency

4. **GBP Text Format**
   - Input: `"10 GBP per month"`
   - Output: `"£10.00"`
   - Rule: Extract number, add £ symbol

5. **Unknown Prices**
   - Input: `"Unknown"`, `""`, `null`
   - Output: `"Unknown"`
   - Rule: Preserve "Unknown" explicitly

### Edge Cases

- **Null/Undefined/Empty**: Returns `"Unknown"`
- **Free Plans**: `"£0.00"`

---

## Contract Term Normalization

### Input Formats Discovered

| Source | Format Examples | Notes |
|--------|-----------------|-------|
| O2 | `"24 months"`, `"12 months"`, `"1 month"` | Standard format |
| Vodafone | `"1 month"` | Rolling monthly |
| Tesco | `"12 months"` | Standard format |
| Three | `"24 months"`, `"12 months"` | Standard format |
| Giffgaff | `"18 months"` | Unique 18-month option |
| Smarty | `"1 month"` | Rolling monthly |
| Uswitch | `"1 months"` (typo), `1`, `0` | Numeric and text variants |

### Normalization Rules

1. **Standard Months Format**
   - Input: `"24 months"`, `"12 months"`
   - Output: Same (no change)
   - Rule: Singular for 1 month, plural otherwise

2. **Numeric Contract Length** (Uswitch)
   - Input: `1`, `12`, `24`
   - Output: `"1 month"`, `"12 months"`, `"24 months"`
   - Rule: Convert to text with proper singular/plural

3. **PAYG/Zero Contract**
   - Input: `0`, `"PAYG"`, `"Pay as you go"`
   - Output: `"PAYG"`
   - Rule: Standardize all PAYG variants

4. **Years to Months**
   - Input: `"1 year"`, `"2 years"`
   - Output: `"12 months"`, `"24 months"`
   - Rule: Multiply by 12

5. **Short Formats**
   - Input: `"12m"`, `"12-month"`
   - Output: `"12 months"`
   - Rule: Expand to full format

### Edge Cases

- **Null/Undefined/Empty**: Returns `"Unknown"`
- **Typos**: `"1 months"` → `"1 month"` (fixes Uswitch typo)

---

## plan_key Generation

### Format

`{Source}-{DataAllowance}-{ContractTerm}`

### Rules

1. **Source Capitalization**
   - Input: `"smarty"`, `"SMARTY"`, `"Smarty"`
   - Output: `"Smarty"`
   - Rule: Capitalize first letter only

2. **Remove Spaces**
   - Data: `"10 GB"` → `"10GB"`
   - Contract: `"12 months"` → `"12months"`

3. **Lowercase Contract**
   - Input: `"PAYG"`, `"12 Months"`
   - Output: `"payg"`, `"12months"`

### Examples

| Source | Data | Contract | plan_key |
|--------|------|----------|----------|
| O2 | 10GB | 12 months | `O2-10GB-12months` |
| Vodafone | Unlimited | 24 months | `Vodafone-Unlimited-24months` |
| Three | 50GB | 1 month | `Three-50GB-1month` |
| Smarty | 500MB | 1 month | `Smarty-500MB-1month` |
| Uswitch | 50GB | PAYG | `Uswitch-50GB-payg` |

---

## Source-Specific Quirks

### Three
- **Quirk**: Prices stored as pence (integer)
- **Example**: `"1300"` = £13.00
- **Handling**: Divide by 100 in normalization

### Uswitch
- **Quirk**: Data allowance in MB (numeric)
- **Example**: `"50000"` = 50GB
- **Handling**: Divide by 1000, format as GB
- **Quirk**: Contract typo `"1 months"`
- **Handling**: Fixed to `"1 month"`

### Smarty
- **Quirk**: Fractional GB values
- **Example**: `"0.5GB"`
- **Handling**: Convert to MB (`"500MB"`)

### Vodafone
- **Quirk**: Prices not available
- **Example**: `"Unknown"`
- **Handling**: Preserve `"Unknown"` explicitly

### Giffgaff
- **Quirk**: Unique 18-month contracts
- **Example**: `"18 months"`
- **Handling**: Supported as standard format

---

## Error Handling

### Philosophy

**Fail Gracefully**: Log warnings but continue processing

### Scenarios

1. **Missing Fields**
   - Action: Log warning, return `"Unknown"`
   - Example: `null` data_allowance → `"Unknown"`

2. **Unexpected Formats**
   - Action: Log warning, return input as-is
   - Example: `"weird format"` → `"weird format"`

3. **Normalization Errors**
   - Action: Log error, return fallback object
   - Fallback includes: `normalization_error: true`

### Logging

- **Warning Level**: Missing or unexpected formats
- **Error Level**: Exceptions during normalization
- **Debug Level**: Successful normalization with plan_key

---

## Testing

### Coverage

- **Test File**: `src/lib/scraping/__tests__/normalize.test.ts`
- **Total Tests**: 69
- **Coverage**: 100% of normalization functions
- **Real Data**: Tests use actual formats discovered from all 8 sources

### Test Categories

1. Data Allowance Normalization (16 tests)
2. Price Normalization (14 tests)
3. Contract Term Normalization (20 tests)
4. plan_key Generation (6 tests)
5. Full Plan Normalization (11 tests)
6. Array Normalization (2 tests)

---

## Usage Example

```typescript
import { normalizePlanData } from './normalize';

// Raw data from Smarty API
const rawPlan = {
  name: 'Unlimited',
  price: '£0/month',
  contract_term: '1 month',
  data_allowance: 'Unlimited',
};

// Normalize
const normalized = normalizePlanData(rawPlan, 'Smarty');

// Result:
// {
//   name: 'Unlimited',
//   price: '£0.00',
//   contract_term: '1 month',
//   data_allowance: 'Unlimited',
//   plan_key: 'Smarty-Unlimited-1month'
// }
```

---

## Implementation Notes

### Integration Points

1. **Collectors**: Each collector calls `normalizePlans()` before database insertion
2. **Database**: `insertPlans()` extracts `plan_key` and stores in dedicated column
3. **Storage**: Normalized data in `plan_data` JSONB, `plan_key` in indexed TEXT column

### Performance

- **Overhead**: Minimal (~1ms per plan)
- **Benefits**: Consistent data format enables efficient analysis
- **Indexing**: `plan_key` indexed for fast historical lookups

---

## Future Enhancements

### Potential Improvements

1. **Configurable Thresholds**: Make MB/GB conversion threshold configurable
2. **Currency Support**: Extend normalization to support multiple currencies
3. **Data Validation**: Add schema validation before normalization
4. **Retry Logic**: Implement retry for transient normalization errors

### Monitoring

- Track normalization warning/error rates
- Alert on unexpected format increases
- Monitor plan_key uniqueness violations

---

## References

- **Story**: docs/stories/2.5.data-normalization-before-storage.md
- **Implementation**: src/lib/scraping/normalize.ts
- **Tests**: src/lib/scraping/__tests__/normalize.test.ts
- **Integration**: All collectors in src/lib/scraping/collectors/
