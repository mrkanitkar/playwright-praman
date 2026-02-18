/**
 * Playwright Locator method allowlist and interaction routing.
 *
 * @remarks
 * The proxy `get` trap checks this set BEFORE the bridge blacklist.
 * If a method is in this set and the proxy state has `page` +
 * `interactionStrategy`, the call is routed through the strategy system
 * or to a Playwright Locator (DOM-level interaction) rather than the
 * UI5 bridge.
 *
 * Equivalent to wdi5's `wdioApi.ts` allowlist.
 *
 * @example
 * ```typescript
 * import { isPlaywrightMethod, routeToInteractionStrategy } from '#proxy/playwright-api.js';
 *
 * if (isPlaywrightMethod('click')) {
 *   // Route to Playwright Locator, not UI5 bridge
 * }
 * ```
 *
 * @module proxy
 */

import type { ControlProxyState } from './dynamic-proxy.js';

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

/**
 * Playwright methods that map to InteractionStrategy.press().
 */
const PRESS_METHODS: ReadonlySet<string> = new Set(['click']);

/**
 * Playwright methods that map to InteractionStrategy.enterText().
 */
const ENTER_TEXT_METHODS: ReadonlySet<string> = new Set(['fill', 'type', 'pressSequentially']);

/**
 * Playwright methods that map to InteractionStrategy.select().
 */
const SELECT_METHODS: ReadonlySet<string> = new Set(['selectOption']);

/**
 * Escapes a UI5 control ID for use in a CSS selector.
 *
 * @remarks
 * `CSS.escape()` is browser-only. This provides a Node-safe equivalent
 * that escapes characters with special meaning in CSS selectors.
 *
 * @param id - The UI5 control ID to escape.
 * @returns The escaped string safe for use in `#id` CSS selectors.
 *
 * @example
 * ```typescript
 * cssEscapeId('__button0'); // '\\__button0'
 * cssEscapeId('view--btn'); // 'view--btn'
 * ```
 */
export function cssEscapeId(id: string): string {
  return id.replaceAll(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

/**
 * Coerces an unknown argument to a string value.
 */
function coerceToString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Routes a Playwright method call through the interaction strategy or a Locator.
 *
 * @remarks
 * Interaction verbs (click, fill, selectOption) are delegated to the strategy.
 * Query/state methods (isVisible, getAttribute, textContent) get a DOM ref from
 * the bridge, create a Playwright Locator, and call the method on it.
 *
 * @param state - The control proxy state (must have `page` and `interactionStrategy`).
 * @param methodName - The Playwright method name.
 * @param args - Arguments to pass to the method.
 * @returns The result of the routed method call.
 *
 * @example
 * ```typescript
 * await routeToInteractionStrategy(state, 'click', []);
 * await routeToInteractionStrategy(state, 'fill', ['Hello']);
 * const visible = await routeToInteractionStrategy(state, 'isVisible', []);
 * ```
 */
export async function routeToInteractionStrategy(
  state: ControlProxyState,
  methodName: string,
  args: readonly unknown[],
): Promise<unknown> {
  const { page, interactionStrategy: strategy } = state;

  if (page === undefined || strategy === undefined) {
    return undefined;
  }

  // Strategy-routed interaction verbs
  if (PRESS_METHODS.has(methodName)) {
    return strategy.press(page, state.id);
  }

  if (ENTER_TEXT_METHODS.has(methodName)) {
    const text = coerceToString(args[0]);
    return strategy.enterText(page, state.id, text);
  }

  if (SELECT_METHODS.has(methodName)) {
    const itemId = coerceToString(args[0]);
    return strategy.select(page, state.id, itemId);
  }

  // Fallback: route to Playwright Locator via DOM ref
  return routeToLocator(state, methodName, args);
}

/** Interface for Page objects that support CSS locator creation. */
interface LocatorPage {
  locator(selector: string): Record<string, (...locatorArgs: unknown[]) => unknown>;
}

/**
 * Gets a Playwright Locator for the control's DOM element and calls the method.
 */
function routeToLocator(
  state: ControlProxyState,
  methodName: string,
  args: readonly unknown[],
): unknown {
  const { page } = state;
  if (page === undefined) return undefined;

  const escapedId = cssEscapeId(state.id);
  const pageWithLocator = page as unknown as LocatorPage;
  const locator = pageWithLocator.locator(`#${escapedId}`);
  const method: unknown = Reflect.get(locator, methodName);

  if (typeof method === 'function') {
    return (method as (...locatorArgs: unknown[]) => unknown).call(locator, ...args);
  }

  return undefined;
}
