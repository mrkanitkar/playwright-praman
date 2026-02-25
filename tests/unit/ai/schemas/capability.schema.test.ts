/**
 * Unit tests for `src/ai/schemas/capability.schema.ts`.
 *
 * @remarks
 * Validates Zod schemas for capability registry entries, categories,
 * priorities, and the full YAML file structure.
 *
 * @module ai
 */

import { describe, expect, it } from 'vitest';

import {
  CapabilitiesYamlSchema,
  CapabilityCategorySchema,
  CapabilityEntrySchema,
  CapabilityPrioritySchema,
} from '#ai/schemas/capability.schema.js';

// ── CapabilityCategorySchema ────────────────────────────────────────────────

describe('CapabilityCategorySchema', () => {
  const validCategories = [
    'ui5',
    'auth',
    'navigate',
    'table',
    'dialog',
    'date',
    'odata',
    'fe',
    'intent',
    'flp',
    'shell',
    'footer',
    'ai',
    'data',
  ] as const;

  for (const category of validCategories) {
    it(`accepts '${category}'`, () => {
      expect(CapabilityCategorySchema.parse(category)).toBe(category);
    });
  }

  it('rejects an unknown category', () => {
    expect(() => CapabilityCategorySchema.parse('unknown')).toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => CapabilityCategorySchema.parse('')).toThrow();
  });

  it('rejects a number', () => {
    expect(() => CapabilityCategorySchema.parse(42)).toThrow();
  });
});

// ── CapabilityPrioritySchema ────────────────────────────────────────────────

describe('CapabilityPrioritySchema', () => {
  const validPriorities = ['fixture', 'namespace', 'implementation'] as const;

  for (const priority of validPriorities) {
    it(`accepts '${priority}'`, () => {
      expect(CapabilityPrioritySchema.parse(priority)).toBe(priority);
    });
  }

  it('rejects an unknown priority', () => {
    expect(() => CapabilityPrioritySchema.parse('critical')).toThrow();
  });
});

// ── CapabilityEntrySchema ───────────────────────────────────────────────────

describe('CapabilityEntrySchema', () => {
  const validEntry = {
    id: 'UI5-TABLE-001',
    qualifiedName: 'ui5.table.detectType',
    name: 'detectType',
    description: 'Detects the table type and returns metadata.',
    category: 'table',
    priority: 'fixture',
    usageExample: "const info = await ui5.table.detectType('orderTable');",
    registryVersion: 1,
  };

  it('accepts a valid entry', () => {
    const result = CapabilityEntrySchema.parse(validEntry);
    expect(result.id).toBe('UI5-TABLE-001');
    expect(result.qualifiedName).toBe('ui5.table.detectType');
    expect(result.name).toBe('detectType');
    expect(result.category).toBe('table');
    expect(result.priority).toBe('fixture');
  });

  it('accepts entry with optional fields', () => {
    const result = CapabilityEntrySchema.parse({
      ...validEntry,
      intent: 'Detect table type',
      sapModule: 'sap.ui.table',
      controlTypes: ['sap.ui.table.Table', 'sap.m.Table'],
      async: true,
    });
    expect(result.intent).toBe('Detect table type');
    expect(result.sapModule).toBe('sap.ui.table');
    expect(result.controlTypes).toEqual(['sap.ui.table.Table', 'sap.m.Table']);
    expect(result.async).toBe(true);
  });

  it('accepts IDs with digits in the prefix (e.g. UI5-UI5-001)', () => {
    const result = CapabilityEntrySchema.parse({
      ...validEntry,
      id: 'UI5-UI5-001',
    });
    expect(result.id).toBe('UI5-UI5-001');
  });

  it('rejects an entry with invalid ID format', () => {
    expect(() => CapabilityEntrySchema.parse({ ...validEntry, id: 'invalid-id' })).toThrow();
  });

  it('rejects an entry with lowercase ID prefix', () => {
    expect(() => CapabilityEntrySchema.parse({ ...validEntry, id: 'UI5-table-001' })).toThrow();
  });

  it('rejects an empty qualifiedName', () => {
    expect(() => CapabilityEntrySchema.parse({ ...validEntry, qualifiedName: '' })).toThrow();
  });

  it('rejects a description shorter than 10 characters', () => {
    expect(() => CapabilityEntrySchema.parse({ ...validEntry, description: 'Short' })).toThrow();
  });

  it('rejects an invalid category', () => {
    expect(() => CapabilityEntrySchema.parse({ ...validEntry, category: 'invalid' })).toThrow();
  });

  it('rejects an invalid priority', () => {
    expect(() => CapabilityEntrySchema.parse({ ...validEntry, priority: 'critical' })).toThrow();
  });

  it('rejects registryVersion !== 1', () => {
    expect(() => CapabilityEntrySchema.parse({ ...validEntry, registryVersion: 2 })).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() =>
      CapabilityEntrySchema.parse({
        qualifiedName: validEntry.qualifiedName,
        name: validEntry.name,
        description: validEntry.description,
        category: validEntry.category,
        priority: validEntry.priority,
        usageExample: validEntry.usageExample,
        registryVersion: validEntry.registryVersion,
      }),
    ).toThrow();
  });
});

// ── CapabilitiesYamlSchema ──────────────────────────────────────────────────

describe('CapabilitiesYamlSchema', () => {
  /** Builds `n` valid entries for testing the min(100) constraint. */
  function makeEntries(n: number): Record<string, unknown>[] {
    return Array.from({ length: n }, (_, i) => {
      const idx = String(i + 1);
      return {
        id: `UI5-TEST-${idx.padStart(3, '0')}`,
        qualifiedName: `test.entry${idx}`,
        name: `entry${idx}`,
        description: `Test entry number ${idx} for validation`,
        category: 'ui5',
        priority: 'fixture',
        usageExample: `await test.entry${idx}();`,
        registryVersion: 1,
      };
    });
  }

  it('accepts a valid YAML structure with 100+ capabilities', () => {
    const result = CapabilitiesYamlSchema.parse({
      registryVersion: 1,
      generatedAt: '2025-01-01T00:00:00Z',
      categories: {
        ui5: { prefix: 'UI5', description: 'Core UI5 capabilities' },
        table: { prefix: 'TABLE', description: 'Table capabilities' },
      },
      capabilities: makeEntries(100),
    });
    expect(result.capabilities).toHaveLength(100);
    expect(result.registryVersion).toBe(1);
  });

  it('rejects fewer than 100 capabilities', () => {
    expect(() =>
      CapabilitiesYamlSchema.parse({
        registryVersion: 1,
        generatedAt: '2025-01-01T00:00:00Z',
        categories: {},
        capabilities: makeEntries(99),
      }),
    ).toThrow();
  });

  it('rejects missing registryVersion', () => {
    expect(() =>
      CapabilitiesYamlSchema.parse({
        generatedAt: '2025-01-01T00:00:00Z',
        categories: {},
        capabilities: makeEntries(100),
      }),
    ).toThrow();
  });

  it('rejects wrong registryVersion', () => {
    expect(() =>
      CapabilitiesYamlSchema.parse({
        registryVersion: 2,
        generatedAt: '2025-01-01T00:00:00Z',
        categories: {},
        capabilities: makeEntries(100),
      }),
    ).toThrow();
  });
});
