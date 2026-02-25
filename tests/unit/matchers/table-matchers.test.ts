/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/matchers/table-matchers.ts` — table-specific matcher functions.
 *
 * @remarks
 * These tests verify matcher logic for sap.m.Table row/cell assertions
 * using mocked Playwright pages with carefully chained mock responses.
 *
 * @module matchers
 */
import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import type { MethodExecutionResult } from '../../../src/bridge/bridge-types.js';
import {
  checkUI5CellText,
  checkUI5RowCount,
  checkUI5SelectedRows,
} from '../../../src/matchers/table-matchers.js';

vi.mock('#bridge/injection.js', () => ({
  ensureBridgeInjected: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('#bridge/browser-scripts/execute-method.js', () => ({
  createExecuteMethodScript: vi.fn().mockReturnValue('(function(){})()'),
}));

/**
 * Creates a MethodExecutionResult for an aggregation response.
 *
 * @param controls - Array of `{ id, controlType }` to return.
 * @returns A MethodExecutionResult with returnType 'aggregation'.
 */
function createAggregationResult(
  controls: readonly { readonly id: string; readonly controlType: string }[],
): MethodExecutionResult {
  if (controls.length === 0) {
    return { success: true, returnType: 'empty', value: [], duration: 0 };
  }
  return {
    success: true,
    returnType: 'aggregation',
    uuids: controls.map((c) => c.id),
    objectTypes: controls.map((c) => c.controlType),
    duration: 0,
  };
}

/**
 * Creates a MethodExecutionResult for a property value response.
 *
 * @param value - The property value to return.
 * @returns A MethodExecutionResult with returnType 'result'.
 */
function createPropertyResult(value: unknown): MethodExecutionResult {
  return { success: true, returnType: 'result', value, duration: 0 };
}

describe('checkUI5RowCount', () => {
  it('passes with correct row count', async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(
        createAggregationResult([
          { id: 'row0', controlType: 'sap.m.ColumnListItem' },
          { id: 'row1', controlType: 'sap.m.ColumnListItem' },
          { id: 'row2', controlType: 'sap.m.ColumnListItem' },
        ]),
      ),
    } as unknown as Page;

    const result = await checkUI5RowCount(page, 'table1', 3);

    expect(result.pass).toBe(true);
  });

  it('fails with wrong row count', async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(
        createAggregationResult([
          { id: 'row0', controlType: 'sap.m.ColumnListItem' },
          { id: 'row1', controlType: 'sap.m.ColumnListItem' },
        ]),
      ),
    } as unknown as Page;

    const result = await checkUI5RowCount(page, 'table1', 5, { timeout: 0 });

    expect(result.pass).toBe(false);
    const message = result.message();
    expect(message).toContain('5');
    expect(message).toContain('2');
  });

  it('passes with empty table expecting zero rows', async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(createAggregationResult([])),
    } as unknown as Page;

    const result = await checkUI5RowCount(page, 'table1', 0);

    expect(result.pass).toBe(true);
  });

  it('pass message mentions "not to have" when passing', async () => {
    const page = {
      evaluate: vi
        .fn()
        .mockResolvedValue(
          createAggregationResult([{ id: 'r0', controlType: 'sap.m.ColumnListItem' }]),
        ),
    } as unknown as Page;

    const result = await checkUI5RowCount(page, 'table1', 1);

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('not to have');
  });
});

describe('checkUI5CellText', () => {
  it('passes with matching cell text', async () => {
    const rowsResult = createAggregationResult([
      { id: 'row0', controlType: 'sap.m.ColumnListItem' },
      { id: 'row1', controlType: 'sap.m.ColumnListItem' },
    ]);
    const cellsResult = createAggregationResult([
      { id: 'cell0', controlType: 'sap.m.Text' },
      { id: 'cell1', controlType: 'sap.m.Text' },
    ]);
    const textResult = createPropertyResult('Hello');

    const page = {
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(rowsResult)
        .mockResolvedValueOnce(cellsResult)
        .mockResolvedValueOnce(textResult),
    } as unknown as Page;

    const result = await checkUI5CellText(page, 'table1', 0, 1, 'Hello');

    expect(result.pass).toBe(true);
  });

  it('fails with mismatched cell text', async () => {
    const rowsResult = createAggregationResult([
      { id: 'row0', controlType: 'sap.m.ColumnListItem' },
    ]);
    const cellsResult = createAggregationResult([{ id: 'cell0', controlType: 'sap.m.Text' }]);
    const textResult = createPropertyResult('World');

    const page = {
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(rowsResult)
        .mockResolvedValueOnce(cellsResult)
        .mockResolvedValueOnce(textResult),
    } as unknown as Page;

    const result = await checkUI5CellText(page, 'table1', 0, 0, 'Hello', { timeout: 0 });

    expect(result.pass).toBe(false);
  });

  it('passes with RegExp match on cell text', async () => {
    const rowsResult = createAggregationResult([
      { id: 'row0', controlType: 'sap.m.ColumnListItem' },
    ]);
    const cellsResult = createAggregationResult([{ id: 'cell0', controlType: 'sap.m.Text' }]);
    const textResult = createPropertyResult('Order 12345');

    const page = {
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(rowsResult)
        .mockResolvedValueOnce(cellsResult)
        .mockResolvedValueOnce(textResult),
    } as unknown as Page;

    const result = await checkUI5CellText(page, 'table1', 0, 0, /Order \d+/);

    expect(result.pass).toBe(true);
  });

  it('fails when row index is out of bounds', async () => {
    const rowsResult = createAggregationResult([
      { id: 'row0', controlType: 'sap.m.ColumnListItem' },
    ]);

    const page = {
      evaluate: vi.fn().mockResolvedValue(rowsResult),
    } as unknown as Page;

    const result = await checkUI5CellText(page, 'table1', 5, 0, 'text', { timeout: 0 });

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('row 5 does not exist');
    expect(result.message()).toContain('1 rows');
    expect(result.actual).toBeUndefined();
  });

  it('fails when column index is out of bounds', async () => {
    const rowsResult = createAggregationResult([
      { id: 'row0', controlType: 'sap.m.ColumnListItem' },
    ]);
    const cellsResult = createAggregationResult([{ id: 'cell0', controlType: 'sap.m.Text' }]);

    const page = {
      evaluate: vi.fn().mockResolvedValueOnce(rowsResult).mockResolvedValueOnce(cellsResult),
    } as unknown as Page;

    const result = await checkUI5CellText(page, 'table1', 0, 5, 'text', { timeout: 0 });

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('column 5 does not exist');
    expect(result.message()).toContain('1 cells');
    expect(result.actual).toBeUndefined();
  });

  it('pass message mentions "not to match" when passing', async () => {
    const rowsResult = createAggregationResult([
      { id: 'row0', controlType: 'sap.m.ColumnListItem' },
    ]);
    const cellsResult = createAggregationResult([{ id: 'cell0', controlType: 'sap.m.Text' }]);
    const textResult = createPropertyResult('Match');

    const page = {
      evaluate: vi
        .fn()
        .mockResolvedValueOnce(rowsResult)
        .mockResolvedValueOnce(cellsResult)
        .mockResolvedValueOnce(textResult),
    } as unknown as Page;

    const result = await checkUI5CellText(page, 'table1', 0, 0, 'Match');

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('not to match');
  });
});

describe('checkUI5SelectedRows', () => {
  it('passes with correct selection count', async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(createPropertyResult(['item1', 'item2', 'item3'])),
    } as unknown as Page;

    const result = await checkUI5SelectedRows(page, 'table1', 3);

    expect(result.pass).toBe(true);
  });

  it('fails with wrong selection count', async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(createPropertyResult(['item1'])),
    } as unknown as Page;

    const result = await checkUI5SelectedRows(page, 'table1', 3, { timeout: 0 });

    expect(result.pass).toBe(false);
    const message = result.message();
    expect(message).toContain('3');
    expect(message).toContain('1');
  });

  it('fails when selectedItems is not an array', async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(createPropertyResult('not-an-array')),
    } as unknown as Page;

    const result = await checkUI5SelectedRows(page, 'table1', 2, { timeout: 0 });

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('not an array');
  });

  it('pass message mentions "not to have" when passing', async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(createPropertyResult(['a', 'b'])),
    } as unknown as Page;

    const result = await checkUI5SelectedRows(page, 'table1', 2);

    expect(result.pass).toBe(true);
    expect(result.message()).toContain('not to have');
  });
});
