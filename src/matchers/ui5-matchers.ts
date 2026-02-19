/**
 * Custom matcher functions for UI5 control assertions.
 *
 * @remarks
 * These are raw matcher logic functions that compare actual UI5 control
 * property values against expected values. They are NOT Playwright
 * `expect.extend()` registrations — that integration step is done in fixtures.
 *
 * Each function calls `page.evaluate()` with browser scripts to retrieve
 * control properties, compares the result, and returns a {@link MatcherResult}
 * with a descriptive message for both pass and fail cases.
 *
 * @example
 * ```typescript
 * import { checkUI5Text } from './ui5-matchers.js';
 * import type { Page } from '@playwright/test';
 *
 * const result = await checkUI5Text(page, 'btn1', 'Save');
 * if (!result.pass) {
 *   console.log(result.message());
 * }
 * ```
 *
 * @module matchers
 */

import type { Page } from '@playwright/test';

import { getControlProperty, getUI5BindingInfo, getUI5ControlType } from './matcher-utils.js';
import type { MatcherPage } from './matcher-utils.js';

/**
 * Result of a matcher check.
 *
 * @example
 * ```typescript
 * const result: MatcherResult = {
 *   pass: true,
 *   message: () => 'Expected text to match',
 *   actual: 'Save',
 *   expected: 'Save',
 * };
 * ```
 */
export interface MatcherResult {
  readonly pass: boolean;
  readonly message: () => string;
  readonly actual?: unknown;
  readonly expected?: unknown;
}

/**
 * Options for matcher functions.
 *
 * @example
 * ```typescript
 * const options: MatcherOptions = { timeout: 5000 };
 * ```
 */
export interface MatcherOptions {
  readonly timeout?: number;
}

/**
 * Checks that a UI5 control's `text` property matches the expected value.
 *
 * @remarks
 * Supports both exact string comparison and RegExp pattern matching.
 * Uses `page.evaluate()` with bridge scripts to retrieve the property value.
 *
 * @param page - The Playwright page to query the control on.
 * @param controlId - The ID of the UI5 control.
 * @param expected - The expected text value (string for exact match, RegExp for pattern).
 * @returns A {@link MatcherResult} indicating pass/fail with a descriptive message.
 *
 * @example
 * ```typescript
 * const result = await checkUI5Text(page, 'btn1', 'Save');
 * // or with RegExp:
 * const regexResult = await checkUI5Text(page, 'btn1', /Save/);
 * ```
 */
export async function checkUI5Text(
  page: Page,
  controlId: string,
  expected: string | RegExp,
): Promise<MatcherResult> {
  const actual = await getControlProperty(page, controlId, 'text');
  const actualString = String(actual);

  const pass = expected instanceof RegExp ? expected.test(actualString) : actualString === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected control '${controlId}' text not to match '${String(expected)}', but got '${actualString}'`
        : `Expected control '${controlId}' text to match '${String(expected)}', but got '${actualString}'`,
    actual: actualString,
    expected,
  };
}

/**
 * Checks that a UI5 control is visible.
 *
 * @remarks
 * Reads the `visible` property via `page.evaluate()` with bridge scripts.
 * A control is considered visible only when the property is strictly `true`.
 *
 * @param page - The Playwright page to query the control on.
 * @param controlId - The ID of the UI5 control.
 * @returns A {@link MatcherResult} indicating whether the control is visible.
 *
 * @example
 * ```typescript
 * const result = await checkUI5Visible(page, 'panel1');
 * expect(result.pass).toBe(true);
 * ```
 */
export async function checkUI5Visible(page: Page, controlId: string): Promise<MatcherResult> {
  const actual = await getControlProperty(page, controlId, 'visible');
  const pass = actual === true;

  return {
    pass,
    message: () =>
      pass
        ? `Expected control '${controlId}' not to be visible, but it was`
        : `Expected control '${controlId}' to be visible, but it was not`,
    actual,
    expected: true,
  };
}

/**
 * Checks that a UI5 control is enabled.
 *
 * @remarks
 * Reads the `enabled` property via `page.evaluate()` with bridge scripts.
 * A control is considered enabled only when the property is strictly `true`.
 *
 * @param page - The Playwright page to query the control on.
 * @param controlId - The ID of the UI5 control.
 * @returns A {@link MatcherResult} indicating whether the control is enabled.
 *
 * @example
 * ```typescript
 * const result = await checkUI5Enabled(page, 'btn1');
 * expect(result.pass).toBe(true);
 * ```
 */
export async function checkUI5Enabled(page: Page, controlId: string): Promise<MatcherResult> {
  const actual = await getControlProperty(page, controlId, 'enabled');
  const pass = actual === true;

  return {
    pass,
    message: () =>
      pass
        ? `Expected control '${controlId}' not to be enabled, but it was`
        : `Expected control '${controlId}' to be enabled, but it was not`,
    actual,
    expected: true,
  };
}

/**
 * Checks that a UI5 control property matches the expected value.
 *
 * @remarks
 * Uses strict equality (`===`) for primitive values and `JSON.stringify`
 * comparison for objects. The message includes the property name, actual
 * value, and expected value for debugging.
 *
 * @param page - The Playwright page to query the control on.
 * @param controlId - The ID of the UI5 control.
 * @param propertyName - The name of the property to check.
 * @param expected - The expected property value.
 * @returns A {@link MatcherResult} indicating pass/fail with property details.
 *
 * @example
 * ```typescript
 * const result = await checkUI5Property(page, 'input1', 'value', 'Hello');
 * ```
 */
export async function checkUI5Property(
  page: Page,
  controlId: string,
  propertyName: string,
  expected: unknown,
): Promise<MatcherResult> {
  const actual = await getControlProperty(page, controlId, propertyName);

  const pass = isDeepEqual(actual, expected);

  return {
    pass,
    message: () =>
      pass
        ? `Expected control '${controlId}' property '${propertyName}' not to equal ${JSON.stringify(expected)}, but it did`
        : `Expected control '${controlId}' property '${propertyName}' to equal ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`,
    actual,
    expected,
  };
}

/**
 * Checks that a UI5 control's `valueState` property matches the expected state.
 *
 * @remarks
 * Common value states in UI5: `'None'`, `'Error'`, `'Warning'`, `'Success'`, `'Information'`.
 * Uses exact string comparison.
 *
 * @param page - The Playwright page to query the control on.
 * @param controlId - The ID of the UI5 control.
 * @param expected - The expected value state string.
 * @returns A {@link MatcherResult} indicating pass/fail with state details.
 *
 * @example
 * ```typescript
 * const result = await checkUI5ValueState(page, 'input1', 'Error');
 * ```
 */
export async function checkUI5ValueState(
  page: Page,
  controlId: string,
  expected: string,
): Promise<MatcherResult> {
  const actual = await getControlProperty(page, controlId, 'valueState');
  const actualString = String(actual);
  const pass = actualString === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected control '${controlId}' valueState not to be '${expected}', but it was`
        : `Expected control '${controlId}' valueState to be '${expected}', but got '${actualString}'`,
    actual: actualString,
    expected,
  };
}

/**
 * Checks that a UI5 control has a binding on a specified property.
 *
 * @remarks
 * Uses {@link getUI5BindingInfo} to retrieve the binding information.
 * Optionally verifies that the binding path matches an expected value.
 *
 * @param page - The Playwright page to query the control on.
 * @param controlId - The ID of the UI5 control.
 * @param propertyName - The property to check binding for.
 * @param expectedPath - Optional expected binding path.
 * @returns A {@link MatcherResult} indicating pass/fail.
 *
 * @example
 * ```typescript
 * const result = await checkUI5Binding(page, 'input1', 'value');
 * const pathResult = await checkUI5Binding(page, 'input1', 'value', '/ProductName');
 * ```
 */
export async function checkUI5Binding(
  page: Page,
  controlId: string,
  propertyName: string,
  expectedPath?: string,
): Promise<MatcherResult> {
  const info = await getUI5BindingInfo(page as MatcherPage, controlId, propertyName);

  if (info === null) {
    return {
      pass: false,
      message: () =>
        `Expected control '${controlId}' to have a binding on property '${propertyName}', but no binding found`,
      actual: null,
      expected: expectedPath ?? 'any binding',
    };
  }

  if (expectedPath !== undefined && info.path !== expectedPath) {
    return {
      pass: false,
      message: () =>
        `Expected control '${controlId}' binding path to be '${expectedPath}', but got '${info.path}'`,
      actual: info.path,
      expected: expectedPath,
    };
  }

  return {
    pass: true,
    message: () =>
      expectedPath !== undefined
        ? `Expected control '${controlId}' binding path not to be '${expectedPath}', but it was`
        : `Expected control '${controlId}' not to have a binding on property '${propertyName}', but it does`,
    actual: info.path,
    expected: expectedPath ?? 'any binding',
  };
}

/**
 * Checks that a UI5 control is of the expected type.
 *
 * @remarks
 * Uses {@link getUI5ControlType} to retrieve the fully qualified control
 * type string (e.g., `'sap.m.Button'`) and compares it to the expected value.
 *
 * @param page - The Playwright page to query the control on.
 * @param controlId - The ID of the UI5 control.
 * @param expected - The expected fully qualified control type string.
 * @returns A {@link MatcherResult} indicating pass/fail.
 *
 * @example
 * ```typescript
 * const result = await checkUI5ControlType(page, 'btn1', 'sap.m.Button');
 * expect(result.pass).toBe(true);
 * ```
 */
export async function checkUI5ControlType(
  page: Page,
  controlId: string,
  expected: string,
): Promise<MatcherResult> {
  const actual = await getUI5ControlType(page as MatcherPage, controlId);

  if (actual === null) {
    return {
      pass: false,
      message: () =>
        `Expected control '${controlId}' to be of type '${expected}', but control was not found`,
      actual: null,
      expected,
    };
  }

  const pass = actual === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected control '${controlId}' not to be of type '${expected}', but it was`
        : `Expected control '${controlId}' to be of type '${expected}', but got '${actual}'`,
    actual,
    expected,
  };
}

/**
 * Deep equality check for primitive and object values.
 *
 * @param actual - The actual value.
 * @param expected - The expected value.
 * @returns `true` if values are deeply equal.
 */
function isDeepEqual(actual: unknown, expected: unknown): boolean {
  if (actual === expected) {
    return true;
  }

  // For non-primitive types, compare via JSON serialization
  if (typeof actual === 'object' && typeof expected === 'object') {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }

  return false;
}
