/**
 * Tests for `src/proxy/dynamic-proxy.ts`.
 *
 * @remarks
 * Validates the unified Proxy handler for UI5 controls (D16).
 * Single proxy with get trap: Playwright API → anti-thenable → direct
 * props → blacklist check → method forwarding.
 */
/* eslint-disable @typescript-eslint/no-unsafe-call -- dynamic proxy methods aren't statically typed */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- proxy returns unknown from dynamic get */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';

import type { ControlProxyState } from '#proxy/dynamic-proxy.js';
import { createControlProxy } from '#proxy/dynamic-proxy.js';

function createTestState(overrides?: Partial<ControlProxyState>): ControlProxyState {
  return {
    id: 'saveBtn',
    controlType: 'sap.m.Button',
    methods: new Set(['getText', 'setText', 'getEnabled', 'firePress']),
    adapter: createMockBridgeAdapter(),
    ...overrides,
  };
}

/** Helper to access dynamic proxy methods that aren't on the static type. */
function getDynamicMethod(
  proxy: Record<string, unknown>,
  name: string,
): (...args: unknown[]) => Promise<unknown> {
  return proxy[name] as (...args: unknown[]) => Promise<unknown>;
}

describe('dynamic-proxy', () => {
  // ── Property access ──────────────────────────────────────────────
  describe('property access', () => {
    it('proxy intercepts property access', () => {
      const state = createTestState();
      const proxy = createControlProxy(state);
      expect(typeof proxy.getText).toBe('function');
    });

    it('getId() returns control ID', async () => {
      const state = createTestState();
      const proxy = createControlProxy(state);
      expect(await proxy.getId()).toBe('saveBtn');
    });

    it('getControlType() returns type string', async () => {
      const state = createTestState();
      const proxy = createControlProxy(state);
      expect(await proxy.getControlType()).toBe('sap.m.Button');
    });

    it('id property returns control ID directly', () => {
      const state = createTestState();
      const proxy = createControlProxy(state);
      expect(proxy.id).toBe('saveBtn');
    });

    it('controlType property returns type directly', () => {
      const state = createTestState();
      const proxy = createControlProxy(state);
      expect(proxy.controlType).toBe('sap.m.Button');
    });
  });

  // ── Anti-thenable ────────────────────────────────────────────────
  describe('anti-thenable', () => {
    it('then returns undefined', () => {
      const state = createTestState();
      const proxy = createControlProxy(state) as Record<string, unknown>;
      expect(proxy['then']).toBeUndefined();
    });

    it('catch returns undefined', () => {
      const state = createTestState();
      const proxy = createControlProxy(state) as Record<string, unknown>;
      expect(proxy['catch']).toBeUndefined();
    });

    it('finally returns undefined', () => {
      const state = createTestState();
      const proxy = createControlProxy(state) as Record<string, unknown>;
      expect(proxy['finally']).toBeUndefined();
    });
  });

  // ── Blacklist enforcement ────────────────────────────────────────
  describe('blacklist enforcement', () => {
    it('blacklisted method throws ControlError', () => {
      const state = createTestState();
      const proxy = createControlProxy(state) as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/dot-notation -- testing blacklisted property access
      expect(() => proxy['constructor']).toThrow();
    });

    it('underscore-prefixed method throws', () => {
      const state = createTestState();
      const proxy = createControlProxy(state) as Record<string, unknown>;
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
      const proxy = createControlProxy(state);
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
      const proxy = createControlProxy(state) as Record<string, unknown>;
      const fn = getDynamicMethod(proxy, 'getCustomValue');
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
      const proxy = createControlProxy(state);
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
      const proxy = createControlProxy(state);
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
      const proxy = createControlProxy(createTestState({ adapter }));
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
      const proxy = createControlProxy(createTestState({ adapter }));
      expect(await proxy.setText('x')).toBeUndefined();
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
      const proxy = createControlProxy(createTestState({ adapter })) as Record<string, unknown>;
      const fn = getDynamicMethod(proxy, 'getItems');
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
      const proxy = createControlProxy(createTestState({ adapter }));
      await expect(proxy.getText()).rejects.toThrow('Control not found');
    });

    it('propagates adapter rejection errors', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockRejectedValue(new Error('Network timeout')),
      });
      const proxy = createControlProxy(createTestState({ adapter }));
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
      const toStr = proxy.toString.bind(proxy) as () => string;
      expect(toStr()).toBe('[UI5Control sap.m.Button#saveBtn]');
    });

    it('Symbol.toPrimitive handles string hint', () => {
      const proxy = createControlProxy(createTestState());
      const toPrimitive = (proxy as Record<symbol, unknown>)[Symbol.toPrimitive] as (
        hint: string,
      ) => string;
      expect(toPrimitive('string')).toBe('[UI5Control sap.m.Button#saveBtn]');
    });

    it('getProperty forwards to adapter.getControlProperty', async () => {
      const adapter = createMockBridgeAdapter({
        getControlProperty: vi.fn().mockResolvedValue('Save'),
      });
      const proxy = createControlProxy(createTestState({ adapter }));
      expect(await proxy.getProperty('text')).toBe('Save');
      expect(adapter.getControlProperty).toHaveBeenCalledWith('saveBtn', 'text');
    });

    it('setProperty forwards to adapter.setControlProperty', async () => {
      const adapter = createMockBridgeAdapter();
      const proxy = createControlProxy(createTestState({ adapter }));
      await proxy.setProperty('text', 'New');
      expect(adapter.setControlProperty).toHaveBeenCalledWith('saveBtn', 'text', 'New');
    });

    it('getAggregation forwards to adapter.getControlAggregation', async () => {
      const adapter = createMockBridgeAdapter({
        getControlAggregation: vi
          .fn()
          .mockResolvedValue([{ id: 'item1', controlType: 'sap.m.StandardListItem' }]),
      });
      const proxy = createControlProxy(createTestState({ adapter }));
      const items = await proxy.getAggregation('items');
      expect(items).toHaveLength(1);
    });
  });
});
