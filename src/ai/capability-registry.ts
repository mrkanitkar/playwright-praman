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

import { PACKAGE_NAME, VERSION } from '../version.js';

import { GENERATED_CAPABILITIES } from './capability-registry.generated.js';
import type {
  AiProviderName,
  CapabilitiesJSON,
  CapabilityEntry,
  CapabilityStats,
} from './types.js';

import { assertNever } from '#core/utils/assert-never.js';

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
   * logger.info(registry.list().length);
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
   * logger.info(all.length);
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
   * Returns capabilities matching the given priority tier.
   *
   * @param priority - Priority level to filter by.
   * @returns Entries whose `priority` matches exactly.
   *
   * @example
   * ```typescript
   * const fixtures = registry.listByPriority('fixture');
   * const handlers = registry.listByPriority('namespace');
   * ```
   */
  listByPriority(priority: 'fixture' | 'namespace' | 'implementation'): CapabilityEntry[] {
    return [...this.entries.values()].filter((e) => e.priority === priority);
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
   * Returns the first capability entry matching the given `name`, or `undefined`.
   *
   * @remarks
   * Searches by human-readable `name` (not `id`). For exact ID lookup use `get()`.
   *
   * @param name - Human-readable capability name to look up (case-sensitive).
   * @returns The matching entry, or `undefined` if not found.
   *
   * @example
   * ```typescript
   * const cap = registry.findByName('clickButton');
   * if (cap !== undefined) {
   *   logger.info(cap.usage_example);
   * }
   * ```
   */
  findByName(name: string): CapabilityEntry | undefined {
    for (const entry of this.entries.values()) {
      if (entry.name === name) return entry;
    }
    return undefined;
  }

  /**
   * Returns a statistical summary of the capability registry.
   *
   * @returns Statistics including total count, categories, and priority breakdown.
   *
   * @example
   * ```typescript
   * const stats = registry.getStatistics();
   * logger.info(`Total: ${stats.totalMethods}`);
   * ```
   */
  getStatistics(): CapabilityStats {
    const entries = [...this.entries.values()];
    const categories = [...new Set(entries.map((e) => e.category).filter(Boolean))];
    return {
      totalMethods: entries.length,
      categories,
      generatedAt: new Date().toISOString(),
      version: VERSION,
      byPriority: {
        fixture: entries.filter((e) => e.priority === 'fixture').length,
        namespace: entries.filter((e) => e.priority === 'namespace').length,
        implementation: entries.filter((e) => e.priority === 'implementation').length,
      },
    };
  }

  /**
   * Exports the full registry as a structured JSON object.
   *
   * @remarks
   * Fixtures are listed first (Playwright best practice), then all methods.
   *
   * @returns Structured JSON snapshot of the entire registry.
   *
   * @example
   * ```typescript
   * const json = registry.toJSON();
   * logger.info(JSON.stringify(json, null, 2));
   * ```
   */
  toJSON(): CapabilitiesJSON {
    const stats = this.getStatistics();
    return {
      name: PACKAGE_NAME,
      version: VERSION,
      generatedAt: stats.generatedAt,
      totalMethods: stats.totalMethods,
      byPriority: stats.byPriority,
      fixtures: this.listByPriority('fixture'),
      methods: this.list(),
    };
  }

  /**
   * Returns the full registry as structured JSON optimised for AI agent consumption.
   *
   * @remarks
   * Currently an alias for `toJSON()`. Future releases may apply
   * provider-specific formatting or token-budget-aware truncation.
   *
   * @returns Structured JSON snapshot of the entire registry.
   *
   * @example
   * ```typescript
   * const aiContext = registry.forAI();
   * const prompt = JSON.stringify(aiContext);
   * ```
   */
  forAI(): CapabilitiesJSON {
    return this.toJSON();
  }

  /**
   * Returns capabilities formatted for a specific AI provider.
   *
   * @remarks
   * Each provider receives a format optimised for its native consumption pattern:
   * - `'claude'` — XML-structured `{@literal <capability>}` elements with attributes
   * - `'openai'` — JSON array of function-calling tool schemas
   * - `'gemini'` — Plain text listing with name, description, and example
   *
   * @param provider - Target AI provider name.
   * @returns Formatted capability descriptions as a string.
   *
   * @example
   * ```typescript
   * const registry = new CapabilityRegistry();
   * const claudeContext = registry.forProvider('claude');
   * const openaiTools = registry.forProvider('openai');
   * const geminiText = registry.forProvider('gemini');
   * ```
   */
  forProvider(provider: AiProviderName): string {
    const entries = this.list();

    switch (provider) {
      case 'claude': {
        return this.formatForClaude(entries);
      }
      case 'openai': {
        return this.formatForOpenAI(entries);
      }
      case 'gemini': {
        return this.formatForGemini(entries);
      }
      default:
        return assertNever(provider);
    }
  }

  /**
   * Formats capabilities as XML-structured elements for Claude.
   *
   * @param entries - Capability entries to format.
   * @returns XML-structured string with capability elements.
   */
  private formatForClaude(entries: readonly CapabilityEntry[]): string {
    if (entries.length === 0) {
      return '<capabilities />';
    }

    const lines: string[] = ['<capabilities>'];
    for (const entry of entries) {
      const attrs = [`name="${entry.name}"`, `category="${entry.category}"`];
      if (entry.intent !== undefined) {
        attrs.push(`intent="${entry.intent}"`);
      }
      lines.push(`  <capability ${attrs.join(' ')}>`);
      lines.push(`    <description>${entry.description}</description>`);
      lines.push(`    <example>${entry.usage_example}</example>`);
      lines.push('  </capability>');
    }
    lines.push('</capabilities>');
    return lines.join('\n');
  }

  /**
   * Formats capabilities as a JSON array of OpenAI function-calling tool schemas.
   *
   * @param entries - Capability entries to format.
   * @returns JSON string of tool function schemas.
   */
  private formatForOpenAI(entries: readonly CapabilityEntry[]): string {
    const tools = entries.map((entry) => ({
      type: 'function' as const,
      function: {
        name: entry.name,
        description: entry.description,
        parameters: {
          type: 'object' as const,
          properties: {
            example: {
              type: 'string' as const,
              description: entry.usage_example,
            },
          },
        },
        ...(entry.category !== '' ? { category: entry.category } : {}),
      },
    }));
    return JSON.stringify(tools, undefined, 2);
  }

  /**
   * Formats capabilities as a plain text listing for Gemini.
   *
   * @param entries - Capability entries to format.
   * @returns Plain text with one capability per block.
   */
  private formatForGemini(entries: readonly CapabilityEntry[]): string {
    if (entries.length === 0) {
      return 'No capabilities registered.';
    }

    return entries
      .map(
        (entry) =>
          `${entry.name} [${entry.category}]: ${entry.description}\n  Example: ${entry.usage_example}`,
      )
      .join('\n\n');
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
   *   logger.info(cap.usage_example);
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
