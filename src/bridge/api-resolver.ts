/**
 * 3-tier API resolution chain for UI5 control lookup (Decision D19).
 *
 * @remarks
 * Provides both a browser script for runtime resolution and a Node-side
 * utility to determine API priority based on UI5 version.
 *
 * Resolution tiers:
 * 1. `Element.getElementById()` — UI5 \>= 1.119
 * 2. `ElementRegistry.get()` — UI5 \>= 1.108
 * 3. `Core.byId()` — Legacy (deprecated since 1.118, kept as fallback)
 *
 * @module bridge
 */

import { isAtLeast } from '#core/utils/version-compare.js';

/**
 * API tier names for the resolution chain.
 */
type ApiTier = 'Core.byId' | 'Element.getElementById' | 'ElementRegistry.get';

/** Version thresholds for API availability. */
const ELEMENT_GET_BY_ID_MIN = '1.119.0';
const ELEMENT_REGISTRY_MIN = '1.108.0';

/**
 * Creates a browser script implementing the 3-tier API resolution chain.
 *
 * @remarks
 * The generated script tries each tier in order and returns the first
 * successful result. Each tier is wrapped in try-catch for resilience.
 *
 * @returns JavaScript string that resolves a UI5 control by ID.
 *
 * @example
 * ```typescript
 * const script = createApiResolverScript();
 * const control = await page.evaluate(new Function('id', script), 'btn1');
 * ```
 */
export function createApiResolverScript(): string {
  return `(function() {
    var id = arguments[0];
    if (!id) return null;

    try {
      if (typeof sap !== 'undefined' && sap.ui && sap.ui.core) {
        try {
          if (sap.ui.core.Element && sap.ui.core.Element.getElementById) {
            var el = sap.ui.core.Element.getElementById(id);
            if (el) return el;
          }
        } catch (e) {
          // Tier 1 failed, continue
        }

        try {
          if (sap.ui.core.ElementRegistry && sap.ui.core.ElementRegistry.get) {
            var el2 = sap.ui.core.ElementRegistry.get(id);
            if (el2) return el2;
          }
        } catch (e) {
          // Tier 2 failed, continue
        }

        try {
          if (sap.ui.getCore) {
            var core = sap.ui.getCore();
            if (core && core.byId) {
              var el3 = core.byId(id);
              if (el3) return el3;
            }
          }
        } catch (e) {
          // Tier 3 failed
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  })()`;
}

/**
 * Returns the ordered API resolution priority for a given UI5 version.
 *
 * @param ui5Version - Semantic version string (e.g. `'1.136.0'`).
 * @returns Frozen array of API tier names in priority order.
 *
 * @example
 * ```typescript
 * const priority = getApiResolverPriority('1.136.0');
 * // ['Element.getElementById', 'ElementRegistry.get', 'Core.byId']
 * ```
 */
export function getApiResolverPriority(ui5Version: string): readonly ApiTier[] {
  const tiers: ApiTier[] = [];

  if (isAtLeast(ui5Version, ELEMENT_GET_BY_ID_MIN)) {
    tiers.push('Element.getElementById');
  }

  if (isAtLeast(ui5Version, ELEMENT_REGISTRY_MIN)) {
    tiers.push('ElementRegistry.get');
  }

  tiers.push('Core.byId');

  return Object.freeze(tiers);
}
