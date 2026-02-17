/**
 * Bridge return-type handler — routes results based on 7-type discriminant.
 *
 * @remarks
 * Every bridge method call returns a {@link MethodExecutionResult} with a
 * `returnType` field. This handler maps each type to the appropriate
 * proxy/value representation on the Node side.
 *
 * Return type routing:
 * - `result` → raw value (string, number, boolean)
 * - `empty` → undefined
 * - `element` → control ref (same control)
 * - `newElement` → control ref (new control)
 * - `aggregation` → array of control/object refs
 * - `object` → object ref (model, binding, etc.)
 * - `none` → undefined (logged as warning)
 * - `unknown` → undefined
 *
 * @example
 * ```typescript
 * import { handleBridgeReturn } from '#proxy/return-handler.js';
 *
 * const result = await adapter.executeControlMethod('btn1', 'getText', []);
 * const value = handleBridgeReturn(result);
 * ```
 *
 * @module proxy
 */

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
 * Routes a bridge method execution result to the appropriate return value.
 *
 * @param result - The bridge method execution result.
 * @returns The processed return value based on the result's `returnType`.
 * @throws {@link BridgeError} if the execution failed (`success === false`).
 *
 * @example
 * ```typescript
 * const result: MethodExecutionResult<string> = {
 *   success: true,
 *   returnType: 'result',
 *   value: 'Save',
 *   duration: 1,
 * };
 * handleBridgeReturn(result); // → 'Save'
 * ```
 */
export function handleBridgeReturn(result: MethodExecutionResult): unknown {
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
      return result.value;
    }
    case 'aggregation': {
      const uuids = result.uuids ?? [];
      const types = result.objectTypes ?? [];
      return uuids.map((uuid, idx): AggregationItemRef => {
        const objectType = types.at(idx) ?? 'unknown';
        return { uuid, objectType };
      });
    }
    case 'object': {
      return {
        uuid: result.uuid ?? '',
        objectType: result.objectType ?? 'unknown',
      } satisfies ObjectRef;
    }
  }
}
