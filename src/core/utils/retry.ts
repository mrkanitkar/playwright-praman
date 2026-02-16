/**
 * Lightweight retry with exponential backoff + jitter (Google SRE pattern).
 *
 * @remarks
 * This retry utility is for **infrastructure operations only** — config loading,
 * OTel initialization, bridge injection, etc. It is NOT for UI interactions;
 * those use Playwright's native auto-retry mechanism.
 *
 * Backoff formula: `min(baseDelay × 2^attempt + jitter, maxDelay)`
 *
 * @example
 * ```typescript
 * import { retry } from '#core/utils/retry.js';
 *
 * const config = await retry(() => loadConfigFromDisk(), {
 *   maxRetries: 3,
 *   baseDelay: 100,
 *   shouldRetry: (err) => err.message.includes('ENOENT'),
 * });
 * ```
 *
 * @module utils
 */

/**
 * Options for configuring retry behavior.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts after the initial call. Default: 3. */
  readonly maxRetries?: number;
  /** Base delay in ms before the first retry. Default: 100. */
  readonly baseDelay?: number;
  /** Maximum delay cap in ms. Default: 5000. */
  readonly maxDelay?: number;
  /** Add random jitter to delays (Google SRE best practice). Default: true. */
  readonly jitter?: boolean;
  /** AbortSignal to cancel retrying. */
  readonly signal?: AbortSignal;
  /** Custom filter — return false to stop retrying for specific errors. */
  readonly shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Calculates delay using exponential backoff with optional jitter.
 *
 * @remarks
 * Formula: `min(baseDelay × 2^attempt, maxDelay)` with optional random jitter
 * between 0 and the calculated delay.
 *
 * @param attempt - Zero-based attempt number (0 = first retry).
 * @param baseDelay - Base delay in milliseconds.
 * @param maxDelay - Maximum delay cap in milliseconds.
 * @param jitter - Whether to add random jitter.
 * @returns Calculated delay in milliseconds.
 *
 * @example
 * ```typescript
 * const delay = calculateBackoff(2, 100, 5000, true);
 * // Base: 100 * 2^2 = 400, with jitter: random in [0, 400]
 * ```
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitter: boolean,
): number {
  const exponential = baseDelay * 2 ** attempt;
  const capped = Math.min(exponential, maxDelay);

  if (jitter) {
    // eslint-disable-next-line sonarjs/pseudo-random -- jitter for backoff, not security
    return Math.round(Math.random() * capped);
  }

  return capped;
}

/**
 * Retries an async operation with exponential backoff + jitter.
 *
 * @remarks
 * WARNING: `retry()` is for infrastructure only — config loading, OTel init,
 * bridge injection. Do NOT use for UI interactions — use Playwright's native
 * auto-retry or `waitForUI5Stable()` instead.
 *
 * @param fn - Async function to attempt.
 * @param options - Retry configuration.
 * @returns The result of `fn` on success.
 * @throws The last error after all retries are exhausted.
 *
 * @example
 * ```typescript
 * const result = await retry(
 *   () => fetchWithTimeout('/api/data'),
 *   { maxRetries: 3, baseDelay: 200, shouldRetry: (err) => err.message !== 'AUTH_FAILED' },
 * );
 * ```
 */
export async function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.baseDelay ?? 100;
  const maxDelay = options?.maxDelay ?? 5000;
  const jitter = options?.jitter ?? true;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      // Check if we should stop: exhausted retries, signal aborted, or filter rejected
      const exhausted = attempt >= maxRetries;
      const aborted = options?.signal?.aborted === true;
      const filtered = options?.shouldRetry !== undefined && !options.shouldRetry(err, attempt);

      if (exhausted || aborted || filtered) {
        throw err;
      }

      // Wait before retrying
      const delay = calculateBackoff(attempt, baseDelay, maxDelay, jitter);
      await sleep(delay);
    }
  }

  // Unreachable in practice, but satisfies TypeScript
  throw lastError ?? new Error('retry exhausted');
}

/** Promise-based sleep for internal use. */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
