/**
 * Wrapper around Playwright's `test.step()` for structured step reporting.
 *
 * @remarks
 * Gracefully degrades when called outside a Playwright test context
 * (e.g., standalone scripts, Vitest unit tests). In that case, `withStep`
 * executes the function directly without step wrapping.
 *
 * Errors from `fn` are always propagated — step marks itself as failed.
 *
 * Also provides `ACTION_MAP`, `formatSelectorForStep()`, and `generateStepName()`
 * for generating human-readable step names from handler method calls.
 *
 * @example
 * ```typescript
 * import { withStep, createStepName } from '#core/utils/step-decorator.js';
 *
 * const result = await withStep(
 *   createStepName('selector', 'parse', 'ui5=sap.m.Button'),
 *   async () => parseSelector('ui5=sap.m.Button'),
 * );
 * ```
 *
 * @module utils
 */
import { test } from '@playwright/test';

/**
 * Detects whether code is running inside a Playwright test context.
 *
 * @remarks
 * Uses `test.info()` to probe for active test context. Returns `false`
 * during globalSetup, globalTeardown, Vitest unit tests, or standalone scripts.
 * Safe to call in any context — never throws.
 *
 * @returns `true` if inside a Playwright test, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (isInsideTestContext()) {
 *   // Safe to use test.step()
 * }
 * ```
 */
export function isInsideTestContext(): boolean {
  try {
    test.info();
    return true;
  } catch {
    return false;
  }
}

/**
 * TC39 Stage 3 method decorator that wraps class methods with `test.step()`.
 *
 * @remarks
 * Each call to the decorated method appears as a semantic step in:
 * - Playwright trace viewer
 * - HTML reports
 * - Browser snapshots
 *
 * Uses `{ box: true }` for nested step hierarchies. Safely degrades
 * outside test context (globalSetup, Vitest, standalone scripts).
 *
 * TypeScript 5.0+ supports TC39 Stage 3 decorators natively when
 * `experimentalDecorators` is NOT set in tsconfig (which is our case).
 *
 * @example
 * ```typescript
 * class UI5Handler {
 *   @ui5Step
 *   async click(selector: UI5Selector): Promise<void> {
 *     // method body
 *   }
 * }
 * ```
 */
export function ui5Step<
  TThis extends object,
  TArgs extends unknown[],
  TReturn extends Promise<unknown>,
>(
  target: (this: TThis, ...args: TArgs) => TReturn,
  context: ClassMethodDecoratorContext<TThis, (this: TThis, ...args: TArgs) => TReturn>,
): (this: TThis, ...args: TArgs) => TReturn {
  const methodName = typeof context.name === 'symbol' ? context.name.toString() : context.name;

  function replacementMethod(this: TThis, ...args: TArgs): TReturn {
    const className = this.constructor.name;

    if (!isInsideTestContext()) {
      return target.call(this, ...args);
    }

    const stepName = generateStepName(className, methodName, args);

    return test.step(stepName, async () => target.call(this, ...args), { box: true }) as TReturn;
  }

  return replacementMethod;
}

/**
 * Wraps `fn` in a Playwright `test.step()` for structured trace/report output.
 *
 * @remarks
 * If called outside a Playwright test context, executes `fn` directly (no-op wrapper).
 * Errors from `fn` are propagated — the step marks itself as failed.
 *
 * @param stepName - Human-readable step name (shown in Playwright trace/report).
 * @param fn - Async function to execute inside the step.
 * @returns The return value of `fn`.
 *
 * @example
 * ```typescript
 * const value = await withStep('Find save button', async () => {
 *   return page.locator('#save');
 * });
 * ```
 */
export async function withStep<T>(stepName: string, fn: () => Promise<T>): Promise<T> {
  if (!isInsideTestContext()) {
    return fn();
  }
  return test.step(stepName, fn, { box: true });
}

/**
 * Builds a standardized step name: "module \&gt; action: target".
 *
 * @param module - Module name (e.g., 'selector', 'bridge').
 * @param action - Action name (e.g., 'parse', 'findControl').
 * @param target - Optional target description (e.g., selector string).
 * @returns Formatted step name string.
 *
 * @example
 * ```typescript
 * createStepName('selector', 'parse', 'ui5=sap.m.Button#save');
 * // 'selector > parse: ui5=sap.m.Button#save'
 *
 * createStepName('config', 'load');
 * // 'config > load'
 * ```
 */
export function createStepName(module: string, action: string, target?: string): string {
  const base = `${module} > ${action}`;

  if (target !== undefined && target !== '') {
    return `${base}: ${target}`;
  }

  return base;
}

/**
 * Maps handler method names to human-readable action verbs for step display.
 *
 * @remarks
 * Covers all public async methods across the five handler classes:
 * UI5Handler (14), ShellHandler (3), FooterHandler (6),
 * AgenticHandler (3), and SAPAuthHandler (4).
 *
 * @example
 * ```typescript
 * import { ACTION_MAP } from '#core/utils/step-decorator.js';
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
} as const satisfies Record<string, string>;

/**
 * Formats a value for display in a selector key-value pair.
 *
 * @param value - The value to format.
 * @param visited - WeakSet tracking visited objects to prevent circular references.
 * @returns Formatted string representation.
 */
function formatValue(value: unknown, visited: WeakSet<object>): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (value instanceof RegExp) {
    return `/${value.source}/${value.flags}`;
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'symbol') {
    return value.toString();
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (typeof value !== 'object') {
    return '[unknown]';
  }

  // Circular reference guard
  if (visited.has(value)) {
    return '[Circular]';
  }

  if (Array.isArray(value)) {
    visited.add(value);
    const items = value.map((item: unknown) => formatValue(item, visited));
    return `[${items.join(', ')}]`;
  }

  visited.add(value);
  // Type assertion: value passed array/primitive checks above — must be a plain object at this point
  const record = value as Record<string, unknown>;
  const entries = Object.entries(record);
  const parts = entries.slice(0, 3).map(([key, val]) => `${key}: ${formatValue(val, visited)}`);
  return `{ ${parts.join(', ')} }`;
}

/**
 * Extracts priority key-value pairs from a selector-like record.
 *
 * @param record - The record to extract priority keys from.
 * @param visited - WeakSet tracking visited objects for circular reference safety.
 * @returns Array of formatted `key: value` strings for priority keys found.
 */
function extractPriorityParts(record: Record<string, unknown>, visited: WeakSet<object>): string[] {
  const parts: string[] = [];

  if ('id' in record) {
    parts.push(`id: ${formatValue(record['id'], visited)}`);
  }

  if ('controlType' in record && typeof record['controlType'] === 'string') {
    const controlType = record['controlType'];
    const shortType = controlType.split('.').pop() ?? controlType;
    parts.push(`type: "${shortType}"`);
  }

  if (
    'properties' in record &&
    typeof record['properties'] === 'object' &&
    record['properties'] !== null
  ) {
    // Type assertion: typeof guard above confirms record['properties'] is a non-null object
    const properties = record['properties'] as Record<string, unknown>;
    if ('text' in properties) {
      parts.push(`text: ${formatValue(properties['text'], visited)}`);
    }
    if ('name' in properties) {
      parts.push(`name: ${formatValue(properties['name'], visited)}`);
    }
  }

  return parts;
}

/**
 * Formats a selector record object into a human-readable `{ key: value }` string.
 *
 * @param record - The record to format.
 * @param visited - WeakSet tracking visited objects for circular reference safety.
 * @returns Formatted string representation.
 */
function formatSelectorRecord(record: Record<string, unknown>, visited: WeakSet<object>): string {
  const parts = extractPriorityParts(record, visited);

  // If no priority keys found, fall back to first 3 entries
  if (parts.length === 0) {
    const entries = Object.entries(record);
    if (entries.length === 0) {
      return '{}';
    }
    for (const [key, val] of entries.slice(0, 3)) {
      parts.push(`${key}: ${formatValue(val, visited)}`);
    }
  }

  return `{ ${parts.join(', ')} }`;
}

/**
 * Formats a UI5 selector into a human-readable string for step display.
 *
 * @remarks
 * Prioritizes: `id`, `controlType` (shortened), `properties.text`, `properties.name`.
 * Falls back to first 3 keys for non-standard objects.
 * Handles circular references safely via a WeakSet guard.
 *
 * @param selector - Any value (typically UI5Selector or string).
 * @returns Human-readable string, e.g. `'{ id: "save", type: "Button" }'`.
 *
 * @example
 * ```typescript
 * import { formatSelectorForStep } from '#core/utils/step-decorator.js';
 *
 * formatSelectorForStep({ controlType: 'sap.m.Button', id: 'save' });
 * // '{ id: "save", type: "Button" }'
 *
 * formatSelectorForStep(null);
 * // ''
 * ```
 */
export function formatSelectorForStep(selector: unknown): string {
  if (selector === null || selector === undefined) {
    return '';
  }

  if (typeof selector === 'string') {
    return `"${selector}"`;
  }

  if (
    typeof selector === 'number' ||
    typeof selector === 'boolean' ||
    typeof selector === 'bigint'
  ) {
    return String(selector);
  }

  if (typeof selector !== 'object') {
    return '[unknown]';
  }

  const visited = new WeakSet();
  visited.add(selector);

  // Type assertion: UI5Selector is a branded string | object; non-string case is always a record
  return formatSelectorRecord(selector as Record<string, unknown>, visited);
}

/**
 * Converts a camelCase method name to a human-readable form with spaces.
 *
 * @param methodName - The camelCase method name to convert.
 * @returns PascalCase with spaces, e.g. `'customMethodName'` becomes `'Custom method name'`.
 */
function camelCaseToReadable(methodName: string): string {
  if (methodName === '') {
    return '';
  }

  // Insert space before each uppercase letter, then capitalize first letter
  const spaced = methodName.replaceAll(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/**
 * Generates a human-readable step name from class name, method name, and arguments.
 *
 * @remarks
 * Uses {@link ACTION_MAP} to translate method names to human-readable actions.
 * For methods not in the map, converts camelCase to PascalCase with spaces.
 * Formats the first argument (typically a selector) via {@link formatSelectorForStep}.
 *
 * @param className - Handler class name (e.g., `'UI5Handler'`).
 * @param methodName - Method name (e.g., `'click'`).
 * @param args - Method arguments (first arg formatted as selector).
 * @returns Human-readable step name, e.g. `'Click { id: "save" }'`.
 *
 * @example
 * ```typescript
 * import { generateStepName } from '#core/utils/step-decorator.js';
 *
 * generateStepName('UI5Handler', 'click', [{ id: 'saveBtn' }]);
 * // 'Click { id: "saveBtn" }'
 *
 * generateStepName('SAPAuthHandler', 'login', []);
 * // 'Login'
 * ```
 */
export function generateStepName(
  _className: string,
  methodName: string,
  args: readonly unknown[],
): string {
  // Look up the human-readable action verb from the map
  const actionMap: Readonly<Record<string, string>> = ACTION_MAP;
  const mappedVerb = Object.prototype.hasOwnProperty.call(actionMap, methodName)
    ? actionMap[methodName as keyof typeof ACTION_MAP]
    : undefined;
  const actionVerb = mappedVerb ?? camelCaseToReadable(methodName);

  // Format the first argument as a selector (if present)
  const firstArg = args.length > 0 ? args[0] : undefined;
  const selectorPart = firstArg !== undefined ? formatSelectorForStep(firstArg) : '';

  if (selectorPart !== '') {
    return `${actionVerb} ${selectorPart}`;
  }

  return actionVerb;
}
