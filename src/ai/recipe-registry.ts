/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Queryable registry of reusable SAP Fiori test recipes for AI agents.
 *
 * @remarks
 * On construction the registry seeds itself from `GENERATED_RECIPES`
 * (produced by `npm run generate:recipes`). Recipes are immutable once
 * loaded — add new ones via the generator, not at runtime.
 *
 * All query methods return new arrays; the internal store is never mutated
 * after construction.
 *
 * @example
 * ```typescript
 * import { RecipeRegistry } from '#ai/recipe-registry.js';
 *
 * const registry = new RecipeRegistry();
 * const authRecipes = registry.select({ domain: 'auth' });
 * const topFive = registry.getTopRecipes(5);
 * ```
 *
 * @module ai
 */

import { GENERATED_RECIPES } from './recipe-registry.generated.js';
import type { RecipeEntry, RecipePriority } from './schemas/recipe.schema.js';

/** Filter options accepted by {@link RecipeRegistry.select}. */
interface RecipeFilter {
  /** Filter by domain string (case-sensitive). */
  readonly domain?: string;
  /** Filter by priority level. */
  readonly priority?: RecipePriority;
}

/**
 * Queryable registry of reusable test pattern recipes.
 *
 * @intent Provide curated SAP Fiori test patterns to AI agents and human testers.
 * @capability pramanAI.recipes
 *
 * @example
 * ```typescript
 * const registry = new RecipeRegistry();
 * const aiRecipes = registry.forAI();
 * ```
 */
export class RecipeRegistry {
  private readonly recipes: readonly RecipeEntry[];

  /**
   * Constructs a registry pre-seeded from the generated recipe list.
   *
   * @example
   * ```typescript
   * const registry = new RecipeRegistry();
   * logger.info(registry.select({}).length);
   * ```
   */
  constructor() {
    this.recipes = [...GENERATED_RECIPES];
  }

  /**
   * Creates a registry seeded with an explicit list of entries.
   *
   * @remarks
   * Use this factory in tests or plugins to provide a known set of recipes
   * without modifying `GENERATED_RECIPES`.
   *
   * @param entries - Recipe entries to seed the registry with.
   * @returns A new `RecipeRegistry` instance containing the given entries.
   *
   * @example
   * ```typescript
   * const registry = RecipeRegistry.fromEntries([authRecipe, navRecipe]);
   * ```
   */
  static fromEntries(entries: readonly RecipeEntry[]): RecipeRegistry {
    const registry = new RecipeRegistry();
    // Replace the internal readonly array with the provided entries.
    // Object.defineProperty is used so the readonly contract is preserved at
    // the TypeScript level while allowing this one-time factory initialisation.
    Object.defineProperty(registry, 'recipes', {
      value: [...entries],
      writable: false,
      enumerable: false,
      configurable: false,
    });
    return registry;
  }

  /**
   * Returns recipes matching the given filter criteria.
   *
   * @remarks
   * All specified filter properties are AND-combined.
   * An empty filter object returns all registered recipes.
   *
   * @param filter - Optional category and/or role constraints.
   * @returns Matching recipe entries.
   *
   * @example
   * ```typescript
   * const uiRecipes = registry.select({ domain: 'ui5' });
   * const essential = registry.select({ domain: 'auth', priority: 'essential' });
   * ```
   */
  select(filter: RecipeFilter): RecipeEntry[] {
    return this.recipes.filter((recipe) => {
      if (filter.domain !== undefined && recipe.domain !== filter.domain) {
        return false;
      }
      if (filter.priority !== undefined && recipe.priority !== filter.priority) {
        return false;
      }
      return true;
    });
  }

  /**
   * Returns recipes matching the given domain.
   *
   * @param domain - Domain string to filter by (e.g. 'ui5', 'table', 'auth').
   * @returns Matching recipe entries.
   *
   * @example
   * ```typescript
   * const authRecipes = registry.selectByDomain('auth');
   * ```
   */
  selectByDomain(domain: string): RecipeEntry[] {
    return this.select({ domain });
  }

  /**
   * Returns recipes matching the given priority level.
   *
   * @param priority - Priority level to filter by.
   * @returns Matching recipe entries.
   *
   * @example
   * ```typescript
   * const essentialRecipes = registry.selectByPriority('essential');
   * ```
   */
  selectByPriority(priority: RecipePriority): RecipeEntry[] {
    return this.select({ priority });
  }

  /**
   * Searches recipes by substring match against `name` or `description`.
   *
   * @remarks
   * Case-insensitive substring match.
   * For semantic search, pass `forAI()` output directly to an LLM.
   *
   * @param query - Substring to search for.
   * @returns Matching recipe entries.
   *
   * @example
   * ```typescript
   * const loginRecipes = registry.search('login');
   * const tableRecipes = registry.search('table');
   * ```
   */
  search(query: string): RecipeEntry[] {
    const lower = query.toLowerCase();
    return this.recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(lower) ||
        recipe.description.toLowerCase().includes(lower),
    );
  }

  /**
   * Returns all recipes in an AI-agent-friendly format.
   *
   * @remarks
   * Currently returns all registered entries. Future versions may
   * apply token-budget-aware truncation or relevance scoring.
   *
   * @returns All recipe entries ordered by insertion.
   *
   * @example
   * ```typescript
   * const allRecipes = registry.forAI();
   * const prompt = JSON.stringify(allRecipes);
   * ```
   */
  forAI(): RecipeEntry[] {
    return [...this.recipes];
  }

  /**
   * Returns the top `n` recipes from the registry.
   *
   * @remarks
   * Returns at most `n` entries in insertion order. If fewer than `n`
   * recipes are registered, all registered entries are returned.
   *
   * @param n - Maximum number of recipes to return.
   * @returns Up to `n` recipe entries.
   *
   * @example
   * ```typescript
   * const topThree = registry.getTopRecipes(3);
   * ```
   */
  getTopRecipes(n: number): RecipeEntry[] {
    return this.recipes.slice(0, n);
  }
}
