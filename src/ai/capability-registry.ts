/**
 * Queryable registry of Praman API capabilities exposed to AI agents.
 *
 * @remarks
 * On construction the registry seeds itself from `GENERATED_CAPABILITIES`
 * (produced by `npm run generate:capabilities`). Additional entries can be
 * registered at runtime via `register()` — useful for tests and plugins.
 *
 * All query methods return new arrays; the internal store is never mutated
 * after `register()` completes.
 *
 * @example
 * ```typescript
 * import { CapabilityRegistry } from '#ai/capability-registry.js';
 *
 * const registry = new CapabilityRegistry();
 * const interactionCaps = registry.byCategory('interaction');
 * const aiContext = registry.forAI();
 * ```
 *
 * @module ai
 */

import { GENERATED_CAPABILITIES } from './capability-registry.generated.js';
import type { CapabilityEntry } from './types.js';

/**
 * Queryable registry of Praman API capabilities for AI agents.
 *
 * @intent Expose Praman API surface to LLMs for test generation.
 * @capability AI context building, capability discovery.
 *
 * @example
 * ```typescript
 * const registry = new CapabilityRegistry();
 * const caps = registry.byCategory('navigation');
 * ```
 */
export class CapabilityRegistry {
  /**
   * Registry schema version.
   *
   * @remarks
   * Bumped when the entry shape changes. Consumers can use this to
   * detect incompatible generated files at runtime.
   */
  static readonly registryVersion = 1;

  private readonly entries: Map<string, CapabilityEntry>;

  /**
   * Constructs a registry pre-seeded from the generated capability list.
   *
   * @example
   * ```typescript
   * const registry = new CapabilityRegistry();
   * console.log(registry.list().length);
   * ```
   */
  constructor() {
    this.entries = new Map<string, CapabilityEntry>();
    for (const entry of GENERATED_CAPABILITIES) {
      this.entries.set(entry.id, entry);
    }
  }

  /**
   * Returns all registered capability entries.
   *
   * @returns Shallow copy of the full capability list.
   *
   * @example
   * ```typescript
   * const all = registry.list();
   * console.log(all.length);
   * ```
   */
  list(): CapabilityEntry[] {
    return [...this.entries.values()];
  }

  /**
   * Returns capabilities matching the given category.
   *
   * @param category - Category string to filter by (case-sensitive).
   * @returns Entries whose `category` matches exactly.
   *
   * @example
   * ```typescript
   * const navCaps = registry.byCategory('navigation');
   * ```
   */
  byCategory(category: string): CapabilityEntry[] {
    return [...this.entries.values()].filter((e) => e.category === category);
  }

  /**
   * Searches capabilities by partial match against `name` or `description`.
   *
   * @remarks
   * Case-insensitive substring match. For semantic search, feed the result
   * list into an embedding model or pass `forAI()` output to an LLM.
   *
   * @param query - Substring to search for.
   * @returns Entries whose `name` or `description` contains the query.
   *
   * @example
   * ```typescript
   * const clickCaps = registry.find('click');
   * ```
   */
  find(query: string): CapabilityEntry[] {
    const lower = query.toLowerCase();
    return [...this.entries.values()].filter(
      (e) => e.name.toLowerCase().includes(lower) || e.description.toLowerCase().includes(lower),
    );
  }

  /**
   * Returns a list of capabilities optimised for inclusion in an AI prompt.
   *
   * @remarks
   * Currently returns all entries. In future releases this may apply
   * relevance scoring or truncation to stay within token budgets.
   *
   * @returns All capability entries (ordered by insertion).
   *
   * @example
   * ```typescript
   * const aiContext = registry.forAI();
   * const prompt = JSON.stringify(aiContext);
   * ```
   */
  forAI(): CapabilityEntry[] {
    return this.list();
  }

  /**
   * Returns the capability entry with the given `id`, or `undefined`.
   *
   * @param id - Unique kebab-case capability identifier.
   * @returns The matching entry, or `undefined` if not registered.
   *
   * @example
   * ```typescript
   * const cap = registry.get('click-button');
   * if (cap !== undefined) {
   *   console.log(cap.usage_example);
   * }
   * ```
   */
  get(id: string): CapabilityEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Returns `true` if a capability with the given `name` is registered.
   *
   * @remarks
   * Searches by `name` (not `id`). Names are not guaranteed unique but
   * are human-readable and match the TSDoc `@capability` tag value.
   *
   * @param name - Human-readable capability name to look up.
   * @returns `true` when at least one entry matches.
   *
   * @example
   * ```typescript
   * if (registry.has('clickButton')) {
   *   // safe to use
   * }
   * ```
   */
  has(name: string): boolean {
    for (const entry of this.entries.values()) {
      if (entry.name === name) return true;
    }
    return false;
  }

  /**
   * Registers a new capability entry or overwrites an existing one by `id`.
   *
   * @remarks
   * Intended for use in tests and plugins. The generated file should not
   * call this method — run `npm run generate:capabilities` instead.
   *
   * @param entry - Capability entry to add or replace.
   *
   * @example
   * ```typescript
   * registry.register({
   *   id: 'my-capability',
   *   name: 'myCapability',
   *   description: 'Does something useful',
   *   category: 'custom',
   *   usage_example: 'await custom.doSomething()',
   *   registryVersion: 1,
   * });
   * ```
   */
  register(entry: CapabilityEntry): void {
    this.entries.set(entry.id, entry);
  }
}
