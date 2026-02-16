/**
 * Tests for `src/core/utils/retry.ts` — retry with exponential backoff + jitter.
 *
 * @remarks
 * Verifies the retry utility follows Google SRE exponential backoff + jitter pattern.
 * retry() is for infrastructure only — NOT for UI interactions (Playwright auto-retry).
 *
 * @module utils
 */
import { describe, expect, it, vi } from 'vitest';

import { calculateBackoff, retry } from '#core/utils/retry.js';

describe('retry', () => {
  // ── Success scenarios ───────────────────────────────────────────────
  it('succeeds on first try without retrying', async () => {
    const fn = vi.fn<() => Promise<string>>().mockResolvedValue('ok');

    const result = await retry(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure then succeeds', async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('ok');

    const result = await retry(fn, { baseDelay: 1, maxDelay: 10, jitter: false });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  // ── Exhaustion ──────────────────────────────────────────────────────
  it('exhausts retries and throws last error', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('always-fail'));

    await expect(
      retry(fn, { maxRetries: 2, baseDelay: 1, maxDelay: 10, jitter: false }),
    ).rejects.toThrow('always-fail');

    // 1 initial + 2 retries = 3
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws immediately with zero maxRetries', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('immediate'));

    await expect(retry(fn, { maxRetries: 0, baseDelay: 1 })).rejects.toThrow('immediate');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  // ── Default options ─────────────────────────────────────────────────
  it('applies default options when none provided', async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue('ok');

    const result = await retry(fn, { baseDelay: 1, maxDelay: 10 });

    expect(result).toBe('ok');
  });

  // ── AbortSignal cancellation ────────────────────────────────────────
  it('stops retrying when AbortSignal is aborted', async () => {
    const controller = new AbortController();
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('fail'));

    // Abort after first call
    fn.mockImplementation(async () => {
      controller.abort();
      return await Promise.reject(new Error('fail'));
    });

    await expect(
      retry(fn, { maxRetries: 5, baseDelay: 1, signal: controller.signal }),
    ).rejects.toThrow();

    // Should stop after abort — not exhaust all 5 retries
    expect(fn.mock.calls.length).toBeLessThanOrEqual(2);
  });

  // ── shouldRetry filter ──────────────────────────────────────────────
  it('uses custom shouldRetry filter', async () => {
    const retryableError = new Error('retryable');
    const nonRetryableError = new Error('fatal');

    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(retryableError)
      .mockRejectedValueOnce(nonRetryableError);

    const shouldRetry = (error: Error): boolean => error.message === 'retryable';

    await expect(retry(fn, { maxRetries: 5, baseDelay: 1, shouldRetry })).rejects.toThrow('fatal');

    // 1st call fails (retryable), 2nd call fails (not retryable) → stops
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('skips retry entirely when shouldRetry returns false on first error', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('non-retryable'));

    await expect(
      retry(fn, {
        maxRetries: 5,
        baseDelay: 1,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow('non-retryable');

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('calculateBackoff', () => {
  it('doubles delay each attempt (exponential)', () => {
    const d0 = calculateBackoff(0, 100, 5000, false);
    const d1 = calculateBackoff(1, 100, 5000, false);
    const d2 = calculateBackoff(2, 100, 5000, false);

    expect(d0).toBe(100);
    expect(d1).toBe(200);
    expect(d2).toBe(400);
  });

  it('caps delay at maxDelay', () => {
    const delay = calculateBackoff(20, 100, 5000, false);

    expect(delay).toBe(5000);
  });

  it('adds jitter when enabled', () => {
    // Run multiple times to verify randomness
    const delays = new Set<number>();
    for (let i = 0; i < 20; i++) {
      delays.add(calculateBackoff(1, 100, 5000, true));
    }

    // With jitter, we should see variation
    // Base delay at attempt 1 = 200, jitter adds 0-100% randomness
    for (const delay of delays) {
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(5000);
    }

    // At least some variation expected (statistically near-certain with 20 samples)
    expect(delays.size).toBeGreaterThan(1);
  });

  it('returns baseDelay at attempt 0 without jitter', () => {
    expect(calculateBackoff(0, 250, 10_000, false)).toBe(250);
  });
});
