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
 * const model = UI5Object.create({
 *   uuid: 'uuid-1',
 *   type: 'sap.ui.model.json.JSONModel',
 *   page: bridgePage,
 * });
 * const data = await model.executeMethod('getData', []);
 * ```
 *
 * @module proxy
 */

import type { BridgePage } from '#bridge/adapter.js';
import { BRIDGE_GLOBALS } from '#bridge/bridge-constants.js';

/**
 * Parameters for creating a UI5Object.
 */
export interface UI5ObjectCreateParams {
  /** UUID of the stored object in the bridge's objectMap. */
  readonly uuid: string;
  /** Fully qualified type name (e.g., `'sap.ui.model.json.JSONModel'`). */
  readonly type: string;
  /** BridgePage for executing methods via evaluate. */
  readonly page: BridgePage;
}

/**
 * Represents a non-control UI5 object referenced by UUID.
 *
 * @example
 * ```typescript
 * const obj = UI5Object.create({ uuid: 'abc', type: 'sap.ui.model.json.JSONModel', page });
 * const result = await obj.executeMethod('getData', []);
 * ```
 */
export class UI5Object {
  /** UUID in the bridge's objectMap. */
  readonly uuid: string;
  /** Fully qualified type name. */
  readonly type: string;

  private readonly page: BridgePage;

  private constructor(params: UI5ObjectCreateParams) {
    this.uuid = params.uuid;
    this.type = params.type;
    this.page = params.page;
  }

  /**
   * Factory method for creating a UI5Object.
   *
   * @param params - Creation parameters.
   * @returns A new UI5Object instance.
   *
   * @example
   * ```typescript
   * const obj = UI5Object.create({ uuid: 'uuid-1', type: 'ModelType', page });
   * ```
   */
  static create(params: UI5ObjectCreateParams): UI5Object {
    return new UI5Object(params);
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
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const argsJson = JSON.stringify(args);
    const script = `(function() {
      var bridge = window.${ns};
      if (!bridge) return { success: false, error: 'Bridge not found', duration: 0 };
      var obj = bridge.getObject('${this.uuid}');
      if (!obj) return { success: false, error: 'Object not found: ${this.uuid}', duration: 0 };
      var start = Date.now();
      try {
        var result = obj['${methodName}'].apply(obj, ${argsJson});
        return { success: true, value: result, duration: Date.now() - start };
      } catch (e) {
        return { success: false, error: String(e), duration: Date.now() - start };
      }
    })()`;
    return this.page.evaluate(script);
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
}
