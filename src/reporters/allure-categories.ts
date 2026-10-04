/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Pre-defined Allure failure categories for SAP S/4HANA test automation.
 *
 * @remarks
 * Each category matches a Praman error domain by its `ERR_<CATEGORY>_*`
 * message code and the corresponding `*Error` class name in the stack
 * trace.  Drop `categories.json` into Allure's results directory to
 * surface SAP-specific failure buckets in the report dashboard.
 *
 * @example
 * ```typescript
 * import { ALLURE_SAP_CATEGORIES } from 'playwright-praman/reporters';
 *
 * await writeFile(
 *   'allure-results/categories.json',
 *   JSON.stringify(ALLURE_SAP_CATEGORIES, undefined, 2),
 * );
 * ```
 *
 * @module reporters
 */

/**
 * Shape of a single Allure failure category entry.
 *
 * @example
 * ```typescript
 * import type { AllureSapCategory } from 'playwright-praman/reporters';
 *
 * const cat: AllureSapCategory = ALLURE_SAP_CATEGORIES[0];
 * new RegExp(cat.messageRegex); // valid RegExp
 * ```
 */
export type AllureSapCategory = (typeof ALLURE_SAP_CATEGORIES)[number];

/**
 * Allure failure categories aligned with Praman error codes.
 *
 * @remarks
 * Regex patterns match the `ERR_<CATEGORY>_*` codes emitted by
 * `src/core/errors/codes.ts` and the class names in `src/core/errors/`.
 */
export const ALLURE_SAP_CATEGORIES = [
  {
    name: 'UI5 Control Errors',
    messageRegex: '.*ERR_CONTROL.*',
    traceRegex: '.*ControlError.*',
  },
  {
    name: 'Navigation Errors',
    messageRegex: '.*ERR_NAV.*',
    traceRegex: '.*NavigationError.*',
  },
  {
    name: 'OData Errors',
    messageRegex: '.*ERR_ODATA.*',
    traceRegex: '.*ODataError.*',
  },
  {
    name: 'Authentication Errors',
    messageRegex: '.*ERR_AUTH.*',
    traceRegex: '.*AuthError.*',
  },
  {
    name: 'Bridge Communication Errors',
    messageRegex: '.*ERR_BRIDGE.*',
    traceRegex: '.*BridgeError.*',
  },
] as const;
