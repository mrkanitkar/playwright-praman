/**
 * Tests for `src/bridge/browser-scripts/find-control-fn.ts`.
 *
 * @remarks
 * Validates the function-form browser script for control discovery.
 * Tests enhanced matching capabilities (GAP-02) and visibility preference (GAP-21).
 * Uses a simulated browser environment with mock globals.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BrowserFindControlParams } from '#bridge/browser-scripts/find-control-fn.js';
import { browserFindControl } from '#bridge/browser-scripts/find-control-fn.js';

/** Minimal UI5 control mock with configurable properties. */
interface MockControl {
  getId: () => string;
  getMetadata: () => { getName: () => string };
  getDomRef: () => { id: string } | null;
  getVisible: () => boolean;
  getParent?: () => MockControl | null;
  getBinding?: (name: string) => { getPath: () => string } | null;
  [key: string]: unknown;
}

/** Creates a minimal mock control. */
function createMockControl(overrides: {
  id: string;
  controlType: string;
  visible?: boolean;
  properties?: Record<string, unknown>;
  parent?: MockControl | null;
  binding?: Record<string, { path: string }>;
}): MockControl {
  const ctrl: MockControl = {
    getId: () => overrides.id,
    getMetadata: () => ({ getName: () => overrides.controlType }),
    getDomRef: () => ({ id: overrides.id }),
    getVisible: () => overrides.visible !== false,
    getParent: () => overrides.parent ?? null,
  };

  // Add property getters
  if (overrides.properties !== undefined) {
    for (const [key, value] of Object.entries(overrides.properties)) {
      const getterName = 'get' + key.charAt(0).toUpperCase() + key.slice(1);
      ctrl[getterName] = () => value;
    }
  }

  // Add binding support
  if (overrides.binding !== undefined) {
    const bindings = overrides.binding;
    ctrl.getBinding = (name: string) => {
      const b = bindings[name];
      return b !== undefined ? { getPath: () => b.path } : null;
    };
  }

  return ctrl;
}

/**
 * Sets up the mock browser globals required by browserFindControl.
 *
 * @remarks
 * In Node.js `window` is not defined. Since `browserFindControl` uses
 * `Reflect.get(window, ...)`, we need to create a `window` reference
 * on `globalThis` that points to `globalThis` itself (mirroring browser behavior).
 */
function setupBrowserGlobals(controls: Record<string, MockControl>): void {
  const bridge = {
    getById: (id: string) => {
      const ctrl = controls[id];
      return ctrl ?? null;
    },
  };

  const registry = {
    all: () => controls,
  };

  // Simulate browser's window === globalThis
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    writable: true,
    configurable: true,
  });

  // Set up window.__praman_bridge
  Object.defineProperty(globalThis, '__praman_bridge', {
    value: bridge,
    writable: true,
    configurable: true,
  });

  // Set up window.sap.ui.core.Element.registry
  Object.defineProperty(globalThis, 'sap', {
    value: {
      ui: {
        core: {
          Element: {
            registry,
            closestTo: () => null,
          },
        },
      },
    },
    writable: true,
    configurable: true,
  });
}

/** Cleans up mock browser globals. */
function cleanupBrowserGlobals(): void {
  Reflect.deleteProperty(globalThis, '__praman_bridge');
  Reflect.deleteProperty(globalThis, 'sap');
  Reflect.deleteProperty(globalThis, 'window');
}

const BASE_PARAMS: Pick<BrowserFindControlParams, 'bridgeNs'> = {
  bridgeNs: '__praman_bridge',
};

describe('browserFindControl', () => {
  afterEach(() => {
    cleanupBrowserGlobals();
    vi.restoreAllMocks();
  });

  // ── Tier 1: Direct ID lookup ────────────────────────────────────────

  describe('Tier 1: Direct ID lookup', () => {
    it('finds control by exact ID via getById', async () => {
      const ctrl = createMockControl({ id: 'btn1', controlType: 'sap.m.Button' });
      setupBrowserGlobals({ btn1: ctrl });

      const result = await browserFindControl({
        ...BASE_PARAMS,
        selector: { id: 'btn1' },
      });

      expect(result.id).toBe('btn1');
      expect(result.controlType).toBe('sap.m.Button');
    });

    it('skips Tier 1 when forceRegistryScan is true', async () => {
      const ctrl = createMockControl({ id: 'btn1', controlType: 'sap.m.Button' });
      setupBrowserGlobals({ btn1: ctrl });

      const result = await browserFindControl({
        ...BASE_PARAMS,
        selector: { id: 'btn1' },
        forceRegistryScan: true,
      });

      // Should still find it via registry scan (Tier 2)
      expect(result.id).toBe('btn1');
    });
  });

  // ── Tier 2: Registry scan — GAP-02 enhancements ────────────────────

  describe('Tier 2: Registry scan', () => {
    it('matches by suffix (--id)', async () => {
      const ctrl = createMockControl({ id: 'view--btn1', controlType: 'sap.m.Button' });
      setupBrowserGlobals({ 'view--btn1': ctrl });

      const result = await browserFindControl({
        ...BASE_PARAMS,
        selector: { id: 'btn1' },
      });

      expect(result.id).toBe('view--btn1');
    });

    // ── Property matching ────────────────────────────────────────────

    describe('property matching', () => {
      it('matches control with matching properties', async () => {
        const ctrl = createMockControl({
          id: 'view--btn1',
          controlType: 'sap.m.Button',
          properties: { text: 'Save', enabled: true },
        });
        setupBrowserGlobals({ 'view--btn1': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: 'btn1', properties: { text: 'Save' } },
        });

        expect(result.id).toBe('view--btn1');
      });

      it('rejects control with mismatched properties', async () => {
        const ctrl = createMockControl({
          id: 'view--btn1',
          controlType: 'sap.m.Button',
          properties: { text: 'Cancel' },
        });
        setupBrowserGlobals({ 'view--btn1': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: 'btn1', properties: { text: 'Save' } },
        });

        expect(result.id).toBe('');
      });
    });

    // ── RegExp ID matching ───────────────────────────────────────────

    describe('RegExp ID matching', () => {
      it('matches control ID by regex pattern', async () => {
        const ctrl = createMockControl({ id: 'page--submitButton', controlType: 'sap.m.Button' });
        setupBrowserGlobals({ 'page--submitButton': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: '/submit/' },
          forceRegistryScan: true,
        });

        expect(result.id).toBe('page--submitButton');
      });

      it('rejects non-matching regex pattern', async () => {
        const ctrl = createMockControl({ id: 'page--cancelButton', controlType: 'sap.m.Button' });
        setupBrowserGlobals({ 'page--cancelButton': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: '/submit/' },
          forceRegistryScan: true,
        });

        expect(result.id).toBe('');
      });
    });

    // ── viewName matching ────────────────────────────────────────────

    describe('viewName matching', () => {
      it('matches control inside a view with the given name', async () => {
        const view = createMockControl({
          id: 'myView',
          controlType: 'sap.ui.core.mvc.View',
        });
        const ctrl = createMockControl({
          id: 'myView--btn1',
          controlType: 'sap.m.Button',
          parent: view,
        });
        setupBrowserGlobals({ 'myView--btn1': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: 'btn1', viewName: 'sap.ui.core.mvc.View' },
        });

        expect(result.id).toBe('myView--btn1');
      });

      it('rejects control not inside the expected view', async () => {
        const view = createMockControl({
          id: 'otherView',
          controlType: 'sap.ui.core.mvc.OtherView',
        });
        const ctrl = createMockControl({
          id: 'otherView--btn1',
          controlType: 'sap.m.Button',
          parent: view,
        });
        setupBrowserGlobals({ 'otherView--btn1': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: 'btn1', viewName: 'sap.ui.core.mvc.View' },
        });

        expect(result.id).toBe('');
      });
    });

    // ── bindingPath matching ─────────────────────────────────────────

    describe('bindingPath matching', () => {
      it('matches control with matching binding path', async () => {
        const ctrl = createMockControl({
          id: 'view--input1',
          controlType: 'sap.m.Input',
          binding: { value: { path: '/Products/Name' } },
        });
        setupBrowserGlobals({ 'view--input1': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: 'input1', bindingPath: { path: '/Products/Name' } },
        });

        expect(result.id).toBe('view--input1');
      });

      it('rejects control with mismatched binding path', async () => {
        const ctrl = createMockControl({
          id: 'view--input1',
          controlType: 'sap.m.Input',
          binding: { value: { path: '/Products/Description' } },
        });
        setupBrowserGlobals({ 'view--input1': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: 'input1', bindingPath: { path: '/Products/Name' } },
        });

        expect(result.id).toBe('');
      });

      it('rejects control with no binding', async () => {
        const ctrl = createMockControl({
          id: 'view--input1',
          controlType: 'sap.m.Input',
        });
        setupBrowserGlobals({ 'view--input1': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: 'input1', bindingPath: { path: '/Products/Name' } },
        });

        expect(result.id).toBe('');
      });
    });

    // ── controlType matching ─────────────────────────────────────────

    describe('controlType matching', () => {
      it('matches control with matching type in registry scan', async () => {
        const ctrl = createMockControl({ id: 'view--btn1', controlType: 'sap.m.Button' });
        setupBrowserGlobals({ 'view--btn1': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: 'btn1', controlType: 'sap.m.Button' },
        });

        expect(result.id).toBe('view--btn1');
      });

      it('rejects control with mismatched type', async () => {
        const ctrl = createMockControl({ id: 'view--btn1', controlType: 'sap.m.Link' });
        setupBrowserGlobals({ 'view--btn1': ctrl });

        const result = await browserFindControl({
          ...BASE_PARAMS,
          selector: { id: 'btn1', controlType: 'sap.m.Button' },
        });

        expect(result.id).toBe('');
      });
    });
  });

  // ── GAP-21: Visibility preference ──────────────────────────────────

  describe('preferVisibleControls', () => {
    beforeEach(() => {
      const hiddenCtrl = createMockControl({
        id: 'view--btn1',
        controlType: 'sap.m.Button',
        visible: false,
      });
      const visibleCtrl = createMockControl({
        id: 'page--btn1',
        controlType: 'sap.m.Button',
        visible: true,
      });
      setupBrowserGlobals({
        'view--btn1': hiddenCtrl,
        'page--btn1': visibleCtrl,
      });
    });

    it('prefers visible control when preferVisibleControls is true', async () => {
      const result = await browserFindControl({
        ...BASE_PARAMS,
        selector: { id: 'btn1' },
        preferVisibleControls: true,
        forceRegistryScan: true,
      });

      expect(result.visible).toBe(true);
    });

    it('returns first match when preferVisibleControls is false', async () => {
      const result = await browserFindControl({
        ...BASE_PARAMS,
        selector: { id: 'btn1' },
        preferVisibleControls: false,
        forceRegistryScan: true,
      });

      // Returns whatever is first in Object.keys order (not necessarily visible)
      expect(result.id).not.toBe('');
    });

    it('defaults to preferring visible controls (preferVisibleControls omitted)', async () => {
      const result = await browserFindControl({
        ...BASE_PARAMS,
        selector: { id: 'btn1' },
        forceRegistryScan: true,
      });

      expect(result.visible).toBe(true);
    });

    it('falls back to hidden control when no visible match exists', async () => {
      const hiddenOnly = createMockControl({
        id: 'view--btnHidden',
        controlType: 'sap.m.Button',
        visible: false,
      });
      cleanupBrowserGlobals();
      setupBrowserGlobals({ 'view--btnHidden': hiddenOnly });

      const result = await browserFindControl({
        ...BASE_PARAMS,
        selector: { id: 'btnHidden' },
        preferVisibleControls: true,
      });

      expect(result.id).toBe('view--btnHidden');
      expect(result.visible).toBe(false);
    });
  });

  // ── forceRegistryScan (registry strategy) ──────────────────────────

  describe('forceRegistryScan', () => {
    it('scans registry even without an ID when forceRegistryScan is true', async () => {
      const ctrl = createMockControl({
        id: 'someBtn',
        controlType: 'sap.m.Button',
        properties: { text: 'Save' },
      });
      setupBrowserGlobals({ someBtn: ctrl });

      const result = await browserFindControl({
        ...BASE_PARAMS,
        selector: { controlType: 'sap.m.Button' },
        forceRegistryScan: true,
      });

      expect(result.id).toBe('someBtn');
      expect(result.controlType).toBe('sap.m.Button');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty result when bridge is not injected', async () => {
      const result = await browserFindControl({
        ...BASE_PARAMS,
        selector: { id: 'btn1' },
      });

      expect(result.id).toBe('');
      expect(result.controlType).toBe('unknown');
    });

    it('returns empty result when selector is empty object', async () => {
      setupBrowserGlobals({});

      const result = await browserFindControl({
        ...BASE_PARAMS,
        selector: {},
      });

      expect(result.id).toBe('');
    });
  });
});
