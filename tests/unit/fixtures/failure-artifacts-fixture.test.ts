/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for the failure artifacts capture fixture.
 *
 * @remarks
 * Validates that the failureArtifactsCapture fixture:
 * - Captures screenshot + control tree + page context on test failure
 * - Handles capture errors gracefully (no secondary failures)
 * - Respects the `captureFailureArtifacts` config flag
 *
 * @module test-fixtures
 */

import { Buffer } from 'node:buffer';
import { tmpdir } from 'node:os';

import { describe, expect, it, vi } from 'vitest';

// ── Mock @playwright/test ────────────────────────────────────────────────────

// Capture fixture definitions when test.extend() is called
let capturedFixtureDefs: Record<string, unknown> = {};

vi.mock('@playwright/test', () => ({
  test: {
    extend: vi.fn((defs: Record<string, unknown>) => {
      capturedFixtureDefs = defs;
      return { extend: vi.fn() };
    }),
  },
}));

// ── Mock dependencies ────────────────────────────────────────────────────────

vi.mock('#bridge/browser-scripts/control-tree.js', () => ({
  createControlTreeScript: vi.fn(
    () =>
      '(function() { return { capturedAt: "2026-04-06T00:00:00Z", ui5Version: "1.120.0", totalControlCount: 5, roots: [], pageUrl: "http://localhost", truncated: false }; })()',
  ),
}));

vi.mock('#core/logging/index.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// ── Import after mocks ──────────────────────────────────────────────────────

// Trigger the module-level test.extend() call
await import('../../../src/fixtures/failure-artifacts-fixture.js');

// ── Helpers ─────────────────────────────────────────────────────────────────

type FixtureFn = (...args: unknown[]) => Promise<void>;
interface FixtureOptions {
  auto?: boolean;
  option?: boolean;
  scope?: string;
}

function getFixtureFn(name: string): FixtureFn {
  const def = capturedFixtureDefs[name];
  if (Array.isArray(def)) {
    return def[0] as FixtureFn;
  }
  throw new Error(`Fixture "${name}" not found or not a tuple`);
}

function getFixtureOptions(name: string): FixtureOptions {
  const def = capturedFixtureDefs[name];
  if (Array.isArray(def)) {
    return def[1] as FixtureOptions;
  }
  throw new Error(`Fixture "${name}" not found or not a tuple`);
}

function createMockPage(): {
  screenshot: ReturnType<typeof vi.fn>;
  evaluate: ReturnType<typeof vi.fn>;
  url: ReturnType<typeof vi.fn>;
  title: ReturnType<typeof vi.fn>;
} {
  return {
    screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-png-data')),
    evaluate: vi.fn().mockResolvedValue({
      capturedAt: '2026-04-06T00:00:00Z',
      ui5Version: '1.120.0',
      totalControlCount: 5,
      roots: [],
      pageUrl: 'http://localhost',
      truncated: false,
    }),
    url: vi.fn().mockReturnValue('https://sap.example.com/fiori#PurchaseOrder-manage'),
    title: vi.fn().mockReturnValue('Manage Purchase Orders'),
  };
}

function createMockTestInfo(overrides?: { status?: string; expectedStatus?: string }): {
  attach: ReturnType<typeof vi.fn>;
  outputDir: string;
  status: string;
  expectedStatus: string;
} {
  return {
    attach: vi.fn().mockResolvedValue(undefined),
    outputDir: `${tmpdir()}/test-output`,
    status: overrides?.status ?? 'failed',
    expectedStatus: overrides?.expectedStatus ?? 'passed',
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('failureArtifactsCapture fixture', () => {
  it('is registered as an auto fixture', () => {
    const options = getFixtureOptions('failureArtifactsCapture');
    expect(options.auto).toBe(true);
  });

  it('pramanConfig placeholder uses option + worker scope', () => {
    const options = getFixtureOptions('pramanConfig');
    expect(options.option).toBe(true);
    expect(options.scope).toBe('worker');
  });

  it('captures screenshot and control tree on test failure', async () => {
    const fixtureFn = getFixtureFn('failureArtifactsCapture');
    const page = createMockPage();
    const testInfo = createMockTestInfo({ status: 'failed', expectedStatus: 'passed' });
    const pramanConfig = { captureFailureArtifacts: true };

    const use = vi.fn();
    await fixtureFn({ page, pramanConfig }, use, testInfo);

    // Verify use() was called
    expect(use).toHaveBeenCalledOnce();

    // Verify screenshot was captured
    expect(page.screenshot).toHaveBeenCalledOnce();

    // Verify testInfo.attach was called for screenshot (image/png)
    expect(testInfo.attach).toHaveBeenCalledWith(
      'failure-screenshot',
      expect.objectContaining({ contentType: 'image/png' }),
    );

    // Verify testInfo.attach was called for control tree (application/json)
    expect(testInfo.attach).toHaveBeenCalledWith(
      'failure-control-tree',
      expect.objectContaining({ contentType: 'application/json' }),
    );

    // Verify testInfo.attach was called for page context (application/json)
    expect(testInfo.attach).toHaveBeenCalledWith(
      'failure-context',
      expect.objectContaining({ contentType: 'application/json' }),
    );

    // 3 attachments total: screenshot + control tree + context
    expect(testInfo.attach).toHaveBeenCalledTimes(3);
  });

  it('handles screenshot capture failure gracefully (no secondary error)', async () => {
    const fixtureFn = getFixtureFn('failureArtifactsCapture');
    const page = createMockPage();
    page.screenshot.mockRejectedValue(new Error('Page was closed'));
    const testInfo = createMockTestInfo({ status: 'failed', expectedStatus: 'passed' });
    const pramanConfig = { captureFailureArtifacts: true };

    const use = vi.fn();

    // Should NOT throw — capture failures are swallowed
    await expect(fixtureFn({ page, pramanConfig }, use, testInfo)).resolves.toBeUndefined();

    expect(use).toHaveBeenCalledOnce();
  });

  it('handles control tree capture failure gracefully', async () => {
    const fixtureFn = getFixtureFn('failureArtifactsCapture');
    const page = createMockPage();
    page.evaluate.mockRejectedValue(new Error('Execution context was destroyed'));
    const testInfo = createMockTestInfo({ status: 'failed', expectedStatus: 'passed' });
    const pramanConfig = { captureFailureArtifacts: true };

    const use = vi.fn();

    // Should NOT throw
    await expect(fixtureFn({ page, pramanConfig }, use, testInfo)).resolves.toBeUndefined();

    expect(use).toHaveBeenCalledOnce();
    // Screenshot should still be attempted
    expect(page.screenshot).toHaveBeenCalledOnce();
  });

  it('skips capture when captureFailureArtifacts is false', async () => {
    const fixtureFn = getFixtureFn('failureArtifactsCapture');
    const page = createMockPage();
    const testInfo = createMockTestInfo({ status: 'failed', expectedStatus: 'passed' });
    const pramanConfig = { captureFailureArtifacts: false };

    const use = vi.fn();
    await fixtureFn({ page, pramanConfig }, use, testInfo);

    expect(use).toHaveBeenCalledOnce();
    expect(page.screenshot).not.toHaveBeenCalled();
    expect(page.evaluate).not.toHaveBeenCalled();
    expect(testInfo.attach).not.toHaveBeenCalled();
  });

  it('skips capture when test passes (status matches expectedStatus)', async () => {
    const fixtureFn = getFixtureFn('failureArtifactsCapture');
    const page = createMockPage();
    const testInfo = createMockTestInfo({ status: 'passed', expectedStatus: 'passed' });
    const pramanConfig = { captureFailureArtifacts: true };

    const use = vi.fn();
    await fixtureFn({ page, pramanConfig }, use, testInfo);

    expect(use).toHaveBeenCalledOnce();
    expect(page.screenshot).not.toHaveBeenCalled();
    expect(testInfo.attach).not.toHaveBeenCalled();
  });

  it('captures artifacts when config is default (captureFailureArtifacts undefined)', async () => {
    const fixtureFn = getFixtureFn('failureArtifactsCapture');
    const page = createMockPage();
    const testInfo = createMockTestInfo({ status: 'failed', expectedStatus: 'passed' });
    const pramanConfig = {};

    const use = vi.fn();
    await fixtureFn({ page, pramanConfig }, use, testInfo);

    expect(use).toHaveBeenCalledOnce();
    // Default is true — should capture
    expect(page.screenshot).toHaveBeenCalledOnce();
    expect(testInfo.attach).toHaveBeenCalled();
  });

  it('skips control tree attachment when page.evaluate returns null', async () => {
    const fixtureFn = getFixtureFn('failureArtifactsCapture');
    const page = createMockPage();
    page.evaluate.mockResolvedValue(null);
    const testInfo = createMockTestInfo({ status: 'failed', expectedStatus: 'passed' });
    const pramanConfig = { captureFailureArtifacts: true };

    const use = vi.fn();
    await fixtureFn({ page, pramanConfig }, use, testInfo);

    // Screenshot should still be attached
    expect(testInfo.attach).toHaveBeenCalledWith(
      'failure-screenshot',
      expect.objectContaining({ contentType: 'image/png' }),
    );

    // Control tree should NOT be attached (null result)
    expect(testInfo.attach).not.toHaveBeenCalledWith('failure-control-tree', expect.anything());

    // Page context should still be attached
    expect(testInfo.attach).toHaveBeenCalledWith(
      'failure-context',
      expect.objectContaining({ contentType: 'application/json' }),
    );
  });
});
