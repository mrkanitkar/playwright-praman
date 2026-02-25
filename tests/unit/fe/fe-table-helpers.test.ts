/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fe/fe-table-helpers.ts` — Fiori Elements table helper functions.
 *
 * @remarks
 * Uses a mock page helper to simulate `page.evaluate()` responses.
 * Tests cover all 5 exported functions with success, error, and edge cases.
 *
 * @module fe
 */
import { describe, expect, it, vi } from 'vitest';

import type { FETablePage } from '../../../src/fe/fe-table-helpers.js';
import {
  feClickRow,
  feFindRowByValues,
  feGetCellValue,
  feGetColumnNames,
  feGetTableRowCount,
} from '../../../src/fe/fe-table-helpers.js';

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

/**
 * Creates a mock FETablePage with a configurable evaluate response.
 *
 * @returns A mock page object with evaluate and waitForFunction as vi.fn mocks.
 */
const createMockPage = (): {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
} => ({
  evaluate: vi.fn(),
  waitForFunction: vi.fn().mockResolvedValue(undefined),
});

/**
 * Casts a mock page to FETablePage for type-safe function calls.
 *
 * @param mock - The mock page object.
 * @returns The mock typed as FETablePage.
 */
const asPage = (mock: ReturnType<typeof createMockPage>): FETablePage =>
  mock as unknown as FETablePage;

describe('feGetTableRowCount', () => {
  it('returns row count when table has rows', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __count: 5 });
    const count = await feGetTableRowCount(asPage(mock), 'myTable');
    expect(count).toBe(5);
    expect(mock.evaluate).toHaveBeenCalledWith(expect.any(String));
  });

  it('returns 0 for an empty table', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __count: 0 });
    const count = await feGetTableRowCount(asPage(mock), 'myTable');
    expect(count).toBe(0);
  });

  it('returns 0 when __count is undefined (fallback)', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({});
    const count = await feGetTableRowCount(asPage(mock), 'myTable');
    expect(count).toBe(0);
  });

  it('throws ERR_CONTROL_NOT_FOUND when table is not found', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __error: 'Table not found' });
    await expect(feGetTableRowCount(asPage(mock), 'missing')).rejects.toThrow(ControlError);
    try {
      await feGetTableRowCount(asPage(mock), 'missing');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_NOT_FOUND);
    }
  });
});

describe('feGetCellValue', () => {
  it('returns cell text for a valid row and column', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __val: 'Widget A' });
    const value = await feGetCellValue(asPage(mock), 'myTable', 0, 'Product');
    expect(value).toBe('Widget A');
    expect(mock.evaluate).toHaveBeenCalledWith(expect.any(String));
  });

  it('throws ERR_CONTROL_AGGREGATION when column is not found (null result)', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __nocol: true });
    await expect(feGetCellValue(asPage(mock), 'myTable', 0, 'NonExistent')).rejects.toThrow(
      ControlError,
    );
    try {
      await feGetCellValue(asPage(mock), 'myTable', 0, 'NonExistent');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_AGGREGATION);
    }
  });

  it('throws ERR_CONTROL_AGGREGATION when row index is out of bounds', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __oob: true });
    await expect(feGetCellValue(asPage(mock), 'myTable', 99, 'Product')).rejects.toThrow(
      ControlError,
    );
    try {
      await feGetCellValue(asPage(mock), 'myTable', 99, 'Product');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_AGGREGATION);
    }
  });

  it('throws ERR_CONTROL_NOT_FOUND when table is not found', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __error: 'Table not found' });
    await expect(feGetCellValue(asPage(mock), 'missing', 0, 'Product')).rejects.toThrow(
      ControlError,
    );
    try {
      await feGetCellValue(asPage(mock), 'missing', 0, 'Product');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_NOT_FOUND);
      expect(controlErr.message).toContain('missing');
      expect(controlErr.retryable).toBe(true);
    }
  });

  it('returns empty string when __val is undefined (fallback)', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({});
    const value = await feGetCellValue(asPage(mock), 'myTable', 0, 'Product');
    expect(value).toBe('');
  });
});

describe('feFindRowByValues', () => {
  it('returns the matching row index', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __index: 2 });
    const index = await feFindRowByValues(asPage(mock), 'myTable', {
      Product: 'Widget A',
      Status: 'Active',
    });
    expect(index).toBe(2);
    expect(mock.evaluate).toHaveBeenCalledWith(expect.any(String));
  });

  it('returns -1 when no row matches', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __index: -1 });
    const index = await feFindRowByValues(asPage(mock), 'myTable', { Product: 'NonExistent' });
    expect(index).toBe(-1);
  });

  it('throws ERR_CONTROL_NOT_FOUND when table is not found', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __error: 'Table not found' });
    await expect(
      feFindRowByValues(asPage(mock), 'missing', { Product: 'Widget A' }),
    ).rejects.toThrow(ControlError);
    try {
      await feFindRowByValues(asPage(mock), 'missing', { Product: 'Widget A' });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_NOT_FOUND);
    }
  });

  it('returns -1 when __index is undefined (fallback)', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({});
    const index = await feFindRowByValues(asPage(mock), 'myTable', { Product: 'Widget A' });
    expect(index).toBe(-1);
  });
});

describe('feClickRow', () => {
  it('resolves without error when row click succeeds', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __ok: true });
    await expect(feClickRow(asPage(mock), 'myTable', 0)).resolves.toBeUndefined();
    expect(mock.evaluate).toHaveBeenCalledWith(expect.any(String));
  });

  it('throws ERR_CONTROL_AGGREGATION when row index is out of bounds', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __oob: true });
    await expect(feClickRow(asPage(mock), 'myTable', -1)).rejects.toThrow(ControlError);
    try {
      await feClickRow(asPage(mock), 'myTable', -1);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_AGGREGATION);
    }
  });

  it('throws ERR_CONTROL_NOT_FOUND when table is not found', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __error: 'Table not found' });
    await expect(feClickRow(asPage(mock), 'missing', 0)).rejects.toThrow(ControlError);
    try {
      await feClickRow(asPage(mock), 'missing', 0);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_NOT_FOUND);
    }
  });
});

describe('feGetColumnNames', () => {
  it('returns column header names', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __names: ['Product', 'Status', 'Price'] });
    const names = await feGetColumnNames(asPage(mock), 'myTable');
    expect(names).toEqual(['Product', 'Status', 'Price']);
    expect(mock.evaluate).toHaveBeenCalledWith(expect.any(String));
  });

  it('returns empty array when table has no columns', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __names: [] });
    const names = await feGetColumnNames(asPage(mock), 'myTable');
    expect(names).toEqual([]);
  });

  it('throws ERR_CONTROL_NOT_FOUND when table is not found', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({ __error: 'Table not found' });
    await expect(feGetColumnNames(asPage(mock), 'missing')).rejects.toThrow(ControlError);
    try {
      await feGetColumnNames(asPage(mock), 'missing');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_NOT_FOUND);
    }
  });

  it('returns frozen empty array when __names is undefined (fallback)', async () => {
    const mock = createMockPage();
    mock.evaluate.mockResolvedValue({});
    const names = await feGetColumnNames(asPage(mock), 'myTable');
    expect(names).toEqual([]);
    expect(Object.isFrozen(names)).toBe(true);
  });
});
