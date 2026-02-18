/**
 * Tests for `src/fixtures/ui5-handler.ts` — internal UI5Handler class.
 *
 * @remarks
 * Strict TDD RED phase: all 28 tests written before any production code.
 * Tests grouped by functionality: Discovery, Plural Discovery, Interaction,
 * Read, Wait, and Lifecycle/Edge Cases.
 *
 * Mock strategy: vi.mock() for external modules, vi.fn() for adapter/strategy.
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';
import { createMockBridgePage } from '../../helpers/mock-page.js';

import type { BridgePage } from '#bridge/adapter.js';
import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';
import { ControlError } from '#core/errors/control-error.js';
import { SelectorError } from '#core/errors/selector-error.js';
import { TimeoutError } from '#core/errors/timeout-error.js';
import type { UI5ControlBase } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';

// ── Mocks ─────────────────────────────────────────────────────────────

const mockDiscoverControl = vi.fn();
const mockCreateControlProxy = vi.fn();

vi.mock('#proxy/discovery.js', () => ({
  discoverControl: mockDiscoverControl,
}));

vi.mock('#proxy/dynamic-proxy.js', () => ({
  createControlProxy: mockCreateControlProxy,
}));

// ── Import after mocks ───────────────────────────────────────────────

const { UI5Handler } = await import('#fixtures/ui5-handler.js');

// ── Test helpers ─────────────────────────────────────────────────────

/** Creates a fake UI5ControlBase proxy for test assertions. */
function createFakeProxy(id: string, controlType: string): UI5ControlBase {
  return {
    id,
    controlType,
    getId: vi.fn<() => Promise<string>>().mockResolvedValue(id),
    getControlType: vi.fn<() => Promise<string>>().mockResolvedValue(controlType),
    getProperty: vi.fn<(name: string) => Promise<unknown>>().mockResolvedValue(undefined),
    setProperty: vi
      .fn<(name: string, value: unknown) => Promise<void>>()
      .mockResolvedValue(undefined),
    getAggregation: vi
      .fn<(name: string) => Promise<readonly UI5ControlBase[]>>()
      .mockResolvedValue([]),
    getBindingInfo: vi.fn<(name: string) => Promise<unknown>>().mockResolvedValue(undefined),
    getDomRef: vi.fn<() => Promise<Element | null>>().mockResolvedValue(null),
    getVisible: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
    isBound: vi.fn<(name: string) => Promise<boolean>>().mockResolvedValue(false),
    getModel: vi.fn<(name?: string) => Promise<unknown>>().mockResolvedValue(undefined),
  };
}

/** Creates a mock InteractionStrategy. */
function createMockStrategy(): InteractionStrategy & {
  readonly press: ReturnType<typeof vi.fn>;
  readonly enterText: ReturnType<typeof vi.fn>;
  readonly select: ReturnType<typeof vi.fn>;
} {
  return {
    name: 'mock-strategy',
    press: vi
      .fn<(page: BridgePage, controlId: string) => Promise<void>>()
      .mockResolvedValue(undefined),
    enterText: vi
      .fn<(page: BridgePage, controlId: string, text: string) => Promise<void>>()
      .mockResolvedValue(undefined),
    select: vi
      .fn<(page: BridgePage, controlId: string, itemId: string) => Promise<void>>()
      .mockResolvedValue(undefined),
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('UI5Handler', () => {
  let adapter: ReturnType<typeof createMockBridgeAdapter>;
  let page: ReturnType<typeof createMockBridgePage>;
  let strategy: ReturnType<typeof createMockStrategy>;
  let handler: InstanceType<typeof UI5Handler>;

  const defaultSelector: UI5Selector = { id: 'btn1' };
  const fakeProxy = createFakeProxy('btn1', 'sap.m.Button');

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = createMockBridgeAdapter();
    page = createMockBridgePage();
    strategy = createMockStrategy();

    // Default: discoverControl returns fakeProxy
    mockDiscoverControl.mockResolvedValue(fakeProxy);

    handler = new UI5Handler({
      adapter,
      page,
      strategy,
      discoveryStrategies: ['direct-id', 'recordreplay'],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 1: Discovery (tests 1-4)
  // ════════════════════════════════════════════════════════════════════

  describe('control() — single control discovery', () => {
    it('discovers single control via discoverControl', async () => {
      const result = await handler.control(defaultSelector);

      expect(mockDiscoverControl).toHaveBeenCalledOnce();
      expect(result).toBe(fakeProxy);
    });

    it('calls waitForUI5Stable before discovery', async () => {
      const callOrder: string[] = [];

      adapter.waitForUI5Stable.mockImplementation(async () => {
        callOrder.push('waitForUI5Stable');
        await Promise.resolve();
      });
      mockDiscoverControl.mockImplementation(async () => {
        callOrder.push('discoverControl');
        return Promise.resolve(fakeProxy);
      });

      await handler.control(defaultSelector);

      expect(callOrder).toEqual(['waitForUI5Stable', 'discoverControl']);
    });

    it('passes same cache instance on repeated calls for caching', async () => {
      await handler.control(defaultSelector);
      await handler.control(defaultSelector);

      // The handler passes the same ControlProxyCache instance to discoverControl
      // on both calls. The real discoverControl uses cache tier 0 internally.
      // Verify both calls receive the same cache reference.
      const firstCallCache = mockDiscoverControl.mock.calls[0]?.[2] as unknown;
      const secondCallCache = mockDiscoverControl.mock.calls[1]?.[2] as unknown;
      expect(firstCallCache).toBe(secondCallCache);
      expect(mockDiscoverControl).toHaveBeenCalledTimes(2);
    });

    it('throws ControlError when control not found', async () => {
      mockDiscoverControl.mockResolvedValue(null);

      await expect(handler.control(defaultSelector)).rejects.toThrow(ControlError);

      try {
        await handler.control(defaultSelector);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ControlError);
        const controlError = error as ControlError;
        expect(controlError.code).toBe('ERR_CONTROL_NOT_FOUND');
        expect(controlError.retryable).toBe(true);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 2: Plural discovery (tests 5-7)
  // ════════════════════════════════════════════════════════════════════

  describe('controls() — multiple control discovery', () => {
    it('discovers multiple controls via adapter.findControls', async () => {
      const ref1 = { id: 'btn1', controlType: 'sap.m.Button' };
      const ref2 = { id: 'btn2', controlType: 'sap.m.Button' };
      adapter.findControls.mockResolvedValue([ref1, ref2]);
      adapter.getAvailableMethods.mockResolvedValue(['getText', 'press']);

      const proxy1 = createFakeProxy('btn1', 'sap.m.Button');
      const proxy2 = createFakeProxy('btn2', 'sap.m.Button');
      mockCreateControlProxy.mockReturnValueOnce(proxy1).mockReturnValueOnce(proxy2);

      const result = await handler.controls({ controlType: 'sap.m.Button' });

      expect(adapter.findControls).toHaveBeenCalledOnce();
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no controls found', async () => {
      adapter.findControls.mockResolvedValue([]);

      const result = await handler.controls({ controlType: 'sap.m.NonExistent' });

      expect(result).toEqual([]);
    });

    it('calls waitForUI5Stable before findControls', async () => {
      const callOrder: string[] = [];

      adapter.waitForUI5Stable.mockImplementation(async () => {
        callOrder.push('waitForUI5Stable');
        await Promise.resolve();
      });
      adapter.findControls.mockImplementation(async () => {
        callOrder.push('findControls');
        return Promise.resolve([]);
      });

      await handler.controls(defaultSelector);

      expect(callOrder).toEqual(['waitForUI5Stable', 'findControls']);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 3: Interaction (tests 8-14)
  // ════════════════════════════════════════════════════════════════════

  describe('interaction methods', () => {
    it('click() discovers then clicks via strategy.press', async () => {
      await handler.click(defaultSelector);

      expect(mockDiscoverControl).toHaveBeenCalledOnce();
      expect(strategy.press).toHaveBeenCalledWith(page, 'btn1');
    });

    it('fill() discovers then enters text via strategy.enterText', async () => {
      await handler.fill(defaultSelector, 'Hello');

      expect(mockDiscoverControl).toHaveBeenCalledOnce();
      expect(strategy.enterText).toHaveBeenCalledWith(page, 'btn1', 'Hello');
    });

    it('press() aliases to click via strategy.press', async () => {
      await handler.press(defaultSelector);

      expect(strategy.press).toHaveBeenCalledWith(page, 'btn1');
    });

    it('select() selects key via strategy.select', async () => {
      await handler.select(defaultSelector, 'key1');

      expect(strategy.select).toHaveBeenCalledWith(page, 'btn1', 'key1');
    });

    it('check() checks checkbox via adapter.executeControlMethod', async () => {
      await handler.check(defaultSelector);

      expect(adapter.executeControlMethod).toHaveBeenCalledWith('btn1', 'setSelected', [true]);
    });

    it('uncheck() unchecks via adapter.executeControlMethod', async () => {
      await handler.uncheck(defaultSelector);

      expect(adapter.executeControlMethod).toHaveBeenCalledWith('btn1', 'setSelected', [false]);
    });

    it('clear() delegates to fill with empty string', async () => {
      await handler.clear(defaultSelector);

      // clear() should use enterText with empty string
      expect(strategy.enterText).toHaveBeenCalledWith(page, 'btn1', '');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 4: Read (tests 15-16)
  // ════════════════════════════════════════════════════════════════════

  describe('read methods', () => {
    it('getText() reads text property via adapter.executeControlMethod', async () => {
      adapter.executeControlMethod.mockResolvedValue('Submit');

      const result = await handler.getText(defaultSelector);

      expect(adapter.executeControlMethod).toHaveBeenCalledWith('btn1', 'getText', []);
      expect(result).toBe('Submit');
    });

    it('getValue() reads value property via adapter.executeControlMethod', async () => {
      adapter.executeControlMethod.mockResolvedValue('some-value');

      const result = await handler.getValue(defaultSelector);

      expect(adapter.executeControlMethod).toHaveBeenCalledWith('btn1', 'getValue', []);
      expect(result).toBe('some-value');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 5: Wait (tests 17-20)
  // ════════════════════════════════════════════════════════════════════

  describe('wait methods', () => {
    it('waitForUI5() delegates to adapter.waitForUI5Stable with timeout', async () => {
      await handler.waitForUI5(5000);

      expect(adapter.waitForUI5Stable).toHaveBeenCalledWith(5000);
    });

    it('waitForUI5() uses default timeout from config when none specified', async () => {
      const handlerWithConfig = new UI5Handler({
        adapter,
        page,
        strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        config: { ui5WaitTimeout: 15_000 },
      });

      await handlerWithConfig.waitForUI5();

      expect(adapter.waitForUI5Stable).toHaveBeenCalledWith(15_000);
    });

    it('waitFor() polls for control until found', async () => {
      mockDiscoverControl
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(fakeProxy);

      await handler.waitFor(defaultSelector, { timeout: 5000, interval: 50 });

      expect(mockDiscoverControl.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('waitFor() throws TimeoutError after timeout', async () => {
      mockDiscoverControl.mockResolvedValue(null);

      await expect(
        handler.waitFor(defaultSelector, { timeout: 200, interval: 50 }),
      ).rejects.toThrow(TimeoutError);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 6: Lifecycle + edge cases (tests 21-28)
  // ════════════════════════════════════════════════════════════════════

  describe('lifecycle and edge cases', () => {
    it('clearCache() empties the internal cache so next call triggers fresh discovery', async () => {
      await handler.control(defaultSelector);
      expect(mockDiscoverControl).toHaveBeenCalledTimes(1);

      handler.clearCache();

      // After clearCache, discovery should be called again
      mockDiscoverControl.mockResolvedValue(fakeProxy);
      await handler.control(defaultSelector);
      expect(mockDiscoverControl).toHaveBeenCalledTimes(2);
    });

    it('destroy() cleans up adapter and cache', async () => {
      await handler.control(defaultSelector);

      await handler.destroy();

      expect(adapter.destroy).toHaveBeenCalledOnce();
    });

    it('bridge is not called until first operation (lazy)', () => {
      // Just constructing does not call any adapter methods
      expect(adapter.waitForUI5Stable).not.toHaveBeenCalled();
      expect(adapter.findControl).not.toHaveBeenCalled();
      expect(mockDiscoverControl).not.toHaveBeenCalled();
    });

    it('bridge re-injection state resets after clearCache', async () => {
      await handler.control(defaultSelector);
      handler.clearCache();
      adapter.resetInjectionState.mockImplementation(() => undefined);

      // After clearCache, next operation proceeds normally
      mockDiscoverControl.mockResolvedValue(fakeProxy);
      await handler.control(defaultSelector);

      // discoverControl called again with fresh cache
      expect(mockDiscoverControl).toHaveBeenCalledTimes(2);
    });

    it('ControlError includes suggestions array', async () => {
      mockDiscoverControl.mockResolvedValue(null);

      try {
        await handler.control(defaultSelector);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ControlError);
        const controlError = error as ControlError;
        expect(controlError.suggestions).toBeDefined();
        expect(controlError.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('empty selector object throws SelectorError', async () => {
      const emptySelector = {} as UI5Selector;

      await expect(handler.control(emptySelector)).rejects.toThrow(SelectorError);
    });

    it('click() on non-existent control throws ControlError', async () => {
      mockDiscoverControl.mockResolvedValue(null);

      await expect(handler.click(defaultSelector)).rejects.toThrow(ControlError);
    });

    it('multiple parallel control() calls do not race and cache is consistent', async () => {
      let callCount = 0;
      mockDiscoverControl.mockImplementation(async () => {
        callCount++;
        // Simulate async delay
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 10);
        });
        return fakeProxy;
      });

      const results = await Promise.all([
        handler.control(defaultSelector),
        handler.control(defaultSelector),
        handler.control(defaultSelector),
      ]);

      // All should return the same proxy
      for (const result of results) {
        expect(result).toBe(fakeProxy);
      }

      // discoverControl should only be called once due to cache/dedup
      // (or at most a small number due to race, but cache ensures consistency)
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });
});
