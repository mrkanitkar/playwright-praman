/**
 * Tests for `src/ai/recipes.ts` — pre-built recipes singleton.
 *
 * @remarks
 * Validates that the `recipes` singleton delegates correctly to
 * {@link RecipeRegistry} and is importable from the main entry point.
 *
 * @module ai
 */

import { describe, expect, it } from 'vitest';

import { recipes } from '#ai/recipes.js';

describe('recipes singleton', () => {
  it('exposes select method', () => {
    expect(typeof recipes.select).toBe('function');
  });

  it('exposes selectByRole method', () => {
    expect(typeof recipes.selectByRole).toBe('function');
  });

  it('exposes selectByCategory method', () => {
    expect(typeof recipes.selectByCategory).toBe('function');
  });

  it('exposes selectByPriority method', () => {
    expect(typeof recipes.selectByPriority).toBe('function');
  });

  it('exposes search method', () => {
    expect(typeof recipes.search).toBe('function');
  });

  it('exposes forAI method', () => {
    expect(typeof recipes.forAI).toBe('function');
  });

  it('exposes getTopRecipes method', () => {
    expect(typeof recipes.getTopRecipes).toBe('function');
  });

  it('exposes underlying registry instance', () => {
    expect(recipes.registry).toBeDefined();
  });

  it('select returns an array', () => {
    const result = recipes.select({});
    expect(Array.isArray(result)).toBe(true);
  });

  it('selectByRole returns an array', () => {
    const result = recipes.selectByRole('ai-agent');
    expect(Array.isArray(result)).toBe(true);
  });

  it('selectByCategory returns an array', () => {
    const result = recipes.selectByCategory('auth');
    expect(Array.isArray(result)).toBe(true);
  });

  it('selectByPriority returns an array', () => {
    const result = recipes.selectByPriority('essential');
    expect(Array.isArray(result)).toBe(true);
  });

  it('search returns an array', () => {
    const result = recipes.search('login');
    expect(Array.isArray(result)).toBe(true);
  });

  it('forAI returns an array', () => {
    const result = recipes.forAI();
    expect(Array.isArray(result)).toBe(true);
  });

  it('getTopRecipes returns at most n entries', () => {
    const result = recipes.getTopRecipes(2);
    expect(result.length).toBeLessThanOrEqual(2);
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
