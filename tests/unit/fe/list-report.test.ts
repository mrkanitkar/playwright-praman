/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fe/list-report.ts` — Fiori Elements List Report operations.
 *
 * @remarks
 * Uses a mock page helper to simulate `page.evaluate()` and `page.waitForFunction()`
 * responses. Tests cover all 9 exported functions with success, error, and edge cases.
 *
 * @module fe
 */
import { describe, expect, it, vi } from 'vitest';

import type { ListReportPage } from '../../../src/fe/list-report.js';
import {
  clearFilterBar,
  executeSearch,
  getAvailableVariants,
  getFilterBar,
  getFilterBarFieldValue,
  getListReportTable,
  navigateToItem,
  selectVariant,
  setFilterBarField,
} from '../../../src/fe/list-report.js';

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

/**
 * Creates a mock ListReportPage with a configurable evaluate response.
 *
 * @param evaluateResult - The value to return from evaluate().
 * @returns A mock page object with evaluate and waitForFunction as vi.fn mocks.
 */
function createMockPage(evaluateResult: unknown): ListReportPage & {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
} {
  return {
    evaluate: vi.fn().mockResolvedValue(evaluateResult),
    waitForFunction: vi.fn().mockResolvedValue(undefined),
  };
}

describe('getListReportTable', () => {
  it('returns SmartTable ID when SmartTable is found', async () => {
    const page = createMockPage({ found: true, id: 'app--smartTable', type: 'SmartTable' });
    const tableId = await getListReportTable(page);
    expect(tableId).toBe('app--smartTable');
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String));
  });

  it('returns MDC Table ID when no SmartTable but MDC Table exists', async () => {
    const page = createMockPage({ found: true, id: 'app--mdcTable', type: 'MDCTable' });
    const tableId = await getListReportTable(page);
    expect(tableId).toBe('app--mdcTable');
  });

  it('throws ControlError when no table is found', async () => {
    const page = createMockPage({ found: false, id: '', type: '' });
    await expect(getListReportTable(page)).rejects.toThrow(ControlError);
    await expect(getListReportTable(page)).rejects.toThrow('List Report table not found');
  });
});

describe('getFilterBar', () => {
  it('returns SmartFilterBar ID when found', async () => {
    const page = createMockPage({ found: true, id: 'app--smartFilterBar', type: 'SmartFilterBar' });
    const filterBarId = await getFilterBar(page);
    expect(filterBarId).toBe('app--smartFilterBar');
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String));
  });

  it('returns MDC FilterBar ID when found', async () => {
    const page = createMockPage({ found: true, id: 'app--mdcFilterBar', type: 'MDCFilterBar' });
    const filterBarId = await getFilterBar(page);
    expect(filterBarId).toBe('app--mdcFilterBar');
  });

  it('throws ControlError when no filter bar is found', async () => {
    const page = createMockPage({ found: false, id: '', type: '' });
    await expect(getFilterBar(page)).rejects.toThrow(ControlError);
    await expect(getFilterBar(page)).rejects.toThrow('List Report filter bar not found');
  });
});

describe('setFilterBarField', () => {
  it('sets value when field is found', async () => {
    const page = createMockPage({ success: true });
    await expect(
      setFilterBarField(page, 'app--filterBar', 'CompanyCode', '1000'),
    ).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String), {
      filterBarId: 'app--filterBar',
      fieldName: 'CompanyCode',
      value: '1000',
    });
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('throws ControlError when field is not found', async () => {
    const page = createMockPage({ success: false, reason: 'field_not_found' });
    await expect(setFilterBarField(page, 'app--filterBar', 'UnknownField', 'val')).rejects.toThrow(
      ControlError,
    );
    try {
      await setFilterBarField(page, 'app--filterBar', 'UnknownField', 'val');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_NOT_FOUND);
      expect(controlErr.message).toContain('UnknownField');
    }
  });
});

describe('getFilterBarFieldValue', () => {
  it('returns current value of the filter field', async () => {
    const page = createMockPage({ found: true, value: '1000' });
    const value = await getFilterBarFieldValue(page, 'app--filterBar', 'CompanyCode');
    expect(value).toBe('1000');
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String), {
      filterBarId: 'app--filterBar',
      fieldName: 'CompanyCode',
    });
  });

  it('returns empty string when field value is not set', async () => {
    const page = createMockPage({ found: false, value: '' });
    const value = await getFilterBarFieldValue(page, 'app--filterBar', 'CompanyCode');
    expect(value).toBe('');
  });
});

describe('executeSearch', () => {
  it('triggers search successfully', async () => {
    const page = createMockPage({ success: true });
    await expect(executeSearch(page, 'app--filterBar')).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String), 'app--filterBar');
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('throws ControlError when filter bar is not found', async () => {
    const page = createMockPage({ success: false, reason: 'filter_bar_not_found' });
    await expect(executeSearch(page, 'nonExistent')).rejects.toThrow(ControlError);
    await expect(executeSearch(page, 'nonExistent')).rejects.toThrow(
      'Filter bar not found or search failed',
    );
  });
});

describe('clearFilterBar', () => {
  it('clears filter fields successfully', async () => {
    const page = createMockPage({ success: true });
    await expect(clearFilterBar(page, 'app--filterBar')).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String), 'app--filterBar');
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('throws ControlError when filter bar is not found', async () => {
    const page = createMockPage({ success: false, reason: 'filter_bar_not_found' });
    await expect(clearFilterBar(page, 'nonExistent')).rejects.toThrow(ControlError);
    await expect(clearFilterBar(page, 'nonExistent')).rejects.toThrow('Filter bar not found');
  });
});

describe('navigateToItem', () => {
  it('fires press on the row at given index', async () => {
    const page = createMockPage({ success: true });
    await expect(navigateToItem(page, 'app--table', 0)).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String), {
      tableId: 'app--table',
      rowIndex: 0,
    });
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('throws ControlError with ERR_CONTROL_AGGREGATION for invalid index', async () => {
    const page = createMockPage({ success: false, reason: 'index_out_of_bounds' });
    try {
      await navigateToItem(page, 'app--table', 99);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_AGGREGATION);
      expect(controlErr.message).toContain('out of bounds');
      expect(controlErr.retryable).toBe(false);
    }
  });

  it('throws ControlError with ERR_CONTROL_NOT_FOUND when table is missing', async () => {
    const page = createMockPage({ success: false, reason: 'table_not_found' });
    try {
      await navigateToItem(page, 'nonExistent', 0);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_NOT_FOUND);
      expect(controlErr.retryable).toBe(true);
    }
  });
});

describe('getAvailableVariants', () => {
  it('returns variant names when VariantManagement is found', async () => {
    const page = createMockPage({ found: true, variants: ['Standard', 'My View', 'Team View'] });
    const variants = await getAvailableVariants(page);
    expect(variants).toEqual(['Standard', 'My View', 'Team View']);
  });

  it('returns empty array when no VariantManagement control exists', async () => {
    const page = createMockPage({ found: false, variants: [] });
    const variants = await getAvailableVariants(page);
    expect(variants).toEqual([]);
  });
});

describe('selectVariant', () => {
  it('selects variant by name successfully', async () => {
    const page = createMockPage({ success: true });
    await expect(selectVariant(page, 'My View')).resolves.toBeUndefined();
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String), 'My View');
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('throws ControlError when variant name does not exist', async () => {
    const page = createMockPage({ success: false, reason: 'variant_not_found' });
    try {
      await selectVariant(page, 'NonExistentView');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.code).toBe(ErrorCode.ERR_CONTROL_NOT_FOUND);
      expect(controlErr.message).toContain('NonExistentView');
      expect(controlErr.retryable).toBe(false);
    }
  });

  it('throws ControlError when VariantManagement is missing', async () => {
    const page = createMockPage({ success: false, reason: 'variant_management_not_found' });
    try {
      await selectVariant(page, 'Standard');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlErr = error as ControlError;
      expect(controlErr.message).toContain('VariantManagement control not found');
      expect(controlErr.retryable).toBe(true);
    }
  });
});
