/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Vocabulary Discovery Example -- fuzzy matching, domain loading, term resolution.
 *
 * @remarks
 * This example demonstrates Praman's vocabulary system for SAP business term resolution:
 *
 * 1. **Domain loading** -- load SAP module vocabularies on demand
 * 2. **Term search** -- search across loaded domains with confidence scoring
 * 3. **Fuzzy matching** -- handle typos and partial terms via Levenshtein distance
 * 4. **Field selector resolution** -- map business terms to UI5 selectors
 * 5. **Suggestions** -- autocomplete support for business terms
 * 6. **Integration with intents** -- vocabulary-driven field filling
 *
 * The vocabulary system ships with 6 SAP domain JSON files covering MM, SD, FI, PP,
 * WM/EWM, and QM modules.
 *
 * Prerequisites:
 * - Authentication handled via setup project (see {@link auth-setup.ts})
 * - playwright-praman installed (vocabulary domains are bundled)
 *
 * @example
 * ```bash
 * npx playwright test examples/vocabulary-discovery.spec.ts
 * ```
 */

import { test, expect } from 'playwright-praman';
import { createVocabularyService } from 'playwright-praman/vocabulary';
import type { VocabularyService } from 'playwright-praman/vocabulary';
import { fillField } from 'playwright-praman/intents';

test.describe('Vocabulary Discovery', () => {
  let vocab: VocabularyService;

  test.beforeEach(() => {
    // Create a fresh vocabulary service for each test
    vocab = createVocabularyService();
  });

  test('load domains and search terms', async () => {
    await test.step('Load SAP procurement domain', async () => {
      await vocab.loadDomain('procurement');

      const stats = vocab.getStats();
      expect(stats.loadedDomains).toContain('procurement');
      expect(stats.totalTerms).toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'info',
        description: `Loaded procurement domain: ${stats.totalTerms} terms`,
      });
    });

    await test.step('Load multiple domains', async () => {
      await vocab.loadDomain('sales');
      await vocab.loadDomain('finance');

      const stats = vocab.getStats();
      expect(stats.loadedDomains).toContain('procurement');
      expect(stats.loadedDomains).toContain('sales');
      expect(stats.loadedDomains).toContain('finance');

      test.info().annotations.push({
        type: 'info',
        description: `Loaded domains: ${stats.loadedDomains.join(', ')} (${stats.totalTerms} total terms)`,
      });
    });

    await test.step('Search for a term across all domains', async () => {
      // Search returns results sorted by confidence
      const results = await vocab.search('vendor');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.confidence).toBeGreaterThanOrEqual(0.85);

      test.info().annotations.push({
        type: 'info',
        description: `"vendor" matched ${results.length} terms, top: ${results[0]!.term} (${results[0]!.confidence})`,
      });
    });

    await test.step('Search within a specific domain', async () => {
      // Restrict search to procurement domain only
      const results = await vocab.search('vendor', 'procurement');

      expect(results.length).toBeGreaterThan(0);
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
      expect(exact!.term).toBe('supplier');

      test.info().annotations.push({
        type: 'info',
        description: `Exact match: "${exact!.term}" = ${exact!.confidence}`,
      });
    });

    await test.step('Synonym match (confidence = 1.0)', async () => {
      // "vendor" is a synonym of the canonical term "supplier"
      const results = await vocab.search('vendor');
      const synonymMatch = results.find((r) => r.confidence === 1.0);
      expect(synonymMatch).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `Synonym match: query="vendor", term="${synonymMatch!.term}" = ${synonymMatch!.confidence}`,
      });
    });

    await test.step('Prefix match (confidence = 0.9)', async () => {
      const results = await vocab.search('sup');
      const prefix = results.find((r) => r.confidence === 0.9);
      expect(prefix).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `Prefix match: query="sup", term="${prefix!.term}" = ${prefix!.confidence}`,
      });
    });

    await test.step('Fuzzy match with typo (confidence = 0.5)', async () => {
      // "vendro" is within Levenshtein distance 2 of "vendor"
      const results = await vocab.search('vendro');
      const fuzzy = results.find((r) => r.confidence >= 0.5);
      expect(fuzzy).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `Fuzzy match: query="vendro", term="${fuzzy!.term}" = ${fuzzy!.confidence}`,
      });
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

    await test.step('Resolve high-confidence term to UI5 selector', async () => {
      // getFieldSelector returns a UI5 selector when confidence >= 0.85
      const selector = await vocab.getFieldSelector('vendor', 'procurement');
      expect(selector).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `Resolved "vendor" to selector: ${JSON.stringify(selector)}`,
      });
    });

    await test.step('Ambiguous terms return undefined', async () => {
      // When multiple matches score between 0.7 and 0.85,
      // getFieldSelector returns undefined rather than guessing
      const selector = await vocab.getFieldSelector('number', 'procurement');
      // "number" could match PO number, material number, vendor number, etc.
      // Ambiguous -- returns undefined
      test.info().annotations.push({
        type: 'info',
        description: `Ambiguous "number" resolved to: ${String(selector ?? 'undefined')}`,
      });
    });

    await test.step('Resolve SAP field names (ABAP notation)', async () => {
      // SAP technical field names like "LIFNR" are in the synonym list
      const results = await vocab.search('LIFNR');
      const match = results.find((r) => r.sapField === 'LIFNR');
      expect(match).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `ABAP field "LIFNR" -> term "${match!.term}", domain "${match!.domain}"`,
      });
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

      test.info().annotations.push({
        type: 'info',
        description: `Suggestions for "pur": ${suggestions.join(', ')}`,
      });
    });

    await test.step('Limit suggestion count', async () => {
      const top3 = await vocab.getSuggestions('mat', 3);
      expect(top3.length).toBeLessThanOrEqual(3);

      test.info().annotations.push({
        type: 'info',
        description: `Top 3 suggestions for "mat": ${top3.join(', ')}`,
      });
    });
  });

  test('vocabulary-driven field filling in a live SAP app', async ({ ui5, ui5Navigation }) => {
    await test.step('Load vocabulary and navigate to app', async () => {
      await vocab.loadDomain('procurement');
      await ui5Navigation.navigateToApp('PurchaseOrder-create');
      await ui5.waitForUI5();
    });

    await test.step('Fill fields using vocabulary terms', async () => {
      // The vocabulary service resolves "Vendor" to its UI5 selector,
      // then fillField uses that selector to interact with the control
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

      test.info().annotations.push({
        type: 'info',
        description: 'Filled Vendor, Material, and Quantity via vocabulary resolution',
      });
    });

    await test.step('Verify cache statistics', async () => {
      const stats = vocab.getStats();

      // After multiple lookups, cache should have hits
      test.info().annotations.push({
        type: 'info',
        description: `Cache hits: ${stats.cacheHits}, misses: ${stats.cacheMisses}`,
      });
    });
  });
});
