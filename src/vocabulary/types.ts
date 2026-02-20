/**
 * Core types for the Praman vocabulary module.
 *
 * @remarks
 * Defines the public type surface for the vocabulary system: term shapes,
 * domain identifiers, search results, service statistics, and the service
 * interface itself. All types are `Readonly` to enforce immutability.
 *
 * @module vocabulary
 */

import type { UI5Selector } from '#core/types/selectors.js';

// Re-export for consumers who import from this module
export type { UI5Selector };

/**
 * The six supported SAP business domains in the vocabulary system.
 *
 * @example
 * ```typescript
 * const domain: SAPDomain = 'procurement';
 * ```
 */
export type SAPDomain =
  | 'procurement'
  | 'sales'
  | 'finance'
  | 'manufacturing'
  | 'warehouse'
  | 'quality';

/**
 * A single vocabulary term with its synonyms and selector information.
 *
 * @remarks
 * Represents one named concept in a SAP business domain. The `name` is the
 * canonical identifier; `synonyms` are alternative human-readable names that
 * also resolve to this term. The `selector` (if present) enables direct
 * UI5 control discovery.
 *
 * @example
 * ```typescript
 * const term: VocabularyTerm = {
 *   name: 'supplier',
 *   synonyms: ['vendor', 'vendorId', 'supplierId'],
 *   domain: 'procurement',
 *   sapField: 'LIFNR',
 *   selector: { controlType: 'sap.m.Input', properties: { labelFor: 'Supplier' } },
 * };
 * ```
 */
export interface VocabularyTerm {
  /** Canonical term name. */
  readonly name: string;
  /** Alternative names that also resolve to this term. */
  readonly synonyms: readonly string[];
  /** The SAP domain this term belongs to. */
  readonly domain: SAPDomain;
  /** The underlying SAP ABAP field name (e.g. `'LIFNR'`). */
  readonly sapField?: string;
  /** UI5 selector for direct control discovery. */
  readonly selector?: UI5Selector;
}

/**
 * A domain of vocabulary terms grouped by name.
 *
 * @remarks
 * Maps canonical term names to their full {@link VocabularyTerm} definitions.
 *
 * @example
 * ```typescript
 * const domain: VocabularyDomain = {
 *   name: 'procurement',
 *   terms: {
 *     supplier: { name: 'supplier', synonyms: ['vendor'], domain: 'procurement' },
 *   },
 * };
 * ```
 */
export interface VocabularyDomain {
  /** The SAP domain identifier. */
  readonly name: SAPDomain;
  /** All terms in this domain, keyed by canonical name. */
  readonly terms: Readonly<Record<string, VocabularyTerm>>;
}

/**
 * A single search result returned by {@link VocabularyService.search}.
 *
 * @example
 * ```typescript
 * const result: VocabularySearchResult = {
 *   term: 'supplier',
 *   synonyms: ['vendor', 'vendorId'],
 *   confidence: 0.95,
 *   domain: 'procurement',
 *   sapField: 'LIFNR',
 *   selector: { controlType: 'sap.m.Input' },
 * };
 * ```
 */
export interface VocabularySearchResult {
  /** The matched canonical term name. */
  readonly term: string;
  /** Synonyms of the matched term. */
  readonly synonyms: string[];
  /** Confidence score from 0.0 (no match) to 1.0 (exact match). */
  readonly confidence: number;
  /** The SAP domain in which the match was found. */
  readonly domain: SAPDomain;
  /** SAP ABAP field name if available. */
  readonly sapField?: string;
  /** UI5 selector for the matched term if available. */
  readonly selector?: UI5Selector;
}

/**
 * Operational statistics for a running {@link VocabularyService}.
 *
 * @example
 * ```typescript
 * const stats: VocabularyServiceStats = {
 *   loadedDomains: ['procurement', 'sales'],
 *   totalTerms: 142,
 *   cacheHits: 37,
 *   cacheMisses: 5,
 * };
 * ```
 */
export interface VocabularyServiceStats {
  /** Domains that have been loaded into memory. */
  readonly loadedDomains: SAPDomain[];
  /** Total number of vocabulary terms across all loaded domains. */
  readonly totalTerms: number;
  /** Number of search cache hits since service creation. */
  readonly cacheHits: number;
  /** Number of search cache misses since service creation. */
  readonly cacheMisses: number;
}

/**
 * The public interface of the vocabulary service.
 *
 * @remarks
 * Use {@link createVocabularyService} to obtain an instance. The service is
 * lazy: domains are loaded on demand via {@link VocabularyService.loadDomain}.
 *
 * @example
 * ```typescript
 * const svc = createVocabularyService();
 * await svc.loadDomain('procurement');
 * const results = await svc.search('vendor', 'procurement');
 * ```
 */
export interface VocabularyService {
  /**
   * Search vocabulary terms matching `query`.
   *
   * @param query - Natural-language search string.
   * @param domain - Optional domain to restrict search to.
   * @returns Matched terms sorted by confidence descending.
   *
   * @example
   * ```typescript
   * const results = await svc.search('supplier');
   * ```
   */
  search(query: string, domain?: SAPDomain): Promise<VocabularySearchResult[]>;

  /**
   * Resolve a term to its UI5 selector when confidence is high enough.
   *
   * @remarks
   * Returns `undefined` when:
   * - No match reaches the 0.85 threshold.
   * - Multiple matches score above 0.7 but below 0.85 (ambiguous).
   *
   * @param term - Term to resolve.
   * @param domain - Optional domain to restrict resolution to.
   * @returns UI5 selector or `undefined`.
   *
   * @example
   * ```typescript
   * const selector = await svc.getFieldSelector('vendor', 'procurement');
   * ```
   */
  getFieldSelector(term: string, domain?: SAPDomain): Promise<UI5Selector | undefined>;

  /**
   * Return term name suggestions for a partial query.
   *
   * @param partial - Beginning of a term name to complete.
   * @param maxResults - Maximum number of suggestions to return (default 10).
   * @returns Array of matching term names.
   *
   * @example
   * ```typescript
   * const suggestions = await svc.getSuggestions('sup');
   * // ['supplier', 'supplierName', ...]
   * ```
   */
  getSuggestions(partial: string, maxResults?: number): Promise<string[]>;

  /**
   * Load a SAP domain into memory, enabling search within it.
   *
   * @param domain - The SAP domain to load.
   *
   * @example
   * ```typescript
   * await svc.loadDomain('finance');
   * ```
   */
  loadDomain(domain: SAPDomain): Promise<void>;

  /**
   * Return current service statistics.
   *
   * @returns Snapshot of loaded domains, term counts, and cache performance.
   *
   * @example
   * ```typescript
   * const stats = svc.getStats();
   * console.log(stats.totalTerms);
   * ```
   */
  getStats(): VocabularyServiceStats;
}
