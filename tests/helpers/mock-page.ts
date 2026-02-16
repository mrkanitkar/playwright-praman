/**
 * Mock Playwright Page factory for unit tests.
 *
 * @remarks
 * Creates a minimal mock of Playwright's `Page` interface.
 * Only stubs the methods used by Praman's bridge and fixtures.
 *
 * @example
 * ```typescript
 * import { createMockPage } from '../../helpers/mock-page.js';
 *
 * const page = createMockPage();
 * page.evaluate.mockResolvedValue({ success: true });
 * ```
 *
 * @module test-helpers
 */

import { vi } from 'vitest';

/** Minimal mock of Playwright's Page for unit testing. */
export interface MockPage {
  readonly evaluate: ReturnType<typeof vi.fn>;
  readonly goto: ReturnType<typeof vi.fn>;
  readonly url: ReturnType<typeof vi.fn>;
  readonly waitForFunction: ReturnType<typeof vi.fn>;
  readonly waitForSelector: ReturnType<typeof vi.fn>;
  readonly waitForLoadState: ReturnType<typeof vi.fn>;
  readonly locator: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock Playwright Page with vi.fn() stubs.
 *
 * @param overrides - Optional method overrides for specific test scenarios.
 * @returns MockPage with all methods stubbed to return undefined.
 *
 * @example
 * ```typescript
 * const page = createMockPage({
 *   evaluate: vi.fn().mockResolvedValue({ success: true, data: 'result' }),
 * });
 * ```
 */
export function createMockPage(overrides?: Partial<MockPage>): MockPage {
  return {
    evaluate: vi.fn(),
    goto: vi.fn(),
    url: vi.fn().mockReturnValue('https://sap.example.com'),
    waitForFunction: vi.fn(),
    waitForSelector: vi.fn(),
    waitForLoadState: vi.fn(),
    locator: vi.fn(),
    ...overrides,
  };
}
