---
sidebar_position: 26
title: 'Vocabulary System'
---

# Vocabulary System

The `playwright-praman/vocabulary` sub-path provides a controlled vocabulary system for SAP S/4HANA business term resolution. It maps natural-language terms to UI5 selectors with fuzzy matching, synonym resolution, and cross-domain search.

## Overview

```typescript
import { createVocabularyService } from 'playwright-praman/vocabulary';

const svc = createVocabularyService();
await svc.loadDomain('procurement');
const results = await svc.search('vendor');
```

## SAP Domain JSON Files

The vocabulary system ships with 6 SAP domain JSON files in `src/vocabulary/domains/`:

| File                 | Domain        | SAP Module | Description                                        |
| -------------------- | ------------- | ---------- | -------------------------------------------------- |
| `procurement.json`   | procurement   | MM         | Materials Management -- vendors, POs, GR           |
| `sales.json`         | sales         | SD         | Sales & Distribution -- customers, SOs, deliveries |
| `finance.json`       | finance       | FI         | Financial Accounting -- GL, AP, AR                 |
| `manufacturing.json` | manufacturing | PP         | Production Planning -- orders, BOMs, routings      |
| `warehouse.json`     | warehouse     | WM/EWM     | Warehouse Management -- storage, picking           |
| `quality.json`       | quality       | QM         | Quality Management -- inspections, lots            |

Each JSON file contains vocabulary terms with synonyms and optional UI5 selectors:

```json
{
  "supplier": {
    "name": "supplier",
    "synonyms": ["vendor", "vendorId", "supplierId", "LIFNR"],
    "domain": "procurement",
    "sapField": "LIFNR",
    "selector": {
      "controlType": "sap.m.Input",
      "properties": { "labelFor": "Supplier" }
    }
  }
}
```

## VocabularyService API

### Creating the Service

```typescript
import { createVocabularyService } from 'playwright-praman/vocabulary';
import type { VocabularyService } from 'playwright-praman/vocabulary';

const svc: VocabularyService = createVocabularyService();
```

### Loading Domains

Domains are loaded lazily on demand:

```typescript
await svc.loadDomain('procurement');
await svc.loadDomain('finance');
// Only procurement and finance terms are in memory
```

### Searching Terms

```typescript
// Search across all loaded domains
const results = await svc.search('vendor');

// Search within a specific domain
const results = await svc.search('vendor', 'procurement');
```

Returns `VocabularySearchResult[]` sorted by confidence descending:

```typescript
interface VocabularySearchResult {
  readonly term: string; // 'supplier'
  readonly synonyms: string[]; // ['vendor', 'vendorId', 'supplierId']
  readonly confidence: number; // 0.0 to 1.0
  readonly domain: SAPDomain; // 'procurement'
  readonly sapField?: string; // 'LIFNR'
  readonly selector?: UI5Selector;
}
```

### Resolving Field Selectors

When a term matches with high enough confidence (>= 0.85), you can get its UI5 selector directly:

```typescript
const selector = await svc.getFieldSelector('vendor', 'procurement');
if (selector) {
  // { controlType: 'sap.m.Input', properties: { labelFor: 'Supplier' } }
  await ui5.fill(selector, '100001');
}
```

Returns `undefined` when:

- No match reaches the 0.85 confidence threshold.
- Multiple matches score above 0.7 but below 0.85 (ambiguous).

### Getting Suggestions

For autocomplete and disambiguation:

```typescript
const suggestions = await svc.getSuggestions('sup');
// ['supplier', 'supplierName', 'supplyPlant', ...]

// Limit results
const top3 = await svc.getSuggestions('sup', 3);
```

### Service Statistics

```typescript
const stats = svc.getStats();
// {
//   loadedDomains: ['procurement', 'sales'],
//   totalTerms: 142,
//   cacheHits: 37,
//   cacheMisses: 5,
// }
```

## Normalization and Matching Algorithm

The vocabulary matcher uses a tiered scoring system:

### Match Tiers

| Tier    | Confidence | Criteria                                                      |
| ------- | ---------- | ------------------------------------------------------------- |
| Exact   | 1.0        | Query exactly matches term name or synonym (case-insensitive) |
| Prefix  | 0.9        | Term name starts with the query string                        |
| Partial | 0.7        | Term name contains the query string                           |
| Fuzzy   | 0.5        | Levenshtein distance &lt;= 3 characters                       |

### Normalization

Before matching, both the query and term names are normalized:

- Converted to lowercase
- Leading/trailing whitespace trimmed

### Levenshtein Distance

The fuzzy matching tier uses Levenshtein edit distance (standard DP matrix approach). Terms within 3 edits of the query are considered fuzzy matches:

```
levenshtein('vendor', 'vendro') = 2  --> Fuzzy match (0.5)
levenshtein('vendor', 'vend')   = 2  --> Fuzzy match (0.5)
levenshtein('vendor', 'xyz')    = 6  --> No match
```

### Scoring Priority

When multiple terms match, results are sorted by:

1. Confidence score (descending)
2. Within the same confidence tier, exact matches on synonyms score the same as exact matches on the canonical name

### Disambiguation

The `getFieldSelector()` method includes disambiguation logic. If there are multiple high-confidence matches (0.7-0.85 range) without a clear winner, the method returns `undefined` rather than guessing, allowing the caller to present options to the user or AI agent.

## Integration with Intents

The vocabulary system integrates with the intent API through the `VocabLookup` interface:

```typescript
import { fillField } from 'playwright-praman/intents';
import { createVocabularyService } from 'playwright-praman/vocabulary';

const vocab = createVocabularyService();
await vocab.loadDomain('procurement');

// fillField uses vocab to resolve 'Vendor' to a UI5 selector
await fillField(ui5, vocab, 'Vendor', '100001', { domain: 'procurement' });
```

## Supported Domain Types

```typescript
type SAPDomain =
  | 'procurement' // MM - Materials Management
  | 'sales' // SD - Sales & Distribution
  | 'finance' // FI - Financial Accounting
  | 'manufacturing' // PP - Production Planning
  | 'warehouse' // WM/EWM - Warehouse Management
  | 'quality'; // QM - Quality Management
```

## Extending the Vocabulary

To add terms to an existing domain, edit the corresponding JSON file in `src/vocabulary/domains/`. Each term must have:

- `name` -- canonical term name (used as the Map key)
- `synonyms` -- array of alternative names
- `domain` -- must match one of the 6 `SAPDomain` values
- `sapField` (optional) -- the underlying ABAP field name
- `selector` (optional) -- UI5 selector for direct control discovery
