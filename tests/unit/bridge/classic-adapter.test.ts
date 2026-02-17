/**
 * Tests for `src/bridge/classic-adapter.ts`.
 *
 * @remarks
 * Validates the ClassicUI5Adapter — the primary adapter (95%+ of use cases)
 * with lazy initialization (W19) and full BridgeAdapter interface.
 *
 * init() calls: waitForFunction (UI5 avail) → evaluate (injection) →
 * evaluate (object-map) → waitForFunction (bridge ready) →
 * evaluate (version detection).
 */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgePage } from '../../helpers/mock-page.js';

import { ClassicUI5Adapter } from '#bridge/classic-adapter.js';

/**
 * Helper: creates a mock page pre-configured for a successful init().
 * After init, evaluate defaults to `fallback` for subsequent calls.
 *
 * init() calls: injection script → object-map script → version detection
 */
function mockPageForInit(fallback?: unknown): ReturnType<typeof createMockBridgePage> {
  return createMockBridgePage({
    evaluate: vi
      .fn()
      .mockResolvedValueOnce(undefined) // injection script
      .mockResolvedValueOnce(undefined) // object-map script
      .mockResolvedValueOnce('1.120.0') // version detection
      .mockResolvedValue(fallback), // subsequent calls
    waitForFunction: vi.fn().mockResolvedValue(undefined),
  });
}

describe('ClassicUI5Adapter', () => {
  // ── Lifecycle ──────────────────────────────────────────────────────
  describe('lifecycle', () => {
    it('initializes with a page and detects UI5 version', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce(true), // isReady → isBridgeReady
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      expect(await adapter.isReady()).toBe(true);
    });

    it('isReady returns false before init', async () => {
      const adapter = new ClassicUI5Adapter();
      expect(await adapter.isReady()).toBe(false);
    });

    it('destroy resets state', async () => {
      const page = mockPageForInit();
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      await adapter.destroy();
      expect(await adapter.isReady()).toBe(false);
    });
  });

  // ── Version detection ──────────────────────────────────────────────
  describe('version detection', () => {
    it('returns detected UI5 version', async () => {
      const page = mockPageForInit();
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      expect(await adapter.getUI5Version()).toBe('1.120.0');
    });

    it('isWebComponent returns false', async () => {
      const page = mockPageForInit();
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      expect(await adapter.isWebComponent()).toBe(false);
    });
  });

  // ── Control discovery ──────────────────────────────────────────────
  describe('findControl', () => {
    it('returns control info for valid selector', async () => {
      const discoveryResult = {
        id: 'btn1',
        controlType: 'sap.m.Button',
        methods: ['getText', 'setText'],
        domId: 'btn1',
        visible: true,
      };
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce(discoveryResult), // findControl
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const result = await adapter.findControl({ id: 'btn1' });
      expect(result).toEqual(expect.objectContaining({ id: 'btn1', controlType: 'sap.m.Button' }));
    });

    it('returns null for not-found control', async () => {
      const emptyResult = {
        id: '',
        controlType: 'unknown',
        methods: [],
        domId: null,
        visible: false,
      };
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce(emptyResult), // findControl
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const result = await adapter.findControl({ id: 'nonexistent' });
      expect(result).toBeNull();
    });
  });

  describe('findControls', () => {
    it('returns array of controls', async () => {
      const results = [
        { id: 'btn1', controlType: 'sap.m.Button', methods: [], domId: 'btn1', visible: true },
        { id: 'btn2', controlType: 'sap.m.Button', methods: [], domId: 'btn2', visible: true },
      ];
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce(results), // findControls
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const found = await adapter.findControls({ controlType: 'sap.m.Button' });
      expect(found).toHaveLength(2);
    });
  });

  // ── Control interaction ────────────────────────────────────────────
  describe('getControlProperty', () => {
    it('returns property value', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce({
            success: true,
            returnType: 'result',
            value: 'Submit',
            duration: 1,
          }),
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const value = await adapter.getControlProperty('btn1', 'text');
      expect(value).toBe('Submit');
    });
  });

  describe('setControlProperty', () => {
    it('calls evaluate to set property', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce(undefined), // setProperty
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      await adapter.setControlProperty('btn1', 'text', 'New Text');
      // 4 evaluate calls: injection + object-map + version + setProperty
      expect(page.evaluate).toHaveBeenCalledTimes(4);
    });
  });

  describe('getControlAggregation', () => {
    it('returns aggregation items', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce({
            success: true,
            returnType: 'aggregation',
            uuids: ['item1', 'item2'],
            objectTypes: ['sap.m.StandardListItem', 'sap.m.StandardListItem'],
            duration: 1,
          }),
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const items = await adapter.getControlAggregation('list1', 'items');
      expect(items).toHaveLength(2);
    });

    it('returns empty array for non-aggregation return type', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce({
            success: true,
            returnType: 'result',
            value: null,
            duration: 1,
          }),
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const items = await adapter.getControlAggregation('list1', 'items');
      expect(items).toEqual([]);
    });
  });

  describe('executeControlMethod', () => {
    it('executes method and returns result', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce({
            success: true,
            returnType: 'result',
            value: 'Hello',
            duration: 1,
          }),
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const result = await adapter.executeControlMethod('btn1', 'getText', []);
      expect(result).toBe('Hello');
    });
  });

  // ── UI5 stability ──────────────────────────────────────────────────
  describe('waitForUI5Stable', () => {
    it('calls waitForFunction to check stability', async () => {
      const page = mockPageForInit();
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      await adapter.waitForUI5Stable();
      // waitForFunction called during init + stability check
      expect(page.waitForFunction).toHaveBeenCalled();
    });

    it('uses custom timeout when provided', async () => {
      const page = mockPageForInit();
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      await adapter.waitForUI5Stable(5000);
      const lastCall = vi.mocked(page.waitForFunction).mock.calls.at(-1);
      expect(lastCall?.[1]).toEqual(expect.objectContaining({ timeout: 5000 }));
    });
  });

  // ── Object access ──────────────────────────────────────────────────
  describe('getModel', () => {
    it('returns model data', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce({ name: 'default' }), // getModel
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const model = await adapter.getModel('view1');
      expect(model).toEqual({ name: 'default' });
    });

    it('returns named model data', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce({ name: 'odata' }), // getModel with name
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const model = await adapter.getModel('view1', 'odata');
      expect(model).toEqual({ name: 'odata' });
    });
  });

  describe('getBindingContext', () => {
    it('returns binding context', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce({ path: '/Products(1)' }), // getBindingContext
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const ctx = await adapter.getBindingContext('table1');
      expect(ctx).toEqual({ path: '/Products(1)' });
    });

    it('returns named binding context', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce({ path: '/Orders(2)' }), // getBindingContext with name
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const ctx = await adapter.getBindingContext('table1', 'odata');
      expect(ctx).toEqual({ path: '/Orders(2)' });
    });
  });

  // ── Introspection ──────────────────────────────────────────────────
  describe('describeControl', () => {
    it('returns control metadata', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce({
            id: 'btn1',
            controlType: 'sap.m.Button',
            properties: { text: 'Submit' },
          }),
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const desc = await adapter.describeControl('btn1');
      expect(desc).toHaveProperty('id', 'btn1');
    });
  });

  describe('getAvailableMethods', () => {
    it('returns filtered method list', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce(['getText', 'setText', 'getEnabled']),
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const methods = await adapter.getAvailableMethods('btn1');
      expect(methods).toContain('getText');
    });
  });

  // ── getSelectorForControl ─────────────────────────────────────────
  describe('getSelectorForControl', () => {
    it('returns selector info for known control', async () => {
      const selectorResult = {
        selector: { controlType: 'sap.m.Button', properties: { text: 'Save' } },
        strategy: 'properties',
      };
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce(selectorResult), // getSelectorForControl
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const result = await adapter.getSelectorForControl('btn1');
      expect(result).toEqual(selectorResult);
    });

    it('returns null for unknown control', async () => {
      const page = createMockBridgePage({
        evaluate: vi
          .fn()
          .mockResolvedValueOnce(undefined) // injection
          .mockResolvedValueOnce(undefined) // object-map
          .mockResolvedValueOnce('1.120.0') // version
          .mockResolvedValueOnce(null), // getSelectorForControl
        waitForFunction: vi.fn().mockResolvedValue(undefined),
      });
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      const result = await adapter.getSelectorForControl('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ── resetInjectionState ───────────────────────────────────────────
  describe('resetInjectionState', () => {
    it('resets injection state without error', async () => {
      const page = mockPageForInit();
      const adapter = new ClassicUI5Adapter();
      await adapter.init(page);
      expect(() => {
        adapter.resetInjectionState();
      }).not.toThrow();
    });

    it('is a no-op when adapter not initialized', () => {
      const adapter = new ClassicUI5Adapter();
      expect(() => {
        adapter.resetInjectionState();
      }).not.toThrow();
    });
  });

  // ── Error handling ─────────────────────────────────────────────────
  describe('error handling', () => {
    it('throws when calling methods before init', async () => {
      const adapter = new ClassicUI5Adapter();
      await expect(adapter.findControl({ id: 'btn1' })).rejects.toThrow();
    });
  });
});
