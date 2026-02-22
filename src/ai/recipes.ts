/**
 * Pre-built `recipes` singleton for consumer-facing recipe introspection.
 *
 * @remarks
 * Provides a ready-to-use module-level object matching the dhikraft parity API.
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
import type { RecipeEntry, RecipePriority } from './types.js';

const registry = new RecipeRegistry();

/**
 * Consumer-facing recipes introspection API.
 *
 * @intent Provide drop-in parity with dhikraft's `recipes` object.
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

  /** The underlying registry instance (for advanced usage like `fromEntries()`). */
  registry,
} as const;
