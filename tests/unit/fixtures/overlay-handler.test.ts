/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/overlay-handler.ts` — SAP overlay interruption handling.
 *
 * @remarks
 * Mock strategy: `vi.mock()` for logger, inline `vi.fn()` for page and locator.
 * These tests pin the behaviour the design review called for: detect-by-default,
 * dismissal only when explicitly asked for, bounded firing, and clean teardown.
 *
 * @module fixtures
 */

import type { Locator, Page } from '@playwright/test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const { OverlayHandler, BUILT_IN_OVERLAY_RULES } = await import('#fixtures/overlay-handler.js');

// ── Mocks ──────────────────────────────────────────────────────────────────

type RegisteredHandler = (locator: Locator) => Promise<void>;

type MockPage = Page & {
  addLocatorHandler: ReturnType<typeof vi.fn>;
  removeLocatorHandler: ReturnType<typeof vi.fn>;
  locator: ReturnType<typeof vi.fn>;
};

function createMockLocator(text = 'Session Expiring'): Locator {
  const loc = {
    first: vi.fn(),
    textContent: vi.fn().mockResolvedValue(text),
    click: vi.fn().mockResolvedValue(undefined),
    isVisible: vi.fn().mockResolvedValue(true),
  };
  loc.first.mockReturnValue(loc);
  return loc as unknown as Locator;
}

function createMockPage(): MockPage {
  const page = {
    addLocatorHandler: vi.fn().mockResolvedValue(undefined),
    removeLocatorHandler: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn().mockImplementation(() => createMockLocator()),
  };
  return page as unknown as MockPage;
}

/** Pulls the handler callback Playwright would invoke for the Nth registration. */
function handlerFor(page: MockPage, index = 0): RegisteredHandler {
  const call = page.addLocatorHandler.mock.calls[index] as unknown[];
  return call[1] as RegisteredHandler;
}

/** Pulls the options object passed alongside the Nth registration. */
function optionsFor(page: MockPage, index = 0): { times?: number; noWaitAfter?: boolean } {
  const call = page.addLocatorHandler.mock.calls[index] as unknown[] | undefined;
  return call?.[2] ?? {};
}

/** Dismiss stub typed to the rule signature. `vi.fn` satisfies the promise lint rules. */
type DismissFn = (overlay: Locator) => Promise<void>;

function noopDismiss(): DismissFn {
  return vi.fn<DismissFn>().mockResolvedValue(undefined);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('fixtures/overlay-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('registers the rule with Playwright', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });

      await handler.register({ name: 'cookie-consent', selector: '.myCookieBar' });

      expect(page.locator).toHaveBeenCalledWith('.myCookieBar');
      expect(page.addLocatorHandler).toHaveBeenCalledOnce();
    });

    it('caps how many times a rule may fire', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });

      await handler.register({ name: 'toast', selector: '.sapMMessageToast', times: 3 });

      expect(optionsFor(page).times).toBe(3);
    });

    it('applies a default firing cap when none is given', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });

      await handler.register({ name: 'toast', selector: '.sapMMessageToast' });

      expect(optionsFor(page).times).toBeGreaterThan(0);
    });

    it('rejects a duplicate rule name', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });

      await handler.register({ name: 'dup', selector: '.a' });

      await expect(handler.register({ name: 'dup', selector: '.b' })).rejects.toThrow(/dup/);
    });
  });

  // The review's R3: dismissing must never be the default, because a framework
  // that silently answers a dialog can turn a real failure into a false pass.
  describe('detect-only rules (default)', () => {
    it('does not click anything when no dismiss function is given', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({ name: 'unexpected-dialog', selector: '.sapMDialog' });

      const overlay = createMockLocator('Unsaved changes');
      await handlerFor(page)(overlay);

      expect(overlay.click).not.toHaveBeenCalled();
    });

    it('records the detection so it can be reported', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({ name: 'unexpected-dialog', selector: '.sapMDialog' });

      await handlerFor(page)(createMockLocator('Session Expiring'));

      expect(handler.detections).toHaveLength(1);
      expect(handler.detections[0]?.rule).toBe('unexpected-dialog');
      expect(handler.detections[0]?.dismissed).toBe(false);
    });

    it('captures the overlay text to turn a blocked action into a diagnosis', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({ name: 'unexpected-dialog', selector: '.sapMDialog' });

      await handlerFor(page)(createMockLocator('Session Expiring'));

      expect(handler.detections[0]?.text).toContain('Session Expiring');
    });

    it('does not wait for a detect-only overlay to disappear', async () => {
      // Nothing dismissed it, so waiting for it to hide would stall the action
      // until timeout and bury the diagnosis.
      const page = createMockPage();
      const handler = new OverlayHandler({ page });

      await handler.register({ name: 'unexpected-dialog', selector: '.sapMDialog' });

      expect(optionsFor(page).noWaitAfter).toBe(true);
    });
  });

  describe('dismissal rules (opt-in)', () => {
    it('runs the dismiss function when one is provided', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      const dismiss = vi.fn<DismissFn>().mockResolvedValue(undefined) as unknown as DismissFn;
      await handler.register({ name: 'cookie-consent', selector: '.cookie', dismiss });

      const overlay = createMockLocator('Accept cookies');
      await handlerFor(page)(overlay);

      expect(dismiss).toHaveBeenCalledWith(overlay);
    });

    it('marks the detection as dismissed', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({
        name: 'cookie-consent',
        selector: '.cookie',
        dismiss: noopDismiss(),
      });

      await handlerFor(page)(createMockLocator());

      expect(handler.detections[0]?.dismissed).toBe(true);
    });

    it('warns on every dismissal so it is visible in review, not silent', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({
        name: 'cookie-consent',
        selector: '.cookie',
        dismiss: noopDismiss(),
      });

      await handlerFor(page)(createMockLocator());

      expect(mockChildLogger.warn).toHaveBeenCalled();
    });

    it('waits for a dismissed overlay to disappear by default', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });

      await handler.register({ name: 'cookie', selector: '.cookie', dismiss: noopDismiss() });

      expect(optionsFor(page).noWaitAfter).toBe(false);
    });

    it('never lets a failing dismiss abort the test run', async () => {
      // The overlay handler is a convenience. If dismissal fails the action
      // should proceed and fail on its own terms, with the failure recorded.
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({
        name: 'flaky',
        selector: '.x',
        dismiss: vi.fn<DismissFn>().mockRejectedValue(new Error('element detached')),
      });

      await expect(handlerFor(page)(createMockLocator())).resolves.toBeUndefined();
      expect(handler.detections[0]?.dismissed).toBe(false);
      expect(handler.detections[0]?.error).toContain('element detached');
    });
  });

  describe('non-Error failures', () => {
    it('records a non-Error dismissal rejection as a string', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({
        name: 'odd',
        selector: '.o',
        dismiss: vi.fn<DismissFn>().mockRejectedValue('boom'),
      });

      await handlerFor(page)(createMockLocator());

      expect(handler.detections[0]?.dismissed).toBe(false);
      expect(handler.detections[0]?.error).toBe('boom');
    });
  });

  describe('dispose', () => {
    it('unregisters every rule', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({ name: 'a', selector: '.a' });
      await handler.register({ name: 'b', selector: '.b' });

      await handler.dispose();

      expect(page.removeLocatorHandler).toHaveBeenCalledTimes(2);
    });

    it('survives a non-Error rejection during removal', async () => {
      const page = createMockPage();
      page.removeLocatorHandler.mockRejectedValue('target closed');
      const handler = new OverlayHandler({ page });
      await handler.register({ name: 'a', selector: '.a' });

      await expect(handler.dispose()).resolves.toBeUndefined();
    });

    it('survives a page that has already closed', async () => {
      const page = createMockPage();
      page.removeLocatorHandler.mockRejectedValue(new Error('Target page closed'));
      const handler = new OverlayHandler({ page });
      await handler.register({ name: 'a', selector: '.a' });

      await expect(handler.dispose()).resolves.toBeUndefined();
    });
  });

  describe('registerAll', () => {
    it('registers every rule in the list', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });

      await handler.registerAll([
        { name: 'a', selector: '.a' },
        { name: 'b', selector: '.b' },
      ]);

      expect(page.addLocatorHandler).toHaveBeenCalledTimes(2);
    });

    it('registers the built-in rules', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });

      await handler.registerAll(BUILT_IN_OVERLAY_RULES);

      expect(page.addLocatorHandler).toHaveBeenCalledTimes(BUILT_IN_OVERLAY_RULES.length);
    });
  });

  describe('overlay text capture', () => {
    it('records empty text when the overlay detaches before it can be read', async () => {
      // Diagnosis is best-effort: a racing overlay must not break the handler.
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({ name: 'racing', selector: '.r' });

      const overlay = createMockLocator();
      (overlay.first as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('element is not attached to the DOM');
      });

      await handlerFor(page)(overlay);

      expect(handler.detections[0]?.text).toBe('');
    });

    it('truncates very long overlay text', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({ name: 'verbose', selector: '.v' });

      await handlerFor(page)(createMockLocator('x'.repeat(500)));

      expect(handler.detections[0]?.text.length).toBeLessThanOrEqual(200);
    });

    it('handles an overlay with no text at all', async () => {
      const page = createMockPage();
      const handler = new OverlayHandler({ page });
      await handler.register({ name: 'blank', selector: '.b' });

      const overlay = createMockLocator();
      (overlay.textContent as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await handlerFor(page)(overlay);

      expect(handler.detections[0]?.text).toBe('');
    });
  });

  // R2: busy/blocking state belongs to waitForUI5Stable. Registering a handler
  // for it too would put two independent wait mechanisms on every action.
  describe('built-in rules', () => {
    it('ships a detect-only rule for unexpected modal dialogs', () => {
      const dialogRule = BUILT_IN_OVERLAY_RULES.find((r) => r.selector.includes('sapMDialog'));

      expect(dialogRule).toBeDefined();
      expect(dialogRule?.dismiss).toBeUndefined();
    });

    it('does not target BusyIndicator or the block layer', () => {
      const selectors = BUILT_IN_OVERLAY_RULES.map((r) => r.selector).join(' ');

      expect(selectors).not.toContain('BusyIndicator');
      expect(selectors).not.toContain('BlockLayer');
    });

    it('dismisses nothing by default', () => {
      expect(BUILT_IN_OVERLAY_RULES.every((r) => r.dismiss === undefined)).toBe(true);
    });

    it('uses plain CSS, never the ui5= engine, to keep per-action cost low', () => {
      // Playwright evaluates every registered locator before every action; the
      // ui5= engine walks the whole control tree.
      expect(BUILT_IN_OVERLAY_RULES.every((r) => !r.selector.startsWith('ui5='))).toBe(true);
    });
  });
});
