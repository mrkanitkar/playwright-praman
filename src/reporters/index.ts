/**
 * Praman reporters sub-path export barrel.
 *
 * @remarks
 * Re-exports the compliance reporter and OData trace reporter for use
 * in `playwright.config.ts` via `playwright-praman/reporters`.
 *
 * @example
 * ```typescript
 * import { ComplianceReporter, ODataTraceReporter } from 'playwright-praman/reporters';
 * ```
 *
 * @module reporters
 */

// ── Compliance Reporter ──────────────────────────────────────────────────────

export { ComplianceReporter, isPramanStep } from './compliance-reporter.js';
export type {
  ComplianceReport,
  ComplianceReporterOptions,
  TestComplianceEntry,
  TestComplianceStatus,
} from './compliance-reporter.js';

// ── OData Trace Reporter ─────────────────────────────────────────────────────

export {
  extractEntitySet,
  ODataTraceReporter,
  parseODataQueryParams,
} from './odata-trace-reporter.js';
export type {
  ODataEntityStats,
  ODataTraceEntry,
  ODataTraceReport,
  ODataTraceReporterOptions,
} from './odata-trace-reporter.js';
