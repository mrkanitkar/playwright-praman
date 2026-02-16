/**
 * Tests for `src/matchers/table-matchers.ts` — table-specific matcher functions.
 *
 * @remarks
 * These tests verify matcher logic for sap.m.Table row/cell assertions
 * using mocked bridge adapters with carefully chained mock responses.
 *
 * @module matchers
 */
import { describe, expect, it, vi } from 'vitest';

import type { UI5ControlBase } from '../../../src/core/types/controls.js';
import {
  checkUI5CellText,
  checkUI5RowCount,
  checkUI5SelectedRows,
} from '../../../src/matchers/table-matchers.js';
import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';

/**
 * Creates a minimal mock UI5ControlBase for testing aggregation results.
 *
 * @param id - The control ID.
 * @param controlType - The control type string.
 * @returns A mock UI5ControlBase satisfying the full interface.
 */
function createMockControl(id: string, controlType: string): UI5ControlBase {
  return {
    id,
    controlType,
    getId: vi.fn<UI5ControlBase['getId']>().mockResolvedValue(id),
    getControlType: vi.fn<UI5ControlBase['getControlType']>().mockResolvedValue(controlType),
    getProperty: vi.fn<UI5ControlBase['getProperty']>().mockResolvedValue(undefined),
    setProperty: vi.fn<UI5ControlBase['setProperty']>().mockResolvedValue(undefined),
    getAggregation: vi.fn<UI5ControlBase['getAggregation']>().mockResolvedValue([]),
    getBindingInfo: vi.fn<UI5ControlBase['getBindingInfo']>().mockResolvedValue(undefined),
    getDomRef: vi.fn<UI5ControlBase['getDomRef']>().mockResolvedValue(null),
    isVisible: vi.fn<UI5ControlBase['isVisible']>().mockResolvedValue(true),
    isEnabled: vi.fn<UI5ControlBase['isEnabled']>().mockResolvedValue(true),
    isBound: vi.fn<UI5ControlBase['isBound']>().mockResolvedValue(false),
    getModel: vi.fn<UI5ControlBase['getModel']>().mockResolvedValue(undefined),
    getView: vi.fn<UI5ControlBase['getView']>().mockResolvedValue(undefined),
  };
}

describe('checkUI5RowCount', () => {
  it('passes with correct row count', async () => {
    const adapter = createMockBridgeAdapter();
    const mockRows = [
      createMockControl('row0', 'sap.m.ColumnListItem'),
      createMockControl('row1', 'sap.m.ColumnListItem'),
      createMockControl('row2', 'sap.m.ColumnListItem'),
    ];
    adapter.getControlAggregation.mockResolvedValue(mockRows);

    const result = await checkUI5RowCount(adapter, 'table1', 3);

    expect(result.pass).toBe(true);
    expect(adapter.getControlAggregation).toHaveBeenCalledWith('table1', 'items');
  });

  it('fails with wrong row count', async () => {
    const adapter = createMockBridgeAdapter();
    const mockRows = [
      createMockControl('row0', 'sap.m.ColumnListItem'),
      createMockControl('row1', 'sap.m.ColumnListItem'),
    ];
    adapter.getControlAggregation.mockResolvedValue(mockRows);

    const result = await checkUI5RowCount(adapter, 'table1', 5);

    expect(result.pass).toBe(false);
    const message = result.message();
    expect(message).toContain('5');
    expect(message).toContain('2');
  });

  it('passes with empty table expecting zero rows', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlAggregation.mockResolvedValue([]);

    const result = await checkUI5RowCount(adapter, 'table1', 0);

    expect(result.pass).toBe(true);
  });
});

describe('checkUI5CellText', () => {
  it('passes with matching cell text', async () => {
    const adapter = createMockBridgeAdapter();
    const mockRows = [
      createMockControl('row0', 'sap.m.ColumnListItem'),
      createMockControl('row1', 'sap.m.ColumnListItem'),
    ];
    const mockCells = [
      createMockControl('cell0', 'sap.m.Text'),
      createMockControl('cell1', 'sap.m.Text'),
    ];

    adapter.getControlAggregation.mockResolvedValueOnce(mockRows).mockResolvedValueOnce(mockCells);
    adapter.getControlProperty.mockResolvedValue('Hello');

    const result = await checkUI5CellText(adapter, 'table1', 0, 1, 'Hello');

    expect(result.pass).toBe(true);
    expect(adapter.getControlAggregation).toHaveBeenCalledWith('table1', 'items');
    expect(adapter.getControlAggregation).toHaveBeenCalledWith('row0', 'cells');
    expect(adapter.getControlProperty).toHaveBeenCalledWith('cell1', 'text');
  });

  it('fails with mismatched cell text', async () => {
    const adapter = createMockBridgeAdapter();
    const mockRows = [createMockControl('row0', 'sap.m.ColumnListItem')];
    const mockCells = [createMockControl('cell0', 'sap.m.Text')];

    adapter.getControlAggregation.mockResolvedValueOnce(mockRows).mockResolvedValueOnce(mockCells);
    adapter.getControlProperty.mockResolvedValue('World');

    const result = await checkUI5CellText(adapter, 'table1', 0, 0, 'Hello');

    expect(result.pass).toBe(false);
  });

  it('passes with RegExp match on cell text', async () => {
    const adapter = createMockBridgeAdapter();
    const mockRows = [createMockControl('row0', 'sap.m.ColumnListItem')];
    const mockCells = [createMockControl('cell0', 'sap.m.Text')];

    adapter.getControlAggregation.mockResolvedValueOnce(mockRows).mockResolvedValueOnce(mockCells);
    adapter.getControlProperty.mockResolvedValue('Order 12345');

    const result = await checkUI5CellText(adapter, 'table1', 0, 0, /Order \d+/);

    expect(result.pass).toBe(true);
  });
});

describe('checkUI5SelectedRows', () => {
  it('passes with correct selection count', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue(['item1', 'item2', 'item3']);

    const result = await checkUI5SelectedRows(adapter, 'table1', 3);

    expect(result.pass).toBe(true);
    expect(adapter.getControlProperty).toHaveBeenCalledWith('table1', 'selectedItems');
  });

  it('fails with wrong selection count', async () => {
    const adapter = createMockBridgeAdapter();
    adapter.getControlProperty.mockResolvedValue(['item1']);

    const result = await checkUI5SelectedRows(adapter, 'table1', 3);

    expect(result.pass).toBe(false);
    const message = result.message();
    expect(message).toContain('3');
    expect(message).toContain('1');
  });
});
