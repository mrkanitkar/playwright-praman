/**
 * Tests for `src/fixtures/shell-footer-fixtures.ts` — Playwright shell & footer fixtures.
 *
 * @remarks
 * Validates that the shellFooterTest fixture definitions correctly create
 * ShellHandler and FooterHandler instances with the page dependency.
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

// ── Mock handlers ───────────────────────────────────────────────────

const mockShellHandler = vi.fn().mockImplementation(function mockShell(
  this: Record<string, unknown>,
  options: { readonly page: unknown },
) {
  this['page'] = options.page;
  this['expectShellHeader'] = vi.fn();
  this['clickHome'] = vi.fn();
});

const mockFooterHandler = vi.fn().mockImplementation(function mockFooter(
  this: Record<string, unknown>,
  options: { readonly page: unknown },
) {
  this['page'] = options.page;
  this['clickSave'] = vi.fn();
});

vi.mock('../../../src/fixtures/shell-handler.js', () => ({
  ShellHandler: mockShellHandler,
}));

vi.mock('../../../src/fixtures/footer-handler.js', () => ({
  FooterHandler: mockFooterHandler,
}));

// ── Import after mocks ─────────────────────────────────────────────

const { shellFooterTest } = await import('#fixtures/shell-footer-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

const fixtures = (shellFooterTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
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

describe('shell-footer-fixtures declarations', () => {
  it('exports shellFooterTest with ui5Shell fixture', () => {
    expect(fixtures).toHaveProperty('ui5Shell');
  });

  it('exports shellFooterTest with ui5Footer fixture', () => {
    expect(fixtures).toHaveProperty('ui5Footer');
  });
});

describe('shell-footer-fixtures ui5Shell fixture', () => {
  it('creates a ShellHandler with the page dependency', async () => {
    const mockPage = { goto: vi.fn() };
    const fn = extractFixtureFn(fixtures['ui5Shell']);

    const result = await runFixture(fn, { page: mockPage });

    expect(mockShellHandler).toHaveBeenCalledWith({ page: mockPage });
    expect(result).toBeDefined();
  });
});

describe('shell-footer-fixtures ui5Footer fixture', () => {
  it('creates a FooterHandler with the page dependency', async () => {
    const mockPage = { goto: vi.fn() };
    const fn = extractFixtureFn(fixtures['ui5Footer']);

    const result = await runFixture(fn, { page: mockPage });

    expect(mockFooterHandler).toHaveBeenCalledWith({ page: mockPage });
    expect(result).toBeDefined();
  });
});
