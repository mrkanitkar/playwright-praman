/**
 * Tests for `src/fe/fe-list-helpers.ts` — Fiori Elements list helper functions.
 *
 * @remarks
 * Uses a mock page helper to simulate `page.evaluate()` responses.
 * Tests cover all 6 exported functions with success, error, and edge cases.
 *
 * @module fe
 */
import { describe, expect, it, vi } from 'vitest';

import type { FEListPage } from '../../../src/fe/fe-list-helpers.js';
import {
  feClickListItem,
  feFindListItemByTitle,
  feGetListItemCount,
  feGetListItemDescription,
  feGetListItemTitle,
  feSelectListItem,
} from '../../../src/fe/fe-list-helpers.js';

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

/**
 * Creates a mock FEListPage with a configurable evaluate response.
 *
 * @param evaluateResult - The value to return from evaluate().
 * @returns A mock page object with evaluate as vi.fn mock.
 */
function createMockPage(evaluateResult: unknown): { evaluate: ReturnType<typeof vi.fn> } {
  return {
    evaluate: vi.fn().mockResolvedValue(evaluateResult),
  };
}

/**
 * Casts a mock page to FEListPage for type-safe function calls.
 *
 * @param mock - The mock page object.
 * @returns The mock typed as FEListPage.
 */
function asPage(mock: ReturnType<typeof createMockPage>): FEListPage {
  return mock as unknown as FEListPage;
}

describe('feGetListItemCount', () => {
  it('returns count when list has items', async () => {
    const mock = createMockPage({ __count: 3 });
    const count = await feGetListItemCount(asPage(mock), 'myList');
    expect(count).toBe(3);
    expect(mock.evaluate).toHaveBeenCalledWith(expect.any(String));
  });

  it('returns 0 when list is empty', async () => {
    const mock = createMockPage({ __count: 0 });
    const count = await feGetListItemCount(asPage(mock), 'myList');
    expect(count).toBe(0);
  });
});

describe('feGetListItemTitle', () => {
  it('returns title at index', async () => {
    const mock = createMockPage({ __title: 'Widget A' });
    const title = await feGetListItemTitle(asPage(mock), 'myList', 0);
    expect(title).toBe('Widget A');
  });

  it('throws ERR_CONTROL_AGGREGATION for out-of-bounds index', async () => {
    const mock = createMockPage({ __oob: true });
    await expect(feGetListItemTitle(asPage(mock), 'myList', 99)).rejects.toThrow(ControlError);
    try {
      await feGetListItemTitle(asPage(mock), 'myList', 99);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_AGGREGATION);
    }
  });
});

describe('feGetListItemDescription', () => {
  it('returns description text at index', async () => {
    const mock = createMockPage({ __desc: 'Active product' });
    const desc = await feGetListItemDescription(asPage(mock), 'myList', 0);
    expect(desc).toBe('Active product');
  });

  it('returns empty string when no description', async () => {
    const mock = createMockPage({ __desc: '' });
    const desc = await feGetListItemDescription(asPage(mock), 'myList', 0);
    expect(desc).toBe('');
  });
});

describe('feFindListItemByTitle', () => {
  it('returns index when title matches', async () => {
    const mock = createMockPage({ __index: 0 });
    const index = await feFindListItemByTitle(asPage(mock), 'myList', 'Widget A');
    expect(index).toBe(0);
  });

  it('returns -1 when title not found', async () => {
    const mock = createMockPage({ __index: -1 });
    const index = await feFindListItemByTitle(asPage(mock), 'myList', 'NonExistent');
    expect(index).toBe(-1);
  });
});

describe('feClickListItem', () => {
  it('clicks item at valid index', async () => {
    const mock = createMockPage({ __ok: true });
    await expect(feClickListItem(asPage(mock), 'myList', 0)).resolves.toBeUndefined();
    expect(mock.evaluate).toHaveBeenCalledWith(expect.any(String));
  });

  it('throws ERR_CONTROL_AGGREGATION for invalid index', async () => {
    const mock = createMockPage({ __oob: true });
    await expect(feClickListItem(asPage(mock), 'myList', -1)).rejects.toThrow(ControlError);
    try {
      await feClickListItem(asPage(mock), 'myList', -1);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_AGGREGATION);
    }
  });
});

describe('feSelectListItem', () => {
  it('selects item at valid index', async () => {
    const mock = createMockPage({ __ok: true });
    await expect(feSelectListItem(asPage(mock), 'myList', 0, true)).resolves.toBeUndefined();
    expect(mock.evaluate).toHaveBeenCalledWith(expect.stringContaining('true'));
  });

  it('deselects item at valid index', async () => {
    const mock = createMockPage({ __ok: true });
    await expect(feSelectListItem(asPage(mock), 'myList', 0, false)).resolves.toBeUndefined();
    expect(mock.evaluate).toHaveBeenCalledWith(expect.stringContaining('false'));
  });
});
