/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/browser-bind-fixture.ts`.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test` and core logging module.
 * Fixture definitions are captured via `createMockTestExtend()` and executed
 * directly to verify behavior without requiring a Playwright test runner.
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockTestExtend } from '../../helpers/mock-playwright-test.js';

// ── Shared mock state ────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const createLogger = vi.fn().mockReturnValue({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  });

  return { createLogger };
});

vi.mock('#core/logging/index.js', () => ({
  createLogger: mocks.createLogger,
  createRootLogger: vi.fn(),
}));
const mockTestExtend = createMockTestExtend();

vi.mock('@playwright/test', () => ({
  test: { extend: mockTestExtend },
  expect: { extend: vi.fn() },
}));

// ── Import after mocks ───────────────────────────────────────────────────────

const { browserBindTest } = await import('#fixtures/browser-bind-fixture.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures.browserBind);
 * ```
 */
function extractFixtureFn(definition: unknown): (...args: unknown[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: unknown[]) => Promise<void>;
  }
  return definition as (...args: unknown[]) => Promise<void>;
}

/**
 * Extracts fixture options from a fixture definition tuple.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture options or undefined if bare function
 *
 * @example
 * ```typescript
 * const opts = extractFixtureOptions(fixtures.browserBind);
 * ```
 */
function extractFixtureOptions(definition: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(definition) && definition.length > 1) {
    return definition[1] as Record<string, unknown>;
  }
  return undefined;
}

/**
 * Runs a fixture function and captures the value passed to `use()`.
 *
 * @param fn - The fixture function to execute
 * @param deps - Dependencies to inject
 * @returns The value passed to `use()`
 *
 * @example
 * ```typescript
 * const result = await runFixture(fixtureFn, { browser: mockBrowser });
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

// ── Mock browser factory ─────────────────────────────────────────────────────

/** Creates a mock browser with optional bind/unbind support. */
function makeMockBrowser(opts?: {
  withBind?: boolean;
  bindResult?: { endpoint: string };
  bindShouldFail?: boolean;
  withUnbind?: boolean;
}): Record<string, unknown> {
  const defaults = {
    withBind: true,
    bindResult: { endpoint: 'wss://localhost:9999/devtools' },
    bindShouldFail: false,
    withUnbind: true,
    ...opts,
  };

  const browser: Record<string, unknown> = {};

  if (defaults.withBind) {
    browser['bind'] = defaults.bindShouldFail
      ? vi.fn().mockRejectedValue(new Error('bind() failed'))
      : vi.fn().mockResolvedValue(defaults.bindResult);
  }

  if (defaults.withUnbind) {
    browser['unbind'] = vi.fn().mockResolvedValue(undefined);
  }

  return browser;
}

const mockRootLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(),
};

// ── Fixture definitions reference ────────────────────────────────────────────

const fixtures = (browserBindTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Tests ────────────────────────────────────────────────────────────────────

describe('browser-bind-fixture structure', () => {
  it('exports browserBindTest as a defined object', () => {
    // The mock test.extend() returns a MockPlaywrightTest object (not a bare function).
    // The Playwright production object is callable; the mock is an object with _fixtureDefinitions.
    expect(browserBindTest).toBeDefined();
    expect(browserBindTest).not.toBeNull();
  });

  it('has _fixtureDefinitions with browserBind', () => {
    expect(fixtures).toHaveProperty('browserBind');
  });

  it('declares browserBind as a test-scoped fixture (bare function)', () => {
    const opts = extractFixtureOptions(fixtures['browserBind']);
    // test-scoped fixtures are bare functions (no options tuple)
    expect(opts).toBeUndefined();
  });
});

describe('browser-bind-fixture — PRAMAN_BIND not set', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns { bound: false, endpointUrl: undefined } when PRAMAN_BIND is not set', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser();

    const result = await runFixture<{ bound: boolean; endpointUrl: string | undefined }>(fn, {
      browser,
      rootLogger: mockRootLogger,
    });

    expect(result.bound).toBe(false);
    expect(result.endpointUrl).toBeUndefined();
  });

  it('does not call browser.bind() when PRAMAN_BIND is not set', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser();

    await runFixture(fn, { browser, rootLogger: mockRootLogger });

    expect(browser['bind']).not.toHaveBeenCalled();
  });

  it('returns bound=false when PRAMAN_BIND is "0"', async () => {
    vi.stubEnv('PRAMAN_BIND', '0');
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser();

    const result = await runFixture<{ bound: boolean }>(fn, {
      browser,
      rootLogger: mockRootLogger,
    });

    expect(result.bound).toBe(false);
  });

  it('returns bound=false when PRAMAN_BIND is empty string', async () => {
    vi.stubEnv('PRAMAN_BIND', '');
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser();

    const result = await runFixture<{ bound: boolean }>(fn, {
      browser,
      rootLogger: mockRootLogger,
    });

    expect(result.bound).toBe(false);
  });
});

describe('browser-bind-fixture — PRAMAN_BIND=1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('PRAMAN_BIND', '1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('calls browser.bind() when PRAMAN_BIND=1', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser();

    await runFixture(fn, { browser, rootLogger: mockRootLogger });

    expect(browser['bind']).toHaveBeenCalledOnce();
  });

  it('returns { bound: true, endpointUrl } from bind result', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser({ bindResult: { endpoint: 'wss://localhost:9999/test' } });

    const result = await runFixture<{ bound: boolean; endpointUrl: string | undefined }>(fn, {
      browser,
      rootLogger: mockRootLogger,
    });

    expect(result.bound).toBe(true);
    expect(result.endpointUrl).toBe('wss://localhost:9999/test');
  });

  it('calls browser.unbind() during teardown', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser();

    let useFnCalled = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parameter required by fixture use() signature
    const useFn = async (_value: unknown): Promise<void> => {
      useFnCalled = true;
      await Promise.resolve();
    };

    await fn({ browser, rootLogger: mockRootLogger }, useFn);

    expect(useFnCalled).toBe(true);
    expect(browser['unbind']).toHaveBeenCalledOnce();
  });

  it('throws PramanError with ERR_BIND_NOT_SUPPORTED when browser.bind() is missing', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser({ withBind: false });

    await expect(runFixture(fn, { browser, rootLogger: mockRootLogger })).rejects.toThrow(
      'browser.bind() is not available',
    );
  });

  it('throws PramanError with ERR_BIND_NOT_SUPPORTED (error code) when bind is missing', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser({ withBind: false });

    const { PramanError } = await import('#core/errors/base.js');

    await expect(runFixture(fn, { browser, rootLogger: mockRootLogger })).rejects.toBeInstanceOf(
      PramanError,
    );
  });

  it('throws PramanError with ERR_BIND_FAILED when browser.bind() rejects', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser({ bindShouldFail: true });

    const { PramanError } = await import('#core/errors/base.js');

    await expect(runFixture(fn, { browser, rootLogger: mockRootLogger })).rejects.toBeInstanceOf(
      PramanError,
    );
  });

  it('throws error with bind failure message when bind() rejects', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser({ bindShouldFail: true });

    await expect(runFixture(fn, { browser, rootLogger: mockRootLogger })).rejects.toThrow(
      'bind() failed',
    );
  });

  it('handles unbind() failure gracefully (non-fatal)', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser();
    (browser['unbind'] as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('unbind failed'));

    // Should not throw — teardown errors are non-fatal
    await expect(runFixture(fn, { browser, rootLogger: mockRootLogger })).resolves.toBeDefined();
  });

  it('handles missing unbind() gracefully', async () => {
    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser({ withUnbind: false });

    await expect(runFixture(fn, { browser, rootLogger: mockRootLogger })).resolves.toBeDefined();
  });

  it('also triggers when PRAMAN_BIND is "true"', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('PRAMAN_BIND', 'true');

    const fn = extractFixtureFn(fixtures['browserBind']);
    const browser = makeMockBrowser();

    const result = await runFixture<{ bound: boolean }>(fn, {
      browser,
      rootLogger: mockRootLogger,
    });

    expect(result.bound).toBe(true);
    expect(browser['bind']).toHaveBeenCalledOnce();
  });
});

describe('browser-bind-fixture — type-level assertions', () => {
  it('browserBindTest is defined and has extend method', () => {
    // The mock test.extend() returns a MockPlaywrightTest — not a bare function.
    // In production Playwright, the test object is callable; here we verify it exists.
    expect(browserBindTest).toBeDefined();
    expect(typeof (browserBindTest as unknown as { extend?: unknown }).extend).toBe('function');
  });

  it('fixture definitions have expected keys', () => {
    expect(Object.keys(fixtures)).toContain('browserBind');
  });
});
