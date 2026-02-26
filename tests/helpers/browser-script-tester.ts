/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser script validation helper for unit tests.
 *
 * @remarks
 * Validates that generated browser scripts are syntactically correct
 * JavaScript strings. Uses Node.js `vm.Script` for zero-dependency
 * syntax checking (H3 requirement).
 *
 * @example
 * ```typescript
 * import { assertValidScript, assertScriptContains } from '../../helpers/browser-script-tester.js';
 *
 * const script = generateFindControlScript('btn1');
 * assertValidScript(script);
 * assertScriptContains(script, '__praman_bridge');
 * ```
 *
 * @module test-helpers
 */

import vm from 'node:vm';

/**
 * Asserts that a generated script string is non-empty and syntactically valid JavaScript.
 *
 * @param script - The generated script string to validate.
 * @throws Error if the script is empty or contains syntax errors.
 *
 * @example
 * ```typescript
 * assertValidScript('return document.title;');
 * ```
 */
export function assertValidScript(script: string): void {
  if (script.trim().length === 0) {
    throw new Error('Generated script is empty');
  }

  // vm.Script validates JavaScript syntax without executing
  // eslint-disable-next-line sonarjs/constructor-for-side-effects -- Intentional: syntax validation only, no execution
  new vm.Script(script);
}

/**
 * Asserts that a generated script string contains an expected substring.
 *
 * @param script - The generated script string.
 * @param substring - The expected substring.
 * @throws Error if the substring is not found in the script.
 *
 * @example
 * ```typescript
 * assertScriptContains(script, '__praman_bridge');
 * ```
 */
export function assertScriptContains(script: string, substring: string): void {
  if (!script.includes(substring)) {
    throw new Error(`Expected script to contain "${substring}" but it did not.\nScript: ${script}`);
  }
}

/**
 * Asserts that a generated script string does NOT contain a forbidden substring.
 *
 * @param script - The generated script string.
 * @param substring - The forbidden substring.
 * @throws Error if the substring is found in the script.
 *
 * @example
 * ```typescript
 * assertScriptExcludes(script, 'console.log');
 * ```
 */
export function assertScriptExcludes(script: string, substring: string): void {
  if (script.includes(substring)) {
    throw new Error(`Expected script NOT to contain "${substring}" but it did.\nScript: ${script}`);
  }
}
