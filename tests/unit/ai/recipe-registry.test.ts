/**
 * Unit tests for `src/ai/recipe-registry.ts`.
 *
 * @remarks
 * Verifies registry construction, select(), search(), forAI(), and
 * getTopRecipes(). All tests are hermetic — recipes are injected through
 * a registry subclass that overrides the internal store.
 */
import { describe, expect, it } from 'vitest';

import { RecipeRegistry } from '#ai/recipe-registry.js';
import type { RecipeEntry } from '#ai/types.js';

// ── Test fixtures ──────────────────────────────────────────────────────────

const RECIPE_AUTH: RecipeEntry = {
  id: 'login-cloud-saml',
  title: 'Login via Cloud SAML',
  description: 'Authenticates against SAP BTP using cloud SAML strategy',
  category: 'auth',
  role: 'both',
  priority: 'essential',
  code: 'await auth.loginCloud({ user: process.env.SAP_USER! });',
  tags: ['auth', 'saml', 'btp', 'cloud'],
};

const RECIPE_NAV: RecipeEntry = {
  id: 'navigate-fiori-tile',
  title: 'Navigate to a Fiori Tile',
  description: 'Opens an SAP Fiori launchpad tile by its display title',
  category: 'navigation',
  role: 'ai-agent',
  priority: 'recommended',
  code: "await ui5.navigateToTile('Sales Orders');",
  tags: ['navigation', 'tile', 'launchpad'],
};

const RECIPE_FORM: RecipeEntry = {
  id: 'fill-smart-form',
  title: 'Fill SmartForm Fields',
  description: 'Populates a SAP SmartForm with structured field data',
  category: 'interaction',
  role: 'human-tester',
  priority: 'advanced',
  code: "await ui5.fillForm({ Name: 'Alice', Country: 'DE' });",
  tags: ['form', 'smartform', 'fill'],
};

const RECIPE_TABLE: RecipeEntry = {
  id: 'filter-table-rows',
  title: 'Filter Table Rows',
  description: 'Applies a filter bar query and verifies matching row count',
  category: 'interaction',
  role: 'ai-agent',
  priority: 'essential',
  code: "await ui5.filterTable({ field: 'Status', value: 'Open' });",
  tags: ['table', 'filter', 'interaction'],
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

    it('filters by category', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const interaction = registry.select({ category: 'interaction' });
      expect(interaction).toHaveLength(2);
      expect(interaction.every((r) => r.category === 'interaction')).toBe(true);
    });

    it('filters by role', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const agentRecipes = registry.select({ role: 'ai-agent' });
      expect(agentRecipes.every((r) => r.role === 'ai-agent')).toBe(true);
    });

    it('combines category and role filters (AND semantics)', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      // interaction + ai-agent = RECIPE_TABLE only
      const results = registry.select({
        category: 'interaction',
        role: 'ai-agent',
      });
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('filter-table-rows');
    });

    it('returns empty array when no entries match the filter', () => {
      const registry = makeRegistry(RECIPE_AUTH);
      expect(registry.select({ category: 'non-existent' })).toEqual([]);
    });

    it('returns all entries for role both', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM);
      const bothRecipes = registry.select({ role: 'both' });
      expect(bothRecipes).toHaveLength(1);
      expect(bothRecipes[0]?.id).toBe('login-cloud-saml');
    });

    it('filters by priority', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const essential = registry.select({ priority: 'essential' });
      expect(essential).toHaveLength(2);
      expect(essential.every((r) => r.priority === 'essential')).toBe(true);
    });

    it('combines category, role, and priority filters (AND semantics)', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const results = registry.select({
        category: 'interaction',
        role: 'ai-agent',
        priority: 'essential',
      });
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('filter-table-rows');
    });
  });

  // ── search() ───────────────────────────────────────────────────────────

  describe('search()', () => {
    it('finds entries by partial title match (case-insensitive)', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM);
      const results = registry.search('login');
      expect(results.some((r) => r.id === 'login-cloud-saml')).toBe(true);
    });

    it('finds entries by partial description match (case-insensitive)', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM);
      const results = registry.search('launchpad');
      expect(results.some((r) => r.id === 'navigate-fiori-tile')).toBe(true);
    });

    it('finds entries by tag match (case-insensitive)', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM);
      const results = registry.search('saml');
      expect(results.some((r) => r.id === 'login-cloud-saml')).toBe(true);
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
        expect(typeof recipe.title).toBe('string');
        expect(typeof recipe.description).toBe('string');
        expect(typeof recipe.category).toBe('string');
        expect(typeof recipe.code).toBe('string');
        expect(Array.isArray(recipe.tags)).toBe(true);
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

  // ── selectByRole() ──────────────────────────────────────────────────

  describe('selectByRole()', () => {
    it('returns entries matching the given role', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const agentRecipes = registry.selectByRole('ai-agent');
      expect(agentRecipes).toHaveLength(2);
      expect(agentRecipes.every((r) => r.role === 'ai-agent')).toBe(true);
    });

    it('returns empty array when no entries match', () => {
      const registry = makeRegistry(RECIPE_NAV);
      expect(registry.selectByRole('human-tester')).toEqual([]);
    });
  });

  // ── selectByCategory() ─────────────────────────────────────────────

  describe('selectByCategory()', () => {
    it('returns entries matching the given category', () => {
      const registry = makeRegistry(RECIPE_AUTH, RECIPE_NAV, RECIPE_FORM, RECIPE_TABLE);
      const interaction = registry.selectByCategory('interaction');
      expect(interaction).toHaveLength(2);
      expect(interaction.every((r) => r.category === 'interaction')).toBe(true);
    });

    it('returns empty array when no entries match', () => {
      const registry = makeRegistry(RECIPE_AUTH);
      expect(registry.selectByCategory('non-existent')).toEqual([]);
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
      expect(advanced[0]?.id).toBe('fill-smart-form');
    });
  });
});
