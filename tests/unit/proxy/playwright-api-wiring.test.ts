/**
 * Tests for Playwright API wiring into dynamic-proxy.
 *
 * @remarks
 * Validates that Playwright interaction methods (click, fill, isVisible, etc.)
 * are routed through the InteractionStrategy system when `page` and
 * `interactionStrategy` are present in ControlProxyState.
 *
 * B5d: Wire `playwright-api.ts` into `dynamic-proxy.ts`.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';

import type { BridgePage } from '#bridge/adapter.js';
import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';
import type { ControlProxyState } from '#proxy/dynamic-proxy.js';
import { createControlProxy } from '#proxy/dynamic-proxy.js';
import { isPlaywrightMethod, routeToInteractionStrategy } from '#proxy/playwright-api.js';

/**
 * Test proxy interface for dynamic method calls.
 */
interface TestProxy {
  readonly id: string;
  readonly controlType: string;
  click(): Promise<void>;
  fill(value: string): Promise<void>;
  isVisible(): Promise<boolean>;
  getAttribute(name: string): Promise<string | null>;
  getText(): Promise<string>;
  getProperty(name: string): Promise<unknown>;
  press(key: string): Promise<void>;
  textContent(): Promise<string | null>;
  hover(): Promise<void>;
  dblclick(): Promise<void>;
}

/** Mock strategy with typed mock methods for assertion access. */
interface MockInteractionStrategy extends InteractionStrategy {
  readonly press: Mock<InteractionStrategy['press']>;
  readonly enterText: Mock<InteractionStrategy['enterText']>;
  readonly select: Mock<InteractionStrategy['select']>;
}

/** Creates a mock InteractionStrategy. */
function createMockStrategy(overrides?: Partial<MockInteractionStrategy>): MockInteractionStrategy {
  return {
    name: 'mock-strategy',
    press: vi.fn<InteractionStrategy['press']>().mockResolvedValue(undefined),
    enterText: vi.fn<InteractionStrategy['enterText']>().mockResolvedValue(undefined),
    select: vi.fn<InteractionStrategy['select']>().mockResolvedValue(undefined),
    ...overrides,
  };
}

/** Creates a mock BridgePage with locator support. */
function createMockPage(): BridgePage & {
  locator: ReturnType<typeof vi.fn>;
  _mockLocator: Record<string, ReturnType<typeof vi.fn>>;
} {
  const mockLocator: Record<string, ReturnType<typeof vi.fn>> = {
    isVisible: vi.fn().mockResolvedValue(true),
    getAttribute: vi.fn().mockResolvedValue('test-attr'),
    textContent: vi.fn().mockResolvedValue('Hello'),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    hover: vi.fn().mockResolvedValue(undefined),
    dblclick: vi.fn().mockResolvedValue(undefined),
  };

  return {
    evaluate: vi.fn().mockResolvedValue('saveBtn-domref'),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn().mockReturnValue(mockLocator),
    _mockLocator: mockLocator,
  };
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

describe('playwright-api-wiring', () => {
  // ── Test 1: click routes to interaction strategy ──────────────────
  describe('proxy.click() routes to interaction strategy', () => {
    it('calls strategy.press() with page and controlId', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });
      const proxy = createControlProxy(state) as unknown as TestProxy;

      await proxy.click();

      expect(strategy.press).toHaveBeenCalledOnce();
      expect(strategy.press).toHaveBeenCalledWith(page, 'saveBtn');
    });
  });

  // ── Test 2: fill routes to interaction strategy ───────────────────
  describe('proxy.fill() routes to interaction strategy', () => {
    it('calls strategy.enterText() with page, controlId, and value', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });
      const proxy = createControlProxy(state) as unknown as TestProxy;

      await proxy.fill('Hello World');

      expect(strategy.enterText).toHaveBeenCalledOnce();
      expect(strategy.enterText).toHaveBeenCalledWith(page, 'saveBtn', 'Hello World');
    });
  });

  // ── Test 3: isVisible routes to Locator ───────────────────────────
  describe('proxy.isVisible() routes to Locator', () => {
    it('gets DOM ref and calls locator.isVisible()', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });
      const proxy = createControlProxy(state) as unknown as TestProxy;

      const result = await proxy.isVisible();

      // eslint-disable-next-line playwright/prefer-web-first-assertions -- unit test, not Playwright test
      expect(result).toBe(true);
      expect(page.locator).toHaveBeenCalled();
      expect(page._mockLocator['isVisible']).toHaveBeenCalled();
    });
  });

  // ── Test 4: getAttribute routes to Locator ────────────────────────
  describe('proxy.getAttribute() routes to Locator', () => {
    it('gets DOM ref and calls locator.getAttribute()', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });
      const proxy = createControlProxy(state) as unknown as TestProxy;

      const result = await proxy.getAttribute('name');

      // eslint-disable-next-line playwright/prefer-web-first-assertions -- unit test, not Playwright test
      expect(result).toBe('test-attr');
      expect(page._mockLocator['getAttribute']).toHaveBeenCalledWith('name');
    });
  });

  // ── Test 5: getText routes to bridge, not Playwright ──────────────
  describe('proxy.getText() routes to bridge', () => {
    it('uses bridge executeControlMethod, not Playwright', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockResolvedValue({
          success: true,
          returnType: 'result',
          value: 'Save',
          duration: 1,
        }),
      });
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        adapter,
        page,
        interactionStrategy: strategy,
      });
      const proxy = createControlProxy(state) as unknown as TestProxy;

      const result = await proxy.getText();

      expect(result).toBe('Save');
      expect(adapter.executeControlMethod).toHaveBeenCalledWith('saveBtn', 'getText', []);
      // Playwright locator should NOT have been used
      expect(page.locator).not.toHaveBeenCalled();
    });
  });

  // ── Test 6: getProperty resolves as built-in (before PW check) ────
  describe('proxy.getProperty() resolves as built-in', () => {
    it('built-in method takes precedence over Playwright check', async () => {
      const adapter = createMockBridgeAdapter({
        getControlProperty: vi.fn().mockResolvedValue('Save'),
      });
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        adapter,
        page,
        interactionStrategy: strategy,
      });
      const proxy = createControlProxy(state) as unknown as TestProxy;

      const result = await proxy.getProperty('text');

      expect(result).toBe('Save');
      expect(adapter.getControlProperty).toHaveBeenCalledWith('saveBtn', 'text');
      // Strategy and locator should not have been involved
      expect(strategy.press).not.toHaveBeenCalled();
      expect(page.locator).not.toHaveBeenCalled();
    });
  });

  // ── Test 7: Strategy fallback when no fire* method ────────────────
  describe('strategy fallback for non-interaction Playwright methods', () => {
    it('hover routes to locator when strategy has no hover method', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });
      const proxy = createControlProxy(state) as unknown as TestProxy;

      await proxy.hover();

      // hover is not press/enterText/select, so it falls through to locator
      expect(page.locator).toHaveBeenCalled();
      expect(page._mockLocator['hover']).toHaveBeenCalled();
    });
  });

  // ── Test 8: ControlProxyState includes page + strategy ────────────
  describe('ControlProxyState supports page and interactionStrategy', () => {
    it('state with page and interactionStrategy creates valid proxy', () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });

      expect(state.page).toBe(page);
      expect(state.interactionStrategy).toBe(strategy);

      const proxy = createControlProxy(state);
      expect(proxy.id).toBe('saveBtn');
      expect(proxy.controlType).toBe('sap.m.Button');
    });
  });

  // ── isPlaywrightMethod guard ──────────────────────────────────────
  describe('isPlaywrightMethod check', () => {
    it('returns true for click', () => {
      expect(isPlaywrightMethod('click')).toBe(true);
    });

    it('returns true for fill', () => {
      expect(isPlaywrightMethod('fill')).toBe(true);
    });

    it('returns true for isVisible', () => {
      expect(isPlaywrightMethod('isVisible')).toBe(true);
    });

    it('returns false for getText (UI5 method)', () => {
      expect(isPlaywrightMethod('getText')).toBe(false);
    });

    it('returns false for getProperty (built-in)', () => {
      expect(isPlaywrightMethod('getProperty')).toBe(false);
    });
  });

  // ── routeToInteractionStrategy unit tests ─────────────────────────
  describe('routeToInteractionStrategy', () => {
    it('routes click to strategy.press()', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });

      await routeToInteractionStrategy(state, 'click', []);

      expect(strategy.press).toHaveBeenCalledWith(page, 'saveBtn');
    });

    it('routes dblclick to strategy.press() (double-click treated as press)', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });

      // dblclick falls to locator since strategy only has press/enterText/select
      await routeToInteractionStrategy(state, 'dblclick', []);

      expect(page.locator).toHaveBeenCalled();
      expect(page._mockLocator['dblclick']).toHaveBeenCalled();
    });

    it('routes fill to strategy.enterText()', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });

      await routeToInteractionStrategy(state, 'fill', ['test value']);

      expect(strategy.enterText).toHaveBeenCalledWith(page, 'saveBtn', 'test value');
    });

    it('routes selectOption to strategy.select()', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });

      await routeToInteractionStrategy(state, 'selectOption', ['item1']);

      expect(strategy.select).toHaveBeenCalledWith(page, 'saveBtn', 'item1');
    });

    it('routes isVisible to locator-based check', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });

      const result = await routeToInteractionStrategy(state, 'isVisible', []);

      expect(result).toBe(true);
      expect(page.locator).toHaveBeenCalled();
    });

    it('routes getAttribute to locator with args passthrough', async () => {
      const strategy = createMockStrategy();
      const page = createMockPage();
      const state = createTestState({
        page,
        interactionStrategy: strategy,
      });

      const result = await routeToInteractionStrategy(state, 'getAttribute', ['name']);

      expect(result).toBe('test-attr');
      expect(page._mockLocator['getAttribute']).toHaveBeenCalledWith('name');
    });
  });

  // ── Without page/strategy: Playwright methods fall to bridge ──────
  describe('without page and strategy', () => {
    it('click falls through to bridge when no page/strategy', async () => {
      const adapter = createMockBridgeAdapter({
        executeControlMethod: vi.fn().mockResolvedValue({
          success: true,
          returnType: 'empty',
          duration: 1,
        }),
      });
      const state = createTestState({ adapter });
      // No page, no interactionStrategy
      const proxy = createControlProxy(state) as unknown as TestProxy;

      await proxy.click();

      expect(adapter.executeControlMethod).toHaveBeenCalledWith('saveBtn', 'click', []);
    });
  });
});
