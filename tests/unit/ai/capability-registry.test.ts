/**
 * Unit tests for `src/ai/capability-registry.ts`.
 *
 * @remarks
 * Verifies registry construction, static version, list/get/has/find/byCategory
 * queries, register(), listByPriority(), findByName(), getStatistics(),
 * toJSON(), and forAI() behaviour. All tests are hermetic — no generated file
 * dependencies are assumed to have data.
 */
import { describe, expect, it, vi } from 'vitest';

// Mock the generated capabilities to keep tests hermetic (empty seed).
vi.mock('#ai/capability-registry.generated.js', () => ({
  GENERATED_CAPABILITIES: [],
}));

import { CapabilityRegistry } from '#ai/capability-registry.js';
import type { CapabilityEntry } from '#ai/types.js';

// ── Test fixtures ──────────────────────────────────────────────────────────

const SAMPLE_ENTRY_A: CapabilityEntry = {
  id: 'UI5-UI5-001',
  qualifiedName: 'ui5.clickButton',
  name: 'clickButton',
  description: 'Clicks a UI5 button control by selector',
  category: 'ui5',
  intent: 'click',
  sapModule: 'sap.m.Button',
  usageExample: "await ui5.click({ id: 'submitBtn' })",
  registryVersion: 1,
  priority: 'fixture',
};

const SAMPLE_ENTRY_B: CapabilityEntry = {
  id: 'UI5-NAV-001',
  qualifiedName: 'ui5.navigateTile',
  name: 'navigateTile',
  description: 'Navigates to a Fiori launchpad tile by title',
  category: 'navigate',
  usageExample: "await ui5.navigateToTile('Sales Orders')",
  registryVersion: 1,
  priority: 'fixture',
};

const SAMPLE_ENTRY_C: CapabilityEntry = {
  id: 'UI5-UI5-002',
  qualifiedName: 'ui5.fillInput',
  name: 'fillInput',
  description: 'Fills a text input control with the given value',
  category: 'ui5',
  intent: 'fill',
  usageExample: "await ui5.fill({ id: 'nameInput' }, 'John')",
  registryVersion: 1,
  priority: 'fixture',
};

const SAMPLE_HANDLER: CapabilityEntry = {
  id: 'UI5-AI0-001',
  qualifiedName: 'ai.agenticHandler',
  name: 'AgenticHandler',
  description: 'Agentic AI handler class for autonomous test generation',
  category: 'ai',
  usageExample: 'const handler = new AgenticHandler(llm, buildPageContext, caps)',
  registryVersion: 1,
  priority: 'namespace',
};

const SAMPLE_IMPL: CapabilityEntry = {
  id: 'UI5-DAT-001',
  qualifiedName: 'data.retryWithBackoff',
  name: 'retryWithBackoff',
  description: 'Internal retry helper with exponential backoff',
  category: 'data',
  usageExample: 'await retryWithBackoff(() => findControl(sel), 3)',
  registryVersion: 1,
  priority: 'implementation',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRegistry(...entries: CapabilityEntry[]): CapabilityRegistry {
  const registry = new CapabilityRegistry();
  for (const entry of entries) {
    registry.register(entry);
  }
  return registry;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('CapabilityRegistry', () => {
  // ── Static properties ──────────────────────────────────────────────────

  describe('registryVersion', () => {
    it('is a number', () => {
      expect(typeof CapabilityRegistry.registryVersion).toBe('number');
    });

    it('equals 1', () => {
      expect(CapabilityRegistry.registryVersion).toBe(1);
    });
  });

  // ── Construction ───────────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates an instance of CapabilityRegistry', () => {
      expect(new CapabilityRegistry()).toBeInstanceOf(CapabilityRegistry);
    });

    it('starts with an empty list when generated file has no entries', () => {
      const registry = new CapabilityRegistry();
      // GENERATED_CAPABILITIES is an empty stub — list() should be empty
      expect(registry.list()).toEqual([]);
    });
  });

  // ── list() ─────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('returns an array', () => {
      const registry = new CapabilityRegistry();
      expect(Array.isArray(registry.list())).toBe(true);
    });

    it('returns all registered entries', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
      expect(registry.list()).toHaveLength(2);
    });

    it('returns a new array on each call (not the internal store)', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      const first = registry.list();
      const second = registry.list();
      expect(first).not.toBe(second);
    });
  });

  // ── register() ─────────────────────────────────────────────────────────

  describe('register()', () => {
    it('adds a new capability to the registry', () => {
      const registry = new CapabilityRegistry();
      registry.register(SAMPLE_ENTRY_A);
      expect(registry.list()).toHaveLength(1);
    });

    it('overwrites an existing entry with the same id', () => {
      const registry = new CapabilityRegistry();
      registry.register(SAMPLE_ENTRY_A);
      const updated: CapabilityEntry = {
        ...SAMPLE_ENTRY_A,
        description: 'Updated description for button click',
      };
      registry.register(updated);
      expect(registry.list()).toHaveLength(1);
      expect(registry.get(SAMPLE_ENTRY_A.id)?.description).toBe(
        'Updated description for button click',
      );
    });

    it('can register multiple distinct entries', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      expect(registry.list()).toHaveLength(3);
    });
  });

  // ── get() ──────────────────────────────────────────────────────────────

  describe('get()', () => {
    it('returns the entry with the given id', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
      const result = registry.get('UI5-UI5-001');
      expect(result).toBeDefined();
      expect(result?.id).toBe('UI5-UI5-001');
      expect(result?.name).toBe('clickButton');
    });

    it('returns undefined for an unknown id', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.get('non-existent-id')).toBeUndefined();
    });

    it('returns the full entry object', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      const entry = registry.get('UI5-UI5-001');
      expect(entry).toEqual(SAMPLE_ENTRY_A);
    });
  });

  // ── has() ──────────────────────────────────────────────────────────────

  describe('has()', () => {
    it('returns true for a registered name', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.has('clickButton')).toBe(true);
    });

    it('returns false for an unknown name', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.has('unknownCapability')).toBe(false);
    });

    it('is case-sensitive (does not match partial name)', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.has('click')).toBe(false);
      expect(registry.has('clickbutton')).toBe(false);
    });

    it('returns false on an empty registry', () => {
      const registry = new CapabilityRegistry();
      expect(registry.has('clickButton')).toBe(false);
    });
  });

  // ── find() ─────────────────────────────────────────────────────────────

  describe('find()', () => {
    it('finds entries by partial name match (case-insensitive)', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      const results = registry.find('click');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((e) => e.id === 'UI5-UI5-001')).toBe(true);
    });

    it('finds entries by partial description match (case-insensitive)', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
      const results = registry.find('launchpad');
      expect(results.some((e) => e.id === 'UI5-NAV-001')).toBe(true);
    });

    it('returns an empty array when no entries match', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.find('xyz-impossible-query-123')).toEqual([]);
    });

    it('returns multiple matches when applicable', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      // Both SAMPLE_ENTRY_A and SAMPLE_ENTRY_C have 'ui5' category
      // but searching 'input' matches only SAMPLE_ENTRY_C by name
      const results = registry.find('input');
      expect(results.some((e) => e.id === 'UI5-UI5-002')).toBe(true);
    });

    it('returns all that match when query is broad', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      // 'control' appears in both A and C descriptions
      const results = registry.find('control');
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── byCategory() ───────────────────────────────────────────────────────

  describe('byCategory()', () => {
    it('returns only entries matching the given category', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      const ui5Entries = registry.byCategory('ui5');
      expect(ui5Entries).toHaveLength(2);
      expect(ui5Entries.every((e) => e.category === 'ui5')).toBe(true);
    });

    it('returns navigate entries correctly', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      const nav = registry.byCategory('navigate');
      expect(nav).toHaveLength(1);
      expect(nav[0]?.id).toBe('UI5-NAV-001');
    });

    it('returns empty array for a valid category with no entries', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.byCategory('odata')).toEqual([]);
    });

    it('returns empty for unused valid category', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.byCategory('table')).toEqual([]);
      expect(registry.byCategory('dialog')).toEqual([]);
    });
  });

  // ── listByPriority() ──────────────────────────────────────────────────

  describe('listByPriority()', () => {
    it('returns only fixture-priority entries', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER, SAMPLE_IMPL);
      const fixtures = registry.listByPriority('fixture');
      expect(fixtures).toHaveLength(1);
      expect(fixtures[0]?.id).toBe('UI5-UI5-001');
    });

    it('returns only namespace-priority entries', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER, SAMPLE_IMPL);
      const namespaces = registry.listByPriority('namespace');
      expect(namespaces).toHaveLength(1);
      expect(namespaces[0]?.id).toBe('UI5-AI0-001');
    });

    it('returns only implementation-priority entries', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER, SAMPLE_IMPL);
      const impls = registry.listByPriority('implementation');
      expect(impls).toHaveLength(1);
      expect(impls[0]?.id).toBe('UI5-DAT-001');
    });

    it('returns empty array when no entries match the priority', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.listByPriority('implementation')).toEqual([]);
    });

    it('returns multiple entries for the same priority', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      const fixtures = registry.listByPriority('fixture');
      expect(fixtures).toHaveLength(3);
    });

    it('excludes entries with a different priority value', () => {
      const implEntry: CapabilityEntry = {
        id: 'UI5-UI5-099',
        qualifiedName: 'ui5.implHelper',
        name: 'implHelper',
        description: 'An implementation-level helper entry',
        category: 'ui5',
        usageExample: 'example()',
        registryVersion: 1,
        priority: 'implementation',
      };
      const registry = makeRegistry(SAMPLE_ENTRY_A, implEntry);
      const fixtures = registry.listByPriority('fixture');
      expect(fixtures).toHaveLength(1);
      expect(fixtures[0]?.id).toBe('UI5-UI5-001');
    });
  });

  // ── findByName() ──────────────────────────────────────────────────────

  describe('findByName()', () => {
    it('returns the entry with the given name', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
      const result = registry.findByName('clickButton');
      expect(result).toBeDefined();
      expect(result?.id).toBe('UI5-UI5-001');
    });

    it('returns undefined for an unknown name', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.findByName('unknownMethod')).toBeUndefined();
    });

    it('is case-sensitive', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.findByName('clickbutton')).toBeUndefined();
      expect(registry.findByName('ClickButton')).toBeUndefined();
    });

    it('returns the first match when multiple entries share a name', () => {
      const duplicate: CapabilityEntry = {
        ...SAMPLE_ENTRY_A,
        id: 'UI5-UI5-003',
        description: 'V2 click button variant',
      };
      const registry = makeRegistry(SAMPLE_ENTRY_A, duplicate);
      const result = registry.findByName('clickButton');
      expect(result).toBeDefined();
    });

    it('returns undefined on an empty registry', () => {
      const registry = new CapabilityRegistry();
      expect(registry.findByName('anything')).toBeUndefined();
    });
  });

  // ── getStatistics() ───────────────────────────────────────────────────

  describe('getStatistics()', () => {
    it('returns correct totalMethods count', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_HANDLER);
      const stats = registry.getStatistics();
      expect(stats.totalMethods).toBe(3);
    });

    it('returns deduplicated categories', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_C, SAMPLE_HANDLER);
      const stats = registry.getStatistics();
      // A and C share 'ui5', handler has 'ai'
      expect(stats.categories).toHaveLength(2);
      expect(stats.categories).toContain('ui5');
      expect(stats.categories).toContain('ai');
    });

    it('returns a valid ISO timestamp', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      const stats = registry.getStatistics();
      expect(new Date(stats.generatedAt).toISOString()).toBe(stats.generatedAt);
    });

    it('returns the package version', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      const stats = registry.getStatistics();
      expect(stats.version).toBe('1.0.1');
    });

    it('returns correct byPriority breakdown', () => {
      const registry = makeRegistry(
        SAMPLE_ENTRY_A,
        SAMPLE_ENTRY_B,
        SAMPLE_ENTRY_C,
        SAMPLE_HANDLER,
        SAMPLE_IMPL,
      );
      const stats = registry.getStatistics();
      expect(stats.byPriority).toEqual({
        fixture: 3,
        namespace: 1,
        implementation: 1,
      });
    });

    it('returns zeros for all priorities on empty registry', () => {
      const registry = new CapabilityRegistry();
      const stats = registry.getStatistics();
      expect(stats.totalMethods).toBe(0);
      expect(stats.byPriority).toEqual({
        fixture: 0,
        namespace: 0,
        implementation: 0,
      });
    });
  });

  // ── toJSON() ──────────────────────────────────────────────────────────

  describe('toJSON()', () => {
    it('returns the package name', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      const json = registry.toJSON();
      expect(json.name).toBe('playwright-praman');
    });

    it('returns the package version', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      const json = registry.toJSON();
      expect(json.version).toBe('1.0.1');
    });

    it('includes a generatedAt timestamp', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      const json = registry.toJSON();
      expect(json.generatedAt).toBeDefined();
      expect(new Date(json.generatedAt).toISOString()).toBe(json.generatedAt);
    });

    it('returns correct totalMethods', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER);
      const json = registry.toJSON();
      expect(json.totalMethods).toBe(2);
    });

    it('includes byPriority breakdown', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER, SAMPLE_IMPL);
      const json = registry.toJSON();
      expect(json.byPriority).toEqual({
        fixture: 1,
        namespace: 1,
        implementation: 1,
      });
    });

    it('lists only fixture entries in the fixtures field', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER, SAMPLE_IMPL);
      const json = registry.toJSON();
      expect(json.fixtures).toHaveLength(1);
      expect(json.fixtures[0]?.priority).toBe('fixture');
    });

    it('lists all entries in the methods field', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER, SAMPLE_IMPL);
      const json = registry.toJSON();
      expect(json.methods).toHaveLength(3);
    });

    it('returns empty fixtures and methods on empty registry', () => {
      const registry = new CapabilityRegistry();
      const json = registry.toJSON();
      expect(json.fixtures).toEqual([]);
      expect(json.methods).toEqual([]);
      expect(json.totalMethods).toBe(0);
    });
  });

  // ── forAI() ────────────────────────────────────────────────────────────

  describe('forAI()', () => {
    it('returns a CapabilitiesJSON object (same shape as toJSON)', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER);
      const aiResult = registry.forAI();
      expect(aiResult.name).toBe('playwright-praman');
      expect(aiResult.methods).toHaveLength(2);
      expect(aiResult.fixtures).toHaveLength(1);
      expect(aiResult.byPriority).toBeDefined();
    });

    it('returns the same data as toJSON()', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_HANDLER);
      const json = registry.toJSON();
      const ai = registry.forAI();
      expect(ai.name).toBe(json.name);
      expect(ai.version).toBe(json.version);
      expect(ai.totalMethods).toBe(json.totalMethods);
      expect(ai.byPriority).toEqual(json.byPriority);
      expect(ai.fixtures).toEqual(json.fixtures);
      expect(ai.methods).toEqual(json.methods);
    });

    it('every entry has a usageExample', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      const result = registry.forAI();
      for (const entry of result.methods) {
        expect(typeof entry.usageExample).toBe('string');
        expect(entry.usageExample.length).toBeGreaterThan(0);
      }
    });

    it('can be called without arguments', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(() => registry.forAI()).not.toThrow();
    });
  });

  // ── forProvider() ──────────────────────────────────────────────────────

  describe('forProvider()', () => {
    // ── Claude (XML) format ─────────────────────────────────────────────

    describe('claude format', () => {
      it('returns XML-structured capability elements', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('claude');
        expect(result).toContain('<capabilities>');
        expect(result).toContain('</capabilities>');
        expect(result).toContain('<capability');
        expect(result).toContain('</capability>');
      });

      it('includes capability name attribute', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('claude');
        expect(result).toContain('name="clickButton"');
      });

      it('includes capability category attribute', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('claude');
        expect(result).toContain('category="ui5"');
      });

      it('includes intent attribute when present', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('claude');
        expect(result).toContain('intent="click"');
      });

      it('omits intent attribute when not present', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_B);
        const result = registry.forProvider('claude');
        expect(result).not.toContain('intent=');
      });

      it('includes description element', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('claude');
        expect(result).toContain(
          '<description>Clicks a UI5 button control by selector</description>',
        );
      });

      it('includes example element', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('claude');
        // Single quotes are escaped to &apos; in XML
        expect(result).toContain(
          `<example>await ui5.click({ id: &apos;submitBtn&apos; })</example>`,
        );
      });

      it('returns self-closing tag for empty registry', () => {
        const registry = new CapabilityRegistry();
        const result = registry.forProvider('claude');
        expect(result).toBe('<capabilities />');
      });

      it('includes multiple capabilities', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
        const result = registry.forProvider('claude');
        expect(result).toContain('name="clickButton"');
        expect(result).toContain('name="navigateTile"');
        expect(result).toContain('name="fillInput"');
      });
    });

    // ── OpenAI (JSON function-calling) format ──────────────────────────

    describe('openai format', () => {
      it('returns valid JSON', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('openai');
        expect(() => JSON.parse(result) as unknown).not.toThrow();
      });

      it('returns a CapabilitiesJSON object with methods array', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
        const parsed = JSON.parse(registry.forProvider('openai')) as {
          methods: unknown[];
          totalMethods: number;
        };
        expect(parsed.totalMethods).toBe(2);
        expect(parsed.methods).toHaveLength(2);
      });

      it('includes package name', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const parsed = JSON.parse(registry.forProvider('openai')) as { name: string };
        expect(parsed.name).toBe('playwright-praman');
      });

      it('includes capability entries in methods array', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const parsed = JSON.parse(registry.forProvider('openai')) as {
          methods: { name: string; description: string; category: string }[];
        };
        expect(parsed.methods[0]?.name).toBe('clickButton');
        expect(parsed.methods[0]?.description).toBe('Clicks a UI5 button control by selector');
        expect(parsed.methods[0]?.category).toBe('ui5');
      });

      it('includes fixtures array for fixture-priority entries', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER);
        const parsed = JSON.parse(registry.forProvider('openai')) as {
          fixtures: { name: string }[];
        };
        expect(parsed.fixtures).toHaveLength(1);
        expect(parsed.fixtures[0]?.name).toBe('clickButton');
      });

      it('includes byPriority breakdown', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER);
        const parsed = JSON.parse(registry.forProvider('openai')) as {
          byPriority: { fixture: number; namespace: number; implementation: number };
        };
        expect(parsed.byPriority).toEqual({
          fixture: 1,
          namespace: 1,
          implementation: 0,
        });
      });

      it('returns empty methods for empty registry', () => {
        const registry = new CapabilityRegistry();
        const parsed = JSON.parse(registry.forProvider('openai')) as {
          methods: unknown[];
          totalMethods: number;
        };
        expect(parsed.methods).toEqual([]);
        expect(parsed.totalMethods).toBe(0);
      });
    });

    // ── Gemini (plain text) format ─────────────────────────────────────

    describe('gemini format', () => {
      it('returns valid JSON containing capability data', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('gemini');
        const parsed = JSON.parse(result) as { methods: { name: string; category: string }[] };
        expect(parsed.methods[0]?.name).toBe('clickButton');
        expect(parsed.methods[0]?.category).toBe('ui5');
      });

      it('includes capability descriptions', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('gemini');
        expect(result).toContain('Clicks a UI5 button control by selector');
      });

      it('includes all methods', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
        const parsed = JSON.parse(registry.forProvider('gemini')) as { methods: unknown[] };
        expect(parsed.methods).toHaveLength(2);
      });

      it('returns empty methods for empty registry', () => {
        const registry = new CapabilityRegistry();
        const parsed = JSON.parse(registry.forProvider('gemini')) as {
          methods: unknown[];
          totalMethods: number;
        };
        expect(parsed.methods).toEqual([]);
        expect(parsed.totalMethods).toBe(0);
      });

      it('includes all capabilities in methods', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
        const result = registry.forProvider('gemini');
        expect(result).toContain('clickButton');
        expect(result).toContain('navigateTile');
        expect(result).toContain('fillInput');
      });
    });

    // ── General ─────────────────────────────────────────────────────────

    it('returns a string for all provider types', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(typeof registry.forProvider('claude')).toBe('string');
      expect(typeof registry.forProvider('openai')).toBe('string');
      expect(typeof registry.forProvider('gemini')).toBe('string');
    });

    it('returns non-empty strings when capabilities are registered', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.forProvider('claude').length).toBeGreaterThan(0);
      expect(registry.forProvider('openai').length).toBeGreaterThan(0);
      expect(registry.forProvider('gemini').length).toBeGreaterThan(0);
    });
  });
});
