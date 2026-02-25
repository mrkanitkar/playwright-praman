/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/flp-locks-fixtures.ts` — Playwright FLP locks fixture.
 *
 * @remarks
 * Validates that the flpLocksTest fixture definition correctly creates
 * an FLPLocksHandler instance with the page dependency and calls cleanup()
 * during teardown.
 *
 * @module fixtures
 */

import { describe, expect, it, vi } from 'vitest';

import { createMockTestExtend } from '../../helpers/mock-playwright-test.js';

// ── Mock Playwright ─────────────────────────────────────────────────

const mockTestExtend = createMockTestExtend();

vi.mock('@playwright/test', () => ({
  test: {
    extend: mockTestExtend,
  },
}));

// ── Mock handler ────────────────────────────────────────────────────

const mockCleanup = vi.fn().mockResolvedValue(undefined);

const mockFLPLocksHandler = vi.fn().mockImplementation(function mockLocks(
  this: Record<string, unknown>,
  options: { readonly page: unknown },
) {
  this['page'] = options.page;
  this['getLockEntries'] = vi.fn();
  this['deleteAllLockEntries'] = vi.fn();
  this['getNumberOfLockEntries'] = vi.fn();
  this['cleanup'] = mockCleanup;
});

vi.mock('../../../src/fixtures/flp-locks-handler.js', () => ({
  FLPLocksHandler: mockFLPLocksHandler,
}));

// ── Import after mocks ─────────────────────────────────────────────

const { flpLocksTest } = await import('#fixtures/flp-locks-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

const fixtures = (flpLocksTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

function extractFixtureFn(definition: unknown): (...args: unknown[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: unknown[]) => Promise<void>;
  }
  return definition as (...args: unknown[]) => Promise<void>;
}

async function runFixture<T>(
  fn: (deps: Record<string, unknown>, use: (value: T) => Promise<void>) => Promise<void>,
  deps: Record<string, unknown>,
): Promise<T> {
  let captured: T | undefined;
  const useFn = async (value: T): Promise<void> => {
    captured = value;
    await Promise.resolve();
  };
  await fn(deps, useFn);
  return captured as T;
}

// ── Tests ───────────────────────────────────────────────────────────

describe('flp-locks-fixtures declarations', () => {
  it('exports flpLocksTest with flpLocks fixture', () => {
    expect(fixtures).toHaveProperty('flpLocks');
  });
});

describe('flp-locks-fixtures flpLocks fixture', () => {
  it('creates an FLPLocksHandler with the page dependency', async () => {
    const mockPage = { request: { get: vi.fn(), delete: vi.fn(), head: vi.fn() } };
    const fn = extractFixtureFn(fixtures['flpLocks']);

    const result = await runFixture(fn, { page: mockPage });

    expect(mockFLPLocksHandler).toHaveBeenCalledWith({ page: mockPage });
    expect(result).toBeDefined();
  });

  it('calls cleanup() on teardown to release tracked locks', async () => {
    const mockPage = { request: { get: vi.fn(), delete: vi.fn(), head: vi.fn() } };
    const fn = extractFixtureFn(fixtures['flpLocks']);

    mockCleanup.mockClear();

    const result = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

    // Teardown should have called cleanup()
    expect(result).toBeDefined();
    expect(result['cleanup']).toBeDefined();
    expect(mockCleanup).toHaveBeenCalledOnce();
  });

  it('includes all expected handler methods', async () => {
    const mockPage = { request: { get: vi.fn(), delete: vi.fn(), head: vi.fn() } };
    const fn = extractFixtureFn(fixtures['flpLocks']);

    const result = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

    expect(result['getLockEntries']).toBeDefined();
    expect(result['deleteAllLockEntries']).toBeDefined();
    expect(result['getNumberOfLockEntries']).toBeDefined();
    expect(result['cleanup']).toBeDefined();
  });
});
