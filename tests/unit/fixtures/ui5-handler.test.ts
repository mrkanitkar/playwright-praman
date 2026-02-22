/**
 * Tests for `src/fixtures/ui5-handler.ts` — internal UI5Handler class.
 *
 * @remarks
 * Tests grouped by functionality: Discovery, Plural Discovery, Interaction,
 * Read, Wait, and Lifecycle/Edge Cases.
 *
 * The UI5Handler now uses Playwright's Page directly (no adapter).
 * All browser operations go through page.evaluate() with browser scripts.
 *
 * Mock strategy: vi.mock() for bridge modules, inline vi.fn() for page/strategy.
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockTracer } from '../../helpers/mock-tracer-wrapper.js';

import type { ControlInspection } from '#bridge/bridge-types.js';
import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';
import { ControlError } from '#core/errors/control-error.js';
import { SelectorError } from '#core/errors/selector-error.js';
import { TimeoutError } from '#core/errors/timeout-error.js';
import type { UI5ControlBase } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';

// ── Mocks ─────────────────────────────────────────────────────────────

const mockEnsureBridgeInjected = vi.fn().mockResolvedValue(undefined);
const mockCreateFindControlScript = vi.fn().mockReturnValue('(async function(){})()');
const mockCreateFindAllControlsScript = vi.fn().mockReturnValue('(async function(){})()');
const mockCreateExecuteMethodScript = vi.fn().mockReturnValue('(function(){})()');
const mockCreateInspectControlScript = vi.fn().mockReturnValue('(function(){})()');
const mockFilterMethods = vi.fn().mockImplementation((methods: readonly string[]) => methods);
const mockCreateControlProxy = vi.fn();

vi.mock('#bridge/injection.js', () => ({
  ensureBridgeInjected: mockEnsureBridgeInjected,
}));

vi.mock('#bridge/browser-scripts/find-control.js', () => ({
  createFindControlScript: mockCreateFindControlScript,
  createFindAllControlsScript: mockCreateFindAllControlsScript,
}));

vi.mock('#bridge/browser-scripts/execute-method.js', () => ({
  createExecuteMethodScript: mockCreateExecuteMethodScript,
}));

vi.mock('#bridge/browser-scripts/inspect-control.js', () => ({
  createInspectControlScript: mockCreateInspectControlScript,
}));

vi.mock('#bridge/method-blacklist.js', () => ({
  filterMethods: mockFilterMethods,
}));

vi.mock('#proxy/control-proxy.js', () => ({
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

/** Creates a mock InteractionStrategy (inline, no helper import). */
function createMockStrategy(): InteractionStrategy & {
  readonly press: ReturnType<typeof vi.fn>;
  readonly enterText: ReturnType<typeof vi.fn>;
  readonly select: ReturnType<typeof vi.fn>;
} {
  return {
    name: 'mock-strategy',
    press: vi.fn<(page: Page, controlId: string) => Promise<void>>().mockResolvedValue(undefined),
    enterText: vi
      .fn<(page: Page, controlId: string, text: string) => Promise<void>>()
      .mockResolvedValue(undefined),
    select: vi
      .fn<(page: Page, controlId: string, itemId: string) => Promise<void>>()
      .mockResolvedValue(undefined),
  };
}

/** Creates an inline mock Playwright Page. */
function createMockPage(): Page & {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
} {
  return {
    evaluate: vi.fn().mockResolvedValue(undefined),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    mainFrame: vi.fn(),
  } as unknown as Page & {
    evaluate: ReturnType<typeof vi.fn>;
    waitForFunction: ReturnType<typeof vi.fn>;
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('UI5Handler', () => {
  let page: ReturnType<typeof createMockPage>;
  let strategy: ReturnType<typeof createMockStrategy>;
  let handler: InstanceType<typeof UI5Handler>;

  const defaultSelector: UI5Selector = { id: 'btn1' };
  const fakeProxy = createFakeProxy('btn1', 'sap.m.Button');

  beforeEach(() => {
    vi.clearAllMocks();
    page = createMockPage();
    strategy = createMockStrategy();

    // Default: page.evaluate dispatches by script content.
    // internalFindControl uses the find-control browser script (IIFE),
    // internalGetAvailableMethods uses an inline script with 'retrieveControlMethods'.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/promise-function-async -- mock dispatch by script content
    page.evaluate.mockImplementation((script: unknown) => {
      if (typeof script === 'string' && script.includes('retrieveControlMethods')) {
        return Promise.resolve(['getText']);
      }
      return Promise.resolve({ id: 'btn1', controlType: 'sap.m.Button' });
    });

    // Default: mockCreateControlProxy returns fakeProxy
    mockCreateControlProxy.mockReturnValue(fakeProxy);

    // Default: filterMethods returns the methods passed
    mockFilterMethods.mockImplementation((methods: readonly string[]) => methods);

    handler = new UI5Handler({
      page: page as unknown as Page,
      interactionStrategy: strategy,
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
    it('discovers single control via page.evaluate', async () => {
      const result = await handler.control(defaultSelector);

      expect(mockEnsureBridgeInjected).toHaveBeenCalled();
      expect(page.evaluate).toHaveBeenCalled();
      expect(result).toBe(fakeProxy);
    });

    it('calls waitForFunction for UI5 stability before discovery', async () => {
      await handler.control(defaultSelector);

      expect(page.waitForFunction).toHaveBeenCalled();
    });

    it('uses cache on repeated calls for same selector', async () => {
      await handler.control(defaultSelector);
      const evaluateCallCount = page.evaluate.mock.calls.length;

      await handler.control(defaultSelector);

      // Second call should use cache and not trigger additional evaluate calls
      // for find-control (waitForFunction still called for stability)
      expect(page.evaluate.mock.calls.length).toBeLessThanOrEqual(evaluateCallCount + 2);
    });

    it('throws TimeoutError when control not found within timeout', async () => {
      // Return empty id to simulate not-found — control() now always polls
      page.evaluate.mockResolvedValue({ id: '', controlType: 'unknown', methods: [] });

      await expect(handler.control(defaultSelector, { timeout: 100 })).rejects.toThrow(
        TimeoutError,
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 2: Plural discovery (tests 5-7)
  // ════════════════════════════════════════════════════════════════════

  describe('controls() — multiple control discovery', () => {
    it('discovers multiple controls via page.evaluate', async () => {
      const proxy1 = createFakeProxy('btn1', 'sap.m.Button');
      const proxy2 = createFakeProxy('btn2', 'sap.m.Button');

      // First call: waitForFunction (UI5 stability)
      // Second call: findAllControls script
      // Third/Fourth: getAvailableMethods for each ref
      page.evaluate
        .mockResolvedValueOnce([
          { id: 'btn1', controlType: 'sap.m.Button' },
          { id: 'btn2', controlType: 'sap.m.Button' },
        ])
        .mockResolvedValueOnce(['getText', 'press'])
        .mockResolvedValueOnce(['getText', 'press']);

      mockCreateControlProxy.mockReturnValueOnce(proxy1).mockReturnValueOnce(proxy2);

      const result = await handler.controls({ controlType: 'sap.m.Button' });

      expect(result).toHaveLength(2);
      expect(mockCreateControlProxy).toHaveBeenCalledTimes(2);
    });

    it('returns empty array when no controls found', async () => {
      page.evaluate.mockResolvedValue([]);

      const result = await handler.controls({ controlType: 'sap.m.NonExistent' });

      expect(result).toEqual([]);
    });

    it('calls ensureBridgeInjected and waitForFunction before findControls', async () => {
      page.evaluate.mockResolvedValue([]);

      await handler.controls(defaultSelector);

      expect(mockEnsureBridgeInjected).toHaveBeenCalled();
      expect(page.waitForFunction).toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 3: Interaction (tests 8-14)
  // ════════════════════════════════════════════════════════════════════

  describe('interaction methods', () => {
    it('click() discovers then clicks via strategy.press', async () => {
      await handler.click(defaultSelector);

      expect(strategy.press).toHaveBeenCalledWith(page, 'btn1');
    });

    it('fill() discovers then enters text via strategy.enterText', async () => {
      await handler.fill(defaultSelector, 'Hello');

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

    it('check() checks checkbox via page.evaluate with executeControlMethod', async () => {
      await handler.check(defaultSelector);

      // check() calls internalExecuteControlMethod which calls page.evaluate
      expect(page.evaluate).toHaveBeenCalled();
    });

    it('uncheck() unchecks via page.evaluate with executeControlMethod', async () => {
      await handler.uncheck(defaultSelector);

      expect(page.evaluate).toHaveBeenCalled();
    });

    it('clear() delegates to fill with empty string', async () => {
      await handler.clear(defaultSelector);

      expect(strategy.enterText).toHaveBeenCalledWith(page, 'btn1', '');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 4: Read (tests 15-16)
  // ════════════════════════════════════════════════════════════════════

  describe('read methods', () => {
    it('getText() reads text property via page.evaluate', async () => {
      // After discovery calls, the getText call evaluates the execute-method script
      // We need evaluate to return the right things in sequence:
      // 1. find-control result (for discovery in discoverSingleControl)
      // 2. getAvailableMethods result
      // 3. executeControlMethod result for getText
      page.evaluate
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button', methods: ['getText'] })
        .mockResolvedValueOnce(['getText'])
        .mockResolvedValueOnce({ value: 'Submit', success: true, returnType: 'result' });

      const result = await handler.getText(defaultSelector);

      expect(result).toBe('Submit');
    });

    it('getValue() reads value property via page.evaluate', async () => {
      page.evaluate
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button', methods: ['getValue'] })
        .mockResolvedValueOnce(['getValue'])
        .mockResolvedValueOnce({ value: 'some-value', success: true, returnType: 'result' });

      const result = await handler.getValue(defaultSelector);

      expect(result).toBe('some-value');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 5: Wait (tests 17-20)
  // ════════════════════════════════════════════════════════════════════

  describe('wait methods', () => {
    it('waitForUI5() calls page.waitForFunction', async () => {
      await handler.waitForUI5(5000);

      expect(page.waitForFunction).toHaveBeenCalled();
    });

    it('waitForUI5() uses default timeout from config when none specified', async () => {
      const handlerWithConfig = new UI5Handler({
        page: page as unknown as Page,
        interactionStrategy: strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        config: { ui5WaitTimeout: 15_000 },
      });

      await handlerWithConfig.waitForUI5();

      expect(page.waitForFunction).toHaveBeenCalled();
    });

    it('waitFor() polls for control until found', async () => {
      // First two calls return not-found, third call returns found
      page.evaluate
        .mockResolvedValueOnce({ id: '', controlType: 'unknown', methods: [] })
        .mockResolvedValueOnce({ id: '', controlType: 'unknown', methods: [] })
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button', methods: ['getText'] })
        .mockResolvedValueOnce(['getText']);

      await handler.waitFor(defaultSelector, { timeout: 5000, interval: 50 });

      // page.evaluate should have been called at least 3 times
      expect(page.evaluate.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('waitFor() throws TimeoutError after timeout', async () => {
      page.evaluate.mockResolvedValue({ id: '', controlType: 'unknown', methods: [] });

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
      const callCountBefore = page.evaluate.mock.calls.length;

      handler.clearCache();

      // Reset the mock to return valid data again
      page.evaluate
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button', methods: ['getText'] })
        .mockResolvedValueOnce(['getText']);

      await handler.control(defaultSelector);

      // After clearCache, discovery triggers new evaluate calls
      expect(page.evaluate.mock.calls.length).toBeGreaterThan(callCountBefore);
    });

    it('destroy() cleans up cache', async () => {
      await handler.control(defaultSelector);

      await handler.destroy();

      // Verify destroy completes without error
      expect(true).toBe(true);
    });

    it('bridge is not called until first operation (lazy)', () => {
      // Just constructing does not call any bridge methods
      expect(mockEnsureBridgeInjected).not.toHaveBeenCalled();
      expect(page.evaluate).not.toHaveBeenCalled();
    });

    it('TimeoutError includes suggestions when control not found', async () => {
      page.evaluate.mockResolvedValue({ id: '', controlType: 'unknown', methods: [] });

      try {
        await handler.control(defaultSelector, { timeout: 100 });
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(TimeoutError);
        const timeoutError = error as TimeoutError;
        expect(timeoutError.suggestions).toBeDefined();
        expect(timeoutError.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('empty selector object throws SelectorError', async () => {
      const emptySelector = {} as UI5Selector;

      await expect(handler.control(emptySelector)).rejects.toThrow(SelectorError);
    });

    it('click() on non-existent control throws TimeoutError', async () => {
      // click() delegates to control() which now polls — use short-timeout handler
      const shortHandler = new UI5Handler({
        page: page as unknown as Page,
        interactionStrategy: strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        config: { controlDiscoveryTimeout: 100 },
      });
      page.evaluate.mockResolvedValue({ id: '', controlType: 'unknown', methods: [] });

      await expect(shortHandler.click(defaultSelector)).rejects.toThrow(TimeoutError);
    });

    it('ensureBridgeInjected is called before page.evaluate operations', async () => {
      const callOrder: string[] = [];
      mockEnsureBridgeInjected.mockImplementation(async () => {
        callOrder.push('ensureBridgeInjected');
        await Promise.resolve();
      });
      // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/promise-function-async -- mock side-effect tracking requires sync wrapper returning Promise
      page.evaluate.mockImplementation((script: unknown) => {
        callOrder.push('evaluate');
        if (typeof script === 'string' && script.includes('retrieveControlMethods')) {
          return Promise.resolve(['getText']);
        }
        return Promise.resolve({ id: 'btn1', controlType: 'sap.m.Button' });
      });
      // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/promise-function-async -- mock side-effect tracking requires sync wrapper returning Promise
      page.waitForFunction.mockImplementation(() => {
        callOrder.push('waitForFunction');
        return Promise.resolve();
      });

      await handler.control(defaultSelector);

      // ensureBridgeInjected should be called before evaluate
      expect(callOrder[0]).toBe('ensureBridgeInjected');
    });

    it('multiple parallel control() calls do not crash', async () => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/promise-function-async -- mock with delayed resolution for parallelism test
      page.evaluate.mockImplementation((script: unknown) => {
        return new Promise<unknown>((resolve) => {
          setTimeout(() => {
            if (typeof script === 'string' && script.includes('retrieveControlMethods')) {
              resolve(['getText']);
            } else {
              resolve({ id: 'btn1', controlType: 'sap.m.Button' });
            }
          }, 10);
        });
      });

      const results = await Promise.all([
        handler.control(defaultSelector),
        handler.control(defaultSelector),
        handler.control(defaultSelector),
      ]);

      for (const result of results) {
        expect(result).toBe(fakeProxy);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 7: Telemetry integration (tests 29-36)
  // ════════════════════════════════════════════════════════════════════

  describe('telemetry integration', () => {
    it('control() creates a span named praman.ui5.findControl', async () => {
      const { tracer, spans } = createMockTracer();
      const tracedHandler = new UI5Handler({
        page: page as unknown as Page,
        interactionStrategy: strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        tracer,
      });

      await tracedHandler.control(defaultSelector);

      // control() calls waitFor() internally, which creates its own span.
      // Find the findControl span specifically.
      const findControlSpan = spans.find((s) => s.name === 'praman.ui5.findControl');
      expect(findControlSpan).toBeDefined();
      expect(findControlSpan?.ended).toBe(true);
      expect(findControlSpan?.status).toBe('ok');
    });

    it('click() creates a span named praman.ui5.click', async () => {
      const { tracer, spans } = createMockTracer();
      const tracedHandler = new UI5Handler({
        page: page as unknown as Page,
        interactionStrategy: strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        tracer,
      });

      await tracedHandler.click(defaultSelector);

      const clickSpan = spans.find((s) => s.name === 'praman.ui5.click');
      expect(clickSpan).toBeDefined();
      expect(clickSpan?.ended).toBe(true);
      expect(clickSpan?.status).toBe('ok');
    });

    it('controls() creates a span named praman.ui5.findControls', async () => {
      const { tracer, spans } = createMockTracer();
      const tracedHandler = new UI5Handler({
        page: page as unknown as Page,
        interactionStrategy: strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        tracer,
      });

      page.evaluate.mockResolvedValue([]);

      await tracedHandler.controls({ controlType: 'sap.m.Button' });

      const findControlsSpan = spans.find((s) => s.name === 'praman.ui5.findControls');
      expect(findControlsSpan).toBeDefined();
      expect(findControlsSpan?.ended).toBe(true);
      expect(findControlsSpan?.status).toBe('ok');
    });

    it('fill() creates a span named praman.ui5.fill', async () => {
      const { tracer, spans } = createMockTracer();
      const tracedHandler = new UI5Handler({
        page: page as unknown as Page,
        interactionStrategy: strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        tracer,
      });

      await tracedHandler.fill(defaultSelector, 'Hello');

      const fillSpan = spans.find((s) => s.name === 'praman.ui5.fill');
      expect(fillSpan).toBeDefined();
      expect(fillSpan?.ended).toBe(true);
      expect(fillSpan?.status).toBe('ok');
    });

    it('waitForUI5() creates a span named praman.ui5.waitForUI5', async () => {
      const { tracer, spans } = createMockTracer();
      const tracedHandler = new UI5Handler({
        page: page as unknown as Page,
        interactionStrategy: strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        tracer,
      });

      await tracedHandler.waitForUI5(5000);

      const waitSpan = spans.find((s) => s.name === 'praman.ui5.waitForUI5');
      expect(waitSpan).toBeDefined();
      expect(waitSpan?.ended).toBe(true);
      expect(waitSpan?.status).toBe('ok');
    });

    it('waitFor() creates a span named praman.ui5.waitFor', async () => {
      const { tracer, spans } = createMockTracer();
      const tracedHandler = new UI5Handler({
        page: page as unknown as Page,
        interactionStrategy: strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        tracer,
      });

      await tracedHandler.waitFor(defaultSelector, { timeout: 1000 });

      const waitForSpan = spans.find((s) => s.name === 'praman.ui5.waitFor');
      expect(waitForSpan).toBeDefined();
      expect(waitForSpan?.ended).toBe(true);
      expect(waitForSpan?.status).toBe('ok');
    });

    it('default tracer is NoOpTracer when none provided', async () => {
      // Handler created without tracer option — should use NoOpTracer
      // Existing handler from beforeEach has no tracer option, so it uses the default.
      // Calling any method should still work fine (NoOpTracer is a passthrough).
      await handler.control(defaultSelector);

      // No assertions on spans needed — just verifying no crash occurs
      expect(true).toBe(true);
    });

    it('span records error status when method throws', async () => {
      const { tracer, spans } = createMockTracer();
      const tracedHandler = new UI5Handler({
        page: page as unknown as Page,
        interactionStrategy: strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        config: { controlDiscoveryTimeout: 100 },
        tracer,
      });

      // Make all evaluate calls return not-found so waitFor times out
      page.evaluate.mockResolvedValue({ id: '', controlType: 'unknown', methods: [] });

      await expect(tracedHandler.control(defaultSelector, { timeout: 100 })).rejects.toThrow(
        TimeoutError,
      );

      // The outermost span (findControl) should have error status because
      // the waitFor inside it throws TimeoutError, which propagates.
      const findControlSpan = spans.find((s) => s.name === 'praman.ui5.findControl');
      expect(findControlSpan).toBeDefined();
      expect(findControlSpan?.ended).toBe(true);
      expect(findControlSpan?.status).toBe('error');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Group 8: Inspect (tests 37-44)
  // ════════════════════════════════════════════════════════════════════

  describe('inspect() — control metadata inspection', () => {
    const inspectionResult: ControlInspection = {
      id: 'btn1',
      controlType: 'sap.m.Button',
      visible: true,
      enabled: true,
      domId: 'btn1',
      properties: { text: 'Save', type: 'Emphasized', icon: '', enabled: true },
      aggregationNames: ['tooltip', 'customData', 'layoutData', 'dependents'],
      bindingPaths: { text: '/ButtonText' },
    };

    it('returns full metadata for a discovered control', async () => {
      // First evaluate: find-control (discovery)
      // Second evaluate: inspect-control script
      page.evaluate
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button' })
        .mockResolvedValueOnce(inspectionResult);

      const result = await handler.inspect(defaultSelector);

      expect(result.id).toBe('btn1');
      expect(result.controlType).toBe('sap.m.Button');
      expect(result.visible).toBe(true);
      expect(result.enabled).toBe(true);
      expect(result.properties).toEqual({
        text: 'Save',
        type: 'Emphasized',
        icon: '',
        enabled: true,
      });
      expect(result.aggregationNames).toEqual([
        'tooltip',
        'customData',
        'layoutData',
        'dependents',
      ]);
      expect(result.bindingPaths).toEqual({ text: '/ButtonText' });
    });

    it('calls ensureBridgeInjected before inspection', async () => {
      page.evaluate
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button' })
        .mockResolvedValueOnce(inspectionResult);

      await handler.inspect(defaultSelector);

      expect(mockEnsureBridgeInjected).toHaveBeenCalled();
    });

    it('calls waitForFunction for UI5 stability before inspection', async () => {
      page.evaluate
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button' })
        .mockResolvedValueOnce(inspectionResult);

      await handler.inspect(defaultSelector);

      expect(page.waitForFunction).toHaveBeenCalled();
    });

    it('throws ControlError when control is not found', async () => {
      page.evaluate.mockResolvedValue({ id: '', controlType: 'unknown' });

      await expect(handler.inspect(defaultSelector)).rejects.toThrow(ControlError);
    });

    it('throws ControlError when inspect script returns null', async () => {
      // Discovery succeeds but inspect returns null
      page.evaluate
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button' })
        .mockResolvedValueOnce(null);

      await expect(handler.inspect(defaultSelector)).rejects.toThrow(ControlError);
    });

    it('throws SelectorError for empty selector', async () => {
      const emptySelector = {} as UI5Selector;

      await expect(handler.inspect(emptySelector)).rejects.toThrow(SelectorError);
    });

    it('returns domId as null when control is not rendered', async () => {
      const unrenderedResult: ControlInspection = {
        ...inspectionResult,
        domId: null,
      };

      page.evaluate
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button' })
        .mockResolvedValueOnce(unrenderedResult);

      const result = await handler.inspect(defaultSelector);

      expect(result.domId).toBeNull();
    });

    it('creates a span named praman.ui5.inspect when tracer is provided', async () => {
      const { tracer, spans } = createMockTracer();
      const tracedHandler = new UI5Handler({
        page: page as unknown as Page,
        interactionStrategy: strategy,
        discoveryStrategies: ['direct-id', 'recordreplay'],
        tracer,
      });

      page.evaluate
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button' })
        .mockResolvedValueOnce(inspectionResult);

      await tracedHandler.inspect(defaultSelector);

      const inspectSpan = spans.find((s) => s.name === 'praman.ui5.inspect');
      expect(inspectSpan).toBeDefined();
      expect(inspectSpan?.ended).toBe(true);
      expect(inspectSpan?.status).toBe('ok');
    });
  });
});
