/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/overlay-fixtures.ts` — the `overlays` Playwright fixture.
 *
 * @remarks
 * Covers the wiring the handler's own tests cannot reach: built-in registration
 * gated on config, report attachment, teardown, and the rule that fixture
 * plumbing must never fail a test on its own account.
 *
 * @module fixtures
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockTestExtend } from '../../helpers/mock-playwright-test.js';

// ── Mock Playwright ─────────────────────────────────────────────────

const mockTestExtend = createMockTestExtend();

vi.mock('@playwright/test', () => ({
  test: { extend: mockTestExtend },
}));

// ── Mock handler ────────────────────────────────────────────────────

const mockRegisterAll = vi.fn().mockResolvedValue(undefined);
const mockDispose = vi.fn().mockResolvedValue(undefined);
let mockDetections: unknown[] = [];

const mockOverlayHandler = vi.fn().mockImplementation(function mockHandler(
  this: Record<string, unknown>,
) {
  this['registerAll'] = mockRegisterAll;
  this['dispose'] = mockDispose;
  Object.defineProperty(this, 'detections', { get: () => mockDetections });
});

vi.mock('../../../src/fixtures/overlay-handler.js', () => ({
  OverlayHandler: mockOverlayHandler,
  BUILT_IN_OVERLAY_RULES: [{ name: 'unexpected-dialog', selector: '.sapMDialog' }],
}));

// ── Import after mocks ─────────────────────────────────────────────

const { overlayTest } = await import('#fixtures/overlay-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

const fixtures = (overlayTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

function extractFixtureFn(definition: unknown): (...args: unknown[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: unknown[]) => Promise<void>;
  }
  return definition as (...args: unknown[]) => Promise<void>;
}

interface MockTestInfo {
  attach: ReturnType<typeof vi.fn>;
}

function createTestInfo(): MockTestInfo {
  return { attach: vi.fn().mockResolvedValue(undefined) };
}

/** Runs the fixture through setup, body, and teardown. */
async function runOverlayFixture(
  deps: Record<string, unknown>,
  testInfo: MockTestInfo = createTestInfo(),
): Promise<unknown> {
  const fn = extractFixtureFn(fixtures['overlays']);
  let captured: unknown;
  const useFn = async (value: unknown): Promise<void> => {
    captured = value;
    await Promise.resolve();
  };
  await fn(deps, useFn, testInfo);
  return captured;
}

// ── Tests ───────────────────────────────────────────────────────────

describe('fixtures/overlay-fixtures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetections = [];
  });

  it('exports overlayTest with an overlays fixture', () => {
    expect(fixtures).toHaveProperty('overlays');
  });

  describe('built-in registration', () => {
    it('registers the built-in rules by default', async () => {
      await runOverlayFixture({ page: {}, pramanConfig: {} });

      expect(mockRegisterAll).toHaveBeenCalledOnce();
    });

    it('registers built-ins when overlays.enabled is true', async () => {
      await runOverlayFixture({ page: {}, pramanConfig: { overlays: { enabled: true } } });

      expect(mockRegisterAll).toHaveBeenCalledOnce();
    });

    it('skips registration when overlays.enabled is false', async () => {
      await runOverlayFixture({ page: {}, pramanConfig: { overlays: { enabled: false } } });

      expect(mockRegisterAll).not.toHaveBeenCalled();
    });

    it('never fails the test when registration throws', async () => {
      // Overlay handling is a convenience. A registration failure must not
      // take down a test that would otherwise pass.
      mockRegisterAll.mockRejectedValueOnce(new Error('page closed'));

      await expect(runOverlayFixture({ page: {}, pramanConfig: {} })).resolves.toBeDefined();
    });
  });

  describe('reporting', () => {
    it('attaches detections when overlays interrupted the test', async () => {
      mockDetections = [{ rule: 'unexpected-dialog', text: 'Session Expiring', dismissed: false }];
      const testInfo = createTestInfo();

      await runOverlayFixture({ page: {}, pramanConfig: {} }, testInfo);

      expect(testInfo.attach).toHaveBeenCalledWith(
        'overlay-detections',
        expect.objectContaining({ contentType: 'application/json' }),
      );
    });

    it('attaches nothing when no overlay interrupted the test', async () => {
      const testInfo = createTestInfo();

      await runOverlayFixture({ page: {}, pramanConfig: {} }, testInfo);

      expect(testInfo.attach).not.toHaveBeenCalled();
    });

    it('never fails the test when attachment throws', async () => {
      mockDetections = [{ rule: 'x', text: 'y', dismissed: false }];
      const testInfo = createTestInfo();
      testInfo.attach.mockRejectedValueOnce(new Error('report closed'));

      await expect(
        runOverlayFixture({ page: {}, pramanConfig: {} }, testInfo),
      ).resolves.toBeDefined();
    });
  });

  describe('teardown', () => {
    it('disposes the handler so registrations do not leak into the next test', async () => {
      await runOverlayFixture({ page: {}, pramanConfig: {} });

      expect(mockDispose).toHaveBeenCalledOnce();
    });

    it('disposes even when registration was skipped', async () => {
      await runOverlayFixture({ page: {}, pramanConfig: { overlays: { enabled: false } } });

      expect(mockDispose).toHaveBeenCalledOnce();
    });

    it('disposes even after an attachment failure', async () => {
      mockDetections = [{ rule: 'x', text: 'y', dismissed: false }];
      const testInfo = createTestInfo();
      testInfo.attach.mockRejectedValueOnce(new Error('report closed'));

      await runOverlayFixture({ page: {}, pramanConfig: {} }, testInfo);

      expect(mockDispose).toHaveBeenCalledOnce();
    });
  });
});
