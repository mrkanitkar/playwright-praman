/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Function-form browser scripts for UI5 method execution (GAP-01).
 *
 * @remarks
 * These functions are passed to `page.evaluate(fn, args)` which uses CDP
 * `Runtime.callFunctionOn`. Playwright handles execution context tracking
 * automatically, eliminating "Execution context destroyed" errors when SAP
 * destroys contexts (IAS token refresh, WalkMe injection, FLP analytics).
 *
 * CRITICAL: Functions passed to `page.evaluate()` are serialized via
 * `fn.toString()`. Module-level functions, imports, closures, and variables
 * are NOT included in the serialized output. Therefore, ALL helper functions
 * are declared as inner function declarations within each exported function.
 * Inner function declarations ARE included in `fn.toString()`.
 *
 * This means there is intentional duplication of helpers between
 * `browserExecuteControlMethod` and `browserExecuteObjectMethod`.
 * This is the only correct approach for `page.evaluate()` compatibility.
 *
 * Type assertions (`as string`, `as BridgeRecord`) throughout this file narrow
 * untyped UI5 API return values from `.call()`. UI5's browser-side API methods
 * (getMetadata, getName, getId, etc.) return dynamically-typed values — casts
 * are safe because the method names are known UI5 API contracts.
 *
 * File exceeds 300 LOC (self-contained browser scripts with inlined helpers cannot be split).
 *
 * For string-form scripts (legacy, used by `ui5-handler.ts`), see `execute-method.ts`.
 *
 * @module bridge/browser-scripts
 */

import type { MethodExecutionResult } from '../bridge-types.js';

/**
 * Parameters for the function-form control method execution.
 *
 * @example
 * ```typescript
 * const params: BrowserExecControlParams = {
 *   controlId: 'saveBtn',
 *   methodName: 'getText',
 *   args: [],
 *   bridgeNs: '__praman_bridge',
 * };
 * ```
 */
export interface BrowserExecControlParams {
  /** UI5 control ID. */
  readonly controlId: string;
  /** Method name to invoke on the control. */
  readonly methodName: string;
  /** Arguments to pass to the method. */
  readonly args: readonly unknown[];
  /** Window namespace of the injected bridge (e.g., `'__praman_bridge'`). */
  readonly bridgeNs: string;
}

/**
 * Parameters for the function-form object method execution.
 *
 * @example
 * ```typescript
 * const params: BrowserExecObjectParams = {
 *   uuid: 'model-uuid-1',
 *   methodName: 'getData',
 *   args: [],
 *   bridgeNs: '__praman_bridge',
 * };
 * ```
 */
export interface BrowserExecObjectParams {
  /** UUID of the stored object in the bridge's objectMap. */
  readonly uuid: string;
  /** Method name to invoke on the object. */
  readonly methodName: string;
  /** Arguments to pass to the method. */
  readonly args: readonly unknown[];
  /** Window namespace of the injected bridge (e.g., `'__praman_bridge'`). */
  readonly bridgeNs: string;
}

/** Typed accessor for bridge methods. */
type BridgeRecord = Record<string, unknown>;

/**
 * Function-form browser script for executing a method on a UI5 control.
 *
 * @remarks
 * Self-contained function passed to `page.evaluate(fn, args)`. Contains the
 * same 7-type return detection (A.4) and aggregation special-case handling
 * (A.6) as the string-form `createExecuteMethodScript()`.
 *
 * All helper functions are inlined as inner function declarations so they
 * are included when `fn.toString()` serializes this function for the browser.
 *
 * @param params - Control ID, method name, args, and bridge namespace.
 * @returns Method execution result with return type classification.
 *
 * @example
 * ```typescript
 * import { browserExecuteControlMethod } from '#bridge/browser-scripts/execute-method-fn.js';
 * import { BRIDGE_GLOBALS } from '#bridge/bridge-constants.js';
 *
 * const result = await page.evaluate(browserExecuteControlMethod, {
 *   controlId: 'saveBtn',
 *   methodName: 'getText',
 *   args: [],
 *   bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
 * });
 * ```
 */
export function browserExecuteControlMethod(
  params: BrowserExecControlParams,
): MethodExecutionResult {
  // ── Inner helpers (inlined for page.evaluate serialization) ────────

  function fail(error: string, duration: number): MethodExecutionResult {
    return { success: false, returnType: 'none', error, duration };
  }

  function getBridgeFn(
    bridge: BridgeRecord,
    key: string,
  ): ((...args: unknown[]) => unknown) | undefined {
    // eslint-disable-next-line security/detect-object-injection -- bridge is a controlled namespace object
    const val = bridge[key];
    return typeof val === 'function' ? (val as (...args: unknown[]) => unknown) : undefined;
  }

  function getMethodFn(
    obj: BridgeRecord,
    name: string,
  ): ((...a: unknown[]) => unknown) | undefined {
    // eslint-disable-next-line security/detect-object-injection -- name is from trusted params
    const val = obj[name];
    return typeof val === 'function' ? (val as (...a: unknown[]) => unknown) : undefined;
  }

  function safeGetId(obj: BridgeRecord, fallback: string): string {
    const fn = getMethodFn(obj, 'getId');
    return fn !== undefined ? (fn.call(obj) as string) : fallback;
  }

  function safeGetTypeName(obj: BridgeRecord): string {
    const getMetaFn = getMethodFn(obj, 'getMetadata');
    if (getMetaFn === undefined) return 'unknown';
    const meta = getMetaFn.call(obj) as BridgeRecord | null;
    if (meta === null) return 'unknown';
    const getNameFn = getMethodFn(meta, 'getName');
    if (getNameFn === undefined) return 'unknown';
    return getNameFn.call(meta) as string;
  }

  function isJsonSerializable(value: unknown): boolean {
    try {
      JSON.stringify(value);
      return true;
    } catch {
      return false;
    }
  }

  function tryComboBoxExtraction(item: BridgeRecord, currentId: string): string {
    const getDomRefFn = getMethodFn(item, 'getDomRef');
    const domRef = getDomRefFn !== undefined ? getDomRefFn.call(item) : null;
    if (domRef === null || domRef === undefined) return currentId;

    const dataFn = getMethodFn(item, 'data');
    if (dataFn === undefined) return currentId;

    const listItemData = dataFn.call(item, 'InputWithSuggestionsListItem') as BridgeRecord | null;
    if (listItemData === null) return currentId;

    const getListItemIdFn = getMethodFn(listItemData, 'getId');
    return getListItemIdFn !== undefined
      ? (getListItemIdFn.call(listItemData) as string)
      : currentId;
  }

  function applyAggregationSpecialCases(item: BridgeRecord, itemId: string): string {
    let result = itemId;
    try {
      result = tryComboBoxExtraction(item, result);
      if (result !== '' && result.includes('PlanningCalendar') && !result.includes('-CLI')) {
        result = result + '-CLI';
      }
    } catch {
      // Special case extraction failed, use original ID
    }
    return result;
  }

  function buildAggregationResult(items: BridgeRecord[], duration: number): MethodExecutionResult {
    const ids: string[] = [];
    const types: string[] = [];
    for (const item of items) {
      let itemId = safeGetId(item, '');
      itemId = applyAggregationSpecialCases(item, itemId);
      ids.push(itemId);
      types.push(safeGetTypeName(item));
    }
    return {
      success: true,
      returnType: 'aggregation',
      uuids: ids,
      objectTypes: types,
      isArray: true,
      duration,
    };
  }

  function classifyArrayResult(result: unknown[], duration: number): MethodExecutionResult {
    if (result.length === 0) {
      return { success: true, returnType: 'empty', value: [], duration };
    }

    const firstItem = result[0] as BridgeRecord | undefined;
    if (firstItem !== undefined && typeof firstItem['getParent'] === 'function') {
      return buildAggregationResult(result as BridgeRecord[], duration);
    }

    return { success: true, returnType: 'result', value: result, isArray: true, duration };
  }

  function classifyObjectResult(
    resultObj: BridgeRecord,
    getById: (id: string) => BridgeRecord | null,
    bridge: BridgeRecord,
    duration: number,
  ): MethodExecutionResult {
    if (typeof resultObj['getId'] === 'function' && typeof resultObj['getParent'] === 'function') {
      const resultId = (resultObj['getId'] as () => string).call(resultObj);
      if (getById(resultId) !== null) {
        return {
          success: true,
          returnType: 'newElement',
          value: { id: resultId, controlType: safeGetTypeName(resultObj) },
          duration,
        };
      }
      // PRESERVE: Praman newElement fallthrough — BindingContext has getId() but
      // is NOT an Element, so fall through to saveObject when getById returns null.
    }

    // GAP-07: If the object is JSON-serializable, return as 'result' to avoid UUID overhead.
    if (isJsonSerializable(resultObj)) {
      return { success: true, returnType: 'result', value: resultObj, duration };
    }

    const saveObjectFn = getBridgeFn(bridge, 'saveObject') as
      | ((obj: unknown, type?: string) => string)
      | undefined;
    const typeName = safeGetTypeName(resultObj);
    const uuid = saveObjectFn !== undefined ? saveObjectFn(resultObj, 'object') : '';
    return {
      success: true,
      returnType: 'object',
      uuid,
      objectType: typeName,
      value: null,
      duration,
    };
  }

  // ── Main logic ─────────────────────────────────────────────────────

  try {
    const bridge = Reflect.get(window, params.bridgeNs) as BridgeRecord | undefined;
    if (bridge === undefined) return fail('Bridge not initialized', 0);

    const startTime = Date.now();
    const getById = getBridgeFn(bridge, 'getById') as
      | ((id: string) => BridgeRecord | null)
      | undefined;
    if (getById === undefined) return fail('Bridge getById not available', Date.now() - startTime);

    const ctrl = getById(params.controlId);
    if (ctrl === null)
      return fail('Control not found: ' + params.controlId, Date.now() - startTime);

    const method = getMethodFn(ctrl, params.methodName);
    if (method === undefined)
      return fail('Method not found: ' + params.methodName, Date.now() - startTime);

    const result: unknown = method.apply(ctrl, [...params.args]);
    const duration = Date.now() - startTime;

    if (result === undefined || result === null) {
      return { success: true, returnType: 'none', duration };
    }

    if (Array.isArray(result)) {
      return classifyArrayResult(result, duration);
    }

    if (result === ctrl) {
      return {
        success: true,
        returnType: 'element',
        value: { id: safeGetId(ctrl, params.controlId) },
        duration,
      };
    }

    const isPrimitiveFn = getBridgeFn(bridge, 'isPrimitive') as
      | ((v: unknown) => boolean)
      | undefined;
    if (isPrimitiveFn?.(result) === true) {
      return { success: true, returnType: 'result', value: result, duration };
    }

    return classifyObjectResult(result as BridgeRecord, getById, bridge, duration);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(msg, 0);
  }
}

/**
 * Function-form browser script for executing a method on a non-control UI5 object.
 *
 * @remarks
 * Self-contained function passed to `page.evaluate(fn, args)`. Retrieves the
 * target object from the bridge's objectMap by UUID, then executes the specified
 * method. Uses the same return type detection as control method execution.
 *
 * All helper functions are inlined as inner function declarations so they
 * are included when `fn.toString()` serializes this function for the browser.
 *
 * @param params - UUID, method name, args, and bridge namespace.
 * @returns Method execution result with return type classification.
 *
 * @example
 * ```typescript
 * import { browserExecuteObjectMethod } from '#bridge/browser-scripts/execute-method-fn.js';
 * import { BRIDGE_GLOBALS } from '#bridge/bridge-constants.js';
 *
 * const result = await page.evaluate(browserExecuteObjectMethod, {
 *   uuid: 'model-uuid-1',
 *   methodName: 'getData',
 *   args: [],
 *   bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
 * });
 * ```
 */
export function browserExecuteObjectMethod(params: BrowserExecObjectParams): MethodExecutionResult {
  // ── Inner helpers (inlined for page.evaluate serialization) ────────

  function fail(error: string, duration: number): MethodExecutionResult {
    return { success: false, returnType: 'none', error, duration };
  }

  function getBridgeFn(
    bridge: BridgeRecord,
    key: string,
  ): ((...args: unknown[]) => unknown) | undefined {
    // eslint-disable-next-line security/detect-object-injection -- bridge is a controlled namespace object
    const val = bridge[key];
    return typeof val === 'function' ? (val as (...args: unknown[]) => unknown) : undefined;
  }

  function getMethodFn(
    obj: BridgeRecord,
    name: string,
  ): ((...a: unknown[]) => unknown) | undefined {
    // eslint-disable-next-line security/detect-object-injection -- name is from trusted params
    const val = obj[name];
    return typeof val === 'function' ? (val as (...a: unknown[]) => unknown) : undefined;
  }

  // eslint-disable-next-line sonarjs/no-identical-functions -- intentional: page.evaluate requires self-contained functions
  function safeGetTypeName(obj: BridgeRecord): string {
    const getMetaFn = getMethodFn(obj, 'getMetadata');
    if (getMetaFn === undefined) return 'unknown';
    const meta = getMetaFn.call(obj) as BridgeRecord | null;
    if (meta === null) return 'unknown';
    const getNameFn = getMethodFn(meta, 'getName');
    if (getNameFn === undefined) return 'unknown';
    return getNameFn.call(meta) as string;
  }

  // eslint-disable-next-line sonarjs/no-identical-functions -- intentional: page.evaluate requires self-contained functions
  function isJsonSerializable(value: unknown): boolean {
    try {
      JSON.stringify(value);
      return true;
    } catch {
      return false;
    }
  }

  function classifyObjectArrayResult(
    result: unknown[],
    bridge: BridgeRecord,
    duration: number,
  ): MethodExecutionResult {
    if (result.length === 0) {
      return { success: true, returnType: 'empty', value: [], duration };
    }

    if (isJsonSerializable(result)) {
      return { success: true, returnType: 'result', value: result, isArray: true, duration };
    }

    // GAP-11: Array contains non-serializable objects — save each via saveObject.
    const saveObjectFn = getBridgeFn(bridge, 'saveObject') as
      | ((obj: unknown, type?: string) => string)
      | undefined;
    const uuids: string[] = [];
    const objectTypes: string[] = [];
    for (const item of result) {
      if (item !== null && item !== undefined && typeof item === 'object') {
        const uuid = saveObjectFn !== undefined ? saveObjectFn(item, 'object') : '';
        uuids.push(uuid);
        objectTypes.push(safeGetTypeName(item as BridgeRecord));
      } else {
        uuids.push('');
        objectTypes.push('primitive');
      }
    }
    return {
      success: true,
      returnType: 'objectArray',
      uuids,
      objectTypes,
      isArray: true,
      duration,
    };
  }

  // ── Main logic ─────────────────────────────────────────────────────

  try {
    const bridge = Reflect.get(window, params.bridgeNs) as BridgeRecord | undefined;
    if (bridge === undefined) return fail('Bridge not initialized', 0);

    const startTime = Date.now();
    const getObject = getBridgeFn(bridge, 'getObject') as
      | ((uuid: string) => BridgeRecord | null)
      | undefined;
    if (getObject === undefined)
      return fail('Bridge getObject not available', Date.now() - startTime);

    const obj = getObject(params.uuid);
    if (obj === null) return fail('Object not found: ' + params.uuid, Date.now() - startTime);

    const method = getMethodFn(obj, params.methodName);
    if (method === undefined)
      return fail('Method not found: ' + params.methodName, Date.now() - startTime);

    const result: unknown = method.apply(obj, [...params.args]);
    const duration = Date.now() - startTime;

    if (result === undefined || result === null) {
      return { success: true, returnType: 'none', duration };
    }

    // GAP-07: Array detection — aligned with browserExecuteControlMethod.
    if (Array.isArray(result)) {
      return classifyObjectArrayResult(result, bridge, duration);
    }

    const isPrimitiveFn = getBridgeFn(bridge, 'isPrimitive') as
      | ((v: unknown) => boolean)
      | undefined;
    if (isPrimitiveFn?.(result) === true) {
      return { success: true, returnType: 'result', value: result, duration };
    }

    // GAP-07: JSON serializability check before UUID storage.
    if (isJsonSerializable(result)) {
      return { success: true, returnType: 'result', value: result, duration };
    }

    const saveObjectFn = getBridgeFn(bridge, 'saveObject') as
      | ((o: unknown, type?: string) => string)
      | undefined;
    const typeName = safeGetTypeName(result as BridgeRecord);
    const savedUuid = saveObjectFn?.call(undefined, result, 'object') ?? '';
    return { success: true, returnType: 'object', uuid: savedUuid, objectType: typeName, duration };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(msg, 0);
  }
}
