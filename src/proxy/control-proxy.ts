/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/* eslint-disable max-lines -- Self-contained browser scripts + inline return handler cannot be split */
/**
 * Unified control proxy — single Proxy handler with direct page.evaluate().
 *
 * @remarks
 * mk-inspired: one Proxy, one get trap, direct `page.evaluate()` calls.
 * Method forwarder functions are cached per method name (wdi5 insight).
 * Inline 7-type return handler creates sub-proxies without a separate file.
 * Fluent chaining via thenable proxies enables `await control.getParent().getText()`.
 *
 * Get trap routing order:
 * 1. Symbol handling (`Symbol.toPrimitive`, etc.)
 * 2. Anti-thenable (`then`/`catch`/`finally` → undefined)
 * 3. Direct properties (`id`, `controlType`)
 * 4. Built-in overrides (`getId`, `getControlType`, `getAggregation`)
 * 5. toString / toJSON
 * 6. Explicit interaction (`press`, `enterText`, `select`)
 * 7. Blacklist check (throws ControlError)
 * 8. Dynamic method forwarder (cached, returns chainable result)
 *
 * File exceeds 300 LOC: contains self-contained browser scripts for introspection
 * (GAP-16) that cannot reference Node-side imports and must be co-located.
 *
 * @example
 * ```typescript
 * import { createControlProxy } from '#proxy/control-proxy.js';
 *
 * const proxy = createControlProxy({
 *   id: 'saveBtn',
 *   controlType: 'sap.m.Button',
 *   methods: new Set(['getText', 'press']),
 *   page: playwrightPage,
 *   interactionStrategy: strategy,
 * });
 * // Direct await:
 * const text = await proxy.getText();
 * // Fluent chaining:
 * const parentText = await proxy.getParent().getText();
 * ```
 *
 * @module proxy
 */

import type { Locator, Page } from '@playwright/test';

import { UI5Object } from './ui5-object.js';

import { BRIDGE_GLOBALS } from '#bridge/bridge-constants.js';
import type { MethodExecutionResult } from '#bridge/bridge-types.js';
import { browserExecuteControlMethod } from '#bridge/browser-scripts/execute-method-fn.js';
import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';
import { isBlacklisted } from '#bridge/method-blacklist.js';
import { BridgeError } from '#core/errors/bridge-error.js';
import { ControlError } from '#core/errors/control-error.js';
import type { UI5ControlBase } from '#core/types/controls.js';
import { assertNever } from '#core/utils/assert-never.js';

/** Anti-thenable property names — return `undefined` to prevent auto-await. */
const ANTI_THENABLE = new Set(['then', 'catch', 'finally']);

/** Max retries for page.evaluate when execution context is destroyed. */
const MAX_CONTEXT_RETRIES = 3;

/** Delay between retries in ms — long enough for SAP to establish new context. */
const CONTEXT_RETRY_DELAY = 2500;

/**
 * Detects "execution context destroyed" errors from Playwright.
 *
 * @remarks
 * SAP environments frequently destroy execution contexts during background
 * operations (IAS token refresh, WalkMe injection, FLP analytics).
 * These are transient — retrying after a short delay typically succeeds.
 */
function isContextDestroyedError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('Execution context was destroyed');
  }
  return false;
}

/** Promise-like property names that delegate to the underlying promise. */
const PROMISE_PROPS = new Set(['then', 'catch', 'finally']);

/**
 * Wraps a `Promise` in a thenable proxy that enables fluent method chaining.
 *
 * @remarks
 * The returned object satisfies the Promise protocol (`then`/`catch`/`finally`),
 * so `await` resolves it normally. Property access on the result returns a
 * function that, when called, creates a new chainable result — enabling
 * patterns like `await control.getParent().getText()`.
 *
 * Chain depth is unlimited. Non-proxy results (primitives, plain objects
 * without the accessed method) terminate the chain gracefully with `undefined`.
 *
 * @param promise - The underlying promise to wrap.
 * @returns A thenable proxy supporting fluent method chaining.
 *
 * @example
 * ```typescript
 * const chainable = createChainableResult(someAsyncCall());
 * // Await directly:
 * const value = await chainable;
 * // Or chain:
 * const nested = await chainable.getChild().getName();
 * ```
 */
function createChainableResult(promise: Promise<unknown>): unknown {
  const target = { _promise: promise };
  return new Proxy(target, {
    get(_proxyTarget, prop: string | symbol): unknown {
      // Symbols: delegate to the promise (e.g., Symbol.toStringTag)
      if (typeof prop === 'symbol') {
        return Reflect.get(promise, prop);
      }

      // Promise protocol: delegate to the underlying promise
      if (PROMISE_PROPS.has(prop)) {
        const promiseMethod = Reflect.get(promise, prop) as (...args: unknown[]) => unknown;
        return (...args: unknown[]) => Reflect.apply(promiseMethod, promise, args);
      }

      // Chain: return a function that creates a new chainable result.
      // When called, it awaits the current promise, accesses `prop` on the result,
      // and if it's a function, invokes it with the provided arguments.
      return (...args: unknown[]): unknown =>
        createChainableResult(
          (async () => {
            const resolved = await promise;
            if (resolved !== null && resolved !== undefined && typeof resolved === 'object') {
              // Type assertions: resolved is confirmed non-null object above; member is checked as function before invocation
              const member = Reflect.get(resolved as Record<string, unknown>, prop);
              if (typeof member === 'function') {
                return (member as (...fnArgs: unknown[]) => unknown)(...args);
              }
            }
            return undefined;
          })(),
        );
    },
  });
}

/**
 * State required to create a control proxy.
 *
 * @remarks
 * All fields are required — no optional adapter or page. The proxy calls
 * `page.evaluate()` directly (mk pattern), eliminating the adapter layer.
 *
 * @example
 * ```typescript
 * const state: ControlProxyState = {
 *   id: 'saveBtn',
 *   controlType: 'sap.m.Button',
 *   methods: new Set(['getText', 'press']),
 *   page: playwrightPage,
 *   interactionStrategy: strategy,
 * };
 * ```
 */
export interface ControlProxyState {
  /** UI5 control ID. */
  readonly id: string;
  /** Fully qualified control type (e.g., `'sap.m.Button'`). */
  readonly controlType: string;
  /** Known methods available on this control (informational). */
  readonly methods: ReadonlySet<string>;
  /** Playwright Page for direct browser calls. */
  readonly page: Page;
  /** Interaction strategy for press/enterText/select. */
  readonly interactionStrategy: InteractionStrategy;
  /**
   * When `true`, sub-proxies created from method returns skip UI5 stability waits.
   *
   * @remarks
   * Propagated to all sub-proxies (element, newElement, aggregation) so that
   * chained calls on returned controls also skip stability checks.
   */
  readonly skipStabilityWait?: boolean | undefined;
}

/**
 * Metadata extracted from a UI5 control's metadata object.
 *
 * @intent Provide a structured representation of a UI5 control's metadata for discovery and introspection.
 *
 * @remarks
 * Returned by the `getControlMetadata()` proxy method. Contains the control's
 * class name and the names of all properties, aggregations, and events declared
 * in the metadata (including inherited ones from the prototype chain).
 *
 * This is a **discovery API** — use it to inspect unknown controls at runtime,
 * enumerate available properties for assertion, or verify control types in tests.
 *
 * @example
 * ```typescript
 * const meta = await control.getControlMetadata();
 * logger.info(meta.className); // 'sap.m.Button'
 * logger.info(meta.properties); // ['text', 'enabled', 'type', 'icon']
 * logger.info(meta.aggregations); // ['content', 'tooltip', 'customData']
 * logger.info(meta.events); // ['press', 'tap']
 * ```
 */
export interface ControlMetadataResult {
  /** Fully qualified class name (e.g., `'sap.m.Button'`). */
  readonly className: string;
  /** All property names (own + inherited). */
  readonly properties: readonly string[];
  /** All aggregation names (own + inherited). */
  readonly aggregations: readonly string[];
  /** All event names (own + inherited). */
  readonly events: readonly string[];
}

/**
 * Full introspection info for a UI5 control — metadata plus prototype methods.
 *
 * @intent Provide complete runtime introspection of a UI5 control including all callable methods.
 *
 * @remarks
 * Returned by the `getControlInfoFull()` proxy method. Extends metadata with
 * the control's ID and a list of all methods found on its prototype chain
 * (filtered to exclude internal/blacklisted members like `_*`, `*Render`,
 * and `constructor`).
 *
 * This is a **discovery API** — use it to inspect unknown controls, enumerate
 * available methods for dynamic invocation, or build AI-driven test generation
 * that adapts to the control's capabilities at runtime.
 *
 * @example
 * ```typescript
 * const info = await control.getControlInfoFull();
 * logger.info(info.id); // 'saveBtn'
 * logger.info(info.controlType); // 'sap.m.Button'
 * logger.info(info.methods); // ['getText', 'setText', 'getEnabled', ...]
 * logger.info(info.properties); // ['text', 'enabled', 'type', 'icon']
 * logger.info(info.aggregations); // ['content', 'tooltip', 'customData']
 * logger.info(info.events); // ['press', 'tap']
 * ```
 */
export interface ControlInfoFull {
  /** UI5 control ID. */
  readonly id: string;
  /** Fully qualified control type. */
  readonly controlType: string;
  /** Method names from the prototype chain (excluding internal/blacklisted). */
  readonly methods: readonly string[];
  /** All property names (own + inherited). */
  readonly properties: readonly string[];
  /** All aggregation names (own + inherited). */
  readonly aggregations: readonly string[];
  /** All event names (own + inherited). */
  readonly events: readonly string[];
}

/**
 * Inline 7-type return handler — routes bridge results to values or sub-proxies.
 *
 * @remarks
 * Replaces the separate `return-handler.ts` + `proxy-converter.ts` files.
 * Creates sub-proxies for element, newElement, aggregation, and object returns.
 */
async function handleReturn(
  result: MethodExecutionResult,
  state: ControlProxyState,
): Promise<unknown> {
  if (!result.success) {
    throw new BridgeError({
      code: 'ERR_BRIDGE_EXECUTION',
      message: result.error ?? 'Bridge method execution failed',
      attempted: `Execute method on ${state.controlType}#${state.id}`,
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
    case 'empty': {
      return [];
    }
    case 'none':
    case 'unknown': {
      return undefined;
    }
    case 'element': {
      const ref = result.value as { readonly id: string } | undefined;
      if (ref === undefined) return undefined;
      return createControlProxy({
        id: ref.id,
        controlType: state.controlType,
        methods: state.methods,
        page: state.page,
        interactionStrategy: state.interactionStrategy,
        skipStabilityWait: state.skipStabilityWait,
      });
    }
    case 'newElement': {
      const ref = result.value as
        | { readonly id: string; readonly controlType?: string }
        | undefined;
      if (ref === undefined) return undefined;
      return createControlProxy({
        id: ref.id,
        controlType: ref.controlType ?? 'unknown',
        methods: new Set<string>(),
        page: state.page,
        interactionStrategy: state.interactionStrategy,
        skipStabilityWait: state.skipStabilityWait,
      });
    }
    case 'aggregation': {
      const controlIds = result.uuids ?? [];
      const types = result.objectTypes ?? [];
      return controlIds.map((id, idx) => {
        const controlType = types.at(idx) ?? 'unknown';
        return createControlProxy({
          id,
          controlType,
          methods: new Set<string>(),
          page: state.page,
          interactionStrategy: state.interactionStrategy,
          skipStabilityWait: state.skipStabilityWait,
        });
      });
    }
    case 'object': {
      const uuid = result.uuid ?? '';
      const objectType = result.objectType ?? 'unknown';
      const obj = await UI5Object.create({ uuid, type: objectType, page: state.page });
      return obj.toProxy();
    }
    case 'objectArray': {
      // GAP-11: Array of non-serializable objects — create a UI5Object proxy for each.
      const arrayUuids = result.uuids ?? [];
      const arrayTypes = result.objectTypes ?? [];
      return Promise.all(
        arrayUuids.map(async (itemUuid, idx) => {
          const itemType = arrayTypes.at(idx) ?? 'unknown';
          if (itemUuid === '') return null;
          const sub = await UI5Object.create({ uuid: itemUuid, type: itemType, page: state.page });
          return sub.toProxy();
        }),
      );
    }
    default:
      return assertNever(result.returnType);
  }
}

/** Returns the display string for a control proxy. */
function proxyToString(state: ControlProxyState): string {
  return `[UI5Control ${state.controlType}#${state.id}]`;
}

/**
 * Resolves known property names to their handlers.
 *
 * @remarks
 * Uses a switch (SonarJS complexity +1) instead of separate ifs (+7).
 * Covers built-in overrides, toString/toJSON, getAggregation bypass,
 * and explicit interaction methods.
 *
 * @returns The resolved handler, or `undefined` if the property is not known.
 */
function resolveKnownProperty(
  prop: string,
  state: ControlProxyState,
  getOrCreateForwarder: (name: string) => (...args: unknown[]) => unknown,
): unknown {
  switch (prop) {
    case 'getId':
      // eslint-disable-next-line @typescript-eslint/require-await -- returns local state synchronously
      return async () => state.id;
    case 'getControlType':
      // eslint-disable-next-line @typescript-eslint/require-await -- returns local state synchronously
      return async () => state.controlType;
    case 'getAggregation':
      return getOrCreateForwarder('getAggregation');
    case 'toLocator':
      return async (): Promise<Locator> => {
        const domId = await state.page.evaluate(
          /* v8 ignore start -- browser-context function: runs in Chromium, not Node.js */
          ({ controlId, bridgeNs }) => {
            const bridge = Reflect.get(window, bridgeNs) as Record<string, unknown> | undefined;
            if (bridge === undefined) return null;
            const getById = bridge['getById'] as
              | ((id: string) => Record<string, unknown> | null)
              | undefined;
            if (getById === undefined) return null;
            const ctrl = getById(controlId);
            if (ctrl === null) return null;
            const getDomRef = ctrl['getDomRef'] as (() => HTMLElement | null) | undefined;
            if (getDomRef === undefined) return null;
            const domRef = getDomRef.call(ctrl);
            return domRef?.id ?? null;
          },
          /* v8 ignore stop */
          { controlId: state.id, bridgeNs: BRIDGE_GLOBALS.NAMESPACE },
        );
        if (domId === null) {
          throw new ControlError({
            code: 'ERR_CONTROL_NO_DOM_REF',
            message: `Control ${state.controlType}#${state.id} has no DOM reference`,
            attempted: 'Convert control proxy to Playwright locator',
            retryable: false,
            suggestions: [
              'Ensure the control is rendered and visible',
              'Wait for UI5 stability before calling toLocator()',
            ],
          });
        }
        return state.page.locator(`#${CSS.escape(domId)}`);
      };
    case 'toString':
    case 'toJSON':
      return () => proxyToString(state);
    case 'press':
      return async () => state.interactionStrategy.press(state.page, state.id);
    case 'enterText':
      return async (text: string) =>
        state.interactionStrategy.enterText(state.page, state.id, text);
    case 'select':
      return async (itemId: string) =>
        state.interactionStrategy.select(state.page, state.id, itemId);
    case 'exec':
      // Security: exec() serializes `fn` via .toString() and reconstructs it in the
      // browser via new Function(). This is safe in the Playwright test context because
      // page.evaluate() itself already permits arbitrary browser-side code execution.
      // However, never pass unsanitized external input as the `fn` parameter — always
      // use a function literal. External data should be passed via `args`, which are
      // safely serialized through Playwright's structured clone transfer.
      return async (
        fn: (...execArgs: unknown[]) => unknown,
        ...args: unknown[]
      ): Promise<unknown> => {
        const fnString = fn.toString();
        return state.page.evaluate(
          /* v8 ignore start -- browser-context function: runs in Chromium, not Node.js */
          ({ controlId, bridgeNs, fnBody, execArgs: browserArgs }) => {
            const bridge = Reflect.get(window, bridgeNs) as Record<string, unknown> | undefined;
            // eslint-disable-next-line sonarjs/no-duplicate-string -- self-contained browser function cannot reference Node-side constants
            if (bridge === undefined) throw new Error('Bridge not initialized');
            const getById = bridge['getById'] as
              | ((id: string) => Record<string, unknown> | null)
              | undefined;
            // eslint-disable-next-line sonarjs/no-duplicate-string -- self-contained browser function cannot reference Node-side constants
            if (getById === undefined) throw new Error('Bridge getById not available');
            const ctrl = getById(controlId);
            // eslint-disable-next-line sonarjs/no-duplicate-string -- self-contained browser function cannot reference Node-side constants
            if (ctrl === null) throw new Error('Control not found: ' + controlId);
            // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call, sonarjs/code-eval -- intentional: exec() deserializes user function in browser context
            const userFn = new Function('return (' + fnBody + ')')() as (
              ...a: unknown[]
            ) => unknown;
            return userFn(ctrl, ...browserArgs);
          },
          /* v8 ignore stop */
          {
            controlId: state.id,
            bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
            fnBody: fnString,
            execArgs: [...args],
          },
        );
      };
    case 'renewWebElementReference':
      return async (): Promise<void> => {
        const exists = await state.page.evaluate(
          /* v8 ignore start -- browser-context function: runs in Chromium, not Node.js */
          ({ controlId, bridgeNs }) => {
            const bridge = Reflect.get(window, bridgeNs) as Record<string, unknown> | undefined;
            if (bridge === undefined) return false;
            const getById = bridge['getById'] as
              | ((id: string) => Record<string, unknown> | null)
              | undefined;
            if (getById === undefined) return false;
            const ctrl = getById(controlId);
            return ctrl !== null;
          },
          /* v8 ignore stop */
          { controlId: state.id, bridgeNs: BRIDGE_GLOBALS.NAMESPACE },
        );
        if (!exists) {
          throw new ControlError({
            code: 'ERR_CONTROL_NOT_FOUND',
            message: `Control no longer exists in UI5 registry: ${state.id}`,
            attempted: `Verify control exists: ${state.controlType}#${state.id}`,
            retryable: false,
            suggestions: [
              'The control may have been destroyed by a navigation or view change',
              'Re-discover the control using its selector',
              'Check if the page has fully loaded (waitForUI5Stable)',
            ],
          });
        }
      };
    // Discovery API: Returns structured metadata (className, properties, aggregations, events)
    // from the UI5 control's metadata object via the browser-side bridge.
    case 'getControlMetadata':
      return async (): Promise<ControlMetadataResult> =>
        state.page.evaluate(
          /* v8 ignore start -- browser-context function: runs in Chromium, not Node.js */
          ({ controlId, bridgeNs }) => {
            const bridge = Reflect.get(window, bridgeNs) as Record<string, unknown> | undefined;
            if (bridge === undefined) throw new Error('Bridge not initialized');
            const getById = bridge['getById'] as
              | ((id: string) => Record<string, unknown> | null)
              | undefined;
            if (getById === undefined) throw new Error('Bridge getById not available');
            const ctrl = getById(controlId);
            if (ctrl === null) throw new Error('Control not found: ' + controlId);
            const getMetadata = ctrl['getMetadata'] as (() => Record<string, unknown>) | undefined;
            if (getMetadata === undefined) throw new Error('getMetadata not available on control');
            const meta = getMetadata.call(ctrl);
            const getName = meta['getName'] as (() => string) | undefined;
            const getAllProperties = meta['getAllProperties'] as
              | (() => Record<string, unknown>)
              | undefined;
            const getAllAggregations = meta['getAllAggregations'] as
              | (() => Record<string, unknown>)
              | undefined;
            const getAllEvents = meta['getAllEvents'] as
              | (() => Record<string, unknown>)
              | undefined;
            return {
              className: getName !== undefined ? getName.call(meta) : 'unknown',
              properties:
                getAllProperties !== undefined ? Object.keys(getAllProperties.call(meta)) : [],
              aggregations:
                getAllAggregations !== undefined ? Object.keys(getAllAggregations.call(meta)) : [],
              events: getAllEvents !== undefined ? Object.keys(getAllEvents.call(meta)) : [],
            };
          },
          /* v8 ignore stop */
          { controlId: state.id, bridgeNs: BRIDGE_GLOBALS.NAMESPACE },
        );
    // Discovery API: Full introspection — metadata + all callable prototype methods.
    // Walks the prototype chain and filters out internal (_*), render (*Render),
    // and constructor methods. Used by AI agents for dynamic test generation.
    case 'getControlInfoFull':
      return async (): Promise<ControlInfoFull> =>
        state.page.evaluate(
          /* v8 ignore start -- browser-context function: runs in Chromium, not Node.js */
          ({ controlId, bridgeNs }) => {
            const bridge = Reflect.get(window, bridgeNs) as Record<string, unknown> | undefined;
            if (bridge === undefined) throw new Error('Bridge not initialized');
            const getById = bridge['getById'] as
              | ((id: string) => Record<string, unknown> | null)
              | undefined;
            if (getById === undefined) throw new Error('Bridge getById not available');
            const ctrl = getById(controlId);
            if (ctrl === null) throw new Error('Control not found: ' + controlId);
            const getMetadata = ctrl['getMetadata'] as (() => Record<string, unknown>) | undefined;
            if (getMetadata === undefined) throw new Error('getMetadata not available on control');
            const meta = getMetadata.call(ctrl);
            const getName = meta['getName'] as (() => string) | undefined;
            const getAllProperties = meta['getAllProperties'] as
              | (() => Record<string, unknown>)
              | undefined;
            const getAllAggregations = meta['getAllAggregations'] as
              | (() => Record<string, unknown>)
              | undefined;
            const getAllEvents = meta['getAllEvents'] as
              | (() => Record<string, unknown>)
              | undefined;
            const methods = collectPrototypeMethods(ctrl);
            return {
              id: controlId,
              controlType: getName !== undefined ? getName.call(meta) : 'unknown',
              methods,
              properties:
                getAllProperties !== undefined ? Object.keys(getAllProperties.call(meta)) : [],
              aggregations:
                getAllAggregations !== undefined ? Object.keys(getAllAggregations.call(meta)) : [],
              events: getAllEvents !== undefined ? Object.keys(getAllEvents.call(meta)) : [],
            };

            /** Walks prototype chain collecting non-internal method names. */
            function collectPrototypeMethods(target: Record<string, unknown>): string[] {
              const result: string[] = [];
              const seen = new Set<string>();
              let proto: object | null = Object.getPrototypeOf(target) as object | null;
              while (proto !== null && proto !== Object.prototype) {
                for (const methodName of Object.getOwnPropertyNames(proto)) {
                  if (seen.has(methodName)) {
                    seen.add(methodName);
                    continue;
                  }
                  seen.add(methodName);
                  // eslint-disable-next-line security/detect-object-injection -- iterating own property names from Object.getOwnPropertyNames
                  const val = (proto as Record<string, unknown>)[methodName];
                  if (typeof val !== 'function') continue;
                  if (
                    methodName.startsWith('_') ||
                    methodName.endsWith('Render') ||
                    methodName === 'constructor'
                  )
                    continue;
                  result.push(methodName);
                }
                proto = Object.getPrototypeOf(proto) as object | null;
              }
              return result;
            }
          },
          /* v8 ignore stop */
          { controlId: state.id, bridgeNs: BRIDGE_GLOBALS.NAMESPACE },
        );
    // Discovery API: Returns only the method names from the control's prototype chain.
    // Lightweight alternative to getControlInfoFull when only method names are needed.
    case 'retrieveMembers':
      return async (): Promise<readonly string[]> =>
        state.page.evaluate(
          /* v8 ignore start -- browser-context function: runs in Chromium, not Node.js */
          ({ controlId, bridgeNs }) => {
            const bridge = Reflect.get(window, bridgeNs) as Record<string, unknown> | undefined;
            if (bridge === undefined) throw new Error('Bridge not initialized');
            const getById = bridge['getById'] as
              | ((id: string) => Record<string, unknown> | null)
              | undefined;
            if (getById === undefined) throw new Error('Bridge getById not available');
            const ctrl = getById(controlId);
            if (ctrl === null) throw new Error('Control not found: ' + controlId);
            return collectMethods(ctrl);

            /** Walks prototype chain collecting non-internal method names. */
            // eslint-disable-next-line sonarjs/no-identical-functions -- self-contained browser function; cannot share code with getControlInfoFull
            function collectMethods(target: Record<string, unknown>): string[] {
              const result: string[] = [];
              const seen = new Set<string>();
              let proto: object | null = Object.getPrototypeOf(target) as object | null;
              while (proto !== null && proto !== Object.prototype) {
                for (const methodName of Object.getOwnPropertyNames(proto)) {
                  if (seen.has(methodName)) {
                    seen.add(methodName);
                    continue;
                  }
                  seen.add(methodName);
                  // eslint-disable-next-line security/detect-object-injection -- iterating own property names from Object.getOwnPropertyNames
                  const val = (proto as Record<string, unknown>)[methodName];
                  if (typeof val !== 'function') continue;
                  if (
                    methodName.startsWith('_') ||
                    methodName.endsWith('Render') ||
                    methodName === 'constructor'
                  )
                    continue;
                  result.push(methodName);
                }
                proto = Object.getPrototypeOf(proto) as object | null;
              }
              return result;
            }
          },
          /* v8 ignore stop */
          { controlId: state.id, bridgeNs: BRIDGE_GLOBALS.NAMESPACE },
        );
    default:
      return undefined;
  }
}

/** Throws ControlError for blacklisted methods. */
function throwIfBlacklisted(prop: string, state: ControlProxyState): void {
  if (isBlacklisted(prop)) {
    throw new ControlError({
      code: 'ERR_CONTROL_METHOD',
      message: `Method '${prop}' is blacklisted on ${state.controlType}#${state.id}`,
      attempted: `Call blacklisted method '${prop}'`,
      retryable: false,
      suggestions: [
        `'${prop}' is an internal UI5 method — use the public API instead`,
        'For aggregations, use getAggregation(name) which is whitelisted',
      ],
    });
  }
}

/**
 * Creates a single unified Proxy for a UI5 control.
 *
 * @remarks
 * mk-style: constructor-free, single `new Proxy()` with one get trap.
 * Method forwarders are cached in a `Map` to avoid re-creation on repeated
 * access (wdi5 insight). All method calls go through `page.evaluate()` directly —
 * no adapter layer, no data loss.
 *
 * Dynamic method calls return chainable thenable proxies, enabling fluent
 * patterns like `await control.getParent().getText()`.
 *
 * @param state - Control state with ID, type, page, and interaction strategy.
 * @returns A `UI5ControlBase` proxy that routes method calls through the bridge.
 *
 * @example
 * ```typescript
 * const proxy = createControlProxy({
 *   id: 'saveBtn',
 *   controlType: 'sap.m.Button',
 *   methods: new Set(['getText', 'press']),
 *   page: playwrightPage,
 *   interactionStrategy: strategy,
 * });
 * // Direct await:
 * const text = await proxy.getText();
 * // Fluent chaining:
 * const parentText = await proxy.getParent().getText();
 * ```
 */
export function createControlProxy(state: ControlProxyState): UI5ControlBase {
  const forwarderCache = new Map<string, (...args: unknown[]) => unknown>();

  /** Wraps a non-PramanError into a structured BridgeError for page.evaluate failures. */
  function wrapEvaluateError(
    error: unknown,
    methodName: string,
    retriesExhausted: boolean,
  ): BridgeError {
    return new BridgeError({
      code: 'ERR_BRIDGE_EXECUTION',
      message: `page.evaluate() failed for ${methodName} on ${state.controlType}#${state.id}: ${error instanceof Error ? error.message : String(error)}`,
      attempted: `Execute ${methodName}() on control ${state.controlType}#${state.id}`,
      retryable: isContextDestroyedError(error) && !retriesExhausted,
      ...(error instanceof Error ? { cause: error } : {}),
      suggestions: [
        'The control may have been destroyed during navigation',
        'Check if the page context is still valid',
        'Ensure the bridge is injected before calling methods',
        'If this is a transient error, retry the operation',
      ],
    });
  }

  /** Executes a method via page.evaluate with context-destroyed retry logic. */
  async function executeMethod(methodName: string, args: unknown[]): Promise<unknown> {
    // Function-form page.evaluate uses CDP Runtime.callFunctionOn —
    // Playwright tracks execution context automatically, eliminating
    // "Execution context destroyed" on SAP context changes.
    // Retry still helps for transient errors during context transitions.
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_CONTEXT_RETRIES; attempt++) {
      try {
        const result = await state.page.evaluate(browserExecuteControlMethod, {
          controlId: state.id,
          methodName,
          args: [...args],
          bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
        });
        return await handleReturn(result, state);
      } catch (error: unknown) {
        if (!isContextDestroyedError(error) || attempt === MAX_CONTEXT_RETRIES - 1) {
          if (error instanceof BridgeError || error instanceof ControlError) {
            throw error; // Already a PramanError subclass
          }
          throw wrapEvaluateError(error, methodName, attempt === MAX_CONTEXT_RETRIES - 1);
        }
        lastError = error;
        await new Promise<void>((resolve) => {
          setTimeout(resolve, CONTEXT_RETRY_DELAY);
        });
      }
    }
    // Should never reach here, but satisfy TypeScript
    throw lastError instanceof Error
      ? new BridgeError({
          code: 'ERR_BRIDGE_EXECUTION',
          message: `All ${String(MAX_CONTEXT_RETRIES)} retries exhausted for ${methodName} on ${state.controlType}#${state.id}`,
          attempted: `Execute ${methodName}() with retry`,
          retryable: false,
          cause: lastError,
          suggestions: [
            'The execution context was repeatedly destroyed',
            'Consider reloading the page',
          ],
        })
      : lastError;
  }

  function getOrCreateForwarder(methodName: string): (...args: unknown[]) => unknown {
    let forwarder = forwarderCache.get(methodName);
    if (forwarder === undefined) {
      forwarder = (...args: unknown[]): unknown =>
        createChainableResult(executeMethod(methodName, args));
      forwarderCache.set(methodName, forwarder);
    }
    return forwarder;
  }

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

      const known = resolveKnownProperty(prop, state, getOrCreateForwarder);
      if (known !== undefined) return known;

      throwIfBlacklisted(prop, state);

      return getOrCreateForwarder(prop);
    },

    isExtensible(): boolean {
      return false;
    },

    preventExtensions(): boolean {
      return true;
    },
  });
}
