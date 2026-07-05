/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/web-storage-fixture.ts`.
 *
 * @remarks
 * Uses vitest with a mocked `#core/compat/playwright-compat.js` module.
 * The internal helpers (`createWebStorageHelperForTest`,
 * `assertWebStorageAvailableForTest`) are imported via dynamic import after
 * mocks are established to ensure the module picks up the mock.
 *
 * The `mockStorageArea` is cast to `StorageAreaParam` using
 * `as unknown as StorageAreaParam` to satisfy strict TypeScript without
 * exporting the internal `StorageArea` interface from the fixture module.
 *
 * @module fixtures
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#core/compat/playwright-compat.js', () => ({
  hasFeature: vi.fn().mockReturnValue(true),
}));

vi.mock('@playwright/test', () => ({
  test: {
    extend: vi.fn().mockImplementation((fixtures: Record<string, unknown>) => ({
      extend: vi.fn(),
      _fixtureDefinitions: fixtures,
    })),
  },
}));

import { hasFeature } from '#core/compat/playwright-compat.js';

const mockHasFeature = vi.mocked(hasFeature);

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Mirrors the internal `StorageArea` interface in web-storage-fixture.ts.
 * Declared here so we can cast the mock without exporting the internal type.
 */
interface StorageAreaParam {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  entries(): Promise<{ name: string; value: string }[]>;
}

// ── Mock factory ──────────────────────────────────────────────────────────────

function makeMockStorageArea(): {
  setItem: ReturnType<typeof vi.fn>;
  getItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  entries: ReturnType<typeof vi.fn>;
} {
  return {
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue(null),
    removeItem: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    entries: vi.fn().mockResolvedValue([]),
  };
}

/** Cast helper — the mock satisfies StorageAreaParam at runtime. */
function asStorageArea(area: ReturnType<typeof makeMockStorageArea>): StorageAreaParam {
  return area as unknown as StorageAreaParam;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WebStorageHelper', () => {
  let mockStorageArea: ReturnType<typeof makeMockStorageArea>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHasFeature.mockReturnValue(true);
    mockStorageArea = makeMockStorageArea();
  });

  it('setItem delegates to the storage area', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    await helper.setItem('theme', 'dark');

    expect(mockStorageArea.setItem).toHaveBeenCalledOnce();
    expect(mockStorageArea.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('getItem returns the value from the storage area', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    mockStorageArea.getItem.mockResolvedValue('dark');
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    const result = await helper.getItem('theme');

    expect(result).toBe('dark');
    expect(mockStorageArea.getItem).toHaveBeenCalledOnce();
    expect(mockStorageArea.getItem).toHaveBeenCalledWith('theme');
  });

  it('getItem returns null when key does not exist', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    mockStorageArea.getItem.mockResolvedValue(null);
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    const result = await helper.getItem('nonexistent');

    expect(result).toBeNull();
  });

  it('items() returns a Record built from entries()', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    mockStorageArea.entries.mockResolvedValue([
      { name: 'theme', value: 'dark' },
      { name: 'lang', value: 'en' },
    ]);
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    const result = await helper.items();

    expect(result).toEqual({ theme: 'dark', lang: 'en' });
    expect(mockStorageArea.entries).toHaveBeenCalledOnce();
  });

  it('items() returns an empty Record when storage is empty', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    mockStorageArea.entries.mockResolvedValue([]);
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    const result = await helper.items();

    expect(result).toEqual({});
  });

  it('seed() calls setItem for each entry in the provided Record', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    await helper.seed({ theme: 'dark', lang: 'en', userId: '42' });

    expect(mockStorageArea.setItem).toHaveBeenCalledTimes(3);
    expect(mockStorageArea.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(mockStorageArea.setItem).toHaveBeenCalledWith('lang', 'en');
    expect(mockStorageArea.setItem).toHaveBeenCalledWith('userId', '42');
  });

  it('seed() does nothing when given an empty Record', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    await helper.seed({});

    expect(mockStorageArea.setItem).not.toHaveBeenCalled();
  });

  it('size() returns the number of entries from entries()', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    mockStorageArea.entries.mockResolvedValue([
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
      { name: 'c', value: '3' },
    ]);
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    const count = await helper.size();

    expect(count).toBe(3);
  });

  it('size() returns 0 when storage is empty', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    mockStorageArea.entries.mockResolvedValue([]);
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    const count = await helper.size();

    expect(count).toBe(0);
  });

  it('clear() delegates to the storage area', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    await helper.clear();

    expect(mockStorageArea.clear).toHaveBeenCalledOnce();
  });

  it('removeItem delegates to the storage area', async () => {
    const { createWebStorageHelperForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    const helper = createWebStorageHelperForTest(asStorageArea(mockStorageArea));

    await helper.removeItem('theme');

    expect(mockStorageArea.removeItem).toHaveBeenCalledOnce();
    expect(mockStorageArea.removeItem).toHaveBeenCalledWith('theme');
  });
});

describe('assertWebStorageAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasFeature.mockReturnValue(true);
  });

  it('throws PramanError when hasWebStorageAPI feature is false', async () => {
    mockHasFeature.mockReturnValue(false);

    const { assertWebStorageAvailableForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    const { PramanError: PramanErrorClass } = await import('../../../src/core/errors/base.js');

    expect(() => {
      assertWebStorageAvailableForTest();
    }).toThrow(PramanErrorClass);
  });

  it('throws with ERR_COMPAT_FEATURE_UNAVAILABLE code', async () => {
    mockHasFeature.mockReturnValue(false);

    const { assertWebStorageAvailableForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');
    const { PramanError: PramanErrorClass } = await import('../../../src/core/errors/base.js');

    let caught: unknown;
    try {
      assertWebStorageAvailableForTest();
    } catch (error: unknown) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(PramanErrorClass);
    expect((caught as InstanceType<typeof PramanErrorClass>).code).toBe(
      'ERR_COMPAT_FEATURE_UNAVAILABLE',
    );
  });

  it('throws with a message mentioning Playwright 1.61', async () => {
    mockHasFeature.mockReturnValue(false);

    const { assertWebStorageAvailableForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');

    expect(() => {
      assertWebStorageAvailableForTest();
    }).toThrow('1.61');
  });

  it('does not throw when hasWebStorageAPI feature is true', async () => {
    mockHasFeature.mockReturnValue(true);

    const { assertWebStorageAvailableForTest } =
      await import('../../../src/fixtures/web-storage-fixture.js');

    expect(() => {
      assertWebStorageAvailableForTest();
    }).not.toThrow();
  });
});
