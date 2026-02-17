/**
 * Proxy-layer method filtering — wraps bridge blacklist for proxy use.
 *
 * @remarks
 * Delegates to `bridge/method-blacklist.ts` for the actual blacklist rules.
 * The proxy layer calls these functions in the `get` trap to decide whether
 * a method should be forwarded to the bridge or blocked.
 *
 * @example
 * ```typescript
 * import { isMethodAllowed, extractAllowedMethods } from '#proxy/method-filter.js';
 *
 * if (isMethodAllowed('getText')) {
 *   // Forward to bridge
 * }
 *
 * const safe = extractAllowedMethods(['getText', 'constructor', 'destroy']);
 * // → ['getText']
 * ```
 *
 * @module proxy
 */

import { filterMethods, isBlacklisted } from '#bridge/method-blacklist.js';

/**
 * Checks if a method is allowed to be forwarded through the proxy.
 *
 * @param methodName - The method name to check.
 * @returns `true` if the method is safe to forward to the bridge.
 *
 * @example
 * ```typescript
 * isMethodAllowed('getText');       // true
 * isMethodAllowed('constructor');   // false
 * isMethodAllowed('_internal');     // false
 * ```
 */
export function isMethodAllowed(methodName: string): boolean {
  return !isBlacklisted(methodName);
}

/**
 * Filters a method list, keeping only proxy-allowed methods.
 *
 * @param allMethods - All method names from the control prototype.
 * @returns Array of methods safe to forward.
 *
 * @example
 * ```typescript
 * const safe = extractAllowedMethods(['getText', 'constructor', '_foo']);
 * // → ['getText']
 * ```
 */
export function extractAllowedMethods(allMethods: readonly string[]): readonly string[] {
  return filterMethods(allMethods);
}
