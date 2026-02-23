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
 * const authRecipes = recipes.selectByCategory('auth');
 * const agentRecipes = recipes.selectByRole('ai-agent');
 * const topFive = recipes.getTopRecipes(5);
 * ```
 *
 * @module ai
 */

import { RecipeRegistry } from './recipe-registry.js';
import type { RecipeEntry, RecipePriority, RecipeRole } from './types.js';

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
    readonly category?: string;
    readonly role?: RecipeEntry['role'];
    readonly priority?: RecipePriority;
  }): RecipeEntry[] => registry.select(filter),

  /** Returns recipes matching the given role. */
  selectByRole: (role: RecipeEntry['role']): RecipeEntry[] => registry.selectByRole(role),

  /** Returns recipes matching the given category. */
  selectByCategory: (category: string): RecipeEntry[] => registry.selectByCategory(category),

  /** Returns recipes matching the given priority level. */
  selectByPriority: (priority: RecipePriority): RecipeEntry[] =>
    registry.selectByPriority(priority),

  /** Searches recipes by substring match on title, description, or tags. */
  search: (query: string): RecipeEntry[] => registry.search(query),

  /** Returns all recipes in an AI-agent-friendly format. */
  forAI: (): RecipeEntry[] => registry.forAI(),

  /** Returns the top `n` recipes by insertion order. */
  getTopRecipes: (n: number): RecipeEntry[] => registry.getTopRecipes(n),

  /** Returns all registered recipe entries. */
  list: (): RecipeEntry[] => registry.forAI(),

  /** Searches recipes by substring match on title, description, or tags. */
  find: (query: string): RecipeEntry[] => registry.search(query),

  /** Returns `true` if a recipe with the given title exists. */
  has: (title: string): boolean =>
    registry.search(title).some((r) => r.title.toLowerCase() === title.toLowerCase()),

  /** Returns the code steps for a named recipe, or `undefined`. */
  getSteps: (title: string): string | undefined => {
    const match = registry.search(title).find((r) => r.title.toLowerCase() === title.toLowerCase());
    return match?.code;
  },

  /** Returns a human-readable description of a named recipe. */
  describe: (title: string): string | undefined => {
    const match = registry.search(title).find((r) => r.title.toLowerCase() === title.toLowerCase());
    return match?.description;
  },

  /** Returns unique category names across all registered recipes. */
  getCategories: (): string[] => {
    const all = registry.forAI();
    return [...new Set(all.map((r) => r.category).filter(Boolean))];
  },

  /** Returns recipes relevant to a specific SAP domain. */
  forDomain: (domain: string): RecipeEntry[] => registry.search(domain),

  /** Returns recipes associated with a specific capability. */
  forCapability: (capability: string): RecipeEntry[] => registry.search(capability),

  /** Returns recipes for a specific business process. */
  forProcess: (process: string): RecipeEntry[] => registry.search(process),

  /** Exports all recipes as a JSON-serializable array. */
  toJSON: (): readonly RecipeEntry[] => registry.forAI(),

  /** Validates that a recipe title exists and returns basic info. */
  validate: (title: string): { readonly valid: boolean; readonly role?: RecipeRole } => {
    const match = registry.search(title).find((r) => r.title.toLowerCase() === title.toLowerCase());
    if (match === undefined) {
      return { valid: false };
    }
    return { valid: true, role: match.role };
  },

  /** The underlying registry instance (for advanced usage like `fromEntries()`). */
  registry,
} as const;
