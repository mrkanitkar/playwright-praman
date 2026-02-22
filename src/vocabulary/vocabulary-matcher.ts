/**
 * Vocabulary matcher — fuzzy and exact term matching for the vocabulary service.
 *
 * @remarks
 * Provides the core matching algorithms used by {@link VocabularyService}:
 * - Levenshtein distance for fuzzy matching.
 * - Exact, prefix, partial, and synonym match tiers.
 * - Confidence scoring with disambiguation logic.
 *
 * This module has NO I/O and NO side effects — it is a pure function module
 * suitable for hermetic unit testing.
 *
 * @module vocabulary
 */

import type { SAPDomain, VocabularySearchResult, VocabularyTerm } from './types.js';

import type { UI5Selector } from '#core/types/selectors.js';

/** Minimum confidence for {@link resolveFieldSelector} to return a selector. */
const FIELD_SELECTOR_THRESHOLD = 0.85;

/**
 * Confidence score for an exact match on the canonical term name or synonym.
 * @internal
 */
const CONFIDENCE_EXACT = 1.0;

/**
 * Confidence score when the term name starts with the query string.
 * @internal
 */
const CONFIDENCE_PREFIX = 0.9;

/**
 * Confidence score when the term name contains the query string.
 * @internal
 */
const CONFIDENCE_PARTIAL = 0.7;

/**
 * Confidence score when the Levenshtein distance is within the fuzzy threshold.
 * @internal
 */
const CONFIDENCE_FUZZY = 0.5;

/**
 * Maximum Levenshtein distance to still be considered a fuzzy match.
 * @internal
 */
const LEVENSHTEIN_THRESHOLD = 3;

/**
 * Computes the Levenshtein edit distance between two strings.
 *
 * @remarks
 * Uses a standard DP matrix approach. Both strings are expected to be
 * already lower-cased before this call.
 *
 * @param a - First string.
 * @param b - Second string.
 * @returns The number of single-character edits required to transform `a` into `b`.
 *
 * @example
 * ```typescript
 * levenshteinDistance('vendor', 'vendro'); // 2
 * ```
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const rowSize = m + 1;

  // Allocate (n+1) × (m+1) matrix as a flat array for efficiency
  const dp: number[] = new Array<number>((n + 1) * rowSize).fill(0);

  for (let i = 0; i <= n; i++) {
    dp[i * rowSize] = i;
  }
  for (let j = 0; j <= m; j++) {
    // eslint-disable-next-line security/detect-object-injection -- index is a controlled loop variable
    dp[j] = j;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;

      dp[i * rowSize + j] = Math.min(
        (dp[(i - 1) * rowSize + j] ?? i) + 1,
        (dp[i * rowSize + (j - 1)] ?? j) + 1,
        (dp[(i - 1) * rowSize + (j - 1)] ?? i + j) + cost,
      );
    }
  }

  return dp[n * rowSize + m] ?? Math.max(m, n);
}

/**
 * Normalize a query or term for consistent, case-insensitive comparison.
 *
 * @param text - Raw text.
 * @returns Lower-cased, trimmed string.
 *
 * @example
 * ```typescript
 * normalize('  Supplier  '); // 'supplier'
 * ```
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replaceAll(/[/\-_.]/g, ' ')
    .replaceAll(/ {2,}/g, ' ')
    .trim();
}

/**
 * Compute confidence for matching `query` against `candidate`.
 *
 * @remarks
 * Confidence tiers (in priority order):
 * 1. Exact match → 1.0
 * 2. Prefix match → 0.9
 * 3. Partial match (contains) → 0.7
 * 4. Fuzzy (Levenshtein ≤ 3) → 0.5
 * 5. No match → 0
 *
 * @param query - Normalized query string.
 * @param candidate - Normalized candidate string.
 * @returns Confidence score in [0, 1].
 *
 * @example
 * ```typescript
 * computeConfidence('vendor', 'vendor'); // 1.0
 * computeConfidence('vend', 'vendor');   // 0.9
 * computeConfidence('endo', 'vendor');   // 0.7
 * computeConfidence('vendro', 'vendor'); // 0.5
 * computeConfidence('xyz', 'vendor');    // 0
 * ```
 */
export function computeConfidence(query: string, candidate: string): number {
  if (query.length === 0) {
    return 0;
  }
  if (query === candidate) {
    return CONFIDENCE_EXACT;
  }
  if (candidate.startsWith(query)) {
    return CONFIDENCE_PREFIX;
  }
  if (candidate.includes(query)) {
    return CONFIDENCE_PARTIAL;
  }
  const dist = levenshteinDistance(query, candidate);
  if (dist <= LEVENSHTEIN_THRESHOLD) {
    return CONFIDENCE_FUZZY;
  }
  return 0;
}

/**
 * Compute the best confidence for a term given a normalized query.
 *
 * @remarks
 * Checks the canonical name first (full confidence), then each synonym
 * (synonym exact = 1.0, not penalized — synonyms are first-class names).
 *
 * @param query - Normalized query string.
 * @param term - Vocabulary term to match against.
 * @returns Best confidence score across name and all synonyms.
 *
 * @example
 * ```typescript
 * scoreTerm('vendor', { name: 'supplier', synonyms: ['vendor', 'supplierId'] });
 * // 1.0 (exact synonym match)
 * ```
 */
export function scoreTerm(query: string, term: VocabularyTerm): number {
  const nameCandidates = [normalize(term.name), ...term.synonyms.map(normalize)];
  let best = 0;
  for (const candidate of nameCandidates) {
    const score = computeConfidence(query, candidate);
    if (score > best) {
      best = score;
    }
  }
  return best;
}

/**
 * Search a collection of terms for those matching `query`.
 *
 * @remarks
 * Returns all terms with confidence above zero, sorted descending by confidence.
 *
 * @param query - Raw (un-normalized) query string.
 * @param terms - Collection of terms to search through.
 * @param domain - Domain label to include in results.
 * @returns Array of search results, sorted by confidence descending.
 *
 * @example
 * ```typescript
 * const results = matchTerms('vendor', termsMap, 'procurement');
 * ```
 */
export function matchTerms(
  query: string,
  terms: ReadonlyMap<string, VocabularyTerm>,
  domain: SAPDomain,
): VocabularySearchResult[] {
  if (query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = normalize(query);
  const results: VocabularySearchResult[] = [];

  for (const term of terms.values()) {
    const confidence = scoreTerm(normalizedQuery, term);
    if (confidence > 0) {
      results.push({
        term: term.name,
        synonyms: [...term.synonyms],
        confidence,
        domain,
        ...(term.sapField !== undefined && { sapField: term.sapField }),
        ...(term.selector !== undefined && { selector: term.selector }),
      });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

/**
 * Resolve a single field selector from a list of search results.
 *
 * @remarks
 * Implements the disambiguation logic:
 * - If the top result has confidence ≥ 0.85, return its selector.
 * - If multiple results exceed 0.7 but none reaches 0.85, return `undefined`.
 * - If no result has a selector, return `undefined`.
 *
 * @param results - Sorted search results (descending confidence).
 * @returns The best selector, or `undefined` when ambiguous/not found.
 *
 * @example
 * ```typescript
 * const selector = resolveFieldSelector(searchResults);
 * ```
 */
export function resolveFieldSelector(
  results: readonly VocabularySearchResult[],
): UI5Selector | undefined {
  if (results.length === 0) {
    return undefined;
  }

  const top = results[0];
  /* c8 ignore next 4 */
  if (top === undefined) {
    return undefined;
  }

  // Single strong match
  if (top.confidence >= FIELD_SELECTOR_THRESHOLD) {
    return top.selector;
  }

  // Disambiguation: multiple matches above 0.7 but none strong enough
  const ambiguous = results.filter((r) => r.confidence > CONFIDENCE_PARTIAL);
  if (ambiguous.length > 1) {
    return undefined;
  }

  return undefined;
}
