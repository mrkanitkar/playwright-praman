/**
 * Tests for `src/modules/table.ts` — UI5 table abstraction module.
 *
 * @remarks
 * Verifies detection, row operations, cell access, data extraction,
 * selection, deselection, waiting, and stability wait behavior across
 * all 6 supported UI5 table variants.
 *
 * Mock strategy:
 * - Mock `TablePage` with `evaluate()` and `waitForFunction()` stubs
 * - Each test configures the evaluate mock to return variant-specific data
 *
 * @module modules
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TablePage } from '../../../src/modules/table.js';

import { ControlError } from '#core/errors/control-error.js';
import { TimeoutError } from '#core/errors/timeout-error.js';

const {
  detectTableType,
  getTableRows,
  getTableRowCount,
  getTableCellValue,
  getTableData,
  selectTableRow,
  selectAllTableRows,
  deselectAllTableRows,
  waitForTableData,
  getSelectedRows,
} = await import('../../../src/modules/table.js');

/**
 * Creates a mock TablePage with configurable evaluate and waitForFunction stubs.
 *
 * @param evaluateResults - Ordered list of results for sequential evaluate calls.
 * @returns Mock TablePage instance.
 */
function createMockPage(evaluateResults: unknown[] = []): {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
} {
  const evaluateFn = vi.fn<(script: string, arg?: unknown) => Promise<unknown>>();

  for (const result of evaluateResults) {
    evaluateFn.mockResolvedValueOnce(result);
  }

  return {
    evaluate: evaluateFn,
    waitForFunction: vi
      .fn<(script: string, arg?: unknown, opts?: unknown) => Promise<unknown>>()
      .mockResolvedValue(undefined),
  };
}

/** Casts a mock page to TablePage. */
function asPage(mock: ReturnType<typeof createMockPage>): TablePage {
  return mock as unknown as TablePage;
}

/** Detection result for sap.m.Table. */
const RESPONSIVE_DETECT = {
  variant: 'sap.m.Table',
  effectiveId: 'myTable',
  isSmartTable: false,
};

/** Detection result for sap.ui.table.Table. */
const GRID_DETECT = {
  variant: 'sap.ui.table.Table',
  effectiveId: 'gridTable',
  isSmartTable: false,
};

/** Detection result for SmartTable wrapping a grid table. */
const SMART_DETECT = {
  variant: 'sap.ui.table.Table',
  effectiveId: 'innerGrid',
  isSmartTable: true,
  smartTableId: 'smartTable',
};

/** Detection result for sap.ui.mdc.Table. */
const MDC_DETECT = {
  variant: 'sap.ui.mdc.Table',
  effectiveId: 'mdcTable',
  isSmartTable: false,
};

/** Detection result for sap.ui.table.TreeTable. */
const TREE_DETECT = {
  variant: 'sap.ui.table.TreeTable',
  effectiveId: 'treeTable',
  isSmartTable: false,
};

/** Detection result for AnalyticalTable. */
const ANALYTICAL_DETECT = {
  variant: 'sap.ui.table.AnalyticalTable',
  effectiveId: 'analyticalTable',
  isSmartTable: false,
};

describe('table module', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── detectTableType ─────────────────────────────────────────────────

  describe('detectTableType', () => {
    it('identifies sap.m.Table', async () => {
      const page = createMockPage([RESPONSIVE_DETECT]);
      const info = await detectTableType(asPage(page), 'myTable');

      expect(info.variant).toBe('sap.m.Table');
      expect(info.effectiveId).toBe('myTable');
      expect(info.isSmartTable).toBe(false);
      expect(info.smartTableId).toBeUndefined();
    });

    it('identifies sap.ui.table.Table', async () => {
      const page = createMockPage([GRID_DETECT]);
      const info = await detectTableType(asPage(page), 'gridTable');

      expect(info.variant).toBe('sap.ui.table.Table');
      expect(info.effectiveId).toBe('gridTable');
      expect(info.isSmartTable).toBe(false);
    });

    it('identifies SmartTable and unwraps inner table', async () => {
      const page = createMockPage([SMART_DETECT]);
      const info = await detectTableType(asPage(page), 'smartTable');

      expect(info.variant).toBe('sap.ui.table.Table');
      expect(info.effectiveId).toBe('innerGrid');
      expect(info.isSmartTable).toBe(true);
      expect(info.smartTableId).toBe('smartTable');
    });

    it('identifies sap.ui.mdc.Table', async () => {
      const page = createMockPage([MDC_DETECT]);
      const info = await detectTableType(asPage(page), 'mdcTable');

      expect(info.variant).toBe('sap.ui.mdc.Table');
      expect(info.isSmartTable).toBe(false);
    });

    it('identifies TreeTable', async () => {
      const page = createMockPage([TREE_DETECT]);
      const info = await detectTableType(asPage(page), 'treeTable');

      expect(info.variant).toBe('sap.ui.table.TreeTable');
      expect(info.effectiveId).toBe('treeTable');
    });

    it('throws ControlError for non-table control type', async () => {
      const nonTableResult = { variant: 'sap.m.Button', effectiveId: 'btn1', isSmartTable: false };
      const page = createMockPage([nonTableResult]);

      const error = await detectTableType(asPage(page), 'btn1').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('not a table variant');
    });

    it('identifies sap.ui.table.AnalyticalTable', async () => {
      const page = createMockPage([ANALYTICAL_DETECT]);
      const info = await detectTableType(asPage(page), 'analyticalTable');

      expect(info.variant).toBe('sap.ui.table.AnalyticalTable');
      expect(info.effectiveId).toBe('analyticalTable');
      expect(info.isSmartTable).toBe(false);
    });

    it('unwraps SmartTable with no inner table yet', async () => {
      const smartNoInner = {
        variant: 'sap.ui.comp.smarttable.SmartTable',
        effectiveId: 'smartTable',
        isSmartTable: true,
        smartTableId: 'smartTable',
      };
      const page = createMockPage([smartNoInner]);
      const info = await detectTableType(asPage(page), 'smartTable');

      expect(info.variant).toBe('sap.ui.comp.smarttable.SmartTable');
      expect(info.effectiveId).toBe('smartTable');
      expect(info.isSmartTable).toBe(true);
      expect(info.smartTableId).toBe('smartTable');
    });

    it('throws ControlError when control is not found', async () => {
      const page = createMockPage([null]);

      const error = await detectTableType(asPage(page), 'missing').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('Table control not found');
    });
  });

  // ── getTableRows ────────────────────────────────────────────────────

  describe('getTableRows', () => {
    it('returns row IDs for sap.m.Table (responsive)', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, ['row-0', 'row-1', 'row-2']]);
      // stability wait calls waitForFunction
      const rows = await getTableRows(asPage(page), 'myTable');

      expect(rows).toEqual(['row-0', 'row-1', 'row-2']);
    });

    it('returns row IDs for sap.ui.table.Table (grid)', async () => {
      const page = createMockPage([GRID_DETECT, ['gridRow-0', 'gridRow-1']]);
      const rows = await getTableRows(asPage(page), 'gridTable');

      expect(rows).toEqual(['gridRow-0', 'gridRow-1']);
    });

    it('returns row IDs for TreeTable', async () => {
      const page = createMockPage([TREE_DETECT, ['tree-0', 'tree-1']]);
      const rows = await getTableRows(asPage(page), 'treeTable');

      expect(rows).toEqual(['tree-0', 'tree-1']);
    });

    it('unwraps SmartTable and returns rows from inner grid table', async () => {
      const page = createMockPage([SMART_DETECT, ['smartRow-0', 'smartRow-1']]);
      const rows = await getTableRows(asPage(page), 'smartTable');

      expect(rows).toEqual(['smartRow-0', 'smartRow-1']);
      // The second evaluate call should use the effectiveId of the inner table
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('innerGrid');
    });

    it('returns rows for AnalyticalTable variant', async () => {
      const page = createMockPage([ANALYTICAL_DETECT, ['ana-0', 'ana-1', 'ana-2']]);
      const rows = await getTableRows(asPage(page), 'analyticalTable');

      expect(rows).toEqual(['ana-0', 'ana-1', 'ana-2']);
      // AnalyticalTable is a grid variant, so script should use getRows()
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getRows()');
    });

    it('returns rows for MDC Table via responsive path', async () => {
      const page = createMockPage([MDC_DETECT, ['mdc-0', 'mdc-1']]);
      const rows = await getTableRows(asPage(page), 'mdcTable');

      expect(rows).toEqual(['mdc-0', 'mdc-1']);
      // MDC Table is NOT a grid variant, so script should use getItems()
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getItems()');
    });

    it('returns empty array when table has no rows', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, []]);
      const rows = await getTableRows(asPage(page), 'myTable');

      expect(rows).toEqual([]);
    });
  });

  // ── getTableRowCount ────────────────────────────────────────────────

  describe('getTableRowCount', () => {
    it('returns count for responsive table', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, 5]);
      const count = await getTableRowCount(asPage(page), 'myTable');

      expect(count).toBe(5);
    });

    it('returns binding length for grid table', async () => {
      const page = createMockPage([GRID_DETECT, 100]);
      const count = await getTableRowCount(asPage(page), 'gridTable');

      expect(count).toBe(100);
    });

    it('returns binding length for AnalyticalTable', async () => {
      const page = createMockPage([ANALYTICAL_DETECT, 250]);
      const count = await getTableRowCount(asPage(page), 'analyticalTable');

      expect(count).toBe(250);
      // AnalyticalTable is grid variant, so uses binding("rows").getLength()
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getBinding');
      expect(script).toContain('getLength');
    });

    it('returns count for MDC Table via responsive path', async () => {
      const page = createMockPage([MDC_DETECT, 15]);
      const count = await getTableRowCount(asPage(page), 'mdcTable');

      expect(count).toBe(15);
      // MDC is not grid variant, so uses getItems().length
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getItems()');
    });

    it('returns binding length for SmartTable wrapping grid table', async () => {
      const page = createMockPage([SMART_DETECT, 500]);
      const count = await getTableRowCount(asPage(page), 'smartTable');

      expect(count).toBe(500);
      // SmartTable unwraps to grid variant, so uses binding path
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('innerGrid');
    });

    it('returns zero for empty table', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, 0]);
      const count = await getTableRowCount(asPage(page), 'myTable');

      expect(count).toBe(0);
    });
  });

  // ── getTableCellValue ───────────────────────────────────────────────

  describe('getTableCellValue', () => {
    it('returns cell value for responsive table', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, 'Widget A']);
      const value = await getTableCellValue(asPage(page), 'myTable', 0, 1);

      expect(value).toBe('Widget A');
    });

    it('returns cell value for grid table', async () => {
      const page = createMockPage([GRID_DETECT, '42']);
      const value = await getTableCellValue(asPage(page), 'gridTable', 1, 0);

      expect(value).toBe('42');
    });

    it('returns cell value for AnalyticalTable', async () => {
      const page = createMockPage([ANALYTICAL_DETECT, 'Total']);
      const value = await getTableCellValue(asPage(page), 'analyticalTable', 0, 0);

      expect(value).toBe('Total');
    });

    it('returns text for TreeTable cell via grid path', async () => {
      const page = createMockPage([TREE_DETECT, 'Leaf Node']);
      const value = await getTableCellValue(asPage(page), 'treeTable', 2, 0);

      expect(value).toBe('Leaf Node');
      // TreeTable is grid variant, so uses getRows()
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getRows()');
    });

    it('returns text for SmartTable wrapping grid table cell', async () => {
      const page = createMockPage([SMART_DETECT, 'Smart Cell']);
      const value = await getTableCellValue(asPage(page), 'smartTable', 0, 2);

      expect(value).toBe('Smart Cell');
      // SmartTable unwraps to grid, uses inner table effectiveId
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('innerGrid');
    });

    it('throws ControlError for out-of-bounds cell', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, null]);

      const error = await getTableCellValue(asPage(page), 'myTable', 99, 99).catch(
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('Cell not found');
    });
  });

  // ── getTableData ────────────────────────────────────────────────────

  describe('getTableData', () => {
    it('returns OData data for responsive table', async () => {
      const data = [
        { Name: 'Widget A', Price: 100 },
        { Name: 'Widget B', Price: 200 },
      ];
      const page = createMockPage([RESPONSIVE_DETECT, data]);
      const result = await getTableData(asPage(page), 'myTable');

      expect(result).toEqual(data);
    });

    it('returns OData data for grid table', async () => {
      const data = [{ OrderId: '001', Status: 'Open' }];
      const page = createMockPage([GRID_DETECT, data]);
      const result = await getTableData(asPage(page), 'gridTable');

      expect(result).toEqual(data);
    });

    it('returns binding data for MDC Table via responsive path', async () => {
      const data = [{ Product: 'Laptop', Category: 'Electronics' }];
      const page = createMockPage([MDC_DETECT, data]);
      const result = await getTableData(asPage(page), 'mdcTable');

      expect(result).toEqual(data);
      // MDC is not grid variant, so uses getBindingContext() on items
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getItems()');
      expect(script).toContain('getBindingContext');
    });

    it('returns binding data for SmartTable wrapping grid table', async () => {
      const data = [{ SalesOrder: '1000', Customer: 'Acme' }];
      const page = createMockPage([SMART_DETECT, data]);
      const result = await getTableData(asPage(page), 'smartTable');

      expect(result).toEqual(data);
      // SmartTable unwraps to grid, uses getContextByIndex chain
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getContextByIndex');
      expect(script).toContain('innerGrid');
    });

    it('returns empty array for table with no binding context', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, []]);
      const result = await getTableData(asPage(page), 'myTable');

      expect(result).toEqual([]);
    });
  });

  // ── selectTableRow ──────────────────────────────────────────────────

  describe('selectTableRow', () => {
    it('selects row in responsive table', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, true]);
      await expect(selectTableRow(asPage(page), 'myTable', 0)).resolves.toBeUndefined();
    });

    it('selects row in grid table', async () => {
      const page = createMockPage([GRID_DETECT, true]);
      await expect(selectTableRow(asPage(page), 'gridTable', 2)).resolves.toBeUndefined();
    });

    it('generates script with SelectionPlugin check for grid table', async () => {
      const page = createMockPage([GRID_DETECT, true]);
      await selectTableRow(asPage(page), 'gridTable', 3);

      // Grid table selection script should check for SelectionPlugin first
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getPlugins');
      expect(script).toContain('SelectionPlugin');
      expect(script).toContain('setSelectedIndex');
    });

    it('selects row in SmartTable wrapping grid table', async () => {
      const page = createMockPage([SMART_DETECT, true]);
      await selectTableRow(asPage(page), 'smartTable', 1);

      // Script should operate on the inner grid table ID
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('innerGrid');
    });

    it('throws ControlError for invalid row index', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, false]);

      const error = await selectTableRow(asPage(page), 'myTable', 999).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('Failed to select row');
    });
  });

  // ── selectAllTableRows ──────────────────────────────────────────────

  describe('selectAllTableRows', () => {
    it('selects all rows in responsive table', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, true]);
      await expect(selectAllTableRows(asPage(page), 'myTable')).resolves.toBeUndefined();
    });

    it('selects all rows in grid table', async () => {
      const page = createMockPage([GRID_DETECT, true]);
      await expect(selectAllTableRows(asPage(page), 'gridTable')).resolves.toBeUndefined();
    });

    it('generates script with SelectionPlugin selectAll for grid table', async () => {
      const page = createMockPage([GRID_DETECT, true]);
      await selectAllTableRows(asPage(page), 'gridTable');

      // Grid selectAll should check for SelectionPlugin first
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getPlugins');
      expect(script).toContain('selectAll');
    });
  });

  // ── deselectAllTableRows ────────────────────────────────────────────

  describe('deselectAllTableRows', () => {
    it('deselects all rows in a table', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, true]);
      await expect(deselectAllTableRows(asPage(page), 'myTable')).resolves.toBeUndefined();
    });

    it('deselects all rows in grid table via clearSelection', async () => {
      const page = createMockPage([GRID_DETECT, true]);
      await deselectAllTableRows(asPage(page), 'gridTable');

      // Grid deselect should check for SelectionPlugin clearSelection
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('clearSelection');
      expect(script).toContain('getPlugins');
    });
  });

  // ── waitForTableData ────────────────────────────────────────────────

  describe('waitForTableData', () => {
    it('resolves when table has data', async () => {
      const page = createMockPage([RESPONSIVE_DETECT]);
      // waitForFunction mock already resolves by default
      await expect(waitForTableData(asPage(page), 'myTable')).resolves.toBeUndefined();
    });

    it('waits for minRows threshold', async () => {
      const page = createMockPage([RESPONSIVE_DETECT]);
      await waitForTableData(asPage(page), 'myTable', { minRows: 5 });

      // Verify waitForFunction was called with the predicate script
      expect(page.waitForFunction).toHaveBeenCalledTimes(1);
      const script = page.waitForFunction.mock.calls[0]?.[0] as string;
      expect(script).toContain('5');
    });

    it('throws TimeoutError when data does not load in time', async () => {
      const page = createMockPage([RESPONSIVE_DETECT]);
      page.waitForFunction.mockRejectedValueOnce(new Error('Timeout 5000ms exceeded'));

      await expect(waitForTableData(asPage(page), 'myTable', { timeout: 5000 })).rejects.toThrow(
        TimeoutError,
      );
    });

    it('uses custom timeout and polling options', async () => {
      const page = createMockPage([RESPONSIVE_DETECT]);
      await waitForTableData(asPage(page), 'myTable', { timeout: 3000, polling: 50 });

      expect(page.waitForFunction).toHaveBeenCalledWith(expect.any(String), undefined, {
        timeout: 3000,
        polling: 50,
      });
    });
  });

  // ── getSelectedRows ─────────────────────────────────────────────────

  describe('getSelectedRows', () => {
    it('returns selected indices for grid table', async () => {
      const page = createMockPage([GRID_DETECT, [0, 2, 4]]);
      const selected = await getSelectedRows(asPage(page), 'gridTable');

      expect(selected).toEqual([0, 2, 4]);
    });

    it('returns selected indices for responsive table', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, [1, 3]]);
      const selected = await getSelectedRows(asPage(page), 'myTable');

      expect(selected).toEqual([1, 3]);
    });

    it('returns selected indices with SelectionPlugin on grid table', async () => {
      // The script checks for SelectionPlugin first; mock returns indices from plugin
      const page = createMockPage([GRID_DETECT, [0, 1, 2]]);
      const selected = await getSelectedRows(asPage(page), 'gridTable');

      expect(selected).toEqual([0, 1, 2]);
    });

    it('returns selected indices for TreeTable', async () => {
      const page = createMockPage([TREE_DETECT, [1, 3, 5]]);
      const selected = await getSelectedRows(asPage(page), 'treeTable');

      expect(selected).toEqual([1, 3, 5]);
      // TreeTable is grid variant, should use getSelectedIndices
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getSelectedIndices');
    });

    it('returns selected indices for AnalyticalTable', async () => {
      const page = createMockPage([ANALYTICAL_DETECT, [0, 2]]);
      const selected = await getSelectedRows(asPage(page), 'analyticalTable');

      expect(selected).toEqual([0, 2]);
      // AnalyticalTable is grid variant, should check for SelectionPlugin
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('SelectionPlugin');
    });

    it('returns empty array when no rows are selected', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, []]);
      const selected = await getSelectedRows(asPage(page), 'myTable');

      expect(selected).toEqual([]);
    });
  });

  // ── Stability wait behavior ─────────────────────────────────────────

  describe('stability wait behavior', () => {
    it('all mutating functions call stability wait by default', async () => {
      // selectTableRow calls stabilityWait which calls waitForFunction
      const page = createMockPage([RESPONSIVE_DETECT, true]);
      await selectTableRow(asPage(page), 'myTable', 0);

      // waitForFunction should have been called for stability wait
      expect(page.waitForFunction).toHaveBeenCalled();
    });

    it('all functions skip stability wait when skipStabilityWait is true', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, true]);
      await selectTableRow(asPage(page), 'myTable', 0, { skipStabilityWait: true });

      // waitForFunction should NOT have been called since stability wait is skipped
      expect(page.waitForFunction).not.toHaveBeenCalled();
    });
  });
});
