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

import type { Mock } from 'vitest';
import { vi } from 'vitest';

import type { BridgePage } from '#bridge/adapter.js';

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
 * BridgePage-compatible mock with properly typed evaluate/waitForFunction.
 *
 * @remarks
 * Extends `BridgePage` so it can be passed directly to bridge functions
 * that accept `BridgePage` without type errors.
 */
export interface MockBridgePage extends BridgePage {
  /** Mock evaluate — use `.mockResolvedValue()` to set return values. */
  readonly evaluate: Mock<(...args: any[]) => any> & BridgePage['evaluate'];
  /** Mock waitForFunction — use `.mockResolvedValue()` to set return values. */
  readonly waitForFunction: Mock<(...args: any[]) => any> & BridgePage['waitForFunction'];
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

/**
 * Creates a BridgePage-compatible mock for bridge function tests.
 *
 * @param overrides - Optional method overrides for specific test scenarios.
 * @returns MockBridgePage that satisfies the BridgePage interface.
 *
 * @example
 * ```typescript
 * const page = createMockBridgePage({
 *   evaluate: vi.fn().mockResolvedValue(true),
 * });
 * await isBridgeReady(page); // works without type errors
 * ```
 */
export function createMockBridgePage(overrides?: Partial<MockBridgePage>): MockBridgePage {
  return {
    evaluate: vi.fn(),
    waitForFunction: vi.fn(),
    ...overrides,
  } as MockBridgePage;
}
