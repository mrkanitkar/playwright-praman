/**
 * Types shared between the bridge layer and other layers.
 *
 * @remarks
 * Defines the return type discriminant, method descriptors, and result envelope
 * for bridge adapter communication. These types are consumed by the proxy layer
 * (Layer 3) and matcher layer.
 *
 * @module types
 */

/**
 * Discriminated union for bridge method return classification.
 *
 * @remarks
 * The seven-type return handler in the proxy layer uses this discriminant
 * to determine how to wrap bridge call results.
 *
 * - `empty` — void / no meaningful return
 * - `result` — primitive value (string, number, boolean)
 * - `element` — existing DOM element handle (same control)
 * - `newElement` — newly created element handle
 * - `aggregation` — array of child controls
 * - `object` — non-control UI5 object (e.g., model, binding)
 * - `objectArray` — array of non-control UI5 objects (each stored with UUID)
 * - `none` — unclassified return (logged as warning)
 * - `unknown` — instance check failed (differs from `none` which is undefined/null)
 *
 * @example
 * ```typescript
 * import type { BridgeReturnType } from '#core/types/bridge.js';
 *
 * const returnType: BridgeReturnType = 'result';
 * ```
 */
export type BridgeReturnType =
  | 'empty'
  | 'result'
  | 'element'
  | 'newElement'
  | 'aggregation'
  | 'object'
  | 'objectArray'
  | 'none'
  | 'unknown';

/**
 * Descriptor for a method call to be executed on a UI5 control via the bridge.
 *
 * @remarks
 * Passed from the proxy handler to the bridge adapter. The adapter executes
 * the method on the browser-side control and returns a {@link BridgeResult}.
 *
 * @example
 * ```typescript
 * import type { BridgeMethodDescriptor } from '#core/types/bridge.js';
 *
 * const descriptor: BridgeMethodDescriptor = {
 *   name: 'getText',
 *   args: [],
 *   returnType: 'result',
 * };
 * ```
 */
export interface BridgeMethodDescriptor {
  /** Method name to invoke on the UI5 control. */
  readonly name: string;
  /** Arguments to pass to the method. */
  readonly args: readonly unknown[];
  /** Expected return type classification. */
  readonly returnType: BridgeReturnType;
}

/**
 * Result envelope for bridge adapter responses.
 *
 * @remarks
 * Every bridge call returns this envelope. On success, `data` contains the
 * typed result. On failure, `error` contains a descriptive message and
 * `success` is false.
 *
 * @typeParam T - The type of the successful result data
 *
 * @example
 * ```typescript
 * import type { BridgeResult } from '#core/types/bridge.js';
 *
 * const result: BridgeResult<string> = {
 *   success: true,
 *   data: 'Save',
 *   duration: 42,
 * };
 * ```
 */
export interface BridgeResult<T = unknown> {
  /** Whether the bridge call succeeded. */
  readonly success: boolean;
  /** Result data on success. */
  readonly data?: T;
  /** Error message on failure. */
  readonly error?: string;
  /** Execution duration in milliseconds. */
  readonly duration: number;
}
