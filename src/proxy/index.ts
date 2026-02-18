/**
 * Proxy module barrel — re-exports control proxy, object proxy, discovery,
 * and conversion utilities.
 *
 * @module proxy
 */

export { ControlProxyCache } from './cache.js';
export { discoverControl } from './discovery.js';
export type { DiscoveryStrategy, DiscoveryStrategyName } from './discovery-factory.js';
export { getDiscoveryPriorities } from './discovery-factory.js';
export type { ControlProxyState } from './dynamic-proxy.js';
export { createControlProxy } from './dynamic-proxy.js';
export { extractAllowedMethods, isMethodAllowed } from './method-filter.js';
export {
  cssEscapeId,
  isPlaywrightMethod,
  PLAYWRIGHT_API_METHODS,
  routeToInteractionStrategy,
} from './playwright-api.js';
export { isControlResult, convertToControlProxy, convertToObjectProxy } from './proxy-converter.js';
export type { AggregationItemRef, ObjectRef } from './return-handler.js';
export { handleBridgeReturn } from './return-handler.js';
export type { UI5ObjectCreateParams } from './ui5-object.js';
export { UI5Object } from './ui5-object.js';
export type { UI5ObjectCacheOptions } from './ui5-object-cache.js';
export { UI5ObjectCache } from './ui5-object-cache.js';
export { createUI5ObjectProxy } from './ui5-object-proxy.js';
