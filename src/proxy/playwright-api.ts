/**
 * Playwright Locator method allowlist.
 *
 * @remarks
 * The proxy `get` trap checks this set BEFORE the bridge blacklist.
 * If a method is in this set, it is routed to the Playwright Locator
 * (DOM-level interaction) rather than the UI5 bridge.
 *
 * Equivalent to wdi5's `wdioApi.ts` allowlist.
 *
 * @example
 * ```typescript
 * import { isPlaywrightMethod } from '#proxy/playwright-api.js';
 *
 * if (isPlaywrightMethod('click')) {
 *   // Route to Playwright Locator, not UI5 bridge
 * }
 * ```
 *
 * @module proxy
 */

/**
 * Set of Playwright Locator method names.
 *
 * @remarks
 * Covers Locator interaction, query, and assertion methods from the
 * Playwright API. These should never be forwarded to the UI5 bridge.
 */
export const PLAYWRIGHT_API_METHODS: ReadonlySet<string> = new Set([
  // ── Interaction methods ─────────────────────────────────────────
  'click',
  'dblclick',
  'fill',
  'type',
  'press',
  'check',
  'uncheck',
  'selectOption',
  'setInputFiles',
  'hover',
  'focus',
  'blur',
  'tap',
  'dragTo',
  'scrollIntoViewIfNeeded',
  'dispatchEvent',
  'clear',
  'setChecked',
  'selectText',
  'pressSequentially',

  // ── Query methods ───────────────────────────────────────────────
  'textContent',
  'innerText',
  'innerHTML',
  'getAttribute',
  'inputValue',
  'boundingBox',
  'count',
  'elementHandle',
  'elementHandles',
  'evaluate',
  'evaluateAll',
  'evaluateHandle',

  // ── State methods ───────────────────────────────────────────────
  'isVisible',
  'isHidden',
  'isEnabled',
  'isDisabled',
  'isChecked',
  'isEditable',

  // ── Wait methods ────────────────────────────────────────────────
  'waitFor',

  // ── Screenshot ──────────────────────────────────────────────────
  'screenshot',

  // ── Locator chain methods ───────────────────────────────────────
  'locator',
  'getByRole',
  'getByText',
  'getByLabel',
  'getByPlaceholder',
  'getByAltText',
  'getByTitle',
  'getByTestId',
  'first',
  'last',
  'nth',
  'filter',
  'and',
  'or',
]);

/**
 * Checks if a method name belongs to the Playwright Locator API.
 *
 * @param methodName - The method name to check.
 * @returns `true` if the method should be routed to Playwright, not the bridge.
 *
 * @example
 * ```typescript
 * isPlaywrightMethod('click');    // true — route to Playwright
 * isPlaywrightMethod('getText');  // false — route to UI5 bridge
 * ```
 */
export function isPlaywrightMethod(methodName: string): boolean {
  return PLAYWRIGHT_API_METHODS.has(methodName);
}
