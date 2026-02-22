/**
 * UI5Object — represents a non-control UI5 object stored in the bridge's objectMap.
 *
 * @remarks
 * Models, bindings, routers, and other non-control objects returned by bridge
 * method calls are stored server-side in the objectMap with a UUID. This class
 * wraps the UUID reference and provides method execution via `page.evaluate()`.
 *
 * @example
 * ```typescript
 * import { UI5Object } from '#proxy/ui5-object.js';
 *
 * const model = await UI5Object.create({
 *   uuid: 'uuid-1',
 *   type: 'sap.ui.model.json.JSONModel',
 *   page: playwrightPage,
 * });
 * const data = await model.executeMethod('getData', []);
 * ```
 *
 * File exceeds 300 LOC (typed methods + self-contained browser script cannot be split).
 *
 * @module proxy
 */

import type { Page } from '@playwright/test';

import { BRIDGE_GLOBALS } from '#bridge/bridge-constants.js';
import type { MethodExecutionResult } from '#bridge/bridge-types.js';
import { browserExecuteObjectMethod } from '#bridge/browser-scripts/execute-method-fn.js';
import { BridgeError } from '#core/errors/bridge-error.js';
import { assertNever } from '#core/utils/assert-never.js';

/** Anti-thenable property names — return `undefined` to prevent auto-await. */
const ANTI_THENABLE = new Set(['then', 'catch', 'finally']);

/**
 * Properties that the proxy's get trap resolves directly rather than forwarding
 * through the generic method forwarder. Includes anti-thenable guards, JS built-ins,
 * and UI5Object's own typed methods.
 */
const NON_PROXIED_PROPERTIES = new Set([
  'then',
  'catch',
  'finally',
  'constructor',
  'prototype',
  '__proto__',
  'toJSON',
  'toString',
  'valueOf',
  'uuid',
  'type',
  'executeMethod',
  'getBindingContext',
  'getProperty',
  'setProperty',
  'getMetadata',
  'destroy',
]);

/**
 * Subset of NON_PROXIED_PROPERTIES that are explicit typed methods on UI5Object.
 * These are bound to the instance when accessed via the proxy.
 */
const EXPLICIT_METHODS = new Set([
  'executeMethod',
  'getBindingContext',
  'getProperty',
  'setProperty',
]);

/**
 * Parameters for creating a UI5Object.
 */
export interface UI5ObjectCreateParams {
  /** UUID of the stored object in the bridge's objectMap. */
  readonly uuid: string;
  /** Fully qualified type name (e.g., `'sap.ui.model.json.JSONModel'`). */
  readonly type: string;
  /** Playwright Page for executing methods via evaluate. */
  readonly page: Page;
}

/**
 * Represents a non-control UI5 object referenced by UUID.
 *
 * @example
 * ```typescript
 * const obj = await UI5Object.create({ uuid: 'abc', type: 'sap.ui.model.json.JSONModel', page });
 * const result = await obj.executeMethod('getData', []);
 * ```
 */
export class UI5Object {
  /** UUID in the bridge's objectMap. */
  readonly uuid: string;
  /** Fully qualified type name. */
  readonly type: string;
  /** Cached set of method names loaded from the browser-side prototype chain. */
  readonly methodCache: ReadonlySet<string>;

  private readonly page: Page;
  /** Mutable internal set — exposed as ReadonlySet via `methodCache`. */
  private _methodCache: Set<string>;

  private constructor(params: UI5ObjectCreateParams) {
    this.uuid = params.uuid;
    this.type = params.type;
    this.page = params.page;
    this._methodCache = new Set<string>();
    this.methodCache = this._methodCache;
  }

  /**
   * Async factory method for creating a UI5Object with loaded methods.
   *
   * @remarks
   * Creates the instance and loads available methods from the browser-side
   * prototype chain into `methodCache`. This enables the proxy's `has` trap
   * to report accurate membership.
   *
   * @param params - Creation parameters.
   * @returns A new UI5Object instance with methods loaded.
   *
   * @example
   * ```typescript
   * const obj = await UI5Object.create({ uuid: 'uuid-1', type: 'ModelType', page });
   * ```
   */
  static async create(params: UI5ObjectCreateParams): Promise<UI5Object> {
    const instance = new UI5Object(params);
    await instance.loadMethods();
    return instance;
  }

  /**
   * Executes a method on the stored browser-side object.
   *
   * @param methodName - The method to call.
   * @param args - Arguments to pass.
   * @returns The raw result from the bridge.
   *
   * @example
   * ```typescript
   * const result = await obj.executeMethod('getData', []);
   * ```
   */
  async executeMethod(methodName: string, args: readonly unknown[]): Promise<unknown> {
    // Function-form page.evaluate uses CDP Runtime.callFunctionOn —
    // Playwright tracks execution context automatically (GAP-01).
    const result = await this.page.evaluate(browserExecuteObjectMethod, {
      uuid: this.uuid,
      methodName,
      args: [...args],
      bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
    });
    return this.handleObjectReturn(result);
  }

  /**
   * Returns the binding context for the given model name.
   *
   * @param modelName - Name of the model, or `undefined` for the default model.
   * @returns A proxied UI5Object representing the `sap.ui.model.Context`.
   *
   * @example
   * ```typescript
   * const ctx = await obj.getBindingContext();
   * ```
   */
  async getBindingContext(modelName?: string): Promise<unknown> {
    const args = modelName !== undefined ? [modelName] : [];
    return this.executeMethod('getBindingContext', args);
  }

  /**
   * Gets a property value from the browser-side object.
   *
   * @param path - The property path (e.g., `'/name'`).
   * @returns The primitive property value.
   *
   * @example
   * ```typescript
   * const name = await obj.getProperty('/name');
   * ```
   */
  async getProperty(path: string): Promise<unknown> {
    return this.executeMethod('getProperty', [path]);
  }

  /**
   * Sets a property value on the browser-side object.
   *
   * @param path - The property path (e.g., `'/name'`).
   * @param value - The value to set.
   *
   * @example
   * ```typescript
   * await obj.setProperty('/name', 'NewValue');
   * ```
   */
  async setProperty(path: string, value: unknown): Promise<void> {
    await this.executeMethod('setProperty', [path, value]);
  }

  /**
   * Routes the return type from object method execution.
   *
   * @param result - The method execution result from the browser.
   * @returns Unwrapped value, undefined, or a sub-proxy for nested objects.
   */
  private async handleObjectReturn(result: MethodExecutionResult): Promise<unknown> {
    if (!result.success) {
      throw new BridgeError({
        code: 'ERR_BRIDGE_EXECUTION',
        message: result.error ?? `Method failed on ${this.type}`,
        attempted: `Execute method on UI5Object ${this.uuid}`,
        retryable: false,
        suggestions: [
          'Verify the object still exists in the bridge objectMap',
          'Check that the method name is correct for this object type',
        ],
      });
    }
    switch (result.returnType) {
      case 'result': {
        return result.value;
      }
      case 'none':
      case 'unknown': {
        return undefined;
      }
      case 'object': {
        const sub = await UI5Object.create({
          uuid: result.uuid ?? '',
          type: result.objectType ?? 'unknown',
          page: this.page,
        });
        return sub.toProxy();
      }
      case 'objectArray': {
        // GAP-11: Array of non-serializable objects — create a UI5Object proxy for each.
        const arrayUuids = result.uuids ?? [];
        const arrayTypes = result.objectTypes ?? [];
        return Promise.all(
          arrayUuids.map(async (itemUuid, idx) => {
            const itemType = arrayTypes.at(idx) ?? 'unknown';
            // Primitive items in mixed arrays have empty UUIDs — return null.
            if (itemUuid === '') return null;
            const sub = await UI5Object.create({
              uuid: itemUuid,
              type: itemType,
              page: this.page,
            });
            return sub.toProxy();
          }),
        );
      }
      case 'empty':
      case 'element':
      case 'newElement':
      case 'aggregation': {
        // These return types are for control proxies, not object proxies.
        // Object methods should not produce these, but handle gracefully.
        return result.value;
      }
      default:
        return assertNever(result.returnType);
    }
  }

  /**
   * Creates a Proxy that forwards arbitrary method calls to `executeMethod()`.
   *
   * @remarks
   * Enables dynamic method access on non-control UI5 objects (models, bindings, etc.).
   * The proxy intercepts property access and routes it through `executeMethod()`,
   * allowing calls like `proxy.getData()` without explicitly using `executeMethod`.
   *
   * Properties listed in `NON_PROXIED_PROPERTIES` are resolved directly on the
   * instance rather than going through the generic forwarder.
   *
   * The proxy includes a `has` trap that checks `methodCache` for accurate
   * `'methodName' in proxy` support.
   *
   * @returns A proxy that forwards property access as async method calls.
   *
   * @example
   * ```typescript
   * const proxy = obj.toProxy();
   * const data = await proxy.getData();
   * ```
   */
  toProxy(): unknown {
    const target = Object.preventExtensions({ uuid: this.uuid, type: this.type });

    return new Proxy(target, {
      get: (_target, prop: string | symbol): unknown => {
        if (typeof prop === 'symbol') {
          return undefined;
        }

        if (ANTI_THENABLE.has(prop)) return undefined;
        if (prop === 'uuid') return this.uuid;
        if (prop === 'type') return this.type;
        if (prop === 'toString' || prop === 'toJSON') {
          return () => String(this);
        }
        if (prop === 'valueOf') {
          return () => String(this);
        }

        // Check for explicit typed methods on the instance
        if (EXPLICIT_METHODS.has(prop)) {
          const method = this[prop as keyof this];
          if (typeof method === 'function') {
            return (...args: unknown[]) =>
              (method as (...a: unknown[]) => unknown).apply(this, args);
          }
          return undefined;
        }

        // Other non-proxied properties (constructor, prototype, __proto__) return undefined
        if (NON_PROXIED_PROPERTIES.has(prop)) {
          return undefined;
        }

        // Forward all other property access as method calls
        return async (...args: unknown[]): Promise<unknown> => this.executeMethod(prop, args);
      },

      has: (_target, prop: string | symbol): boolean => {
        if (typeof prop === 'string') {
          return this._methodCache.has(prop) || prop === 'uuid' || prop === 'type';
        }
        return false;
      },

      isExtensible(): boolean {
        return false;
      },

      preventExtensions(): boolean {
        return true;
      },
    });
  }

  /**
   * Returns a string representation of this UI5Object.
   *
   * @example
   * ```typescript
   * String(obj) // '[UI5Object sap.ui.model.json.JSONModel uuid-1]'
   * ```
   */
  toString(): string {
    return `[UI5Object ${this.type} ${this.uuid}]`;
  }

  /**
   * Loads available method names from the browser-side object's prototype chain.
   *
   * @remarks
   * Uses function-form `page.evaluate()` to walk the prototype chain of the
   * stored object and collect all public method names (excluding `_`-prefixed
   * internal methods).
   */
  private async loadMethods(): Promise<void> {
    const methods = await this.page.evaluate(
      (params: { uuid: string; bridgeNs: string }) => {
        const bridge = Reflect.get(window, params.bridgeNs) as Record<string, unknown> | undefined;
        if (bridge === undefined) return [];
        const getObject = bridge['getObject'] as
          | ((uuid: string) => Record<string, unknown> | null)
          | undefined;
        if (getObject === undefined) return [];
        const obj = getObject(params.uuid);
        if (obj === null) return [];
        const collected: string[] = [];
        let proto: object | null = Object.getPrototypeOf(obj) as object | null;
        while (proto !== null && proto !== Object.prototype) {
          const names = Object.getOwnPropertyNames(proto);
          for (const name of names) {
            if (
              // eslint-disable-next-line security/detect-object-injection -- name is from Object.getOwnPropertyNames
              typeof (proto as Record<string, unknown>)[name] === 'function' &&
              !name.startsWith('_') &&
              !collected.includes(name)
            ) {
              collected.push(name);
            }
          }
          proto = Object.getPrototypeOf(proto) as object | null;
        }
        return collected;
      },
      { uuid: this.uuid, bridgeNs: BRIDGE_GLOBALS.NAMESPACE },
    );
    this._methodCache = new Set(methods);
    // Re-assign the public readonly reference so it points to the new set
    (this as { methodCache: ReadonlySet<string> }).methodCache = this._methodCache;
  }
}
