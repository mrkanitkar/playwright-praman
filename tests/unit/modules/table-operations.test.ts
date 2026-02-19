/**
 * Tests for `src/modules/table-operations.ts` — advanced table operations.
 *
 * @remarks
 * Verifies column header reading, row-by-values search, column-name cell access,
 * row clicking, row selection by values, row visibility scrolling, cell editing,
 * and row count delegation across responsive and grid table variants.
 *
 * Mock strategy:
 * - Mock `TableOperationsPage` with `evaluate()` and `waitForFunction()` stubs
 * - `detectTableType` is called first by each function, returning a detection result
 * - Subsequent `evaluate` calls return function-specific data
 *
 * @module modules
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TableFilterSortPage } from '../../../src/modules/table-filter-sort.js';
import type { TableOperationsPage } from '../../../src/modules/table-operations.js';

import { ControlError } from '#core/errors/control-error.js';

const {
  getColumnNames,
  findRowByValues,
  getCellByColumnName,
  clickRow,
  selectRowByValues,
  ensureRowVisible,
  setTableCellValue,
  getRowCount,
} = await import('../../../src/modules/table-operations.js');

const {
  filterByColumn,
  sortByColumn,
  getSortOrder,
  getFilterValue,
  exportTableData,
  clickTableSettingsButton,
} = await import('../../../src/modules/table-filter-sort.js');

/**
 * Creates a mock TableOperationsPage with configurable evaluate and waitForFunction stubs.
 *
 * @param evaluateResults - Ordered list of results for sequential evaluate calls.
 * @returns Mock page instance.
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

/** Casts a mock page to TableOperationsPage. */
function asPage(mock: ReturnType<typeof createMockPage>): TableOperationsPage {
  return mock as unknown as TableOperationsPage;
}

/** Casts a mock page to TableFilterSortPage. */
function asFSPage(mock: ReturnType<typeof createMockPage>): TableFilterSortPage {
  return mock as unknown as TableFilterSortPage;
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

describe('table-operations module', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // -- getColumnNames -------------------------------------------------------

  describe('getColumnNames', () => {
    it('returns header texts for responsive table', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        ['Name', 'Status', 'Amount'], // columnNamesScript
      ]);
      const cols = await getColumnNames(asPage(page), 'myTable');

      expect(cols).toEqual(['Name', 'Status', 'Amount']);
    });

    it('returns header texts for grid table', async () => {
      const page = createMockPage([
        GRID_DETECT, // detectTableType
        ['OrderId', 'Customer', 'Total'], // columnNamesScript
      ]);
      const cols = await getColumnNames(asPage(page), 'gridTable');

      expect(cols).toEqual(['OrderId', 'Customer', 'Total']);
      // Grid tables use getLabel() not getHeader()
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('getLabel');
    });

    it('returns empty array for table with no columns', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        [], // columnNamesScript
      ]);
      const cols = await getColumnNames(asPage(page), 'myTable');

      expect(cols).toEqual([]);
    });
  });

  // -- findRowByValues ------------------------------------------------------

  describe('findRowByValues', () => {
    it('returns matching row index', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType (from findRowByValues)
        RESPONSIVE_DETECT, // detectTableType (from getColumnNames)
        ['Name', 'Status'], // columnNamesScript
        1, // findRowScript result
      ]);
      const idx = await findRowByValues(asPage(page), 'myTable', { Name: 'Bob' });

      expect(idx).toBe(1);
    });

    it('returns -1 when row is not found', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, RESPONSIVE_DETECT, ['Name', 'Status'], -1]);
      const idx = await findRowByValues(asPage(page), 'myTable', { Name: 'Unknown' });

      expect(idx).toBe(-1);
    });
  });

  // -- getCellByColumnName --------------------------------------------------

  describe('getCellByColumnName', () => {
    it('returns cell text for a valid column name', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType (from getColumnNames)
        ['Name', 'Status', 'Amount'], // columnNamesScript
        RESPONSIVE_DETECT, // detectTableType (from getTableCellValue)
        'Active', // getTableCellValue result
      ]);
      const val = await getCellByColumnName(asPage(page), 'myTable', 0, 'Status');

      expect(val).toBe('Active');
    });

    it('throws ControlError for unknown column name', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, ['Name', 'Status']]);

      const error = await getCellByColumnName(asPage(page), 'myTable', 0, 'Missing').catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('Column "Missing" not found');
    });
  });

  // -- clickRow -------------------------------------------------------------

  describe('clickRow', () => {
    it('fires press on responsive table row', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        true, // clickRowScript result
      ]);
      await expect(clickRow(asPage(page), 'myTable', 0)).resolves.toBeUndefined();

      // Script should use firePress for responsive
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('firePress');
    });

    it('fires rowSelectionChange on grid table', async () => {
      const page = createMockPage([GRID_DETECT, true]);
      await expect(clickRow(asPage(page), 'gridTable', 2)).resolves.toBeUndefined();

      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('fireRowSelectionChange');
    });

    it('throws ControlError for invalid row index', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, false]);

      const error = await clickRow(asPage(page), 'myTable', 999).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('Failed to click row');
    });
  });

  // -- selectRowByValues ----------------------------------------------------

  describe('selectRowByValues', () => {
    it('finds and selects matching row', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType (findRowByValues)
        RESPONSIVE_DETECT, // detectTableType (getColumnNames inside findRowByValues)
        ['Name', 'Status'], // columnNamesScript
        0, // findRowScript result
        RESPONSIVE_DETECT, // detectTableType (selectTableRow)
        true, // selectTableRow result
      ]);
      await expect(
        selectRowByValues(asPage(page), 'myTable', { Name: 'Alice' }),
      ).resolves.toBeUndefined();
    });

    it('throws ControlError when no matching row found', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, RESPONSIVE_DETECT, ['Name', 'Status'], -1]);

      const error = await selectRowByValues(asPage(page), 'myTable', { Name: 'Ghost' }).catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('No row matching criteria');
    });
  });

  // -- ensureRowVisible -----------------------------------------------------

  describe('ensureRowVisible', () => {
    it('scrolls grid table to the specified row', async () => {
      const page = createMockPage([
        GRID_DETECT, // detectTableType
        true, // ensureRowVisibleScript
      ]);
      await expect(ensureRowVisible(asPage(page), 'gridTable', 50)).resolves.toBeUndefined();

      // Should call setFirstVisibleRow
      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('setFirstVisibleRow');
    });

    it('is a no-op for responsive table', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
      ]);
      await expect(ensureRowVisible(asPage(page), 'myTable', 10)).resolves.toBeUndefined();

      // Only one evaluate call (detectTableType), no scroll script
      expect(page.evaluate).toHaveBeenCalledTimes(1);
    });
  });

  // -- setTableCellValue ----------------------------------------------------

  describe('setTableCellValue', () => {
    it('sets value on a cell', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        true, // setCellValueScript
      ]);
      await expect(
        setTableCellValue(asPage(page), 'myTable', 0, 1, 'New Value'),
      ).resolves.toBeUndefined();

      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('setValue');
    });

    it('throws ControlError for invalid cell index', async () => {
      const page = createMockPage([RESPONSIVE_DETECT, false]);

      const error = await setTableCellValue(asPage(page), 'myTable', 99, 99, 'x').catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('Failed to set cell value');
    });
  });

  // -- getRowCount ----------------------------------------------------------

  describe('getRowCount', () => {
    it('returns count by delegating to getTableRowCount', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        42, // getTableRowCount result
      ]);
      const count = await getRowCount(asPage(page), 'myTable');

      expect(count).toBe(42);
    });
  });

  // -- filterByColumn -------------------------------------------------------

  describe('filterByColumn', () => {
    it('applies filter to column', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        true, // filterByColumnScript result
      ]);
      await expect(filterByColumn(asFSPage(page), 'myTable', 1, 'Active')).resolves.toBeUndefined();
    });

    it('passes custom operator to script', async () => {
      const page = createMockPage([
        GRID_DETECT, // detectTableType
        true, // filterByColumnScript result
      ]);
      await filterByColumn(asFSPage(page), 'gridTable', 0, 'Open', { operator: 'EQ' });

      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('"EQ"');
    });

    it('throws ControlError when column not found', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        false, // filterByColumnScript result
      ]);

      const error = await filterByColumn(asFSPage(page), 'myTable', 99, 'X').catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).message).toContain('Failed to filter column');
    });
  });

  // -- sortByColumn ---------------------------------------------------------

  describe('sortByColumn', () => {
    it('sorts ascending by default', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        true, // sortByColumnScript result
      ]);
      await expect(sortByColumn(asFSPage(page), 'myTable', 0)).resolves.toBeUndefined();
    });

    it('sorts descending when option is set', async () => {
      const page = createMockPage([
        GRID_DETECT, // detectTableType
        true, // sortByColumnScript result
      ]);
      await sortByColumn(asFSPage(page), 'gridTable', 0, { descending: true });

      const script = page.evaluate.mock.calls[1]?.[0] as string;
      expect(script).toContain('true');
    });

    it('throws ControlError when sort fails', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        false, // sortByColumnScript returns false
      ]);

      const error = await sortByColumn(asFSPage(page), 'myTable', 99).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).code).toBe('ERR_CONTROL_AGGREGATION');
      expect((error as ControlError).message).toContain(
        'Failed to sort column 99 in table myTable',
      );
      expect((error as ControlError).retryable).toBe(false);
    });
  });

  // -- getSortOrder ---------------------------------------------------------

  describe('getSortOrder', () => {
    it('returns sort info for sorted column', async () => {
      const sortInfo = { columnIndex: 0, columnName: 'Name', descending: false };
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        sortInfo, // getSortOrderScript result
      ]);
      const result = await getSortOrder(asFSPage(page), 'myTable', 0);

      expect(result).toEqual(sortInfo);
    });

    it('returns null for unsorted column', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        null, // getSortOrderScript result
      ]);
      const result = await getSortOrder(asFSPage(page), 'myTable', 0);

      expect(result).toBeNull();
    });
  });

  // -- getFilterValue -------------------------------------------------------

  describe('getFilterValue', () => {
    it('returns filter string for filtered column', async () => {
      const page = createMockPage([
        GRID_DETECT, // detectTableType
        'Active', // getFilterValueScript result
      ]);
      const result = await getFilterValue(asFSPage(page), 'gridTable', 0);

      expect(result).toBe('Active');
    });

    it('returns null for unfiltered column', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        null, // getFilterValueScript result
      ]);
      const result = await getFilterValue(asFSPage(page), 'myTable', 0);

      expect(result).toBeNull();
    });
  });

  // -- exportTableData ------------------------------------------------------

  describe('exportTableData', () => {
    it('returns row objects keyed by column headers', async () => {
      const rows = [
        { Name: 'Alice', Status: 'Active' },
        { Name: 'Bob', Status: 'Inactive' },
      ];
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        ['Name', 'Status'], // column names evaluate
        rows, // exportTableDataScript result
      ]);
      const result = await exportTableData(asFSPage(page), 'myTable');

      expect(result).toEqual(rows);
    });
  });

  // -- clickTableSettingsButton ---------------------------------------------

  describe('clickTableSettingsButton', () => {
    it('clicks settings button in toolbar', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        true, // clickTableSettingsButtonScript result
      ]);
      await expect(clickTableSettingsButton(asFSPage(page), 'myTable')).resolves.toBeUndefined();
    });

    it('throws ControlError when settings button is not found', async () => {
      const page = createMockPage([
        RESPONSIVE_DETECT, // detectTableType
        false, // clickTableSettingsButtonScript returns false
      ]);

      const error = await clickTableSettingsButton(asFSPage(page), 'myTable').catch(
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(ControlError);
      expect((error as ControlError).code).toBe('ERR_CONTROL_NOT_FOUND');
      expect((error as ControlError).message).toContain(
        'Settings button not found in table toolbar: myTable',
      );
      expect((error as ControlError).retryable).toBe(true);
    });
  });
});
