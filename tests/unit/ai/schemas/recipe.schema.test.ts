/**
 * Unit tests for `src/ai/schemas/recipe.schema.ts`.
 *
 * @remarks
 * Validates Zod schemas for recipe registry entries, priorities,
 * and the full YAML file structure.
 *
 * @module ai
 */

import { describe, expect, it } from 'vitest';

import {
  RecipeEntrySchema,
  RecipePrioritySchema,
  RecipesYamlSchema,
} from '#ai/schemas/recipe.schema.js';

// ── RecipePrioritySchema ────────────────────────────────────────────────────

describe('RecipePrioritySchema', () => {
  const validPriorities = [
    'essential',
    'recommended',
    'optional',
    'advanced',
    'deprecated',
  ] as const;

  for (const priority of validPriorities) {
    it(`accepts '${priority}'`, () => {
      expect(RecipePrioritySchema.parse(priority)).toBe(priority);
    });
  }

  it('rejects an unknown priority', () => {
    expect(() => RecipePrioritySchema.parse('critical')).toThrow();
  });

  it('rejects a number', () => {
    expect(() => RecipePrioritySchema.parse(42)).toThrow();
  });
});

// ── RecipeEntrySchema ───────────────────────────────────────────────────────

describe('RecipeEntrySchema', () => {
  const validEntry = {
    id: 'recipe-ui5-button-click',
    name: 'Button Click',
    description: 'Press a UI5 button by matching its text property.',
    domain: 'ui5',
    priority: 'essential',
    capabilities: ['UI5-UI5-003'],
    pattern: "await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });",
  };

  it('accepts a valid entry', () => {
    const result = RecipeEntrySchema.parse(validEntry);
    expect(result.id).toBe('recipe-ui5-button-click');
    expect(result.name).toBe('Button Click');
    expect(result.domain).toBe('ui5');
    expect(result.priority).toBe('essential');
    expect(result.capabilities).toEqual(['UI5-UI5-003']);
  });

  it('accepts entry with empty capabilities array', () => {
    const result = RecipeEntrySchema.parse({ ...validEntry, capabilities: [] });
    expect(result.capabilities).toEqual([]);
  });

  it('accepts entry with multiple capabilities', () => {
    const result = RecipeEntrySchema.parse({
      ...validEntry,
      capabilities: ['UI5-UI5-001', 'UI5-TABLE-002', 'UI5-DIALOG-003'],
    });
    expect(result.capabilities).toHaveLength(3);
  });

  it('rejects an entry with invalid ID format (missing recipe- prefix)', () => {
    expect(() => RecipeEntrySchema.parse({ ...validEntry, id: 'button-click' })).toThrow();
  });

  it('rejects an entry with uppercase in ID', () => {
    expect(() => RecipeEntrySchema.parse({ ...validEntry, id: 'recipe-UI5-button' })).toThrow();
  });

  it('rejects an empty name', () => {
    expect(() => RecipeEntrySchema.parse({ ...validEntry, name: '' })).toThrow();
  });

  it('rejects a description shorter than 10 characters', () => {
    expect(() => RecipeEntrySchema.parse({ ...validEntry, description: 'Short' })).toThrow();
  });

  it('rejects an empty domain', () => {
    expect(() => RecipeEntrySchema.parse({ ...validEntry, domain: '' })).toThrow();
  });

  it('rejects an invalid priority', () => {
    expect(() => RecipeEntrySchema.parse({ ...validEntry, priority: 'critical' })).toThrow();
  });

  it('rejects an empty pattern', () => {
    expect(() => RecipeEntrySchema.parse({ ...validEntry, pattern: '' })).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() =>
      RecipeEntrySchema.parse({
        name: validEntry.name,
        description: validEntry.description,
        domain: validEntry.domain,
        priority: validEntry.priority,
        capabilities: validEntry.capabilities,
        pattern: validEntry.pattern,
      }),
    ).toThrow();
  });
});

// ── RecipesYamlSchema ───────────────────────────────────────────────────────

describe('RecipesYamlSchema', () => {
  /** Builds `n` valid recipe entries for testing the min(10) constraint. */
  function makeRecipes(n: number): Record<string, unknown>[] {
    return Array.from({ length: n }, (_, i) => {
      const idx = String(i + 1);
      return {
        id: `recipe-test-entry-${idx.padStart(3, '0')}`,
        name: `Test Recipe ${idx}`,
        description: `Test recipe number ${idx} for validation`,
        domain: 'test',
        priority: 'essential',
        capabilities: [`UI5-TEST-${idx.padStart(3, '0')}`],
        pattern: `await test.recipe${idx}();`,
      };
    });
  }

  it('accepts a valid YAML structure with 10+ recipes', () => {
    const result = RecipesYamlSchema.parse({
      recipes: makeRecipes(10),
    });
    expect(result.recipes).toHaveLength(10);
  });

  it('accepts more than 10 recipes', () => {
    const result = RecipesYamlSchema.parse({
      recipes: makeRecipes(14),
    });
    expect(result.recipes).toHaveLength(14);
  });

  it('rejects fewer than 10 recipes', () => {
    expect(() =>
      RecipesYamlSchema.parse({
        recipes: makeRecipes(9),
      }),
    ).toThrow();
  });

  it('rejects missing recipes key', () => {
    expect(() => RecipesYamlSchema.parse({})).toThrow();
  });

  it('rejects empty recipes array', () => {
    expect(() => RecipesYamlSchema.parse({ recipes: [] })).toThrow();
  });
});
