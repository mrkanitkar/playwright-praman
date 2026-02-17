/**
 * Tests for `src/bridge/adapter.ts` — BridgeAdapter interface.
 *
 * @remarks
 * Type-level and structural verification of the BridgeAdapter interface.
 * Ensures the interface is correctly exported and can be implemented.
 */
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import type { BridgeAdapter } from '#bridge/adapter.js';
import type { UI5ControlBase } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';

describe('BridgeAdapter', () => {
  // ── Interface shape verification ─────────────────────────────────────
  it('has lifecycle methods', () => {
    expectTypeOf<BridgeAdapter>().toHaveProperty('init');
    expectTypeOf<BridgeAdapter>().toHaveProperty('isReady');
    expectTypeOf<BridgeAdapter>().toHaveProperty('destroy');
  });

  it('has version detection methods', () => {
    expectTypeOf<BridgeAdapter>().toHaveProperty('getUI5Version');
    expectTypeOf<BridgeAdapter>().toHaveProperty('isWebComponent');
  });

  it('has control discovery methods', () => {
    expectTypeOf<BridgeAdapter>().toHaveProperty('findControl');
    expectTypeOf<BridgeAdapter>().toHaveProperty('findControls');
  });

  it('has control interaction methods', () => {
    expectTypeOf<BridgeAdapter>().toHaveProperty('getControlProperty');
    expectTypeOf<BridgeAdapter>().toHaveProperty('setControlProperty');
    expectTypeOf<BridgeAdapter>().toHaveProperty('getControlAggregation');
    expectTypeOf<BridgeAdapter>().toHaveProperty('executeControlMethod');
  });

  it('has stability method', () => {
    expectTypeOf<BridgeAdapter>().toHaveProperty('waitForUI5Stable');
  });

  it('has object access methods', () => {
    expectTypeOf<BridgeAdapter>().toHaveProperty('getModel');
    expectTypeOf<BridgeAdapter>().toHaveProperty('getBindingContext');
  });

  it('has AI introspection methods', () => {
    expectTypeOf<BridgeAdapter>().toHaveProperty('describeControl');
    expectTypeOf<BridgeAdapter>().toHaveProperty('getAvailableMethods');
    expectTypeOf<BridgeAdapter>().toHaveProperty('getSelectorForControl');
  });

  it('has injection management methods', () => {
    expectTypeOf<BridgeAdapter>().toHaveProperty('resetInjectionState');
  });

  // ── Mock adapter satisfies interface ─────────────────────────────────
  it('can be implemented as a mock adapter', () => {
    const mockAdapter: BridgeAdapter = {
      init: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      isReady: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
      destroy: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      getUI5Version: vi.fn<() => Promise<string>>().mockResolvedValue('1.120.0'),
      isWebComponent: vi.fn<() => Promise<boolean>>().mockResolvedValue(false),
      findControl: vi
        .fn<(selector: UI5Selector) => Promise<UI5ControlBase | null>>()
        .mockResolvedValue(null),
      findControls: vi
        .fn<(selector: UI5Selector) => Promise<readonly UI5ControlBase[]>>()
        .mockResolvedValue([]),
      getControlProperty: vi
        .fn<(id: string, prop: string) => Promise<unknown>>()
        .mockResolvedValue(undefined),
      setControlProperty: vi
        .fn<(id: string, prop: string, val: unknown) => Promise<void>>()
        .mockResolvedValue(undefined),
      getControlAggregation: vi
        .fn<(id: string, name: string) => Promise<readonly UI5ControlBase[]>>()
        .mockResolvedValue([]),
      executeControlMethod: vi
        .fn<(id: string, name: string, args: readonly unknown[]) => Promise<unknown>>()
        .mockResolvedValue(undefined),
      waitForUI5Stable: vi.fn<(timeout?: number) => Promise<void>>().mockResolvedValue(undefined),
      getModel: vi
        .fn<(id: string, name?: string) => Promise<unknown>>()
        .mockResolvedValue(undefined),
      getBindingContext: vi
        .fn<(id: string, name?: string) => Promise<unknown>>()
        .mockResolvedValue(undefined),
      describeControl: vi
        .fn<(id: string) => Promise<Record<string, unknown>>>()
        .mockResolvedValue({}),
      getAvailableMethods: vi
        .fn<(id: string) => Promise<readonly string[]>>()
        .mockResolvedValue([]),
      getSelectorForControl: vi
        .fn<(id: string) => Promise<{ selector: UI5Selector; strategy: string } | null>>()
        .mockResolvedValue(null),
      resetInjectionState: vi.fn<() => void>(),
    };

    expect(mockAdapter).toBeDefined();
    expect(typeof mockAdapter.init).toBe('function');
    expect(typeof mockAdapter.findControl).toBe('function');
    expect(typeof mockAdapter.describeControl).toBe('function');
  });
});
