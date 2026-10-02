/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/clock-fixtures.ts` — deterministic time control.
 *
 * @remarks
 * Pins the design review's R7: the clock must never install itself. SAP session
 * tokens, SAML assertions and CSRF tokens all carry validity windows, so a
 * globally installed fake clock could invalidate a session mid-test or mask a
 * genuine expiry bug.
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockTestExtend } from '../../helpers/mock-playwright-test.js';

const mockChildLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
vi.mock('#core/logging/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue(mockChildLogger),
}));

const mockHasFeature = vi.fn().mockReturnValue(true);
vi.mock('#core/compat/playwright-compat.js', () => ({
  hasFeature: mockHasFeature,
}));

vi.mock('@playwright/test', () => ({
  test: { extend: createMockTestExtend() },
}));

const { Ui5Clock } = await import('#fixtures/clock-handler.js');
const { clockTest } = await import('#fixtures/clock-fixtures.js');

const clockFixtures = (clockTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Mocks ──────────────────────────────────────────────────────────────────

type MockPage = Page & { clock: Record<string, ReturnType<typeof vi.fn>> };

function createMockPage(): MockPage {
  return {
    clock: {
      install: vi.fn().mockResolvedValue(undefined),
      setFixedTime: vi.fn().mockResolvedValue(undefined),
      fastForward: vi.fn().mockResolvedValue(undefined),
      pauseAt: vi.fn().mockResolvedValue(undefined),
      resume: vi.fn().mockResolvedValue(undefined),
      runFor: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as MockPage;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('fixtures/clock-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasFeature.mockReturnValue(true);
  });

  // R7: opt-in only.
  describe('install (opt-in)', () => {
    it('does not touch the clock until install is called', () => {
      const page = createMockPage();

      const clock = new Ui5Clock({ page });

      expect(clock.installed).toBe(false);
      expect(page.clock.install).not.toHaveBeenCalled();
    });

    it('installs at a given time', async () => {
      const page = createMockPage();
      const clock = new Ui5Clock({ page });

      await clock.install('2026-03-31T12:00:00Z');

      expect(page.clock.install).toHaveBeenCalledWith({ time: '2026-03-31T12:00:00Z' });
    });

    it('installs without a time when none is given', async () => {
      const page = createMockPage();
      const clock = new Ui5Clock({ page });

      await clock.install();

      expect(page.clock.install).toHaveBeenCalledWith({});
    });

    it('warns that SAP session validity is time-sensitive', async () => {
      const page = createMockPage();
      const clock = new Ui5Clock({ page });

      await clock.install('2026-03-31T12:00:00Z');

      expect(mockChildLogger.warn).toHaveBeenCalled();
    });

    it('reports whether it has been installed', async () => {
      const page = createMockPage();
      const clock = new Ui5Clock({ page });

      expect(clock.installed).toBe(false);
      await clock.install();
      expect(clock.installed).toBe(true);
    });
  });

  describe('time control', () => {
    it('sets a fixed time', async () => {
      const page = createMockPage();
      const clock = new Ui5Clock({ page });
      await clock.install();

      await clock.setFixedTime('2026-12-31T23:59:00Z');

      expect(page.clock.setFixedTime).toHaveBeenCalledWith('2026-12-31T23:59:00Z');
    });

    it('fast-forwards', async () => {
      const page = createMockPage();
      const clock = new Ui5Clock({ page });
      await clock.install();

      await clock.fastForward('30:00');

      expect(page.clock.fastForward).toHaveBeenCalledWith('30:00');
    });

    it('pauses at a time', async () => {
      const page = createMockPage();
      const clock = new Ui5Clock({ page });
      await clock.install();

      await clock.pauseAt('2026-06-30T00:00:00Z');

      expect(page.clock.pauseAt).toHaveBeenCalledWith('2026-06-30T00:00:00Z');
    });

    it('resumes', async () => {
      const page = createMockPage();
      const clock = new Ui5Clock({ page });
      await clock.install();

      await clock.resume();

      expect(page.clock.resume).toHaveBeenCalledOnce();
    });
  });

  // Using the clock before installing silently does nothing in Playwright,
  // which is a confusing way to lose an afternoon.
  describe('guards', () => {
    it('throws when controlling time before install', async () => {
      const clock = new Ui5Clock({ page: createMockPage() });

      await expect(clock.fastForward('10:00')).rejects.toThrow(/install/i);
    });

    it('throws a compat error when Playwright is too old', async () => {
      mockHasFeature.mockReturnValue(false);
      const clock = new Ui5Clock({ page: createMockPage() });

      await expect(clock.install()).rejects.toThrow(/1\.45/);
    });

    it('names the required feature in the compat error details', async () => {
      mockHasFeature.mockReturnValue(false);
      const clock = new Ui5Clock({ page: createMockPage() });

      await expect(clock.install()).rejects.toMatchObject({
        details: { feature: 'hasClockAPI' },
      });
    });
  });
});

// ── Fixture wiring ─────────────────────────────────────────────────────────

describe('fixtures/clock-fixtures', () => {
  it('exports clockTest with a ui5Clock fixture', () => {
    expect(clockFixtures).toHaveProperty('ui5Clock');
  });

  it('provides a Ui5Clock built on the page', async () => {
    const page = createMockPage();
    const fn = clockFixtures['ui5Clock'] as (
      deps: Record<string, unknown>,
      use: (v: unknown) => Promise<void>,
    ) => Promise<void>;

    let captured: unknown;
    await fn({ page }, async (value) => {
      captured = value;
      await Promise.resolve();
    });

    expect(captured).toBeInstanceOf(Ui5Clock);
  });

  // R7: the fixture must not install the clock for every test.
  it('does not install the clock just by being used', async () => {
    const page = createMockPage();
    const fn = clockFixtures['ui5Clock'] as (
      deps: Record<string, unknown>,
      use: (v: unknown) => Promise<void>,
    ) => Promise<void>;

    await fn({ page }, async () => Promise.resolve());

    expect(page.clock.install).not.toHaveBeenCalled();
  });
});
