/**
 * Mock BrowserContext factory for unit tests.
 *
 * @remarks
 * Creates a minimal mock of Playwright's `BrowserContext` interface.
 * Only stubs the methods used by Praman's bridge layer.
 *
 * Note: W14 decision means `addInitScript()` is NOT used in production
 * (lazy-only injection via `page.evaluate()`), but the stub is included
 * for completeness and potential future testing needs.
 *
 * @example
 * ```typescript
 * import { createMockBrowserContext } from '../../helpers/mock-browser-context.js';
 *
 * const context = createMockBrowserContext();
 * context.addInitScript.mockResolvedValue(undefined);
 * ```
 *
 * @module test-helpers
 */

import { vi } from 'vitest';

/** Minimal mock of Playwright's BrowserContext for unit testing. */
export interface MockBrowserContext {
  readonly addInitScript: ReturnType<typeof vi.fn>;
  readonly newPage: ReturnType<typeof vi.fn>;
  readonly close: ReturnType<typeof vi.fn>;
  readonly pages: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock Playwright BrowserContext with vi.fn() stubs.
 *
 * @param overrides - Optional method overrides for specific test scenarios.
 * @returns MockBrowserContext with all methods stubbed.
 *
 * @example
 * ```typescript
 * const context = createMockBrowserContext({
 *   pages: vi.fn().mockReturnValue([mockPage]),
 * });
 * ```
 */
export function createMockBrowserContext(
  overrides?: Partial<MockBrowserContext>,
): MockBrowserContext {
  return {
    addInitScript: vi.fn().mockResolvedValue(undefined),
    newPage: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    pages: vi.fn().mockReturnValue([]),
    ...overrides,
  };
}
