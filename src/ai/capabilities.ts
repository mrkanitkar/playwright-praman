/**
 * Pre-built `capabilities` singleton for consumer-facing capability introspection.
 *
 * @remarks
 * Provides a ready-to-use module-level object matching the dhikraft parity API.
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
import type { CapabilitiesJSON, CapabilityEntry, CapabilityStats } from './types.js';

const registry = new CapabilityRegistry();

/**
 * Consumer-facing capabilities introspection API.
 *
 * @intent Provide drop-in parity with dhikraft's `capabilities` object.
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

  /** The underlying registry instance (for advanced usage like `register()`). */
  registry,
} as const;
