/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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
  id: 'recipe-test-login-seed',
  name: 'Test Login Recipe',
  description: 'A test recipe for unit test branch coverage',
  domain: 'auth',
  priority: 'essential',
  capabilities: ['UI5-AUTH-001'],
  pattern: 'await page.goto("/login");',
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

  it('selectByDomain returns matching entries', () => {
    const result = recipes.selectByDomain('auth');
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

  it('has() returns false for non-existent name', () => {
    expect(recipes.has('nonExistentRecipeName12345')).toBe(false);
  });

  it('has() returns true for existing recipe name (case-insensitive)', () => {
    expect(recipes.has('Test Login Recipe')).toBe(true);
    expect(recipes.has('test login recipe')).toBe(true);
  });

  it('getSteps() returns undefined for non-existent name', () => {
    expect(recipes.getSteps('nonExistentRecipeName12345')).toBeUndefined();
  });

  it('getSteps() returns pattern string for existing recipe', () => {
    const steps = recipes.getSteps('Test Login Recipe');
    expect(steps).toBe('await page.goto("/login");');
  });

  it('describe() returns undefined for non-existent name', () => {
    expect(recipes.describe('nonExistentRecipeName12345')).toBeUndefined();
  });

  it('describe() returns description string for existing recipe', () => {
    const desc = recipes.describe('Test Login Recipe');
    expect(desc).toBe('A test recipe for unit test branch coverage');
  });

  it('getDomains() returns unique domain names', () => {
    const domains = recipes.getDomains();
    expect(Array.isArray(domains)).toBe(true);
    expect(domains).toContain('auth');
    expect(new Set(domains).size).toBe(domains.length);
  });

  it('forDomain() delegates to selectByDomain', () => {
    const result = recipes.forDomain('auth');
    expect(result.length).toBeGreaterThan(0);
  });

  it('forCapability() delegates to search', () => {
    const result = recipes.forCapability('login');
    expect(result.length).toBeGreaterThan(0);
  });

  it('forProcess() delegates to search', () => {
    const result = recipes.forProcess('login');
    expect(result.length).toBeGreaterThan(0);
  });

  it('toJSON() returns readonly array', () => {
    const json = recipes.toJSON();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
  });

  it('validate() returns { valid: false } for non-existent name', () => {
    const result = recipes.validate('nonExistentRecipeName12345');
    expect(result).toEqual({ valid: false });
  });

  it('validate() returns { valid: true } for existing recipe', () => {
    const result = recipes.validate('Test Login Recipe');
    expect(result.valid).toBe(true);
  });
});

describe('recipes singleton main entry export', () => {
  it('is importable from playwright-praman main entry', async () => {
    const mod = await import('../../../src/index.js');
    expect(mod).toHaveProperty('recipes');
    expect(typeof mod.recipes.select).toBe('function');
    expect(typeof mod.recipes.selectByDomain).toBe('function');
    expect(typeof mod.recipes.forAI).toBe('function');
  });
});
