/**
 * UI5Handler — internal class for UI5 control discovery, interaction, and lifecycle.
 *
 * @remarks
 * NOT exported from any barrel. Used internally by the `ui5` fixture.
 * Wraps adapter, cache, discovery, and interaction strategy into a clean API.
 *
 * Each method follows the pattern:
 * 1. Validate selector (non-empty)
 * 2. Wait for UI5 stability
 * 3. Discover control via strategy chain
 * 4. Execute action via adapter or interaction strategy
 *
 * @example
 * ```typescript
 * import { UI5Handler } from './ui5-handler.js';
 *
 * const handler = new UI5Handler({ adapter, page, strategy, discoveryStrategies: ['direct-id'] });
 * const button = await handler.control({ id: 'btn1' });
 * ```
 *
 * @module fixtures
 */

import type { BridgeAdapter, BridgePage } from '#bridge/adapter.js';
import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';
import type { DiscoveryStrategyName } from '#core/config/schema.js';
import { ControlError } from '#core/errors/control-error.js';
import { SelectorError } from '#core/errors/selector-error.js';
import { TimeoutError } from '#core/errors/timeout-error.js';
import type { UI5ControlBase } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';
import { ControlProxyCache } from '#proxy/cache.js';
import { discoverControl } from '#proxy/discovery.js';
import { createControlProxy } from '#proxy/dynamic-proxy.js';

/** Default UI5 wait timeout in milliseconds. */
const DEFAULT_UI5_WAIT_TIMEOUT = 30_000;

/** Default control discovery timeout in milliseconds. */
const DEFAULT_DISCOVERY_TIMEOUT = 10_000;

/** Default polling interval for waitFor in milliseconds. */
const DEFAULT_POLL_INTERVAL = 250;

/**
 * Configuration options for UI5Handler.
 *
 * @example
 * ```typescript
 * const options: UI5HandlerOptions = {
 *   adapter,
 *   page,
 *   strategy,
 *   discoveryStrategies: ['direct-id', 'recordreplay'],
 * };
 * ```
 */
export interface UI5HandlerOptions {
  readonly adapter: BridgeAdapter;
  readonly page: BridgePage;
  readonly strategy: InteractionStrategy;
  readonly discoveryStrategies: readonly DiscoveryStrategyName[];
  readonly config?: {
    readonly ui5WaitTimeout?: number;
    readonly controlDiscoveryTimeout?: number;
  };
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
      message: 'Selector must have at least one property (id, controlType, properties, etc.)',
      attempted: 'Validate UI5 selector before discovery',
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
 * @example
 * ```typescript
 * const handler = new UI5Handler(options);
 * const button = await handler.control({ id: 'submitBtn' });
 * await handler.click({ id: 'submitBtn' });
 * ```
 */
export class UI5Handler {
  private readonly adapter: BridgeAdapter;
  private readonly page: BridgePage;
  private readonly strategy: InteractionStrategy;
  private readonly discoveryStrategies: readonly DiscoveryStrategyName[];
  private readonly ui5WaitTimeout: number;
  private readonly discoveryTimeout: number;
  private cache: ControlProxyCache;

  constructor(options: UI5HandlerOptions) {
    this.adapter = options.adapter;
    this.page = options.page;
    this.strategy = options.strategy;
    this.discoveryStrategies = options.discoveryStrategies;
    this.ui5WaitTimeout = options.config?.ui5WaitTimeout ?? DEFAULT_UI5_WAIT_TIMEOUT;
    this.discoveryTimeout = options.config?.controlDiscoveryTimeout ?? DEFAULT_DISCOVERY_TIMEOUT;
    this.cache = new ControlProxyCache();
  }

  /**
   * Discovers a single control matching the selector.
   *
   * @param selector - The UI5 selector to search for.
   * @returns The discovered control proxy.
   * @throws ControlError if control not found.
   * @throws SelectorError if selector is empty.
   *
   * @example
   * ```typescript
   * const button = await handler.control({ id: 'btn1' });
   * ```
   */
  async control(selector: UI5Selector): Promise<UI5ControlBase> {
    validateSelector(selector);
    await this.adapter.waitForUI5Stable();

    const proxy = await discoverControl(
      selector,
      this.adapter,
      this.cache,
      this.discoveryStrategies,
    );

    if (proxy === null) {
      throw new ControlError({
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
  }

  /**
   * Discovers multiple controls matching the selector.
   *
   * @param selector - The UI5 selector to search for.
   * @returns Array of discovered control proxies.
   *
   * @example
   * ```typescript
   * const buttons = await handler.controls({ controlType: 'sap.m.Button' });
   * ```
   */
  async controls(selector: UI5Selector): Promise<readonly UI5ControlBase[]> {
    validateSelector(selector);
    await this.adapter.waitForUI5Stable();

    const refs = await this.adapter.findControls(selector);
    if (refs.length === 0) {
      return [];
    }

    const proxies: UI5ControlBase[] = [];
    for (const ref of refs) {
      const methods = await this.adapter.getAvailableMethods(ref.id);
      const proxy = createControlProxy({
        id: ref.id,
        controlType: ref.controlType,
        methods: new Set(methods),
        adapter: this.adapter,
      });
      proxies.push(proxy);
    }

    return proxies;
  }

  /**
   * Clicks a control via the interaction strategy.
   *
   * @param selector - The UI5 selector to click.
   *
   * @example
   * ```typescript
   * await handler.click({ id: 'submitBtn' });
   * ```
   */
  async click(selector: UI5Selector): Promise<void> {
    const proxy = await this.control(selector);
    await this.strategy.press(this.page, proxy.id);
  }

  /**
   * Fills a control with text via the interaction strategy.
   *
   * @param selector - The UI5 selector.
   * @param value - The text to enter.
   *
   * @example
   * ```typescript
   * await handler.fill({ id: 'nameInput' }, 'John');
   * ```
   */
  async fill(selector: UI5Selector, value: string): Promise<void> {
    const proxy = await this.control(selector);
    await this.strategy.enterText(this.page, proxy.id, value);
  }

  /**
   * Presses a control (alias for click).
   *
   * @param selector - The UI5 selector to press.
   *
   * @example
   * ```typescript
   * await handler.press({ id: 'saveBtn' });
   * ```
   */
  async press(selector: UI5Selector): Promise<void> {
    await this.click(selector);
  }

  /**
   * Selects an item in a selection control.
   *
   * @param selector - The UI5 selector.
   * @param key - The key or ID of the item to select.
   *
   * @example
   * ```typescript
   * await handler.select({ id: 'dropdown1' }, 'option2');
   * ```
   */
  async select(selector: UI5Selector, key: string): Promise<void> {
    const proxy = await this.control(selector);
    await this.strategy.select(this.page, proxy.id, key);
  }

  /**
   * Checks a checkbox control.
   *
   * @param selector - The UI5 selector for the checkbox.
   *
   * @example
   * ```typescript
   * await handler.check({ id: 'agreeCheckbox' });
   * ```
   */
  async check(selector: UI5Selector): Promise<void> {
    const proxy = await this.control(selector);
    await this.adapter.executeControlMethod(proxy.id, 'setSelected', [true]);
  }

  /**
   * Unchecks a checkbox control.
   *
   * @param selector - The UI5 selector for the checkbox.
   *
   * @example
   * ```typescript
   * await handler.uncheck({ id: 'agreeCheckbox' });
   * ```
   */
  async uncheck(selector: UI5Selector): Promise<void> {
    const proxy = await this.control(selector);
    await this.adapter.executeControlMethod(proxy.id, 'setSelected', [false]);
  }

  /**
   * Clears a control's text content.
   *
   * @param selector - The UI5 selector to clear.
   *
   * @example
   * ```typescript
   * await handler.clear({ id: 'searchInput' });
   * ```
   */
  async clear(selector: UI5Selector): Promise<void> {
    const proxy = await this.control(selector);
    await this.strategy.enterText(this.page, proxy.id, '');
  }

  /**
   * Gets the text of a control.
   *
   * @param selector - The UI5 selector.
   * @returns The control's text value.
   *
   * @example
   * ```typescript
   * const text = await handler.getText({ id: 'label1' });
   * ```
   */
  async getText(selector: UI5Selector): Promise<string> {
    const proxy = await this.control(selector);
    const result = await this.adapter.executeControlMethod(proxy.id, 'getText', []);
    return result as string;
  }

  /**
   * Gets the value of a control.
   *
   * @param selector - The UI5 selector.
   * @returns The control's value.
   *
   * @example
   * ```typescript
   * const val = await handler.getValue({ id: 'input1' });
   * ```
   */
  async getValue(selector: UI5Selector): Promise<string> {
    const proxy = await this.control(selector);
    const result = await this.adapter.executeControlMethod(proxy.id, 'getValue', []);
    return result as string;
  }

  /**
   * Waits for UI5 to stabilize.
   *
   * @param timeout - Optional timeout in milliseconds.
   *
   * @example
   * ```typescript
   * await handler.waitForUI5(10000);
   * ```
   */
  async waitForUI5(timeout?: number): Promise<void> {
    await this.adapter.waitForUI5Stable(timeout ?? this.ui5WaitTimeout);
  }

  /**
   * Waits for a control to appear by polling.
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
  async waitFor(
    selector: UI5Selector,
    options?: { readonly timeout?: number; readonly interval?: number },
  ): Promise<void> {
    const timeout = options?.timeout ?? this.discoveryTimeout;
    const interval = options?.interval ?? DEFAULT_POLL_INTERVAL;
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      const proxy = await discoverControl(
        selector,
        this.adapter,
        this.cache,
        this.discoveryStrategies,
      );
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
      message: `Timed out waiting for control: ${JSON.stringify(selector)}`,
      attempted: `Wait for control with selector: ${JSON.stringify(selector)}`,
      timeoutMs: timeout,
      suggestions: [
        'Increase the timeout value',
        'Verify the control will eventually appear on the page',
        'Check if a navigation or data load is required first',
      ],
    });
  }

  /**
   * Clears the internal proxy cache.
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
   * @example
   * ```typescript
   * await handler.destroy();
   * ```
   */
  async destroy(): Promise<void> {
    this.cache = new ControlProxyCache();
    await this.adapter.destroy();
  }
}
