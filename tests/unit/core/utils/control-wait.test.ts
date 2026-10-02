/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/utils/control-wait.ts` — per-control wait predicates.
 *
 * @remarks
 * Pins the design review's R6 policy: a feature with a working equivalent on the
 * floor degrades transparently rather than throwing. `locator.waitForFunction`
 * is 1.62-only, but `page.waitForFunction` can express the same predicate, so
 * below 1.62 this must keep working rather than fail.
 *
 * @module core/utils
 */

import type { Locator, Page } from '@playwright/test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockChildLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
vi.mock('#core/logging/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue(mockChildLogger),
}));

const mockHasFeature = vi.fn().mockReturnValue(true);
vi.mock('#core/compat/playwright-compat.js', () => ({
  hasFeature: mockHasFeature,
}));

const { waitForControlState } = await import('#core/utils/control-wait.js');

// ── Mocks ──────────────────────────────────────────────────────────────────

interface MockLocator {
  waitForFunction?: ReturnType<typeof vi.fn>;
  page: ReturnType<typeof vi.fn>;
  evaluate: ReturnType<typeof vi.fn>;
}

function createMockPage(): Page & { waitForFunction: ReturnType<typeof vi.fn> } {
  return {
    waitForFunction: vi.fn().mockResolvedValue(undefined),
  } as unknown as Page & { waitForFunction: ReturnType<typeof vi.fn> };
}

function createMockLocator(
  page: Page,
  options: { withWaitForFunction?: boolean; controlId?: string } = {},
): Locator & MockLocator {
  const loc: MockLocator = {
    page: vi.fn().mockReturnValue(page),
    evaluate: vi.fn().mockResolvedValue(options.controlId ?? '__button0'),
  };
  if (options.withWaitForFunction !== false) {
    loc.waitForFunction = vi.fn().mockResolvedValue(undefined);
  }
  return loc as unknown as Locator & MockLocator;
}

const PREDICATE = (el: Element): boolean => el.getAttribute('data-ready') === 'true';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('core/utils/control-wait', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasFeature.mockReturnValue(true);
  });

  describe('on Playwright 1.62+', () => {
    it('uses the element-scoped locator.waitForFunction', async () => {
      const page = createMockPage();
      const locator = createMockLocator(page);

      await waitForControlState(locator, PREDICATE);

      expect(locator.waitForFunction).toHaveBeenCalled();
      expect(page.waitForFunction).not.toHaveBeenCalled();
    });

    it('passes the timeout through', async () => {
      const page = createMockPage();
      const locator = createMockLocator(page);

      await waitForControlState(locator, PREDICATE, { timeout: 1234 });

      expect(locator.waitForFunction).toHaveBeenCalledWith(
        expect.anything(),
        undefined,
        expect.objectContaining({ timeout: 1234 }),
      );
    });

    it('records which path it took', async () => {
      const page = createMockPage();
      const locator = createMockLocator(page);

      const result = await waitForControlState(locator, PREDICATE);

      expect(result.strategy).toBe('locator');
    });
  });

  // R6: an equivalent exists on the floor, so this degrades instead of throwing.
  describe('below 1.62', () => {
    beforeEach(() => {
      mockHasFeature.mockReturnValue(false);
    });

    it('falls back to page.waitForFunction rather than throwing', async () => {
      const page = createMockPage();
      const locator = createMockLocator(page);

      const result = await waitForControlState(locator, PREDICATE);

      expect(page.waitForFunction).toHaveBeenCalled();
      expect(result.strategy).toBe('page');
    });

    it('does not call the 1.62 API even when present', async () => {
      const page = createMockPage();
      const locator = createMockLocator(page);

      await waitForControlState(locator, PREDICATE);

      expect(locator.waitForFunction).not.toHaveBeenCalled();
    });

    it('does not use new Function, which SAP strict CSP would block', async () => {
      const page = createMockPage();
      const locator = createMockLocator(page);

      await waitForControlState(locator, PREDICATE);

      const source = String(page.waitForFunction.mock.calls[0]?.[0]);
      expect(source).not.toContain('new Function');
      expect(source).toContain('data-ready');
    });

    it('logs at debug which path was taken, not at warn', async () => {
      // Degradation is expected and supported — it is not a problem to shout about.
      const page = createMockPage();
      const locator = createMockLocator(page);

      await waitForControlState(locator, PREDICATE);

      expect(mockChildLogger.debug).toHaveBeenCalled();
      expect(mockChildLogger.warn).not.toHaveBeenCalled();
    });

    it('resolves the control id so the predicate can find the element', async () => {
      const page = createMockPage();
      const locator = createMockLocator(page, { controlId: '__list5' });

      await waitForControlState(locator, PREDICATE);

      expect(locator.evaluate).toHaveBeenCalled();
      const [source] = page.waitForFunction.mock.calls[0] as [string];
      expect(source).toContain('getElementById');
      expect(source).toContain('__list5');
    });
  });

  // Defensive: the flag says 1.62 but the method is somehow absent.
  describe('when the flag and the runtime disagree', () => {
    it('falls back rather than crashing with a TypeError', async () => {
      mockHasFeature.mockReturnValue(true);
      const page = createMockPage();
      const locator = createMockLocator(page, { withWaitForFunction: false });

      const result = await waitForControlState(locator, PREDICATE);

      expect(result.strategy).toBe('page');
      expect(page.waitForFunction).toHaveBeenCalled();
    });
  });

  describe('timeouts', () => {
    it('wraps a locator-path timeout in a Praman TimeoutError', async () => {
      const page = createMockPage();
      const locator = createMockLocator(page);
      const waitFn = locator.waitForFunction as ReturnType<typeof vi.fn>;
      waitFn.mockRejectedValue(new Error('Timeout 5000ms exceeded'));

      await expect(waitForControlState(locator, PREDICATE)).rejects.toMatchObject({
        code: 'ERR_TIMEOUT_OPERATION',
      });
    });

    it('wraps a page-path timeout in a Praman TimeoutError', async () => {
      mockHasFeature.mockReturnValue(false);
      const page = createMockPage();
      page.waitForFunction.mockRejectedValue(new Error('Timeout 5000ms exceeded'));
      const locator = createMockLocator(page);

      await expect(waitForControlState(locator, PREDICATE)).rejects.toMatchObject({
        code: 'ERR_TIMEOUT_OPERATION',
      });
    });

    it('includes the predicate in the error details for diagnosis', async () => {
      const page = createMockPage();
      const locator = createMockLocator(page);
      const waitFn = locator.waitForFunction as ReturnType<typeof vi.fn>;
      waitFn.mockRejectedValue(new Error('Timeout 5000ms exceeded'));

      await expect(waitForControlState(locator, PREDICATE)).rejects.toMatchObject({
        details: expect.objectContaining({ strategy: 'locator' }) as unknown,
      });
    });
  });
});
