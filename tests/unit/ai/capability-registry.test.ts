/**
 * Unit tests for `src/ai/capability-registry.ts`.
 *
 * @remarks
 * Verifies registry construction, static version, list/get/has/find/byCategory
 * queries, register(), listByPriority(), findByName(), getStatistics(),
 * toJSON(), and forAI() behaviour. All tests are hermetic — no generated file
 * dependencies are assumed to have data.
 */
import { describe, expect, it } from 'vitest';

import { CapabilityRegistry } from '#ai/capability-registry.js';
import type { CapabilityEntry } from '#ai/types.js';

// ── Test fixtures ──────────────────────────────────────────────────────────

const SAMPLE_ENTRY_A: CapabilityEntry = {
  id: 'click-button',
  name: 'clickButton',
  description: 'Clicks a UI5 button control by selector',
  category: 'interaction',
  intent: 'click',
  sapModule: 'sap.m.Button',
  usage_example: "await ui5.click({ id: 'submitBtn' })",
  registryVersion: 1,
  priority: 'fixture',
};

const SAMPLE_ENTRY_B: CapabilityEntry = {
  id: 'navigate-tile',
  name: 'navigateTile',
  description: 'Navigates to a Fiori launchpad tile by title',
  category: 'navigation',
  usage_example: "await ui5.navigateToTile('Sales Orders')",
  registryVersion: 1,
  priority: 'fixture',
};

const SAMPLE_ENTRY_C: CapabilityEntry = {
  id: 'fill-input',
  name: 'fillInput',
  description: 'Fills a text input control with the given value',
  category: 'interaction',
  intent: 'fill',
  usage_example: "await ui5.fill({ id: 'nameInput' }, 'John')",
  registryVersion: 1,
  priority: 'fixture',
};

const SAMPLE_HANDLER: CapabilityEntry = {
  id: 'agentic-handler',
  name: 'AgenticHandler',
  description: 'Agentic AI handler class for autonomous test generation',
  category: 'handler',
  usage_example: 'const handler = new AgenticHandler(llm, buildPageContext, caps)',
  registryVersion: 1,
  priority: 'namespace',
};

const SAMPLE_IMPL: CapabilityEntry = {
  id: 'internal-retry',
  name: 'retryWithBackoff',
  description: 'Internal retry helper with exponential backoff',
  category: 'infrastructure',
  usage_example: 'await retryWithBackoff(() => findControl(sel), 3)',
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
        description: 'Updated description',
      };
      registry.register(updated);
      expect(registry.list()).toHaveLength(1);
      expect(registry.get(SAMPLE_ENTRY_A.id)?.description).toBe('Updated description');
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
      const result = registry.get('click-button');
      expect(result).toBeDefined();
      expect(result?.id).toBe('click-button');
      expect(result?.name).toBe('clickButton');
    });

    it('returns undefined for an unknown id', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.get('non-existent-id')).toBeUndefined();
    });

    it('returns the full entry object', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      const entry = registry.get('click-button');
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
      expect(results.some((e) => e.id === 'click-button')).toBe(true);
    });

    it('finds entries by partial description match (case-insensitive)', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
      const results = registry.find('launchpad');
      expect(results.some((e) => e.id === 'navigate-tile')).toBe(true);
    });

    it('returns an empty array when no entries match', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.find('xyz-impossible-query-123')).toEqual([]);
    });

    it('returns multiple matches when applicable', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      // Both SAMPLE_ENTRY_A and SAMPLE_ENTRY_C have 'interaction' category
      // but searching 'input' matches only SAMPLE_ENTRY_C by name
      const results = registry.find('input');
      expect(results.some((e) => e.id === 'fill-input')).toBe(true);
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
      const interaction = registry.byCategory('interaction');
      expect(interaction).toHaveLength(2);
      expect(interaction.every((e) => e.category === 'interaction')).toBe(true);
    });

    it('returns navigation entries correctly', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      const nav = registry.byCategory('navigation');
      expect(nav).toHaveLength(1);
      expect(nav[0]?.id).toBe('navigate-tile');
    });

    it('returns empty array for unknown category', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.byCategory('non-existent-category')).toEqual([]);
    });

    it('category match is case-sensitive', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(registry.byCategory('Interaction')).toEqual([]);
      expect(registry.byCategory('INTERACTION')).toEqual([]);
    });
  });

  // ── listByPriority() ──────────────────────────────────────────────────

  describe('listByPriority()', () => {
    it('returns only fixture-priority entries', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER, SAMPLE_IMPL);
      const fixtures = registry.listByPriority('fixture');
      expect(fixtures).toHaveLength(1);
      expect(fixtures[0]?.id).toBe('click-button');
    });

    it('returns only namespace-priority entries', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER, SAMPLE_IMPL);
      const namespaces = registry.listByPriority('namespace');
      expect(namespaces).toHaveLength(1);
      expect(namespaces[0]?.id).toBe('agentic-handler');
    });

    it('returns only implementation-priority entries', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_HANDLER, SAMPLE_IMPL);
      const impls = registry.listByPriority('implementation');
      expect(impls).toHaveLength(1);
      expect(impls[0]?.id).toBe('internal-retry');
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

    it('excludes entries without a priority field', () => {
      const noPriority: CapabilityEntry = {
        id: 'no-priority',
        name: 'noPriority',
        description: 'Entry without priority',
        category: 'misc',
        usage_example: 'example()',
        registryVersion: 1,
      };
      const registry = makeRegistry(SAMPLE_ENTRY_A, noPriority);
      const fixtures = registry.listByPriority('fixture');
      expect(fixtures).toHaveLength(1);
      expect(fixtures[0]?.id).toBe('click-button');
    });
  });

  // ── findByName() ──────────────────────────────────────────────────────

  describe('findByName()', () => {
    it('returns the entry with the given name', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
      const result = registry.findByName('clickButton');
      expect(result).toBeDefined();
      expect(result?.id).toBe('click-button');
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
        id: 'click-button-v2',
        description: 'V2 click',
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
      // A and C share 'interaction', handler has 'handler'
      expect(stats.categories).toHaveLength(2);
      expect(stats.categories).toContain('interaction');
      expect(stats.categories).toContain('handler');
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

    it('every entry has a usage_example', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      const result = registry.forAI();
      for (const entry of result.methods) {
        expect(typeof entry.usage_example).toBe('string');
        expect(entry.usage_example.length).toBeGreaterThan(0);
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
        expect(result).toContain('category="interaction"');
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
        expect(result).toContain(`<example>await ui5.click({ id: 'submitBtn' })</example>`);
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

      it('returns an array of tool objects', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
        const parsed = JSON.parse(registry.forProvider('openai')) as unknown[];
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toHaveLength(2);
      });

      it('each tool has type "function"', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const parsed = JSON.parse(registry.forProvider('openai')) as { type: string }[];
        expect(parsed[0]?.type).toBe('function');
      });

      it('includes function name matching capability name', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const parsed = JSON.parse(registry.forProvider('openai')) as {
          function: { name: string };
        }[];
        expect(parsed[0]?.function.name).toBe('clickButton');
      });

      it('includes function description', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const parsed = JSON.parse(registry.forProvider('openai')) as {
          function: { description: string };
        }[];
        expect(parsed[0]?.function.description).toBe('Clicks a UI5 button control by selector');
      });

      it('includes parameters with example property', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const parsed = JSON.parse(registry.forProvider('openai')) as {
          function: {
            parameters: {
              properties: { example: { description: string } };
            };
          };
        }[];
        expect(parsed[0]?.function.parameters.properties.example.description).toBe(
          "await ui5.click({ id: 'submitBtn' })",
        );
      });

      it('includes category in function metadata', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const parsed = JSON.parse(registry.forProvider('openai')) as {
          function: { category: string };
        }[];
        expect(parsed[0]?.function.category).toBe('interaction');
      });

      it('returns empty array JSON for empty registry', () => {
        const registry = new CapabilityRegistry();
        const result = registry.forProvider('openai');
        expect(JSON.parse(result)).toEqual([]);
      });
    });

    // ── Gemini (plain text) format ─────────────────────────────────────

    describe('gemini format', () => {
      it('returns plain text listing', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('gemini');
        expect(result).toContain('clickButton');
        expect(result).toContain('[interaction]');
        expect(result).toContain('Clicks a UI5 button control by selector');
      });

      it('includes example prefixed with "Example:"', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A);
        const result = registry.forProvider('gemini');
        expect(result).toContain("Example: await ui5.click({ id: 'submitBtn' })");
      });

      it('separates multiple entries with blank lines', () => {
        const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
        const result = registry.forProvider('gemini');
        // Two entries should be separated by a double newline
        const blocks = result.split('\n\n');
        expect(blocks).toHaveLength(2);
      });

      it('returns fallback message for empty registry', () => {
        const registry = new CapabilityRegistry();
        const result = registry.forProvider('gemini');
        expect(result).toBe('No capabilities registered.');
      });

      it('includes all capabilities', () => {
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
