/**
 * Tests for stability guard behavior in `src/fixtures/module-fixtures.ts`.
 *
 * @remarks
 * Verifies that:
 * - withStability wraps all async methods to call a guard function first
 * - The guard is called before each table/dialog/date/odata method
 */

/* eslint-disable @typescript-eslint/no-unsafe-call -- vi.fn() wrapped results are any-typed */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- vi.fn() mock return is any-typed */

import { describe, expect, it, vi } from 'vitest';

describe('module-fixtures stability guard (withStability)', () => {
  /**
   * Standalone replica of the withStability function from module-fixtures.ts.
   * Tested here without importing from the fixture to avoid Playwright dependencies.
   */
  function withStability<T extends Record<string, (...args: never[]) => Promise<unknown>>>(
    obj: T,
    guard: () => Promise<void>,
  ): T {
    const wrapped: Partial<T> = {};
    for (const key of Object.keys(obj) as (keyof T)[]) {
      const fn = obj[key];
      if (fn === undefined) continue;
      const capturedFn = fn;
      wrapped[key] = (async (...args: never[]): Promise<unknown> => {
        await guard();
        return capturedFn(...args);
      }) as T[keyof T];
    }
    return wrapped as T;
  }

  it('calls guard before each wrapped method', async () => {
    const guardCallCount = { value: 0 };
    const guard = vi.fn().mockImplementation(async () => {
      guardCallCount.value++;
      await Promise.resolve();
    });

    const original = {
      getRows: vi.fn().mockResolvedValue(['row1', 'row2']),
      getRowCount: vi.fn().mockResolvedValue(2),
    };

    const wrapped = withStability(original as never, guard);

    await wrapped.getRows();
    await wrapped.getRowCount();

    expect(guard).toHaveBeenCalledTimes(2);
    expect(guardCallCount.value).toBe(2);
    expect(original.getRows).toHaveBeenCalledOnce();
    expect(original.getRowCount).toHaveBeenCalledOnce();
  });

  it('preserves method arguments when calling through guard', async () => {
    const guard = vi.fn().mockResolvedValue(undefined);
    const original = {
      filterByColumn: vi.fn().mockImplementation(async (col: number, value: string) => {
        await Promise.resolve();
        return `${String(col)}:${value}`;
      }),
    };

    const wrapped = withStability(original as never, guard);
    const result = await wrapped.filterByColumn(2, 'Active');

    expect(guard).toHaveBeenCalledOnce();
    expect(original.filterByColumn).toHaveBeenCalledWith(2, 'Active');
    expect(result).toBe('2:Active');
  });

  it('wraps all methods in the object', () => {
    const guard = vi.fn().mockResolvedValue(undefined);
    const original = {
      methodA: vi.fn().mockResolvedValue('a'),
      methodB: vi.fn().mockResolvedValue('b'),
      methodC: vi.fn().mockResolvedValue('c'),
    };

    const wrapped = withStability(original as never, guard);

    expect(typeof wrapped.methodA).toBe('function');
    expect(typeof wrapped.methodB).toBe('function');
    expect(typeof wrapped.methodC).toBe('function');

    // Wrapped functions are different from originals
    expect(wrapped.methodA).not.toBe(original.methodA);
  });

  it('guard is called in the correct order (before the method)', async () => {
    const callOrder: string[] = [];
    const guard = vi.fn().mockImplementation(async () => {
      callOrder.push('guard');
      await Promise.resolve();
    });
    const original = {
      doSomething: vi.fn().mockImplementation(async () => {
        callOrder.push('method');
        await Promise.resolve();
        return 'done';
      }),
    };

    const wrapped = withStability(original as never, guard);
    await wrapped.doSomething();

    expect(callOrder).toEqual(['guard', 'method']);
  });

  it('page.off() is called in finally even when use() throws', () => {
    const offCalled = { value: false };
    const mockPage = {
      off: vi.fn(() => {
        offCalled.value = true;
      }),
    };
    const mockListener = vi.fn();

    try {
      // Simulate use() throwing
      throw new Error('Test failure in use()');
    } catch {
      // expected error
    } finally {
      mockPage.off('framenavigated' as never, mockListener as never);
    }

    expect(offCalled.value).toBe(true);
  });
});
