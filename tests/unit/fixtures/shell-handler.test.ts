/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/shell-handler.ts` -- ShellHandler class.
 *
 * @remarks
 * ShellHandler provides shell header operations for Fiori Launchpad:
 * verifying visibility, clicking home, opening user menu.
 * Uses Playwright's Page directly (no adapter).
 *
 * Mock strategy: vi.mock() for logger and bridge modules, inline vi.fn() for page.
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NavigationError } from '#core/errors/navigation-error.js';

// ── Mock logger ────────────────────────────────────────────────────────
const mockChildLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockCreateLogger = vi.fn().mockReturnValue(mockChildLogger);

vi.mock('#core/logging/logger.js', () => ({
  createLogger: mockCreateLogger,
}));

// ── Mock bridge injection ──────────────────────────────────────────────
const mockEnsureBridgeInjected = vi.fn().mockResolvedValue(undefined);

vi.mock('#bridge/injection.js', () => ({
  ensureBridgeInjected: mockEnsureBridgeInjected,
}));

// ── Import after mocks ─────────────────────────────────────────────────
const { ShellHandler } = await import('#fixtures/shell-handler.js');

// ── Tests ───────────────────────────────────────────────────────────────

describe('ShellHandler', () => {
  let page: Page & {
    evaluate: ReturnType<typeof vi.fn>;
    waitForFunction: ReturnType<typeof vi.fn>;
  };
  let handler: InstanceType<typeof ShellHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    page = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
      mainFrame: vi.fn(),
    } as unknown as Page & {
      evaluate: ReturnType<typeof vi.fn>;
      waitForFunction: ReturnType<typeof vi.fn>;
    };

    handler = new ShellHandler({ page: page as unknown as Page });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 1: expectShellHeader (tests 1-2)
  // ═══════════════════════════════════════════════════════════════════════

  describe('expectShellHeader()', () => {
    it('does not throw when shell header is visible', async () => {
      page.evaluate.mockResolvedValue(true);

      await expect(handler.expectShellHeader()).resolves.toBeUndefined();

      expect(page.evaluate).toHaveBeenCalledOnce();
    });

    it('throws NavigationError when shell header is not visible', async () => {
      page.evaluate.mockResolvedValue(false);

      await expect(handler.expectShellHeader()).rejects.toThrow(NavigationError);

      try {
        await handler.expectShellHeader();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(NavigationError);
        const navError = error as NavigationError;
        expect(navError.code).toBe('ERR_NAV_ROUTE_FAILED');
        expect(navError.retryable).toBe(true);
        expect(navError.suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 2: clickHome (tests 3-4)
  // ═══════════════════════════════════════════════════════════════════════

  describe('clickHome()', () => {
    it('clicks the shell home button via page.evaluate', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.clickHome();

      expect(page.evaluate).toHaveBeenCalled();
    });

    it('waits for UI5 stability after clicking home via page.waitForFunction', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.clickHome();

      expect(page.waitForFunction).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 3: openNotifications (tests 5-6)
  // ═══════════════════════════════════════════════════════════════════════

  describe('openNotifications()', () => {
    it('opens notifications panel by clicking the notifications icon', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.openNotifications();

      expect(page.evaluate).toHaveBeenCalledOnce();
    });

    it('throws NavigationError when notifications icon is not found', async () => {
      page.evaluate.mockResolvedValue(false);

      await expect(handler.openNotifications()).rejects.toThrow(NavigationError);

      try {
        await handler.openNotifications();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(NavigationError);
        const navError = error as NavigationError;
        expect(navError.code).toBe('ERR_NAV_ROUTE_FAILED');
        expect(navError.suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 4: openUserMenu (tests 7-8)
  // ═══════════════════════════════════════════════════════════════════════

  describe('openUserMenu()', () => {
    it('opens the user menu by clicking the avatar button', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.openUserMenu();

      expect(page.evaluate).toHaveBeenCalledOnce();
    });

    it('throws NavigationError when user avatar is not found', async () => {
      page.evaluate.mockResolvedValue(false);

      await expect(handler.openUserMenu()).rejects.toThrow(NavigationError);

      try {
        await handler.openUserMenu();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(NavigationError);
        const navError = error as NavigationError;
        expect(navError.code).toBe('ERR_NAV_ROUTE_FAILED');
        expect(navError.suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 4: Logger (test 7)
  // ═══════════════════════════════════════════════════════════════════════

  describe('logging', () => {
    it('creates a child logger with module name "shell-handler"', () => {
      expect(mockCreateLogger).toHaveBeenCalledWith('shell-handler');
    });
  });
});
