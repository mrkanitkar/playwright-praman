/**
 * Bridge module barrel — re-exports adapter interface, types, and implementations.
 *
 * @module bridge
 */

export type { BridgeAdapter, BridgePage } from './adapter.js';
export type { AdapterFactoryOptions, AdapterMode } from './adapter-factory.js';
export { createBridgeAdapter } from './adapter-factory.js';
export type {
  BridgeControlRef,
  ControlDiscoveryResult,
  MethodExecutionResult,
  PramanBridge,
  PramanBridgeUtils,
} from './bridge-types.js';
export { ClassicUI5Adapter } from './classic-adapter.js';
export { HybridAdapter } from './hybrid-adapter.js';
export { WebComponentAdapter } from './webcomponent-adapter.js';
