/**
 * Method blacklist — prevents proxy forwarding of internal/dangerous methods.
 *
 * @remarks
 * Hybrid approach combining:
 * - wdi5 dynamic rules: `_` prefix, `Render` suffix, event methods
 * - dhikraft static set: 47 active items (field-tested in production)
 *
 * The blacklist prevents the proxy from forwarding internal UI5 methods
 * that would cause side effects, infinite loops, or expose implementation
 * details. Methods not in the blacklist are forwarded to the bridge.
 *
 * @example
 * ```typescript
 * import { isBlacklisted, filterMethods } from '#bridge/method-blacklist.js';
 *
 * if (!isBlacklisted('getText')) {
 *   // Safe to forward to bridge
 * }
 *
 * const safeMethods = filterMethods(['getText', 'constructor', 'destroy']);
 * // → ['getText']
 * ```
 *
 * @module bridge
 */

/**
 * Static set of blacklisted method names.
 *
 * @remarks
 * Sourced from dhikraft v2.5.0 constants.ts (47 active items) merged with
 * wdi5 bridge conventions. These methods are either:
 * - Internal lifecycle methods (`constructor`, `destroy`, `init`, `clone`)
 * - Event system internals (`attachEvent`, `detachEvent`, `fireEvent`)
 * - Rendering internals (`rerender`, `invalidate`, `onBeforeRendering`)
 * - Framework internals (`getMetadata`, `getInterface`, `getEventingParent`)
 * - Bridge-reserved (`$`, `getAggregation`)
 */
export const METHOD_BLACKLIST: ReadonlySet<string> = new Set([
  // ── wdi5 bridge-reserved ──────────────────────────────────────────
  '$',
  'getAggregation',
  'constructor',
  'fireEvent',
  'init',

  // ── Lifecycle methods ─────────────────────────────────────────────
  'destroy',
  'clone',
  'exit',
  'onInit',
  'onExit',
  'onBeforeShow',
  'onAfterShow',
  'onBeforeHide',
  'onAfterHide',

  // ── Rendering internals ───────────────────────────────────────────
  'rerender',
  'invalidate',
  'onBeforeRendering',
  'onAfterRendering',
  'getRenderer',
  'render',
  'placeAt',

  // ── Event system internals ────────────────────────────────────────
  'fireValidateFieldGroup',
  'attachEvent',
  'detachEvent',
  'attachBrowserEvent',
  'detachBrowserEvent',
  'attachValidateFieldGroup',
  'detachValidateFieldGroup',
  'getEventingParent',

  // ── Metadata / framework internals ────────────────────────────────
  'getMetadata',
  'getInterface',
  'getIdForLabel',
  'getAccessibilityInfo',
  'getLayoutData',
  'setLayoutData',
  'getBusy',
  'setBusy',
  'getBusyIndicatorDelay',
  'setBusyIndicatorDelay',
  'getFieldGroupIds',
  'setFieldGroupIds',
  'getTooltip',
  'setTooltip',
  'getCustomData',
  'addCustomData',
  'removeCustomData',

  // ── Binding internals ─────────────────────────────────────────────
  'bindElement',
  'unbindElement',
  'bindAggregation',
  'unbindAggregation',
  'bindProperty',
  'unbindProperty',
]);

/**
 * Checks if a method name is blacklisted (should not be forwarded to the bridge).
 *
 * @remarks
 * Uses both the static blacklist set and dynamic rules:
 * - Methods starting with `_` are internal (wdi5 convention)
 * - Methods ending with `Render` are rendering internals
 *
 * @param methodName - The method name to check.
 * @returns `true` if the method should NOT be forwarded.
 *
 * @example
 * ```typescript
 * isBlacklisted('getText');       // false — safe to forward
 * isBlacklisted('constructor');   // true — static blacklist
 * isBlacklisted('_getModel');     // true — underscore prefix rule
 * isBlacklisted('onAfterRender'); // true — Render suffix rule
 * ```
 */
export function isBlacklisted(methodName: string): boolean {
  // Static blacklist check (O(1) via Set)
  if (METHOD_BLACKLIST.has(methodName)) {
    return true;
  }

  // Dynamic rule: underscore prefix indicates internal method
  if (methodName.startsWith('_')) {
    return true;
  }

  // Dynamic rule: Render suffix indicates rendering internals
  if (methodName.endsWith('Render')) {
    return true;
  }

  return false;
}

/**
 * Filters an array of method names, removing blacklisted ones.
 *
 * @param methods - Array of method names to filter.
 * @returns New array containing only non-blacklisted methods, preserving order.
 *
 * @example
 * ```typescript
 * const safe = filterMethods(['getText', 'constructor', '_internal', 'setValue']);
 * // → ['getText', 'setValue']
 * ```
 */
export function filterMethods(methods: readonly string[]): readonly string[] {
  return methods.filter((m) => !isBlacklisted(m));
}
