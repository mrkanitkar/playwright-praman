/**
 * Bidirectional conversion between UI5ControlProxy and UI5Object (D17).
 *
 * @remarks
 * Detects whether a method execution result represents a UI5 control
 * (`element`/`newElement`) or a non-control object (`object`) and creates
 * the appropriate proxy type.
 *
 * @example
 * ```typescript
 * import { isControlResult, convertToControlProxy } from '#proxy/proxy-converter.js';
 *
 * if (isControlResult(result)) {
 *   const proxy = convertToControlProxy(result, adapter, methods);
 * }
 * ```
 *
 * @module proxy
 */

import { createControlProxy } from './dynamic-proxy.js';
import { createUI5ObjectProxy } from './ui5-object-proxy.js';
import { UI5Object } from './ui5-object.js';

import type { BridgeAdapter, BridgePage } from '#bridge/adapter.js';
import type { MethodExecutionResult } from '#bridge/bridge-types.js';
import type { UI5ControlBase } from '#core/types/controls.js';

/**
 * Detects whether a method result represents a UI5 control.
 *
 * @param result - The bridge method execution result.
 * @returns `true` if the result is a successful `element` or `newElement`.
 *
 * @example
 * ```typescript
 * if (isControlResult(result)) {
 *   // result.value has { id, controlType }
 * }
 * ```
 */
export function isControlResult(result: MethodExecutionResult): boolean {
  return result.success && (result.returnType === 'element' || result.returnType === 'newElement');
}

/**
 * Creates a UI5ControlProxy from an element/newElement result.
 *
 * @param result - The successful element result.
 * @param adapter - Bridge adapter for method forwarding.
 * @param methods - Known methods available on the control.
 * @returns A UI5ControlBase proxy.
 *
 * @example
 * ```typescript
 * const proxy = convertToControlProxy(result, adapter, new Set(['getText']));
 * const text = await proxy.getProperty('text');
 * ```
 */
export function convertToControlProxy(
  result: MethodExecutionResult,
  adapter: BridgeAdapter,
  methods: ReadonlySet<string>,
): UI5ControlBase {
  const value = result.value as { id: string; controlType: string };
  return createControlProxy({
    id: value.id,
    controlType: value.controlType,
    methods,
    adapter,
  });
}

/**
 * Creates a UI5Object proxy from an object result.
 *
 * @param result - The successful object result.
 * @param page - Bridge page for method forwarding.
 * @returns An opaque proxy that forwards method calls.
 *
 * @example
 * ```typescript
 * const proxy = convertToObjectProxy(result, page);
 * const data = await (proxy as { getData: () => Promise<unknown> }).getData();
 * ```
 */
export function convertToObjectProxy(result: MethodExecutionResult, page: BridgePage): unknown {
  const uuid = result.uuid ?? '';
  const type = result.objectType ?? 'unknown';
  const object = UI5Object.create({ uuid, type, page });
  return createUI5ObjectProxy(object);
}
