/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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
 * const tableCaps = registry.byCategory('table');
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
  CapabilityCategory,
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
 * const tableCaps = registry.byCategory('table');
 * const aiContext = registry.forAI();
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
   * @param category - Category to filter by.
   * @returns Entries whose `category` matches exactly.
   *
   * @example
   * ```typescript
   * const navCaps = registry.byCategory('navigate');
   * ```
   */
  byCategory(category: CapabilityCategory): CapabilityEntry[] {
    return [...this.entries.values()].filter((e) => e.category === category);
  }

  /**
   * Returns capabilities matching the given namespace prefix.
   *
   * @param namespace - Dot-separated namespace prefix, e.g. 'ui5.table'.
   * @returns Entries whose `qualifiedName` starts with the namespace.
   *
   * @example
   * ```typescript
   * const tableCaps = registry.byNamespace('ui5.table');
   * ```
   */
  byNamespace(namespace: string): CapabilityEntry[] {
    return [...this.entries.values()].filter((e) => e.qualifiedName.startsWith(namespace));
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
   *   logger.info(cap.usageExample);
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
    switch (provider) {
      case 'claude': {
        return this.formatForClaude(this.list());
      }
      case 'openai': {
        return this.formatForOpenAI();
      }
      case 'gemini': {
        return this.formatForGemini();
      }
      default:
        return assertNever(provider);
    }
  }

  /**
   * Escapes special XML characters in text content and attribute values.
   *
   * @param text - Raw text to escape.
   * @returns XML-safe string.
   */
  private escapeXml(text: string): string {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
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
      const attrs = [
        `name="${this.escapeXml(entry.name)}"`,
        `category="${this.escapeXml(entry.category)}"`,
      ];
      if (entry.intent !== undefined) {
        attrs.push(`intent="${this.escapeXml(entry.intent)}"`);
      }
      lines.push(`  <capability ${attrs.join(' ')}>`);
      lines.push(`    <description>${this.escapeXml(entry.description)}</description>`);
      lines.push(`    <example>${this.escapeXml(entry.usageExample)}</example>`);
      lines.push('  </capability>');
    }
    lines.push('</capabilities>');
    return lines.join('\n');
  }

  /**
   * Formats capabilities as a JSON object for OpenAI.
   *
   * @returns JSON string of the full registry snapshot.
   */
  private formatForOpenAI(): string {
    return JSON.stringify(this.toJSON(), undefined, 2);
  }

  /**
   * Formats capabilities as a JSON object for Gemini.
   *
   * @returns JSON string of the full registry snapshot.
   */
  private formatForGemini(): string {
    return JSON.stringify(this.toJSON(), undefined, 2);
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
   *   logger.info(cap.usageExample);
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
   *   id: 'UI5-UI5-020',
   *   qualifiedName: 'ui5.myCapability',
   *   name: 'myCapability',
   *   description: 'Does something useful for testing.',
   *   category: 'ui5',
   *   priority: 'fixture',
   *   usageExample: 'await ui5.myCapability()',
   *   registryVersion: 1,
   * });
   * ```
   */
  register(entry: CapabilityEntry): void {
    this.entries.set(entry.id, entry);
  }
}
