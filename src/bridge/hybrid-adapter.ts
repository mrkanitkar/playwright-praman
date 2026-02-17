/**
 * HybridAdapter — auto-detect per element, delegates to Classic or WebComponent.
 *
 * @remarks
 * Enables mixed FLP pages where the shell uses web-components but the
 * app uses classic UI5 (W3). Delegates all operations to the Classic
 * adapter by default; WebComponent adapter used for detected WC elements.
 *
 * @module bridge
 */

import type { BridgeAdapter, BridgePage } from './adapter.js';
import type { BridgeControlRef } from './bridge-types.js';
import { ClassicUI5Adapter } from './classic-adapter.js';
import { WebComponentAdapter } from './webcomponent-adapter.js';

import type { UI5Selector } from '#core/types/selectors.js';

/**
 * Hybrid bridge adapter that delegates to Classic or WebComponent adapters.
 *
 * @remarks
 * Initializes both sub-adapters. By default, all operations go through
 * the Classic adapter. Phase 3+ will add element-level detection.
 *
 * @example
 * ```typescript
 * const adapter = new HybridAdapter();
 * await adapter.init(page);
 * // Delegates to classic for standard UI5 controls
 * const btn = await adapter.findControl({ id: 'submitBtn' });
 * ```
 */
export class HybridAdapter implements BridgeAdapter {
  private readonly classic = new ClassicUI5Adapter();
  private readonly webComponent = new WebComponentAdapter();
  private initialized = false;

  /** {@inheritDoc BridgeAdapter.init} */
  async init(page: BridgePage): Promise<void> {
    await this.classic.init(page);
    await this.webComponent.init(page);
    this.initialized = true;
  }

  /** {@inheritDoc BridgeAdapter.isReady} */
  async isReady(): Promise<boolean> {
    if (!this.initialized) return false;
    return this.classic.isReady();
  }

  /** {@inheritDoc BridgeAdapter.destroy} */
  async destroy(): Promise<void> {
    await this.classic.destroy();
    await this.webComponent.destroy();
    this.initialized = false;
  }

  /** {@inheritDoc BridgeAdapter.getUI5Version} */
  async getUI5Version(): Promise<string> {
    return this.classic.getUI5Version();
  }

  /** {@inheritDoc BridgeAdapter.isWebComponent} */
  // eslint-disable-next-line @typescript-eslint/require-await
  async isWebComponent(): Promise<boolean> {
    return false;
  }

  /** {@inheritDoc BridgeAdapter.findControl} */
  async findControl(selector: UI5Selector): Promise<BridgeControlRef | null> {
    return this.classic.findControl(selector);
  }

  /** {@inheritDoc BridgeAdapter.findControls} */
  async findControls(selector: UI5Selector): Promise<readonly BridgeControlRef[]> {
    return this.classic.findControls(selector);
  }

  /** {@inheritDoc BridgeAdapter.getControlProperty} */
  async getControlProperty(controlId: string, propertyName: string): Promise<unknown> {
    return this.classic.getControlProperty(controlId, propertyName);
  }

  /** {@inheritDoc BridgeAdapter.setControlProperty} */
  async setControlProperty(controlId: string, propertyName: string, value: unknown): Promise<void> {
    return this.classic.setControlProperty(controlId, propertyName, value);
  }

  /** {@inheritDoc BridgeAdapter.getControlAggregation} */
  async getControlAggregation(
    controlId: string,
    aggregationName: string,
  ): Promise<readonly BridgeControlRef[]> {
    return this.classic.getControlAggregation(controlId, aggregationName);
  }

  /** {@inheritDoc BridgeAdapter.executeControlMethod} */
  async executeControlMethod(
    controlId: string,
    methodName: string,
    args: readonly unknown[],
  ): Promise<unknown> {
    return this.classic.executeControlMethod(controlId, methodName, args);
  }

  /** {@inheritDoc BridgeAdapter.waitForUI5Stable} */
  async waitForUI5Stable(timeout?: number): Promise<void> {
    return this.classic.waitForUI5Stable(timeout);
  }

  /** {@inheritDoc BridgeAdapter.getModel} */
  async getModel(controlId: string, modelName?: string): Promise<unknown> {
    return this.classic.getModel(controlId, modelName);
  }

  /** {@inheritDoc BridgeAdapter.getBindingContext} */
  async getBindingContext(controlId: string, modelName?: string): Promise<unknown> {
    return this.classic.getBindingContext(controlId, modelName);
  }

  /** {@inheritDoc BridgeAdapter.describeControl} */
  async describeControl(controlId: string): Promise<Record<string, unknown>> {
    return this.classic.describeControl(controlId);
  }

  /** {@inheritDoc BridgeAdapter.getAvailableMethods} */
  async getAvailableMethods(controlId: string): Promise<readonly string[]> {
    return this.classic.getAvailableMethods(controlId);
  }
}
