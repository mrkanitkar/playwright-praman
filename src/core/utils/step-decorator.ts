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
  // Try to use Playwright's test.step() if available
  try {
    // Dynamic import to avoid hard dependency on @playwright/test
    const { test } = await import('@playwright/test');
    return await test.step(stepName, fn);
  } catch {
    // Outside Playwright test context — execute directly
    return fn();
  }
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
