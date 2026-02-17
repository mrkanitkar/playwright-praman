/**
 * BridgeAdapter — interface for all bridge implementations.
 *
 * @remarks
 * Phase 1 defines the interface only. Concrete implementations (Classic,
 * RecordReplay, WebComponent) are delivered in Phase 2.
 *
 * All methods return Promises because they execute in the browser context
 * via `page.evaluate()`.
 *
 * M6: RecordReplay API requires UI5 1.94 or later. The adapter implementation
 * (Phase 2) must detect the UI5 version and throw `BridgeError` with
 * code `ERR_BRIDGE_VERSION` if the minimum is not met.
 *
 * @example
 * ```typescript
 * import type { BridgeAdapter } from '#bridge/adapter.js';
 *
 * async function discoverControls(adapter: BridgeAdapter) {
 *   await adapter.waitForUI5Stable();
 *   const button = await adapter.findControl({ id: 'submitBtn' });
 *   if (button) {
 *     const text = await adapter.getControlProperty(button.id, 'text');
 *     console.log(text);
 *   }
 * }
 * ```
 *
 * @module bridge
 */

import type { UI5ControlBase } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';

/**
 * Minimal Page interface for bridge operations.
 *
 * @remarks
 * Uses a minimal subset of Playwright's Page to avoid coupling
 * the interface definition to the full Playwright dependency.
 *
 * Two `evaluate` overloads:
 * - No-arg: `evaluate<TResult>(fn: () => TResult): Promise<TResult>`
 * - With-arg: `evaluate<TResult, TArg>(fn: (arg: TArg) => TResult, arg: TArg): Promise<TResult>`
 *
 * `waitForFunction` supports polling operations (UI5 stability, bridge ready).
 */
export interface BridgePage {
  /** Evaluate a function in the browser context (no arguments). */
  evaluate<TResult>(pageFunction: string | (() => TResult)): Promise<TResult>;
  /** Evaluate a function in the browser context with a serializable argument. */
  evaluate<TResult, TArg>(pageFunction: (arg: TArg) => TResult, arg: TArg): Promise<TResult>;
  /** Wait for a function to return a truthy value in the browser context. */
  waitForFunction(
    pageFunction: string | (() => unknown),
    options?: { readonly timeout?: number; readonly polling?: number },
  ): Promise<void>;
}

/**
 * Interface for all bridge adapter implementations.
 *
 * @remarks
 * Provides lifecycle management, control discovery, property access,
 * UI5 stability checks, and AI-first introspection capabilities.
 *
 * @example
 * ```typescript
 * const adapter: BridgeAdapter = createRecordReplayAdapter();
 * await adapter.init(page);
 * await adapter.waitForUI5Stable();
 * const controls = await adapter.findControls({ controlType: 'sap.m.Button' });
 * ```
 */
export interface BridgeAdapter {
  // ── Lifecycle ──────────────────────────────────────────────────────
  /** Initialize the bridge adapter with a Playwright page. */
  init(page: BridgePage): Promise<void>;
  /** Check if the bridge is initialized and ready. */
  isReady(): Promise<boolean>;
  /** Clean up resources and disconnect from the page. */
  destroy(): Promise<void>;

  // ── Version detection ──────────────────────────────────────────────
  /** Get the detected UI5 version string (e.g., '1.120.0'). */
  getUI5Version(): Promise<string>;
  /** Check if the app uses UI5 Web Components (vs classic). */
  isWebComponent(): Promise<boolean>;

  // ── Control discovery ──────────────────────────────────────────────
  /** Find a single control matching the selector, or null if not found. */
  findControl(selector: UI5Selector): Promise<UI5ControlBase | null>;
  /** Find all controls matching the selector. */
  findControls(selector: UI5Selector): Promise<readonly UI5ControlBase[]>;

  // ── Control interaction ────────────────────────────────────────────
  /** Get a property value from a control by ID. */
  getControlProperty(controlId: string, propertyName: string): Promise<unknown>;
  /** Set a property value on a control by ID. */
  setControlProperty(controlId: string, propertyName: string, value: unknown): Promise<void>;
  /** Get an aggregation (child controls) from a control by ID. */
  getControlAggregation(
    controlId: string,
    aggregationName: string,
  ): Promise<readonly UI5ControlBase[]>;
  /** Execute a method on a control by ID with arguments. */
  executeControlMethod(
    controlId: string,
    methodName: string,
    args: readonly unknown[],
  ): Promise<unknown>;

  // ── UI5 stability ──────────────────────────────────────────────────
  /** Wait for UI5 to be stable (no pending XHRs, timeouts, etc.). */
  waitForUI5Stable(timeout?: number): Promise<void>;

  // ── Object access ──────────────────────────────────────────────────
  /** Get a model from a control (default or named). */
  getModel(controlId: string, modelName?: string): Promise<unknown>;
  /** Get the binding context from a control (default or named). */
  getBindingContext(controlId: string, modelName?: string): Promise<unknown>;

  // ── Introspection (AI-first) ───────────────────────────────────────
  /** Describe a control's metadata, properties, and state for AI reasoning. */
  describeControl(controlId: string): Promise<Record<string, unknown>>;
  /** List all available methods on a control for AI discovery. */
  getAvailableMethods(controlId: string): Promise<readonly string[]>;
}
