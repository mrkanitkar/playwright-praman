/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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
  TestComplianceReport,
  ComplianceReporterOptions,
  TestComplianceEntry,
  TestComplianceStatus,
} from './compliance-reporter.js';

// ── OData Trace Reporter ─────────────────────────────────────────────────────

export { ODataTraceReporter } from './odata-trace-reporter.js';
export type {
  ODataEntityStats,
  ODataTraceEntry,
  ODataTraceReport,
  ODataTraceReporterOptions,
} from './odata-trace-reporter.js';
