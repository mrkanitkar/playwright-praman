/**
 * Node-side control discovery orchestration.
 *
 * @remarks
 * Orchestrates control lookup using a configurable strategy chain.
 * The cache is always checked first (tier 0), then configured strategies
 * are tried in priority order. On success, the discovered proxy is cached.
 *
 * Strategy chain (W9/W20):
 * - `cache` — always first (internal, tier 0)
 * - `direct-id` — strips selector to id-only for fastest `getById()` path
 * - `recordreplay` — passes full selector for `RecordReplay.findDOMElementByControlSelector()`
 * - `registry` — Phase 3+ placeholder (skipped)
 *
 * @example
 * ```typescript
 * import { discoverControl } from '#proxy/discovery.js';
 *
 * const proxy = await discoverControl(
 *   { id: 'btn1' },
 *   adapter,
 *   cache,
 *   ['recordreplay', 'direct-id'],
 * );
 * ```
 *
 * @module proxy
 */

import type { ControlProxyCache } from './cache.js';
import { getDiscoveryPriorities } from './discovery-factory.js';
import { createControlProxy } from './dynamic-proxy.js';

import type { BridgeAdapter } from '#bridge/adapter.js';
import type { BridgeControlRef } from '#bridge/bridge-types.js';
import type { DiscoveryStrategyName } from '#core/config/schema.js';
import type { UI5ControlBase } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';

/**
 * Attempts a single discovery strategy against the adapter.
 *
 * @returns The control ref, or `null` if the strategy did not find it.
 */
async function tryStrategy(
  strategy: string,
  selector: UI5Selector,
  adapter: BridgeAdapter,
): Promise<BridgeControlRef | null> {
  if (strategy === 'direct-id') {
    if (selector.id === undefined) return null;
    return adapter.findControl({ id: selector.id });
  }

  if (strategy === 'recordreplay') {
    return adapter.findControl(selector);
  }

  // 'registry' and unknown strategies are no-ops (Phase 3+)
  return null;
}

/**
 * Discovers a control by selector using the configured strategy chain.
 *
 * @param selector - The UI5Selector to search for.
 * @param adapter - Bridge adapter for control lookup.
 * @param cache - Proxy cache for fast repeat lookups.
 * @param discoveryStrategies - Configured strategy names from PramanConfig.
 * @returns The discovered proxy, or `null` if not found.
 *
 * @example
 * ```typescript
 * const control = await discoverControl(
 *   { controlType: 'sap.m.Button', properties: { text: 'Save' } },
 *   adapter,
 *   cache,
 *   ['recordreplay'],
 * );
 * if (control) {
 *   const text = await control.getText();
 * }
 * ```
 */
export async function discoverControl(
  selector: UI5Selector,
  adapter: BridgeAdapter,
  cache: ControlProxyCache,
  discoveryStrategies: readonly DiscoveryStrategyName[],
): Promise<UI5ControlBase | null> {
  // Tier 0: Cache lookup
  const cached = cache.get(selector);
  if (cached !== undefined) {
    return cached;
  }

  // Build priority chain (W9/W20) and try each strategy in order
  const priorities = getDiscoveryPriorities(selector, discoveryStrategies);
  let controlRef: BridgeControlRef | null = null;

  for (const strategy of priorities) {
    if (strategy === 'cache') continue; // Already handled above
    controlRef = await tryStrategy(strategy, selector, adapter);
    if (controlRef !== null) break;
  }

  if (controlRef === null) {
    return null;
  }

  // Get available methods for the proxy
  const methods = await adapter.getAvailableMethods(controlRef.id);

  // Create proxy
  const proxy = createControlProxy({
    id: controlRef.id,
    controlType: controlRef.controlType,
    methods: new Set(methods),
    adapter,
  });

  // Cache the proxy for future lookups
  cache.set(selector, proxy);

  return proxy;
}
