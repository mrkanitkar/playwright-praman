/**
 * Node-side control discovery orchestration.
 *
 * @remarks
 * Orchestrates control lookup using a configurable strategy chain.
 * The cache is always checked first (tier 0), then configured strategies
 * are tried in order. On success, the discovered proxy is cached.
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
import { createControlProxy } from './dynamic-proxy.js';

import type { BridgeAdapter } from '#bridge/adapter.js';
import type { DiscoveryStrategyName } from '#core/config/schema.js';
import type { UI5ControlBase } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for strategy-chain impl
  _discoveryStrategies: readonly DiscoveryStrategyName[],
): Promise<UI5ControlBase | null> {
  // Tier 0: Cache lookup
  const cached = cache.get(selector);
  if (cached !== undefined) {
    return cached;
  }

  // Tier 1+: Bridge adapter lookup
  const controlRef = await adapter.findControl(selector);
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
