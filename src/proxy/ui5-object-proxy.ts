/**
 * Proxy wrapper for UI5Object — enables dynamic method forwarding.
 *
 * @remarks
 * Creates a Proxy around a {@link UI5Object} so that arbitrary method names
 * are forwarded to `executeMethod()`. Similar to the control proxy but
 * for non-control objects (models, bindings, etc.).
 *
 * @example
 * ```typescript
 * import { createUI5ObjectProxy } from '#proxy/ui5-object-proxy.js';
 *
 * const proxy = createUI5ObjectProxy(ui5Object);
 * const data = await proxy.getData();
 * ```
 *
 * @module proxy
 */

import type { UI5Object } from './ui5-object.js';

/** Anti-thenable property names. */
const ANTI_THENABLE = new Set(['then', 'catch', 'finally']);

/**
 * Creates a Proxy that forwards method calls to a UI5Object.
 *
 * @param object - The UI5Object to wrap.
 * @returns A proxy that forwards property access as method calls.
 *
 * @example
 * ```typescript
 * const proxy = createUI5ObjectProxy(modelObject);
 * const value = await proxy.getProperty('/name');
 * ```
 */
export function createUI5ObjectProxy(object: UI5Object): unknown {
  const target = Object.preventExtensions({ uuid: object.uuid, type: object.type });

  return new Proxy(target, {
    get(_target, prop: string | symbol): unknown {
      if (typeof prop === 'symbol') {
        return undefined;
      }

      if (ANTI_THENABLE.has(prop)) return undefined;
      if (prop === 'uuid') return object.uuid;
      if (prop === 'type') return object.type;
      if (prop === 'toString' || prop === 'toJSON') {
        return () => String(object);
      }

      // Forward all other property access as method calls
      return async (...args: unknown[]): Promise<unknown> => object.executeMethod(prop, args);
    },

    isExtensible(): boolean {
      return false;
    },

    preventExtensions(): boolean {
      return true;
    },
  });
}
