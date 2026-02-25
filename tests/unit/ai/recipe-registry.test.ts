/**
 * Unit tests for `src/ai/recipe-registry.ts`.
 *
 * @remarks
 * Verifies registry construction, select(), search(), forAI(),
 * getTopRecipes(), selectByDomain(), and selectByPriority().
 * All tests are hermetic — recipes are injected through
 * RecipeRegistry.fromEntries().
 */
import { describe, expect, it, vi } from 'vitest';

// Mock the generated recipes to keep tests hermetic (empty seed).
vi.mock('#ai/recipe-registry.generated.js', () => ({
  GENERATED_RECIPES: [],
}));

import { RecipeRegistry } from '#ai/recipe-registry.js';
import type { RecipeEntry } from '#ai/types.js';

// ── Test fixtures ──────────────────────────────────────────────────────────

const RECIPE_AUTH: RecipeEntry = {
  id: 'recipe-login-cloud-saml',
  name: 'Login via Cloud SAML',
  description: 'Authenticates against SAP BTP using cloud SAML strategy',
  domain: 'auth',
  priority: 'essential',
  pattern: 'await auth.loginCloud({ user: process.env.SAP_USER! });',
  capabilities: ['UI5-AUTH-001', 'UI5-AUTH-002'],
};

const RECIPE_NAV: RecipeEntry = {
  id: 'recipe-navigate-fiori-tile',
  name: 'Navigate to a Fiori Tile',
  description: 'Opens an SAP Fiori launchpad tile by its display title',
  domain: 'navigate',
  priority: 'recommended',
  pattern: "await ui5.navigateToTile('Sales Orders');",
  capabilities: ['UI5-NAV-001'],
};

const RECIPE_FORM: RecipeEntry = {
  id: 'recipe-fill-smart-form',
  name: 'Fill SmartForm Fields',
  description: 'Populates a SAP SmartForm with structured field data',
  domain: 'ui5',
  priority: 'advanced',
  pattern: "await ui5.fillForm({ Name: 'Alice', Country: 'DE' });",
  capabilities: ['UI5-UI5-010', 'UI5-UI5-011'],
};

const RECIPE_TABLE: RecipeEntry = {
  id: 'recipe-filter-table-rows',
  name: 'Filter Table Rows',
  description: 'Applies a filter bar query and verifies matching row count',
  domain: 'ui5',
  priority: 'essential',
  pattern: "await ui5.filterTable({ field: 'Status', value: 'Open' });",
  capabilities: ['UI5-TBL-001', 'UI5-TBL-002'],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRegistry(...recipes: RecipeEntry[]): RecipeRegistry {
  return RecipeRegistry.fromEntries(recipes);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('RecipeRegistry', () => {
  // ── Construction ───────────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates an instance of RecipeRegistry', () => {
      expect(new RecipeRegistry()).toBeInstanceOf(RecipeRegistry);
    });

    it('starts with empty results from generated stub', () => {
      const registry = new RecipeRegistry();
      expect(registry.select({})).toEqual([]);
    });
  });

  // ── select() ───────────────────────────────────────────────────────────

  describe('select()', () => {
    it('returns all entries when no filter is provided', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM);
      expect(registry.select({})).toHaveLength(3);
    });

    it('filters by domain', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const ui5Recipes = registry.select({ domain: 'ui5' });
      expect(ui5Recipes).toHaveLength(2);
      expect(ui5Recipes.every((r) => r.domain === 'ui5')).toBe(true);
    });

    it('filters by priority', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const essential = registry.select({ priority: 'essential' });
      expect(essential).toHaveLength(2);
      expect(essential.every((r) => r.priority === 'essential')).toBe(true);
    });

    it('combines domain and priority filters (AND semantics)', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      // ui5 + essential = RECIPE_TABLE only
      const results = registry.select({
        domain: 'ui5',
        priority: 'essential',
      });
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('recipe-filter-table-rows');
    });

    it('returns empty array when no entries match the filter', () => {
      const registry = makeRegistry(RECIPE_AUTH);
      expect(registry.select({ domain: 'non-existent' })).toEqual([]);
    });

    it('returns single entry for advanced priority', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const advanced = registry.select({ priority: 'advanced' });
      expect(advanced).toHaveLength(1);
      expect(advanced[0]?.id).toBe('recipe-fill-smart-form');
    });
  });

  // ── search() ───────────────────────────────────────────────────────────

  describe('search()', () => {
    it('finds entries by partial name match (case-insensitive)', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM);
      const results = registry.search('login');
      expect(results.some((r) => r.id === 'recipe-login-cloud-saml')).toBe(true);
    });

    it('finds entries by partial description match (case-insensitive)', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM);
      const results = registry.search('launchpad');
      expect(results.some((r) => r.id === 'recipe-navigate-fiori-tile')).toBe(true);
    });

    it('searches name field for matches', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM);
      const results = registry.search('SAML');
      expect(results.some((r) => r.id === 'recipe-login-cloud-saml')).toBe(true);
    });

    it('returns empty array when query has no matches', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV);
      expect(registry.search('xyzzy-impossible-999')).toEqual([]);
    });

    it('is case-insensitive', () => {
      const registry = makeRegistry(RECIPE_AUTH);
      expect(registry.search('SAML')).toHaveLength(1);
      expect(registry.search('saml')).toHaveLength(1);
      expect(registry.search('SaMl')).toHaveLength(1);
    });

    it('returns multiple matches when several entries match', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      // 'SAP' appears in NAV and FORM descriptions
      const results = registry.search('SAP');
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── forAI() ────────────────────────────────────────────────────────────

  describe('forAI()', () => {
    it('returns an array', () => {
      expect(Array.isArray(new RecipeRegistry().forAI())).toBe(true);
    });

    it('returns all registered entries', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM);
      expect(registry.forAI()).toHaveLength(3);
    });

    it('returns a new array on each call', () => {
      const registry = makeRegistry(RECIPE_AUTH);
      const first = registry.forAI();
      const second = registry.forAI();
      expect(first).not.toBe(second);
    });

    it('entries have all required fields', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV);
      for (const recipe of registry.forAI()) {
        expect(typeof recipe.id).toBe('string');
        expect(typeof recipe.name).toBe('string');
        expect(typeof recipe.description).toBe('string');
        expect(typeof recipe.domain).toBe('string');
        expect(typeof recipe.pattern).toBe('string');
        expect(Array.isArray(recipe.capabilities)).toBe(true);
      }
    });
  });

  // ── getTopRecipes() ────────────────────────────────────────────────────

  describe('getTopRecipes()', () => {
    it('returns at most n entries', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      expect(registry.getTopRecipes(3)).toHaveLength(3);
    });

    it('returns all entries when n exceeds total count', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV);
      expect(registry.getTopRecipes(10)).toHaveLength(2);
    });

    it('returns empty array when n is 0', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV);
      expect(registry.getTopRecipes(0)).toEqual([]);
    });

    it('returns the first n entries in insertion order', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM);
      const top2 = registry.getTopRecipes(2);
      expect(top2[0]?.id).toBe(RECIPE_AUTH.id);
      expect(top2[1]?.id).toBe(RECIPE_NAV.id);
    });

    it('returns exactly 1 when n is 1', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const top1 = registry.getTopRecipes(1);
      expect(top1).toHaveLength(1);
      expect(top1[0]?.id).toBe(RECIPE_AUTH.id);
    });
  });

  // ── selectByDomain() ──────────────────────────────────────────────────

  describe('selectByDomain()', () => {
    it('returns entries matching the given domain', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const ui5Recipes = registry.selectByDomain('ui5');
      expect(ui5Recipes).toHaveLength(2);
      expect(ui5Recipes.every((r) => r.domain === 'ui5')).toBe(true);
    });

    it('returns empty array when no entries match', () => {
      const registry = makeRegistry(RECIPE_AUTH);
      expect(registry.selectByDomain('non-existent')).toEqual([]);
    });
  });

  // ── selectByPriority() ─────────────────────────────────────────────

  describe('selectByPriority()', () => {
    it('returns entries matching the given priority', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const essential = registry.selectByPriority('essential');
      expect(essential).toHaveLength(2);
      expect(essential.every((r) => r.priority === 'essential')).toBe(true);
    });

    it('returns empty array for deprecated when none exist', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      expect(registry.selectByPriority('deprecated')).toEqual([]);
    });

    it('returns single entry for advanced priority', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const advanced = registry.selectByPriority('advanced');
      expect(advanced).toHaveLength(1);
      expect(advanced[0]?.id).toBe('recipe-fill-smart-form');
    });
  });
});
