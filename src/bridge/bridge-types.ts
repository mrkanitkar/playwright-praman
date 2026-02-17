/**
 * Browser-side type definitions for the `__praman_bridge` window namespace.
 *
 * @remarks
 * These types describe the shape of objects that exist in the browser context
 * after bridge injection. They are used by browser scripts and the adapter
 * layer to type `page.evaluate()` return values.
 *
 * @module bridge
 */

import type { BridgeReturnType } from '#core/types/bridge.js';

/**
 * Utility functions available on the injected bridge.
 */
export interface PramanBridgeUtils {
  /** Retrieves methods from a UI5 control's prototype chain. */
  readonly retrieveControlMethods: (controlId: string) => string[];
  /** Checks if a UI5 control exists by ID. */
  readonly controlExists: (controlId: string) => boolean;
}

/**
 * Shape of the `window.__praman_bridge` object after injection.
 *
 * @remarks
 * The bridge is injected via `page.evaluate()` (W14: lazy-only injection).
 * This interface describes the complete API surface available to browser scripts.
 */
export interface PramanBridge {
  /** Bridge implementation version. */
  readonly version: string;
  /** Detected UI5 framework version. */
  readonly ui5Version: string;
  /** Whether the bridge is fully initialized. */
  readonly ready: boolean;
  /** Timestamp (ms) when the bridge was injected. */
  readonly injectedAt: number;
  /** Reference to UI5 RecordReplay API (if available, UI5 \>= 1.94). */
  readonly RecordReplay: unknown;
  /** Reference to `sap.ui.core.Element` or `sap.ui.core.Element`. */
  readonly Element: unknown;
  /** Reference to `sap.base.Log` for browser-side logging. */
  readonly Log: unknown;
  /** UUID-keyed map for tracking non-control UI5 objects. */
  readonly objectMap: Map<string, unknown>;
  /** Look up a UI5 control by ID (uses version-appropriate API). */
  getById(id: string): unknown;
  /** Store a non-control object and return its UUID. */
  saveObject(obj: unknown, type?: string): string;
  /** Retrieve a stored object by UUID. */
  getObject(uuid: string): unknown;
  /** Delete a stored object by UUID. */
  deleteObject(uuid: string): boolean;
  /** Utility functions for control introspection. */
  readonly utils: PramanBridgeUtils;
}

/**
 * Result of control discovery via the bridge.
 *
 * @remarks
 * Returned by `findControl` browser scripts. Contains the minimal info
 * needed to construct a proxy on the Node side.
 */
export interface ControlDiscoveryResult {
  /** UI5 control ID. */
  readonly id: string;
  /** Fully qualified control type (e.g., `'sap.m.Button'`). */
  readonly controlType: string;
  /** Available method names on the control. */
  readonly methods: readonly string[];
  /** DOM element ID (may differ from UI5 ID), or null if not rendered. */
  readonly domId: string | null;
  /** Whether the control is currently visible. */
  readonly visible: boolean;
}

/**
 * Result of executing a method on a UI5 control via the bridge.
 *
 * @remarks
 * The `returnType` discriminant drives the proxy's return-type handler
 * to wrap the result appropriately (new proxy, primitive, array, etc.).
 *
 * @typeParam T - The type of the returned value.
 */
export interface MethodExecutionResult<T = unknown> {
  /** Whether the method execution succeeded. */
  readonly success: boolean;
  /** Return type classification for proxy routing. */
  readonly returnType: BridgeReturnType;
  /** The returned value (if any). */
  readonly value?: T;
  /** UUID of a stored non-control object (when returnType is 'object'). */
  readonly uuid?: string;
  /** Type name of a stored object. */
  readonly objectType?: string;
  /** UUIDs of multiple stored objects (when returnType is 'aggregation'). */
  readonly uuids?: readonly string[];
  /** Type names of multiple stored objects. */
  readonly objectTypes?: readonly string[];
  /** Whether the return value is an array. */
  readonly isArray?: boolean;
  /** Error message if execution failed. */
  readonly error?: string;
  /** Execution duration in milliseconds. */
  readonly duration: number;
}
