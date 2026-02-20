/**
 * Unit tests for vocabulary-loader.ts.
 *
 * @remarks
 * Uses vi.mock to intercept node:fs/promises readFile, ensuring no real
 * file I/O occurs during test execution.
 */
import { readFile } from 'node:fs/promises';

import { describe, expect, it, vi, beforeEach } from 'vitest';

import { VocabularyError } from '#core/errors/index.js';
import { loadDomainFile, resolveDomainsDir } from '#vocabulary/vocabulary-loader.js';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

const mockReadFile = readFile as ReturnType<typeof vi.fn>;

// ── Test JSON fixture ─────────────────────────────────────────────────────────

const PROCUREMENT_JSON = JSON.stringify({
  domain: 'procurement',
  module: 'MM',
  ui5Selectors: {
    purchaseOrder: {
      header: {
        supplier: {
          labelFor: { text: 'Supplier' },
          intentApiMethod: 'searchAndSelectFromValueHelp',
          hasValueHelp: true,
          sapFieldName: 'LIFNR',
          aliases: ['vendor', 'vendorId', 'supplierId'],
        },
        companyCode: {
          labelFor: { text: 'Company Code' },
          intentApiMethod: 'searchAndSelectFromValueHelp',
          hasValueHelp: true,
          sapFieldName: 'BUKRS',
          aliases: ['BUKRS', 'company'],
        },
      },
      item: {
        material: {
          labelFor: { text: 'Material' },
          intentApiMethod: 'searchAndSelectFromValueHelp',
          hasValueHelp: true,
          sapFieldName: 'MATNR',
          aliases: ['materialNumber', 'MATNR', 'product'],
        },
      },
      actions: {
        save: {
          controlType: 'sap.m.Button',
          properties: { text: 'Save' },
          intentApiMethod: 'clickButton',
        },
      },
    },
  },
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('loadDomainFile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns a Map of VocabularyTerms on success', async () => {
    mockReadFile.mockResolvedValue(PROCUREMENT_JSON);

    const terms = await loadDomainFile('procurement', '/fake/domains');
    expect(terms).toBeInstanceOf(Map);
    expect(terms.size).toBeGreaterThan(0);
  });

  it('extracts supplier term with correct sapField', async () => {
    mockReadFile.mockResolvedValue(PROCUREMENT_JSON);

    const terms = await loadDomainFile('procurement', '/fake/domains');
    const supplier = terms.get('supplier');
    expect(supplier).toBeDefined();
    expect(supplier?.sapField).toBe('LIFNR');
  });

  it('extracts supplier term with correct synonyms', async () => {
    mockReadFile.mockResolvedValue(PROCUREMENT_JSON);

    const terms = await loadDomainFile('procurement', '/fake/domains');
    const supplier = terms.get('supplier');
    expect(supplier?.synonyms).toContain('vendor');
    expect(supplier?.synonyms).toContain('vendorId');
    expect(supplier?.synonyms).toContain('supplierId');
  });

  it('builds labelFor selector for field with labelFor.text', async () => {
    mockReadFile.mockResolvedValue(PROCUREMENT_JSON);

    const terms = await loadDomainFile('procurement', '/fake/domains');
    const supplier = terms.get('supplier');
    expect(supplier?.selector).toBeDefined();
    expect(supplier?.selector?.controlType).toBe('sap.m.Input');
  });

  it('builds controlType selector for action button', async () => {
    mockReadFile.mockResolvedValue(PROCUREMENT_JSON);

    const terms = await loadDomainFile('procurement', '/fake/domains');
    const save = terms.get('save');
    expect(save).toBeDefined();
    expect(save?.selector?.controlType).toBe('sap.m.Button');
  });

  it('indexes aliases so they can be found in the map', async () => {
    mockReadFile.mockResolvedValue(PROCUREMENT_JSON);

    const terms = await loadDomainFile('procurement', '/fake/domains');
    // 'vendor' is an alias of 'supplier' and should be in the map
    const vendorEntry = terms.get('vendor');
    expect(vendorEntry).toBeDefined();
    expect(vendorEntry?.name).toBe('supplier');
  });

  it('sets domain on all extracted terms', async () => {
    mockReadFile.mockResolvedValue(PROCUREMENT_JSON);

    const terms = await loadDomainFile('procurement', '/fake/domains');
    for (const term of terms.values()) {
      expect(term.domain).toBe('procurement');
    }
  });

  it('throws VocabularyError when file cannot be read', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

    await expect(loadDomainFile('procurement', '/nonexistent')).rejects.toThrow(VocabularyError);
  });

  it('throws VocabularyError with ERR_VOCAB_DOMAIN_LOAD_FAILED code on read failure', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    try {
      await loadDomainFile('procurement', '/nonexistent');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(VocabularyError);
      const vocabErr = err as VocabularyError;
      expect(vocabErr.code).toBe('ERR_VOCAB_DOMAIN_LOAD_FAILED');
      expect(vocabErr.domain).toBe('procurement');
    }
  });

  it('throws VocabularyError with ERR_VOCAB_JSON_INVALID code on parse failure', async () => {
    mockReadFile.mockResolvedValue('not valid json {{{{');

    try {
      await loadDomainFile('procurement', '/fake/domains');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(VocabularyError);
      const vocabErr = err as VocabularyError;
      expect(vocabErr.code).toBe('ERR_VOCAB_JSON_INVALID');
    }
  });

  it('returns empty map when ui5Selectors is missing', async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ domain: 'procurement' }));

    const terms = await loadDomainFile('procurement', '/fake/domains');
    expect(terms.size).toBe(0);
  });

  it('extracts material term from item section', async () => {
    mockReadFile.mockResolvedValue(PROCUREMENT_JSON);

    const terms = await loadDomainFile('procurement', '/fake/domains');
    const material = terms.get('material');
    expect(material).toBeDefined();
    expect(material?.sapField).toBe('MATNR');
  });

  it('builds selector with controlType but no properties when properties field absent', async () => {
    const json = JSON.stringify({
      domain: 'procurement',
      ui5Selectors: {
        purchaseOrder: {
          actions: {
            approve: {
              controlType: 'sap.m.Button',
              intentApiMethod: 'clickButton',
              // no properties field
            },
          },
        },
      },
    });
    mockReadFile.mockResolvedValue(json);

    const terms = await loadDomainFile('procurement', '/fake/domains');
    const approve = terms.get('approve');
    expect(approve).toBeDefined();
    expect(approve?.selector?.controlType).toBe('sap.m.Button');
    expect(approve?.selector?.properties).toBeUndefined();
  });

  it('produces term with no selector when field has neither controlType nor labelFor', async () => {
    const json = JSON.stringify({
      domain: 'procurement',
      ui5Selectors: {
        purchaseOrder: {
          header: {
            notes: {
              intentApiMethod: 'setValue',
              hasValueHelp: false,
              sapFieldName: 'TXZ01',
              aliases: ['comment'],
              // neither controlType nor labelFor.text
            },
          },
        },
      },
    });
    mockReadFile.mockResolvedValue(json);

    const terms = await loadDomainFile('procurement', '/fake/domains');
    const notes = terms.get('notes');
    expect(notes).toBeDefined();
    expect(notes?.selector).toBeUndefined();
  });
});

// ── resolveDomainsDir ─────────────────────────────────────────────────────────

describe('resolveDomainsDir', () => {
  it('returns a non-empty string', () => {
    const dir = resolveDomainsDir(import.meta.url);
    expect(typeof dir).toBe('string');
    expect(dir.length).toBeGreaterThan(0);
  });

  it('path ends with "domains"', () => {
    const dir = resolveDomainsDir(import.meta.url);
    expect(dir.endsWith('domains') || dir.endsWith('domains/')).toBe(true);
  });

  it('falls back to cwd-based path when metaUrl is not a valid file URL', () => {
    // Passing a non-file URL triggers the catch branch in resolveDomainsDir
    const dir = resolveDomainsDir('https://example.com/not-a-file-url');
    expect(typeof dir).toBe('string');
    expect(dir.length).toBeGreaterThan(0);
  });
});
