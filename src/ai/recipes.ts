/**
 * Pre-built `recipes` singleton for consumer-facing recipe introspection.
 *
 * @remarks
 * Provides a ready-to-use module-level object matching the mk parity API.
 * Delegates all operations to a shared {@link RecipeRegistry} instance.
 *
 * @example
 * ```typescript
 * import { recipes } from 'playwright-praman';
 *
 * const authRecipes = recipes.selectByDomain('auth');
 * const essential = recipes.selectByPriority('essential');
 * const topFive = recipes.getTopRecipes(5);
 * ```
 *
 * @module ai
 */

import { RecipeRegistry } from './recipe-registry.js';
import type { RecipeEntry, RecipePriority } from './schemas/recipe.schema.js';

const registry = new RecipeRegistry();

/**
 * Consumer-facing recipes introspection API.
 *
 * @intent Provide drop-in parity with mk's `recipes` object.
 * @capability Recipe discovery, AI test scaffolding.
 *
 * @example
 * ```typescript
 * import { recipes } from 'playwright-praman';
 *
 * const essential = recipes.selectByPriority('essential');
 * const all = recipes.forAI();
 * ```
 */
export const recipes = {
  /** Returns recipes matching the given filter criteria. */
  select: (filter: {
    readonly domain?: string;
    readonly priority?: RecipePriority;
  }): RecipeEntry[] => registry.select(filter),

  /** Returns recipes matching the given domain. */
  selectByDomain: (domain: string): RecipeEntry[] => registry.selectByDomain(domain),

  /** Returns recipes matching the given priority level. */
  selectByPriority: (priority: RecipePriority): RecipeEntry[] =>
    registry.selectByPriority(priority),

  /** Searches recipes by substring match on name or description. */
  search: (query: string): RecipeEntry[] => registry.search(query),

  /** Returns all recipes in an AI-agent-friendly format. */
  forAI: (): RecipeEntry[] => registry.forAI(),

  /** Returns the top `n` recipes by insertion order. */
  getTopRecipes: (n: number): RecipeEntry[] => registry.getTopRecipes(n),

  /** Returns all registered recipe entries. */
  list: (): RecipeEntry[] => registry.forAI(),

  /** Searches recipes by substring match on name or description. */
  find: (query: string): RecipeEntry[] => registry.search(query),

  /** Returns `true` if a recipe with the given name exists. */
  has: (name: string): boolean =>
    registry.search(name).some((r) => r.name.toLowerCase() === name.toLowerCase()),

  /** Returns the pattern code for a named recipe, or `undefined`. */
  getSteps: (name: string): string | undefined => {
    const match = registry.search(name).find((r) => r.name.toLowerCase() === name.toLowerCase());
    return match?.pattern;
  },

  /** Returns a human-readable description of a named recipe. */
  describe: (name: string): string | undefined => {
    const match = registry.search(name).find((r) => r.name.toLowerCase() === name.toLowerCase());
    return match?.description;
  },

  /** Returns unique domain names across all registered recipes. */
  getDomains: (): string[] => {
    const all = registry.forAI();
    return [...new Set(all.map((r) => r.domain).filter(Boolean))];
  },

  /** Returns recipes relevant to a specific SAP domain. */
  forDomain: (domain: string): RecipeEntry[] => registry.selectByDomain(domain),

  /** Returns recipes associated with a specific capability. */
  forCapability: (capability: string): RecipeEntry[] => registry.search(capability),

  /** Returns recipes for a specific business process. */
  forProcess: (process: string): RecipeEntry[] => registry.search(process),

  /** Exports all recipes as a JSON-serializable array. */
  toJSON: (): readonly RecipeEntry[] => registry.forAI(),

  /** Validates that a recipe name exists. */
  validate: (name: string): { readonly valid: boolean } => {
    const match = registry.search(name).find((r) => r.name.toLowerCase() === name.toLowerCase());
    if (match === undefined) {
      return { valid: false };
    }
    return { valid: true };
  },

  /** The underlying registry instance (for advanced usage like `fromEntries()`). */
  registry,
} as const;
