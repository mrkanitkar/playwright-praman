/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/module-fixtures.ts` — Module Playwright fixtures.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test` and module dependencies.
 * Fixture definitions are captured via `createMockTestExtend()` and executed
 * directly to verify behavior without requiring a Playwright test runner.
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockTestExtend,
  createMockExpectExtend,
} from '../../helpers/mock-playwright-test.js';

import type { PramanConfig } from '#core/config/schema.js';
import { PramanConfigSchema } from '#core/config/schema.js';

// ── Test-local type for the extended UI5 fixture result ──────────────
/** Shape of the extended UI5Handler with sub-namespaces returned by the ui5 fixture. */
interface TestExtendedUI5Handler {
  readonly table: {
    readonly detectType: (...args: unknown[]) => Promise<unknown>;
    readonly getRows: (...args: unknown[]) => Promise<unknown>;
    readonly getRowCount: (...args: unknown[]) => Promise<unknown>;
    readonly getCellValue: (...args: unknown[]) => Promise<unknown>;
    readonly getData: (...args: unknown[]) => Promise<unknown>;
    readonly selectRow: (...args: unknown[]) => Promise<unknown>;
    readonly selectAll: (...args: unknown[]) => Promise<unknown>;
    readonly deselectAll: (...args: unknown[]) => Promise<unknown>;
    readonly waitForData: (...args: unknown[]) => Promise<unknown>;
    readonly getSelectedRows: (...args: unknown[]) => Promise<unknown>;
    readonly getColumnNames: (...args: unknown[]) => Promise<unknown>;
    readonly findRowByValues: (...args: unknown[]) => Promise<unknown>;
    readonly getCellByColumnName: (...args: unknown[]) => Promise<unknown>;
    readonly clickRow: (...args: unknown[]) => Promise<unknown>;
    readonly selectRowByValues: (...args: unknown[]) => Promise<unknown>;
    readonly ensureRowVisible: (...args: unknown[]) => Promise<unknown>;
    readonly setTableCellValue: (...args: unknown[]) => Promise<unknown>;
    readonly getRowCountAlt: (...args: unknown[]) => Promise<unknown>;
    readonly filterByColumn: (...args: unknown[]) => Promise<unknown>;
    readonly sortByColumn: (...args: unknown[]) => Promise<unknown>;
    readonly getSortOrder: (...args: unknown[]) => Promise<unknown>;
    readonly getFilterValue: (...args: unknown[]) => Promise<unknown>;
    readonly exportData: (...args: unknown[]) => Promise<unknown>;
    readonly clickSettings: (...args: unknown[]) => Promise<unknown>;
    readonly [key: string]: (...args: unknown[]) => Promise<unknown>;
  };
  readonly dialog: {
    readonly waitFor: (...args: unknown[]) => Promise<unknown>;
    readonly confirm: (...args: unknown[]) => Promise<unknown>;
    readonly dismiss: (...args: unknown[]) => Promise<unknown>;
    readonly getOpen: (...args: unknown[]) => Promise<unknown>;
    readonly isOpen: (...args: unknown[]) => Promise<unknown>;
    readonly waitForClosed: (...args: unknown[]) => Promise<unknown>;
    readonly getButtons: (...args: unknown[]) => Promise<unknown>;
    readonly [key: string]: (...args: unknown[]) => Promise<unknown>;
  };
  readonly date: {
    readonly setDatePicker: (...args: unknown[]) => Promise<unknown>;
    readonly getDatePicker: (...args: unknown[]) => Promise<unknown>;
    readonly setDateRange: (...args: unknown[]) => Promise<unknown>;
    readonly getDateRange: (...args: unknown[]) => Promise<unknown>;
    readonly setTimePicker: (...args: unknown[]) => Promise<unknown>;
    readonly getTimePicker: (...args: unknown[]) => Promise<unknown>;
    readonly setAndValidate: (...args: unknown[]) => Promise<unknown>;
    readonly [key: string]: (...args: unknown[]) => Promise<unknown>;
  };
  readonly odata: {
    readonly getModelData: (...args: unknown[]) => Promise<unknown>;
    readonly getModelProperty: (...args: unknown[]) => Promise<unknown>;
    readonly waitForLoad: (...args: unknown[]) => Promise<unknown>;
    readonly fetchCSRFToken: (...args: unknown[]) => Promise<unknown>;
    readonly getEntityCount: (...args: unknown[]) => Promise<unknown>;
    readonly hasPendingChanges: (...args: unknown[]) => Promise<unknown>;
    readonly createEntity: (...args: unknown[]) => Promise<unknown>;
    readonly updateEntity: (...args: unknown[]) => Promise<unknown>;
    readonly deleteEntity: (...args: unknown[]) => Promise<unknown>;
    readonly queryEntities: (...args: unknown[]) => Promise<unknown>;
    readonly callFunctionImport: (...args: unknown[]) => Promise<unknown>;
    readonly [key: string]: (...args: unknown[]) => Promise<unknown>;
  };
}

// ── Mock table module ────────────────────────────────────────────────
const mockGetTableRows = vi.fn().mockResolvedValue([]);
const mockGetTableRowCount = vi.fn().mockResolvedValue(0);
const mockGetTableCellValue = vi.fn().mockResolvedValue('');
const mockGetTableData = vi.fn().mockResolvedValue([]);
const mockSelectTableRow = vi.fn().mockResolvedValue(undefined);
const mockSelectAllTableRows = vi.fn().mockResolvedValue(undefined);
const mockDeselectAllTableRows = vi.fn().mockResolvedValue(undefined);
const mockWaitForTableData = vi.fn().mockResolvedValue(undefined);
const mockGetSelectedRows = vi.fn().mockResolvedValue([]);
const mockDetectTableType = vi.fn().mockResolvedValue('responsive');

vi.mock('../../../src/modules/table.js', () => ({
  getTableRows: mockGetTableRows,
  getTableRowCount: mockGetTableRowCount,
  getTableCellValue: mockGetTableCellValue,
  getTableData: mockGetTableData,
  selectTableRow: mockSelectTableRow,
  selectAllTableRows: mockSelectAllTableRows,
  deselectAllTableRows: mockDeselectAllTableRows,
  waitForTableData: mockWaitForTableData,
  getSelectedRows: mockGetSelectedRows,
  detectTableType: mockDetectTableType,
}));

// ── Mock table-operations module ─────────────────────────────────────
const mockGetColumnNames = vi.fn().mockResolvedValue([]);
const mockFindRowByValues = vi.fn().mockResolvedValue(0);
const mockGetCellByColumnName = vi.fn().mockResolvedValue('');
const mockClickRow = vi.fn().mockResolvedValue(undefined);
const mockSelectRowByValues = vi.fn().mockResolvedValue(undefined);
const mockEnsureRowVisible = vi.fn().mockResolvedValue(undefined);
const mockSetTableCellValue = vi.fn().mockResolvedValue(undefined);
const mockGetRowCount = vi.fn().mockResolvedValue(0);

vi.mock('../../../src/modules/table-operations.js', () => ({
  getColumnNames: mockGetColumnNames,
  findRowByValues: mockFindRowByValues,
  getCellByColumnName: mockGetCellByColumnName,
  clickRow: mockClickRow,
  selectRowByValues: mockSelectRowByValues,
  ensureRowVisible: mockEnsureRowVisible,
  setTableCellValue: mockSetTableCellValue,
  getRowCount: mockGetRowCount,
}));

// ── Mock table-filter-sort module ────────────────────────────────────
const mockFilterByColumn = vi.fn().mockResolvedValue(undefined);
const mockSortByColumn = vi.fn().mockResolvedValue(undefined);
const mockGetSortOrder = vi.fn().mockResolvedValue('ascending');
const mockGetFilterValue = vi.fn().mockResolvedValue('');
const mockExportTableData = vi.fn().mockResolvedValue(undefined);
const mockClickTableSettingsButton = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/modules/table-filter-sort.js', () => ({
  filterByColumn: mockFilterByColumn,
  sortByColumn: mockSortByColumn,
  getSortOrder: mockGetSortOrder,
  getFilterValue: mockGetFilterValue,
  exportTableData: mockExportTableData,
  clickTableSettingsButton: mockClickTableSettingsButton,
}));

// ── Mock dialog module ───────────────────────────────────────────────
const mockWaitForDialog = vi.fn().mockResolvedValue(undefined);
const mockGetOpenDialogs = vi.fn().mockResolvedValue([]);
const mockIsDialogOpen = vi.fn().mockResolvedValue(false);
const mockDismissDialog = vi.fn().mockResolvedValue(undefined);
const mockConfirmDialog = vi.fn().mockResolvedValue(undefined);
const mockWaitForDialogClosed = vi.fn().mockResolvedValue(undefined);
const mockGetDialogButtons = vi.fn().mockResolvedValue([]);

vi.mock('../../../src/modules/dialog.js', () => ({
  waitForDialog: mockWaitForDialog,
  getOpenDialogs: mockGetOpenDialogs,
  isDialogOpen: mockIsDialogOpen,
  dismissDialog: mockDismissDialog,
  confirmDialog: mockConfirmDialog,
  waitForDialogClosed: mockWaitForDialogClosed,
  getDialogButtons: mockGetDialogButtons,
}));

// ── Mock date module ─────────────────────────────────────────────────
const mockSetDatePickerValue = vi.fn().mockResolvedValue(undefined);
const mockGetDatePickerValue = vi.fn().mockResolvedValue('2024-01-15');
const mockSetDateRangeSelection = vi.fn().mockResolvedValue(undefined);
const mockGetDateRangeSelection = vi.fn().mockResolvedValue({ start: '', end: '' });
const mockSetTimePickerValue = vi.fn().mockResolvedValue(undefined);
const mockGetTimePickerValue = vi.fn().mockResolvedValue('10:30');
const mockSetAndValidateDate = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/modules/date.js', () => ({
  setDatePickerValue: mockSetDatePickerValue,
  getDatePickerValue: mockGetDatePickerValue,
  setDateRangeSelection: mockSetDateRangeSelection,
  getDateRangeSelection: mockGetDateRangeSelection,
  setTimePickerValue: mockSetTimePickerValue,
  getTimePickerValue: mockGetTimePickerValue,
  setAndValidateDate: mockSetAndValidateDate,
}));

// ── Mock odata module ────────────────────────────────────────────────
const mockGetModelData = vi.fn().mockResolvedValue({});
const mockGetModelProperty = vi.fn().mockResolvedValue(null);
const mockWaitForODataLoad = vi.fn().mockResolvedValue(undefined);
const mockFetchCSRFToken = vi.fn().mockResolvedValue('token-123');
const mockGetEntityCount = vi.fn().mockResolvedValue(0);
const mockHasPendingChanges = vi.fn().mockResolvedValue(false);

vi.mock('../../../src/modules/odata.js', () => ({
  getModelData: mockGetModelData,
  getModelProperty: mockGetModelProperty,
  waitForODataLoad: mockWaitForODataLoad,
  fetchCSRFToken: mockFetchCSRFToken,
  getEntityCount: mockGetEntityCount,
  hasPendingChanges: mockHasPendingChanges,
}));

// ── Mock odata-http module ───────────────────────────────────────────
const mockCreateEntity = vi.fn().mockResolvedValue({ id: '1' });
const mockUpdateEntity = vi.fn().mockResolvedValue(undefined);
const mockDeleteEntity = vi.fn().mockResolvedValue(undefined);
const mockQueryEntities = vi.fn().mockResolvedValue([]);
const mockCallFunctionImport = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/modules/odata-http.js', () => ({
  createEntity: mockCreateEntity,
  updateEntity: mockUpdateEntity,
  deleteEntity: mockDeleteEntity,
  queryEntities: mockQueryEntities,
  callFunctionImport: mockCallFunctionImport,
}));

// ── Mock UI5Handler ──────────────────────────────────────────────────
const mockUI5HandlerInstance = {
  control: vi.fn(),
  controls: vi.fn(),
  click: vi.fn(),
  fill: vi.fn(),
  press: vi.fn(),
  select: vi.fn(),
  check: vi.fn(),
  uncheck: vi.fn(),
  clear: vi.fn(),
  getText: vi.fn(),
  getValue: vi.fn(),
  waitForUI5: vi.fn(),
  waitFor: vi.fn(),
  clearCache: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('../../../src/fixtures/ui5-handler.js', () => ({
  UI5Handler: vi.fn().mockImplementation(function mockUI5Handler(this: Record<string, unknown>) {
    Object.assign(this, mockUI5HandlerInstance);
  }),
}));

// ── Mock logging ─────────────────────────────────────────────────────
const mockChildLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(),
  level: 'info',
};
const mockCreateLogger = vi.fn().mockReturnValue(mockChildLogger);

vi.mock('#core/logging/index.js', () => ({
  createLogger: mockCreateLogger,
}));

// ── Mock bridge injection ────────────────────────────────────────────
const mockResetPageInjection = vi.fn();

vi.mock('#bridge/injection.js', () => ({
  resetPageInjection: mockResetPageInjection,
}));

// ── Mock interaction strategy factory ────────────────────────────────
const mockStrategy = { name: 'opa5', press: vi.fn(), enterText: vi.fn(), select: vi.fn() };
const mockCreateInteractionStrategy = vi.fn().mockReturnValue(mockStrategy);

vi.mock('#bridge/interaction-strategies/strategy-factory.js', () => ({
  createInteractionStrategy: mockCreateInteractionStrategy,
}));

// ── Mock core-fixtures (coreTest) ────────────────────────────────────
const mockCoreTestExtend = createMockTestExtend();

vi.mock('../../../src/fixtures/core-fixtures.js', () => ({
  coreTest: {
    extend: mockCoreTestExtend,
  },
}));

// ── Mock Playwright ──────────────────────────────────────────────────
const mockTestExtend = createMockTestExtend();
const mockExpectExtend = createMockExpectExtend();

vi.mock('@playwright/test', () => ({
  test: {
    extend: mockTestExtend,
    step: vi.fn().mockImplementation(async (_title: string, fn: () => Promise<unknown>) => fn()),
  },
  expect: {
    extend: mockExpectExtend,
  },
}));

// ── Mock Playwright page ─────────────────────────────────────────────
const mockPage = {
  evaluate: vi.fn().mockResolvedValue(undefined),
  waitForFunction: vi.fn().mockResolvedValue(undefined),
  locator: vi.fn().mockReturnValue({
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    isVisible: vi.fn().mockResolvedValue(true),
  }),
  on: vi.fn(),
  off: vi.fn(),
  mainFrame: vi.fn(),
};

// ── Mock config ──────────────────────────────────────────────────────
const mockConfig: Readonly<PramanConfig> = Object.freeze(
  PramanConfigSchema.parse({ logLevel: 'info' }),
);

// ── Import after mocks ──────────────────────────────────────────────
const { moduleTest, withStability } = await import('#fixtures/module-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures.ui5);
 * ```
 */
function extractFixtureFn(
  definition: unknown,
): (
  deps: Record<string, unknown>,
  use: (value: TestExtendedUI5Handler) => Promise<void>,
) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (
      deps: Record<string, unknown>,
      use: (value: TestExtendedUI5Handler) => Promise<void>,
    ) => Promise<void>;
  }
  return definition as (
    deps: Record<string, unknown>,
    use: (value: TestExtendedUI5Handler) => Promise<void>,
  ) => Promise<void>;
}

/**
 * Simulates Playwright's `use()` callback for fixture testing.
 *
 * @param fn - The fixture function to execute
 * @param deps - Dependencies to pass as the first argument
 * @returns The value passed to `use()`
 *
 * @example
 * ```typescript
 * const ui5 = await runFixture(fixtureFn, { page: mockPage, pramanConfig: mockConfig });
 * ```
 */
async function runFixture(
  fn: (
    deps: Record<string, unknown>,
    use: (value: TestExtendedUI5Handler) => Promise<void>,
  ) => Promise<void>,
  deps: Record<string, unknown>,
): Promise<TestExtendedUI5Handler> {
  let captured: TestExtendedUI5Handler | undefined;
  const useFn = async (value: TestExtendedUI5Handler): Promise<void> => {
    captured = value;
    await Promise.resolve();
  };
  await fn(deps, useFn);
  if (captured === undefined) {
    throw new Error('Fixture did not call use()');
  }
  return captured;
}

// ── Fixture definitions reference ────────────────────────────────────
const fixtures = (moduleTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Reset helper ─────────────────────────────────────────────────────

/**
 * Resets all mock defaults between tests.
 *
 * @example
 * ```typescript
 * beforeEach(() => { resetAllMockDefaults(); });
 * ```
 */
function resetAllMockDefaults(): void {
  vi.clearAllMocks();
  mockGetTableRows.mockResolvedValue([]);
  mockClickRow.mockResolvedValue(undefined);
  mockFindRowByValues.mockResolvedValue(0);
  mockWaitForDialog.mockResolvedValue(undefined);
  mockConfirmDialog.mockResolvedValue(undefined);
  mockSetDatePickerValue.mockResolvedValue(undefined);
  mockGetDatePickerValue.mockResolvedValue('2024-01-15');
  mockGetModelData.mockResolvedValue({});
  mockCreateEntity.mockResolvedValue({ id: '1' });
  mockCreateLogger.mockReturnValue(mockChildLogger);
  mockCreateInteractionStrategy.mockReturnValue(mockStrategy);
  mockResetPageInjection.mockReturnValue(undefined);
}

// ── Tests ────────────────────────────────────────────────────────────

describe('module-fixtures fixture definitions', () => {
  beforeEach(() => {
    resetAllMockDefaults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ui5 fixture sub-namespaces', () => {
    it('provides table, dialog, date, odata sub-namespaces', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(ui5).toBeDefined();
      expect(ui5.table).toBeDefined();
      expect(ui5.dialog).toBeDefined();
      expect(ui5.date).toBeDefined();
      expect(ui5.odata).toBeDefined();
    });

    it('table namespace has expected methods', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(typeof ui5.table.getRows).toBe('function');
      expect(typeof ui5.table.clickRow).toBe('function');
      expect(typeof ui5.table.findRowByValues).toBe('function');
      expect(typeof ui5.table.getColumnNames).toBe('function');
      expect(typeof ui5.table.filterByColumn).toBe('function');
      expect(typeof ui5.table.sortByColumn).toBe('function');
    });

    it('dialog namespace has expected methods', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(typeof ui5.dialog.waitFor).toBe('function');
      expect(typeof ui5.dialog.confirm).toBe('function');
      expect(typeof ui5.dialog.dismiss).toBe('function');
      expect(typeof ui5.dialog.getOpen).toBe('function');
      expect(typeof ui5.dialog.isOpen).toBe('function');
    });

    it('date namespace has expected methods', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(typeof ui5.date.setDatePicker).toBe('function');
      expect(typeof ui5.date.getDatePicker).toBe('function');
      expect(typeof ui5.date.setDateRange).toBe('function');
      expect(typeof ui5.date.getDateRange).toBe('function');
      expect(typeof ui5.date.setTimePicker).toBe('function');
      expect(typeof ui5.date.getTimePicker).toBe('function');
    });

    it('odata namespace has expected methods', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(typeof ui5.odata.getModelData).toBe('function');
      expect(typeof ui5.odata.createEntity).toBe('function');
      expect(typeof ui5.odata.updateEntity).toBe('function');
      expect(typeof ui5.odata.deleteEntity).toBe('function');
      expect(typeof ui5.odata.queryEntities).toBe('function');
      expect(typeof ui5.odata.fetchCSRFToken).toBe('function');
    });
  });

  describe('table delegation', () => {
    it('getRows delegates to getTableRows with page and tableId', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.getRows('myTable', { timeout: 5000 });

      expect(mockGetTableRows).toHaveBeenCalledOnce();
      expect(mockGetTableRows).toHaveBeenCalledWith(mockPage, 'myTable', { timeout: 5000 });
    });

    it('clickRow delegates to clickRow with page, tableId, and row', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.clickRow('ordersTable', 2);

      expect(mockClickRow).toHaveBeenCalledOnce();
      expect(mockClickRow).toHaveBeenCalledWith(mockPage, 'ordersTable', 2);
    });

    it('findRowByValues delegates to findRowByValues with page, tableId, and values', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const values = { Name: 'Widget', Status: 'Active' };
      await ui5.table.findRowByValues('productsTable', values);

      expect(mockFindRowByValues).toHaveBeenCalledOnce();
      expect(mockFindRowByValues).toHaveBeenCalledWith(mockPage, 'productsTable', values);
    });

    it('detectType delegates to detectTableType with page and tableId', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.table.detectType('myTable');

      expect(result).toBe('responsive');
      expect(mockDetectTableType).toHaveBeenCalledOnce();
      expect(mockDetectTableType).toHaveBeenCalledWith(mockPage, 'myTable');
    });

    it('getRowCount delegates to getTableRowCount with page, tableId, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.table.getRowCount('myTable');

      expect(result).toBe(0);
      expect(mockGetTableRowCount).toHaveBeenCalledOnce();
      expect(mockGetTableRowCount).toHaveBeenCalledWith(mockPage, 'myTable', undefined);
    });

    it('getCellValue delegates to getTableCellValue with page, tableId, row, col, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.table.getCellValue('myTable', 1, 2);

      expect(result).toBe('');
      expect(mockGetTableCellValue).toHaveBeenCalledOnce();
      expect(mockGetTableCellValue).toHaveBeenCalledWith(mockPage, 'myTable', 1, 2, undefined);
    });

    it('getData delegates to getTableData with page, tableId, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.table.getData('myTable');

      expect(result).toEqual([]);
      expect(mockGetTableData).toHaveBeenCalledOnce();
      expect(mockGetTableData).toHaveBeenCalledWith(mockPage, 'myTable', undefined);
    });

    it('selectRow delegates to selectTableRow with page, tableId, row, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.selectRow('myTable', 3);

      expect(mockSelectTableRow).toHaveBeenCalledOnce();
      expect(mockSelectTableRow).toHaveBeenCalledWith(mockPage, 'myTable', 3, undefined);
    });

    it('selectAll delegates to selectAllTableRows with page, tableId, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.selectAll('myTable');

      expect(mockSelectAllTableRows).toHaveBeenCalledOnce();
      expect(mockSelectAllTableRows).toHaveBeenCalledWith(mockPage, 'myTable', undefined);
    });

    it('deselectAll delegates to deselectAllTableRows with page, tableId, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.deselectAll('myTable');

      expect(mockDeselectAllTableRows).toHaveBeenCalledOnce();
      expect(mockDeselectAllTableRows).toHaveBeenCalledWith(mockPage, 'myTable', undefined);
    });

    it('waitForData delegates to waitForTableData with page, tableId, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.waitForData('myTable');

      expect(mockWaitForTableData).toHaveBeenCalledOnce();
      expect(mockWaitForTableData).toHaveBeenCalledWith(mockPage, 'myTable', undefined);
    });

    it('getSelectedRows delegates to getSelectedRows with page, tableId, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.table.getSelectedRows('myTable');

      expect(result).toEqual([]);
      expect(mockGetSelectedRows).toHaveBeenCalledOnce();
      expect(mockGetSelectedRows).toHaveBeenCalledWith(mockPage, 'myTable', undefined);
    });

    it('getColumnNames delegates to getColumnNames with page and tableId', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.table.getColumnNames('myTable');

      expect(result).toEqual([]);
      expect(mockGetColumnNames).toHaveBeenCalledOnce();
      expect(mockGetColumnNames).toHaveBeenCalledWith(mockPage, 'myTable');
    });

    it('getCellByColumnName delegates with page, tableId, row, colName, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.table.getCellByColumnName('myTable', 0, 'Name');

      expect(result).toBe('');
      expect(mockGetCellByColumnName).toHaveBeenCalledOnce();
      expect(mockGetCellByColumnName).toHaveBeenCalledWith(
        mockPage,
        'myTable',
        0,
        'Name',
        undefined,
      );
    });

    it('selectRowByValues delegates with page, tableId, values, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const values = { Status: 'Active' };
      await ui5.table.selectRowByValues('myTable', values);

      expect(mockSelectRowByValues).toHaveBeenCalledOnce();
      expect(mockSelectRowByValues).toHaveBeenCalledWith(mockPage, 'myTable', values, undefined);
    });

    it('ensureRowVisible delegates with page, tableId, and row', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.ensureRowVisible('myTable', 5);

      expect(mockEnsureRowVisible).toHaveBeenCalledOnce();
      expect(mockEnsureRowVisible).toHaveBeenCalledWith(mockPage, 'myTable', 5);
    });

    it('setTableCellValue delegates with page, tableId, row, col, and value', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.setTableCellValue('myTable', 1, 2, 'newValue');

      expect(mockSetTableCellValue).toHaveBeenCalledOnce();
      expect(mockSetTableCellValue).toHaveBeenCalledWith(mockPage, 'myTable', 1, 2, 'newValue');
    });

    it('getRowCountAlt delegates to getRowCount with page, tableId, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.table.getRowCountAlt('myTable');

      expect(result).toBe(0);
      expect(mockGetRowCount).toHaveBeenCalledOnce();
      expect(mockGetRowCount).toHaveBeenCalledWith(mockPage, 'myTable', undefined);
    });

    it('filterByColumn delegates with page, tableId, col, value, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.filterByColumn('myTable', 1, 'Active');

      expect(mockFilterByColumn).toHaveBeenCalledOnce();
      expect(mockFilterByColumn).toHaveBeenCalledWith(mockPage, 'myTable', 1, 'Active', undefined);
    });

    it('sortByColumn delegates with page, tableId, col, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.sortByColumn('myTable', 0);

      expect(mockSortByColumn).toHaveBeenCalledOnce();
      expect(mockSortByColumn).toHaveBeenCalledWith(mockPage, 'myTable', 0, undefined);
    });

    it('getSortOrder delegates with page, tableId, and col', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.table.getSortOrder('myTable', 0);

      expect(result).toBe('ascending');
      expect(mockGetSortOrder).toHaveBeenCalledOnce();
      expect(mockGetSortOrder).toHaveBeenCalledWith(mockPage, 'myTable', 0);
    });

    it('getFilterValue delegates with page, tableId, and col', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.table.getFilterValue('myTable', 2);

      expect(result).toBe('');
      expect(mockGetFilterValue).toHaveBeenCalledOnce();
      expect(mockGetFilterValue).toHaveBeenCalledWith(mockPage, 'myTable', 2);
    });

    it('exportData delegates to exportTableData with page, tableId, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.exportData('myTable');

      expect(mockExportTableData).toHaveBeenCalledOnce();
      expect(mockExportTableData).toHaveBeenCalledWith(mockPage, 'myTable', undefined);
    });

    it('clickSettings delegates to clickTableSettingsButton with page, tableId, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.clickSettings('myTable');

      expect(mockClickTableSettingsButton).toHaveBeenCalledOnce();
      expect(mockClickTableSettingsButton).toHaveBeenCalledWith(mockPage, 'myTable', undefined);
    });
  });

  describe('dialog delegation', () => {
    it('waitFor delegates to waitForDialog with page and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.dialog.waitFor({ title: 'Confirm' });

      expect(mockWaitForDialog).toHaveBeenCalledOnce();
      expect(mockWaitForDialog).toHaveBeenCalledWith(mockPage, { title: 'Confirm' });
    });

    it('confirm delegates to confirmDialog with page and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.dialog.confirm();

      expect(mockConfirmDialog).toHaveBeenCalledOnce();
      expect(mockConfirmDialog).toHaveBeenCalledWith(mockPage, undefined);
    });

    it('getOpen delegates to getOpenDialogs with page', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.dialog.getOpen();

      expect(result).toEqual([]);
      expect(mockGetOpenDialogs).toHaveBeenCalledOnce();
      expect(mockGetOpenDialogs).toHaveBeenCalledWith(mockPage);
    });

    it('isOpen delegates to isDialogOpen with page and dialogId', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.dialog.isOpen('confirmDialog');

      expect(result).toBe(false);
      expect(mockIsDialogOpen).toHaveBeenCalledOnce();
      expect(mockIsDialogOpen).toHaveBeenCalledWith(mockPage, 'confirmDialog');
    });

    it('dismiss delegates to dismissDialog with page and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.dialog.dismiss({ title: 'Warning' });

      expect(mockDismissDialog).toHaveBeenCalledOnce();
      expect(mockDismissDialog).toHaveBeenCalledWith(mockPage, { title: 'Warning' });
    });

    it('waitForClosed delegates to waitForDialogClosed with page, dialogId, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.dialog.waitForClosed('confirmDialog', { timeout: 3000 });

      expect(mockWaitForDialogClosed).toHaveBeenCalledOnce();
      expect(mockWaitForDialogClosed).toHaveBeenCalledWith(mockPage, 'confirmDialog', {
        timeout: 3000,
      });
    });

    it('getButtons delegates to getDialogButtons with page and dialogId', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.dialog.getButtons('confirmDialog');

      expect(result).toEqual([]);
      expect(mockGetDialogButtons).toHaveBeenCalledOnce();
      expect(mockGetDialogButtons).toHaveBeenCalledWith(mockPage, 'confirmDialog');
    });
  });

  describe('date delegation', () => {
    it('setDatePicker delegates to setDatePickerValue with page, controlId, date, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.date.setDatePicker('dp1', '2024-06-15', { format: 'yyyy-MM-dd' });

      expect(mockSetDatePickerValue).toHaveBeenCalledOnce();
      expect(mockSetDatePickerValue).toHaveBeenCalledWith(mockPage, 'dp1', '2024-06-15', {
        format: 'yyyy-MM-dd',
      });
    });

    it('getDatePicker delegates to getDatePickerValue with page and controlId', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const value = await ui5.date.getDatePicker('dp1');

      expect(value).toBe('2024-01-15');
      expect(mockGetDatePickerValue).toHaveBeenCalledOnce();
      expect(mockGetDatePickerValue).toHaveBeenCalledWith(mockPage, 'dp1');
    });

    it('setDateRange delegates to setDateRangeSelection with page, controlId, start, end, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.date.setDateRange('dr1', '2024-01-01', '2024-01-31');

      expect(mockSetDateRangeSelection).toHaveBeenCalledOnce();
      expect(mockSetDateRangeSelection).toHaveBeenCalledWith(
        mockPage,
        'dr1',
        '2024-01-01',
        '2024-01-31',
        undefined,
      );
    });

    it('getDateRange delegates to getDateRangeSelection with page and controlId', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.date.getDateRange('dr1');

      expect(result).toEqual({ start: '', end: '' });
      expect(mockGetDateRangeSelection).toHaveBeenCalledOnce();
      expect(mockGetDateRangeSelection).toHaveBeenCalledWith(mockPage, 'dr1');
    });

    it('setTimePicker delegates to setTimePickerValue with page, controlId, time, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.date.setTimePicker('tp1', '14:30');

      expect(mockSetTimePickerValue).toHaveBeenCalledOnce();
      expect(mockSetTimePickerValue).toHaveBeenCalledWith(mockPage, 'tp1', '14:30', undefined);
    });

    it('getTimePicker delegates to getTimePickerValue with page and controlId', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.date.getTimePicker('tp1');

      expect(result).toBe('10:30');
      expect(mockGetTimePickerValue).toHaveBeenCalledOnce();
      expect(mockGetTimePickerValue).toHaveBeenCalledWith(mockPage, 'tp1');
    });

    it('setAndValidate delegates to setAndValidateDate with page, controlId, date, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.date.setAndValidate('dp1', '2024-03-15');

      expect(mockSetAndValidateDate).toHaveBeenCalledOnce();
      expect(mockSetAndValidateDate).toHaveBeenCalledWith(mockPage, 'dp1', '2024-03-15', undefined);
    });
  });

  describe('odata delegation', () => {
    it('getModelData delegates to getModelData with page, path, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.odata.getModelData('/Products', { modelName: 'main' });

      expect(mockGetModelData).toHaveBeenCalledOnce();
      expect(mockGetModelData).toHaveBeenCalledWith(mockPage, '/Products', { modelName: 'main' });
    });

    it('createEntity delegates to createEntity with page, serviceUrl, entitySet, data, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const entityData = { Name: 'Test', Price: 100 };
      await ui5.odata.createEntity('/sap/opu/odata/svc', 'Products', entityData);

      expect(mockCreateEntity).toHaveBeenCalledOnce();
      expect(mockCreateEntity).toHaveBeenCalledWith(
        mockPage,
        '/sap/opu/odata/svc',
        'Products',
        entityData,
        undefined,
      );
    });

    it('getModelProperty delegates to getModelProperty with page, path, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.odata.getModelProperty('/Products(1)/Name');

      expect(result).toBeNull();
      expect(mockGetModelProperty).toHaveBeenCalledOnce();
      expect(mockGetModelProperty).toHaveBeenCalledWith(mockPage, '/Products(1)/Name', undefined);
    });

    it('waitForLoad delegates to waitForODataLoad with page and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.odata.waitForLoad();

      expect(mockWaitForODataLoad).toHaveBeenCalledOnce();
      expect(mockWaitForODataLoad).toHaveBeenCalledWith(mockPage, undefined);
    });

    it('fetchCSRFToken delegates to fetchCSRFToken with page and serviceUrl', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.odata.fetchCSRFToken('/sap/opu/odata/svc');

      expect(result).toBe('token-123');
      expect(mockFetchCSRFToken).toHaveBeenCalledOnce();
      expect(mockFetchCSRFToken).toHaveBeenCalledWith(mockPage, '/sap/opu/odata/svc');
    });

    it('getEntityCount delegates to getEntityCount with page, path, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.odata.getEntityCount('/Products');

      expect(result).toBe(0);
      expect(mockGetEntityCount).toHaveBeenCalledOnce();
      expect(mockGetEntityCount).toHaveBeenCalledWith(mockPage, '/Products', undefined);
    });

    it('hasPendingChanges delegates to hasPendingChanges with page and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.odata.hasPendingChanges();

      expect(result).toBe(false);
      expect(mockHasPendingChanges).toHaveBeenCalledOnce();
      expect(mockHasPendingChanges).toHaveBeenCalledWith(mockPage, undefined);
    });

    it('updateEntity delegates to updateEntity with page, serviceUrl, entitySet, key, data, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const entityData = { Name: 'Updated' };
      await ui5.odata.updateEntity('/sap/opu/odata/svc', 'Products', '1', entityData);

      expect(mockUpdateEntity).toHaveBeenCalledOnce();
      expect(mockUpdateEntity).toHaveBeenCalledWith(
        mockPage,
        '/sap/opu/odata/svc',
        'Products',
        '1',
        entityData,
        undefined,
      );
    });

    it('deleteEntity delegates to deleteEntity with page, serviceUrl, entitySet, key, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.odata.deleteEntity('/sap/opu/odata/svc', 'Products', '1');

      expect(mockDeleteEntity).toHaveBeenCalledOnce();
      expect(mockDeleteEntity).toHaveBeenCalledWith(
        mockPage,
        '/sap/opu/odata/svc',
        'Products',
        '1',
        undefined,
      );
    });

    it('queryEntities delegates to queryEntities with page, serviceUrl, entitySet, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const result = await ui5.odata.queryEntities('/sap/opu/odata/svc', 'Products');

      expect(result).toEqual([]);
      expect(mockQueryEntities).toHaveBeenCalledOnce();
      expect(mockQueryEntities).toHaveBeenCalledWith(
        mockPage,
        '/sap/opu/odata/svc',
        'Products',
        undefined,
      );
    });

    it('callFunctionImport delegates to callFunctionImport with page, serviceUrl, fn, params, method, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const params = { ProductId: '1' };
      await ui5.odata.callFunctionImport('/sap/opu/odata/svc', 'ActivateProduct', params, 'POST');

      expect(mockCallFunctionImport).toHaveBeenCalledOnce();
      expect(mockCallFunctionImport).toHaveBeenCalledWith(
        mockPage,
        '/sap/opu/odata/svc',
        'ActivateProduct',
        params,
        'POST',
        undefined,
      );
    });
  });

  describe('fixture setup and teardown', () => {
    it('creates child logger with "bridge" module name', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(mockCreateLogger).toHaveBeenCalledWith('bridge', mockChildLogger);
    });

    it('attaches framenavigated listener on setup and removes on teardown', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);

      const useFn = async (value: TestExtendedUI5Handler): Promise<void> => {
        // Verify listener was attached before use() is called
        expect(mockPage.on).toHaveBeenCalledWith('framenavigated', expect.any(Function));
        expect(value).toBeDefined();
        await Promise.resolve();
      };

      // The fixture function calls use(), then runs teardown after use() resolves
      await fn({ page: mockPage, pramanConfig: mockConfig, rootLogger: mockChildLogger }, useFn);

      // After use() completes, teardown should have removed the listener
      expect(mockPage.off).toHaveBeenCalledWith('framenavigated', expect.any(Function));
    });

    it('navigationListener calls resetPageInjection when frame is mainFrame', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);

      const mainFrame = { name: 'main' };
      mockPage.mainFrame.mockReturnValue(mainFrame);

      let capturedListener: ((frame: unknown) => void) | undefined;
      mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
        if (event === 'framenavigated') {
          capturedListener = listener;
        }
      });

      await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(capturedListener).toBeDefined();
      if (capturedListener === undefined) {
        throw new Error('capturedListener was not set');
      }

      // Call with the mainFrame — should trigger resetPageInjection
      capturedListener(mainFrame);

      expect(mockResetPageInjection).toHaveBeenCalledOnce();
      expect(mockResetPageInjection).toHaveBeenCalledWith(mockPage);
    });

    it('navigationListener does NOT call resetPageInjection when frame is not mainFrame', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);

      const mainFrame = { name: 'main' };
      const childFrame = { name: 'child' };
      mockPage.mainFrame.mockReturnValue(mainFrame);

      let capturedListener: ((frame: unknown) => void) | undefined;
      mockPage.on.mockImplementation((event: string, listener: (frame: unknown) => void) => {
        if (event === 'framenavigated') {
          capturedListener = listener;
        }
      });

      await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(capturedListener).toBeDefined();
      if (capturedListener === undefined) {
        throw new Error('capturedListener was not set');
      }

      // Call with a child frame — should NOT trigger resetPageInjection
      capturedListener(childFrame);

      expect(mockResetPageInjection).not.toHaveBeenCalled();
    });

    it('teardown runs cleanup script and calls handler.destroy()', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);

      await fn(
        { page: mockPage, pramanConfig: mockConfig, rootLogger: mockChildLogger },
        async () => {
          await Promise.resolve();
        },
      );

      // Verify teardown called page.evaluate (cleanup script) and handler.destroy()
      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(mockUI5HandlerInstance.destroy).toHaveBeenCalledOnce();
    });

    it('teardown calls handler.destroy() even when cleanup script throws', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);

      // Make page.evaluate reject (simulates page navigated away)
      mockPage.evaluate.mockRejectedValueOnce(new Error('page closed'));

      await fn(
        { page: mockPage, pramanConfig: mockConfig, rootLogger: mockChildLogger },
        async () => {
          await Promise.resolve();
        },
      );

      // handler.destroy() must still be called even when cleanup script fails
      expect(mockUI5HandlerInstance.destroy).toHaveBeenCalledOnce();
    });

    it('teardown removes listener and destroys handler even when use() throws', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);

      await expect(
        fn({ page: mockPage, pramanConfig: mockConfig, rootLogger: mockChildLogger }, async () => {
          await Promise.reject(new Error('test error during use'));
        }),
      ).rejects.toThrow('test error during use');

      // Teardown must still run
      expect(mockPage.off).toHaveBeenCalledWith('framenavigated', expect.any(Function));
      expect(mockUI5HandlerInstance.destroy).toHaveBeenCalledOnce();
    });
  });

  describe('withStability', () => {
    it('wraps all methods with a stability guard', async () => {
      const guardCalls: number[] = [];
      const guard = async (): Promise<void> => {
        guardCalls.push(1);
        await Promise.resolve();
      };
      const obj = {
        doSomething: async (x: never): Promise<string> => {
          await Promise.resolve();
          return `result-${String(x)}`;
        },
      };

      const wrapped = withStability(obj, guard);
      const result = await wrapped.doSomething('test' as never);

      expect(guardCalls).toHaveLength(1);
      expect(result).toBe('result-test');
    });

    it('skips undefined values in the input object (noUncheckedIndexedAccess guard)', async () => {
      const guardCalls: number[] = [];
      const guard = async (): Promise<void> => {
        guardCalls.push(1);
        await Promise.resolve();
      };

      // Create an object that has an undefined value via Object.defineProperty
      // to exercise the `if (fn === undefined) continue;` branch
      const obj: Record<string, (...args: never[]) => Promise<unknown>> = {
        realMethod: async (): Promise<string> => {
          await Promise.resolve();
          return 'ok';
        },
      };
      // Manually set a key to undefined to trigger the guard
      Object.defineProperty(obj, 'ghostKey', {
        value: undefined,
        enumerable: true,
        configurable: true,
      });

      const wrapped = withStability(obj, guard);

      // The ghostKey should NOT exist on the wrapped object
      // because withStability skips undefined values
      expect(wrapped['realMethod']).toBeDefined();
      expect(wrapped['ghostKey']).toBeUndefined();

      // Call the real method to ensure it still works
      const realFn = wrapped['realMethod'];
      expect(realFn).toBeDefined();
      if (realFn === undefined) throw new Error('realMethod should be defined');
      const result = await realFn();
      expect(result).toBe('ok');
      expect(guardCalls).toHaveLength(1);
    });

    it('preserves method return values through the stability wrapper', async () => {
      const guard = async (): Promise<void> => {
        await Promise.resolve();
      };
      const obj = {
        getNumber: async (): Promise<number> => {
          await Promise.resolve();
          return 42;
        },
        getString: async (): Promise<string> => {
          await Promise.resolve();
          return 'hello';
        },
      };

      const wrapped = withStability(obj, guard);

      expect(await wrapped.getNumber()).toBe(42);
      expect(await wrapped.getString()).toBe('hello');
    });

    it('calls guard before each method invocation', async () => {
      const callOrder: string[] = [];
      const guard = async (): Promise<void> => {
        callOrder.push('guard');
        await Promise.resolve();
      };
      const obj = {
        alpha: async (): Promise<void> => {
          callOrder.push('alpha');
          await Promise.resolve();
        },
        beta: async (): Promise<void> => {
          callOrder.push('beta');
          await Promise.resolve();
        },
      };

      const wrapped = withStability(obj, guard);

      await wrapped.alpha();
      await wrapped.beta();

      expect(callOrder).toEqual(['guard', 'alpha', 'guard', 'beta']);
    });
  });
});
