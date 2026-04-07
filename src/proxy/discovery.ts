/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Node-side control discovery orchestration.
 *
 * @remarks
 * Orchestrates control lookup using a configurable strategy chain.
 * The cache is always checked first (tier 0), then configured strategies
 * are tried in priority order. On success, the discovered proxy is cached.
 *
 * Uses `page.evaluate()` directly with browser scripts — no adapter layer.
 *
 * Strategy chain (W9/W20):
 * - `cache` — always first (internal, tier 0)
 * - `direct-id` — strips selector to id-only for fastest `getById()` path
 * - `recordreplay` — passes full selector for `RecordReplay.findDOMElementByControlSelector()`
 * - `registry` — full registry scan with enhanced matching (GAP-02/GAP-21)
 *
 * @example
 * ```typescript
 * import { discoverControl } from '#proxy/discovery.js';
 *
 * const proxy = await discoverControl(
 *   { id: 'btn1' },
 *   page,
 *   interactionStrategy,
 *   cache,
 *   ['recordreplay', 'direct-id'],
 * );
 * ```
 *
 * @module proxy
 */

import type { Page } from '@playwright/test';

import type { ControlProxyCache } from './cache.js';
import { createControlProxy } from './control-proxy.js';
import { getDiscoveryPriorities } from './discovery-factory.js';

import { BRIDGE_GLOBALS } from '#bridge/bridge-constants.js';
import type { ControlDiscoveryResult } from '#bridge/bridge-types.js';
import { browserFindControl } from '#bridge/browser-scripts/find-control-fn.js';
import { ensureBridgeInjected } from '#bridge/injection.js';
import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';
import { filterMethods } from '#bridge/method-blacklist.js';
import type { DiscoveryStrategyName } from '#core/config/schema.js';
import { ControlError } from '#core/errors/control-error.js';
import type { UI5ControlBase } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';

/**
 * Attempts a single discovery strategy via direct `page.evaluate()`.
 *
 * @param strategy - The strategy name to attempt.
 * @param selector - The UI5 selector to search for.
 * @param page - Playwright Page for browser evaluation.
 * @param preferVisibleControls - When true, prefer visible controls in registry scan.
 * @returns The discovery result, or `null` if the strategy did not find it.
 *
 * @example
 * ```typescript
 * const result = await tryStrategy('registry', { controlType: 'sap.m.Button' }, page, true);
 * ```
 */
async function tryStrategy(
  strategy: string,
  selector: UI5Selector,
  page: Page,
  preferVisibleControls: boolean,
): Promise<ControlDiscoveryResult | null> {
  if (strategy === 'direct-id') {
    if (selector.id === undefined) return null;
    // Function-form page.evaluate uses CDP Runtime.callFunctionOn (GAP-01).
    // Pass id-only selector for fastest getById() path.
    const result = await page.evaluate(browserFindControl, {
      selector: { id: selector.id },
      bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
      preferVisibleControls,
    });
    if (result.id === '') return null;
    return result;
  }

  if (strategy === 'recordreplay') {
    // Pass full selector for RecordReplay.findDOMElementByControlSelector().
    const result = await page.evaluate(browserFindControl, {
      selector: { ...selector },
      bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
      preferVisibleControls,
    });
    if (result.id === '') return null;
    return result;
  }

  if (strategy === 'registry') {
    // Full registry scan with enhanced matching (GAP-02/GAP-21).
    // Forces Tier 2 as the primary path, skipping Tier 1 direct-id.
    const result = await page.evaluate(browserFindControl, {
      selector: { ...selector },
      bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
      preferVisibleControls,
      forceRegistryScan: true,
    });
    if (result.id === '') return null;
    return result;
  }

  // Unknown strategies are no-ops
  return null;
}

/**
 * Discovers a control by selector using the configured strategy chain.
 *
 * @param selector - The UI5Selector to search for.
 * @param page - Playwright Page for direct browser calls.
 * @param interactionStrategy - Interaction strategy for press/enterText/select routing.
 * @param cache - Proxy cache for fast repeat lookups.
 * @param discoveryStrategies - Configured strategy names from PramanConfig.
 * @param preferVisibleControls - When true, prefer visible controls in registry scan (default: true).
 * @returns The discovered proxy.
 * @throws ControlError with code `ERR_CONTROL_NOT_FOUND` when all strategies fail.
 *
 * @example
 * ```typescript
 * const control = await discoverControl(
 *   { controlType: 'sap.m.Button', properties: { text: 'Save' } },
 *   page,
 *   interactionStrategy,
 *   cache,
 *   ['recordreplay'],
 *   true,
 * );
 * const text = await control.getText();
 * ```
 */
export async function discoverControl(
  selector: UI5Selector,
  page: Page,
  interactionStrategy: InteractionStrategy,
  cache: ControlProxyCache,
  discoveryStrategies: readonly DiscoveryStrategyName[],
  preferVisibleControls = true,
): Promise<UI5ControlBase> {
  // Tier 0: Cache lookup
  const cached = cache.get(selector);
  if (cached !== undefined) {
    return cached;
  }

  // Ensure bridge is injected before any page.evaluate() calls
  await ensureBridgeInjected(page);

  // Build priority chain (W9/W20) and try each strategy in order
  const priorities = getDiscoveryPriorities(selector, discoveryStrategies);
  let discoveryResult: ControlDiscoveryResult | null = null;
  const attemptedStrategies: string[] = [];

  for (const strategy of priorities) {
    if (strategy === 'cache') continue; // Already handled above
    attemptedStrategies.push(strategy);
    discoveryResult = await tryStrategy(strategy, selector, page, preferVisibleControls);
    if (discoveryResult !== null) break;
  }

  if (discoveryResult === null) {
    throw new ControlError({
      code: 'ERR_CONTROL_NOT_FOUND',
      message: `Control not found after trying ${String(attemptedStrategies.length)} discovery strategies (${attemptedStrategies.join(' → ')}): ${JSON.stringify(selector)}`,
      attempted: `Discover control with selector: ${JSON.stringify(selector)}`,
      retryable: true,
      details: { selector, attemptedStrategies },
      suggestions: [
        'Verify the control ID exists in the UI5 view',
        'Check if the page has fully loaded (waitForUI5Stable)',
        'Try using controlType + properties instead of ID',
        `Strategies attempted: ${attemptedStrategies.join(', ')}`,
      ],
    });
  }

  // Filter methods through blacklist
  const methods = filterMethods(discoveryResult.methods);

  // Create proxy with page + interaction strategy for full functionality
  const proxy = createControlProxy({
    id: discoveryResult.id,
    controlType: discoveryResult.controlType,
    methods: new Set(methods),
    page,
    interactionStrategy,
  });

  // Cache the proxy for future lookups
  cache.set(selector, proxy);

  return proxy;
}
