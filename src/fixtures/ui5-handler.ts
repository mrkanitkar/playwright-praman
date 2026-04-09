/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/* eslint-disable max-lines -- UI5Handler is the central fixture-layer class; 15+ cohesive public methods belong in one class */
/**
 * UI5Handler — internal class for UI5 control discovery, interaction, and lifecycle.
 *
 * @remarks
 * NOT exported from any barrel. Used internally by the `ui5` fixture.
 * Wraps page, cache, discovery, and interaction strategy into a clean API.
 * Uses Playwright's `Page` directly — no adapter abstraction.
 *
 * Each method follows the pattern:
 * 1. Validate selector (non-empty)
 * 2. Ensure bridge injected + wait for UI5 stability
 * 3. Discover control via strategy chain
 * 4. Execute action via page.evaluate() or interaction strategy
 *
 * @example
 * ```typescript
 * import { UI5Handler } from './ui5-handler.js';
 *
 * const handler = new UI5Handler({ page, interactionStrategy, discoveryStrategies: ['direct-id'] });
 * const button = await handler.control({ id: 'btn1' });
 * ```
 *
 * @module fixtures
 */

import type { Locator, Page } from '@playwright/test';

import { BRIDGE_GLOBALS, BRIDGE_TIMEOUTS } from '#bridge/bridge-constants.js';
import type {
  BridgeControlRef,
  ControlDiscoveryResult,
  ControlInspection,
  MethodExecutionResult,
} from '#bridge/bridge-types.js';
import { createExecuteMethodScript } from '#bridge/browser-scripts/execute-method.js';
import {
  createFindAllControlsScript,
  createFindControlScript,
} from '#bridge/browser-scripts/find-control.js';
import { createInspectControlScript } from '#bridge/browser-scripts/inspect-control.js';
import { ensureBridgeInjected } from '#bridge/injection.js';
import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';
import { filterMethods } from '#bridge/method-blacklist.js';
import type { DiscoveryStrategyName } from '#core/config/schema.js';
import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';
import { SelectorError } from '#core/errors/selector-error.js';
import { TimeoutError } from '#core/errors/timeout-error.js';
import { createLogger } from '#core/logging/index.js';
import type {
  MeterWrapper,
  MetricCounter,
  MetricHistogram,
  TracerWrapper,
} from '#core/telemetry/otel.js';
import { getNoOpMeter, getNoOpTracer } from '#core/telemetry/otel.js';
import { createSpanName } from '#core/telemetry/spans.js';
import type { UI5ControlBase, UI5ControlMap } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';
import { ui5Step } from '#core/utils/step-decorator.js';
import { createLocatorShim } from '#fixtures/locator-shim.js';
import { ControlProxyCache } from '#proxy/cache.js';
import { createControlProxy } from '#proxy/control-proxy.js';

const logger = createLogger('ui5-handler');

/** Default UI5 wait timeout in milliseconds. */
const DEFAULT_UI5_WAIT_TIMEOUT = 30_000;

/** Default control discovery timeout in milliseconds. */
const DEFAULT_DISCOVERY_TIMEOUT = 10_000;

/** Default polling interval for waitFor in milliseconds. */
const DEFAULT_POLL_INTERVAL = 250;

/**
 * Configuration options for UI5Handler.
 *
 * @ai
 * @aiContext Configuration for creating a UI5Handler instance.
 *
 * @example
 * ```typescript
 * const options: UI5HandlerOptions = {
 *   page,
 *   interactionStrategy,
 *   discoveryStrategies: ['direct-id', 'recordreplay'],
 * };
 * ```
 */
export interface UI5HandlerOptions {
  readonly page: Page;
  readonly interactionStrategy: InteractionStrategy;
  readonly discoveryStrategies: readonly DiscoveryStrategyName[];
  readonly config?: {
    readonly ui5WaitTimeout?: number;
    readonly controlDiscoveryTimeout?: number;
    readonly preferVisibleControls?: boolean;
    readonly skipStabilityWait?: boolean;
  };
  /** Optional tracer for OpenTelemetry instrumentation. Defaults to NoOpTracer. */
  readonly tracer?: TracerWrapper;
  /** Optional meter for OpenTelemetry metrics collection. Defaults to NoOpMeter. */
  readonly meter?: MeterWrapper;
}

/**
 * Validates that a selector has at least one meaningful property.
 *
 * @param selector - The UI5 selector to validate.
 * @throws SelectorError if the selector has no meaningful properties.
 */
function validateSelector(selector: UI5Selector): void {
  const hasProperty = Object.keys(selector).length > 0;
  if (!hasProperty) {
    throw new SelectorError({
      code: ErrorCode.ERR_SELECTOR_INVALID,
      message: 'Selector must have at least one property (id, controlType, properties, etc.)',
      attempted: 'Validate UI5 selector before discovery',
      retryable: false,
      suggestions: [
        'Provide at least an id, controlType, or properties matcher',
        'Example: { id: "btn1" } or { controlType: "sap.m.Button" }',
      ],
    });
  }
}

/**
 * Internal UI5Handler class with methods for control discovery, interaction, and lifecycle.
 *
 * @ai
 * @aiContext Main entry point for UI5 control interactions in tests.
 *
 * @capability ui5.control
 *
 * @example
 * ```typescript
 * const handler = new UI5Handler(options);
 * const button = await handler.control({ id: 'submitBtn' });
 * await handler.click({ id: 'submitBtn' });
 * ```
 */
export class UI5Handler {
  private readonly page: Page;
  private readonly strategy: InteractionStrategy;
  private readonly discoveryStrategies: readonly DiscoveryStrategyName[];
  private readonly ui5WaitTimeout: number;
  private readonly discoveryTimeout: number;
  private readonly preferVisibleControls: boolean;
  private readonly skipStabilityWait: boolean;
  private readonly tracer: TracerWrapper;
  private readonly bridgeInjectionCounter: MetricCounter;
  private readonly discoveryCounter: MetricCounter;
  private readonly discoveryDuration: MetricHistogram;
  private readonly bridgeEvalDuration: MetricHistogram;
  private cache: ControlProxyCache;

  constructor(options: UI5HandlerOptions) {
    this.page = options.page;
    this.strategy = options.interactionStrategy;
    this.discoveryStrategies = options.discoveryStrategies;
    this.ui5WaitTimeout = options.config?.ui5WaitTimeout ?? DEFAULT_UI5_WAIT_TIMEOUT;
    this.discoveryTimeout = options.config?.controlDiscoveryTimeout ?? DEFAULT_DISCOVERY_TIMEOUT;
    this.preferVisibleControls = options.config?.preferVisibleControls ?? true;
    this.skipStabilityWait = options.config?.skipStabilityWait ?? false;
    this.tracer = options.tracer ?? getNoOpTracer();
    this.cache = new ControlProxyCache();

    const meter = options.meter ?? getNoOpMeter();
    this.bridgeInjectionCounter = meter.createCounter(
      'praman.bridge.injection',
      'Number of bridge injection attempts',
    );
    this.discoveryCounter = meter.createCounter(
      'praman.control.discovery',
      'Number of control discovery attempts',
    );
    this.discoveryDuration = meter.createHistogram(
      'praman.control.discovery.duration',
      'Control discovery duration in milliseconds',
    );
    this.bridgeEvalDuration = meter.createHistogram(
      'praman.bridge.evaluation.duration',
      'Bridge page.evaluate() duration in milliseconds',
    );
  }

  /**
   * Ensures the bridge is injected before any browser operation.
   *
   * @remarks
   * Delegates to `ensureBridgeInjected()` which is idempotent.
   */
  private async ensureReady(): Promise<void> {
    this.bridgeInjectionCounter.add(1);
    await ensureBridgeInjected(this.page);
  }

  /**
   * Waits for UI5 to become stable via page.waitForFunction().
   *
   * @param timeout - Max wait time in ms.
   */
  private async internalWaitForUI5Stable(timeout?: number): Promise<void> {
    await this.ensureReady();
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const effectiveTimeout = timeout ?? BRIDGE_TIMEOUTS.UI5_STABLE;
    await this.page.waitForFunction(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return false;
        if (typeof sap === 'undefined' || !sap.ui) return false;
        try {
          var pending = sap.ui.getCore().getUIDirty();
          return !pending;
        } catch (e) {
          return true;
        }
      })()`,
      { timeout: effectiveTimeout },
    );
  }

  /**
   * Finds a single control via page.evaluate() with the find-control browser script.
   *
   * @param selector - The UI5 selector to search for.
   * @param options - Optional discovery options.
   * @returns The control ref, or null if not found.
   */
  private async internalFindControl(
    selector: UI5Selector,
    options?: { readonly forceRegistryScan?: boolean },
  ): Promise<BridgeControlRef | null> {
    await this.ensureReady();
    const findOptions = {
      preferVisibleControls: this.preferVisibleControls,
      forceRegistryScan: options?.forceRegistryScan ?? false,
    };
    const withArgs = createFindControlScript().replace(
      /\)\(\)$/,
      `)(${JSON.stringify(selector)}, ${JSON.stringify(findOptions)})`,
    );
    const evalStart = Date.now();
    const result = await this.page.evaluate<ControlDiscoveryResult>(withArgs);
    this.bridgeEvalDuration.record(Date.now() - evalStart, { 'bridge.op': 'findControl' });
    if (result.id === '') return null;
    return { id: result.id, controlType: result.controlType };
  }

  /**
   * Finds all controls matching a selector via page.evaluate().
   *
   * @param selector - The UI5 selector to search for.
   * @returns Array of control refs.
   */
  private async internalFindControls(selector: UI5Selector): Promise<readonly BridgeControlRef[]> {
    await this.ensureReady();
    const withArgs = createFindAllControlsScript().replace(
      /\)\(\)$/,
      `)(${JSON.stringify(selector)})`,
    );
    const results = await this.page.evaluate<readonly ControlDiscoveryResult[]>(withArgs);
    return results.map((r) => ({ id: r.id, controlType: r.controlType }));
  }

  /**
   * Executes a method on a control via page.evaluate() with the execute-method browser script.
   *
   * @param controlId - The control ID.
   * @param methodName - The method name.
   * @param args - Arguments to pass.
   * @returns The method execution result value.
   */
  private async internalExecuteControlMethod(
    controlId: string,
    methodName: string,
    args: readonly unknown[],
  ): Promise<unknown> {
    await this.ensureReady();
    const withArgs = createExecuteMethodScript().replace(
      /\)\(\)$/,
      `)(${JSON.stringify(controlId)}, ${JSON.stringify(methodName)}, ${JSON.stringify(args)})`,
    );
    const evalStart = Date.now();
    const result = await this.page.evaluate<MethodExecutionResult>(withArgs);
    this.bridgeEvalDuration.record(Date.now() - evalStart, { 'bridge.op': methodName });
    return result.value;
  }

  /**
   * Gets available methods for a control via page.evaluate().
   *
   * @param controlId - The control ID.
   * @returns Array of method names.
   */
  private async internalGetAvailableMethods(controlId: string): Promise<readonly string[]> {
    await this.ensureReady();
    const allMethods = await this.page.evaluate<string[]>(
      `(function() {
        var bridge = window.${BRIDGE_GLOBALS.NAMESPACE};
        if (!bridge) return [];
        if (!bridge.utils || typeof bridge.utils.retrieveControlMethods !== 'function') return [];
        return bridge.utils.retrieveControlMethods('${controlId}');
      })()`,
    );
    return filterMethods(allMethods);
  }

  /**
   * Discovers a single UI5 control matching the selector with typed return.
   *
   * @remarks
   * When `controlType` is provided as a known UI5 control type string literal,
   * the return type narrows to the specific typed interface (e.g., `UI5Button`).
   * When only `id` or other non-typed selectors are used, returns `UI5ControlBase`.
   *
   * @ai
   * @aiContext Use to find a UI5 control by type. Returns typed proxy with control-specific methods.
   *
   * @typeParam TControlType - Control type key inferred from `selector.controlType`.
   * @param selector - UI5 selector with a known `controlType`.
   * @param options - Optional timeout and stability wait overrides.
   * @returns Typed control proxy matching the specified control type.
   * @throws ControlError if control not found.
   * @throws SelectorError if selector is empty.
   * @throws TimeoutError if control not found within timeout.
   *
   * @example
   * ```typescript
   * // Typed: returns UI5Button with getText(), press(), getEnabled()
   * const btn = await handler.control({
   *   controlType: 'sap.m.Button',
   *   properties: { text: 'Save' },
   * });
   * const text = await btn.getText(); // string (not any)
   *
   * // Untyped: returns UI5ControlBase (existing behavior)
   * const ctrl = await handler.control({ id: 'myControl' });
   * ```
   */
  async control<TControlType extends keyof UI5ControlMap>(
    selector: UI5Selector & { readonly controlType: TControlType },
    options?: { readonly timeout?: number; readonly skipStabilityWait?: boolean },
  ): Promise<UI5ControlMap[TControlType]>;
  /**
   * Discovers a single control matching the selector.
   *
   * @ai
   * @aiContext Use to find a UI5 control by ID or properties.
   *
   * @param selector - The UI5 selector to search for.
   * @param options - Optional discovery options.
   * @returns The discovered control proxy with base methods and dynamic method access.
   * @throws ControlError if control not found.
   * @throws SelectorError if selector is empty.
   * @throws TimeoutError if control not found within timeout.
   *
   * @example
   * ```typescript
   * const button = await handler.control({ id: 'btn1' });
   *
   * // With extended timeout for slow-loading views:
   * const tile = await handler.control(
   *   { controlType: 'sap.m.GenericTile', properties: { header: 'My App' } },
   *   { timeout: 60000 },
   * );
   * ```
   */
  async control(
    selector: UI5Selector,
    options?: { readonly timeout?: number; readonly skipStabilityWait?: boolean },
  ): Promise<UI5ControlBase>;
  @ui5Step
  async control(
    selector: UI5Selector,
    options?: { readonly timeout?: number; readonly skipStabilityWait?: boolean },
  ): Promise<UI5ControlBase> {
    return this.tracer.withSpan(createSpanName('ui5', 'findControl'), async () => {
      validateSelector(selector);

      try {
        // Always poll for control discovery — use explicit timeout or configured default
        await this.waitFor(selector, { timeout: options?.timeout ?? this.discoveryTimeout });

        const skip = options?.skipStabilityWait ?? this.skipStabilityWait;
        if (!skip) {
          await this.internalWaitForUI5Stable(this.ui5WaitTimeout);
        }

        const proxy = await this.discoverSingleControl(selector);

        if (proxy === null) {
          throw new ControlError({
            code: ErrorCode.ERR_CONTROL_NOT_FOUND,
            message: `Control not found: ${JSON.stringify(selector)}`,
            attempted: `Find control with selector: ${JSON.stringify(selector)}`,
            suggestions: [
              'Verify the control ID exists in the UI5 view',
              'Check if the page has fully loaded (waitForUI5Stable)',
              'Try using controlType + properties instead of ID',
            ],
          });
        }

        return proxy;
      } catch (error: unknown) {
        // Auto-fallback: if discovery fails, try page.locator() for non-UI5 elements
        if (error instanceof ControlError || error instanceof TimeoutError) {
          const fallbackResult = await this.tryLocatorFallback(selector);
          if (fallbackResult !== null) {
            logger.warn(
              { selector },
              'UI5 control not found; falling back to Playwright locator for non-UI5 element',
            );
            return createLocatorShim(fallbackResult, selector);
          }
        }
        throw error;
      }
    });
  }

  /**
   * Discovers multiple controls matching the selector.
   *
   * @ai
   * @aiContext Use to find all UI5 controls matching a selector.
   *
   * @param selector - The UI5 selector to search for.
   * @returns Array of discovered control proxies.
   *
   * @example
   * ```typescript
   * const buttons = await handler.controls({ controlType: 'sap.m.Button' });
   * ```
   */
  @ui5Step
  async controls(selector: UI5Selector): Promise<readonly UI5ControlBase[]> {
    return this.tracer.withSpan(createSpanName('ui5', 'findControls'), async () => {
      validateSelector(selector);
      await this.internalWaitForUI5Stable(this.ui5WaitTimeout);

      const refs = await this.internalFindControls(selector);
      if (refs.length === 0) {
        return [];
      }

      const proxies: UI5ControlBase[] = [];
      for (const ref of refs) {
        const methods = await this.internalGetAvailableMethods(ref.id);
        const proxy = createControlProxy({
          id: ref.id,
          controlType: ref.controlType,
          methods: new Set(methods),
          page: this.page,
          interactionStrategy: this.strategy,
        });
        proxies.push(proxy);
      }

      return proxies;
    });
  }

  /**
   * Clicks a control via the interaction strategy.
   *
   * @ai
   * @aiContext Use to click a UI5 button, link, or clickable control.
   *
   * @param selector - The UI5 selector to click.
   *
   * @example
   * ```typescript
   * await handler.click({ id: 'submitBtn' });
   * ```
   */
  @ui5Step
  async click(selector: UI5Selector): Promise<void> {
    return this.tracer.withSpan(createSpanName('ui5', 'click'), async () => {
      const proxy = await this.control(selector);
      await this.strategy.press(this.page, proxy.id);
    });
  }

  /**
   * Fills a control with text via the interaction strategy.
   *
   * @ai
   * @aiContext Use to type text into an input, textarea, or search field.
   *
   * @param selector - The UI5 selector.
   * @param value - The text to enter.
   *
   * @example
   * ```typescript
   * await handler.fill({ id: 'nameInput' }, 'John');
   * ```
   */
  @ui5Step
  async fill(selector: UI5Selector, value: string): Promise<void> {
    return this.tracer.withSpan(createSpanName('ui5', 'fill'), async () => {
      const proxy = await this.control(selector);
      await this.strategy.enterText(this.page, proxy.id, value);
    });
  }

  /**
   * Presses a control (alias for click).
   *
   * @ai
   * @aiContext Use to press a UI5 button; alias for click().
   *
   * @param selector - The UI5 selector to press.
   *
   * @example
   * ```typescript
   * await handler.press({ id: 'saveBtn' });
   * ```
   */
  @ui5Step
  async press(selector: UI5Selector): Promise<void> {
    await this.click(selector);
  }

  /**
   * Selects an item in a selection control.
   *
   * @ai
   * @aiContext Use to pick an option in a dropdown, combo box, or select.
   *
   * @param selector - The UI5 selector.
   * @param key - The key or ID of the item to select.
   *
   * @example
   * ```typescript
   * await handler.select({ id: 'dropdown1' }, 'option2');
   * ```
   */
  @ui5Step
  async select(selector: UI5Selector, key: string): Promise<void> {
    const proxy = await this.control(selector);
    await this.strategy.select(this.page, proxy.id, key);
  }

  /**
   * Checks a checkbox control.
   *
   * @ai
   * @aiContext Use to check (enable) a UI5 checkbox control.
   *
   * @param selector - The UI5 selector for the checkbox.
   *
   * @example
   * ```typescript
   * await handler.check({ id: 'agreeCheckbox' });
   * ```
   */
  @ui5Step
  async check(selector: UI5Selector): Promise<void> {
    const proxy = await this.control(selector);
    await this.internalExecuteControlMethod(proxy.id, 'setSelected', [true]);
  }

  /**
   * Unchecks a checkbox control.
   *
   * @ai
   * @aiContext Use to uncheck (disable) a UI5 checkbox control.
   *
   * @param selector - The UI5 selector for the checkbox.
   *
   * @example
   * ```typescript
   * await handler.uncheck({ id: 'agreeCheckbox' });
   * ```
   */
  @ui5Step
  async uncheck(selector: UI5Selector): Promise<void> {
    const proxy = await this.control(selector);
    await this.internalExecuteControlMethod(proxy.id, 'setSelected', [false]);
  }

  /**
   * Clears a control's text content.
   *
   * @ai
   * @aiContext Use to clear text from an input or search field.
   *
   * @param selector - The UI5 selector to clear.
   *
   * @example
   * ```typescript
   * await handler.clear({ id: 'searchInput' });
   * ```
   */
  @ui5Step
  async clear(selector: UI5Selector): Promise<void> {
    const proxy = await this.control(selector);
    await this.strategy.enterText(this.page, proxy.id, '');
  }

  /**
   * Gets the text of a control.
   *
   * @ai
   * @aiContext Use to read displayed text from a label, title, or text control.
   *
   * @param selector - The UI5 selector.
   * @returns The control's text value.
   *
   * @example
   * ```typescript
   * const text = await handler.getText({ id: 'label1' });
   * ```
   */
  @ui5Step
  async getText(selector: UI5Selector): Promise<string> {
    const proxy = await this.control(selector);
    const result = await this.internalExecuteControlMethod(proxy.id, 'getText', []);
    // Type assertion: getText() bridge method always returns a string value from the UI5 control
    return result as string;
  }

  /**
   * Gets the value of a control.
   *
   * @ai
   * @aiContext Use to read the current value from an input or form field.
   *
   * @param selector - The UI5 selector.
   * @returns The control's value.
   *
   * @example
   * ```typescript
   * const val = await handler.getValue({ id: 'input1' });
   * ```
   */
  @ui5Step
  async getValue(selector: UI5Selector): Promise<string> {
    const proxy = await this.control(selector);
    const result = await this.internalExecuteControlMethod(proxy.id, 'getValue', []);
    // Type assertion: getValue() bridge method always returns a string value from the UI5 control
    return result as string;
  }

  /**
   * Waits for UI5 to stabilize.
   *
   * @ai
   * @aiContext Use after navigation or data load to wait for UI5 rendering.
   *
   * @param timeout - Optional timeout in milliseconds.
   *
   * @example
   * ```typescript
   * await handler.waitForUI5(10000);
   * ```
   */
  @ui5Step
  async waitForUI5(timeout?: number): Promise<void> {
    return this.tracer.withSpan(createSpanName('ui5', 'waitForUI5'), async () => {
      await this.internalWaitForUI5Stable(timeout ?? this.ui5WaitTimeout);
    });
  }

  /**
   * Waits for a control to appear by polling.
   *
   * @ai
   * @aiContext Use to wait for a control to appear before interacting.
   *
   * @param selector - The UI5 selector to wait for.
   * @param options - Optional timeout and polling interval.
   * @throws TimeoutError if the control is not found within the timeout.
   *
   * @example
   * ```typescript
   * await handler.waitFor({ id: 'dialog1' }, { timeout: 5000 });
   * ```
   */
  @ui5Step
  async waitFor(
    selector: UI5Selector,
    options?: { readonly timeout?: number; readonly interval?: number },
  ): Promise<void> {
    return this.tracer.withSpan(createSpanName('ui5', 'waitFor'), async () => {
      const timeout = options?.timeout ?? this.discoveryTimeout;
      const interval = options?.interval ?? DEFAULT_POLL_INTERVAL;
      const deadline = Date.now() + timeout;

      while (Date.now() < deadline) {
        const proxy = await this.discoverSingleControl(selector);
        if (proxy !== null) {
          return;
        }

        const remaining = deadline - Date.now();
        if (remaining <= 0) break;
        await new Promise<void>((resolve) => {
          setTimeout(resolve, Math.min(interval, remaining));
        });
      }

      throw new TimeoutError({
        code: ErrorCode.ERR_TIMEOUT_CONTROL_DISCOVERY,
        message: `Timed out waiting for control: ${JSON.stringify(selector)}`,
        attempted: `Wait for control with selector: ${JSON.stringify(selector)}`,
        retryable: true,
        timeoutMs: timeout,
        suggestions: [
          'Increase the timeout value',
          'Verify the control will eventually appear on the page',
          'Check if a navigation or data load is required first',
        ],
      });
    });
  }

  /**
   * Inspects a control and returns full metadata without creating a proxy.
   *
   * @remarks
   * Provides a standalone discovery API at the fixture level for control
   * introspection. Discovers the control first, then runs the inspect
   * browser script to retrieve detailed metadata: controlType, id,
   * visibility, enabled state, all properties with current values,
   * aggregation names, and binding paths for data-bound properties.
   *
   * Unlike `control()`, this does NOT return an interactive proxy.
   * Use it for debugging, test assertions on metadata, or AI-driven
   * control analysis.
   *
   * @ai
   * @aiContext Use to get full metadata for a UI5 control (properties, bindings, aggregations).
   *
   * @param selector - The UI5 selector to inspect.
   * @returns Full control metadata including properties, aggregations, and bindings.
   * @throws ControlError if the control is not found.
   * @throws SelectorError if the selector is empty.
   *
   * @example
   * ```typescript
   * const info = await handler.inspect({ id: 'saveBtn' });
   * logger.info(info.controlType);  // 'sap.m.Button'
   * logger.info(info.properties);   // { text: 'Save', type: 'Emphasized', ... }
   * logger.info(info.bindingPaths); // { text: '/ButtonText' }
   * ```
   */
  @ui5Step
  async inspect(selector: UI5Selector): Promise<ControlInspection> {
    return this.tracer.withSpan(createSpanName('ui5', 'inspect'), async () => {
      validateSelector(selector);
      await this.internalWaitForUI5Stable(this.ui5WaitTimeout);

      // Discover the control first to get its ID
      const ref = await this.internalFindControl(selector);
      if (ref === null) {
        throw new ControlError({
          code: ErrorCode.ERR_CONTROL_NOT_FOUND,
          message: `Control not found for inspection: ${JSON.stringify(selector)}`,
          attempted: `Inspect control with selector: ${JSON.stringify(selector)}`,
          retryable: true,
          suggestions: [
            'Verify the control ID exists in the UI5 view',
            'Check if the page has fully loaded (waitForUI5Stable)',
            'Try using controlType + properties instead of ID',
          ],
        });
      }

      // Run the inspect browser script with the discovered control ID
      const withArgs = createInspectControlScript().replace(
        /\)\(\)$/,
        `)(${JSON.stringify(ref.id)})`,
      );
      const result = await this.page.evaluate<ControlInspection | null>(withArgs);

      if (result === null) {
        throw new ControlError({
          code: ErrorCode.ERR_CONTROL_NOT_FOUND,
          message: `Failed to inspect control: ${ref.id}`,
          attempted: `Inspect control metadata for ID: ${ref.id}`,
          suggestions: [
            'The control may have been destroyed between discovery and inspection',
            'Try again after waiting for UI5 stability',
          ],
        });
      }

      return result;
    });
  }

  /**
   * Clears the internal proxy cache.
   *
   * @ai
   * @aiContext Use to force re-discovery of controls after page changes.
   *
   * @example
   * ```typescript
   * handler.clearCache();
   * ```
   */
  clearCache(): void {
    this.cache = new ControlProxyCache();
  }

  /**
   * Destroys the handler and cleans up resources.
   *
   * @ai
   * @aiContext Use in teardown to release handler resources.
   *
   * @example
   * ```typescript
   * await handler.destroy();
   * ```
   */
  @ui5Step
  // eslint-disable-next-line @typescript-eslint/require-await -- interface consistency: destroy() is async for future cleanup needs
  async destroy(): Promise<void> {
    this.cache = new ControlProxyCache();
  }

  /**
   * Attempts to find a DOM element via Playwright locator when UI5 discovery fails.
   *
   * @remarks
   * Only activates when the selector contains a non-UI5 hint:
   * - `id` without `--` separator (UI5 generated IDs use `--`)
   * - `css` property (not part of standard UI5Selector but may be passed)
   * - `xpath` property (not part of standard UI5Selector but may be passed)
   *
   * @param selector - The UI5 selector to extract fallback hints from.
   * @returns A Playwright Locator if a DOM element is found, or null.
   */
  private async tryLocatorFallback(selector: UI5Selector): Promise<Locator | null> {
    // Check for non-UI5 id (no '--' separator)
    if (typeof selector.id === 'string' && !selector.id.includes('--')) {
      try {
        // Use attribute selector [id="..."] instead of #id to safely handle IDs
        // containing CSS-special characters like "::" (e.g., V4 APD IDs "APD_::Material")
        const escapedId = selector.id.replaceAll('"', '\\"');
        const locator = this.page.locator(`[id="${escapedId}"]`);
        const count = await locator.count();
        if (count > 0) {
          return locator;
        }
      } catch {
        // CSS selector parsing failed — ID contains characters that can't be
        // represented even in attribute selectors. Not a DOM element.
      }
      return null;
    }

    // Check for css property (extended selector, not in standard UI5Selector)
    if ('css' in selector && typeof (selector as Record<string, unknown>)['css'] === 'string') {
      const cssValue = (selector as Record<string, unknown>)['css'] as string;
      const locator = this.page.locator(cssValue);
      const count = await locator.count();
      if (count > 0) {
        return locator;
      }
      return null;
    }

    // Check for xpath property (extended selector, not in standard UI5Selector)
    if ('xpath' in selector && typeof (selector as Record<string, unknown>)['xpath'] === 'string') {
      const xpathValue = (selector as Record<string, unknown>)['xpath'] as string;
      const locator = this.page.locator(`xpath=${xpathValue}`);
      const count = await locator.count();
      if (count > 0) {
        return locator;
      }
      return null;
    }

    return null;
  }

  /**
   * Discovers a single control using the configured strategy chain.
   *
   * @param selector - The UI5 selector to search for.
   * @returns The discovered proxy, or null if not found.
   */
  private async discoverSingleControl(selector: UI5Selector): Promise<UI5ControlBase | null> {
    // Tier 0: Cache lookup
    const cached = this.cache.get(selector);
    if (cached !== undefined) {
      return cached;
    }

    const startTime = Date.now();
    const controlType = String(selector.controlType ?? selector.id ?? 'unknown');
    this.discoveryCounter.add(1, { 'control.type': controlType });

    // Try each configured strategy in order
    let controlRef: BridgeControlRef | null = null;
    for (const strategyName of this.discoveryStrategies) {
      if (strategyName === 'direct-id') {
        if (selector.id !== undefined) {
          controlRef = await this.internalFindControl({ id: selector.id });
        }
      } else if (strategyName === 'recordreplay') {
        controlRef = await this.internalFindControl(selector);
      } else {
        // strategyName === 'registry'
        controlRef = await this.internalFindControl(selector, { forceRegistryScan: true });
      }
      if (controlRef !== null) break;
    }

    this.discoveryDuration.record(Date.now() - startTime, { 'control.type': controlType });

    if (controlRef === null) {
      return null;
    }

    // Get available methods for the proxy
    const methods = await this.internalGetAvailableMethods(controlRef.id);

    const proxy = createControlProxy({
      id: controlRef.id,
      controlType: controlRef.controlType,
      methods: new Set(methods),
      page: this.page,
      interactionStrategy: this.strategy,
    });

    // Cache the proxy for future lookups
    this.cache.set(selector, proxy);

    return proxy;
  }
}
