/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Verify a generated `.spec.ts` file against Praman gold-standard rules.
 *
 * @remarks
 * Runs a series of static checks on the file content to ensure compliance
 * with the 7 mandatory rules for SAP test generation. Intended for use
 * by agents as a post-generation validation step.
 *
 * @example
 * ```bash
 * npx playwright-praman verify-spec tests/e2e/my-app.spec.ts
 * ```
 *
 * @module cli/verify-spec-command
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

import { logError, logSection, logSuccess } from './logger.js';

/**
 * Result of a single verification check.
 *
 * @example
 * ```typescript
 * const result: CheckResult = { pass: true, message: 'Imports are correct' };
 * ```
 */
export interface CheckResult {
  readonly pass: boolean;
  readonly message: string;
}

/**
 * Checks that the spec imports from `'playwright-praman'`.
 *
 * @param content - File content to check.
 * @returns Check result.
 *
 * @example
 * ```typescript
 * checkImports("import { test } from 'playwright-praman';");
 * // { pass: true, message: 'Imports from playwright-praman' }
 * ```
 */
export function checkImports(content: string): CheckResult {
  const pass = /from\s+['"]playwright-praman['"]/.test(content);
  return {
    pass,
    message: pass
      ? 'Imports from playwright-praman'
      : 'Missing import from playwright-praman (must use playwright-praman, not @playwright/test)',
  };
}

/**
 * Checks for the `IDS` constant pattern.
 *
 * @param content - File content to check.
 * @returns Check result.
 *
 * @example
 * ```typescript
 * checkIdsPattern("const IDS = { saveButton: '...' };");
 * // { pass: true, message: 'Has IDS constant' }
 * ```
 */
export function checkIdsPattern(content: string): CheckResult {
  const pass = /const\s+IDS\s*=\s*\{/.test(content);
  return {
    pass,
    message: pass ? 'Has IDS constant' : 'Missing IDS constant (expected: const IDS = { ... })',
  };
}

/**
 * Checks for `test.step()` calls.
 *
 * @param content - File content to check.
 * @returns Check result.
 *
 * @example
 * ```typescript
 * checkTestSteps("await test.step('Navigate', async () => { ... });");
 * // { pass: true, message: 'Uses test.step() pattern' }
 * ```
 */
export function checkTestSteps(content: string): CheckResult {
  const pass = /test\.step\s*\(/.test(content);
  return {
    pass,
    message: pass
      ? 'Uses test.step() pattern'
      : 'Missing test.step() calls (all actions should be wrapped in test.step)',
  };
}

/**
 * Checks that banned patterns are not present.
 *
 * @param content - File content to check.
 * @returns Check result — fails if `page.waitForTimeout()` or `page.click('#__` is found.
 *
 * @example
 * ```typescript
 * checkBannedPatterns("await page.click('#myButton');");
 * // { pass: true, message: 'No banned patterns found' }
 * ```
 */
export function checkBannedPatterns(content: string): CheckResult {
  const hasWaitForTimeout = /page\.waitForTimeout\s*\(/.test(content);
  const hasRawUi5Click = /page\.click\s*\(\s*['"]#__/.test(content);
  const issues: string[] = [];
  if (hasWaitForTimeout) issues.push('page.waitForTimeout() is banned');
  if (hasRawUi5Click) issues.push("page.click('#__...') uses raw UI5 IDs — use Praman fixtures");
  const pass = issues.length === 0;
  return {
    pass,
    message: pass ? 'No banned patterns found' : issues.join('; '),
  };
}

/**
 * Checks for a TSDoc header with status/marker/version tags.
 *
 * @param content - File content to check.
 * @returns Check result.
 *
 * @example
 * ```typescript
 * const result = checkTsDocHeader(content);
 * // result.pass is true when content has a TSDoc block with @status tag
 * ```
 */
export function checkTsDocHeader(content: string): CheckResult {
  // eslint-disable-next-line sonarjs/super-linear-regex -- bounded input (file content); anchored match with `m` flag
  const pass = /^\/\*\*\s*\n[^@]*@(status|marker|version)/m.test(content);
  return {
    pass,
    message: pass
      ? 'Has TSDoc header'
      : 'Missing TSDoc header (expected block comment with @status, @marker, or @version)',
  };
}

/**
 * Runs ESLint on the file and returns the result.
 *
 * @param filePath - Absolute or relative path to the spec file.
 * @returns Check result — passes if ESLint exits with code 0.
 *
 * @example
 * ```typescript
 * runEslintCheck('tests/e2e/my-app.spec.ts');
 * // { pass: true, message: 'ESLint clean' }
 * ```
 */
function runEslintCheck(filePath: string): CheckResult {
  try {
    execSync(`npx eslint --no-warn-ignored ${filePath}`, {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { pass: true, message: 'ESLint clean' };
  } catch {
    return { pass: false, message: 'ESLint reported errors (run npx eslint on file for details)' };
  }
}

/**
 * Runs all verification checks on a spec file and prints results.
 *
 * @param filePath - Path to the `.spec.ts` file to verify.
 *
 * @example
 * ```typescript
 * runVerifySpec('tests/e2e/sap-cloud/bom-e2e-praman-gold-standard.spec.ts');
 * ```
 */
export function runVerifySpec(filePath: string): void {
  logSection('Verify Spec: ' + filePath);

  let content: string;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CLI input path validated by commander
    content = readFileSync(filePath, 'utf8');
  } catch {
    logError('File not found or not readable: ' + filePath);
    process.exitCode = 1;
    return;
  }

  const checks: readonly CheckResult[] = [
    checkImports(content),
    checkIdsPattern(content),
    checkTestSteps(content),
    checkBannedPatterns(content),
    checkTsDocHeader(content),
    runEslintCheck(filePath),
  ];

  let allPassed = true;
  for (const check of checks) {
    if (check.pass) {
      logSuccess(check.message);
    } else {
      logError(check.message);
      allPassed = false;
    }
  }

  if (!allPassed) {
    process.exitCode = 1;
  }
}
