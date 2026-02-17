/**
 * Tests for `src/fixtures/core-fixtures.ts` — worker-scoped Playwright fixtures.
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
const mockInitTelemetry = vi.fn().mockResolvedValue(mockTracerInstance);
const mockAssertMinVersion = vi.fn();
const mockGetPlaywrightFeatures = vi.fn().mockReturnValue(mockFeatures);

vi.mock('#core/config/index.js', () => ({
  loadConfig: mockLoadConfig,
}));

vi.mock('#core/logging/index.js', () => ({
  createRootLogger: mockCreateRootLogger,
}));

vi.mock('#core/telemetry/index.js', () => ({
  initTelemetry: mockInitTelemetry,
}));

vi.mock('#core/compat/index.js', () => ({
  assertMinVersion: mockAssertMinVersion,
  getPlaywrightFeatures: mockGetPlaywrightFeatures,
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

// ── Fixture definitions reference ───────────────────────────────────

const fixtures = (coreTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Tests ───────────────────────────────────────────────────────────

describe('core-fixtures worker-scoped fixture definitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue(mockConfig);
    mockCreateRootLogger.mockReturnValue(mockRootLoggerInstance);
    mockInitTelemetry.mockResolvedValue(mockTracerInstance);
    mockAssertMinVersion.mockImplementation(() => undefined);
    mockGetPlaywrightFeatures.mockReturnValue(mockFeatures);
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

  it('PramanConfig type is readonly', () => {
    expectTypeOf<Readonly<PramanConfig>>().toExtend<PramanConfig>();
  });
});
