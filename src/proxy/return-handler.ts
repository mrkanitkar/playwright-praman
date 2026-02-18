/**
 * Bridge return-type handler — routes results based on 7-type discriminant.
 *
 * @remarks
 * Every bridge method call returns a {@link MethodExecutionResult} with a
 * `returnType` field. This handler maps each type to the appropriate
 * proxy/value representation on the Node side.
 *
 * When a {@link BridgeReturnContext} is provided, `element`, `newElement`,
 * `aggregation`, and `object` results are wrapped in typed proxies via
 * `proxy-converter.ts`. Without context, bare refs are returned (backward
 * compatible).
 *
 * Return type routing:
 * - `result` → raw value (string, number, boolean)
 * - `empty` → undefined
 * - `element` → control proxy (with context) or raw ref
 * - `newElement` → control proxy (with context) or raw ref
 * - `aggregation` → array of UI5Object proxies (with context) or bare refs
 * - `object` → UI5Object proxy (with context) or bare ref
 * - `none` → undefined (logged as warning)
 * - `unknown` → undefined
 *
 * @example
 * ```typescript
 * import { handleBridgeReturn } from '#proxy/return-handler.js';
 *
 * // Without context (backward compatible)
 * const result = await adapter.executeControlMethod('btn1', 'getText', []);
 * const value = handleBridgeReturn(result);
 *
 * // With context (returns proxies)
 * const proxy = handleBridgeReturn(result, { adapter, page, methods });
 * ```
 *
 * @module proxy
 */

import { convertToControlProxy, convertToObjectProxy } from './proxy-converter.js';

import type { BridgeAdapter, BridgePage } from '#bridge/adapter.js';
import type { MethodExecutionResult } from '#bridge/bridge-types.js';
import { BridgeError } from '#core/errors/bridge-error.js';

/**
 * Aggregation item reference returned by the handler.
 */
export interface AggregationItemRef {
  /** UUID of the stored object. */
  readonly uuid: string;
  /** Fully qualified type name. */
  readonly objectType: string;
}

/**
 * Object reference returned for non-control UI5 objects.
 */
export interface ObjectRef {
  /** UUID of the stored object. */
  readonly uuid: string;
  /** Fully qualified type name. */
  readonly objectType: string;
}

/**
 * Optional context for creating typed proxies from bridge results.
 *
 * @remarks
 * When provided to {@link handleBridgeReturn}, `element`/`newElement` results
 * return a `UI5ControlBase` proxy, `aggregation` items return UI5Object proxies,
 * and `object` results return a UI5Object proxy. Without context, bare refs are
 * returned (backward compatible).
 *
 * @example
 * ```typescript
 * const ctx: BridgeReturnContext = {
 *   adapter: myAdapter,
 *   page: myPage,
 *   methods: new Set(['getText', 'setText']),
 * };
 * const proxy = handleBridgeReturn(result, ctx);
 * ```
 */
export interface BridgeReturnContext {
  /** Bridge adapter for method forwarding. */
  readonly adapter: BridgeAdapter;
  /** Playwright page for object method execution. */
  readonly page: BridgePage;
  /** Known methods available on the target control (optional). */
  readonly methods?: ReadonlySet<string>;
}

/**
 * Routes a bridge method execution result to the appropriate return value.
 *
 * @param result - The bridge method execution result.
 * @param context - Optional context for creating typed proxies. When provided,
 *   `element`/`newElement`/`aggregation`/`object` results return proxies instead
 *   of bare refs. Without context, bare refs are returned (backward compatible).
 * @returns The processed return value based on the result's `returnType`.
 * @throws {@link BridgeError} if the execution failed (`success === false`).
 *
 * @example
 * ```typescript
 * // Without context — returns bare refs
 * const result: MethodExecutionResult<string> = {
 *   success: true,
 *   returnType: 'result',
 *   value: 'Save',
 *   duration: 1,
 * };
 * handleBridgeReturn(result); // → 'Save'
 *
 * // With context — returns proxy
 * const elementResult: MethodExecutionResult = {
 *   success: true,
 *   returnType: 'element',
 *   value: { id: 'btn1', controlType: 'sap.m.Button' },
 *   duration: 1,
 * };
 * const proxy = handleBridgeReturn(elementResult, { adapter, page, methods });
 * ```
 */
export function handleBridgeReturn(
  result: MethodExecutionResult,
  context?: BridgeReturnContext,
): unknown {
  if (!result.success) {
    throw new BridgeError({
      code: 'ERR_BRIDGE_EXECUTION',
      message: result.error ?? 'Bridge method execution failed',
      attempted: 'Execute control method via bridge',
      retryable: false,
      suggestions: [
        'Verify the control still exists in the DOM',
        'Check if the method name is correct',
        'Ensure UI5 is stable before calling methods',
      ],
    });
  }

  switch (result.returnType) {
    case 'result': {
      return result.value;
    }
    case 'empty':
    case 'none':
    case 'unknown': {
      return undefined;
    }
    case 'element':
    case 'newElement': {
      if (context !== undefined) {
        return convertToControlProxy(result, context.adapter, context.methods ?? new Set());
      }
      return result.value;
    }
    case 'aggregation': {
      const uuids = result.uuids ?? [];
      const types = result.objectTypes ?? [];
      if (context !== undefined) {
        return uuids.map((uuid, idx) => {
          const objectType = types.at(idx) ?? 'unknown';
          const itemResult: MethodExecutionResult = {
            success: true,
            returnType: 'object',
            uuid,
            objectType,
            duration: 0,
          };
          return convertToObjectProxy(itemResult, context.page);
        });
      }
      return uuids.map((uuid, idx): AggregationItemRef => {
        const objectType = types.at(idx) ?? 'unknown';
        return { uuid, objectType };
      });
    }
    case 'object': {
      if (context !== undefined) {
        return convertToObjectProxy(result, context.page);
      }
      return {
        uuid: result.uuid ?? '',
        objectType: result.objectType ?? 'unknown',
      } satisfies ObjectRef;
    }
  }
}
