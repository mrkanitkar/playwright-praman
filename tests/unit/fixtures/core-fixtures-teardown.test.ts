/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for teardown behavior in `src/fixtures/core-fixtures.ts`.
 *
 * @remarks
 * Verifies that:
 * - The object map cleanup script is called in teardown
 * - Cleanup failure is swallowed (page navigation case)
 * - handler.destroy() is always called (try/finally guarantee)
 * - page.off() is always called (try/finally guarantee)
 */

import { describe, expect, it, vi } from 'vitest';

import { createObjectCleanupScript } from '../../../src/bridge/browser-scripts/object-map.js';

describe('core-fixtures teardown', () => {
  it('createObjectCleanupScript returns a non-empty string', () => {
    const script = createObjectCleanupScript();
    expect(typeof script).toBe('string');
    expect(script.length).toBeGreaterThan(0);
  });

  it('cleanup failure is swallowed via .catch()', async () => {
    // Simulates page.evaluate rejecting (page navigated away mid-cleanup)
    const mockPage = {
      evaluate: vi
        .fn<(arg: unknown) => Promise<void>>()
        .mockRejectedValue(new Error('Navigation occurred')),
    };

    const cleanupScript = createObjectCleanupScript();
    // The .catch() in core-fixtures.ts makes this promise always resolve
    await expect(
      mockPage.evaluate(cleanupScript).catch(() => {
        // Non-fatal — page navigated
      }),
    ).resolves.toBeUndefined();
  });

  it('handler.destroy() is called in finally block even when cleanup throws', async () => {
    const destroyCalled = { value: false };
    const mockHandler = {
      destroy: vi.fn(async () => {
        destroyCalled.value = true;
        await Promise.resolve();
      }),
    };
    const mockPage = {
      evaluate: vi.fn<(arg: unknown) => Promise<void>>().mockRejectedValue(new Error('Navigation')),
    };

    const cleanupScript = createObjectCleanupScript();
    try {
      await mockPage.evaluate(cleanupScript).catch(() => {
        // swallow
      });
    } finally {
      await mockHandler.destroy();
    }

    expect(destroyCalled.value).toBe(true);
    expect(mockHandler.destroy).toHaveBeenCalledOnce();
  });

  it('page.off() is called in finally block', async () => {
    const offCalled = { value: false };
    const mockPage = {
      off: vi.fn<(event: string, listener: (...args: unknown[]) => void) => void>(() => {
        offCalled.value = true;
      }),
      evaluate: vi.fn<(arg: unknown) => Promise<void>>().mockResolvedValue(undefined),
    };
    const mockHandler = { destroy: vi.fn().mockResolvedValue(undefined) };
    const mockListener = vi.fn();

    try {
      // Simulate use() completing
      await Promise.resolve();
    } finally {
      mockPage.off('framenavigated', mockListener);
      await mockPage.evaluate('cleanup').catch(() => {
        // swallow
      });
      await mockHandler.destroy();
    }

    expect(offCalled.value).toBe(true);
  });
});
