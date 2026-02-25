/**
 * Zod schemas for recipe registry entries.
 *
 * @remarks
 * These schemas are the single source of truth for the `RecipeEntry` type
 * used in `recipes.yaml`. The TypeScript type is derived via `z.infer<>`.
 *
 * @module ai
 */

import { z } from 'zod';

/**
 * Priority level for recipe adoption guidance.
 *
 * @example
 * ```typescript
 * const p: RecipePriority = 'essential';
 * ```
 */
export const RecipePrioritySchema = z.enum([
  'essential',
  'recommended',
  'optional',
  'advanced',
  'deprecated',
]);
export type RecipePriority = z.infer<typeof RecipePrioritySchema>;

/**
 * A single recipe entry describing a reusable test pattern.
 *
 * @remarks
 * Recipes are curated test patterns that AI agents can emit verbatim or
 * adapt for specific SAP Fiori test scenarios.
 *
 * @intent Provide reusable SAP Fiori test patterns for AI generation.
 * @capability AI recipe lookup, test scaffolding.
 *
 * @example
 * ```typescript
 * const recipe: RecipeEntry = {
 *   id: 'recipe-ui5-button-click',
 *   name: 'Button Click',
 *   description: 'Press a UI5 button by matching its text property.',
 *   domain: 'ui5',
 *   priority: 'essential',
 *   capabilities: ['UI5-UI5-003'],
 *   pattern: "await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });",
 * };
 * ```
 */
export const RecipeEntrySchema = z.object({
  /** Unique kebab-case identifier. */
  id: z.string().regex(/^recipe-[a-z0-9-]+$/),
  /** Short descriptive title. */
  name: z.string().min(1),
  /** One or two sentence explanation. */
  description: z.string().min(10),
  /** Domain category for grouping. */
  domain: z.string().min(1),
  /** Priority level for adoption guidance. */
  priority: RecipePrioritySchema,
  /** Capability IDs or refs this recipe uses. */
  capabilities: z.array(z.string()),
  /** Ready-to-use TypeScript code pattern. */
  pattern: z.string().min(1),
});
export type RecipeEntry = z.infer<typeof RecipeEntrySchema>;

/**
 * Schema for validating the full recipes.yaml file structure.
 *
 * @example
 * ```typescript
 * const parsed = RecipesYamlSchema.parse(yamlData);
 * ```
 */
export const RecipesYamlSchema = z.object({
  recipes: z.array(RecipeEntrySchema).min(10),
});
export type RecipesYaml = z.infer<typeof RecipesYamlSchema>;
