/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Web Storage fixture providing typed access to localStorage and sessionStorage.
 *
 * @remarks
 * Wraps the Playwright 1.61+ `page.localStorage` and `page.sessionStorage` APIs
 * with a typed helper interface. Feature-gated via `hasWebStorageAPI` flag —
 * throws {@link PramanError} on older Playwright versions.
 *
 * @example
 * ```typescript
 * import { test } from 'playwright-praman';
 *
 * test('seed localStorage before navigation', async ({ webStorage }) => {
 *   await webStorage.localStorage.seed({ theme: 'dark', lang: 'en' });
 * });
 * ```
 *
 * @module fixtures/web-storage-fixture
 */

import { test as base } from '@playwright/test';

import { hasFeature } from '#core/compat/playwright-compat.js';
import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';

// ── Internal storage area shape ───────────────────────────────────────────────

/**
 * Minimal structural interface for the Playwright 1.61+ storage area object
 * (`page.localStorage` / `page.sessionStorage`).
 *
 * @remarks
 * Not yet published in `@playwright/test` type definitions — used internally
 * to describe the runtime shape at the call sites that cast `page as any`.
 */
interface StorageArea {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  entries(): Promise<{ name: string; value: string }[]>;
}

// ── Public interfaces ─────────────────────────────────────────────────────────

/**
 * Typed helper for a single Web Storage area (localStorage or sessionStorage).
 *
 * @remarks
 * Wraps the Playwright 1.61+ storage area API with convenience methods for
 * reading, writing, seeding bulk data, and introspecting the current state.
 *
 * @capability webStorage.helper
 *
 * @example
 * ```typescript
 * await webStorage.localStorage.seed({ token: 'abc', userId: '42' });
 * const token = await webStorage.localStorage.getItem('token');
 * ```
 */
export interface WebStorageHelper {
  /**
   * Sets a single key-value pair in the storage area.
   *
   * @param key - Storage key.
   * @param value - Storage value (string).
   * @returns Promise that resolves once the item is stored.
   *
   * @example
   * ```typescript
   * await webStorage.localStorage.setItem('theme', 'dark');
   * ```
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Retrieves the value for a key, or `null` if the key does not exist.
   *
   * @param key - Storage key to look up.
   * @returns Promise resolving to the stored string value or `null`.
   *
   * @example
   * ```typescript
   * const lang = await webStorage.localStorage.getItem('lang');
   * ```
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Removes a single key from the storage area.
   *
   * @param key - Storage key to remove.
   * @returns Promise that resolves once the key is removed.
   *
   * @example
   * ```typescript
   * await webStorage.localStorage.removeItem('tempFlag');
   * ```
   */
  removeItem(key: string): Promise<void>;

  /**
   * Returns all current entries as a `Record<string, string>`.
   *
   * @returns Promise resolving to a plain object mapping all keys to their values.
   *
   * @example
   * ```typescript
   * const all = await webStorage.localStorage.items();
   * console.log(all['theme']); // 'dark'
   * ```
   */
  items(): Promise<Record<string, string>>;

  /**
   * Seeds multiple entries at once, equivalent to calling `setItem` for each pair.
   *
   * @param data - Key-value pairs to seed into storage.
   * @returns Promise that resolves once all items are stored.
   *
   * @example
   * ```typescript
   * await webStorage.localStorage.seed({ theme: 'dark', lang: 'en', userId: '42' });
   * ```
   */
  seed(data: Record<string, string>): Promise<void>;

  /**
   * Removes all entries from the storage area.
   *
   * @returns Promise that resolves once the area is cleared.
   *
   * @example
   * ```typescript
   * await webStorage.sessionStorage.clear();
   * ```
   */
  clear(): Promise<void>;

  /**
   * Returns the number of entries currently in the storage area.
   *
   * @returns Promise resolving to the entry count.
   *
   * @example
   * ```typescript
   * const count = await webStorage.localStorage.size();
   * ```
   */
  size(): Promise<number>;
}

/**
 * The `webStorage` fixture API exposed to test bodies.
 *
 * @remarks
 * Provides typed access to both `localStorage` and `sessionStorage` via the
 * Playwright 1.61+ Web Storage API. Feature-gated — throws
 * {@link PramanError} with {@link ErrorCode.ERR_COMPAT_FEATURE_UNAVAILABLE}
 * when the installed Playwright version is older than 1.61.
 *
 * @capability webStorage.fixture
 *
 * @example
 * ```typescript
 * import { test } from 'playwright-praman';
 *
 * test('check persisted theme', async ({ webStorage }) => {
 *   await webStorage.localStorage.seed({ theme: 'dark' });
 *   await page.goto('/');
 *   expect(await webStorage.localStorage.getItem('theme')).toBe('dark');
 * });
 * ```
 */
export interface WebStorageFixture {
  /** Typed helper for `localStorage`. */
  readonly localStorage: WebStorageHelper;
  /** Typed helper for `sessionStorage`. */
  readonly sessionStorage: WebStorageHelper;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Guards that the Playwright Web Storage API is available.
 *
 * @throws {@link PramanError} with `ERR_COMPAT_FEATURE_UNAVAILABLE` when
 *   Playwright version is below 1.61.
 *
 * @example
 * ```typescript
 * assertWebStorageAvailable(); // throws if PW < 1.61
 * ```
 */
function assertWebStorageAvailable(): void {
  if (!hasFeature('hasWebStorageAPI')) {
    throw new PramanError({
      code: ErrorCode.ERR_COMPAT_FEATURE_UNAVAILABLE,
      message:
        'Web Storage API (page.localStorage / page.sessionStorage) requires Playwright 1.61 or later.',
      attempted: 'Access webStorage fixture',
      retryable: false,
      suggestions: [
        'Upgrade Playwright: npm install -D @playwright/test@1.61.0',
        'Check your installed version: npx playwright --version',
        'Use page.evaluate(() => localStorage.setItem(...)) as a workaround on older versions',
      ],
      details: { requiredVersion: '1.61.0', feature: 'hasWebStorageAPI' },
    });
  }
}

/**
 * Wraps a Playwright 1.61+ storage area into a typed {@link WebStorageHelper}.
 *
 * @param storageArea - The raw Playwright storage area object.
 * @returns Typed {@link WebStorageHelper} instance.
 *
 * @example
 * ```typescript
 * const helper = createWebStorageHelper(page.localStorage);
 * await helper.seed({ key: 'value' });
 * ```
 */
function createWebStorageHelper(storageArea: StorageArea): WebStorageHelper {
  return {
    setItem: async (key: string, value: string) => storageArea.setItem(key, value),

    getItem: async (key: string) => storageArea.getItem(key),

    removeItem: async (key: string) => storageArea.removeItem(key),

    items: async () => {
      const entries = await storageArea.entries();
      const record: Record<string, string> = {};
      for (const entry of entries) {
        record[entry.name] = entry.value;
      }
      return record;
    },

    seed: async (data: Record<string, string>) => {
      for (const [key, value] of Object.entries(data)) {
        await storageArea.setItem(key, value);
      }
    },

    clear: async () => storageArea.clear(),

    size: async () => {
      const entries = await storageArea.entries();
      return entries.length;
    },
  };
}

// ── Fixture definition ────────────────────────────────────────────────────────

/**
 * Playwright test object extended with the `webStorage` fixture.
 *
 * @remarks
 * Provides typed access to `page.localStorage` and `page.sessionStorage`
 * (Playwright 1.61+). Feature-gated via {@link assertWebStorageAvailable} —
 * throws at setup time on older Playwright versions so failures surface early.
 *
 * Compose with `coreTest` via `mergeTests()` if needed.
 *
 * @capability webStorage.fixture
 *
 * @example
 * ```typescript
 * import { webStorageTest } from 'playwright-praman';
 *
 * webStorageTest('seed before login', async ({ webStorage }) => {
 *   await webStorage.localStorage.seed({ featureFlag: 'enabled' });
 *   await page.goto('/app');
 * });
 * ```
 */
export const webStorageTest = base.extend<{ webStorage: WebStorageFixture }>({
  webStorage: async ({ page }, use) => {
    assertWebStorageAvailable();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment -- PW 1.61 API not yet in @playwright/test types
    const pageAny = page as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access -- PW 1.61 API not yet in @playwright/test types
    const local = createWebStorageHelper(pageAny.localStorage);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access -- PW 1.61 API not yet in @playwright/test types
    const session = createWebStorageHelper(pageAny.sessionStorage);
    await use({ localStorage: local, sessionStorage: session });
  },
});

// ── Test-only exports ─────────────────────────────────────────────────────────

/**
 * Exported for unit testing only — do NOT use in production test code.
 *
 * @internal
 */
export const createWebStorageHelperForTest = createWebStorageHelper;

/**
 * Exported for unit testing only — do NOT use in production test code.
 *
 * @internal
 */
export const assertWebStorageAvailableForTest = assertWebStorageAvailable;
