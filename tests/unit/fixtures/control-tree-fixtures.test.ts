/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for the control tree capture fixture.
 *
 * @remarks
 * Validates that the controlTreeCapture fixture is auto-enabled, respects
 * config, and handles errors gracefully.
 *
 * @module test-fixtures
 */

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
      '(function() { return { capturedAt: "2026-03-29T00:00:00Z", ui5Version: "1.120.0", totalControlCount: 5, roots: [], pageUrl: "http://localhost", truncated: false }; })()',
  ),
}));

vi.mock('#bridge/control-tree-types.js', () => ({
  CONTROL_TREE_ATTACHMENT_NAME: 'ui5-control-tree',
  CONTROL_TREE_CONTENT_TYPE: 'application/json',
}));

vi.mock('#core/config/index.js', () => ({
  loadConfig: vi.fn(),
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
await import('../../../src/fixtures/control-tree-fixtures.js');

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

function createMockPage(): { evaluate: ReturnType<typeof vi.fn> } {
  return {
    evaluate: vi.fn().mockResolvedValue({
      capturedAt: '2026-03-29T00:00:00Z',
      ui5Version: '1.120.0',
      totalControlCount: 5,
      roots: [],
      pageUrl: 'http://localhost',
      truncated: false,
    }),
  };
}

function createMockTestInfo(): {
  attach: ReturnType<typeof vi.fn>;
  outputDir: string;
  status: string;
} {
  return {
    attach: vi.fn().mockResolvedValue(undefined),
    outputDir: `${tmpdir()}/test-output`,
    status: 'failed',
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('controlTreeCapture fixture', () => {
  it('is registered as an auto fixture', () => {
    const options = getFixtureOptions('controlTreeCapture');
    expect(options.auto).toBe(true);
  });

  it('pramanConfig placeholder uses option + worker scope', () => {
    const options = getFixtureOptions('pramanConfig');
    expect(options.option).toBe(true);
    expect(options.scope).toBe('worker');
  });

  it('calls page.evaluate and testInfo.attach in teardown', async () => {
    const fixtureFn = getFixtureFn('controlTreeCapture');
    const page = createMockPage();
    const testInfo = createMockTestInfo();
    const pramanConfig = {};

    const use = vi.fn();

    // The fixture calls use(), then runs teardown code after
    await fixtureFn({ page, pramanConfig }, use, testInfo);

    // Verify use() was called (fixture setup completed)
    expect(use).toHaveBeenCalledOnce();

    // Verify page.evaluate was called (capture ran in teardown)
    expect(page.evaluate).toHaveBeenCalledOnce();

    // Verify testInfo.attach was called with correct args
    expect(testInfo.attach).toHaveBeenCalledOnce();
    expect(testInfo.attach).toHaveBeenCalledWith(
      'ui5-control-tree',
      expect.objectContaining({
        contentType: 'application/json',
      }),
    );
  });

  it('skips capture when config sets enabled: false', async () => {
    const fixtureFn = getFixtureFn('controlTreeCapture');
    const page = createMockPage();
    const testInfo = createMockTestInfo();
    const pramanConfig = { controlTreeCapture: { enabled: false } };

    const use = vi.fn();
    await fixtureFn({ page, pramanConfig }, use, testInfo);

    expect(use).toHaveBeenCalledOnce();
    expect(page.evaluate).not.toHaveBeenCalled();
    expect(testInfo.attach).not.toHaveBeenCalled();
  });

  it('proceeds with capture when config is undefined (default enabled)', async () => {
    const fixtureFn = getFixtureFn('controlTreeCapture');
    const page = createMockPage();
    const testInfo = createMockTestInfo();
    const pramanConfig = {};

    const use = vi.fn();
    await fixtureFn({ page, pramanConfig }, use, testInfo);

    expect(page.evaluate).toHaveBeenCalledOnce();
    expect(testInfo.attach).toHaveBeenCalledOnce();
  });

  it('handles page.evaluate throwing gracefully (page closed)', async () => {
    const fixtureFn = getFixtureFn('controlTreeCapture');
    const page = createMockPage();
    page.evaluate.mockRejectedValue(new Error('Execution context was destroyed'));
    const testInfo = createMockTestInfo();
    const pramanConfig = {};

    const use = vi.fn();

    // Should not throw
    await expect(fixtureFn({ page, pramanConfig }, use, testInfo)).resolves.toBeUndefined();

    expect(use).toHaveBeenCalledOnce();
    expect(testInfo.attach).not.toHaveBeenCalled();
  });

  it('skips attachment when page.evaluate returns null', async () => {
    const fixtureFn = getFixtureFn('controlTreeCapture');
    const page = createMockPage();
    page.evaluate.mockResolvedValue(null);
    const testInfo = createMockTestInfo();
    const pramanConfig = {};

    const use = vi.fn();
    await fixtureFn({ page, pramanConfig }, use, testInfo);

    expect(page.evaluate).toHaveBeenCalledOnce();
    expect(testInfo.attach).not.toHaveBeenCalled();
  });

  it('handles testInfo.attach throwing gracefully', async () => {
    const fixtureFn = getFixtureFn('controlTreeCapture');
    const page = createMockPage();
    const testInfo = createMockTestInfo();
    testInfo.attach.mockRejectedValue(new Error('Attach failed'));
    const pramanConfig = {};

    const use = vi.fn();

    // Should not throw
    await expect(fixtureFn({ page, pramanConfig }, use, testInfo)).resolves.toBeUndefined();
  });

  it('passes maxDepth and maxControls from config to script', async () => {
    const { createControlTreeScript } = await import('#bridge/browser-scripts/control-tree.js');
    const fixtureFn = getFixtureFn('controlTreeCapture');
    const page = createMockPage();
    const testInfo = createMockTestInfo();
    const pramanConfig = {
      controlTreeCapture: { enabled: true, maxDepth: 15, maxControls: 8000 },
    };

    const use = vi.fn();
    await fixtureFn({ page, pramanConfig }, use, testInfo);

    expect(createControlTreeScript).toHaveBeenCalledWith({
      maxDepth: 15,
      maxControls: 8000,
    });
  });
});
