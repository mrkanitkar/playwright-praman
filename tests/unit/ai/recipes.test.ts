/**
 * Tests for `src/ai/recipes.ts` — pre-built recipes singleton.
 *
 * @remarks
 * Validates that the `recipes` singleton delegates correctly to
 * {@link RecipeRegistry} and is importable from the main entry point.
 *
 * @module ai
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { recipes } from '#ai/recipes.js';
import type { RecipeEntry } from '#ai/types.js';

/** Test recipe seeded into the singleton registry for branch coverage. */
const TEST_RECIPE: RecipeEntry = {
  id: 'test-recipe-seed',
  title: 'Test Login Recipe',
  description: 'A test recipe for unit test branch coverage',
  category: 'auth',
  role: 'ai-agent',
  priority: 'essential',
  code: 'await page.goto("/login");',
  tags: ['login', 'auth', 'test'],
};

describe('recipes singleton', () => {
  beforeAll(() => {
    // Seed the singleton's internal registry with a known recipe.
    // RecipeRegistry.fromEntries creates a new instance, so we inject
    // directly into the existing singleton registry via Object.defineProperty.
    const registry = recipes.registry;
    Object.defineProperty(registry, 'recipes', {
      value: [TEST_RECIPE],
      writable: false,
      enumerable: false,
      configurable: true,
    });
  });

  it('select returns an array', () => {
    const result = recipes.select({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('selectByRole returns matching entries', () => {
    const result = recipes.selectByRole('ai-agent');
    expect(result.length).toBeGreaterThan(0);
  });

  it('selectByCategory returns matching entries', () => {
    const result = recipes.selectByCategory('auth');
    expect(result.length).toBeGreaterThan(0);
  });

  it('selectByPriority returns matching entries', () => {
    const result = recipes.selectByPriority('essential');
    expect(result.length).toBeGreaterThan(0);
  });

  it('search returns matching entries', () => {
    const result = recipes.search('login');
    expect(result.length).toBeGreaterThan(0);
  });

  it('forAI returns all seeded recipes', () => {
    const result = recipes.forAI();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('getTopRecipes returns at most n entries', () => {
    const result = recipes.getTopRecipes(2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('exposes underlying registry instance', () => {
    expect(recipes.registry).toBeDefined();
  });

  it('list delegates to forAI', () => {
    const result = recipes.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('find delegates to search', () => {
    const result = recipes.find('login');
    expect(result.length).toBeGreaterThan(0);
  });

  it('has() returns false for non-existent title', () => {
    expect(recipes.has('nonExistentRecipeTitle12345')).toBe(false);
  });

  it('has() returns true for existing recipe title (case-insensitive)', () => {
    expect(recipes.has('Test Login Recipe')).toBe(true);
    expect(recipes.has('test login recipe')).toBe(true);
  });

  it('getSteps() returns undefined for non-existent title', () => {
    expect(recipes.getSteps('nonExistentRecipeTitle12345')).toBeUndefined();
  });

  it('getSteps() returns code string for existing recipe', () => {
    const steps = recipes.getSteps('Test Login Recipe');
    expect(steps).toBe('await page.goto("/login");');
  });

  it('describe() returns undefined for non-existent title', () => {
    expect(recipes.describe('nonExistentRecipeTitle12345')).toBeUndefined();
  });

  it('describe() returns description string for existing recipe', () => {
    const desc = recipes.describe('Test Login Recipe');
    expect(desc).toBe('A test recipe for unit test branch coverage');
  });

  it('getCategories() returns unique category names', () => {
    const cats = recipes.getCategories();
    expect(Array.isArray(cats)).toBe(true);
    expect(cats).toContain('auth');
    expect(new Set(cats).size).toBe(cats.length);
  });

  it('forDomain() delegates to search', () => {
    const result = recipes.forDomain('auth');
    expect(result.length).toBeGreaterThan(0);
  });

  it('forCapability() delegates to search', () => {
    const result = recipes.forCapability('login');
    expect(result.length).toBeGreaterThan(0);
  });

  it('forProcess() delegates to search', () => {
    const result = recipes.forProcess('auth');
    expect(result.length).toBeGreaterThan(0);
  });

  it('toJSON() returns readonly array', () => {
    const json = recipes.toJSON();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
  });

  it('validate() returns { valid: false } for non-existent title', () => {
    const result = recipes.validate('nonExistentRecipeTitle12345');
    expect(result).toEqual({ valid: false });
  });

  it('validate() returns { valid: true, role } for existing recipe', () => {
    const result = recipes.validate('Test Login Recipe');
    expect(result.valid).toBe(true);
    expect(result.role).toBe('ai-agent');
  });
});

describe('recipes singleton main entry export', () => {
  it('is importable from playwright-praman main entry', async () => {
    const mod = await import('../../../src/index.js');
    expect(mod).toHaveProperty('recipes');
    expect(typeof mod.recipes.select).toBe('function');
    expect(typeof mod.recipes.selectByRole).toBe('function');
    expect(typeof mod.recipes.forAI).toBe('function');
  });
});
