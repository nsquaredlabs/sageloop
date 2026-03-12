# Use Case: Data Extraction

> Learn how teams evaluate AI data extraction quality.

## Overview

**Goal**: Ensure AI correctly extracts structured data from unstructured text.

**Time Investment**: 30 minutes to first insights

## The Challenge

You're building a data extraction service for your business.

**Questions**:

- How accurate should extraction be?
- What should happen if data is ambiguous?
- How should the AI handle missing information?
- What format should extracted data use?

## Quick Example: Invoice Data Extraction

### Step 1: Create Project

System Prompt:

```
You are a data extraction assistant.
Extract structured data from invoices.
Return JSON with: invoice_number, date, total_amount, items, vendor
If data is missing or ambiguous, use null.
```

### Step 2: Add Scenarios

```
Extract from: "Invoice #INV-2024-001 dated Jan 15, 2024 from TechCorp. Items: Widget ($50), Gadget ($30). Total: $80"
Extract from: "Receipt from Local Store - Date unclear. Item: Book. Price: $25"
Extract from: "Incomplete invoice missing total amount..."
Extract from: "Vendor: MultiServices Inc. No invoice number. Items: Consulting hours: 10h @ $150/h. Total: $1500"
```

### Step 3: Generate, Rate, Extract

Rate based on:

- **Accuracy**: Are extracted values correct?
- **Completeness**: Did it extract all available data?
- **Handling Missing Data**: Properly uses null or defaults?
- **Format**: Valid JSON, correct structure?

### Step 4: Get Insights

Patterns reveal:

- All 5-star: Extract dates in ISO format
- All 5-star: Use null for missing fields
- Low-star: Infer missing data instead of using null
- Low-star: Inconsistent number formatting

## Scenarios by Extraction Type

### Invoice/Receipt Extraction

```
Extract structured data from: [invoice text]
Parse receipt for items and amounts
Get customer and vendor information
```

### Form Data Extraction

```
Extract from form submission: [form data]
Parse contact information from text
Get address from various formats
```

### Entity Extraction

```
Extract entities (names, dates, locations) from: [text]
Identify organization names and roles
Get contact details from email
```

### Structured Conversion

```
Convert CSV to JSON: [data]
Parse table data: [HTML table]
Convert natural language to structured format
```

## Key Metrics for Extraction

### What Makes Extraction "5-Star"?

- **Accuracy**: Values are correct
- **Completeness**: Extracts all available data
- **Proper Handling of Missing Data**: Uses null, not guesses
- **Consistent Formatting**: All values in correct format
- **Proper Type Conversion**: Numbers as numbers, not strings

### Common Failure Patterns

**Pattern 1: Incorrect Values**

- 5-star: Extracts correct number
- 1-star: Off-by-one or misread value

**Pattern 2: Missing Extraction**

- 5-star: Extracts all available fields
- 1-star: Skips optional fields that are present

**Pattern 3: Hallucination**

- 5-star: Uses null for missing data
- 1-star: Invents reasonable-sounding values

**Pattern 4: Format Inconsistency**

- 5-star: All dates in ISO 8601 format
- 1-star: Mixed date formats

**Pattern 5: Type Confusion**

- 5-star: `"amount": 100` (number)
- 1-star: `"amount": "100"` (string)

## Evaluation Tips

**Validate Extracted Data**:

1. Check against source text (accurate?)
2. Check completeness (did it get everything?)
3. Check types (are they correct?)
4. Check nulls (properly handles missing data?)

**Test Edge Cases**:

- Missing fields
- Ambiguous data
- Typos/misspellings
- Multiple formats
- Different languages

## Iteration Example

**Iteration 1** (70% success):

- Issue: Hallucinating missing amounts
- Fix: Add "Use null for missing fields, don't guess"

**Iteration 2** (82% success):

- Issue: Inconsistent date formats
- Fix: Add "Always return dates in ISO 8601 format: YYYY-MM-DD"

**Iteration 3** (91% success):

- Issue: Some numeric values as strings
- Fix: Add "Return amounts as numbers, not strings. Example: 'amount': 100"

**Final** (96% success): Ready for production

## Validation Rules

After extraction, validate:

```python
# Check all required fields present
assert response["invoice_number"] is not None

# Check types
assert isinstance(response["total_amount"], float)

# Check format
assert response["date"].matches(ISO_8601)

# Check values make sense
assert response["total_amount"] > 0
```

## Export for Engineering

1. Export golden examples (correct extractions)
2. Extract patterns (formatting rules discovered)
3. Use in:
   - Data validation rules
   - Test cases
   - Documentation
   - Error handling guidelines

## Performance Metrics

Track extraction accuracy:

| Field          | Accuracy |
| -------------- | -------- |
| Invoice Number | 98%      |
| Date           | 95%      |
| Total Amount   | 94%      |
| Items          | 92%      |
| Vendor         | 91%      |

Use this to prioritize improvements (vendor field needs work).

## Next Steps

- [Quick Start](../quickstart.md) - Evaluate your extractor
- [Rating System](../guide/rating-outputs.md) - Rating system guide
