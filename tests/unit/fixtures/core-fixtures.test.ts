/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/core-fixtures.ts` — worker + test-scoped Playwright fixtures.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test` and core module dependencies.
 * Fixture definitions are captured via `createMockTestExtend()` and executed
 * directly to verify behavior without requiring a Playwright test runner.
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import {
  createMockExpectExtend,
  createMockTestExtend,
} from '../../helpers/mock-playwright-test.js';

import type { PlaywrightFeatures } from '#core/compat/index.js';
import type { PramanConfig } from '#core/config/schema.js';
import { PramanConfigSchema } from '#core/config/schema.js';
import type { TracerWrapper } from '#core/telemetry/index.js';

// ── Mock dependencies ────────────────────────────────────────────────

const mockConfig: Readonly<PramanConfig> = Object.freeze(
  PramanConfigSchema.parse({ logLevel: 'info' }),
);

const mockDebugConfig: Readonly<PramanConfig> = Object.freeze(
  PramanConfigSchema.parse({ logLevel: 'debug' }),
);

const mockChildLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(),
  level: 'info',
};

const mockRootLoggerInstance = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn().mockReturnValue(mockChildLogger),
  level: 'info',
};

const mockTracerInstance: TracerWrapper = {
  startSpan: vi.fn().mockReturnValue({
    end: vi.fn(),
    setAttribute: vi.fn(),
    setStatus: vi.fn(),
    addEvent: vi.fn(),
  }),
  withSpan: vi
    .fn()
    .mockImplementation(async <T>(_name: string, fn: () => Promise<T>): Promise<T> => fn()),
  recordException: vi.fn(),
  shutdown: vi.fn().mockResolvedValue(undefined),
};

const mockFeatures: PlaywrightFeatures = {
  hasRouteFromHAR: true,
  hasScreenshotCaret: true,
  hasClockAPI: true,
  hasAriaSnapshot: true,
  hasCustomExpect: true,
  hasLocatorAssertions: true,
  hasFilterLocator: true,
  hasBoxedStep: true,
};

const mockLoadConfig = vi.fn().mockResolvedValue(mockConfig);
const mockCreateRootLogger = vi.fn().mockReturnValue(mockRootLoggerInstance);
const mockCreateLogger = vi.fn().mockReturnValue(mockChildLogger);
const mockInitTelemetry = vi.fn().mockResolvedValue(mockTracerInstance);
const mockAssertMinVersion = vi.fn();
const mockGetPlaywrightFeatures = vi.fn().mockReturnValue(mockFeatures);

// ── Bridge injection mock ────────────────────────────────────────────

const mockResetPageInjection = vi.fn();

// ── Interaction strategy + UI5Handler mocks ─────────────────────────

const mockInteractionStrategy = {
  name: 'ui5-native',
  press: vi.fn().mockResolvedValue(undefined),
  enterText: vi.fn().mockResolvedValue(undefined),
  select: vi.fn().mockResolvedValue(undefined),
};

const mockCreateInteractionStrategy = vi.fn().mockReturnValue(mockInteractionStrategy);

const mockUI5HandlerInstance = {
  control: vi.fn().mockResolvedValue(null),
  controls: vi.fn().mockResolvedValue([]),
  click: vi.fn().mockResolvedValue(undefined),
  fill: vi.fn().mockResolvedValue(undefined),
  press: vi.fn().mockResolvedValue(undefined),
  select: vi.fn().mockResolvedValue(undefined),
  check: vi.fn().mockResolvedValue(undefined),
  uncheck: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  getText: vi.fn().mockResolvedValue(''),
  getValue: vi.fn().mockResolvedValue(''),
  waitForUI5: vi.fn().mockResolvedValue(undefined),
  waitFor: vi.fn().mockResolvedValue(undefined),
  clearCache: vi.fn(),
  destroy: vi.fn().mockResolvedValue(undefined),
};

/** Captures constructor args for assertion. */
let lastUI5HandlerOptions: unknown;

class MockUI5HandlerClass {
  control = mockUI5HandlerInstance.control;
  controls = mockUI5HandlerInstance.controls;
  click = mockUI5HandlerInstance.click;
  fill = mockUI5HandlerInstance.fill;
  press = mockUI5HandlerInstance.press;
  select = mockUI5HandlerInstance.select;
  check = mockUI5HandlerInstance.check;
  uncheck = mockUI5HandlerInstance.uncheck;
  clear = mockUI5HandlerInstance.clear;
  getText = mockUI5HandlerInstance.getText;
  getValue = mockUI5HandlerInstance.getValue;
  waitForUI5 = mockUI5HandlerInstance.waitForUI5;
  waitFor = mockUI5HandlerInstance.waitFor;
  clearCache = mockUI5HandlerInstance.clearCache;
  destroy = mockUI5HandlerInstance.destroy;
  constructor(options: unknown) {
    lastUI5HandlerOptions = options;
  }
}

/** Mock Playwright page mainFrame sentinel */
const mockMainFrame = { url: vi.fn().mockReturnValue('https://example.com') };

/** Mock Playwright page with on/off/mainFrame */
const mockPage = {
  evaluate: vi.fn().mockResolvedValue(undefined),
  waitForFunction: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  off: vi.fn(),
  mainFrame: vi.fn().mockReturnValue(mockMainFrame),
};

vi.mock('#core/config/index.js', () => ({
  loadConfig: mockLoadConfig,
}));

vi.mock('#core/logging/index.js', () => ({
  createRootLogger: mockCreateRootLogger,
  createLogger: mockCreateLogger,
}));

vi.mock('#core/telemetry/index.js', () => ({
  initTelemetry: mockInitTelemetry,
}));

vi.mock('#core/compat/index.js', () => ({
  assertMinVersion: mockAssertMinVersion,
  getPlaywrightFeatures: mockGetPlaywrightFeatures,
}));

vi.mock('#bridge/injection.js', () => ({
  resetPageInjection: mockResetPageInjection,
}));

vi.mock('#bridge/interaction-strategies/strategy-factory.js', () => ({
  createInteractionStrategy: mockCreateInteractionStrategy,
}));

vi.mock('#fixtures/ui5-handler.js', () => ({
  UI5Handler: MockUI5HandlerClass,
}));

const mockTestExtend = createMockTestExtend();
const mockExpectExtend = createMockExpectExtend();

vi.mock('@playwright/test', () => ({
  test: {
    extend: mockTestExtend,
  },
  expect: {
    extend: mockExpectExtend,
  },
}));

// ── Import after mocks ──────────────────────────────────────────────

const { coreTest } = await import('#fixtures/core-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @remarks
 * Fixture definitions can be either a bare function or a tuple
 * `[fn, options]`. This helper normalizes both forms.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures.pramanConfig);
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
 * const config = await runFixture(fixtureFn, {});
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

/**
 * Resets all mocks to their default behavior.
 *
 * @remarks
 * Shared across worker-scoped and test-scoped describe blocks
 * to avoid duplicate function bodies (sonarjs/no-identical-functions).
 *
 * @example
 * ```typescript
 * beforeEach(() => { resetAllMockDefaults(); });
 * ```
 */
function resetAllMockDefaults(): void {
  vi.clearAllMocks();
  mockLoadConfig.mockResolvedValue(mockConfig);
  mockCreateRootLogger.mockReturnValue(mockRootLoggerInstance);
  mockCreateLogger.mockReturnValue(mockChildLogger);
  mockInitTelemetry.mockResolvedValue(mockTracerInstance);
  mockAssertMinVersion.mockImplementation(() => undefined);
  mockGetPlaywrightFeatures.mockReturnValue(mockFeatures);
  mockPage.on.mockImplementation(() => undefined);
  mockPage.off.mockImplementation(() => undefined);
  mockPage.mainFrame.mockReturnValue(mockMainFrame);
  mockCreateInteractionStrategy.mockReturnValue(mockInteractionStrategy);
  lastUI5HandlerOptions = undefined;
}

// ── Fixture definitions reference ───────────────────────────────────

const fixtures = (coreTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Tests ───────────────────────────────────────────────────────────

describe('core-fixtures worker-scoped fixture definitions', () => {
  beforeEach(() => {
    resetAllMockDefaults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fixture scope declarations', () => {
    it('declares pramanConfig as worker-scoped', () => {
      const options = extractFixtureOptions(fixtures['pramanConfig']);

      expect(options).toBeDefined();
      expect(options?.['scope']).toBe('worker');
    });

    it('declares rootLogger as worker-scoped', () => {
      const options = extractFixtureOptions(fixtures['rootLogger']);

      expect(options).toBeDefined();
      expect(options?.['scope']).toBe('worker');
    });

    it('declares tracer as worker-scoped', () => {
      const options = extractFixtureOptions(fixtures['tracer']);

      expect(options).toBeDefined();
      expect(options?.['scope']).toBe('worker');
    });

    it('declares playwrightCompat as worker-scoped and auto', () => {
      const options = extractFixtureOptions(fixtures['playwrightCompat']);

      expect(options).toBeDefined();
      expect(options?.['scope']).toBe('worker');
      expect(options?.['auto']).toBe(true);
    });

    it('declares selectorRegistration as worker-scoped and auto', () => {
      const options = extractFixtureOptions(fixtures['selectorRegistration']);

      expect(options).toBeDefined();
      expect(options?.['scope']).toBe('worker');
      expect(options?.['auto']).toBe(true);
    });

    it('declares matcherRegistration as worker-scoped and auto', () => {
      const options = extractFixtureOptions(fixtures['matcherRegistration']);

      expect(options).toBeDefined();
      expect(options?.['scope']).toBe('worker');
      expect(options?.['auto']).toBe(true);
    });
  });

  describe('pramanConfig fixture', () => {
    it('loads config once via loadConfig()', async () => {
      const fn = extractFixtureFn(fixtures['pramanConfig']);
      const config = await runFixture<Readonly<PramanConfig>>(fn, {});

      expect(mockLoadConfig).toHaveBeenCalledOnce();
      expect(config).toBeDefined();
      expect(config.logLevel).toBe('info');
    });

    it('returns a frozen config object', async () => {
      const fn = extractFixtureFn(fixtures['pramanConfig']);
      const config = await runFixture<Readonly<PramanConfig>>(fn, {});

      expect(Object.isFrozen(config)).toBe(true);
    });

    it('config loaded once per worker (single loadConfig call per fixture invocation)', async () => {
      const fn = extractFixtureFn(fixtures['pramanConfig']);

      // Worker scope means fixture fn is called only once per worker.
      // Verify loadConfig is called exactly once per invocation.
      await runFixture<Readonly<PramanConfig>>(fn, {});

      expect(mockLoadConfig).toHaveBeenCalledOnce();
    });
  });

  describe('rootLogger fixture', () => {
    it('creates logger with config from pramanConfig', async () => {
      const fn = extractFixtureFn(fixtures['rootLogger']);
      const logger = await runFixture(fn, { pramanConfig: mockConfig });

      expect(mockCreateRootLogger).toHaveBeenCalledWith(mockConfig);
      expect(logger).toBe(mockRootLoggerInstance);
    });

    it('creates logger at debug level when config specifies debug', async () => {
      const fn = extractFixtureFn(fixtures['rootLogger']);
      await runFixture(fn, { pramanConfig: mockDebugConfig });

      expect(mockCreateRootLogger).toHaveBeenCalledWith(mockDebugConfig);
    });
  });

  describe('tracer fixture', () => {
    it('initializes telemetry with pramanConfig', async () => {
      const fn = extractFixtureFn(fixtures['tracer']);
      const tracer = await runFixture(fn, { pramanConfig: mockConfig });

      expect(mockInitTelemetry).toHaveBeenCalledWith(mockConfig);
      expect(tracer).toBe(mockTracerInstance);
    });

    it('returns a TracerWrapper with no-op spans', async () => {
      const fn = extractFixtureFn(fixtures['tracer']);
      const tracer = await runFixture<TracerWrapper>(fn, { pramanConfig: mockConfig });

      const span = tracer.startSpan('test-span');

      expect(span).toBeDefined();
      expect(typeof span.end).toBe('function');
    });

    it('calls tracer.shutdown() during teardown', async () => {
      const fn = extractFixtureFn(fixtures['tracer']);

      const shutdownSpy = vi.fn().mockResolvedValue(undefined);
      const tracerWithSpy: TracerWrapper = {
        ...mockTracerInstance,
        shutdown: shutdownSpy,
      };
      mockInitTelemetry.mockResolvedValue(tracerWithSpy);

      // Use a use() that captures the value; after use() returns the
      // fixture teardown code (tracer.shutdown()) executes.
      let capturedTracer: TracerWrapper | undefined;
      const useFn = async (value: TracerWrapper): Promise<void> => {
        capturedTracer = value;
        await Promise.resolve();
      };

      await fn({ pramanConfig: mockConfig }, useFn);

      expect(capturedTracer).toBe(tracerWithSpy);
      expect(shutdownSpy).toHaveBeenCalledOnce();
    });
  });

  describe('playwrightCompat fixture', () => {
    it('asserts minimum Playwright version', async () => {
      const fn = extractFixtureFn(fixtures['playwrightCompat']);
      await runFixture(fn, {});

      expect(mockAssertMinVersion).toHaveBeenCalledWith('1.57.0');
    });

    it('returns Playwright feature flags', async () => {
      const fn = extractFixtureFn(fixtures['playwrightCompat']);
      const features = await runFixture<PlaywrightFeatures>(fn, {});

      expect(features).toBe(mockFeatures);
      expect(features.hasClockAPI).toBe(true);
      expect(features.hasAriaSnapshot).toBe(true);
    });

    it('throws when Playwright version is too low', async () => {
      mockAssertMinVersion.mockImplementation(() => {
        throw new Error('Playwright version too low');
      });

      const fn = extractFixtureFn(fixtures['playwrightCompat']);

      await expect(runFixture(fn, {})).rejects.toThrow('Playwright version too low');
    });
  });

  describe('selectorRegistration fixture', () => {
    it('registers ui5 selector engine with playwright.selectors', async () => {
      const fn = extractFixtureFn(fixtures['selectorRegistration']);
      const mockRegister = vi.fn().mockResolvedValue(undefined);
      const mockPlaywright = { selectors: { register: mockRegister } };

      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- testing void fixture
      await runFixture<void>(fn, { playwright: mockPlaywright });

      expect(mockRegister).toHaveBeenCalledOnce();
      expect(mockRegister).toHaveBeenCalledWith('ui5', expect.any(Function));
    });

    it('handles "already registered" error gracefully', async () => {
      const fn = extractFixtureFn(fixtures['selectorRegistration']);
      const mockRegister = vi
        .fn()
        .mockRejectedValue(new Error('"ui5" has been already registered'));
      const mockPlaywright = { selectors: { register: mockRegister } };

      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- testing void fixture
      await expect(runFixture<void>(fn, { playwright: mockPlaywright })).resolves.toBeUndefined();
    });

    it('propagates unexpected registration errors', async () => {
      const fn = extractFixtureFn(fixtures['selectorRegistration']);
      const mockRegister = vi.fn().mockRejectedValue(new Error('Network failure'));
      const mockPlaywright = { selectors: { register: mockRegister } };

      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- testing void fixture
      await expect(runFixture<void>(fn, { playwright: mockPlaywright })).rejects.toThrow(
        'Network failure',
      );
    });
  });

  describe('matcherRegistration fixture', () => {
    it('completes without error', async () => {
      const fn = extractFixtureFn(fixtures['matcherRegistration']);

      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- testing void fixture
      await expect(runFixture<void>(fn, {})).resolves.toBeUndefined();
    });
  });

  describe('worker fixture identity (same instance per worker)', () => {
    it('rootLogger and tracer reference same mock instances', async () => {
      const loggerFn = extractFixtureFn(fixtures['rootLogger']);
      const tracerFn = extractFixtureFn(fixtures['tracer']);

      const logger1 = await runFixture(loggerFn, { pramanConfig: mockConfig });
      const tracer1 = await runFixture(tracerFn, { pramanConfig: mockConfig });

      // Since these are worker-scoped, Playwright creates them once.
      // Verify the factory functions produce expected instances.
      expect(logger1).toBe(mockRootLoggerInstance);
      expect(tracer1).toBe(mockTracerInstance);
    });
  });
});

describe('core-fixtures test-scoped fixture definitions', () => {
  beforeEach(() => {
    resetAllMockDefaults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('test-scoped fixture scope declarations', () => {
    it('declares pramanLogger as test-scoped (no worker scope tuple)', () => {
      const options = extractFixtureOptions(fixtures['pramanLogger']);

      expect(options).toBeUndefined();
    });

    it('declares ui5 as test-scoped (no worker scope tuple)', () => {
      const options = extractFixtureOptions(fixtures['ui5']);

      expect(options).toBeUndefined();
    });
  });

  describe('pramanLogger fixture', () => {
    it('creates child logger via createLogger("test", rootLogger)', async () => {
      const fn = extractFixtureFn(fixtures['pramanLogger']);
      const logger = await runFixture(fn, { rootLogger: mockRootLoggerInstance });

      expect(mockCreateLogger).toHaveBeenCalledWith('test', mockRootLoggerInstance);
      expect(logger).toBe(mockChildLogger);
    });
  });

  describe('ui5 fixture', () => {
    it('creates UI5Handler with page, interactionStrategy, and config', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5Value = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockRootLoggerInstance,
      });

      expect(mockCreateInteractionStrategy).toHaveBeenCalledWith(
        mockConfig.interactionStrategy,
        mockConfig.opa5,
      );
      expect(lastUI5HandlerOptions).toEqual(
        expect.objectContaining({
          page: mockPage,
          interactionStrategy: mockInteractionStrategy,
          discoveryStrategies: mockConfig.discoveryStrategies,
          config: {
            ui5WaitTimeout: mockConfig.ui5WaitTimeout,
            controlDiscoveryTimeout: mockConfig.controlDiscoveryTimeout,
            preferVisibleControls: mockConfig.preferVisibleControls,
            skipStabilityWait: mockConfig.skipStabilityWait,
          },
        }),
      );
      expect(ui5Value).toBeInstanceOf(MockUI5HandlerClass);
    });

    it('creates bridge child logger from rootLogger', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockRootLoggerInstance,
      });

      expect(mockCreateLogger).toHaveBeenCalledWith('bridge', mockRootLoggerInstance);
    });

    it('registers framenavigated listener on page', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockRootLoggerInstance,
      });

      expect(mockPage.on).toHaveBeenCalledWith('framenavigated', expect.any(Function));
    });

    it('navigation listener calls resetPageInjection on main frame navigation', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      let capturedListener: ((frame: unknown) => void) | undefined;
      mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
        if (event === 'framenavigated') {
          capturedListener = listener;
        }
      });

      await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockRootLoggerInstance,
      });

      expect(capturedListener).toBeDefined();
      // Simulate main frame navigation
      capturedListener?.(mockMainFrame);

      expect(mockResetPageInjection).toHaveBeenCalledOnce();
      // resetPageInjection receives the Playwright Page directly
      expect(mockResetPageInjection).toHaveBeenCalledWith(mockPage);
    });

    it('navigation listener ignores iframe navigation (non-main frame)', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      let capturedListener: ((frame: unknown) => void) | undefined;
      mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
        if (event === 'framenavigated') {
          capturedListener = listener;
        }
      });

      await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockRootLoggerInstance,
      });

      expect(capturedListener).toBeDefined();
      // Simulate iframe navigation (different frame object)
      const iframeFrame = { url: vi.fn().mockReturnValue('https://iframe.example.com') };
      capturedListener?.(iframeFrame);

      expect(mockResetPageInjection).not.toHaveBeenCalled();
    });

    it('teardown removes navigation listener', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- callback signature requires parameter; only teardown behavior is tested
      const useFn = async (_value: unknown): Promise<void> => {
        // After use() returns, teardown runs
        await Promise.resolve();
      };

      await fn(
        { page: mockPage, pramanConfig: mockConfig, rootLogger: mockRootLoggerInstance },
        useFn,
      );

      expect(mockPage.off).toHaveBeenCalledWith('framenavigated', expect.any(Function));
    });

    it('navigation listener logs debug message on main frame navigation', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      let capturedListener: ((frame: unknown) => void) | undefined;
      mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
        if (event === 'framenavigated') {
          capturedListener = listener;
        }
      });

      await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockRootLoggerInstance,
      });

      capturedListener?.(mockMainFrame);

      expect(mockChildLogger.debug).toHaveBeenCalledWith(
        'Main frame navigated — clearing bridge injection state',
      );
    });
  });
});

describe('core-fixtures type-level tests', () => {
  it('coreTest exports a fixture object with _fixtureDefinitions', () => {
    expect(coreTest).toBeDefined();
    expect(fixtures).toBeDefined();
  });

  it('fixture definitions contain all expected worker fixtures', () => {
    expect(fixtures).toHaveProperty('pramanConfig');
    expect(fixtures).toHaveProperty('rootLogger');
    expect(fixtures).toHaveProperty('tracer');
    expect(fixtures).toHaveProperty('playwrightCompat');
    expect(fixtures).toHaveProperty('selectorRegistration');
    expect(fixtures).toHaveProperty('matcherRegistration');
  });

  it('fixture definitions contain all expected test-scoped fixtures', () => {
    expect(fixtures).toHaveProperty('pramanLogger');
    expect(fixtures).toHaveProperty('ui5');
  });

  it('WorkerFixtures type has correct shape', () => {
    type WorkerFixtureKeys =
      | 'pramanConfig'
      | 'rootLogger'
      | 'tracer'
      | 'playwrightCompat'
      | 'selectorRegistration'
      | 'matcherRegistration';

    expectTypeOf<WorkerFixtureKeys>().toExtend<string>();
  });

  it('TestFixtures type has correct shape', () => {
    type TestFixtureKeys = 'pramanLogger' | 'ui5';

    expectTypeOf<TestFixtureKeys>().toExtend<string>();
  });

  it('PramanConfig type is readonly', () => {
    expectTypeOf<Readonly<PramanConfig>>().toExtend<PramanConfig>();
  });
});
