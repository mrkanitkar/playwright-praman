/**
 * Unit tests for `src/ai/capability-registry.ts`.
 *
 * @remarks
 * Verifies registry construction, static version, list/get/has/find/byCategory
 * queries, register(), and forAI() behaviour. All tests are hermetic — no
 * generated file dependencies are assumed to have data.
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
};

const SAMPLE_ENTRY_B: CapabilityEntry = {
  id: 'navigate-tile',
  name: 'navigateTile',
  description: 'Navigates to a Fiori launchpad tile by title',
  category: 'navigation',
  usage_example: "await ui5.navigateToTile('Sales Orders')",
  registryVersion: 1,
};

const SAMPLE_ENTRY_C: CapabilityEntry = {
  id: 'fill-input',
  name: 'fillInput',
  description: 'Fills a text input control with the given value',
  category: 'interaction',
  intent: 'fill',
  usage_example: "await ui5.fill({ id: 'nameInput' }, 'John')",
  registryVersion: 1,
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

  // ── forAI() ────────────────────────────────────────────────────────────

  describe('forAI()', () => {
    it('returns an array', () => {
      const registry = new CapabilityRegistry();
      expect(Array.isArray(registry.forAI())).toBe(true);
    });

    it('returns all registered entries', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B);
      expect(registry.forAI()).toHaveLength(2);
    });

    it('every entry has a usage_example', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A, SAMPLE_ENTRY_B, SAMPLE_ENTRY_C);
      const entries = registry.forAI();
      for (const entry of entries) {
        expect(typeof entry.usage_example).toBe('string');
        expect(entry.usage_example.length).toBeGreaterThan(0);
      }
    });

    it('can be called without arguments', () => {
      const registry = makeRegistry(SAMPLE_ENTRY_A);
      expect(() => registry.forAI()).not.toThrow();
    });
  });
});
