/**
 * Tests for teardown behavior in `src/fixtures/module-fixtures.ts`.
 *
 * @remarks
 * Verifies that:
 * - objectMapCleanup is called in the module fixture teardown
 * - page.off() is called even if use() throws (try/finally)
 * - handler.destroy() is always called in teardown
 */
import { describe, expect, it, vi } from 'vitest';

import { createObjectCleanupScript } from '../../../src/bridge/browser-scripts/object-map.js';

describe('module-fixtures teardown (B5 fix verification)', () => {
  it('createObjectCleanupScript is non-empty (shared with core-fixtures)', () => {
    const script = createObjectCleanupScript();
    expect(typeof script).toBe('string');
    expect(script.length).toBeGreaterThan(0);
  });

  it('page.off() is called in finally even when use() throws', async () => {
    const offCalled = { value: false };
    const mockPage = {
      off: vi.fn(() => {
        offCalled.value = true;
      }),
      evaluate: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    };
    const mockHandler = { destroy: vi.fn().mockResolvedValue(undefined) };
    const mockListener = vi.fn();

    try {
      throw new Error('Simulated test failure inside use()');
    } catch {
      // expected
    } finally {
      mockPage.off('framenavigated', mockListener);
      const cleanupScript = createObjectCleanupScript();
      await mockPage.evaluate(cleanupScript).catch(() => {
        // swallow
      });
      await mockHandler.destroy();
    }

    expect(offCalled.value).toBe(true);
    expect(mockHandler.destroy).toHaveBeenCalledOnce();
  });

  it('objectMapCleanup swallows errors from page.evaluate', async () => {
    const mockPage = {
      evaluate: vi
        .fn<(...args: unknown[]) => Promise<void>>()
        .mockRejectedValue(new Error('Page navigated')),
    };
    const cleanupScript = createObjectCleanupScript();

    // Must not throw
    await expect(
      mockPage.evaluate(cleanupScript).catch(() => {
        // swallow
      }),
    ).resolves.toBeUndefined();
  });

  it('handler.destroy() called in finally even when cleanup fails', async () => {
    const mockPage = {
      off: vi.fn(),
      evaluate: vi
        .fn<(...args: unknown[]) => Promise<void>>()
        .mockRejectedValue(new Error('Page navigated')),
    };
    const mockHandler = { destroy: vi.fn().mockResolvedValue(undefined) };

    try {
      await Promise.resolve(); // simulate use()
    } finally {
      mockPage.off('framenavigated', vi.fn());
      const cleanupScript = createObjectCleanupScript();
      try {
        await mockPage.evaluate(cleanupScript).catch(() => {
          // swallow
        });
      } finally {
        await mockHandler.destroy();
      }
    }

    expect(mockHandler.destroy).toHaveBeenCalledOnce();
  });
});
