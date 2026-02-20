/**
 * Vocabulary service — singleton implementation of {@link VocabularyService}.
 *
 * @remarks
 * Implements lazy domain loading, in-memory caching, and the public search
 * and selector-resolution API defined in {@link VocabularyService}.
 *
 * Use {@link createVocabularyService} to obtain a fresh instance. Multiple
 * callers can share one service to avoid redundant JSON parsing.
 *
 * @module vocabulary
 */

import type {
  SAPDomain,
  VocabularySearchResult,
  VocabularyServiceStats,
  VocabularyTerm,
  VocabularyService,
} from './types.js';
import { loadDomainFile, resolveDomainsDir } from './vocabulary-loader.js';
import { matchTerms, resolveFieldSelector } from './vocabulary-matcher.js';

import type { UI5Selector } from '#core/types/selectors.js';

/**
 * Default number of suggestions returned by {@link VocabularyServiceImpl.getSuggestions}.
 * @internal
 */
const DEFAULT_MAX_SUGGESTIONS = 10;

/**
 * Concrete implementation of {@link VocabularyService}.
 *
 * @remarks
 * Maintains one {@link Map} per loaded domain. Domains are loaded on demand
 * via {@link loadDomain}. Cache hit/miss counts track search performance.
 *
 * @example
 * ```typescript
 * const svc = createVocabularyService();
 * await svc.loadDomain('procurement');
 * const results = await svc.search('vendor', 'procurement');
 * ```
 */
class VocabularyServiceImpl implements VocabularyService {
  /** Term maps keyed by domain. Set by {@link loadDomain}. */
  private readonly domains = new Map<SAPDomain, Map<string, VocabularyTerm>>();

  /** Absolute path to directory containing domain JSON files. */
  private readonly domainsDir: string;

  /** Number of search calls that found at least one result. */
  private cacheHits = 0;

  /** Number of search calls that found no results. */
  private cacheMisses = 0;

  /**
   * @param domainsDir - Absolute path to the domain JSON directory.
   */
  constructor(domainsDir: string) {
    this.domainsDir = domainsDir;
  }

  /**
   * Search across all loaded domains (or a specific one) for matching terms.
   *
   * @param query - Natural-language query string.
   * @param domain - Optional domain to restrict search to.
   * @returns Matching terms sorted by confidence descending.
   *
   * @example
   * ```typescript
   * const results = await svc.search('supplier');
   * ```
   */
  async search(query: string, domain?: SAPDomain): Promise<VocabularySearchResult[]> {
    const domainsToSearch: SAPDomain[] = domain !== undefined ? [domain] : [...this.domains.keys()];

    const allResults: VocabularySearchResult[] = [];

    for (const d of domainsToSearch) {
      const terms = this.domains.get(d);
      if (terms === undefined) {
        continue;
      }
      const domainResults = matchTerms(query, terms, d);
      allResults.push(...domainResults);
    }

    allResults.sort((a, b) => b.confidence - a.confidence);

    if (allResults.length > 0) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    return Promise.resolve(allResults);
  }

  /**
   * Resolve a term to its UI5 selector, respecting confidence thresholds.
   *
   * @param term - Term to resolve.
   * @param domain - Optional domain to restrict resolution to.
   * @returns Selector or `undefined` if ambiguous / below threshold.
   *
   * @example
   * ```typescript
   * const sel = await svc.getFieldSelector('vendor', 'procurement');
   * ```
   */
  async getFieldSelector(term: string, domain?: SAPDomain): Promise<UI5Selector | undefined> {
    const results = await this.search(term, domain);
    return resolveFieldSelector(results);
  }

  /**
   * Return prefix-matching term name suggestions.
   *
   * @param partial - Beginning of a term name to complete.
   * @param maxResults - Maximum number of suggestions (default 10).
   * @returns Array of matching term name strings.
   *
   * @example
   * ```typescript
   * const suggestions = await svc.getSuggestions('sup', 5);
   * ```
   */
  async getSuggestions(
    partial: string,
    maxResults: number = DEFAULT_MAX_SUGGESTIONS,
  ): Promise<string[]> {
    if (partial.trim().length === 0) {
      return Promise.resolve([]);
    }

    const needle = partial.toLowerCase().trim();
    const seen = new Set<string>();
    const suggestions: string[] = [];

    for (const terms of this.domains.values()) {
      for (const termName of terms.keys()) {
        if (termName.toLowerCase().startsWith(needle) && !seen.has(termName)) {
          seen.add(termName);
          suggestions.push(termName);
          if (suggestions.length >= maxResults) {
            return Promise.resolve(suggestions);
          }
        }
      }
    }

    return Promise.resolve(suggestions);
  }

  /**
   * Load a SAP domain into memory.
   *
   * @remarks
   * If the domain is already loaded, this is a no-op. To force reload,
   * call with a fresh service instance.
   *
   * @param domain - Domain to load.
   *
   * @example
   * ```typescript
   * await svc.loadDomain('finance');
   * ```
   */
  async loadDomain(domain: SAPDomain): Promise<void> {
    if (this.domains.has(domain)) {
      return; // Already loaded
    }

    const terms = await loadDomainFile(domain, this.domainsDir);
    this.domains.set(domain, terms);
  }

  /**
   * Return a snapshot of current service statistics.
   *
   * @returns Service stats including loaded domains, term counts, and cache metrics.
   *
   * @example
   * ```typescript
   * const { totalTerms, cacheHits } = svc.getStats();
   * ```
   */
  getStats(): VocabularyServiceStats {
    const loadedDomains = [...this.domains.keys()];

    let totalTerms = 0;
    for (const terms of this.domains.values()) {
      totalTerms += terms.size;
    }

    return {
      loadedDomains,
      totalTerms,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
    };
  }
}

/**
 * Create a new {@link VocabularyService} instance.
 *
 * @remarks
 * Returns a fresh service with no domains loaded. Call {@link VocabularyService.loadDomain}
 * before searching.
 *
 * The `domainsDir` parameter is optional — by default the service locates
 * the bundled JSON files relative to this source file. Override it in tests
 * to point at mock data.
 *
 * @param domainsDir - Optional override for the domain JSON directory path.
 * @returns A new vocabulary service instance.
 *
 * @example
 * ```typescript
 * const svc = createVocabularyService();
 * await svc.loadDomain('procurement');
 * const results = await svc.search('vendor');
 * ```
 */
export function createVocabularyService(domainsDir?: string): VocabularyService {
  const dir = domainsDir ?? resolveDomainsDir(import.meta.url);
  return new VocabularyServiceImpl(dir);
}
