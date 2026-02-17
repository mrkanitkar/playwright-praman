/**
 * ClassicUI5Adapter — primary adapter for classic UI5 applications.
 *
 * @remarks
 * Covers 95%+ of SAP FLP use cases (W1). Implements full BridgeAdapter
 * interface with lazy initialization (W19): bridge injected on first
 * UI5 operation after user navigates to SAP app.
 *
 * Uses browser scripts from B13, injection from B14, and interaction
 * strategies from B15.
 *
 * @module bridge
 */

import type { BridgeAdapter, BridgePage } from './adapter.js';
import { BRIDGE_GLOBALS, BRIDGE_TIMEOUTS } from './bridge-constants.js';
import type {
  BridgeControlRef,
  ControlDiscoveryResult,
  MethodExecutionResult,
} from './bridge-types.js';
import { createExecuteMethodScript } from './browser-scripts/execute-method.js';
import {
  createFindAllControlsScript,
  createFindControlScript,
} from './browser-scripts/find-control.js';
import { createGetSelectorScript } from './browser-scripts/get-selector.js';
import { createGetVersionScript } from './browser-scripts/get-version.js';
import { createObjectCleanupScript, createObjectMapScript } from './browser-scripts/object-map.js';
import { ensureBridgeInjected, isBridgeReady, resetPageInjection } from './injection.js';
import { filterMethods } from './method-blacklist.js';

import type { UI5Selector } from '#core/types/selectors.js';

/**
 * Primary bridge adapter for classic SAPUI5/OpenUI5 applications.
 *
 * @remarks
 * Default adapter. Fast and reliable for standard UI5 controls.
 * RecordReplay + Element.registry are available in all target UI5
 * versions (1.71+).
 *
 * @example
 * ```typescript
 * const adapter = new ClassicUI5Adapter();
 * await adapter.init(page);
 * const btn = await adapter.findControl({ id: 'submitBtn' });
 * ```
 */
export class ClassicUI5Adapter implements BridgeAdapter {
  private page: BridgePage | null = null;
  private initialized = false;
  private cachedVersion: string | null = null;

  /** {@inheritDoc BridgeAdapter.init} */
  async init(page: BridgePage): Promise<void> {
    this.page = page;
    await ensureBridgeInjected(page);
    await page.evaluate(createObjectMapScript());
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
    if (this.page !== null) {
      await this.page.evaluate(createObjectCleanupScript());
    }
    this.page = null;
    this.initialized = false;
    this.cachedVersion = null;
  }

  /** {@inheritDoc BridgeAdapter.getUI5Version} */
  async getUI5Version(): Promise<string> {
    if (this.cachedVersion !== null) return this.cachedVersion;
    const page = this.requirePage();
    return page.evaluate<string>(createGetVersionScript());
  }

  /** {@inheritDoc BridgeAdapter.isWebComponent} */
  // eslint-disable-next-line @typescript-eslint/require-await
  async isWebComponent(): Promise<boolean> {
    return false;
  }

  /** {@inheritDoc BridgeAdapter.findControl} */
  async findControl(selector: UI5Selector): Promise<BridgeControlRef | null> {
    const page = this.requirePage();
    const selectorJson = JSON.stringify(selector);
    const script = createFindControlScript();
    const withArgs = script.replace(/\)\(\)$/, `)(${selectorJson})`);
    const result = await page.evaluate<ControlDiscoveryResult>(withArgs);

    if (result.id === '') return null;
    return {
      id: result.id,
      controlType: result.controlType,
    };
  }

  /** {@inheritDoc BridgeAdapter.findControls} */
  async findControls(selector: UI5Selector): Promise<readonly BridgeControlRef[]> {
    const page = this.requirePage();
    const selectorJson = JSON.stringify(selector);
    const script = createFindAllControlsScript();
    const withArgs = script.replace(/\)\(\)$/, `)(${selectorJson})`);
    const results = await page.evaluate<readonly ControlDiscoveryResult[]>(withArgs);

    return results.map((r) => ({
      id: r.id,
      controlType: r.controlType,
    }));
  }

  /** {@inheritDoc BridgeAdapter.getControlProperty} */
  async getControlProperty(controlId: string, propertyName: string): Promise<unknown> {
    const page = this.requirePage();
    const methodName = `get${propertyName.charAt(0).toUpperCase()}${propertyName.slice(1)}`;
    const script = createExecuteMethodScript();
    const withArgs = script.replace(
      /\)\(\)$/,
      `)(${JSON.stringify(controlId)}, ${JSON.stringify(methodName)}, [])`,
    );
    const result = await page.evaluate<MethodExecutionResult>(withArgs);
    return result.value;
  }

  /** {@inheritDoc BridgeAdapter.setControlProperty} */
  async setControlProperty(controlId: string, propertyName: string, value: unknown): Promise<void> {
    const page = this.requirePage();
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const escaped = JSON.stringify(value);
    await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return;
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return;
        var setter = 'set' + '${propertyName}'.charAt(0).toUpperCase() + '${propertyName}'.slice(1);
        if (typeof ctrl[setter] === 'function') { ctrl[setter](${escaped}); }
      })()`,
    );
  }

  /** {@inheritDoc BridgeAdapter.getControlAggregation} */
  async getControlAggregation(
    controlId: string,
    aggregationName: string,
  ): Promise<readonly BridgeControlRef[]> {
    const page = this.requirePage();
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
  }

  /** {@inheritDoc BridgeAdapter.executeControlMethod} */
  async executeControlMethod(
    controlId: string,
    methodName: string,
    args: readonly unknown[],
  ): Promise<unknown> {
    const page = this.requirePage();
    const script = createExecuteMethodScript();
    const withArgs = script.replace(
      /\)\(\)$/,
      `)(${JSON.stringify(controlId)}, ${JSON.stringify(methodName)}, ${JSON.stringify(args)})`,
    );
    const result = await page.evaluate<MethodExecutionResult>(withArgs);
    return result.value;
  }

  /** {@inheritDoc BridgeAdapter.waitForUI5Stable} */
  async waitForUI5Stable(timeout?: number): Promise<void> {
    const page = this.requirePage();
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const effectiveTimeout = timeout ?? BRIDGE_TIMEOUTS.UI5_STABLE;
    await page.waitForFunction(
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

  /** {@inheritDoc BridgeAdapter.getModel} */
  async getModel(controlId: string, modelName?: string): Promise<unknown> {
    const page = this.requirePage();
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const modelArg = modelName !== undefined ? `'${modelName}'` : '';
    return page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return null;
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl || typeof ctrl.getModel !== 'function') return null;
        var model = ctrl.getModel(${modelArg});
        if (!model) return null;
        return { name: model.getName ? model.getName() : null };
      })()`,
    );
  }

  /** {@inheritDoc BridgeAdapter.getBindingContext} */
  async getBindingContext(controlId: string, modelName?: string): Promise<unknown> {
    const page = this.requirePage();
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const modelArg = modelName !== undefined ? `'${modelName}'` : '';
    return page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return null;
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl || typeof ctrl.getBindingContext !== 'function') return null;
        var ctx = ctrl.getBindingContext(${modelArg});
        if (!ctx) return null;
        return { path: ctx.getPath ? ctx.getPath() : null };
      })()`,
    );
  }

  /** {@inheritDoc BridgeAdapter.describeControl} */
  async describeControl(controlId: string): Promise<Record<string, unknown>> {
    const page = this.requirePage();
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    return page.evaluate<Record<string, unknown>>(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return {};
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return {};
        var meta = ctrl.getMetadata ? ctrl.getMetadata() : null;
        var result = {
          id: ctrl.getId ? ctrl.getId() : '${controlId}',
          controlType: meta && meta.getName ? meta.getName() : 'unknown',
          properties: {},
          aggregations: {}
        };
        if (meta && meta.getAllProperties) {
          var props = meta.getAllProperties();
          var keys = Object.keys(props);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            try {
              var getter = 'get' + key.charAt(0).toUpperCase() + key.slice(1);
              if (typeof ctrl[getter] === 'function') {
                result.properties[key] = ctrl[getter]();
              }
            } catch (e) { /* skip */ }
          }
        }
        return result;
      })()`,
    );
  }

  /** {@inheritDoc BridgeAdapter.getAvailableMethods} */
  async getAvailableMethods(controlId: string): Promise<readonly string[]> {
    const page = this.requirePage();
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const allMethods = await page.evaluate<string[]>(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return [];
        if (!bridge.utils || typeof bridge.utils.retrieveControlMethods !== 'function') return [];
        return bridge.utils.retrieveControlMethods('${controlId}');
      })()`,
    );
    return filterMethods(allMethods);
  }

  /** {@inheritDoc BridgeAdapter.getSelectorForControl} */
  async getSelectorForControl(
    controlId: string,
  ): Promise<{ selector: UI5Selector; strategy: string } | null> {
    const page = this.requirePage();
    const script = createGetSelectorScript();
    const withArgs = script.replace(/\)\(\)$/, `)(${JSON.stringify(controlId)})`);
    return page.evaluate<{ selector: UI5Selector; strategy: string } | null>(withArgs);
  }

  /** {@inheritDoc BridgeAdapter.resetInjectionState} */
  resetInjectionState(): void {
    if (this.page !== null) {
      resetPageInjection(this.page);
    }
  }

  /**
   * Returns the page reference, throwing if adapter not initialized.
   *
   * @throws Error when adapter has not been initialized via `init()`.
   */
  private requirePage(): BridgePage {
    if (this.page === null || !this.initialized) {
      throw new Error('Adapter not initialized. Call init(page) first.');
    }
    return this.page;
  }
}
