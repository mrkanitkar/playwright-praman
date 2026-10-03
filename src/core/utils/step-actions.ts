/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Praman step action verbs and the title heuristic derived from them.
 *
 * @remarks
 * Split out of `step-decorator.ts` for one reason: the compliance reporter needs
 * this data, and `step-decorator.ts` imports `test` from `@playwright/test`.
 * Importing that into a reporter would pull the whole test runtime into the
 * reporter process. This module imports nothing.
 *
 * It exists because the two halves drifted. The reporter kept its own
 * hand-maintained copy of the verb list, and 10 verbs were never added — every
 * `flpSettings.*` call, every `testData.*` call and `Inspect control` were
 * therefore counted as raw-Playwright compliance violations that did not exist.
 * Deriving the prefixes from {@link ACTION_MAP} makes that drift impossible.
 *
 * On Playwright 1.63+ this heuristic is only the fallback: steps carry a
 * structural `{ praman: true }` marker in `TestStep.params` instead.
 *
 * @module utils
 */

/**
 * Maps handler method names to human-readable action verbs for step display.
 *
 * @remarks
 * Covers all public async methods across the handler classes: UI5Handler,
 * ShellHandler, FooterHandler, AgenticHandler, FLPSettingsHandler,
 * SAPAuthHandler and TestDataHandler.
 *
 * @example
 * ```typescript
 * import { ACTION_MAP } from '#core/utils/step-actions.js';
 *
 * const verb = ACTION_MAP['click']; // 'Click'
 * const wait = ACTION_MAP['waitForUI5']; // 'Wait for UI5'
 * ```
 */
export const ACTION_MAP = {
  // UI5Handler
  click: 'Click',
  fill: 'Fill',
  press: 'Press',
  select: 'Select',
  check: 'Check',
  uncheck: 'Uncheck',
  clear: 'Clear',
  getText: 'Get text',
  getValue: 'Get value',
  control: 'Find control',
  controls: 'Find controls',
  waitForUI5: 'Wait for UI5',
  waitFor: 'Wait for control',
  inspect: 'Inspect control',
  destroy: 'Destroy handler',

  // ShellHandler
  expectShellHeader: 'Verify shell header',
  clickHome: 'Click home',
  openUserMenu: 'Open user menu',

  // FooterHandler
  clickSave: 'Click Save',
  clickApply: 'Click Apply',
  clickCancel: 'Click Cancel',
  clickEdit: 'Click Edit',
  clickDelete: 'Click Delete',
  clickCreate: 'Click Create',

  // AgenticHandler
  generateTest: 'Generate test',
  interpretStep: 'Interpret step',
  suggestActions: 'Suggest actions',

  // FLPSettingsHandler
  getLanguage: 'Get language',
  getDateFormat: 'Get date format',
  getTimeFormat: 'Get time format',
  getTimezone: 'Get timezone',
  getNumberFormat: 'Get number format',
  getAllSettings: 'Get all settings',

  // SAPAuthHandler
  login: 'Login',
  loginFromEnv: 'Login from env',
  logout: 'Logout',
  isAuthenticated: 'Check authentication',

  // TestDataHandler
  save: 'Save test data',
  load: 'Load test data',
  cleanup: 'Cleanup test data',
} as const satisfies Record<string, string>;

/**
 * Prefixes deliberately shorter than any {@link ACTION_MAP} verb.
 *
 * @remarks
 * Matching is `startsWith`, so these intentionally cover families of titles
 * (`'Wait for'` covers both `'Wait for UI5'` and `'Wait for control'`, and any
 * future `Wait for …`). Kept explicit because they cannot be derived, and
 * removing them would narrow long-standing behaviour.
 *
 * @example
 * ```typescript
 * import { BROAD_STEP_PREFIXES } from '#core/utils/step-actions.js';
 *
 * BROAD_STEP_PREFIXES.includes('Wait for'); // true
 * ```
 */
export const BROAD_STEP_PREFIXES: readonly string[] = ['Wait for', 'Destroy'] as const;

/**
 * Every title prefix that marks a step as Praman-produced.
 *
 * @remarks
 * Derived from {@link ACTION_MAP} rather than hand-maintained, so a new handler
 * method is classified the moment its verb is registered.
 *
 * @example
 * ```typescript
 * import { PRAMAN_STEP_PREFIXES } from '#core/utils/step-actions.js';
 *
 * PRAMAN_STEP_PREFIXES.includes('Get all settings'); // true
 * ```
 */
export const PRAMAN_STEP_PREFIXES: readonly string[] = [
  ...new Set<string>([...Object.values(ACTION_MAP), ...BROAD_STEP_PREFIXES]),
];

/**
 * Matches the `namespace.method` titles produced by `withStep` call sites.
 *
 * @remarks
 * `nav-fixtures.ts` emits `'ui5Navigation.navigateToApp: myApp'`, and the
 * generic proxy at `module-fixtures.ts` joins a step prefix to the method name
 * with a dot, where that prefix is either `'ui5'` or `'ui5.'` plus the module
 * namespace. The trailing dot is required so a prose title such as
 * `'ui5 is great'` is not swept in.
 *
 * @example
 * ```typescript
 * import { WITH_STEP_NAMESPACE_PATTERN } from '#core/utils/step-actions.js';
 *
 * WITH_STEP_NAMESPACE_PATTERN.test('ui5.table.getRows'); // true
 * WITH_STEP_NAMESPACE_PATTERN.test('ui5 is great'); // false
 * ```
 */
export const WITH_STEP_NAMESPACE_PATTERN = /^ui5[A-Za-z]*\./u;

/**
 * Classifies a step title as Praman-produced, by title alone.
 *
 * @remarks
 * The fallback for Playwright 1.57-1.62, where `TestStep.params` does not
 * exist. Three signals, in the order they actually occur in the wild:
 * the `withStep` namespace convention, an {@link ACTION_MAP} verb prefix, and
 * the `' > '` form that {@link createStepName} produces.
 *
 * Being title-based it cannot be exact — a user step named
 * `'Login to the supplier portal'` still matches. That ambiguity is precisely
 * what the 1.63 structural marker removes.
 *
 * @param title - The step title to classify.
 * @returns `true` when the title looks Praman-produced.
 *
 * @example
 * ```typescript
 * import { matchesPramanStepTitle } from '#core/utils/step-actions.js';
 *
 * matchesPramanStepTitle('ui5.table.getRows'); // true
 * matchesPramanStepTitle('Get all settings'); // true
 * matchesPramanStepTitle('page.click'); // false
 * ```
 */
export function matchesPramanStepTitle(title: string): boolean {
  if (WITH_STEP_NAMESPACE_PATTERN.test(title)) {
    return true;
  }
  if (title.includes(' > ')) {
    return true;
  }
  return PRAMAN_STEP_PREFIXES.some((prefix) => title.startsWith(prefix));
}
