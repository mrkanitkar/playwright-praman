/**
 * @module vocabulary
 *
 * @remarks
 * Controlled vocabulary system for SAP S/4HANA business term resolution.
 * Maps natural-language terms to UI5 selectors with fuzzy matching,
 * synonym resolution, and cross-domain search across 6 SAP domains:
 * procurement, sales, finance, manufacturing, warehouse, and quality.
 *
 * @example
 * ```typescript
 * import { createVocabularyService } from 'playwright-praman/vocabulary';
 *
 * const svc = createVocabularyService();
 * await svc.loadDomain('procurement');
 * const results = await svc.search('vendor');
 * ```
 */

// ── Type exports ─────────────────────────────────────────────────────────────
export type {
  SAPDomain,
  VocabularyService,
  VocabularySearchResult,
  VocabularyServiceStats,
  VocabularyTerm,
  VocabularyDomain,
} from './types.js';

// ── Factory ───────────────────────────────────────────────────────────────────
export { createVocabularyService } from './vocabulary-service.js';
