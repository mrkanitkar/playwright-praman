/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for auto-fallback: `createLocatorShim` and `tryLocatorFallback`.
 *
 * @remarks
 * When `ui5.control()` fails to find a UI5 control AND the selector contains
 * a CSS/XPath/id hint, fall back to `page.locator()` and return a Playwright
 * Locator wrapped in a compatibility shim.
 *
 * Strict TDD: RED phase — tests written first, implementation follows.
 *
 * @module fixtures
 */

import type { Locator, Page } from '@playwright/test';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { createMockTracer } from '../../helpers/mock-tracer-wrapper.js';

import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';
import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';
import { TimeoutError } from '#core/errors/timeout-error.js';
import type { UI5ControlBase } from '#core/types/controls.js';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockLogger = {
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnThis(),
};

vi.mock('#core/logging/index.js', () => ({
  createLogger: vi.fn().mockReturnValue(mockLogger),
}));

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

// ── Import after mocks ─────────────────────────────────────────────────

const { createLocatorShim } = await import('#fixtures/locator-shim.js');
const { UI5Handler } = await import('#fixtures/ui5-handler.js');

// ── Test helpers ────────────────────────────────────────────────────────

/** Shape of the mock locator with typed mock functions. */
interface MockLocatorShape {
  click: ReturnType<typeof vi.fn>;
  textContent: ReturnType<typeof vi.fn>;
  inputValue: ReturnType<typeof vi.fn>;
  getAttribute: ReturnType<typeof vi.fn>;
  isVisible: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
}

/** Creates a mock Playwright Locator with configurable overrides. */
function createMockLocator(
  overrides?: Partial<Record<string, unknown>>,
): Locator & MockLocatorShape {
  const base: MockLocatorShape = {
    click: vi.fn().mockResolvedValue(undefined),
    textContent: vi.fn().mockResolvedValue('text'),
    inputValue: vi.fn().mockResolvedValue('value'),
    getAttribute: vi.fn().mockResolvedValue('attr'),
    isVisible: vi.fn().mockResolvedValue(true),
    count: vi.fn().mockResolvedValue(1),
  };
  return { ...base, ...overrides } as unknown as Locator & MockLocatorShape;
}

/** Creates an inline mock Playwright Page. */
function createMockPage(overrides?: Partial<Record<string, unknown>>): Page & {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
  locator: ReturnType<typeof vi.fn>;
} {
  return {
    evaluate: vi.fn().mockResolvedValue(undefined),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    mainFrame: vi.fn(),
    ...overrides,
  } as unknown as Page & {
    evaluate: ReturnType<typeof vi.fn>;
    waitForFunction: ReturnType<typeof vi.fn>;
    locator: ReturnType<typeof vi.fn>;
  };
}

/** Creates a mock InteractionStrategy. */
function createMockStrategy(): InteractionStrategy {
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
    toLocator: vi.fn().mockRejectedValue(new Error('toLocator not available in mock')),
  };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('auto-fallback', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── createLocatorShim tests ─────────────────────────────────────────

  describe('createLocatorShim', () => {
    it('delegates press() to locator.click()', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myBtn' });

      await shim.press();

      expect(locator.click).toHaveBeenCalledOnce();
    });

    it('delegates getText() to locator.textContent()', async () => {
      const locator = createMockLocator({ textContent: vi.fn().mockResolvedValue('Hello') });
      const shim = createLocatorShim(locator, { id: 'myLabel' });

      const text = await shim.getText();

      expect(locator.textContent).toHaveBeenCalledOnce();
      expect(text).toBe('Hello');
    });

    it('delegates getValue() to locator.inputValue()', async () => {
      const locator = createMockLocator({ inputValue: vi.fn().mockResolvedValue('myVal') });
      const shim = createLocatorShim(locator, { id: 'myInput' });

      const val = await shim.getValue();

      expect(locator.inputValue).toHaveBeenCalledOnce();
      expect(val).toBe('myVal');
    });

    it('delegates getProperty() to locator.getAttribute()', async () => {
      const locator = createMockLocator({
        getAttribute: vi.fn().mockResolvedValue('someAttr'),
      });
      const shim = createLocatorShim(locator, { id: 'myEl' });

      const attr = await shim.getProperty('data-custom');

      expect(locator.getAttribute).toHaveBeenCalledWith('data-custom');
      expect(attr).toBe('someAttr');
    });

    it('getId() returns original selector id', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'loginBtn' });

      const id = await shim.getId();

      expect(id).toBe('loginBtn');
    });

    it('getControlType() returns "dom-element"', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      const type = await shim.getControlType();

      expect(type).toBe('dom-element');
    });

    it('has controlType property set to "dom-element"', () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      expect(shim.controlType).toBe('dom-element');
    });

    it('has id property set from selector', () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      expect(shim.id).toBe('myEl');
    });

    it('delegates getVisible() to locator.isVisible()', async () => {
      const locator = createMockLocator({ isVisible: vi.fn().mockResolvedValue(false) });
      const shim = createLocatorShim(locator, { id: 'myEl' });

      const visible = await shim.getVisible();

      expect(locator.isVisible).toHaveBeenCalledOnce();
      expect(visible).toBe(false);
    });

    it('getAggregation() throws ControlError with ERR_CONTROL_NOT_UI5', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      await expect(shim.getAggregation('items')).rejects.toThrow(ControlError);
      await expect(shim.getAggregation('items')).rejects.toMatchObject({
        code: ErrorCode.ERR_CONTROL_NOT_UI5,
      });
    });

    it('getBindingInfo() throws ControlError with ERR_CONTROL_NOT_UI5', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      await expect(shim.getBindingInfo('text')).rejects.toThrow(ControlError);
      await expect(shim.getBindingInfo('text')).rejects.toMatchObject({
        code: ErrorCode.ERR_CONTROL_NOT_UI5,
      });
    });

    it('getModel() throws ControlError with ERR_CONTROL_NOT_UI5', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      await expect(shim.getModel()).rejects.toThrow(ControlError);
      await expect(shim.getModel()).rejects.toMatchObject({
        code: ErrorCode.ERR_CONTROL_NOT_UI5,
      });
    });

    it('setProperty() throws ControlError with ERR_CONTROL_NOT_UI5', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      await expect(shim.setProperty('text', 'hello')).rejects.toThrow(ControlError);
      await expect(shim.setProperty('text', 'hello')).rejects.toMatchObject({
        code: ErrorCode.ERR_CONTROL_NOT_UI5,
      });
    });

    it('isBound() throws ControlError with ERR_CONTROL_NOT_UI5', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      await expect(shim.isBound('text')).rejects.toThrow(ControlError);
      await expect(shim.isBound('text')).rejects.toMatchObject({
        code: ErrorCode.ERR_CONTROL_NOT_UI5,
      });
    });

    it('getDomRef() throws ControlError with ERR_CONTROL_NOT_UI5', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      await expect(shim.getDomRef()).rejects.toThrow(ControlError);
      await expect(shim.getDomRef()).rejects.toMatchObject({
        code: ErrorCode.ERR_CONTROL_NOT_UI5,
      });
    });

    it('ERR_CONTROL_NOT_UI5 errors have correct retryable and suggestions', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      try {
        await shim.getAggregation('items');
        expect.fail('Expected ControlError');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ControlError);
        const controlError = error as ControlError;
        expect(controlError.retryable).toBe(false);
        expect(controlError.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('satisfies UI5ControlBase interface', () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { id: 'myEl' });

      expectTypeOf(shim).toExtend<UI5ControlBase>();
    });

    it('returns "unknown" for id when selector has no id', async () => {
      const locator = createMockLocator();
      const shim = createLocatorShim(locator, { controlType: 'sap.m.Button' });

      const id = await shim.getId();

      expect(id).toBe('unknown');
      expect(shim.id).toBe('unknown');
    });

    it('getText() returns empty string when textContent is null', async () => {
      const locator = createMockLocator({ textContent: vi.fn().mockResolvedValue(null) });
      const shim = createLocatorShim(locator, { id: 'myEl' });

      const text = await shim.getText();

      expect(text).toBe('');
    });
  });

  // ── tryLocatorFallback tests (via UI5Handler) ─────────────────────────

  describe('tryLocatorFallback', () => {
    let page: ReturnType<typeof createMockPage>;
    let handler: InstanceType<typeof UI5Handler>;

    beforeEach(() => {
      page = createMockPage();
      handler = new UI5Handler({
        page,
        interactionStrategy: createMockStrategy(),
        discoveryStrategies: ['direct-id'],
        config: {
          controlDiscoveryTimeout: 100,
          skipStabilityWait: true,
        },
        tracer: createMockTracer().tracer,
      });
    });

    it('returns locator when DOM element exists with matching id (no --)', async () => {
      const mockLocator = createMockLocator({ count: vi.fn().mockResolvedValue(1) });
      page.locator.mockReturnValue(mockLocator);

      // Make UI5 discovery fail — page.evaluate for find-control returns empty
      page.evaluate.mockResolvedValue({ id: '', controlType: '' });

      const result = await handler.control({ id: 'loginBtn' });

      // Should be a locator shim, not a UI5 proxy
      expect(result.controlType).toBe('dom-element');
      expect(page.locator).toHaveBeenCalledWith('#loginBtn');
    });

    it('returns null (rethrows) when selector has no id/css/xpath hints', async () => {
      // Make UI5 discovery fail
      page.evaluate.mockResolvedValue({ id: '', controlType: '' });

      await expect(
        handler.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } }),
      ).rejects.toThrow(TimeoutError);

      // page.locator should never have been called
      expect(page.locator).not.toHaveBeenCalled();
    });

    it('returns null when no DOM element matches', async () => {
      const mockLocator = createMockLocator({ count: vi.fn().mockResolvedValue(0) });
      page.locator.mockReturnValue(mockLocator);

      // Make UI5 discovery fail
      page.evaluate.mockResolvedValue({ id: '', controlType: '' });

      await expect(handler.control({ id: 'loginBtn' })).rejects.toThrow(TimeoutError);
    });

    it('does not try fallback for UI5-style id with -- separator', async () => {
      // Make UI5 discovery fail
      page.evaluate.mockResolvedValue({ id: '', controlType: '' });

      await expect(handler.control({ id: 'container-app--view--btn1' })).rejects.toThrow(
        TimeoutError,
      );

      // page.locator should never have been called — the id contains '--'
      expect(page.locator).not.toHaveBeenCalled();
    });
  });

  // ── control() with fallback integration tests ───────────────────────────

  describe('control() with fallback', () => {
    let page: ReturnType<typeof createMockPage>;
    let handler: InstanceType<typeof UI5Handler>;

    beforeEach(() => {
      page = createMockPage();
      handler = new UI5Handler({
        page,
        interactionStrategy: createMockStrategy(),
        discoveryStrategies: ['direct-id'],
        config: {
          controlDiscoveryTimeout: 100,
          skipStabilityWait: true,
        },
        tracer: createMockTracer().tracer,
      });
    });

    it('returns locator shim when UI5 discovery fails and DOM element exists', async () => {
      const mockLocator = createMockLocator({ count: vi.fn().mockResolvedValue(1) });
      page.locator.mockReturnValue(mockLocator);

      // UI5 discovery fails — find-control returns empty
      page.evaluate.mockResolvedValue({ id: '', controlType: '' });

      const result = await handler.control({ id: 'nonUI5Element' });

      expect(result.controlType).toBe('dom-element');
      expect(result.id).toBe('nonUI5Element');
    });

    it('does NOT activate fallback when UI5 discovery succeeds', async () => {
      const proxy = createFakeProxy('btn1', 'sap.m.Button');
      mockCreateControlProxy.mockReturnValue(proxy);

      // UI5 discovery succeeds: waitFor → discoverSingleControl → findControl + getMethods (cached for 2nd call)
      page.evaluate
        .mockResolvedValueOnce({ id: 'btn1', controlType: 'sap.m.Button' }) // findControl in waitFor
        .mockResolvedValueOnce(['press', 'getText']); // getAvailableMethods (proxy then cached)

      const result = await handler.control({ id: 'btn1' });

      expect(result.controlType).toBe('sap.m.Button');
      expect(page.locator).not.toHaveBeenCalled();
    });

    it('throws original error when fallback is not applicable', async () => {
      // UI5 discovery fails with a selector that has no fallback hints
      page.evaluate.mockResolvedValue({ id: '', controlType: '' });

      await expect(
        handler.control({ controlType: 'sap.m.Button', properties: { text: 'Go' } }),
      ).rejects.toThrow(TimeoutError);
    });

    it('pino.warn is called with selector when fallback activates', async () => {
      const mockLocator = createMockLocator({ count: vi.fn().mockResolvedValue(1) });
      page.locator.mockReturnValue(mockLocator);

      // UI5 discovery fails
      page.evaluate.mockResolvedValue({ id: '', controlType: '' });

      await handler.control({ id: 'loginBtn' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- vitest asymmetric matcher returns any
        expect.objectContaining({ selector: expect.objectContaining({ id: 'loginBtn' }) }),
        expect.stringContaining('falling back'),
      );
    });

    it('UI5 control takes priority over DOM element with same ID', async () => {
      const proxy = createFakeProxy('sharedId', 'sap.m.Button');
      mockCreateControlProxy.mockReturnValue(proxy);

      // UI5 discovery succeeds: findControl + getMethods (proxy then cached)
      page.evaluate
        .mockResolvedValueOnce({ id: 'sharedId', controlType: 'sap.m.Button' })
        .mockResolvedValueOnce(['press', 'getText']);

      const result = await handler.control({ id: 'sharedId' });

      // Should return the UI5 proxy, not a locator shim
      expect(result.controlType).toBe('sap.m.Button');
      expect(page.locator).not.toHaveBeenCalled();
    });
  });
});
