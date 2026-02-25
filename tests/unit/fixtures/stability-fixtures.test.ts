/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/stability-fixtures.ts` — request interception
 * and UI5 stability auto-fixtures.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test` and core dependencies.
 * Fixture definitions are captured via `createMockTestExtend()` and
 * executed directly to verify behavior without a Playwright test runner.
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockTestExtend } from '../../helpers/mock-playwright-test.js';

import type { PramanConfig } from '#core/config/schema.js';
import { PramanConfigSchema } from '#core/config/schema.js';
import { DEFAULT_IGNORE_PATTERNS } from '#core/utils/constants.js';

// ── Mock dependencies ────────────────────────────────────────────────

const mockWaitForUI5Stable = vi.fn().mockResolvedValue(undefined);

vi.mock('#core/utils/wait-helpers.js', () => ({
  waitForUI5Stable: mockWaitForUI5Stable,
}));

const mockTestExtend = createMockTestExtend();

vi.mock('@playwright/test', () => ({
  test: {
    extend: mockTestExtend,
  },
}));

// ── Import after mocks ──────────────────────────────────────────────

const { stabilityTest } = await import('#fixtures/stability-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

/** Mock mainFrame sentinel */
const mockMainFrame = { url: vi.fn().mockReturnValue('https://example.com') };

/**
 * Creates a fresh mock Playwright page for each test.
 *
 * @returns Mock page with route/on/off/mainFrame stubs
 *
 * @example
 * ```typescript
 * const page = createMockPage();
 * ```
 */
function createMockPage(): {
  route: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  mainFrame: ReturnType<typeof vi.fn>;
} {
  return {
    route: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    mainFrame: vi.fn().mockReturnValue(mockMainFrame),
  };
}

/**
 * Creates a PramanConfig with optional overrides.
 *
 * @param overrides - Partial overrides for the config
 * @returns Frozen PramanConfig instance
 *
 * @example
 * ```typescript
 * const config = createConfig({ skipStabilityWait: true });
 * ```
 */
function createConfig(overrides?: Partial<PramanConfig>): Readonly<PramanConfig> {
  return Object.freeze(PramanConfigSchema.parse(overrides ?? {}));
}

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures.requestInterceptor);
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
 * const opts = extractFixtureOptions(fixtures.requestInterceptor);
 * ```
 */
function extractFixtureOptions(definition: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(definition) && definition.length > 1) {
    return definition[1] as Record<string, unknown>;
  }
  return undefined;
}

/**
 * Runs a fixture function with the given deps, waits for setup + teardown.
 *
 * @remarks
 * Simulates Playwright's `use()` callback. The fixture function runs
 * to completion (setup, use(), teardown) before this promise resolves.
 *
 * @param fn - The fixture function to execute
 * @param deps - Dependencies to pass as the first argument
 *
 * @example
 * ```typescript
 * await runFixture(fn, { page: mockPage, pramanConfig: config });
 * ```
 */
async function runFixture(
  fn: (deps: Record<string, unknown>, use: (value: unknown) => Promise<void>) => Promise<void>,
  deps: Record<string, unknown>,
): Promise<void> {
  const useFn = async (): Promise<void> => {
    await Promise.resolve();
  };
  await fn(deps, useFn);
}

// ── Fixture definitions reference ───────────────────────────────────

const fixtures = (stabilityTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Tests ───────────────────────────────────────────────────────────

describe('stability-fixtures requestInterceptor', () => {
  let mockPage: ReturnType<typeof createMockPage>;
  let defaultConfig: Readonly<PramanConfig>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPage = createMockPage();
    defaultConfig = createConfig();
    mockWaitForUI5Stable.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is declared as auto and test-scoped', () => {
    const options = extractFixtureOptions(fixtures['requestInterceptor']);

    expect(options).toBeDefined();
    expect(options?.['auto']).toBe(true);
  });

  it('blocks WalkMe requests by registering route for walkme.com pattern', async () => {
    const fn = extractFixtureFn(fixtures['requestInterceptor']);

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: defaultConfig,
    });

    // DEFAULT_IGNORE_PATTERNS includes walkme patterns
    const routeCalls = mockPage.route.mock.calls as [RegExp, unknown][];
    const registeredPatterns = routeCalls.map(([pattern]) => pattern);

    const walkmePattern = registeredPatterns.find((p) =>
      p instanceof RegExp ? p.source.includes('walkme') : String(p).includes('walkme'),
    );

    expect(walkmePattern).toBeDefined();
  });

  it('blocks analytics requests by registering route for analytics.google pattern', async () => {
    const fn = extractFixtureFn(fixtures['requestInterceptor']);

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: defaultConfig,
    });

    const routeCalls = mockPage.route.mock.calls as [RegExp, unknown][];
    const registeredPatterns = routeCalls.map(([pattern]) => pattern);

    const analyticsPattern = registeredPatterns.find((p) =>
      p instanceof RegExp ? p.source.includes('analytics') : String(p).includes('analytics'),
    );

    expect(analyticsPattern).toBeDefined();
  });

  it('does not register route for normal SAP URLs like sap-cloud.com/odata', async () => {
    const fn = extractFixtureFn(fixtures['requestInterceptor']);

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: defaultConfig,
    });

    const routeCalls = mockPage.route.mock.calls as [RegExp, unknown][];
    const registeredPatterns = routeCalls.map(([pattern]) => pattern);

    // None of the registered patterns should match a normal SAP URL
    const sapUrl = 'https://sap-cloud.com/odata/v4/catalog';
    const matchesSap = registeredPatterns.some((p) =>
      p instanceof RegExp ? p.test(sapUrl) : false,
    );

    expect(matchesSap).toBe(false);
  });

  it('uses custom ignoreAutoWaitUrls from config when provided', async () => {
    const customConfig = createConfig({
      ignoreAutoWaitUrls: ['custom-tracker\\.example\\.com'],
    });

    const fn = extractFixtureFn(fixtures['requestInterceptor']);

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: customConfig,
    });

    const routeCalls = mockPage.route.mock.calls as [RegExp, unknown][];
    const registeredPatterns = routeCalls.map(([pattern]) => pattern);

    // Should include both default patterns AND custom pattern
    const customPattern = registeredPatterns.find((p) =>
      p instanceof RegExp
        ? p.source.includes('custom-tracker')
        : String(p).includes('custom-tracker'),
    );

    expect(customPattern).toBeDefined();
    // Also still has default patterns
    expect(routeCalls.length).toBeGreaterThan(1);
  });

  it('registers routes for all DEFAULT_IGNORE_PATTERNS when config has no custom URLs', async () => {
    const fn = extractFixtureFn(fixtures['requestInterceptor']);

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: defaultConfig,
    });

    // Should register routes for all DEFAULT_IGNORE_PATTERNS
    expect(mockPage.route).toHaveBeenCalledTimes(DEFAULT_IGNORE_PATTERNS.length);
  });

  it('calls route.abort() on the route handler when a matching request occurs', async () => {
    const fn = extractFixtureFn(fixtures['requestInterceptor']);

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: defaultConfig,
    });

    // Extract the handler from the first route call
    const routeCalls = mockPage.route.mock.calls as [
      RegExp,
      (route: { abort: () => Promise<void> }) => Promise<void>,
    ][];
    expect(routeCalls.length).toBeGreaterThan(0);

    const firstCall = routeCalls[0];
    expect(firstCall).toBeDefined();
    const [, handler] = firstCall as [
      RegExp,
      (route: { abort: () => Promise<void> }) => Promise<void>,
    ];
    const mockRoute = { abort: vi.fn().mockResolvedValue(undefined) };

    await handler(mockRoute);

    expect(mockRoute.abort).toHaveBeenCalledOnce();
  });
});

describe('stability-fixtures ui5Stability', () => {
  let mockPage: ReturnType<typeof createMockPage>;
  let defaultConfig: Readonly<PramanConfig>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPage = createMockPage();
    defaultConfig = createConfig();
    mockWaitForUI5Stable.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is declared as auto and test-scoped', () => {
    const options = extractFixtureOptions(fixtures['ui5Stability']);

    expect(options).toBeDefined();
    expect(options?.['auto']).toBe(true);
  });

  it('does not register listener when skipStabilityWait is true', async () => {
    const skipConfig = createConfig({ skipStabilityWait: true });
    const fn = extractFixtureFn(fixtures['ui5Stability']);

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: skipConfig,
    });

    expect(mockPage.on).not.toHaveBeenCalled();
  });

  it('calls waitForUI5Stable when main frame navigates', async () => {
    const fn = extractFixtureFn(fixtures['ui5Stability']);

    let capturedListener: ((frame: unknown) => void) | undefined;
    mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
      if (event === 'framenavigated') {
        capturedListener = listener;
      }
    });

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: defaultConfig,
    });

    expect(capturedListener).toBeDefined();

    // Simulate main frame navigation
    capturedListener?.(mockMainFrame);

    // Allow microtask queue to flush (the listener calls an async function)
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mockWaitForUI5Stable).toHaveBeenCalledOnce();
  });

  it('does not call waitForUI5Stable when iframe navigates (non-main frame)', async () => {
    const fn = extractFixtureFn(fixtures['ui5Stability']);

    let capturedListener: ((frame: unknown) => void) | undefined;
    mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
      if (event === 'framenavigated') {
        capturedListener = listener;
      }
    });

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: defaultConfig,
    });

    expect(capturedListener).toBeDefined();

    // Simulate iframe navigation (different frame object)
    const iframeFrame = { url: vi.fn().mockReturnValue('https://iframe.example.com') };
    capturedListener?.(iframeFrame);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mockWaitForUI5Stable).not.toHaveBeenCalled();
  });

  it('removes framenavigated listener on teardown via page.off()', async () => {
    const fn = extractFixtureFn(fixtures['ui5Stability']);

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: defaultConfig,
    });

    expect(mockPage.off).toHaveBeenCalledWith('framenavigated', expect.any(Function));
  });

  it('catches waitForUI5Stable failure silently (non-fatal)', async () => {
    mockWaitForUI5Stable.mockRejectedValue(new Error('UI5 stability timeout'));

    const fn = extractFixtureFn(fixtures['ui5Stability']);

    let capturedListener: ((frame: unknown) => void) | undefined;
    mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
      if (event === 'framenavigated') {
        capturedListener = listener;
      }
    });

    await runFixture(fn, {
      page: mockPage,
      pramanConfig: defaultConfig,
    });

    expect(capturedListener).toBeDefined();

    // Simulate main frame navigation — should NOT throw even though waitForUI5Stable rejects
    capturedListener?.(mockMainFrame);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    // The test should reach this point without error
    expect(mockWaitForUI5Stable).toHaveBeenCalledOnce();
  });
});

describe('stability-fixtures fixture declarations', () => {
  it('stabilityTest exports fixture definitions with requestInterceptor', () => {
    expect(fixtures).toHaveProperty('requestInterceptor');
  });

  it('stabilityTest exports fixture definitions with ui5Stability', () => {
    expect(fixtures).toHaveProperty('ui5Stability');
  });
});
