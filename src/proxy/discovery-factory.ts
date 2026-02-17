/**
 * Discovery strategy priority builder.
 *
 * @remarks
 * Determines the order of control lookup strategies based on the selector
 * shape and user configuration. Always prepends `'cache'` as tier 0.
 *
 * For ID-only selectors, `'direct-id'` is promoted to first position
 * (after cache) since it's the fastest lookup path.
 *
 * @example
 * ```typescript
 * import { getDiscoveryPriorities } from '#proxy/discovery-factory.js';
 *
 * const priorities = getDiscoveryPriorities(
 *   { id: 'btn1' },
 *   ['recordreplay', 'direct-id'],
 * );
 * // → ['cache', 'direct-id', 'recordreplay']
 * ```
 *
 * @module proxy
 */

import type { UI5Selector } from '#core/types/selectors.js';

/**
 * Available discovery strategies.
 */
export type DiscoveryStrategy = 'cache' | 'recordreplay' | 'direct-id' | 'registry';

/**
 * Strategy names that can be configured by the user.
 */
export type DiscoveryStrategyName = 'recordreplay' | 'direct-id' | 'registry';

/**
 * Determines whether a selector is ID-only (no controlType, properties, etc.).
 */
function isIdOnlySelector(selector: UI5Selector): boolean {
  return (
    selector.id !== undefined &&
    selector.controlType === undefined &&
    selector.properties === undefined &&
    selector.bindingPath === undefined &&
    selector.i18NText === undefined &&
    selector.ancestor === undefined &&
    selector.descendant === undefined
  );
}

/**
 * Builds an ordered list of discovery strategies.
 *
 * @param selector - The UI5Selector being resolved.
 * @param configuredStrategies - User-configured strategy names from PramanConfig.
 * @returns Ordered list of strategies, always starting with 'cache'.
 *
 * @example
 * ```typescript
 * getDiscoveryPriorities({ id: 'btn1' }, ['recordreplay', 'direct-id']);
 * // → ['cache', 'direct-id', 'recordreplay']
 * ```
 */
export function getDiscoveryPriorities(
  selector: UI5Selector,
  configuredStrategies: readonly DiscoveryStrategyName[],
): readonly DiscoveryStrategy[] {
  const result: DiscoveryStrategy[] = ['cache'];

  if (configuredStrategies.length === 0) {
    return result;
  }

  // For ID-only selectors, promote direct-id to first position
  if (isIdOnlySelector(selector) && configuredStrategies.includes('direct-id')) {
    result.push('direct-id');
    for (const s of configuredStrategies) {
      if (s !== 'direct-id') {
        result.push(s);
      }
    }
    return result;
  }

  // Otherwise, use configured order
  for (const s of configuredStrategies) {
    result.push(s);
  }

  return result;
}
