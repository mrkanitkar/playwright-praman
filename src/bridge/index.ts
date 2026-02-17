/**
 * Bridge module barrel — re-exports adapter interface, types, and implementations.
 *
 * @module bridge
 */

export type { BridgeAdapter, BridgePage } from './adapter.js';
export type { AdapterFactoryOptions, AdapterMode } from './adapter-factory.js';
export { createBridgeAdapter } from './adapter-factory.js';
export { BRIDGE_GLOBALS, BRIDGE_TIMEOUTS, XHR_IGNORE_PATTERNS } from './bridge-constants.js';
export type {
  BridgeControlRef,
  ControlDiscoveryResult,
  MethodExecutionResult,
  PramanBridge,
  PramanBridgeUtils,
} from './bridge-types.js';
export { ClassicUI5Adapter } from './classic-adapter.js';
export { HybridAdapter } from './hybrid-adapter.js';
export {
  ensureBridgeInjected,
  injectBridge,
  isBridgeReady,
  resetPageInjection,
  waitForBridgeReady,
} from './injection.js';
export type { Opa5StrategyConfig } from './interaction-strategies/opa5-strategy.js';
export type { InteractionStrategy } from './interaction-strategies/strategy.js';
export { createInteractionStrategy } from './interaction-strategies/strategy-factory.js';
export { DomFirstStrategy } from './interaction-strategies/dom-first-strategy.js';
export { Opa5Strategy } from './interaction-strategies/opa5-strategy.js';
export { UI5NativeStrategy } from './interaction-strategies/ui5-native-strategy.js';
export { isBlacklisted, METHOD_BLACKLIST } from './method-blacklist.js';
export { WebComponentAdapter } from './webcomponent-adapter.js';
