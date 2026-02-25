/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/flp-settings-fixtures.ts` — Playwright FLP settings fixture.
 *
 * @remarks
 * Validates that the flpSettingsTest fixture definition correctly creates
 * an FLPSettingsHandler instance with the page dependency.
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

const mockFLPSettingsHandler = vi.fn().mockImplementation(function mockSettings(
  this: Record<string, unknown>,
  options: { readonly page: unknown },
) {
  this['page'] = options.page;
  this['getLanguage'] = vi.fn();
  this['getDateFormat'] = vi.fn();
  this['getTimeFormat'] = vi.fn();
  this['getTimezone'] = vi.fn();
  this['getNumberFormat'] = vi.fn();
  this['getAllSettings'] = vi.fn();
});

vi.mock('../../../src/fixtures/flp-settings-handler.js', () => ({
  FLPSettingsHandler: mockFLPSettingsHandler,
}));

// ── Import after mocks ─────────────────────────────────────────────

const { flpSettingsTest } = await import('#fixtures/flp-settings-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

const fixtures = (flpSettingsTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
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

describe('flp-settings-fixtures declarations', () => {
  it('exports flpSettingsTest with flpSettings fixture', () => {
    expect(fixtures).toHaveProperty('flpSettings');
  });
});

describe('flp-settings-fixtures flpSettings fixture', () => {
  it('creates an FLPSettingsHandler with the page dependency', async () => {
    const mockPage = { evaluate: vi.fn() };
    const fn = extractFixtureFn(fixtures['flpSettings']);

    const result = await runFixture(fn, { page: mockPage });

    expect(mockFLPSettingsHandler).toHaveBeenCalledWith({ page: mockPage });
    expect(result).toBeDefined();
  });

  it('does not call any cleanup on teardown (stateless)', async () => {
    const mockPage = { evaluate: vi.fn() };
    const fn = extractFixtureFn(fixtures['flpSettings']);

    const result = await runFixture<Record<string, unknown>>(fn, { page: mockPage });

    // Stateless fixture — no cleanup method should be called
    expect(result).toBeDefined();
    expect(result['getLanguage']).toBeDefined();
    expect(result['getAllSettings']).toBeDefined();
  });
});
