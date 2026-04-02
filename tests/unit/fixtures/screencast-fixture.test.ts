/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/screencast-fixture.ts`.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test` and core logging module.
 * Fixture definitions are captured via `createMockTestExtend()` and executed
 * directly to verify behavior without requiring a Playwright test runner.
 *
 * @module fixtures
 */

import { Buffer } from 'node:buffer';

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

const { screencastTest } = await import('#fixtures/screencast-fixture.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures.screencast);
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
 * const opts = extractFixtureOptions(fixtures.screencast);
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
 * const result = await runFixture(fixtureFn, { page: mockPage });
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

// ── Mock factories ────────────────────────────────────────────────────────────

/**
 * Creates a mock Playwright 1.59 screencast object.
 *
 * @param opts - Configuration options
 * @returns Mock screencast object or undefined
 */
interface MockScreencast {
  showChapter: ReturnType<typeof vi.fn>;
  showActions: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  getCapturedOnFrame: () => ((data: { data: Buffer }) => void) | undefined;
}

function makeMockScreencast(opts?: { available?: boolean }): MockScreencast | undefined {
  if (opts?.available === false) return undefined;

  let capturedOnFrame: ((data: { data: Buffer }) => void) | undefined;

  return {
    showChapter: vi.fn().mockResolvedValue(undefined),
    showActions: vi.fn().mockResolvedValue({ dispose: vi.fn() }),
    start: vi
      .fn()
      .mockImplementation(async (startOpts?: { onFrame?: (data: { data: Buffer }) => void }) => {
        // eslint-disable-next-line eqeqeq -- null check covers both null and undefined
        if (startOpts?.onFrame != null) {
          capturedOnFrame = startOpts.onFrame;
        }
        return Promise.resolve();
      }),
    stop: vi.fn().mockResolvedValue(undefined),
    getCapturedOnFrame: () => capturedOnFrame,
  };
}

/** Creates a mock Playwright page with optional screencast property. */
function makeMockPage(screencast?: ReturnType<typeof makeMockScreencast>): Record<string, unknown> {
  return { screencast };
}

const mockRootLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(),
};

/** The fixture API shape. */
interface ScreencastAPI {
  showChapter: (title: string) => Promise<void>;
  showActions: (options?: {
    duration?: number;
    fontSize?: number;
    position?: string;
  }) => Promise<void>;
  showUI5ControlTree: (enabled?: boolean) => void;
  onFrame: (handler: (frame: { buffer: Buffer; timestamp: number }) => Promise<void>) => void;
}

// ── Fixture definitions reference ─────────────────────────────────────────────

const fixtures = (screencastTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('screencast-fixture structure', () => {
  it('exports screencastTest as a defined object', () => {
    // The mock test.extend() returns a MockPlaywrightTest object (not a bare function).
    // In production Playwright the test object is callable; here we verify it exists.
    expect(screencastTest).toBeDefined();
    expect(screencastTest).not.toBeNull();
  });

  it('has _fixtureDefinitions with screencast', () => {
    expect(fixtures).toHaveProperty('screencast');
  });

  it('has _fixtureDefinitions with rootLogger option placeholder', () => {
    expect(fixtures).toHaveProperty('rootLogger');
    const opts = extractFixtureOptions(fixtures['rootLogger']);
    expect(opts?.['option']).toBe(true);
    expect(opts?.['scope']).toBe('worker');
  });

  it('declares screencast as a test-scoped fixture (bare function)', () => {
    const opts = extractFixtureOptions(fixtures['screencast']);
    expect(opts).toBeUndefined();
  });
});

describe('screencast-fixture — screencast API shape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides showChapter, showActions, showUI5ControlTree, onFrame functions', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const result = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    expect(typeof result.showChapter).toBe('function');
    expect(typeof result.showActions).toBe('function');
    expect(typeof result.showUI5ControlTree).toBe('function');
    expect(typeof result.onFrame).toBe('function');
  });
});

describe('screencast-fixture — showChapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls page.screencast.showChapter() with the provided title', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });
    await api.showChapter('Navigate to PO list');

    expect(sc?.showChapter).toHaveBeenCalledOnce();
    expect(sc?.showChapter).toHaveBeenCalledWith('Navigate to PO list');
  });

  it('does not throw when page.screencast is unavailable (Playwright < 1.59)', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const page = makeMockPage();

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    await expect(api.showChapter('Step 1')).resolves.toBeUndefined();
  });

  it('throws PramanError when showChapter() rejects', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    sc?.showChapter.mockRejectedValue(new Error('chapter error'));
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    const { PramanError } = await import('#core/errors/base.js');

    await expect(api.showChapter('Failing chapter')).rejects.toBeInstanceOf(PramanError);
  });

  it('throws with error message embedded in PramanError on showChapter failure', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    sc?.showChapter.mockRejectedValue(new Error('chapter error'));
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    await expect(api.showChapter('Failing chapter')).rejects.toThrow('chapter error');
  });

  it('can call showChapter multiple times', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });
    await api.showChapter('Step 1');
    await api.showChapter('Step 2');
    await api.showChapter('Step 3');

    expect(sc?.showChapter).toHaveBeenCalledTimes(3);
    expect(sc?.showChapter).toHaveBeenNthCalledWith(1, 'Step 1');
    expect(sc?.showChapter).toHaveBeenNthCalledWith(2, 'Step 2');
    expect(sc?.showChapter).toHaveBeenNthCalledWith(3, 'Step 3');
  });
});

describe('screencast-fixture — showActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls page.screencast.showActions() with no args when options omitted', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });
    await api.showActions();

    expect(sc?.showActions).toHaveBeenCalledOnce();
    expect(sc?.showActions).toHaveBeenCalledWith(undefined);
  });

  it('calls page.screencast.showActions() with options when provided', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });
    await api.showActions({ position: 'bottom', duration: 800 });

    expect(sc?.showActions).toHaveBeenCalledWith({ position: 'bottom', duration: 800 });
  });

  it('does not throw when page.screencast is unavailable', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const page = makeMockPage();

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    await expect(api.showActions()).resolves.toBeUndefined();
  });
});

describe('screencast-fixture — showUI5ControlTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw when called with enabled=true', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    expect(() => {
      api.showUI5ControlTree(true);
    }).not.toThrow();
  });

  it('does not throw when called with enabled=false', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    expect(() => {
      api.showUI5ControlTree(false);
    }).not.toThrow();
  });

  it('defaults to enabled=true when no argument provided', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    expect(() => {
      api.showUI5ControlTree();
    }).not.toThrow();
  });
});

describe('screencast-fixture — onFrame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts page.screencast.start() with onFrame when first handler registered', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });
    const handler = vi.fn().mockResolvedValue(undefined);
    api.onFrame(handler);

    // Allow async start() to run
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sc?.start).toHaveBeenCalledOnce();
    expect(sc?.start).toHaveBeenCalledWith(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any(Function) returns AsymmetricMatcher typed as any
      expect.objectContaining({ onFrame: expect.any(Function) }),
    );
  });

  it('starts page.screencast.start() only once for multiple handlers', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    const handler1 = vi.fn().mockResolvedValue(undefined);
    const handler2 = vi.fn().mockResolvedValue(undefined);
    api.onFrame(handler1);
    api.onFrame(handler2);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sc?.start).toHaveBeenCalledOnce();
  });

  it('throws PramanError with ERR_SCREENCAST_NOT_STARTED when screencast unavailable', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const page = makeMockPage();

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    const { PramanError } = await import('#core/errors/base.js');
    const handler = vi.fn().mockResolvedValue(undefined);

    expect(() => {
      api.onFrame(handler);
    }).toThrow(PramanError);
  });

  it('throws with ERR_SCREENCAST_NOT_STARTED message when screencast unavailable', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const page = makeMockPage();

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });
    const handler = vi.fn().mockResolvedValue(undefined);

    expect(() => {
      api.onFrame(handler);
    }).toThrow('page.screencast is not available');
  });

  it('dispatches frame data to registered handler via captured onFrame callback', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    const frameHandler = vi.fn().mockResolvedValue(undefined);
    api.onFrame(frameHandler);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Simulate a raw frame event via the captured onFrame callback
    const capturedOnFrame = sc?.getCapturedOnFrame();
    expect(capturedOnFrame).toBeDefined();

    const fakeBuffer = Buffer.from([1, 2, 3]);
    capturedOnFrame?.({ data: fakeBuffer });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(frameHandler).toHaveBeenCalledOnce();
    expect(frameHandler).toHaveBeenCalledWith(expect.objectContaining({ buffer: fakeBuffer }));
  });

  it('dispatches to multiple registered handlers', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    const handler1 = vi.fn().mockResolvedValue(undefined);
    const handler2 = vi.fn().mockResolvedValue(undefined);
    api.onFrame(handler1);
    api.onFrame(handler2);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const capturedOnFrame = sc?.getCapturedOnFrame();
    capturedOnFrame?.({ data: Buffer.from([0]) });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('does not propagate frame handler errors (non-fatal)', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    const api = await runFixture<ScreencastAPI>(fn, { page, rootLogger: mockRootLogger });

    const failingHandler = vi.fn().mockRejectedValue(new Error('vision error'));
    api.onFrame(failingHandler);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const capturedOnFrame = sc?.getCapturedOnFrame();

    // Fire event — the internal dispatcher catches errors; this call must not throw
    expect(() => capturedOnFrame?.({ data: Buffer.from([0]) })).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(failingHandler).toHaveBeenCalledOnce();
  });
});

describe('screencast-fixture — teardown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls page.screencast.stop() on teardown when screencast was started', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    let useFnCalled = false;
    const useFn = async (api: unknown): Promise<void> => {
      useFnCalled = true;
      // Register a handler to trigger start()
      (api as ScreencastAPI).onFrame(vi.fn().mockResolvedValue(undefined));
      await new Promise((resolve) => setTimeout(resolve, 10));
    };

    await fn({ page, rootLogger: mockRootLogger }, useFn);

    expect(useFnCalled).toBe(true);
    expect(sc?.stop).toHaveBeenCalledOnce();
  });

  it('does not call page.screencast.stop() on teardown when no frame handlers registered', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    const page = makeMockPage(sc);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parameter required by fixture use() signature
    const useFn = async (_api: unknown): Promise<void> => {
      await Promise.resolve();
    };

    await fn({ page, rootLogger: mockRootLogger }, useFn);

    expect(sc?.stop).not.toHaveBeenCalled();
  });

  it('does not throw during teardown when screencast is unavailable', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const page = makeMockPage();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parameter required by fixture use() signature
    const useFn = async (_api: unknown): Promise<void> => {
      await Promise.resolve();
    };

    await expect(fn({ page, rootLogger: mockRootLogger }, useFn)).resolves.toBeUndefined();
  });

  it('handles stop() failure gracefully during teardown (non-fatal)', async () => {
    const fn = extractFixtureFn(fixtures['screencast']);
    const sc = makeMockScreencast();
    sc?.stop.mockRejectedValue(new Error('stop failed'));
    const page = makeMockPage(sc);

    const useFn = async (api: unknown): Promise<void> => {
      (api as ScreencastAPI).onFrame(vi.fn().mockResolvedValue(undefined));
      await new Promise((resolve) => setTimeout(resolve, 10));
    };

    // Should not throw — stop() errors are non-fatal in teardown
    await expect(fn({ page, rootLogger: mockRootLogger }, useFn)).resolves.toBeUndefined();
  });
});

describe('screencast-fixture — type-level assertions', () => {
  it('screencastTest is defined and has extend method', () => {
    // The mock test.extend() returns a MockPlaywrightTest — not a bare function.
    expect(screencastTest).toBeDefined();
    expect(typeof (screencastTest as unknown as { extend?: unknown }).extend).toBe('function');
  });

  it('fixture definitions have expected keys', () => {
    expect(Object.keys(fixtures)).toContain('screencast');
    expect(Object.keys(fixtures)).toContain('rootLogger');
  });
});
