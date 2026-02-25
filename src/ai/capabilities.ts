/**
 * Pre-built `capabilities` singleton for consumer-facing capability introspection.
 *
 * @remarks
 * Provides a ready-to-use module-level object matching the mk parity API.
 * Delegates all operations to a shared {@link CapabilityRegistry} instance.
 *
 * @example
 * ```typescript
 * import { capabilities } from 'playwright-praman';
 *
 * const fixtures = capabilities.listByPriority('fixture');
 * const stats = capabilities.getStatistics();
 * const json = capabilities.forAI();
 * ```
 *
 * @module ai
 */

import { CapabilityRegistry } from './capability-registry.js';
import type { CapabilityCategory } from './schemas/capability.schema.js';
import type { CapabilitiesJSON, CapabilityEntry, CapabilityStats } from './types.js';

const registry = new CapabilityRegistry();

/**
 * Consumer-facing capabilities introspection API.
 *
 * @intent Provide drop-in parity with mk's `capabilities` object.
 * @capability Capability discovery, AI context building.
 *
 * @example
 * ```typescript
 * import { capabilities } from 'playwright-praman';
 *
 * if (capabilities.has('clickButton')) {
 *   const cap = capabilities.findByName('clickButton');
 * }
 * ```
 */
export const capabilities = {
  /** Returns all registered capability entries. */
  list: (): CapabilityEntry[] => registry.list(),

  /** Returns entries matching the given priority tier. */
  listByPriority: (priority: 'fixture' | 'namespace' | 'implementation'): CapabilityEntry[] =>
    registry.listByPriority(priority),

  /** Returns entries with `priority === 'fixture'` (Playwright best practice). */
  listFixtures: (): CapabilityEntry[] => registry.listByPriority('fixture'),

  /** Returns `true` if a capability with the given name is registered. */
  has: (name: string): boolean => registry.has(name),

  /** Searches capabilities by substring match on name or description. */
  find: (query: string): CapabilityEntry[] => registry.find(query),

  /** Returns the first entry matching the given name, or `undefined`. */
  findByName: (name: string): CapabilityEntry | undefined => registry.findByName(name),

  /** Returns a statistical summary of the registry. */
  getStatistics: (): CapabilityStats => registry.getStatistics(),

  /** Exports the full registry as structured JSON. */
  toJSON: (): CapabilitiesJSON => registry.toJSON(),

  /** Returns structured JSON optimised for AI agent consumption. */
  forAI: (): CapabilitiesJSON => registry.forAI(),

  /** Returns capabilities relevant to a specific UI5 control type. */
  forControl: (controlType: string): CapabilityEntry[] =>
    registry.list().filter((e) => e.controlTypes?.includes(controlType) ?? false),

  /** Returns a human-readable description of a named capability. */
  describe: (name: string): string | undefined => registry.findByName(name)?.description,

  /** Returns unique category names across all registered capabilities. */
  getCategories: (): readonly CapabilityCategory[] => registry.getStatistics().categories,

  /** Returns capabilities matching the given category. */
  byCategory: (category: CapabilityCategory): CapabilityEntry[] => registry.byCategory(category),

  /** Returns capabilities matching the given namespace prefix. */
  byNamespace: (namespace: string): CapabilityEntry[] => registry.byNamespace(namespace),

  /** Looks up a capability by its kebab-case ID. */
  get: (id: string): CapabilityEntry | undefined => registry.get(id),

  /** Returns capabilities formatted for a specific AI provider. */
  forProvider: (provider: 'claude' | 'openai' | 'gemini'): string => registry.forProvider(provider),

  /** The underlying registry instance (for advanced usage like `register()`). */
  registry,
} as const;
