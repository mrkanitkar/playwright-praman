/**
 * Tests for `src/fixtures/nav-fixtures.ts` — Navigation Playwright fixtures.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test` and navigation module dependencies.
 * Fixture definitions are captured via `createMockTestExtend()` and executed
 * directly to verify behavior without requiring a Playwright test runner.
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockTestExtend,
  createMockExpectExtend,
} from '../../helpers/mock-playwright-test.js';

import type { PramanConfig } from '#core/config/schema.js';
import { PramanConfigSchema } from '#core/config/schema.js';
import type { UI5NavigationAPI } from '#fixtures/nav-fixtures.js';

// ── Mock navigation module ────────────────────────────────────────────
const mockNavigateToApp = vi.fn().mockResolvedValue(undefined);
const mockNavigateToTile = vi.fn().mockResolvedValue(undefined);
const mockNavigateToIntent = vi.fn().mockResolvedValue(undefined);
const mockNavigateToHash = vi.fn().mockResolvedValue(undefined);
const mockNavigateToHome = vi.fn().mockResolvedValue(undefined);
const mockNavigateBack = vi.fn().mockResolvedValue(undefined);
const mockNavigateForward = vi.fn().mockResolvedValue(undefined);
const mockSearchAndOpenApp = vi.fn().mockResolvedValue(undefined);
const mockGetCurrentHash = vi.fn().mockResolvedValue('PurchaseOrder-manage');

vi.mock('../../../src/modules/navigation.js', () => ({
  navigateToApp: mockNavigateToApp,
  navigateToTile: mockNavigateToTile,
  navigateToIntent: mockNavigateToIntent,
  navigateToHash: mockNavigateToHash,
  navigateToHome: mockNavigateToHome,
  navigateBack: mockNavigateBack,
  navigateForward: mockNavigateForward,
  searchAndOpenApp: mockSearchAndOpenApp,
  getCurrentHash: mockGetCurrentHash,
}));

// ── Mock workzone module ──────────────────────────────────────────────
const mockWorkZoneManager = {
  detect: vi.fn().mockResolvedValue(true),
  enableDualBridge: vi.fn().mockResolvedValue(undefined),
  switchToShell: vi.fn(),
  switchToApp: vi.fn(),
  getAppFrameForEval: vi.fn(),
  navigateToApp: vi.fn().mockResolvedValue(undefined),
  getCurrentApp: vi.fn().mockResolvedValue(null),
  isAppReady: vi.fn().mockResolvedValue(true),
};
const mockCreateWorkZoneManager = vi.fn().mockReturnValue(mockWorkZoneManager);

vi.mock('../../../src/modules/workzone.js', () => ({
  createWorkZoneManager: mockCreateWorkZoneManager,
}));

// ── Mock logging ──────────────────────────────────────────────────────
const mockChildLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(),
  level: 'info',
};
const mockCreateLogger = vi.fn().mockReturnValue(mockChildLogger);

vi.mock('#core/logging/index.js', () => ({
  createLogger: mockCreateLogger,
}));

// ── Mock bridge injection ──────────────────────────────────────────────
const mockResetPageInjection = vi.fn();

vi.mock('#bridge/injection.js', () => ({
  resetPageInjection: mockResetPageInjection,
}));

// ── Mock Playwright ───────────────────────────────────────────────────
const mockTestExtend = createMockTestExtend();
const mockExpectExtend = createMockExpectExtend();

vi.mock('@playwright/test', () => ({
  test: {
    extend: mockTestExtend,
    step: vi.fn().mockImplementation(async (_title: string, fn: () => Promise<unknown>) => fn()),
  },
  expect: {
    extend: mockExpectExtend,
  },
}));

// ── Mock Playwright page ──────────────────────────────────────────────
const mockPage = {
  evaluate: vi.fn().mockResolvedValue(undefined),
  waitForFunction: vi.fn().mockResolvedValue(undefined),
  goBack: vi.fn().mockResolvedValue(undefined),
  goForward: vi.fn().mockResolvedValue(undefined),
  locator: vi.fn().mockReturnValue({
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    isVisible: vi.fn().mockResolvedValue(true),
  }),
  on: vi.fn(),
  off: vi.fn(),
  mainFrame: vi.fn(),
};

// ── Mock config ───────────────────────────────────────────────────────
const mockConfig: Readonly<PramanConfig> = Object.freeze(
  PramanConfigSchema.parse({ logLevel: 'info' }),
);

const mockConfigWithBaseURL: Readonly<PramanConfig> = Object.freeze(
  PramanConfigSchema.parse({
    logLevel: 'info',
    auth: { baseUrl: 'https://sap.example.com', strategy: 'basic' },
  }),
);

// ── Import after mocks ───────────────────────────────────────────────
const { navTest } = await import('#fixtures/nav-fixtures.js');

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures.ui5Navigation);
 * ```
 */
function extractFixtureFn(definition: unknown): (...args: any[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: any[]) => Promise<void>;
  }
  return definition as (...args: any[]) => Promise<void>;
}

/**
 * Extracts fixture options from a fixture definition tuple.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture options or undefined if bare function
 *
 * @example
 * ```typescript
 * const opts = extractFixtureOptions(fixtures.pramanConfig);
 * ```
 */
function extractFixtureOptions(definition: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(definition) && definition.length > 1) {
    return definition[1] as Record<string, unknown>;
  }
  return undefined;
}

/**
 * Simulates Playwright's `use()` callback for fixture testing.
 *
 * @param fn - The fixture function to execute
 * @param deps - Dependencies to pass as the first argument
 * @returns The value passed to `use()`
 *
 * @example
 * ```typescript
 * const nav = await runFixture(fixtureFn, { page: mockPage, pramanConfig: mockConfig });
 * ```
 */
async function runFixture<T>(
  fn: (deps: Record<string, unknown>, use: (value: T) => Promise<void>) => Promise<void>,
  deps: Record<string, unknown>,
): Promise<T> {
  let captured: T | undefined;
  const useFn = async (value: T): Promise<void> => {
    captured = value;
    await Promise.resolve();
  };
  await fn(deps, useFn);
  return captured as T;
}

// ── Fixture definitions reference ───────────────────────────────────
const fixtures = (navTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Reset helper ─────────────────────────────────────────────────────

/**
 * Resets all mock defaults between tests.
 *
 * @example
 * ```typescript
 * beforeEach(() => { resetAllMockDefaults(); });
 * ```
 */
function resetAllMockDefaults(): void {
  vi.clearAllMocks();
  mockNavigateToApp.mockResolvedValue(undefined);
  mockNavigateToTile.mockResolvedValue(undefined);
  mockNavigateToIntent.mockResolvedValue(undefined);
  mockNavigateToHash.mockResolvedValue(undefined);
  mockNavigateToHome.mockResolvedValue(undefined);
  mockNavigateBack.mockResolvedValue(undefined);
  mockNavigateForward.mockResolvedValue(undefined);
  mockSearchAndOpenApp.mockResolvedValue(undefined);
  mockGetCurrentHash.mockResolvedValue('PurchaseOrder-manage');
  mockCreateWorkZoneManager.mockReturnValue(mockWorkZoneManager);
  mockCreateLogger.mockReturnValue(mockChildLogger);
  mockResetPageInjection.mockReturnValue(undefined);
}

// ── Tests ────────────────────────────────────────────────────────────

describe('nav-fixtures fixture definitions', () => {
  beforeEach(() => {
    resetAllMockDefaults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ui5Navigation fixture', () => {
    it('provides all 9 navigation methods', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(nav).toBeDefined();
      expect(typeof nav.navigateToApp).toBe('function');
      expect(typeof nav.navigateToTile).toBe('function');
      expect(typeof nav.navigateToIntent).toBe('function');
      expect(typeof nav.navigateToHash).toBe('function');
      expect(typeof nav.navigateToHome).toBe('function');
      expect(typeof nav.navigateBack).toBe('function');
      expect(typeof nav.navigateForward).toBe('function');
      expect(typeof nav.searchAndOpenApp).toBe('function');
      expect(typeof nav.getCurrentHash).toBe('function');
    });

    it('navigateToApp delegates to module function with page', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await nav.navigateToApp('PurchaseOrder-manage', { timeout: 5000 });

      expect(mockNavigateToApp).toHaveBeenCalledOnce();
      expect(mockNavigateToApp).toHaveBeenCalledWith(
        mockPage,
        'PurchaseOrder-manage',
        expect.objectContaining({ timeout: 5000 }),
      );
    });

    it('navigateToTile delegates correctly', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await nav.navigateToTile('Purchase Orders');

      expect(mockNavigateToTile).toHaveBeenCalledOnce();
      expect(mockNavigateToTile).toHaveBeenCalledWith(mockPage, 'Purchase Orders', undefined);
    });

    it('navigateToIntent passes intent and params to module function', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const intent = { semanticObject: 'PurchaseOrder', action: 'manage' };
      const params = { CompanyCode: '1000' };

      await nav.navigateToIntent(intent, params);

      expect(mockNavigateToIntent).toHaveBeenCalledOnce();
      expect(mockNavigateToIntent).toHaveBeenCalledWith(mockPage, intent, params, undefined);
    });

    it('getCurrentHash returns hash via direct delegation', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const hash = await nav.getCurrentHash();

      expect(hash).toBe('PurchaseOrder-manage');
      expect(mockGetCurrentHash).toHaveBeenCalledOnce();
      expect(mockGetCurrentHash).toHaveBeenCalledWith(mockPage);
    });

    it('creates child logger with "nav" module name', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(mockCreateLogger).toHaveBeenCalledWith('nav', mockChildLogger);
    });

    it('passes config baseURL to nav functions when auth.baseUrl is set', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfigWithBaseURL,
        rootLogger: mockChildLogger,
      });

      await nav.navigateToApp('SalesOrder-display');

      expect(mockNavigateToApp).toHaveBeenCalledWith(
        mockPage,
        'SalesOrder-display',
        expect.objectContaining({ baseURL: 'https://sap.example.com' }),
      );
    });

    it('navigateToHash delegates correctly', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await nav.navigateToHash('Shell-home', { timeout: 3000 });

      expect(mockNavigateToHash).toHaveBeenCalledOnce();
      expect(mockNavigateToHash).toHaveBeenCalledWith(mockPage, 'Shell-home', { timeout: 3000 });
    });

    it('navigateToHome delegates correctly', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await nav.navigateToHome({ timeout: 5000 });

      expect(mockNavigateToHome).toHaveBeenCalledOnce();
      expect(mockNavigateToHome).toHaveBeenCalledWith(mockPage, { timeout: 5000 });
    });

    it('navigateBack delegates correctly', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await nav.navigateBack();

      expect(mockNavigateBack).toHaveBeenCalledOnce();
      expect(mockNavigateBack).toHaveBeenCalledWith(mockPage, undefined);
    });

    it('navigateForward delegates correctly', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await nav.navigateForward();

      expect(mockNavigateForward).toHaveBeenCalledOnce();
      expect(mockNavigateForward).toHaveBeenCalledWith(mockPage, undefined);
    });

    it('searchAndOpenApp delegates correctly', async () => {
      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await nav.searchAndOpenApp('Purchase Orders', { timeout: 10_000 });

      expect(mockSearchAndOpenApp).toHaveBeenCalledOnce();
      expect(mockSearchAndOpenApp).toHaveBeenCalledWith(mockPage, 'Purchase Orders', {
        timeout: 10_000,
      });
    });
  });

  describe('btpWorkZone fixture', () => {
    it('provides a WorkZone manager via createWorkZoneManager', async () => {
      const fn = extractFixtureFn(fixtures['btpWorkZone']);
      const wz = await runFixture(fn, {
        page: mockPage,
      });

      expect(wz).toBe(mockWorkZoneManager);
      expect(mockCreateWorkZoneManager).toHaveBeenCalledOnce();
      expect(mockCreateWorkZoneManager).toHaveBeenCalledWith(
        mockPage,
        expect.objectContaining({
          init: expect.any(Function) as unknown,
          resetInjectionState: expect.any(Function) as unknown,
        }),
      );
    });

    it('adapter shim init() is a no-op that resolves', async () => {
      const fn = extractFixtureFn(fixtures['btpWorkZone']);
      await runFixture(fn, { page: mockPage });

      // Extract the adapter shim passed to createWorkZoneManager
      const adapterArg = mockCreateWorkZoneManager.mock.calls[0] as [
        unknown,
        { init(): Promise<void>; resetInjectionState(): void },
      ];
      const shim = adapterArg[1];

      // init() should resolve without error
      await expect(shim.init()).resolves.toBeUndefined();
    });

    it('adapter shim resetInjectionState() calls resetPageInjection with page', async () => {
      const fn = extractFixtureFn(fixtures['btpWorkZone']);
      await runFixture(fn, { page: mockPage });

      // Extract the adapter shim passed to createWorkZoneManager
      const adapterArg = mockCreateWorkZoneManager.mock.calls[0] as [
        unknown,
        { init(): Promise<void>; resetInjectionState(): void },
      ];
      const shim = adapterArg[1];

      shim.resetInjectionState();

      expect(mockResetPageInjection).toHaveBeenCalledOnce();
      expect(mockResetPageInjection).toHaveBeenCalledWith(mockPage);
    });
  });

  describe('navigation error propagation', () => {
    it('propagates errors from navigation module functions', async () => {
      const navError = new Error('Navigation failed: tile not found');
      mockNavigateToTile.mockRejectedValue(navError);

      const fn = extractFixtureFn(fixtures['ui5Navigation']);
      const nav = await runFixture<UI5NavigationAPI>(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await expect(nav.navigateToTile('NonExistent')).rejects.toThrow(
        'Navigation failed: tile not found',
      );
    });
  });

  describe('cross-fixture dependency declarations', () => {
    it('declares pramanConfig as option placeholder', () => {
      const options = extractFixtureOptions(fixtures['pramanConfig']);

      expect(options).toBeDefined();
      expect(options?.['option']).toBe(true);
    });

    it('declares rootLogger as option placeholder', () => {
      const options = extractFixtureOptions(fixtures['rootLogger']);

      expect(options).toBeDefined();
      expect(options?.['option']).toBe(true);
    });
  });
});
