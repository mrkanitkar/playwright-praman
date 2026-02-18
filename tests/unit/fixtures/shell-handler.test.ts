/**
 * Tests for `src/fixtures/shell-handler.ts` -- ShellHandler class.
 *
 * @remarks
 * Strict TDD RED phase: all 7 tests written before production code.
 * ShellHandler provides shell header operations for Fiori Launchpad:
 * verifying visibility, clicking home, opening user menu.
 *
 * Mock strategy: vi.mock() for logger module, vi.fn() for adapter/page.
 *
 * @module fixtures
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';
import { createMockBridgePage } from '../../helpers/mock-page.js';

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

// ── Import after mocks ─────────────────────────────────────────────────
const { ShellHandler } = await import('#fixtures/shell-handler.js');

// ── Tests ───────────────────────────────────────────────────────────────

describe('ShellHandler', () => {
  let adapter: ReturnType<typeof createMockBridgeAdapter>;
  let page: ReturnType<typeof createMockBridgePage>;
  let handler: InstanceType<typeof ShellHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = createMockBridgeAdapter();
    page = createMockBridgePage();

    handler = new ShellHandler({ adapter, page });
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

    it('waits for UI5 stability after clicking home', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.clickHome();

      expect(adapter.waitForUI5Stable).toHaveBeenCalledOnce();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 3: openUserMenu (tests 5-6)
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
