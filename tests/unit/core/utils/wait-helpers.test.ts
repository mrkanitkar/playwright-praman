/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/utils/wait-helpers.ts` — UI5 stability wait helpers.
 *
 * @remarks
 * Verifies three-tier stability system: full UI5 stability wait,
 * brief DOM settle, and UI5 bootstrap detection. All use
 * Playwright-native `page.waitForFunction()` (never `page.waitForTimeout()`).
 *
 * @module utils
 */
import { describe, expect, it, vi } from 'vitest';

import { TimeoutError } from '#core/errors/timeout-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';
import { briefDOMSettle, waitForUI5Bootstrap, waitForUI5Stable } from '#core/utils/wait-helpers.js';

/**
 * Creates a minimal mock of Playwright's Page object for testing wait helpers.
 */
function createMockPage(): {
  waitForFunction: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<void>>>;
  evaluate: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<void>>>;
} {
  return {
    waitForFunction: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    evaluate: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
  };
}

describe('waitForUI5Stable', () => {
  it('resolves when UI5 is stable — page.waitForFunction called with correct condition', async () => {
    const page = createMockPage();

    await waitForUI5Stable(page, {});

    expect(page.waitForFunction).toHaveBeenCalledTimes(1);
    // The first argument should be a function (the condition)
    const firstArg = page.waitForFunction.mock.calls[0]?.[0];
    expect(typeof firstArg).toBe('function');
  });

  it('uses default timeout from DEFAULT_TIMEOUTS.UI5_WAIT', async () => {
    const page = createMockPage();

    await waitForUI5Stable(page);

    const options = page.waitForFunction.mock.calls[0]?.[1] as
      | { timeout?: number; polling?: number }
      | undefined;
    expect(options?.timeout).toBe(DEFAULT_TIMEOUTS.UI5_WAIT);
  });

  it('respects custom timeout option', async () => {
    const page = createMockPage();

    await waitForUI5Stable(page, { timeout: 5000 });

    const options = page.waitForFunction.mock.calls[0]?.[1] as
      | { timeout?: number; polling?: number }
      | undefined;
    expect(options?.timeout).toBe(5000);
  });

  it('wraps Playwright timeout error in TimeoutError', async () => {
    const page = createMockPage();
    page.waitForFunction.mockRejectedValue(new Error('Timeout 15000ms exceeded'));

    await expect(async () => {
      await waitForUI5Stable(page);
    }).rejects.toThrow(TimeoutError);
  });

  it('calls briefDOMSettle when skipStabilityWait is true', async () => {
    const page = createMockPage();

    await waitForUI5Stable(page, { skipStabilityWait: true });

    // Should NOT call waitForFunction, should call evaluate (via briefDOMSettle)
    expect(page.waitForFunction).not.toHaveBeenCalled();
    expect(page.evaluate).toHaveBeenCalledTimes(1);
  });

  it('passes polling interval option to page.waitForFunction', async () => {
    const page = createMockPage();

    await waitForUI5Stable(page, { polling: 250 });

    const options = page.waitForFunction.mock.calls[0]?.[1] as
      | { timeout?: number; polling?: number }
      | undefined;
    expect(options?.polling).toBe(250);
  });

  it('wraps non-Error rejection in TimeoutError', async () => {
    const page = createMockPage();
    page.waitForFunction.mockRejectedValue('string-error');

    await expect(async () => {
      await waitForUI5Stable(page);
    }).rejects.toThrow(TimeoutError);
  });

  it('uses custom message in timeout error', async () => {
    const page = createMockPage();
    page.waitForFunction.mockRejectedValue(new Error('timeout'));

    try {
      await waitForUI5Stable(page, { message: 'Custom wait message' });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as TimeoutError).message).toBe('Custom wait message');
    }
  });

  it('timeout error includes cause when Error thrown', async () => {
    const page = createMockPage();
    const original = new Error('Timeout 15000ms exceeded');
    page.waitForFunction.mockRejectedValue(original);

    try {
      await waitForUI5Stable(page);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as TimeoutError).cause).toBe(original);
    }
  });
});

describe('briefDOMSettle', () => {
  it('calls page.evaluate with default duration', async () => {
    const page = createMockPage();

    await briefDOMSettle(page);

    expect(page.evaluate).toHaveBeenCalledTimes(1);
    const secondArg = page.evaluate.mock.calls[0]?.[1];
    expect(secondArg).toBe(DEFAULT_TIMEOUTS.DOM_SETTLE);
  });

  it('uses custom duration when provided', async () => {
    const page = createMockPage();

    await briefDOMSettle(page, 250);

    const secondArg = page.evaluate.mock.calls[0]?.[1];
    expect(secondArg).toBe(250);
  });

  it('passes a function as first argument to evaluate', async () => {
    const page = createMockPage();

    await briefDOMSettle(page);

    const firstArg = page.evaluate.mock.calls[0]?.[0];
    expect(typeof firstArg).toBe('function');
  });
});

describe('browser-script shape: MutationObserver quiet-window logic', () => {
  it('resolves immediately via quiet-window when DOM is already stable (setTimeout fallback)', async () => {
    vi.useFakeTimers();
    try {
      const page = createMockPage();
      // Capture the browser function passed to page.evaluate and run it directly
      // In Node, MutationObserver exists but document.body does not, so the function
      // exercises the setTimeout fallback path when document is unavailable.
      page.evaluate.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/promise-function-async -- mirror browser-evaluated signature
        (fn: unknown, arg: unknown): Promise<void> => {
          // Temporarily remove MutationObserver to exercise the fallback path
          const saved = globalThis.MutationObserver;
          Reflect.deleteProperty(globalThis, 'MutationObserver');
          try {
            return (fn as (timeout: number) => Promise<void>)(arg as number);
          } finally {
            globalThis.MutationObserver = saved;
          }
        },
      );

      const settlePromise = briefDOMSettle(page, 200);
      // The fallback setTimeout(resolve, 200) should be pending
      await vi.advanceTimersByTimeAsync(200);
      await settlePromise;

      expect(page.evaluate).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resolves via quiet-window when MutationObserver is available', async () => {
    vi.useFakeTimers();
    try {
      let observeCalledWith: MutationObserverInit | undefined;
      let disconnected = false;

      // Stub MutationObserver and document for browser-like environment in Node
      const FakeMO = function fakeMutationObserver(this: Record<string, unknown>): void {
        this['observe'] = (_target: unknown, init?: MutationObserverInit): void => {
          observeCalledWith = init;
        };
        this['disconnect'] = (): void => {
          disconnected = true;
        };
        this['takeRecords'] = (): MutationRecord[] => [];
      };
      vi.stubGlobal('MutationObserver', FakeMO);
      vi.stubGlobal('document', { body: {} });

      const page = createMockPage();
      page.evaluate.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/promise-function-async -- mirror browser-evaluated signature
        (fn: unknown, arg: unknown): Promise<void> =>
          (fn as (timeout: number) => Promise<void>)(arg as number),
      );

      const settlePromise = briefDOMSettle(page, 300);
      // The initial quiet timer fires after 50ms
      await vi.advanceTimersByTimeAsync(50);
      await settlePromise;

      expect(observeCalledWith).toEqual({
        childList: true,
        subtree: true,
        attributes: true,
      });
      expect(disconnected).toBe(true);
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it('resolves via cap timer when DOM mutates continuously', async () => {
    vi.useFakeTimers();
    try {
      let observerCallback: MutationCallback | undefined;
      let disconnected = false;

      // Stub MutationObserver to capture the callback for simulating mutations
      const FakeMO = function fakeMutationObserver(
        this: Record<string, unknown>,
        callback: MutationCallback,
      ): void {
        observerCallback = callback;
        this['observe'] = (): void => {
          // no-op
        };
        this['disconnect'] = (): void => {
          disconnected = true;
        };
        this['takeRecords'] = (): MutationRecord[] => [];
      };
      vi.stubGlobal('MutationObserver', FakeMO);
      vi.stubGlobal('document', { body: {} });

      const page = createMockPage();
      page.evaluate.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/promise-function-async -- mirror browser-evaluated signature
        (fn: unknown, arg: unknown): Promise<void> =>
          (fn as (timeout: number) => Promise<void>)(arg as number),
      );

      const settlePromise = briefDOMSettle(page, 200);

      // Simulate continuous mutations that keep resetting the quiet timer
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(30);
        if (observerCallback !== undefined) {
          observerCallback([], {} as MutationObserver);
        }
      }

      // Cap timer fires at 200ms total
      await vi.advanceTimersByTimeAsync(200);
      await settlePromise;

      expect(disconnected).toBe(true);
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
});

describe('waitForUI5Bootstrap', () => {
  it('calls page.waitForFunction with bootstrap condition', async () => {
    const page = createMockPage();

    await waitForUI5Bootstrap(page);

    expect(page.waitForFunction).toHaveBeenCalledTimes(1);
    const firstArg = page.waitForFunction.mock.calls[0]?.[0];
    expect(typeof firstArg).toBe('function');
  });

  it('uses default timeout from DEFAULT_TIMEOUTS.UI5_BOOTSTRAP', async () => {
    const page = createMockPage();

    await waitForUI5Bootstrap(page);

    const options = page.waitForFunction.mock.calls[0]?.[1] as { timeout?: number } | undefined;
    expect(options?.timeout).toBe(DEFAULT_TIMEOUTS.UI5_BOOTSTRAP);
  });

  it('wraps Playwright timeout error in TimeoutError', async () => {
    const page = createMockPage();
    page.waitForFunction.mockRejectedValue(new Error('Timeout 60000ms exceeded'));

    await expect(async () => {
      await waitForUI5Bootstrap(page);
    }).rejects.toThrow(TimeoutError);
  });

  it('respects custom timeout option', async () => {
    const page = createMockPage();

    await waitForUI5Bootstrap(page, { timeout: 30_000 });

    const options = page.waitForFunction.mock.calls[0]?.[1] as { timeout?: number } | undefined;
    expect(options?.timeout).toBe(30_000);
  });

  it('wraps non-Error rejection in TimeoutError', async () => {
    const page = createMockPage();
    page.waitForFunction.mockRejectedValue('string-rejection');

    await expect(async () => {
      await waitForUI5Bootstrap(page);
    }).rejects.toThrow(TimeoutError);
  });

  it('timeout error preserves cause from original Error', async () => {
    const page = createMockPage();
    const original = new Error('Timeout 60000ms exceeded');
    page.waitForFunction.mockRejectedValue(original);

    try {
      await waitForUI5Bootstrap(page);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as TimeoutError).cause).toBe(original);
    }
  });
});
