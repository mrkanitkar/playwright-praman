/**
 * Tests for `src/proxy/dynamic-proxy.ts`.
 *
 * @remarks
 * Validates the unified Proxy handler for UI5 controls (D16).
 * Single proxy with get trap: Playwright API → anti-thenable → direct
 * props → blacklist check → method forwarding.
 */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';

import type { UI5ControlBase } from '#core/types/controls.js';
import type { ControlProxyState } from '#proxy/dynamic-proxy.js';
import { createControlProxy } from '#proxy/dynamic-proxy.js';

/**
 * Test-only interface for accessing dynamic proxy methods.
 * The proxy supports arbitrary method calls via its get trap, but `UI5ControlBase`
 * only declares known base methods. This extends it for test assertions.
 */
interface TestButtonProxy extends UI5ControlBase {
  getText(): Promise<string>;
  setText(text: string): Promise<void>;
  getEnabled(): Promise<boolean>;
  firePress(): Promise<void>;
  getModel(name?: string): Promise<unknown>;
  getVisible(): Promise<boolean>;
  isBound(name: string): Promise<boolean>;
}

function createTestState(overrides?: Partial<ControlProxyState>): ControlProxyState {
  return {
    id: 'saveBtn',
    controlType: 'sap.m.Button',
    methods: new Set(['getText', 'setText', 'getEnabled', 'firePress']),
    adapter: createMockBridgeAdapter(),
    ...overrides,
  };
}

/** Casts a proxy to a record for dynamic property access in tests. */
function toRecord(proxy: TestButtonProxy): Record<string, unknown> {
  const obj: unknown = proxy;
  return obj as Record<string, unknown>;
}

describe('dynamic-proxy', () => {
  // ── Property access ──────────────────────────────────────────────
  describe('property access', () => {
    it('proxy intercepts property access', () => {
      const state = createTestState();
      const proxy = createControlProxy(state) as TestButtonProxy;
      expect(typeof proxy.getText).toBe('function');
    });

    it('getId() returns control ID', async () => {
      const state = createTestState();
      const proxy = createControlProxy(state) as TestButtonProxy;
      expect(await proxy.getId()).toBe('saveBtn');
    });

    it('getControlType() returns type string', async () => {
      const state = createTestState();
      const proxy = createControlProxy(state) as TestButtonProxy;
      expect(await proxy.getControlType()).toBe('sap.m.Button');
    });

    it('id property returns control ID directly', () => {
      const state = createTestState();
      const proxy = createControlProxy(state) as TestButtonProxy;
      expect(proxy.id).toBe('saveBtn');
    });

    it('controlType property returns type directly', () => {
      const state = createTestState();
      const proxy = createControlProxy(state) as TestButtonProxy;
      expect(proxy.controlType).toBe('sap.m.Button');
    });
  });

  // ── Anti-thenable ────────────────────────────────────────────────
  describe('anti-thenable', () => {
    it('then returns undefined', () => {
      const state = createTestState();
      const proxy = toRecord(createControlProxy(state) as TestButtonProxy);
      expect(proxy['then']).toBeUndefined();
    });

    it('catch returns undefined', () => {
      const state = createTestState();
      const proxy = toRecord(createControlProxy(state) as TestButtonProxy);
      expect(proxy['catch']).toBeUndefined();
    });

    it('finally returns undefined', () => {
      const state = createTestState();
      const proxy = toRecord(createControlProxy(state) as TestButtonProxy);
      expect(proxy['finally']).toBeUndefined();
    });
  });

  // ── Blacklist enforcement ────────────────────────────────────────
  describe('blacklist enforcement', () => {
    it('blacklisted method throws ControlError', () => {
      const state = createTestState();
      const proxy = toRecord(createControlProxy(state) as TestButtonProxy);
      // eslint-disable-next-line @typescript-eslint/dot-notation -- testing blacklisted property access
      expect(() => proxy['constructor']).toThrow();
    });

    it('underscore-prefixed method throws', () => {
      const state = createTestState();
      const proxy = toRecord(createControlProxy(state) as TestButtonProxy);
      expect(() => proxy['_internal']).toThrow();
    });
  });

  // ── Method forwarding ────────────────────────────────────────────
  describe('method forwarding', () => {
    it('known method calls executeControlMethod on adapter', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockResolvedValue({
          success: true,
          returnType: 'result',
          value: 'Save',
          duration: 1,
        }),
      });
      const state = createTestState({ adapter });
      const proxy = createControlProxy(state) as TestButtonProxy;
      const result = await proxy.getText();
      expect(result).toBe('Save');
      expect(adapter.executeControlMethod).toHaveBeenCalledWith('saveBtn', 'getText', []);
    });

    it('unknown method forwards dynamically', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockResolvedValue({
          success: true,
          returnType: 'result',
          value: 'custom-result',
          duration: 1,
        }),
      });
      const state = createTestState({ adapter });
      const proxy = toRecord(createControlProxy(state) as TestButtonProxy);
      const fn = proxy['getCustomValue'] as (...args: unknown[]) => Promise<unknown>;
      expect(fn).toBeDefined();
      const result = await fn();
      expect(result).toBe('custom-result');
    });

    it('passes arguments to executeControlMethod', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockResolvedValue({
          success: true,
          returnType: 'empty',
          duration: 1,
        }),
      });
      const state = createTestState({ adapter });
      const proxy = createControlProxy(state) as TestButtonProxy;
      await proxy.setText('New Text');
      expect(adapter.executeControlMethod).toHaveBeenCalledWith('saveBtn', 'setText', ['New Text']);
    });

    it('multiple method calls in sequence resolve correctly', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi
          .fn()
          .mockResolvedValueOnce({
            success: true,
            returnType: 'result',
            value: 'Save',
            duration: 1,
          })
          .mockResolvedValueOnce({
            success: true,
            returnType: 'result',
            value: true,
            duration: 1,
          }),
      });
      const state = createTestState({ adapter });
      const proxy = createControlProxy(state) as TestButtonProxy;
      expect(await proxy.getText()).toBe('Save');
      expect(await proxy.getEnabled()).toBe(true);
    });
  });

  // ── Return type handling ─────────────────────────────────────────
  describe('return type handling', () => {
    it('returns value for "result" returnType', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockResolvedValue({
          success: true,
          returnType: 'result',
          value: 'Save',
          duration: 1,
        }),
      });
      const proxy = createControlProxy(createTestState({ adapter })) as TestButtonProxy;
      expect(await proxy.getText()).toBe('Save');
    });

    it('returns undefined for "empty" returnType', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockResolvedValue({
          success: true,
          returnType: 'empty',
          duration: 1,
        }),
      });
      const proxy = createControlProxy(createTestState({ adapter })) as TestButtonProxy;
      const setTextFn = proxy.setText.bind(proxy) as (...args: unknown[]) => Promise<unknown>;
      const result = await setTextFn('x');
      expect(result).toBeUndefined();
    });

    it('returns array for "aggregation" returnType', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockResolvedValue({
          success: true,
          returnType: 'aggregation',
          uuids: ['a', 'b'],
          objectTypes: ['sap.m.StandardListItem', 'sap.m.StandardListItem'],
          duration: 1,
        }),
      });
      const proxy = toRecord(createControlProxy(createTestState({ adapter })) as TestButtonProxy);
      const fn = proxy['getItems'] as (...args: unknown[]) => Promise<unknown>;
      const result = await fn();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ── Error propagation ────────────────────────────────────────────
  describe('error propagation', () => {
    it('propagates adapter execution errors', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockResolvedValue({
          success: false,
          returnType: 'result',
          error: 'Control not found',
          duration: 1,
        }),
      });
      const proxy = createControlProxy(createTestState({ adapter })) as TestButtonProxy;
      await expect(proxy.getText()).rejects.toThrow('Control not found');
    });

    it('propagates adapter rejection errors', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockRejectedValue(new Error('Network timeout')),
      });
      const proxy = createControlProxy(createTestState({ adapter })) as TestButtonProxy;
      await expect(proxy.getText()).rejects.toThrow('Network timeout');
    });
  });

  // ── Proxy behavior ──────────────────────────────────────────────
  describe('proxy behavior', () => {
    it('proxy is not extensible', () => {
      const proxy = createControlProxy(createTestState());
      expect(Object.isExtensible(proxy)).toBe(false);
    });

    it('toString() returns meaningful string', () => {
      const proxy = createControlProxy(createTestState());
      const toStr = Reflect.get(proxy, 'toString') as () => string;
      expect(toStr()).toBe('[UI5Control sap.m.Button#saveBtn]');
    });

    it('Symbol.toPrimitive handles string hint', () => {
      const proxy = createControlProxy(createTestState());
      const toPrimitive = Reflect.get(proxy, Symbol.toPrimitive) as (hint: string) => string;
      expect(toPrimitive('string')).toBe('[UI5Control sap.m.Button#saveBtn]');
    });

    it('getProperty forwards to adapter.getControlProperty', async () => {
      const adapter = createMockBridgeAdapter({
        getControlProperty: vi.fn().mockResolvedValue('Save'),
      });
      const proxy = createControlProxy(createTestState({ adapter })) as TestButtonProxy;
      expect(await proxy.getProperty('text')).toBe('Save');
      expect(adapter.getControlProperty).toHaveBeenCalledWith('saveBtn', 'text');
    });

    it('setProperty forwards to adapter.setControlProperty', async () => {
      const adapter = createMockBridgeAdapter();
      const proxy = createControlProxy(createTestState({ adapter })) as TestButtonProxy;
      await proxy.setProperty('text', 'New');
      expect(adapter.setControlProperty).toHaveBeenCalledWith('saveBtn', 'text', 'New');
    });

    it('getAggregation forwards to adapter.getControlAggregation', async () => {
      const adapter = createMockBridgeAdapter({
        getControlAggregation: vi
          .fn()
          .mockResolvedValue([{ id: 'item1', controlType: 'sap.m.StandardListItem' }]),
      });
      const proxy = createControlProxy(createTestState({ adapter })) as TestButtonProxy;
      const items = await proxy.getAggregation('items');
      expect(items).toHaveLength(1);
    });

    it('getBindingInfo returns undefined', async () => {
      const proxy = createControlProxy(createTestState()) as TestButtonProxy;
      expect(await proxy.getBindingInfo('text')).toBeUndefined();
    });

    it('getDomRef returns null', async () => {
      const proxy = createControlProxy(createTestState()) as TestButtonProxy;
      expect(await proxy.getDomRef()).toBeNull();
    });

    it('getVisible returns true', async () => {
      const proxy = createControlProxy(createTestState()) as TestButtonProxy;
      expect(await proxy.getVisible()).toBe(true);
    });

    it('isBound returns false', async () => {
      const proxy = createControlProxy(createTestState()) as TestButtonProxy;
      expect(await proxy.isBound('text')).toBe(false);
    });

    it('getModel forwards to adapter.getModel', async () => {
      const adapter = createMockBridgeAdapter({
        getModel: vi.fn().mockResolvedValue({ uuid: 'model-uuid' }),
      });
      const proxy = createControlProxy(createTestState({ adapter })) as TestButtonProxy;
      expect(await proxy.getModel('named')).toEqual({ uuid: 'model-uuid' });
      expect(adapter.getModel).toHaveBeenCalledWith('saveBtn', 'named');
    });

    it('preventExtensions returns true', () => {
      const proxy = createControlProxy(createTestState());
      expect(Object.preventExtensions(proxy)).toBe(proxy);
    });

    it('symbol access returns undefined for non-toPrimitive', () => {
      const proxy = createControlProxy(createTestState());
      expect(Reflect.get(proxy, Symbol.iterator)).toBeUndefined();
    });
  });
});
