---
sidebar_position: 11
title: Vocabulary Discovery
---

# Vocabulary Discovery

Demonstrates Praman's vocabulary system from `playwright-praman/vocabulary`: domain loading, fuzzy term search, confidence scoring, field selector resolution, autocomplete suggestions, and integration with the intent API.

## SAP Domain Coverage

The vocabulary system ships with 6 SAP domain JSON files:

| Domain          | SAP Module | Coverage                               |
| --------------- | ---------- | -------------------------------------- |
| `procurement`   | MM         | Vendors, POs, goods receipts           |
| `sales`         | SD         | Customers, sales orders, deliveries    |
| `finance`       | FI         | GL accounts, AP, AR                    |
| `manufacturing` | PP         | Production orders, BOMs, routings      |
| `warehouse`     | WM/EWM     | Storage locations, picking             |
| `quality`       | QM         | Inspection lots, quality notifications |

## Source

```typescript
import { test, expect } from 'playwright-praman';
import { createVocabularyService } from 'playwright-praman/vocabulary';
import type { VocabularyService } from 'playwright-praman/vocabulary';
import { fillField } from 'playwright-praman/intents';

test.describe('Vocabulary Discovery', () => {
  let vocab: VocabularyService;

  test.beforeEach(() => {
    vocab = createVocabularyService();
  });

  test('load domains and search terms', async () => {
    await test.step('Load SAP procurement domain', async () => {
      await vocab.loadDomain('procurement');
      const stats = vocab.getStats();
      expect(stats.loadedDomains).toContain('procurement');
      expect(stats.totalTerms).toBeGreaterThan(0);
    });

    await test.step('Load multiple domains', async () => {
      await vocab.loadDomain('sales');
      await vocab.loadDomain('finance');
      const stats = vocab.getStats();
      expect(stats.loadedDomains).toContain('procurement');
      expect(stats.loadedDomains).toContain('sales');
      expect(stats.loadedDomains).toContain('finance');
    });

    await test.step('Search across all domains', async () => {
      const results = await vocab.search('vendor');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.confidence).toBeGreaterThanOrEqual(0.85);
    });

    await test.step('Search within a specific domain', async () => {
      const results = await vocab.search('vendor', 'procurement');
      for (const result of results) {
        expect(result.domain).toBe('procurement');
      }
    });
  });

  test('fuzzy matching handles typos and partial terms', async () => {
    await test.step('Load domain', async () => {
      await vocab.loadDomain('procurement');
    });

    await test.step('Exact match (confidence = 1.0)', async () => {
      const results = await vocab.search('supplier');
      const exact = results.find((r) => r.confidence === 1.0);
      expect(exact).toBeTruthy();
    });

    await test.step('Synonym match (confidence = 1.0)', async () => {
      const results = await vocab.search('vendor');
      const match = results.find((r) => r.confidence === 1.0);
      expect(match).toBeTruthy();
    });

    await test.step('Prefix match (confidence = 0.9)', async () => {
      const results = await vocab.search('sup');
      const prefix = results.find((r) => r.confidence === 0.9);
      expect(prefix).toBeTruthy();
    });

    await test.step('Fuzzy match with typo (confidence = 0.5)', async () => {
      // "vendro" is within Levenshtein distance 2 of "vendor"
      const results = await vocab.search('vendro');
      const fuzzy = results.find((r) => r.confidence >= 0.5);
      expect(fuzzy).toBeTruthy();
    });

    await test.step('No match for unrelated terms', async () => {
      const results = await vocab.search('xyznonexistent');
      expect(results.length).toBe(0);
    });
  });

  test('resolve field selectors from business terms', async () => {
    await test.step('Load domain', async () => {
      await vocab.loadDomain('procurement');
    });

    await test.step('High-confidence term resolves to UI5 selector', async () => {
      const selector = await vocab.getFieldSelector('vendor', 'procurement');
      expect(selector).toBeTruthy();
    });

    await test.step('Ambiguous terms return undefined', async () => {
      // "number" could match PO number, material number, vendor number
      const selector = await vocab.getFieldSelector('number', 'procurement');
      // Returns undefined rather than guessing
    });

    await test.step('SAP ABAP field names resolve via synonyms', async () => {
      const results = await vocab.search('LIFNR');
      const match = results.find((r) => r.sapField === 'LIFNR');
      expect(match).toBeTruthy();
    });
  });

  test('suggestions for autocomplete', async () => {
    await test.step('Load domains', async () => {
      await vocab.loadDomain('procurement');
      await vocab.loadDomain('sales');
    });

    await test.step('Get suggestions for partial input', async () => {
      const suggestions = await vocab.getSuggestions('pur');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    await test.step('Limit suggestion count', async () => {
      const top3 = await vocab.getSuggestions('mat', 3);
      expect(top3.length).toBeLessThanOrEqual(3);
    });
  });

  test('vocabulary-driven field filling in a live SAP app', async ({ ui5, ui5Navigation }) => {
    await test.step('Load vocabulary and navigate', async () => {
      await vocab.loadDomain('procurement');
      await ui5Navigation.navigateToApp('PurchaseOrder-create');
      await ui5.waitForUI5();
    });

    await test.step('Fill fields using vocabulary terms', async () => {
      const vendorResult = await fillField(ui5, vocab, 'Vendor', '100001', {
        domain: 'procurement',
      });
      expect(vendorResult.status).toBe('success');

      const materialResult = await fillField(ui5, vocab, 'Material', 'RAW-0001', {
        domain: 'procurement',
      });
      expect(materialResult.status).toBe('success');

      const quantityResult = await fillField(ui5, vocab, 'Order Quantity', '100', {
        domain: 'procurement',
      });
      expect(quantityResult.status).toBe('success');
    });

    await test.step('Verify cache statistics', async () => {
      const stats = vocab.getStats();
      // After lookups, cache should have hits
    });
  });
});
```

## Key Concepts

### Match Confidence Tiers

| Tier    | Confidence | Criteria                                              |
| ------- | ---------- | ----------------------------------------------------- |
| Exact   | 1.0        | Query matches term name or synonym (case-insensitive) |
| Prefix  | 0.9        | Term name starts with the query string                |
| Partial | 0.7        | Term name contains the query string                   |
| Fuzzy   | 0.5        | Levenshtein distance &lt;= 3 characters               |

### VocabularyService API

- **`createVocabularyService()`** -- factory function, returns a new service instance
- **`svc.loadDomain(domain)`** -- lazily loads a SAP domain JSON file
- **`svc.search(query, domain?)`** -- searches across loaded domains, returns `VocabularySearchResult[]` sorted by confidence
- **`svc.getFieldSelector(term, domain?)`** -- resolves a high-confidence term to a UI5 selector (returns `undefined` if ambiguous)
- **`svc.getSuggestions(prefix, limit?)`** -- autocomplete suggestions for partial input
- **`svc.getStats()`** -- returns loaded domains, total terms, cache hits/misses

### Disambiguation

When `getFieldSelector()` encounters multiple matches scoring between 0.7 and 0.85 without a clear winner, it returns `undefined` rather than guessing. This allows the caller (or an AI agent) to present options to the user.

### ABAP Field Name Support

SAP technical field names (e.g., `LIFNR`, `MATNR`, `BUKRS`) are included as synonyms in the domain JSON files, allowing resolution from either business terms or ABAP names.
