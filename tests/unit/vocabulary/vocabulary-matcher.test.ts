/**
 * Hermetic unit tests for vocabulary-matcher.ts.
 *
 * @remarks
 * All tests are pure algorithm tests — no file I/O, no external state.
 * Terms are constructed inline; no JSON loading occurs.
 */
import { describe, expect, it } from 'vitest';

import type { VocabularyTerm, VocabularySearchResult } from '#vocabulary/types.js';
import {
  computeConfidence,
  matchTerms,
  resolveFieldSelector,
  scoreTerm,
} from '#vocabulary/vocabulary-matcher.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const VENDOR_TERM: VocabularyTerm = {
  name: 'vendor',
  synonyms: ['supplier', 'supplierId'],
  domain: 'procurement',
  sapField: 'LIFNR',
  selector: { controlType: 'sap.m.Input', properties: { labelFor: 'Vendor' } },
};

const MATERIAL_TERM: VocabularyTerm = {
  name: 'material',
  synonyms: ['product', 'MATNR'],
  domain: 'procurement',
  sapField: 'MATNR',
  selector: { controlType: 'sap.m.Input', properties: { labelFor: 'Material' } },
};

const PLANT_TERM: VocabularyTerm = {
  name: 'plant',
  synonyms: ['facility', 'WERKS'],
  domain: 'procurement',
  sapField: 'WERKS',
};

const PAYMENT_TERMS_TERM: VocabularyTerm = {
  name: 'paymentTerms',
  synonyms: ['terms', 'ZTERM'],
  domain: 'procurement',
  sapField: 'ZTERM',
  selector: { controlType: 'sap.m.Input', properties: { labelFor: 'Payment Terms' } },
};

function makeTermsMap(terms: VocabularyTerm[]): Map<string, VocabularyTerm> {
  const map = new Map<string, VocabularyTerm>();
  for (const term of terms) {
    map.set(term.name, term);
  }
  return map;
}

// ── computeConfidence ────────────────────────────────────────────────────────

describe('computeConfidence', () => {
  it('returns 1.0 for exact match', () => {
    expect(computeConfidence('vendor', 'vendor')).toBe(1.0);
  });

  it('returns 0.9 for prefix match', () => {
    expect(computeConfidence('vend', 'vendor')).toBe(0.9);
  });

  it('returns 0.7 for partial (contains) match', () => {
    expect(computeConfidence('endo', 'vendor')).toBe(0.7);
  });

  it('returns 0.5 for fuzzy match within 3 edits', () => {
    // 'vendro' vs 'vendor' — 2 transpositions
    expect(computeConfidence('vendro', 'vendor')).toBe(0.5);
  });

  it('returns 0 for empty query', () => {
    expect(computeConfidence('', 'vendor')).toBe(0);
  });

  it('returns 0 when no match and edit distance > 3', () => {
    // 'abcdefgh' vs 'vendor' — totally different
    expect(computeConfidence('abcdefgh', 'vendor')).toBe(0);
  });

  it('is case sensitive — expects pre-normalized (lower-cased) inputs', () => {
    // computeConfidence operates on already-normalized strings
    expect(computeConfidence('vendor', 'vendor')).toBe(1.0);
    // 'Vendor' vs 'vendor' — differs by one character but within fuzzy threshold
    // 'V' vs 'v' has Levenshtein distance 1, which is ≤ 3 → returns 0.5
    expect(computeConfidence('Vendor', 'vendor')).toBe(0.5);
  });
});

// ── scoreTerm ────────────────────────────────────────────────────────────────

describe('scoreTerm', () => {
  it('returns 1.0 for exact match on canonical name', () => {
    expect(scoreTerm('vendor', VENDOR_TERM)).toBe(1.0);
  });

  it('returns 1.0 for exact match on synonym (supplier)', () => {
    expect(scoreTerm('supplier', VENDOR_TERM)).toBe(1.0);
  });

  it('matches correctly when pre-normalized queries are passed', () => {
    // scoreTerm expects pre-normalized (lower-cased) query,
    // matching the same contract as matchTerms which normalizes before calling scoreTerm
    expect(scoreTerm('vendor', VENDOR_TERM)).toBe(1.0);
    expect(scoreTerm('supplier', VENDOR_TERM)).toBe(1.0);
  });

  it('returns 0.5 for fuzzy match on canonical name (vendro → vendor)', () => {
    expect(scoreTerm('vendro', VENDOR_TERM)).toBe(0.5);
  });

  it('returns 0.9 for prefix match', () => {
    expect(scoreTerm('vend', VENDOR_TERM)).toBe(0.9);
  });

  it('returns 0 for completely unrelated query', () => {
    expect(scoreTerm('xyz123', VENDOR_TERM)).toBe(0);
  });

  it('handles term with no synonyms gracefully', () => {
    const term: VocabularyTerm = {
      name: 'plant',
      synonyms: [],
      domain: 'procurement',
    };
    expect(scoreTerm('plant', term)).toBe(1.0);
    expect(scoreTerm('plan', term)).toBe(0.9);
  });
});

// ── matchTerms ───────────────────────────────────────────────────────────────

describe('matchTerms', () => {
  const termsMap = makeTermsMap([VENDOR_TERM, MATERIAL_TERM, PLANT_TERM, PAYMENT_TERMS_TERM]);

  it('returns empty array for empty query', () => {
    const results = matchTerms('', termsMap, 'procurement');
    expect(results).toEqual([]);
  });

  it('returns empty array for whitespace-only query', () => {
    const results = matchTerms('   ', termsMap, 'procurement');
    expect(results).toEqual([]);
  });

  it('finds exact match with confidence 1.0', () => {
    const results = matchTerms('vendor', termsMap, 'procurement');
    expect(results).toHaveLength(1);
    expect(results[0]?.term).toBe('vendor');
    expect(results[0]?.confidence).toBe(1.0);
  });

  it('finds match by synonym (supplier → vendor)', () => {
    const results = matchTerms('supplier', termsMap, 'procurement');
    const vendorResult = results.find((r) => r.term === 'vendor');
    expect(vendorResult).toBeDefined();
    expect(vendorResult?.confidence).toBe(1.0);
  });

  it('sorts results by confidence descending', () => {
    // 'material' matches 'material' (1.0) and maybe others with lower scores
    const results = matchTerms('material', termsMap, 'procurement');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.confidence).toBeGreaterThanOrEqual(results[i]?.confidence ?? 0);
    }
  });

  it('invokes sort comparator when multiple results match (prefix p → plant + paymentTerms)', () => {
    // Both 'plant' and 'paymentTerms' start with 'p' → two results → sort comparator is called
    const results = matchTerms('p', termsMap, 'procurement');
    expect(results.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.confidence).toBeGreaterThanOrEqual(results[i]?.confidence ?? 0);
    }
  });

  it('attaches domain to results', () => {
    const results = matchTerms('vendor', termsMap, 'procurement');
    expect(results[0]?.domain).toBe('procurement');
  });

  it('attaches sapField when present', () => {
    const results = matchTerms('vendor', termsMap, 'procurement');
    expect(results[0]?.sapField).toBe('LIFNR');
  });

  it('attaches selector when present', () => {
    const results = matchTerms('vendor', termsMap, 'procurement');
    expect(results[0]?.selector).toBeDefined();
    expect(results[0]?.selector?.controlType).toBe('sap.m.Input');
  });

  it('omits sapField from result when term has no sapField', () => {
    const termWithNoSapField: VocabularyTerm = {
      name: 'testTerm',
      synonyms: [],
      domain: 'procurement',
    };
    const map = makeTermsMap([termWithNoSapField]);
    const results = matchTerms('testTerm', map, 'procurement');
    expect('sapField' in (results[0] ?? {})).toBe(false);
  });

  it('includes synonyms in result', () => {
    const results = matchTerms('vendor', termsMap, 'procurement');
    expect(results[0]?.synonyms).toContain('supplier');
    expect(results[0]?.synonyms).toContain('supplierId');
  });
});

// ── resolveFieldSelector ─────────────────────────────────────────────────────

describe('resolveFieldSelector', () => {
  it('returns undefined for empty results', () => {
    expect(resolveFieldSelector([])).toBeUndefined();
  });

  it('returns selector when top result has confidence >= 0.85', () => {
    const results: VocabularySearchResult[] = [
      {
        term: 'vendor',
        synonyms: ['supplier'],
        confidence: 1.0,
        domain: 'procurement',
        sapField: 'LIFNR',
        selector: { controlType: 'sap.m.Input', properties: { labelFor: 'Vendor' } },
      },
    ];
    const selector = resolveFieldSelector(results);
    expect(selector).toBeDefined();
    expect(selector?.controlType).toBe('sap.m.Input');
  });

  it('returns undefined when top result confidence < 0.85', () => {
    const results: VocabularySearchResult[] = [
      {
        term: 'vendor',
        synonyms: [],
        confidence: 0.7,
        domain: 'procurement',
        selector: { controlType: 'sap.m.Input' },
      },
    ];
    expect(resolveFieldSelector(results)).toBeUndefined();
  });

  it('returns undefined when multiple matches are above 0.7 but below 0.85 (ambiguous)', () => {
    const results: VocabularySearchResult[] = [
      {
        term: 'vendor',
        synonyms: [],
        confidence: 0.75,
        domain: 'procurement',
        selector: { controlType: 'sap.m.Input', properties: { labelFor: 'Vendor' } },
      },
      {
        term: 'vendorId',
        synonyms: [],
        confidence: 0.72,
        domain: 'procurement',
        selector: { controlType: 'sap.m.Input', properties: { labelFor: 'Vendor ID' } },
      },
    ];
    expect(resolveFieldSelector(results)).toBeUndefined();
  });

  it('returns undefined when top result has no selector', () => {
    const results: VocabularySearchResult[] = [
      {
        term: 'plant',
        synonyms: [],
        confidence: 1.0,
        domain: 'procurement',
      },
    ];
    expect(resolveFieldSelector(results)).toBeUndefined();
  });

  it('returns selector at confidence exactly 0.85 (boundary)', () => {
    const results: VocabularySearchResult[] = [
      {
        term: 'vendor',
        synonyms: [],
        confidence: 0.85,
        domain: 'procurement',
        selector: { controlType: 'sap.m.Button' },
      },
    ];
    expect(resolveFieldSelector(results)).toBeDefined();
  });

  it('returns selector at confidence 0.9 (prefix match)', () => {
    const results: VocabularySearchResult[] = [
      {
        term: 'vendor',
        synonyms: [],
        confidence: 0.9,
        domain: 'procurement',
        selector: { controlType: 'sap.m.Input' },
      },
    ];
    expect(resolveFieldSelector(results)).toBeDefined();
  });
});

// ── Normalization: special character stripping ────────────────────────────────

describe('normalize (via matchTerms)', () => {
  it('"Purchase-Order" normalizes to "purchaseorder"', () => {
    const poTerm: VocabularyTerm = {
      name: 'purchaseorder',
      synonyms: ['PO'],
      domain: 'procurement',
    };
    const map = makeTermsMap([poTerm]);
    const results = matchTerms('Purchase-Order', map, 'procurement');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.term).toBe('purchaseorder');
    expect(results[0]?.confidence).toBe(1.0);
  });

  it('"G/L_Account" normalizes to "glaccount"', () => {
    const glTerm: VocabularyTerm = {
      name: 'glaccount',
      synonyms: ['general ledger'],
      domain: 'finance',
    };
    const map = makeTermsMap([glTerm]);
    const results = matchTerms('G/L_Account', map, 'finance');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.term).toBe('glaccount');
    expect(results[0]?.confidence).toBe(1.0);
  });

  it('"sap.m.Button" normalizes to "sapmbutton"', () => {
    const btnTerm: VocabularyTerm = {
      name: 'sapmbutton',
      synonyms: [],
      domain: 'procurement',
    };
    const map = makeTermsMap([btnTerm]);
    const results = matchTerms('sap.m.Button', map, 'procurement');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.term).toBe('sapmbutton');
    expect(results[0]?.confidence).toBe(1.0);
  });

  it('"Cost-Center:1000" normalizes to "costcenter1000"', () => {
    const ccTerm: VocabularyTerm = {
      name: 'costcenter1000',
      synonyms: [],
      domain: 'finance',
    };
    const map = makeTermsMap([ccTerm]);
    const results = matchTerms('Cost-Center:1000', map, 'finance');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.term).toBe('costcenter1000');
    expect(results[0]?.confidence).toBe(1.0);
  });

  it('"MM-PUR" normalizes to "mmpur"', () => {
    const mmTerm: VocabularyTerm = {
      name: 'mmpur',
      synonyms: [],
      domain: 'procurement',
    };
    const map = makeTermsMap([mmTerm]);
    const results = matchTerms('MM-PUR', map, 'procurement');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.term).toBe('mmpur');
    expect(results[0]?.confidence).toBe(1.0);
  });

  it('strips backslash characters', () => {
    const pathTerm: VocabularyTerm = {
      name: 'sapbw',
      synonyms: [],
      domain: 'procurement',
    };
    const map = makeTermsMap([pathTerm]);
    const results = matchTerms('SAP\\BW', map, 'procurement');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.term).toBe('sapbw');
    expect(results[0]?.confidence).toBe(1.0);
  });

  it('collapses multiple spaces after stripping special chars', () => {
    // "a   b" (with embedded spaces) → "a b" after collapsing
    const testTerm: VocabularyTerm = {
      name: 'a b',
      synonyms: [],
      domain: 'procurement',
    };
    const map = makeTermsMap([testTerm]);
    const results = matchTerms('a   b', map, 'procurement');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.term).toBe('a b');
    expect(results[0]?.confidence).toBe(1.0);
  });
});

// ── Integration: Levenshtein fuzzy path ──────────────────────────────────────

describe('Levenshtein fuzzy matching (integration)', () => {
  it('finds "vendor" when querying "vendro" (distance 2)', () => {
    const termsMap = makeTermsMap([VENDOR_TERM]);
    const results = matchTerms('vendro', termsMap, 'procurement');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.term).toBe('vendor');
    expect(results[0]?.confidence).toBe(0.5);
  });

  it('does not return result when edit distance > 3', () => {
    const termsMap = makeTermsMap([VENDOR_TERM]);
    // 'xxxxxx' has huge edit distance from 'vendor'
    const results = matchTerms('xxxxxx', termsMap, 'procurement');
    expect(results).toHaveLength(0);
  });

  it('synonym "supplier" produces exact confidence 1.0', () => {
    const termsMap = makeTermsMap([VENDOR_TERM]);
    const results = matchTerms('supplier', termsMap, 'procurement');
    expect(results[0]?.confidence).toBe(1.0);
  });
});
