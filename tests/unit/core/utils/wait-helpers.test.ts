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
