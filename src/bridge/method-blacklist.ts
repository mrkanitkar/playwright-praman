/**
 * Method blacklist — prevents proxy forwarding of internal/dangerous methods.
 *
 * @remarks
 * Hybrid approach combining:
 * - wdi5 dynamic rules: `_` prefix, `Render` suffix, event methods
 * - dhikraft static set: field-tested production blacklist
 * - Praman additions: aggregation, association, delegate, and state methods
 *
 * The blacklist prevents the proxy from forwarding internal UI5 methods
 * that would cause side effects, infinite loops, or expose implementation
 * details. Methods not in the blacklist are forwarded to the bridge.
 *
 * Total: 71 explicit items + 2 dynamic rules (`_` prefix, `Render` suffix).
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
 * // → ['getText', 'destroy']
 * ```
 *
 * @module bridge
 */

/**
 * Static set of blacklisted method names.
 *
 * @remarks
 * Merged from dhikraft v2.5.0 production blacklist and wdi5 bridge conventions.
 * Categories:
 * - Bridge-reserved: `$`, `getAggregation`, `constructor`, `fireEvent`, `init`
 * - Lifecycle: `clone`, `exit`, `onInit`, `onExit`, show/hide hooks, `applySettings`
 * - Rendering internals: `rerender`, `invalidate`, `onBefore/AfterRendering`, etc.
 * - Event system: `attach/detachEvent`, `attach/detachBrowserEvent`, field group events
 * - Aggregation manipulation: `set/add/remove/insert/destroy/validateAggregation`, etc.
 * - Association methods: `get/set/add/remove/removeAllAssociation`
 * - Property validation: `validateProperty`
 * - Delegate management: `addDelegate`, `removeDelegate`
 * - State methods: `isActive`, `isDestroyStarted`
 * - Debug/inspection: `inspect`, `data`
 * - Internal methods: explicit `_`-prefixed (also caught by dynamic rule)
 * - Binding internals: `bind/unbindElement`, `bind/unbindAggregation`, `bind/unbindProperty`
 *
 * Items intentionally NOT blacklisted (test authors need these):
 * - `destroy` — standard lifecycle method for test cleanup
 * - `getMetadata` — essential for control inspection and type checking
 * - `getInterface` — standard interface access API
 * - `getBusy`/`setBusy` — useful for wait assertions
 * - `getTooltip`/`setTooltip` — useful for a11y tests
 * - `getCustomData`/`addCustomData`/`removeCustomData` — useful for data-driven tests
 */
export const METHOD_BLACKLIST: ReadonlySet<string> = new Set([
  // ── wdi5 bridge-reserved ──────────────────────────────────────────
  '$',
  'getAggregation',
  'constructor',
  'fireEvent',
  'init',

  // ── Lifecycle methods ─────────────────────────────────────────────
  'clone',
  'exit',
  'onInit',
  'onExit',
  'onBeforeShow',
  'onAfterShow',
  'onBeforeHide',
  'onAfterHide',
  'applySettings',

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
  'getIdForLabel',
  'getAccessibilityInfo',
  'getLayoutData',
  'setLayoutData',
  'getBusyIndicatorDelay',
  'setBusyIndicatorDelay',
  'getFieldGroupIds',
  'setFieldGroupIds',

  // ── Aggregation manipulation (dhikraft) ───────────────────────────
  'setAggregation',
  'addAggregation',
  'removeAggregation',
  'removeAllAggregation',
  'insertAggregation',
  'indexOfAggregation',
  'destroyAggregation',
  'validateAggregation',
  'propagateProperties',
  'findAggregatedObjects',

  // ── Association methods (dhikraft) ────────────────────────────────
  'getAssociation',
  'setAssociation',
  'addAssociation',
  'removeAssociation',
  'removeAllAssociation',

  // ── Property validation (dhikraft) ────────────────────────────────
  'validateProperty',

  // ── Delegate management (dhikraft) ────────────────────────────────
  'removeDelegate',
  'addDelegate',

  // ── State methods (dhikraft) ──────────────────────────────────────
  'isActive',
  'isDestroyStarted',

  // ── Debug/inspection (dhikraft) ───────────────────────────────────
  'inspect',
  'data',

  // ── Internal methods (explicit, also caught by _ prefix rule) ─────
  '_getBindingContext',
  '_setBindingContext',
  '_getPropertiesToPropagate',
  '_callMethodInManagedObject',
  '_observeChanges',
  '_propagateProperties',

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
