/**
 * Single unified Proxy handler for UI5 controls (D16).
 *
 * @remarks
 * Replaces dhikraft's double-proxy with a single `new Proxy()` and one handler.
 * The `get` trap routes access through:
 * 1. Anti-thenable (`then`/`catch`/`finally` return `undefined`)
 * 2. Direct properties (`id`, `controlType`)
 * 3. Built-in methods (`getId`, `getControlType`, `getProperty`, etc.)
 * 4. Blacklist check (throws ControlError)
 * 5. Symbol handling (`toString`, `Symbol.toPrimitive`)
 * 6. Dynamic method forwarding via adapter
 *
 * @example
 * ```typescript
 * import { createControlProxy } from '#proxy/dynamic-proxy.js';
 *
 * const proxy = createControlProxy({
 *   id: 'saveBtn',
 *   controlType: 'sap.m.Button',
 *   methods: new Set(['getText', 'setText']),
 *   adapter,
 * });
 * const text = await proxy.getText();
 * ```
 *
 * @module proxy
 */

import { handleBridgeReturn } from './return-handler.js';

import type { BridgeAdapter } from '#bridge/adapter.js';
import type { MethodExecutionResult } from '#bridge/bridge-types.js';
import { isBlacklisted } from '#bridge/method-blacklist.js';
import { ControlError } from '#core/errors/control-error.js';
import type { UI5ControlBase } from '#core/types/controls.js';

/** Anti-thenable property names — return `undefined` to prevent auto-await. */
const ANTI_THENABLE = new Set(['then', 'catch', 'finally']);

/**
 * State required to create a control proxy.
 *
 * @example
 * ```typescript
 * const state: ControlProxyState = {
 *   id: 'saveBtn',
 *   controlType: 'sap.m.Button',
 *   methods: new Set(['getText', 'setText']),
 *   adapter,
 * };
 * ```
 */
export interface ControlProxyState {
  /** UI5 control ID. */
  readonly id: string;
  /** Fully qualified control type. */
  readonly controlType: string;
  /** Known methods available on this control. */
  readonly methods: ReadonlySet<string>;
  /** Bridge adapter for method execution. */
  readonly adapter: BridgeAdapter;
}

/**
 * Creates a method function that forwards to the bridge adapter.
 */
function createMethodForwarder(
  state: ControlProxyState,
  methodName: string,
): (...args: unknown[]) => Promise<unknown> {
  return async (...args: unknown[]): Promise<unknown> => {
    const result = (await state.adapter.executeControlMethod(
      state.id,
      methodName,
      args,
    )) as MethodExecutionResult;
    return handleBridgeReturn(result);
  };
}

/**
 * Returns the display string for this proxy.
 */
function proxyToString(state: ControlProxyState): string {
  return `[UI5Control ${state.controlType}#${state.id}]`;
}

/* eslint-disable @typescript-eslint/require-await -- built-in stubs return Promises without await */

/** Map of built-in UI5ControlBase method names to their implementations. */
function resolveBuiltinMethod(
  prop: string,
  state: ControlProxyState,
): ((...args: never[]) => Promise<unknown>) | undefined {
  switch (prop) {
    case 'getId':
      return async () => state.id;
    case 'getControlType':
      return async () => state.controlType;
    case 'getProperty':
      return async (name: string) => state.adapter.getControlProperty(state.id, name);
    case 'setProperty':
      return async (name: string, value: unknown) =>
        state.adapter.setControlProperty(state.id, name, value);
    case 'getAggregation':
      return async (name: string) => state.adapter.getControlAggregation(state.id, name);
    case 'getBindingInfo':
      return async () => undefined;
    case 'getDomRef':
      return async () => null;
    case 'getVisible':
      return async () => true;
    case 'isBound':
      return async () => false;
    case 'getModel':
      return async (name?: string) => state.adapter.getModel(state.id, name);
    default:
      return undefined;
  }
}

/* eslint-enable @typescript-eslint/require-await */

/**
 * Creates a single unified Proxy for a UI5 control.
 *
 * @param state - The control state including ID, type, methods, and adapter.
 * @returns A UI5ControlBase proxy that routes method calls through the bridge.
 *
 * @example
 * ```typescript
 * const proxy = createControlProxy({
 *   id: 'saveBtn',
 *   controlType: 'sap.m.Button',
 *   methods: new Set(['getText']),
 *   adapter: myAdapter,
 * });
 * const text = await proxy.getText(); // Forwarded to bridge
 * ```
 */
export function createControlProxy(state: ControlProxyState): UI5ControlBase {
  const target = Object.preventExtensions({
    id: state.id,
    controlType: state.controlType,
  }) as UI5ControlBase;

  return new Proxy(target, {
    get(_target, prop: string | symbol): unknown {
      if (typeof prop === 'symbol') {
        return prop === Symbol.toPrimitive ? () => proxyToString(state) : undefined;
      }

      if (ANTI_THENABLE.has(prop)) return undefined;
      if (prop === 'id') return state.id;
      if (prop === 'controlType') return state.controlType;

      const builtin = resolveBuiltinMethod(prop, state);
      if (builtin !== undefined) return builtin;

      if (prop === 'toString' || prop === 'toJSON') {
        return () => proxyToString(state);
      }

      if (isBlacklisted(prop)) {
        throw new ControlError({
          code: 'ERR_CONTROL_METHOD',
          message: `Method '${prop}' is blacklisted and cannot be called on ${state.controlType}#${state.id}`,
          attempted: `Call blacklisted method '${prop}'`,
          retryable: false,
          suggestions: [
            `Method '${prop}' is an internal UI5 method that should not be called directly`,
            'Use the appropriate public API method instead',
          ],
        });
      }

      return createMethodForwarder(state, prop);
    },

    isExtensible(): boolean {
      return false;
    },

    preventExtensions(): boolean {
      return true;
    },
  });
}
