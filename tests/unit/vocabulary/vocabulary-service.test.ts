/**
 * Unit tests for vocabulary-service.ts.
 *
 * @remarks
 * Uses vi.mock to prevent real file I/O. Tests inject mock domain data
 * via the `domainsDir` parameter override in createVocabularyService.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { VocabularyTerm } from '#vocabulary/types.js';
import { loadDomainFile } from '#vocabulary/vocabulary-loader.js';
import { createVocabularyService } from '#vocabulary/vocabulary-service.js';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock the loader module so loadDomainFile returns controlled data
vi.mock('#vocabulary/vocabulary-loader.js', () => ({
  loadDomainFile: vi.fn(),
  resolveDomainsDir: vi.fn(() => '/mocked/domains'),
}));

const mockLoadDomainFile = loadDomainFile as ReturnType<typeof vi.fn>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

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

const CUSTOMER_TERM: VocabularyTerm = {
  name: 'customer',
  synonyms: ['client', 'buyer'],
  domain: 'sales',
  sapField: 'KUNNR',
  selector: { controlType: 'sap.m.Input', properties: { labelFor: 'Customer' } },
};

function makeProcurementTermsMap(): Map<string, VocabularyTerm> {
  const map = new Map<string, VocabularyTerm>();
  map.set('vendor', VENDOR_TERM);
  map.set('material', MATERIAL_TERM);
  return map;
}

function makeSalesTermsMap(): Map<string, VocabularyTerm> {
  const map = new Map<string, VocabularyTerm>();
  map.set('customer', CUSTOMER_TERM);
  return map;
}

// ── Setup helper ──────────────────────────────────────────────────────────────

function makeMockLoader(): void {
  mockLoadDomainFile.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/promise-function-async -- mock callback intentionally returns Promise.resolve() without async
    (domain: string): Promise<Map<string, VocabularyTerm>> => {
      if (domain === 'procurement') {
        return Promise.resolve(makeProcurementTermsMap());
      }
      if (domain === 'sales') {
        return Promise.resolve(makeSalesTermsMap());
      }
      return Promise.resolve(new Map<string, VocabularyTerm>());
    },
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createVocabularyService', () => {
  it('returns a VocabularyService object', () => {
    const svc = createVocabularyService('/mock/dir');
    expect(typeof svc.search).toBe('function');
    expect(typeof svc.getFieldSelector).toBe('function');
    expect(typeof svc.getSuggestions).toBe('function');
    expect(typeof svc.loadDomain).toBe('function');
    expect(typeof svc.getStats).toBe('function');
  });

  it('resolves domainsDir automatically when no argument provided', () => {
    // Calls the ?? branch: resolveDomainsDir(import.meta.url)
    const svc = createVocabularyService();
    expect(typeof svc.getStats).toBe('function');
    const stats = svc.getStats();
    expect(stats.totalTerms).toBe(0);
  });
});

describe('VocabularyService.loadDomain', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    makeMockLoader();
  });

  it('loads a domain successfully', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');
    const stats = svc.getStats();
    expect(stats.loadedDomains).toContain('procurement');
  });

  it('loading the same domain twice is a no-op (calls loader once)', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');
    await svc.loadDomain('procurement');
    expect(mockLoadDomainFile).toHaveBeenCalledTimes(1);
  });

  it('can load multiple domains', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');
    await svc.loadDomain('sales');
    const stats = svc.getStats();
    expect(stats.loadedDomains).toContain('procurement');
    expect(stats.loadedDomains).toContain('sales');
  });
});

describe('VocabularyService.search', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    makeMockLoader();
  });

  it('returns results sorted by confidence descending', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    const results = await svc.search('vendor');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.confidence).toBeGreaterThanOrEqual(results[i]?.confidence ?? 0);
    }
  });

  it('returns results for synonym query (supplier → vendor)', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    const results = await svc.search('supplier');
    const vendorResult = results.find((r) => r.term === 'vendor');
    expect(vendorResult).toBeDefined();
    expect(vendorResult?.confidence).toBe(1.0);
  });

  it('returns empty array when no domain is loaded', async () => {
    const svc = createVocabularyService('/mock/dir');
    const results = await svc.search('vendor');
    expect(results).toHaveLength(0);
  });

  it('restricts search to specified domain', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');
    await svc.loadDomain('sales');

    // 'vendor' only exists in procurement domain
    const results = await svc.search('vendor', 'sales');
    expect(results.every((r) => r.domain === 'sales')).toBe(true);
  });

  it('invokes sort comparator when multiple results found across domains', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');
    await svc.loadDomain('sales');

    // 'er' partially matches vendor, material, customer — produces multiple results
    const results = await svc.search('er');
    expect(results.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.confidence).toBeGreaterThanOrEqual(results[i]?.confidence ?? 0);
    }
  });

  it('returns empty array when specified domain is not loaded', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    // 'finance' was never loaded — the domain map entry is missing
    const results = await svc.search('vendor', 'finance');
    expect(results).toHaveLength(0);
  });

  it('searches across all loaded domains when no domain specified', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');
    await svc.loadDomain('sales');

    const procurementResults = await svc.search('vendor');
    expect(procurementResults.some((r) => r.domain === 'procurement')).toBe(true);
  });

  it('increments cacheHits when results found', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    await svc.search('vendor');
    const stats = svc.getStats();
    expect(stats.cacheHits).toBe(1);
    expect(stats.cacheMisses).toBe(0);
  });

  it('increments cacheMisses when no results found', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    await svc.search('zzznomatch');
    const stats = svc.getStats();
    expect(stats.cacheMisses).toBe(1);
    expect(stats.cacheHits).toBe(0);
  });
});

describe('VocabularyService.getFieldSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    makeMockLoader();
  });

  it('returns selector for high-confidence exact match', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    const selector = await svc.getFieldSelector('vendor');
    expect(selector).toBeDefined();
    expect(selector?.controlType).toBe('sap.m.Input');
  });

  it('returns undefined when no domain loaded', async () => {
    const svc = createVocabularyService('/mock/dir');
    const selector = await svc.getFieldSelector('vendor');
    expect(selector).toBeUndefined();
  });

  it('returns undefined for ambiguous or low-confidence match', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    // 'xyz' won't match anything well
    const selector = await svc.getFieldSelector('xyz');
    expect(selector).toBeUndefined();
  });

  it('accepts optional domain parameter', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    const selector = await svc.getFieldSelector('vendor', 'procurement');
    expect(selector).toBeDefined();
  });
});

describe('VocabularyService.getSuggestions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    makeMockLoader();
  });

  it('returns term names starting with partial', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    const suggestions = await svc.getSuggestions('ven');
    expect(suggestions).toContain('vendor');
  });

  it('returns empty array for empty partial', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    const suggestions = await svc.getSuggestions('');
    expect(suggestions).toHaveLength(0);
  });

  it('respects maxResults parameter', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');
    await svc.loadDomain('sales');

    const suggestions = await svc.getSuggestions('m', 1);
    expect(suggestions).toHaveLength(1);
  });

  it('returns empty array when no matching prefix', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    const suggestions = await svc.getSuggestions('zzzzzz');
    expect(suggestions).toHaveLength(0);
  });
});

describe('VocabularyService.getStats', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    makeMockLoader();
  });

  it('returns empty stats before any domain is loaded', () => {
    const svc = createVocabularyService('/mock/dir');
    const stats = svc.getStats();
    expect(stats.loadedDomains).toHaveLength(0);
    expect(stats.totalTerms).toBe(0);
    expect(stats.cacheHits).toBe(0);
    expect(stats.cacheMisses).toBe(0);
  });

  it('reflects loaded domain after loadDomain()', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');

    const stats = svc.getStats();
    expect(stats.loadedDomains).toContain('procurement');
    expect(stats.totalTerms).toBeGreaterThan(0);
  });

  it('counts terms from all loaded domains', async () => {
    const svc = createVocabularyService('/mock/dir');
    await svc.loadDomain('procurement');
    const statsOne = svc.getStats();

    await svc.loadDomain('sales');
    const statsTwo = svc.getStats();

    expect(statsTwo.totalTerms).toBeGreaterThan(statsOne.totalTerms);
  });
});
