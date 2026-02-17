/**
 * WebComponentAdapter — stub adapter for UI5 Web Components.
 *
 * @remarks
 * Phase 2 defines interface + no-crash fallback only (W2).
 * Full \@ui5/webcomponents support deferred to Phase 3+ per plan.md D3.
 *
 * @module bridge
 */

/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { BridgeAdapter, BridgePage } from './adapter.js';
import type { BridgeControlRef } from './bridge-types.js';
import { createGetVersionScript } from './browser-scripts/get-version.js';
import { ensureBridgeInjected, isBridgeReady } from './injection.js';

import type { UI5Selector } from '#core/types/selectors.js';

/**
 * Stub bridge adapter for UI5 Web Components.
 *
 * @remarks
 * Provides a no-crash fallback for FLP ShellBar and other web-component
 * elements. Most operations return null/empty results rather than throwing.
 *
 * @example
 * ```typescript
 * const adapter = new WebComponentAdapter();
 * await adapter.init(page);
 * const result = await adapter.findControl({ id: 'wc1' });
 * // result === null (stub)
 * ```
 */
export class WebComponentAdapter implements BridgeAdapter {
  private page: BridgePage | null = null;
  private initialized = false;
  private cachedVersion: string | null = null;

  /** {@inheritDoc BridgeAdapter.init} */
  async init(page: BridgePage): Promise<void> {
    this.page = page;
    await ensureBridgeInjected(page);
    this.cachedVersion = await page.evaluate<string>(createGetVersionScript());
    this.initialized = true;
  }

  /** {@inheritDoc BridgeAdapter.isReady} */
  async isReady(): Promise<boolean> {
    if (this.page === null || !this.initialized) return false;
    return isBridgeReady(this.page);
  }

  /** {@inheritDoc BridgeAdapter.destroy} */
  async destroy(): Promise<void> {
    this.page = null;
    this.initialized = false;
    this.cachedVersion = null;
  }

  /** {@inheritDoc BridgeAdapter.getUI5Version} */
  async getUI5Version(): Promise<string> {
    return this.cachedVersion ?? '0.0.0';
  }

  /** {@inheritDoc BridgeAdapter.isWebComponent} */
  async isWebComponent(): Promise<boolean> {
    return true;
  }

  /** {@inheritDoc BridgeAdapter.findControl} */
  async findControl(_selector: UI5Selector): Promise<BridgeControlRef | null> {
    return null;
  }

  /** {@inheritDoc BridgeAdapter.findControls} */
  async findControls(_selector: UI5Selector): Promise<readonly BridgeControlRef[]> {
    return [];
  }

  /** {@inheritDoc BridgeAdapter.getControlProperty} */
  async getControlProperty(_controlId: string, _propertyName: string): Promise<unknown> {
    return undefined;
  }

  /** {@inheritDoc BridgeAdapter.setControlProperty} */
  async setControlProperty(
    _controlId: string,
    _propertyName: string,
    _value: unknown,
  ): Promise<void> {
    // Stub — no-op
  }

  /** {@inheritDoc BridgeAdapter.getControlAggregation} */
  async getControlAggregation(
    _controlId: string,
    _aggregationName: string,
  ): Promise<readonly BridgeControlRef[]> {
    return [];
  }

  /** {@inheritDoc BridgeAdapter.executeControlMethod} */
  async executeControlMethod(
    _controlId: string,
    _methodName: string,
    _args: readonly unknown[],
  ): Promise<unknown> {
    return undefined;
  }

  /** {@inheritDoc BridgeAdapter.waitForUI5Stable} */
  async waitForUI5Stable(_timeout?: number): Promise<void> {
    // Stub — web components don't use UI5 stability mechanism
  }

  /** {@inheritDoc BridgeAdapter.getModel} */
  async getModel(_controlId: string, _modelName?: string): Promise<unknown> {
    return null;
  }

  /** {@inheritDoc BridgeAdapter.getBindingContext} */
  async getBindingContext(_controlId: string, _modelName?: string): Promise<unknown> {
    return null;
  }

  /** {@inheritDoc BridgeAdapter.describeControl} */
  async describeControl(_controlId: string): Promise<Record<string, unknown>> {
    return {};
  }

  /** {@inheritDoc BridgeAdapter.getAvailableMethods} */
  async getAvailableMethods(_controlId: string): Promise<readonly string[]> {
    return [];
  }

  /** {@inheritDoc BridgeAdapter.getSelectorForControl} */
  async getSelectorForControl(
    _controlId: string,
  ): Promise<{ selector: UI5Selector; strategy: string } | null> {
    return null;
  }

  /** {@inheritDoc BridgeAdapter.resetInjectionState} */
  resetInjectionState(): void {
    // Stub — WebComponent adapter Phase 3+
  }
}
