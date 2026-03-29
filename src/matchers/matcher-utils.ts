/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Shared matcher utilities for UI5 control property and aggregation access.
 *
 * @remarks
 * Extracted from duplicated code in `table-matchers.ts` and `ui5-matchers.ts`.
 * Provides browser-context helpers via `page.evaluate()` for reading control
 * properties, aggregations, bindings, and metadata.
 *
 * @module matchers
 */

import type { BridgeControlRef, MethodExecutionResult } from '#bridge/bridge-types.js';
import { createExecuteMethodScript } from '#bridge/browser-scripts/execute-method.js';
import { ensureBridgeInjected } from '#bridge/injection.js';
import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

/**
 * Minimal page interface for matcher operations.
 *
 * @remarks
 * Decouples matchers from full Playwright Page, enabling unit testing
 * with lightweight mock objects.
 *
 * @example
 * ```typescript
 * const page: MatcherPage = { evaluate: async (script) => ({}) };
 * ```
 */
export interface MatcherPage {
  /** Executes a script in the browser context and returns the result. */
  evaluate<TResult>(script: string, arg?: unknown): Promise<TResult>;
}

/**
 * Binding info returned from a UI5 control property.
 *
 * @example
 * ```typescript
 * const info: UI5BindingInfo = {
 *   path: '/ProductName',
 *   model: '',
 *   value: 'Widget A',
 * };
 * ```
 */
export interface UI5BindingInfo {
  /** The binding path (e.g., '/ProductName', 'Name'). */
  readonly path: string;
  /** The model name (empty string for default model). */
  readonly model: string;
  /** The current bound value. */
  readonly value: unknown;
}

/**
 * Retrieves a control property via `page.evaluate()` using the bridge.
 *
 * @intent Read a single property value from a UI5 control for matcher assertions.
 *
 * @remarks
 * Ensures the bridge is injected, then executes the getter method for
 * the given property on the target control. Mirrors the logic from
 * `ClassicUI5Adapter.getControlProperty()`.
 *
 * @param page - The page (or minimal MatcherPage) to evaluate on.
 * @param controlId - The ID of the UI5 control.
 * @param propertyName - The property to read (e.g., `'text'`, `'visible'`).
 * @returns The property value from the browser context.
 *
 * @example
 * ```typescript
 * const value = await getControlProperty(page, 'btn1', 'text');
 * ```
 */
export async function getControlProperty(
  page: MatcherPage,
  controlId: string,
  propertyName: string,
): Promise<unknown> {
  try {
    await ensureBridgeInjected(page as never);
    const methodName = `get${propertyName.charAt(0).toUpperCase()}${propertyName.slice(1)}`;
    const script = createExecuteMethodScript();
    const withArgs = script.replace(
      /\)\(\)$/,
      `)(${JSON.stringify(controlId)}, ${JSON.stringify(methodName)}, [])`,
    );
    const result = await page.evaluate<MethodExecutionResult>(withArgs);
    return result.value;
  } catch (error: unknown) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Failed to read property '${propertyName}' from control '${controlId}'`,
      attempted: `getControlProperty('${controlId}', '${propertyName}')`,
      retryable: true,
      details: {
        controlId,
        propertyName,
        cause: error instanceof Error ? error.message : String(error),
      },
      suggestions: [
        'Verify the control ID exists in the UI5 view',
        'Check if the page has fully loaded',
        'Ensure the bridge is properly injected',
      ],
    });
  }
}

/**
 * Retrieves a control aggregation via `page.evaluate()` using the bridge.
 *
 * @intent Read an aggregation (child controls) from a UI5 control for table/list assertions.
 *
 * @remarks
 * Ensures the bridge is injected, then executes the getter method for
 * the given aggregation on the target control. Returns an array of
 * {@link BridgeControlRef} objects.
 *
 * @param page - The page (or minimal MatcherPage) to evaluate on.
 * @param controlId - The ID of the UI5 control.
 * @param aggregationName - The aggregation to read (e.g., `'items'`, `'cells'`).
 * @returns An array of control references from the browser context.
 *
 * @example
 * ```typescript
 * const rows = await getControlAggregation(page, 'table1', 'items');
 * ```
 */
export async function getControlAggregation(
  page: MatcherPage,
  controlId: string,
  aggregationName: string,
): Promise<readonly BridgeControlRef[]> {
  try {
    await ensureBridgeInjected(page as never);
    const methodName = `get${aggregationName.charAt(0).toUpperCase()}${aggregationName.slice(1)}`;
    const script = createExecuteMethodScript();
    const withArgs = script.replace(
      /\)\(\)$/,
      `)(${JSON.stringify(controlId)}, ${JSON.stringify(methodName)}, [])`,
    );
    const result = await page.evaluate<MethodExecutionResult>(withArgs);

    if (
      result.returnType === 'aggregation' &&
      result.uuids !== undefined &&
      result.objectTypes !== undefined
    ) {
      const types = result.objectTypes;
      return result.uuids.map((id, i) => ({
        id,
        // eslint-disable-next-line security/detect-object-injection
        controlType: types[i] ?? 'unknown',
      }));
    }
    return [];
  } catch (error: unknown) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `Failed to read aggregation '${aggregationName}' from control '${controlId}'`,
      attempted: `getControlAggregation('${controlId}', '${aggregationName}')`,
      retryable: true,
      details: {
        controlId,
        aggregationName,
        cause: error instanceof Error ? error.message : String(error),
      },
      suggestions: [
        'Verify the control ID exists',
        'Check the aggregation name is correct',
        'Ensure the bridge is properly injected',
      ],
    });
  }
}

/**
 * Retrieves UI5 binding info for a property on a control.
 *
 * @intent Inspect the data binding configuration of a UI5 control property.
 *
 * @remarks
 * Uses an inline browser script to call `getBindingInfo()` and `getBinding()`
 * on the target control. Returns binding path, model name, and current value.
 *
 * @param page - The page (or minimal MatcherPage) to evaluate on.
 * @param controlId - The ID of the UI5 control.
 * @param propertyName - The property to check binding for.
 * @returns Binding info or `null` if no binding exists.
 *
 * @example
 * ```typescript
 * const info = await getUI5BindingInfo(page, 'input1', 'value');
 * if (info) {
 *   logger.info(info.path); // e.g., '/ProductName'
 * }
 * ```
 */
export async function getUI5BindingInfo(
  page: MatcherPage,
  controlId: string,
  propertyName: string,
): Promise<UI5BindingInfo | null> {
  try {
    await ensureBridgeInjected(page as never);
    const script = `(function() {
      try {
        var ctrl = sap.ui.getCore().byId(${JSON.stringify(controlId)});
        if (!ctrl) return null;
        var bindingInfo = ctrl.getBindingInfo(${JSON.stringify(propertyName)});
        if (!bindingInfo) return null;
        var binding = ctrl.getBinding(${JSON.stringify(propertyName)});
        return {
          path: bindingInfo.path || (bindingInfo.parts && bindingInfo.parts[0] && bindingInfo.parts[0].path) || '',
          model: bindingInfo.model || (bindingInfo.parts && bindingInfo.parts[0] && bindingInfo.parts[0].model) || '',
          value: binding ? binding.getValue() : undefined
        };
      } catch (e) {
        return null;
      }
    })()`;
    return await page.evaluate<UI5BindingInfo | null>(script);
  } catch (error: unknown) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Failed to read binding info for property '${propertyName}' on control '${controlId}'`,
      attempted: `getUI5BindingInfo('${controlId}', '${propertyName}')`,
      retryable: true,
      details: {
        controlId,
        propertyName,
        cause: error instanceof Error ? error.message : String(error),
      },
      suggestions: ['Verify the control ID exists', 'Ensure the property has a data binding'],
    });
  }
}

/**
 * Retrieves the fully qualified UI5 control type for a given control ID.
 *
 * @intent Determine the runtime UI5 control class for type-based assertions.
 *
 * @remarks
 * Uses an inline browser script to call `getMetadata().getName()` on the
 * target control. Returns the full type string (e.g., `'sap.m.Button'`)
 * or `null` if the control is not found.
 *
 * @param page - The page (or minimal MatcherPage) to evaluate on.
 * @param controlId - The ID of the UI5 control.
 * @returns The fully qualified type string or `null`.
 *
 * @example
 * ```typescript
 * const type = await getUI5ControlType(page, 'btn1');
 * // type === 'sap.m.Button'
 * ```
 */
export async function getUI5ControlType(
  page: MatcherPage,
  controlId: string,
): Promise<string | null> {
  try {
    await ensureBridgeInjected(page as never);
    const script = `(function() {
      try {
        var ctrl = sap.ui.getCore().byId(${JSON.stringify(controlId)});
        if (!ctrl) return null;
        var meta = ctrl.getMetadata();
        return meta ? meta.getName() : null;
      } catch (e) {
        return null;
      }
    })()`;
    return await page.evaluate<string | null>(script);
  } catch (error: unknown) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Failed to read control type for '${controlId}'`,
      attempted: `getUI5ControlType('${controlId}')`,
      retryable: true,
      details: { controlId, cause: error instanceof Error ? error.message : String(error) },
      suggestions: ['Verify the control ID exists in the UI5 view'],
    });
  }
}

/** Default polling interval for auto-retry matchers (ms). */
const MATCHER_POLL_INTERVAL = 100;

/** Default timeout for auto-retry matchers (ms). */
const MATCHER_DEFAULT_TIMEOUT = 5000;

/**
 * Result shape for matcher check functions (avoids circular import).
 */
export interface PollableMatcherResult {
  readonly pass: boolean;
  readonly message: () => string;
  readonly actual?: unknown;
  readonly expected?: unknown;
}

/**
 * Retries a matcher check function until it passes or the timeout expires.
 *
 * @intent Implement web-first auto-retry polling for asynchronous UI5 matcher checks.
 *
 * @remarks
 * Implements web-first auto-retry behavior for custom UI5 matchers.
 * Polls the check function at {@link MATCHER_POLL_INTERVAL} intervals
 * until either `pass === true` or the timeout is reached. Returns the
 * last result (pass or fail).
 *
 * @param checkFn - Async function returning a matcher result.
 * @param timeout - Maximum retry time in ms (default: 5000).
 * @returns The last matcher result after retrying.
 *
 * @example
 * ```typescript
 * const result = await pollUntilPass(
 *   () => checkUI5Text(page, 'btn1', 'Save'),
 *   10_000,
 * );
 * ```
 */
export async function pollUntilPass(
  checkFn: () => Promise<PollableMatcherResult>,
  timeout?: number,
): Promise<PollableMatcherResult> {
  const deadline = Date.now() + (timeout ?? MATCHER_DEFAULT_TIMEOUT);
  let lastResult = await checkFn();

  while (!lastResult.pass && Date.now() < deadline) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, MATCHER_POLL_INTERVAL);
    });
    lastResult = await checkFn();
  }

  return lastResult;
}
