/**
 * Proxy module barrel — re-exports control proxy, discovery, and object utilities.
 *
 * @module proxy
 */

export { ControlProxyCache } from './cache.js';
export type { ControlProxyState } from './control-proxy.js';
export { createControlProxy } from './control-proxy.js';
export { discoverControl } from './discovery.js';
export type { DiscoveryStrategy, DiscoveryStrategyName } from './discovery-factory.js';
export { getDiscoveryPriorities } from './discovery-factory.js';
export { extractAllowedMethods, isMethodAllowed } from './method-filter.js';
export type { UI5ObjectCreateParams } from './ui5-object.js';
export { UI5Object } from './ui5-object.js';
export type { UI5ObjectCacheOptions } from './ui5-object-cache.js';
export { UI5ObjectCache } from './ui5-object-cache.js';
