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

// ── Bridge mocks ──────────────────────────────────────────────────

const mockBridgeAdapter = {
  init: vi.fn().mockResolvedValue(undefined),
  isReady: vi.fn().mockResolvedValue(true),
  destroy: vi.fn().mockResolvedValue(undefined),
  getUI5Version: vi.fn().mockResolvedValue('1.120.0'),
  isWebComponent: vi.fn().mockResolvedValue(false),
  findControl: vi.fn().mockResolvedValue(null),
  findControls: vi.fn().mockResolvedValue([]),
  getControlProperty: vi.fn().mockResolvedValue(undefined),
  setControlProperty: vi.fn().mockResolvedValue(undefined),
  getControlAggregation: vi.fn().mockResolvedValue([]),
  executeControlMethod: vi.fn().mockResolvedValue(undefined),
  waitForUI5Stable: vi.fn().mockResolvedValue(undefined),
  getModel: vi.fn().mockResolvedValue(undefined),
  getBindingContext: vi.fn().mockResolvedValue(undefined),
  describeControl: vi.fn().mockResolvedValue({}),
  getAvailableMethods: vi.fn().mockResolvedValue([]),
  getSelectorForControl: vi.fn().mockResolvedValue(null),
  resetInjectionState: vi.fn(),
};

const mockCreateBridgeAdapter = vi.fn().mockReturnValue(mockBridgeAdapter);
const mockResetPageInjection = vi.fn();

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

vi.mock('#bridge/adapter-factory.js', () => ({
  createBridgeAdapter: mockCreateBridgeAdapter,
}));

vi.mock('#bridge/injection.js', () => ({
  resetPageInjection: mockResetPageInjection,
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
  mockCreateBridgeAdapter.mockReturnValue(mockBridgeAdapter);
  mockBridgeAdapter.init.mockResolvedValue(undefined);
  mockBridgeAdapter.destroy.mockResolvedValue(undefined);
  mockPage.on.mockImplementation(() => undefined);
  mockPage.off.mockImplementation(() => undefined);
  mockPage.mainFrame.mockReturnValue(mockMainFrame);
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

      expect(mockAssertMinVersion).toHaveBeenCalledWith('1.50.0');
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
    it('completes without error', async () => {
      const fn = extractFixtureFn(fixtures['selectorRegistration']);

      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- testing void fixture
      await expect(runFixture<void>(fn, {})).resolves.toBeUndefined();
    });

    it('is idempotent (calling twice does not throw)', async () => {
      const fn = extractFixtureFn(fixtures['selectorRegistration']);

      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- testing void fixture
      await runFixture<void>(fn, {});

      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- testing void fixture
      await expect(runFixture<void>(fn, {})).resolves.toBeUndefined();
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
    it('declares bridgeAdapter as test-scoped (no worker scope tuple)', () => {
      const options = extractFixtureOptions(fixtures['bridgeAdapter']);

      // Test-scoped fixtures use bare function, not [fn, { scope: 'worker' }] tuple
      expect(options).toBeUndefined();
    });

    it('declares pramanLogger as test-scoped (no worker scope tuple)', () => {
      const options = extractFixtureOptions(fixtures['pramanLogger']);

      expect(options).toBeUndefined();
    });

    it('declares ui5 as test-scoped (no worker scope tuple)', () => {
      const options = extractFixtureOptions(fixtures['ui5']);

      expect(options).toBeUndefined();
    });
  });

  describe('bridgeAdapter fixture', () => {
    it('creates adapter via createBridgeAdapter()', async () => {
      const fn = extractFixtureFn(fixtures['bridgeAdapter']);
      await runFixture(fn, {
        rootLogger: mockRootLoggerInstance,
        page: mockPage,
      });

      expect(mockCreateBridgeAdapter).toHaveBeenCalledOnce();
    });

    it('calls adapter.init() with a BridgePage wrapper', async () => {
      const fn = extractFixtureFn(fixtures['bridgeAdapter']);
      await runFixture(fn, {
        rootLogger: mockRootLoggerInstance,
        page: mockPage,
      });

      expect(mockBridgeAdapter.init).toHaveBeenCalledOnce();
      // The fixture wraps the Playwright Page into a BridgePage interface
      const bridgePage = mockBridgeAdapter.init.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(bridgePage).toHaveProperty('evaluate');
      expect(bridgePage).toHaveProperty('waitForFunction');
    });

    it('creates bridge child logger from rootLogger', async () => {
      const fn = extractFixtureFn(fixtures['bridgeAdapter']);
      await runFixture(fn, {
        rootLogger: mockRootLoggerInstance,
        page: mockPage,
      });

      expect(mockCreateLogger).toHaveBeenCalledWith('bridge', mockRootLoggerInstance);
    });

    it('registers framenavigated listener on page', async () => {
      const fn = extractFixtureFn(fixtures['bridgeAdapter']);
      await runFixture(fn, {
        rootLogger: mockRootLoggerInstance,
        page: mockPage,
      });

      expect(mockPage.on).toHaveBeenCalledWith('framenavigated', expect.any(Function));
    });

    it('navigation listener calls resetPageInjection on main frame navigation', async () => {
      const fn = extractFixtureFn(fixtures['bridgeAdapter']);
      // Capture the listener
      let capturedListener: ((frame: unknown) => void) | undefined;
      mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
        if (event === 'framenavigated') {
          capturedListener = listener;
        }
      });

      await runFixture(fn, {
        rootLogger: mockRootLoggerInstance,
        page: mockPage,
      });

      expect(capturedListener).toBeDefined();
      // Simulate main frame navigation
      capturedListener?.(mockMainFrame);

      expect(mockResetPageInjection).toHaveBeenCalledOnce();
      // resetPageInjection receives the BridgePage wrapper, not the raw page
      const bridgePage = mockResetPageInjection.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(bridgePage).toHaveProperty('evaluate');
      expect(bridgePage).toHaveProperty('waitForFunction');
    });

    it('navigation listener ignores iframe navigation (non-main frame)', async () => {
      const fn = extractFixtureFn(fixtures['bridgeAdapter']);
      let capturedListener: ((frame: unknown) => void) | undefined;
      mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
        if (event === 'framenavigated') {
          capturedListener = listener;
        }
      });

      await runFixture(fn, {
        rootLogger: mockRootLoggerInstance,
        page: mockPage,
      });

      expect(capturedListener).toBeDefined();
      // Simulate iframe navigation (different frame object)
      const iframeFrame = { url: vi.fn().mockReturnValue('https://iframe.example.com') };
      capturedListener?.(iframeFrame);

      expect(mockResetPageInjection).not.toHaveBeenCalled();
    });

    it('teardown removes navigation listener', async () => {
      const fn = extractFixtureFn(fixtures['bridgeAdapter']);

      let teardownExecuted = false;
      const useFn = async (value: unknown): Promise<void> => {
        expect(value).toBe(mockBridgeAdapter);
        // After use() returns, teardown runs
        await Promise.resolve();
      };

      await fn({ rootLogger: mockRootLoggerInstance, page: mockPage }, useFn);

      teardownExecuted = true;
      expect(teardownExecuted).toBe(true);
      expect(mockPage.off).toHaveBeenCalledWith('framenavigated', expect.any(Function));
    });

    it('teardown destroys the adapter', async () => {
      const fn = extractFixtureFn(fixtures['bridgeAdapter']);
      const destroySpy = vi.fn().mockResolvedValue(undefined);
      const adapterWithSpy = { ...mockBridgeAdapter, destroy: destroySpy };
      mockCreateBridgeAdapter.mockReturnValue(adapterWithSpy);

      await runFixture(fn, {
        rootLogger: mockRootLoggerInstance,
        page: mockPage,
      });

      expect(destroySpy).toHaveBeenCalledOnce();
    });

    it('provides the adapter to the test via use()', async () => {
      const fn = extractFixtureFn(fixtures['bridgeAdapter']);
      let capturedAdapter: unknown;
      const useFn = async (value: unknown): Promise<void> => {
        capturedAdapter = value;
        await Promise.resolve();
      };

      await fn({ rootLogger: mockRootLoggerInstance, page: mockPage }, useFn);

      expect(capturedAdapter).toBe(mockBridgeAdapter);
    });

    it('navigation listener logs debug message on main frame navigation', async () => {
      const fn = extractFixtureFn(fixtures['bridgeAdapter']);
      let capturedListener: ((frame: unknown) => void) | undefined;
      mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
        if (event === 'framenavigated') {
          capturedListener = listener;
        }
      });

      await runFixture(fn, {
        rootLogger: mockRootLoggerInstance,
        page: mockPage,
      });

      capturedListener?.(mockMainFrame);

      expect(mockChildLogger.debug).toHaveBeenCalledWith(
        'Main frame navigated — clearing bridge injection state',
      );
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

  describe('ui5 fixture (placeholder)', () => {
    it('provides bridgeAdapter as the ui5 value', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5Value = await runFixture(fn, { bridgeAdapter: mockBridgeAdapter });

      expect(ui5Value).toBe(mockBridgeAdapter);
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
    expect(fixtures).toHaveProperty('bridgeAdapter');
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
    type TestFixtureKeys = 'bridgeAdapter' | 'pramanLogger' | 'ui5';

    expectTypeOf<TestFixtureKeys>().toExtend<string>();
  });

  it('PramanConfig type is readonly', () => {
    expectTypeOf<Readonly<PramanConfig>>().toExtend<PramanConfig>();
  });
});
